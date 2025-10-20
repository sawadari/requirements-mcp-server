/**
 * 修正実行エンジン
 * plan→apply→revalidate→stopの再検証ループを実行
 */

import type {
  ReqID,
  Requirement,
  ChangeSet,
  FixPolicy,
  FixResult
} from './types.js';
import { FixPlanner } from './fix-planner.js';
import { ChangeEngine } from './change-engine.js';

export class FixExecutor {
  private policy: FixPolicy;
  private planner: FixPlanner;
  private engine: ChangeEngine;

  constructor(policy: FixPolicy) {
    this.policy = policy;
    this.planner = new FixPlanner(policy);
    this.engine = new ChangeEngine();
  }

  /**
   * 修正の実行（再検証ループ）
   */
  async execute(
    requirements: Record<ReqID, Requirement>,
    validate: (reqs: Record<ReqID, Requirement>) => Promise<any[]>
  ): Promise<FixResult> {
    let currentReqs = { ...requirements };
    const appliedChangeSets: ChangeSet[] = [];
    const fixedViolations = new Set<string>();
    let iteration = 0;
    let stoppedReason: 'fixed_point' | 'max_iterations' | 'error' = 'fixed_point';

    try {
      while (iteration < this.policy.stopping.max_iterations) {
        iteration++;
        console.log(`\n=== 反復 ${iteration} ===`);

        // 1. 現在の状態を検証
        const violations = await validate(currentReqs);
        console.log(`違反数: ${violations.length}件`);

        if (violations.length === 0) {
          stoppedReason = 'fixed_point';
          console.log('✅ 違反なし。固定点に到達しました。');
          break;
        }

        // Strict違反のみをチェック
        const strictViolations = violations.filter(v =>
          this.isStrictViolation(v.code || v.ruleName)
        );

        if (strictViolations.length === 0) {
          stoppedReason = 'fixed_point';
          console.log('✅ Strict違反なし。Suggest違反のみが残っています。');
          break;
        }

        // 2. 修正プランを生成
        console.log('修正プランを生成中...');
        const plan = await this.planner.planFixes(strictViolations, currentReqs);

        if (plan.changeSets.length === 0) {
          stoppedReason = 'fixed_point';
          console.log('⚠️ 適用可能な修正がありません。');
          break;
        }

        console.log(`生成されたChangeSet: ${plan.changeSets.length}件`);

        // 3. ChangeSetsを適用
        let appliedAny = false;
        for (const changeSet of plan.changeSets) {
          console.log(`\n適用中: ${changeSet.id}`);

          // 自動適用可能かチェック
          if (!this.canAutoApply(changeSet)) {
            console.log('⏸️  承認が必要です。スキップします。');
            continue;
          }

          const result = await this.engine.apply(changeSet, currentReqs);

          if (result.success) {
            currentReqs = result.modified;
            appliedChangeSets.push(changeSet);
            appliedAny = true;

            // 修正された違反を記録
            changeSet.violations.forEach(v => fixedViolations.add(v));

            console.log(`✅ 適用完了: ${changeSet.changes.length}件の変更`);
          } else {
            console.log(`❌ 適用失敗: ${result.errors.join(', ')}`);
          }
        }

        if (!appliedAny) {
          stoppedReason = 'fixed_point';
          console.log('⚠️ 適用可能なChangeSetがありませんでした。');
          break;
        }

        // 4. 波及処理（propagation）
        if (this.policy.propagation.revalidate_after_each) {
          console.log('影響範囲を再検証中...');
          // 次のイテレーションで再検証される
        }
      }

      if (iteration >= this.policy.stopping.max_iterations) {
        stoppedReason = 'max_iterations';
        console.log(`⚠️ 最大反復回数 (${this.policy.stopping.max_iterations}) に到達しました。`);
      }

      // 最終検証
      const finalViolations = await validate(currentReqs);

      return {
        success: true,
        appliedChangeSets,
        newViolations: finalViolations,
        fixedViolations: Array.from(fixedViolations),
        iterations: iteration,
        stoppedReason,
        requirements: currentReqs
      };
    } catch (error: any) {
      return {
        success: false,
        appliedChangeSets,
        newViolations: [],
        fixedViolations: Array.from(fixedViolations),
        iterations: iteration,
        stoppedReason: 'error',
        error: error.message,
        requirements: currentReqs
      };
    }
  }

