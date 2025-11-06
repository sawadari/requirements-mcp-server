/**
 * 修正プランナー
 * 違反を分析し、ポリシーに基づいて修正ChangeSetを生成
 */
import { ChangeEngine } from './change-engine.js';
export class FixPlanner {
    policy;
    engine;
    constructor(policy) {
        this.policy = policy;
        this.engine = new ChangeEngine();
    }
    /**
     * 違反からChangeSetのプランを生成
     */
    async planFixes(violations, requirements) {
        const changeSets = [];
        const affectedReqs = new Set();
        let newReqCount = 0;
        let removedReqCount = 0;
        let modifiedReqCount = 0;
        // 違反をルール優先度順にグループ化
        const violationsByRule = this.groupViolationsByRule(violations);
        // ルール優先度順に処理
        const sortedRules = [...this.policy.rules].sort((a, b) => b.priority - a.priority);
        for (const rule of sortedRules) {
            const ruleViolations = violationsByRule.get(rule.whenViolation) || [];
            if (ruleViolations.length === 0)
                continue;
            for (const violation of ruleViolations) {
                // ガード条件をチェック
                if (!this.checkGuard(rule, violation, requirements)) {
                    continue;
                }
                // 各アクションに対してChangeを生成
                const changes = [];
                for (const action of rule.actions) {
                    const change = await this.createChange(action.use, violation, requirements, action.params);
                    if (change) {
                        changes.push(change);
                        const targets = Array.isArray(change.target) ? change.target : [change.target];
                        targets.forEach(t => affectedReqs.add(t));
                        // 統計情報の更新
                        if (change.op === 'split') {
                            newReqCount += change.payload?.splitTexts?.length || 0;
                            modifiedReqCount++;
                        }
                        else if (change.op === 'merge') {
                            removedReqCount += (Array.isArray(change.target) ? change.target.length : 1) - 1;
                            modifiedReqCount++;
                        }
                        else if (change.op === 'introduce') {
                            newReqCount++;
                        }
                        else {
                            modifiedReqCount++;
                        }
                    }
                }
                if (changes.length > 0) {
                    // ChangeSetを作成
                    const changeSet = {
                        id: `CS-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                        createdAt: new Date().toISOString(),
                        violations: [violation.code || rule.whenViolation],
                        changes,
                        impacted: this.calculateImpact(changes, requirements),
                        reversible: changes.every(c => c.inverse !== undefined),
                        status: 'proposed',
                        metadata: {
                            policyId: this.policy.policy,
                            ruleId: rule.id
                        }
                    };
                    changeSets.push(changeSet);
                }
            }
        }
        // プレビューを生成
        const preview = this.generatePreview(changeSets, requirements);
        return {
            changeSets,
            totalChanges: changeSets.reduce((sum, cs) => sum + cs.changes.length, 0),
            estimatedImpact: {
                requirementsAffected: affectedReqs.size,
                newRequirements: newReqCount,
                removedRequirements: removedReqCount,
                modifiedRequirements: modifiedReqCount
            },
            preview
        };
    }
    /**
     * ガード条件のチェック
     */
    checkGuard(rule, violation, requirements) {
        if (!rule.guard)
            return true;
        const req = requirements[violation.reqId];
        if (!req)
            return false;
        // レベルチェック
        if (rule.guard.level && !rule.guard.level.includes(req.type || '')) {
            return false;
        }
        // 信頼度チェック
        if (rule.guard.min_confidence && violation.confidence < rule.guard.min_confidence) {
            return false;
        }
        // 類似度チェック
        if (rule.guard.min_similarity && violation.similarity < rule.guard.min_similarity) {
            return false;
        }
        return true;
    }
    /**
     * Changeの生成
     */
    async createChange(operation, violation, requirements, params) {
        const req = requirements[violation.reqId];
        if (!req)
            return null;
        switch (operation) {
            case 'split_requirement':
                return this.createSplitChange(req, violation, params);
            case 'merge_requirements':
                return this.createMergeChange(req, violation, requirements, params);
            case 'rewrite_text':
                return this.createRewriteChange(req, violation, params);
            case 'break_cycle':
                return this.createBreakCycleChange(req, violation, requirements, params);
            case 'introduce_intermediate':
                return this.createIntroduceChange(req, violation, requirements, params);
            default:
                console.warn(`未実装の操作: ${operation}`);
                return null;
        }
    }
    /**
     * 分割Changeの生成
     */
    createSplitChange(req, violation, params) {
        // 簡易分割: 箇条書きやandで分割
        const text = req.description;
        const splitTexts = [];
        // 箇条書き検出
        if (text.includes('、') || text.includes('・')) {
            splitTexts.push(...text.split(/[、・]/).map(t => t.trim()).filter(t => t.length > 0));
        }
        // and/or検出
        else if (text.match(/および|かつ|または/)) {
            splitTexts.push(...text.split(/および|かつ|または/).map(t => t.trim()).filter(t => t.length > 0));
        }
        // デフォルト: 2分割
        else {
            const mid = Math.floor(text.length / 2);
            splitTexts.push(text.substring(0, mid), text.substring(mid));
        }
        const preview = [
            {
                type: 'remove',
                reqId: req.id,
                description: `元の要求 ${req.id} を ${splitTexts.length} 件に分割`,
                oldValue: req.description
            },
            ...splitTexts.map((text, idx) => ({
                type: 'add',
                description: `新要求 ${req.id}-S${idx + 1}`,
                newValue: text
            }))
        ];
        return {
            op: 'split',
            target: req.id,
            payload: { splitTexts },
            rationale: `単一性が低い (${violation.code}): 複数の関心事を分離`,
            preview,
            inverse: {
                op: 'merge',
                target: splitTexts.map((_, idx) => `${req.id}-S${idx + 1}`),
                payload: {
                    canonicalId: req.id,
                    mergedText: req.description
                },
                rationale: '分割の取り消し',
                preview: []
            }
        };
    }
    /**
     * 統合Changeの生成
     */
    createMergeChange(req, violation, requirements, params) {
        // 類似要求を検索（簡易版）
        const similar = violation.relatedReqs || [];
        if (similar.length === 0)
            return null;
        const targetIds = [req.id, ...similar];
        const canonicalId = req.id; // 簡易: 最初の要求をカノニカルに
        const mergedText = `${req.description}（統合元: ${similar.join(', ')}）`;
        const preview = [
            {
                type: 'modify',
                reqId: canonicalId,
                description: `要求を統合: ${targetIds.join(' + ')}`,
                oldValue: req.description,
                newValue: mergedText
            }
        ];
        return {
            op: 'merge',
            target: targetIds,
            payload: { canonicalId, mergedText },
            rationale: `重複検出 (${violation.code}): 類似要求を統合`,
            preview
        };
    }
    /**
     * テキスト書き換えChangeの生成
     */
    createRewriteChange(req, violation, params) {
        let newText = req.description;
        // 主語追加
        if (params?.add_subject && !newText.match(/^(システムは|.*が)/)) {
            newText = `${params.default_subject || 'システムは'}${newText}`;
        }
        // 曖昧表現の置換（簡易）
        if (params?.replace_ambiguous) {
            newText = newText.replace(/など/g, '等（具体的に列挙すること）');
            newText = newText.replace(/適切に/g, '定義された基準に従って');
        }
        const preview = [
            {
                type: 'modify',
                reqId: req.id,
                field: 'description',
                description: 'テキストの書き換え',
                oldValue: req.description,
                newValue: newText
            }
        ];
        return {
            op: 'rewrite',
            target: req.id,
            payload: { oldText: req.description, newText },
            rationale: `品質改善 (${violation.code}): 主語・明確性の向上`,
            preview,
            inverse: {
                op: 'rewrite',
                target: req.id,
                payload: { oldText: newText, newText: req.description },
                rationale: '書き換えの取り消し',
                preview: []
            }
        };
    }
    /**
     * 循環切断Changeの生成
     */
    createBreakCycleChange(req, violation, requirements, params) {
        if (!violation.cycle || violation.cycle.length === 0)
            return null;
        // 最小フィードバック辺を選択（簡易: 最後の辺）
        const cycle = violation.cycle;
        const cutEdge = [cycle[cycle.length - 1], cycle[0]];
        const preview = [
            {
                type: 'remove',
                description: `循環を切断: ${cutEdge[0]} → ${cutEdge[1]}`,
                oldValue: cutEdge
            }
        ];
        return {
            op: 'break_cycle',
            target: cutEdge[0],
            payload: { cycleEdges: cycle.map((id, i) => [id, cycle[(i + 1) % cycle.length]]), cutEdge },
            rationale: `循環依存検出 (${violation.code}): 最小フィードバック辺を切断`,
            preview
        };
    }
    /**
     * 中間層導入Changeの生成
     */
    createIntroduceChange(req, violation, requirements, params) {
        const newId = `${req.id}-INT`;
        const newReqDraft = {
            id: newId,
            title: `${req.title}（中間層）`,
            description: `${req.description}（抽象度調整のため導入）`,
            type: req.type,
            category: req.category,
            status: 'draft',
            priority: req.priority,
            refines: req.refines
        };
        const preview = [
            {
                type: 'add',
                reqId: newId,
                description: `中間層の導入: ${newId}`,
                newValue: newReqDraft
            }
        ];
        return {
            op: 'introduce',
            target: req.id,
            payload: { newReqDraft, position: 'above' },
            rationale: `抽象度の段差 (${violation.code}): 中間層を導入`,
            preview
        };
    }
    /**
     * 影響範囲の計算
     */
    calculateImpact(changes, requirements) {
        const impacted = new Set();
        changes.forEach(change => {
            const targets = Array.isArray(change.target) ? change.target : [change.target];
            targets.forEach(id => {
                impacted.add(id);
                const req = requirements[id];
                if (req) {
                    // 親・子・兄弟を影響範囲に追加
                    req.refines?.forEach(pid => impacted.add(pid));
                    req.depends_on?.forEach(did => impacted.add(did));
                }
            });
        });
        return Array.from(impacted);
    }
    /**
     * プレビューの生成
     */
    generatePreview(changeSets, requirements) {
        let preview = `# 修正プラン\n\n`;
        preview += `**ポリシー**: ${this.policy.policy}\n`;
        preview += `**ChangeSet数**: ${changeSets.length}件\n\n`;
        changeSets.forEach((cs, idx) => {
            preview += `## ChangeSet ${idx + 1}: ${cs.id}\n\n`;
            preview += this.engine.preview(cs, requirements);
            preview += '\n---\n\n';
        });
        return preview;
    }
    /**
     * 違反をルールごとにグループ化
     */
    groupViolationsByRule(violations) {
        const grouped = new Map();
        violations.forEach(v => {
            const key = v.code || v.ruleName || 'unknown';
            if (!grouped.has(key)) {
                grouped.set(key, []);
            }
            grouped.get(key).push(v);
        });
        return grouped;
    }
}
