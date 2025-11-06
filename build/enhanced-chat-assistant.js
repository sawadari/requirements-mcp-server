/**
 * Enhanced AI Chat Assistant
 * Orchestrator統合版 - 複雑なタスクを自動実行
 */
import { ValidationTools } from './tools/validation-tools.js';
import { BatchTools } from './tools/batch-tools.js';
import { IntentAnalyzer } from './orchestrator/intent-analyzer.js';
import { TaskPlanner } from './orchestrator/task-planner.js';
import { StepExecutor } from './orchestrator/step-executor.js';
import { createLogger } from './common/logger.js';
const logger = createLogger('EnhancedChatAssistant');
export class EnhancedAIChatAssistant {
    storage;
    validationEngine;
    validationTools;
    batchTools;
    intentAnalyzer;
    taskPlanner;
    stepExecutor;
    conversationHistory = [];
    constructor(storage, validationEngine) {
        this.storage = storage;
        this.validationEngine = validationEngine;
        this.validationTools = new ValidationTools(storage, validationEngine);
        this.batchTools = new BatchTools(storage);
        this.intentAnalyzer = new IntentAnalyzer();
        this.taskPlanner = new TaskPlanner();
        this.stepExecutor = new StepExecutor(storage, this.validationTools, this.batchTools);
        logger.info('EnhancedAIChatAssistant initialized');
    }
    /**
     * AIが利用可能かチェック
     */
    isAvailable() {
        return process.env.ANTHROPIC_API_KEY !== undefined;
    }
    /**
     * ユーザーメッセージを処理してAI応答を生成
     */
    async chat(userMessage) {
        try {
            logger.info(`Processing message: ${userMessage}`);
            // 会話履歴に追加
            this.conversationHistory.push({
                role: 'user',
                content: userMessage,
            });
            // 1. 意図分析
            const intent = await this.intentAnalyzer.analyze(userMessage);
            logger.info(`Detected intent: ${intent.type} (confidence: ${intent.confidence})`);
            if (intent.confidence < 0.6) {
                return this.handleLowConfidence(userMessage);
            }
            // 2. 実行計画作成
            const plan = await this.taskPlanner.createPlan(intent);
            logger.info(`Created plan with ${plan.steps.length} steps`);
            // 3. ユーザーに計画を提示（オプション）
            if (this.shouldConfirmPlan(intent)) {
                const confirmation = this.formatPlan(plan);
                // 簡易実装: 確認せずに実行
                logger.info('Auto-executing plan');
            }
            // 4. 実行
            const context = await this.stepExecutor.execute(plan, intent);
            // 5. レポート生成
            const report = this.generateFinalReport(context);
            // 会話履歴に追加
            this.conversationHistory.push({
                role: 'assistant',
                content: report,
            });
            // 履歴管理（最新20件のみ保持）
            if (this.conversationHistory.length > 20) {
                this.conversationHistory = this.conversationHistory.slice(-20);
            }
            return report;
        }
        catch (error) {
            const err = error;
            logger.error('Chat error', err);
            return `❌ エラーが発生しました:\n\n${err.message}\n\nもう一度お試しください。`;
        }
    }
    /**
     * 低信頼度の場合の処理
     */
    handleLowConfidence(userMessage) {
        return `🤔 質問の意図がよくわかりませんでした。

以下のような質問に対応できます:

1. **要求の追加**
   - 「ステークホルダ要求を追加して」
   - 「セキュリティに関する要求を作成」

2. **妥当性チェック**
   - 「STK-001をチェック」
   - 「すべての要求を検証」

3. **要求検索**
   - 「搬送に関する要求を検索」

4. **自動修正**
   - 「エラーを修正して」

もう一度、具体的に質問してください。`;
    }
    /**
     * 計画の確認が必要かどうか
     */
    shouldConfirmPlan(intent) {
        // 要求ツリー作成など重要な操作は確認
        return intent.type === 'add_tree' || intent.type === 'fix';
    }
    /**
     * 実行計画をフォーマット
     */
    formatPlan(plan) {
        let text = `## 📋 実行計画\n\n`;
        text += `**内容**: ${plan.description}\n`;
        text += `**予想時間**: ${plan.estimatedDuration}\n\n`;
        text += `### ステップ\n`;
        plan.steps.forEach((step, index) => {
            text += `${index + 1}. ${step.description}\n`;
        });
        text += `\nこの内容で実行します。`;
        return text;
    }
    /**
     * 最終レポート生成
     */
    generateFinalReport(context) {
        const { createdRequirements, validationResults, executedSteps } = context;
        const successSteps = executedSteps.filter((s) => s.success).length;
        const totalSteps = executedSteps.length;
        const totalDuration = executedSteps.reduce((sum, s) => sum + s.duration, 0);
        let report = `## ✅ 完了しました！\n\n`;
        report += `**実行ステップ**: ${successSteps}/${totalSteps} 成功\n`;
        report += `**処理時間**: ${(totalDuration / 1000).toFixed(1)}秒\n\n`;
        if (createdRequirements && createdRequirements.length > 0) {
            report += `### 作成された要求 (${createdRequirements.length}件)\n\n`;
            const byType = {};
            createdRequirements.forEach((req) => {
                byType[req.type] = (byType[req.type] || []);
                byType[req.type].push(req);
            });
            Object.keys(byType).forEach(type => {
                const typeName = type === 'stakeholder' ? 'ステークホルダ要求' :
                    type === 'system' ? 'システム要求' : '機能要求';
                report += `\n**${typeName}**:\n`;
                byType[type].forEach((req) => {
                    report += `- **${req.id}**: ${req.title}\n`;
                });
            });
        }
        if (validationResults && validationResults.length > 0) {
            const flatResults = validationResults.flat();
            const validCount = flatResults.filter((r) => r.isValid).length;
            const invalidCount = flatResults.length - validCount;
            report += `\n### 妥当性チェック\n\n`;
            report += `- ✅ 合格: ${validCount}件\n`;
            if (invalidCount > 0) {
                report += `- ⚠️ 要修正: ${invalidCount}件\n`;
            }
        }
        // 失敗したステップがあれば表示
        const failedSteps = executedSteps.filter((s) => !s.success);
        if (failedSteps.length > 0) {
            report += `\n### ⚠️ 一部ステップが失敗\n\n`;
            failedSteps.forEach((s) => {
                report += `- ${s.stepId}: ${s.error}\n`;
            });
        }
        report += `\n---\n\n📊 詳細を確認: http://localhost:3010\n`;
        return report;
    }
    /**
     * 会話履歴をクリア
     */
    clearHistory() {
        this.conversationHistory = [];
        logger.info('Conversation history cleared');
    }
    /**
     * 統計情報を取得
     */
    async getStatistics() {
        return await this.batchTools.getStatistics();
    }
}
/**
 * シングルトンインスタンス
 */
let enhancedChatAssistantInstance = null;
export function createEnhancedChatAssistant(storage, validationEngine) {
    if (!enhancedChatAssistantInstance) {
        enhancedChatAssistantInstance = new EnhancedAIChatAssistant(storage, validationEngine);
    }
    return enhancedChatAssistantInstance;
}
export function getEnhancedChatAssistant() {
    return enhancedChatAssistantInstance;
}
