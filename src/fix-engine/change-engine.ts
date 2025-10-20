/**
 * ChangeSet適用エンジン
 * 可逆性を保証し、apply/rollback/previewを提供
 */

import type {
  ReqID,
  Change,
  ChangeSet,
  Requirement,
  Diff,
  FixResult
} from './types.js';

export class ChangeEngine {
  /**
   * ChangeSetをプレビュー（適用せずに差分を表示）
   */
  preview(changeSet: ChangeSet, requirements: Record<ReqID, Requirement>): string {
    let preview = `# 変更プレビュー: ${changeSet.id}\n\n`;
    preview += `**対応違反**: ${changeSet.violations.join(', ')}\n`;
    preview += `**影響要求数**: ${changeSet.impacted.length}件\n`;
    preview += `**可逆性**: ${changeSet.reversible ? '✅' : '❌'}\n\n`;

    preview += `## 変更一覧 (${changeSet.changes.length}件)\n\n`;

    changeSet.changes.forEach((change, idx) => {
      preview += `### ${idx + 1}. ${this.getOperationName(change.op)}\n\n`;
      preview += `**対象**: ${Array.isArray(change.target) ? change.target.join(', ') : change.target}\n`;
      preview += `**理由**: ${change.rationale}\n\n`;

      // 差分の詳細
      if (change.preview && change.preview.length > 0) {
        preview += `**差分**:\n`;
        change.preview.forEach(diff => {
          preview += this.formatDiff(diff);
        });
        preview += '\n';
      }
    });

    return preview;
  }

  /**
   * ChangeSetを適用（トランザクション境界）
   * すべての変更が成功するか、すべてロールバックされる
   */
  async apply(
    changeSet: ChangeSet,
    requirements: Record<ReqID, Requirement>
  ): Promise<{ success: boolean; modified: Record<ReqID, Requirement>; errors: string[] }> {
    // 1. 元の状態をディープコピー（ロールバック用）
    const original = JSON.parse(JSON.stringify(requirements)) as Record<ReqID, Requirement>;
    const modified = JSON.parse(JSON.stringify(requirements)) as Record<ReqID, Requirement>;
    const errors: string[] = [];
    const appliedChanges: Change[] = [];

    try {
      // 2. すべての変更をバッファに適用
      for (const change of changeSet.changes) {
        const result = await this.applyChange(change, modified);
        if (!result.success) {
          errors.push(result.error || 'Unknown error');

          // 3. 失敗時: 適用済みの変更を逆順でロールバック
          console.error(`[ChangeEngine] Change failed, rolling back ${appliedChanges.length} changes`);
          await this.rollbackAppliedChanges(appliedChanges, modified, original);

          return { success: false, modified: original, errors };
        }
        appliedChanges.push(change);
      }

      // 4. 全件成功: 状態をコミット
      changeSet.status = 'applied';
      changeSet.appliedAt = new Date().toISOString();
      changeSet.appliedBy = 'auto'; // または user ID

      return { success: true, modified, errors: [] };
    } catch (error: any) {
      errors.push(`Unexpected error: ${error.message}`);

      // 予期しないエラーでも必ずロールバック
      console.error(`[ChangeEngine] Unexpected error, rolling back`);
      await this.rollbackAppliedChanges(appliedChanges, modified, original);

      return { success: false, modified: original, errors };
    }
  }

  /**
   * 適用済みの変更を逆順でロールバック（内部ヘルパー）
   */
  private async rollbackAppliedChanges(
    appliedChanges: Change[],
    current: Record<ReqID, Requirement>,
    original: Record<ReqID, Requirement>
  ): Promise<void> {
    for (let i = appliedChanges.length - 1; i >= 0; i--) {
      const change = appliedChanges[i];
      if (change.inverse) {
        try {
          await this.applyChange(change.inverse, current);
        } catch (rollbackError: any) {
          console.error(`[ChangeEngine] Rollback failed for change ${i}: ${rollbackError.message}`);
          // ロールバック失敗時は元の状態を直接復元
          Object.assign(current, original);
          return;
        }
      }
    }
  }