  /**
   * Strict違反かどうかを判定
   */
  private isStrictViolation(code: string): boolean {
    const rule = this.policy.rules.find(r => r.whenViolation === code || r.id === code);
    return rule?.severity === 'strict';
  }

  /**
   * 自動適用可能かどうかを判定（Strict/Suggest衝突解消ロジック）
   *
   * マトリクス判定:
   * - global mode=strict & action mode=auto → 自動適用 ✅
   * - global mode=strict & action mode=assist → 提案のみ ⚠️
   * - global mode=suggest → すべて提案のみ ⚠️
   */
  private canAutoApply(changeSet: ChangeSet): boolean {
    // グローバルモードがsuggestなら、すべて提案止まり
    if (this.policy.mode === 'suggest' || this.policy.mode === 'assist') {
      return false;
    }

    // グローバルモードがstrictの場合、各変更のアクションモードを確認
    return changeSet.changes.every(change => {
      // 操作タイプから対応するルールを取得
      const violation = changeSet.violations[0]; // 簡易版: 最初の違反コードで判定
      const rule = this.policy.rules.find(r =>
        r.whenViolation === violation || r.id === violation
      );

      if (!rule) {
        // ルールが見つからない場合は安全側に倒して提案のみ
        console.warn(`[FixExecutor] No rule found for violation: ${violation}`);
        return false;
      }

      // アクションのモードを確認
      const action = rule.actions.find(a => a.use === change.op);
      if (!action) {
        console.warn(`[FixExecutor] No action found for op: ${change.op}`);
        return false;
      }

      // action.mode が 'auto' のみ自動適用
      // 'assist' は提案のみ（human approval required）
      return action.mode === 'auto';
    });
  }

  /**
   * 修正プランのプレビュー（適用せずに確認）
   */
  async previewFixes(
    requirements: Record<ReqID, Requirement>,
    validate: (reqs: Record<ReqID, Requirement>) => Promise<any[]>
  ): Promise<string> {
    const violations = await validate(requirements);
    const plan = await this.planner.planFixes(violations, requirements);
    return plan.preview;
  }

  /**
   * 特定のChangeSetsのみを適用
   */
  async applySelected(
    changeSetIds: string[],
    requirements: Record<ReqID, Requirement>,
    allChangeSets: ChangeSet[]
  ): Promise<FixResult> {
    let currentReqs = { ...requirements };
    const appliedChangeSets: ChangeSet[] = [];
    const fixedViolations = new Set<string>();

    for (const csId of changeSetIds) {
      const cs = allChangeSets.find(c => c.id === csId);
      if (!cs) {
        console.warn(`ChangeSet ${csId} が見つかりません`);
        continue;
      }

      const result = await this.engine.apply(cs, currentReqs);
      if (result.success) {
        currentReqs = result.modified;
        appliedChangeSets.push(cs);
        cs.violations.forEach(v => fixedViolations.add(v));
      } else {
        console.error(`適用失敗: ${result.errors.join(', ')}`);
      }
    }

    return {
      success: true,
      appliedChangeSets,
      newViolations: [],
      fixedViolations: Array.from(fixedViolations),
      iterations: 1,
      stoppedReason: 'fixed_point'
    };
  }

  /**
   * ロールバック
   */
  async rollbackAll(
    changeSets: ChangeSet[],
    requirements: Record<ReqID, Requirement>
  ): Promise<{ success: boolean; restored: Record<ReqID, Requirement>; errors: string[] }> {
    let currentReqs = { ...requirements };
    const errors: string[] = [];

    // 逆順でロールバック
    for (let i = changeSets.length - 1; i >= 0; i--) {
      const cs = changeSets[i];
      const result = await this.engine.rollback(cs, currentReqs);

      if (result.success) {
        currentReqs = result.restored;
      } else {
        errors.push(...result.errors);
      }
    }

    return {
      success: errors.length === 0,
      restored: currentReqs,
      errors
    };
  }
}
