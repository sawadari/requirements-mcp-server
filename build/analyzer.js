/**
 * 要求の影響範囲分析機能
 */
export class ImpactAnalyzer {
    storage;
    constructor(storage) {
        this.storage = storage;
    }
    /**
     * 指定された要求の変更がシステムに与える影響を分析
     */
    async analyzeImpact(requirementId, proposedChanges) {
        const requirement = await this.storage.getRequirement(requirementId);
        if (!requirement) {
            throw new Error(`Requirement ${requirementId} not found`);
        }
        // 直接依存する要求を取得
        const directDependents = await this.storage.getDependents(requirementId);
        // 間接的に依存する要求を取得
        const indirectDependents = await this.findIndirectDependents(requirementId, new Set([requirementId]));
        const affectedRequirements = [
            ...directDependents.map((r) => ({
                id: r.id,
                title: r.title,
                impactType: 'direct',
                description: `この要求は ${requirement.title} に直接依存しています`,
            })),
            ...indirectDependents.map((r) => ({
                id: r.id,
                title: r.title,
                impactType: 'indirect',
                description: `この要求は ${requirement.title} に間接的に依存しています`,
            })),
        ];
        // 工数とリスクの推定
        const estimatedEffort = this.estimateEffort(requirement, affectedRequirements.length);
        const risks = this.identifyRisks(requirement, affectedRequirements);
        const recommendations = this.generateRecommendations(requirement, affectedRequirements, proposedChanges);
        return {
            requirementId,
            affectedRequirements,
            estimatedEffort,
            risks,
            recommendations,
        };
    }
    /**
     * 間接的に依存する要求を再帰的に検索
     */
    async findIndirectDependents(requirementId, visited) {
        const directDependents = await this.storage.getDependents(requirementId);
        const indirectDependents = [];
        for (const dependent of directDependents) {
            if (visited.has(dependent.id)) {
                continue;
            }
            visited.add(dependent.id);
            const transitiveDependents = await this.findIndirectDependents(dependent.id, visited);
            indirectDependents.push(...transitiveDependents);
        }
        return indirectDependents;
    }
    /**
     * 工数を推定
     */
    estimateEffort(requirement, affectedCount) {
        const baseEffort = this.getBaseEffort(requirement.priority);
        const multiplier = 1 + affectedCount * 0.2;
        const totalHours = Math.ceil(baseEffort * multiplier);
        if (totalHours <= 4) {
            return `${totalHours}時間`;
        }
        else if (totalHours <= 24) {
            return `${Math.ceil(totalHours / 8)}日`;
        }
        else {
            return `${Math.ceil(totalHours / 40)}週間`;
        }
    }
    getBaseEffort(priority) {
        switch (priority) {
            case 'critical':
                return 16; // 2日
            case 'high':
                return 8; // 1日
            case 'medium':
                return 4; // 0.5日
            case 'low':
                return 2; // 0.25日
            default:
                return 4;
        }
    }
    /**
     * リスクを特定
     */
    identifyRisks(requirement, affectedRequirements) {
        const risks = [];
        // 高優先度の要求への影響
        if (requirement.priority === 'critical' || requirement.priority === 'high') {
            risks.push('高優先度の要求であり、変更による影響が大きい可能性があります');
        }
        // 多数の依存要求がある
        if (affectedRequirements.length > 5) {
            risks.push(`${affectedRequirements.length}個の要求に影響を与える可能性があります`);
        }
        // 実装中または完了済みの要求
        if (requirement.status === 'in_progress' ||
            requirement.status === 'completed') {
            risks.push('既に実装が進行中または完了しており、変更コストが高い可能性があります');
        }
        // 循環依存の可能性
        const hasPotentialCycle = this.checkForCycles(requirement);
        if (hasPotentialCycle) {
            risks.push('循環依存が発生する可能性があります');
        }
        return risks;
    }
    /**
     * 循環依存のチェック（簡易版）
     */
    checkForCycles(requirement) {
        // 簡易実装: 依存関係が3つ以上の場合は循環の可能性があるとする
        return requirement.dependencies.length >= 3;
    }
    /**
     * 推奨事項を生成
     */
    generateRecommendations(requirement, affectedRequirements, proposedChanges) {
        const recommendations = [];
        // 影響を受ける要求の確認を推奨
        if (affectedRequirements.length > 0) {
            recommendations.push('影響を受ける要求のレビューとテスト計画を作成してください');
        }
        // ステータスに基づく推奨
        if (requirement.status === 'completed') {
            recommendations.push('完了済みの要求です。変更には慎重な検討とロールバック計画が必要です');
        }
        // 優先度変更の場合
        if (proposedChanges?.priority && proposedChanges.priority !== requirement.priority) {
            recommendations.push('優先度の変更は、開発スケジュールに影響を与える可能性があります。関係者への通知を忘れずに');
        }
        // 依存関係変更の場合
        if (proposedChanges?.dependencies) {
            recommendations.push('依存関係の変更は、実装順序に影響を与えます。プロジェクト計画の見直しを推奨します');
        }
        // 一般的な推奨事項
        if (affectedRequirements.length > 3) {
            recommendations.push('影響範囲が広いため、段階的な変更とテストを推奨します');
        }
        return recommendations;
    }
    /**
     * 依存関係グラフを取得（可視化用）
     */
    async getDependencyGraph(requirementId) {
        const visited = new Set();
        const nodes = [];
        const edges = [];
        await this.buildGraph(requirementId, visited, nodes, edges);
        return { nodes, edges };
    }
    async buildGraph(requirementId, visited, nodes, edges) {
        if (visited.has(requirementId)) {
            return;
        }
        visited.add(requirementId);
        const requirement = await this.storage.getRequirement(requirementId);
        if (!requirement) {
            return;
        }
        nodes.push({
            id: requirement.id,
            title: requirement.title,
            status: requirement.status,
        });
        // 依存要求を追加
        for (const depId of requirement.dependencies) {
            edges.push({ from: requirement.id, to: depId });
            await this.buildGraph(depId, visited, nodes, edges);
        }
        // 依存されている要求を追加
        const dependents = await this.storage.getDependents(requirementId);
        for (const dependent of dependents) {
            edges.push({ from: dependent.id, to: requirementId });
            await this.buildGraph(dependent.id, visited, nodes, edges);
        }
    }
}