  /**
   * ChangeSetをロールバック
   */
  async rollback(
    changeSet: ChangeSet,
    requirements: Record<ReqID, Requirement>
  ): Promise<{ success: boolean; restored: Record<ReqID, Requirement>; errors: string[] }> {
    if (!changeSet.reversible) {
      return {
        success: false,
        restored: requirements,
        errors: ['このChangeSetは可逆性が保証されていません']
      };
    }

    const restored = { ...requirements };
    const errors: string[] = [];

    try {
      // 逆順で逆操作を適用
      for (let i = changeSet.changes.length - 1; i >= 0; i--) {
        const change = changeSet.changes[i];
        if (!change.inverse) {
          errors.push(`変更${i + 1}に逆操作が定義されていません`);
          return { success: false, restored: requirements, errors };
        }

        const result = await this.applyChange(change.inverse, restored);
        if (!result.success) {
          errors.push(result.error || 'Rollback error');
          return { success: false, restored: requirements, errors };
        }
      }

      changeSet.status = 'rolled_back';
      changeSet.rolledBackAt = new Date().toISOString();

      return { success: true, restored, errors: [] };
    } catch (error: any) {
      errors.push(error.message);
      return { success: false, restored: requirements, errors };
    }
  }

  /**
   * 個別のChangeを適用
   */
  private async applyChange(
    change: Change,
    requirements: Record<ReqID, Requirement>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      switch (change.op) {
        case 'split':
          return this.applySplit(change, requirements);
        case 'merge':
          return this.applyMerge(change, requirements);
        case 'rewire':
          return this.applyRewire(change, requirements);
        case 'introduce':
          return this.applyIntroduce(change, requirements);
        case 'rewrite':
          return this.applyRewrite(change, requirements);
        case 'alias':
          return this.applyAlias(change, requirements);
        case 'break_cycle':
          return this.applyBreakCycle(change, requirements);
        default:
          return { success: false, error: `未知の操作: ${change.op}` };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * 分割操作の適用
   */
  private applySplit(
    change: Change,
    requirements: Record<ReqID, Requirement>
  ): { success: boolean; error?: string } {
    const targetId = Array.isArray(change.target) ? change.target[0] : change.target;
    const target = requirements[targetId];

    if (!target) {
      return { success: false, error: `要求 ${targetId} が見つかりません` };
    }

    if (!change.payload?.splitTexts) {
      return { success: false, error: '分割テキストが指定されていません' };
    }

    // 新しい要求IDを生成
    const newIds: ReqID[] = [];
    change.payload.splitTexts.forEach((text, idx) => {
      const newId = `${targetId}-S${idx + 1}`;
      newIds.push(newId);

      // 新要求を作成
      requirements[newId] = {
        ...target,
        id: newId,
        description: text,
        derived_from: [targetId],
        updatedAt: new Date().toISOString()
      };
    });

    // 元の要求をsupersededに設定（削除はしない）
    target.supersedes = newIds;
    target.status = 'superseded';
    target.updatedAt = new Date().toISOString();

    return { success: true };
  }

  /**
   * 統合操作の適用
   */
  private applyMerge(
    change: Change,
    requirements: Record<ReqID, Requirement>
  ): { success: boolean; error?: string } {
    const targetIds = Array.isArray(change.target) ? change.target : [change.target];
    const canonicalId = change.payload?.canonicalId;

    if (!canonicalId) {
      return { success: false, error: 'カノニカルIDが指定されていません' };
    }

    const canonical = requirements[canonicalId];
    if (!canonical) {
      return { success: false, error: `カノニカル要求 ${canonicalId} が見つかりません` };
    }

    // 統合先に統合
    const otherIds = targetIds.filter(id => id !== canonicalId);
    canonical.canonical_of = [...(canonical.canonical_of || []), ...otherIds];
    canonical.description = change.payload?.mergedText || canonical.description;
    canonical.updatedAt = new Date().toISOString();

    // 統合元をsupersededに
    otherIds.forEach(id => {
      const req = requirements[id];
      if (req) {
        req.status = 'superseded';
        req.supersedes = [canonicalId];
        req.updatedAt = new Date().toISOString();
      }
    });

    return { success: true };
  }

  /**
   * リンク再配線の適用
   */
  private applyRewire(
    change: Change,
    requirements: Record<ReqID, Requirement>
  ): { success: boolean; error?: string } {
    if (!change.payload?.newEdges || !change.payload?.edgeType) {
      return { success: false, error: '新しいエッジ情報が不足しています' };
    }

    const edgeType = change.payload.edgeType;

    change.payload.newEdges.forEach(([from, to]) => {
      const req = requirements[from];
      if (req) {
        if (edgeType === 'refines') {
          req.refines = [...(req.refines || []), to];
        } else if (edgeType === 'depends_on') {
          req.depends_on = [...(req.depends_on || []), to];
        }
        req.updatedAt = new Date().toISOString();
      }
    });

    return { success: true };
  }

  /**
   * 中間層導入の適用
   */
  private applyIntroduce(
    change: Change,
    requirements: Record<ReqID, Requirement>
  ): { success: boolean; error?: string } {
    if (!change.payload?.newReqDraft) {
      return { success: false, error: '新要求のドラフトが指定されていません' };
    }

    const newReq = change.payload.newReqDraft as Requirement;
    requirements[newReq.id] = {
      ...newReq,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return { success: true };
  }

  /**
   * テキスト書き換えの適用
   */
  private applyRewrite(
    change: Change,
    requirements: Record<ReqID, Requirement>
  ): { success: boolean; error?: string } {
    const targetId = Array.isArray(change.target) ? change.target[0] : change.target;
    const target = requirements[targetId];

    if (!target) {
      return { success: false, error: `要求 ${targetId} が見つかりません` };
    }

    if (!change.payload?.newText) {
      return { success: false, error: '新しいテキストが指定されていません' };
    }

    target.description = change.payload.newText;
    target.updatedAt = new Date().toISOString();

    return { success: true };
  }

  /**
   * エイリアス設定の適用
   */
  private applyAlias(
    change: Change,
    requirements: Record<ReqID, Requirement>
  ): { success: boolean; error?: string } {
    const targetId = Array.isArray(change.target) ? change.target[0] : change.target;
    const target = requirements[targetId];

    if (!target) {
      return { success: false, error: `要求 ${targetId} が見つかりません` };
    }

    if (!change.payload?.aliasFor) {
      return { success: false, error: 'エイリアス先が指定されていません' };
    }

    target.supersedes = [change.payload.aliasFor];
    target.status = 'superseded';
    target.updatedAt = new Date().toISOString();

    return { success: true };
  }

  /**
   * 循環切断の適用
   */
  private applyBreakCycle(
    change: Change,
    requirements: Record<ReqID, Requirement>
  ): { success: boolean; error?: string } {
    if (!change.payload?.cutEdge) {
      return { success: false, error: '切断するエッジが指定されていません' };
    }

    const [from, to] = change.payload.cutEdge;
    const req = requirements[from];

    if (!req) {
      return { success: false, error: `要求 ${from} が見つかりません` };
    }

    // refinesまたはdepends_onから削除
    if (req.refines) {
      req.refines = req.refines.filter(id => id !== to);
    }
    if (req.depends_on) {
      req.depends_on = req.depends_on.filter(id => id !== to);
    }

    req.updatedAt = new Date().toISOString();

    return { success: true };
  }

  /**
   * 操作名の日本語表示
   */
  private getOperationName(op: string): string {
    const names: Record<string, string> = {
      split: '要求の分割',
      merge: '要求の統合',
      rewire: 'リンクの再配線',
      introduce: '中間層の導入',
      rewrite: 'テキストの書き換え',
      alias: 'エイリアスの設定',
      break_cycle: '循環の切断'
    };
    return names[op] || op;
  }

  /**
   * 差分のフォーマット
   */
  private formatDiff(diff: Diff): string {
    const icon = diff.type === 'add' ? '➕' : diff.type === 'remove' ? '➖' : '✏️';
    let result = `${icon} ${diff.description}\n`;

    if (diff.oldValue !== undefined && diff.newValue !== undefined) {
      result += `  - **旧**: ${JSON.stringify(diff.oldValue)}\n`;
      result += `  + **新**: ${JSON.stringify(diff.newValue)}\n`;
    }

    return result;
  }
}
