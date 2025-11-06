/**
 * Task Planner
 * インテントから実行計画を作成
 */
import { createLogger } from '../common/logger.js';
const logger = createLogger('TaskPlanner');
export class TaskPlanner {
    /**
     * インテントから実行計画を作成
     */
    async createPlan(intent) {
        logger.info(`Creating plan for intent: ${intent.type}`);
        switch (intent.type) {
            case 'add_tree':
                return this.createAddTreePlan(intent);
            case 'add_requirement':
                return this.createAddRequirementPlan(intent);
            case 'validate':
                return this.createValidatePlan(intent);
            case 'search':
                return this.createSearchPlan(intent);
            case 'update':
                return this.createUpdatePlan(intent);
            case 'fix':
                return this.createFixPlan(intent);
            default:
                return this.createDefaultPlan(intent);
        }
    }
    /**
     * 要求ツリー作成プラン
     */
    createAddTreePlan(intent) {
        return {
            steps: [
                {
                    id: 'step1',
                    type: 'ai_generation',
                    description: 'ステークホルダ要求の内容を生成',
                    dependencies: [],
                },
                {
                    id: 'step2',
                    type: 'mcp_call',
                    tool: 'batch_add_requirements',
                    description: 'ステークホルダ要求を追加',
                    dependencies: ['step1'],
                },
                {
                    id: 'step3',
                    type: 'ai_generation',
                    description: 'システム要求2-3件を生成',
                    dependencies: ['step2'],
                },
                {
                    id: 'step4',
                    type: 'mcp_call',
                    tool: 'batch_add_requirements',
                    description: 'システム要求を一括追加',
                    dependencies: ['step3'],
                },
                {
                    id: 'step5',
                    type: 'ai_generation',
                    description: '機能要求を生成',
                    dependencies: ['step4'],
                },
                {
                    id: 'step6',
                    type: 'mcp_call',
                    tool: 'batch_add_requirements',
                    description: '機能要求を一括追加',
                    dependencies: ['step5'],
                },
                {
                    id: 'step7',
                    type: 'validation',
                    description: '全要求の妥当性チェック',
                    dependencies: ['step6'],
                },
                {
                    id: 'step8',
                    type: 'confirmation',
                    description: '完了レポート生成',
                    dependencies: ['step7'],
                },
            ],
            description: 'ステークホルダ要求とその下位要求ツリーを作成',
            estimatedDuration: '30-60秒',
        };
    }
    /**
     * 単一要求追加プラン
     */
    createAddRequirementPlan(intent) {
        return {
            steps: [
                {
                    id: 'step1',
                    type: 'ai_generation',
                    description: '要求の内容を生成',
                    dependencies: [],
                },
                {
                    id: 'step2',
                    type: 'mcp_call',
                    tool: 'add_requirement',
                    description: '要求を追加',
                    dependencies: ['step1'],
                },
                {
                    id: 'step3',
                    type: 'confirmation',
                    description: '追加完了を確認',
                    dependencies: ['step2'],
                },
            ],
            description: '単一要求を追加',
            estimatedDuration: '5-10秒',
        };
    }
    /**
     * 妥当性チェックプラン
     */
    createValidatePlan(intent) {
        const isAll = intent.entities.scope === 'all';
        return {
            steps: [
                {
                    id: 'step1',
                    type: 'mcp_call',
                    tool: 'validate_requirements',
                    params: { requirementId: intent.entities.requirementId },
                    description: isAll ? '全要求を検証' : `${intent.entities.requirementId}を検証`,
                    dependencies: [],
                },
                {
                    id: 'step2',
                    type: 'confirmation',
                    description: '検証結果レポート',
                    dependencies: ['step1'],
                },
            ],
            description: '妥当性チェックを実行',
            estimatedDuration: isAll ? '10-30秒' : '3-5秒',
        };
    }
    /**
     * 要求更新プラン
     */
    createUpdatePlan(intent) {
        const requirementId = intent.entities.requirementId;
        const status = intent.entities.status;
        return {
            steps: [
                {
                    id: 'step1',
                    type: 'mcp_call',
                    tool: 'update_requirement',
                    params: {
                        id: requirementId,
                        status: status || 'approved',
                    },
                    description: `${requirementId}の要求を更新`,
                    dependencies: [],
                },
            ],
            description: '要求を更新',
            estimatedDuration: '< 1秒',
        };
    }
    /**
     * 検索プラン
     */
    createSearchPlan(intent) {
        return {
            steps: [
                {
                    id: 'step1',
                    type: 'mcp_call',
                    tool: 'search_requirements',
                    params: { keywords: intent.entities.keywords },
                    description: `キーワード検索: ${intent.entities.keywords?.join(', ')}`,
                    dependencies: [],
                },
                {
                    id: 'step2',
                    type: 'confirmation',
                    description: '検索結果を表示',
                    dependencies: ['step1'],
                },
            ],
            description: '要求を検索',
            estimatedDuration: '2-5秒',
        };
    }
    /**
     * 自動修正プラン
     */
    createFixPlan(intent) {
        return {
            steps: [
                {
                    id: 'step1',
                    type: 'mcp_call',
                    tool: 'validate_requirements',
                    description: '全要求を検証',
                    dependencies: [],
                },
                {
                    id: 'step2',
                    type: 'mcp_call',
                    tool: 'auto_fix',
                    description: 'エラーを自動修正',
                    dependencies: ['step1'],
                },
                {
                    id: 'step3',
                    type: 'confirmation',
                    description: '修正結果レポート',
                    dependencies: ['step2'],
                },
            ],
            description: '妥当性エラーを自動修正',
            estimatedDuration: '15-45秒',
        };
    }
    /**
     * デフォルトプラン
     */
    createDefaultPlan(intent) {
        return {
            steps: [
                {
                    id: 'step1',
                    type: 'confirmation',
                    description: '質問の意図が不明です',
                    dependencies: [],
                },
            ],
            description: '意図不明 - 詳細を確認',
            estimatedDuration: '即時',
        };
    }
}
