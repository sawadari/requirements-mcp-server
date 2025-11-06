/**
 * ツリービュー用のユーティリティ
 * 要求の階層構造を構築
 */
export class TreeBuilder {
    /**
     * 要求リストからツリー構造を構築
     */
    static buildTree(requirements) {
        // ステークホルダ要求をルートとして抽出
        const stakeholderReqs = requirements.filter(r => r.type === 'stakeholder' || (!r.type && !r.parentId));
        // 各ステークホルダ要求の配下にシステム要求、機能要求を配置
        return stakeholderReqs.map(stakeholder => this.buildNode(stakeholder, requirements, 0));
    }
    /**
     * 単一ノードとその子ノードを構築
     */
    static buildNode(requirement, allRequirements, level) {
        // このノードの子要求を検索（parentIdまたはdependenciesで判定）
        const children = allRequirements.filter(r => {
            // parentIdが一致
            if (r.parentId === requirement.id)
                return true;
            // dependenciesに含まれ、かつ階層関係にある
            if (r.dependencies.includes(requirement.id)) {
                // ステークホルダの子はシステム要求
                if (level === 0 && (r.type === 'system' || !r.type))
                    return true;
                // システムの子は機能要求
                if (level === 1 && r.type === 'functional')
                    return true;
            }
            return false;
        });
        // 子ノードを再帰的に構築
        const childNodes = children.map(child => this.buildNode(child, allRequirements, level + 1));
        return {
            requirement,
            children: childNodes,
            level,
        };
    }
    /**
     * ツリーをフラットなリストに変換（表示用）
     */
    static flattenTree(nodes) {
        const result = [];
        const traverse = (node, indent) => {
            result.push({ ...node, indent });
            node.children.forEach(child => traverse(child, indent + 1));
        };
        nodes.forEach(node => traverse(node, 0));
        return result;
    }
    /**
     * 特定の要求までのパスを取得
     */
    static getPathToRequirement(requirementId, tree) {
        const path = [];
        const search = (nodes) => {
            for (const node of nodes) {
                path.push(node);
                if (node.requirement.id === requirementId) {
                    return true;
                }
                if (search(node.children)) {
                    return true;
                }
                path.pop();
            }
            return false;
        };
        return search(tree) ? path : null;
    }
}
