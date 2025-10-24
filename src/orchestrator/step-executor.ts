/**
 * Step Executor
 * 実行計画のステップを順次実行
 */

import Anthropic from '@anthropic-ai/sdk';
import { Step, ExecutionPlan } from './task-planner.js';
import { Intent } from './intent-analyzer.js';
import { RequirementsStorage } from '../storage.js';
import { ValidationTools } from '../tools/validation-tools.js';
import { BatchTools } from '../tools/batch-tools.js';
import { createLogger } from '../common/logger.js';

const logger = createLogger('StepExecutor');

export interface StepResult {
  stepId: string;
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
}

export interface ExecutionContext {
  intent: Intent;
  plan: ExecutionPlan;
  executedSteps: StepResult[];
  createdRequirements: any[];
  validationResults: any[];
}

export class StepExecutor {
  private anthropic: Anthropic | null = null;

  constructor(
    private storage: RequirementsStorage,
    private validationTools: ValidationTools,
    private batchTools: BatchTools
  ) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      this.anthropic = new Anthropic({ apiKey });
      logger.info('StepExecutor initialized with Anthropic API');
    } else {
      logger.warn('ANTHROPIC_API_KEY not set - AI generation disabled');
    }
  }

  /**
   * 実行計画を順次実行
   */
  async execute(plan: ExecutionPlan, intent: Intent): Promise<ExecutionContext> {
    logger.info(`Executing plan: ${plan.description}`);

    const context: ExecutionContext = {
      intent,
      plan,
      executedSteps: [],
      createdRequirements: [],
      validationResults: [],
    };

    for (const step of plan.steps) {
      // 依存関係チェック
      const canExecute = this.checkDependencies(step, context);
      if (!canExecute) {
        logger.warn(`Skipping step ${step.id} - dependencies not met`);
        continue;
      }

      // ステップ実行
      const startTime = Date.now();
      const result = await this.executeStep(step, context);
      result.duration = Date.now() - startTime;

      context.executedSteps.push(result);

      if (!result.success) {
        logger.error(`Step ${step.id} failed: ${result.error}`);
        break;
      }

      logger.info(`Step ${step.id} completed in ${result.duration}ms`);
    }

    return context;
  }

  /**
   * 単一ステップを実行
   */
  private async executeStep(step: Step, context: ExecutionContext): Promise<StepResult> {
    try {
      switch (step.type) {
        case 'ai_generation':
          return await this.executeAIGeneration(step, context);

        case 'mcp_call':
          return await this.executeMCPCall(step, context);

        case 'validation':
          return await this.executeValidation(step, context);

        case 'confirmation':
          return await this.executeConfirmation(step, context);

        default:
          throw new Error(`Unknown step type: ${step.type}`);
      }
    } catch (error: unknown) {
      const err = error as Error;
      logger.error(`Step ${step.id} error`, err);
      return {
        stepId: step.id,
        success: false,
        error: err.message,
        duration: 0,
      };
    }
  }

  /**
   * AI生成ステップ
   */
  private async executeAIGeneration(step: Step, context: ExecutionContext): Promise<StepResult> {
    if (!this.anthropic) {
      return {
        stepId: step.id,
        success: false,
        error: 'Anthropic API not available',
        duration: 0,
      };
    }

    const prompt = this.buildGenerationPrompt(step, context);

    const response = await this.anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 2048,
      system: this.buildSystemPrompt(step, context),
      messages: [{ role: 'user', content: prompt }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';

    // JSON形式のレスポンスをパース
    try {
      const generated = JSON.parse(text);
      return {
        stepId: step.id,
        success: true,
        data: generated,
        duration: 0,
      };
    } catch {
      // JSON以外の場合はテキストとして扱う
      return {
        stepId: step.id,
        success: true,
        data: { text },
        duration: 0,
      };
    }
  }

  /**
   * MCP呼び出しステップ
   */
  private async executeMCPCall(step: Step, context: ExecutionContext): Promise<StepResult> {
    const tool = step.tool!;
    const params = step.params || this.buildToolParams(step, context);

    logger.info(`Calling MCP tool: ${tool}`);

    switch (tool) {
      case 'batch_add_requirements':
        const requirements = this.extractRequirements(context);
        const result = await this.batchTools.batchAddRequirements(requirements);
        context.createdRequirements.push(...result.added);
        return {
          stepId: step.id,
          success: result.success,
          data: result,
          duration: 0,
        };

      case 'validate_requirements':
        const validationResult = params.requirementId
          ? await this.validationTools.validateRequirement(params.requirementId)
          : await this.validationTools.validateAllRequirements();
        context.validationResults.push(validationResult);
        return {
          stepId: step.id,
          success: true,
          data: validationResult,
          duration: 0,
        };
      case 'add_requirement':
        const reqData = this.extractRequirements(context)[0] || params;
        const addedReq = await this.storage.addRequirement(reqData);
        context.createdRequirements.push(addedReq);
        return {
          stepId: step.id,
          success: true,
          data: addedReq,
          duration: 0,
        };

      case 'update_requirement':
        const updateId = params.id?.toUpperCase() || params.id;
        const { id, ...updates } = params;
        const updatedReq = await this.storage.updateRequirement(updateId, updates);
        if (!updatedReq) {
          throw new Error(`Requirement not found: ${updateId}`);
        }
        return {
          stepId: step.id,
          success: true,
          data: updatedReq,
          duration: 0,
        };

      case 'get_requirement':
        const getId = params.id?.toUpperCase() || params.id;
        const requirement = await this.storage.getRequirement(getId);
        if (!requirement) {
          throw new Error(`Requirement not found: ${getId}`);
        }
        return {
          stepId: step.id,
          success: true,
          data: requirement,
          duration: 0,
        };

      case 'search_requirements':
        const searchResults = await this.storage.searchRequirements(params);
        return {
          stepId: step.id,
          success: true,
          data: searchResults,
          duration: 0,
        };


      default:
        return {
          stepId: step.id,
          success: false,
          error: `Unknown tool: ${tool}`,
          duration: 0,
        };
    }
  }

  /**
   * 検証ステップ
   */
  private async executeValidation(step: Step, context: ExecutionContext): Promise<StepResult> {
    const results = await this.validationTools.validateAllRequirements();
    context.validationResults.push(...results);

    const hasErrors = results.some(r => !r.isValid);

    return {
      stepId: step.id,
      success: true,
      data: {
        total: results.length,
        valid: results.filter(r => r.isValid).length,
        invalid: results.filter(r => !r.isValid).length,
        hasErrors,
      },
      duration: 0,
    };
  }

  /**
   * 確認ステップ（レポート生成）
   */
  private async executeConfirmation(step: Step, context: ExecutionContext): Promise<StepResult> {
    const report = this.generateReport(context);

    return {
      stepId: step.id,
      success: true,
      data: { report },
      duration: 0,
    };
  }

  /**
   * 依存関係チェック
   */
  private checkDependencies(step: Step, context: ExecutionContext): boolean {
    if (!step.dependencies || step.dependencies.length === 0) {
      return true;
    }

    return step.dependencies.every(depId => {
      const depResult = context.executedSteps.find(s => s.stepId === depId);
      return depResult && depResult.success;
    });
  }

  /**
   * システムプロンプト構築
   */
  private buildSystemPrompt(step: Step, context: ExecutionContext): string {
    const { intent } = context;

    if (step.description.includes('ステークホルダ要求')) {
      return `あなたは要求エンジニアリングの専門家です。
ユーザーの要求「${intent.rawMessage}」に基づいて、ステークホルダ要求を生成してください。

以下のJSON形式で返してください:
{
  "type": "stakeholder",
  "title": "要求のタイトル",
  "description": "詳細な説明（200文字以上）",
  "priority": "high",
  "category": "カテゴリ名",
  "rationale": "この要求が必要な理由"
}`;
    }

    if (step.description.includes('システム要求')) {
      const parentReq = context.createdRequirements[context.createdRequirements.length - 1];
      return `あなたは要求エンジニアリングの専門家です。
以下のステークホルダ要求を洗練（refine）するシステム要求を2-3件生成してください。

ステークホルダ要求:
${JSON.stringify(parentReq, null, 2)}

以下のJSON形式で返してください:
[
  {
    "type": "system",
    "title": "システム要求のタイトル",
    "description": "詳細な説明",
    "priority": "high",
    "category": "カテゴリ",
    "rationale": "理由",
    "refines": ["${parentReq.id}"]
  },
  ...
]`;
    }

    if (step.description.includes('機能要求')) {
      const systemReqs = context.createdRequirements.filter(r => r.type === 'system');
      return `あなたは要求エンジニアリングの専門家です。
以下のシステム要求を洗練（refine）する機能要求を各2-3件生成してください。

システム要求:
${JSON.stringify(systemReqs, null, 2)}

以下のJSON形式で返してください:
[
  {
    "type": "system_functional",
    "title": "機能要求のタイトル",
    "description": "詳細な説明",
    "priority": "medium",
    "category": "カテゴリ",
    "rationale": "理由",
    "refines": ["SYS-XXX"]
  },
  ...
]`;
    }

    return 'あなたは要求管理システムのアシスタントです。';
  }

  /**
   * 生成プロンプト構築
   */
  private buildGenerationPrompt(step: Step, context: ExecutionContext): string {
    return `${step.description}\n\nユーザーの意図: ${context.intent.rawMessage}`;
  }

  /**
   * ツールパラメータ構築
   */
  private buildToolParams(step: Step, context: ExecutionContext): any {
    return {};
  }

  /**
   * 生成された要求を抽出
   */
  private extractRequirements(context: ExecutionContext): any[] {
    const lastStep = context.executedSteps[context.executedSteps.length - 1];
    if (!lastStep || !lastStep.data) {
      return [];
    }

    const data = lastStep.data;

    // 配列の場合
    if (Array.isArray(data)) {
      return data;
    }

    // 単一オブジェクトの場合
    if (data.type) {
      return [data];
    }

    return [];
  }

  /**
   * レポート生成
   */
  private generateReport(context: ExecutionContext): string {
    const { createdRequirements, validationResults, executedSteps } = context;

    const successSteps = executedSteps.filter(s => s.success).length;
    const totalSteps = executedSteps.length;

    let report = `## ✅ 実行完了\n\n`;
    report += `- 実行ステップ: ${successSteps}/${totalSteps} 成功\n`;

    if (createdRequirements.length > 0) {
      report += `\n### 作成された要求 (${createdRequirements.length}件)\n\n`;
      createdRequirements.forEach(req => {
        report += `- **${req.id}**: ${req.title}\n`;
      });
    }

    if (validationResults.length > 0) {
      const allValid = validationResults.every((r: any) => {
        return Array.isArray(r) ? r.every((x: any) => x.isValid) : r.isValid;
      });
      report += `\n### 妥当性チェック\n`;
      report += allValid ? `✅ すべてクリア\n` : `⚠️ エラーあり\n`;
    }

    report += `\n詳細を確認: http://localhost:3010\n`;

    return report;
  }
}
