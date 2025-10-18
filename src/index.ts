#!/usr/bin/env node

/**
 * 要求管理MCPサーバー
 * Claude Codeと統合して対話的な要求管理を実現
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { RequirementsStorage } from './storage.js';
import { ImpactAnalyzer } from './analyzer.js';
import { ViewExporter } from './views.js';
import { Requirement, RequirementStatus, RequirementPriority, ChangeProposal } from './types.js';
import { OperationLogger } from './operation-logger.js';
import { RequirementValidator } from './validator.js';

// Zodスキーマの定義
const AddRequirementSchema = z.object({
  title: z.string().min(1).describe('要求のタイトル'),
  description: z.string().describe('要求の詳細説明'),
  priority: z.enum(['critical', 'high', 'medium', 'low']).describe('優先度'),
  category: z.string().describe('カテゴリ'),
  tags: z.array(z.string()).optional().describe('タグ'),
  dependencies: z.array(z.string()).optional().describe('依存する要求のID'),
  author: z.string().optional().describe('作成者'),
  assignee: z.string().optional().describe('担当者'),
});

const UpdateRequirementSchema = z.object({
  id: z.string().describe('更新する要求のID'),
  title: z.string().optional().describe('新しいタイトル'),
  description: z.string().optional().describe('新しい説明'),
  status: z.enum(['draft', 'proposed', 'approved', 'in_progress', 'completed', 'rejected', 'on_hold']).optional().describe('新しいステータス'),
  priority: z.enum(['critical', 'high', 'medium', 'low']).optional().describe('新しい優先度'),
  category: z.string().optional().describe('新しいカテゴリ'),
  tags: z.array(z.string()).optional().describe('新しいタグ'),
  dependencies: z.array(z.string()).optional().describe('新しい依存関係'),
  assignee: z.string().optional().describe('新しい担当者'),
});

const GetRequirementSchema = z.object({
  id: z.string().describe('取得する要求のID'),
});

const SearchRequirementsSchema = z.object({
  status: z.string().optional().describe('ステータスで絞り込み'),
  priority: z.string().optional().describe('優先度で絞り込み'),
  category: z.string().optional().describe('カテゴリで絞り込み'),
  tags: z.array(z.string()).optional().describe('タグで絞り込み'),
  searchText: z.string().optional().describe('タイトルまたは説明で検索'),
});

const DeleteRequirementSchema = z.object({
  id: z.string().describe('削除する要求のID'),
});

const AnalyzeImpactSchema = z.object({
  id: z.string().describe('影響範囲を分析する要求のID'),
  proposedChanges: z.any().optional().describe('提案する変更内容（オプション）'),
});

const GetDependencyGraphSchema = z.object({
  id: z.string().describe('依存関係グラフを取得する要求のID'),
});

const ProposeChangeSchema = z.object({
  targetRequirementId: z.string().describe('変更対象の要求ID'),
  proposedChanges: z.array(z.object({
    field: z.string().describe('変更するフィールド'),
    currentValue: z.any().optional().describe('現在の値'),
    proposedValue: z.any().optional().describe('提案する値'),
    reason: z.string().describe('変更理由'),
  })).describe('提案する変更内容'),
});

const ValidateRequirementSchema = z.object({
  id: z.string().describe('妥当性チェックする要求のID'),
});

class RequirementsMCPServer {
  private server: Server;
  private storage: RequirementsStorage;
  private analyzer: ImpactAnalyzer;
  private viewExporter: ViewExporter;
  private logger: OperationLogger;
  private validator: RequirementValidator;

  constructor() {
    this.storage = new RequirementsStorage('./data');
    this.analyzer = new ImpactAnalyzer(this.storage);
    this.viewExporter = new ViewExporter(this.storage);
    this.logger = new OperationLogger('./data');
    this.validator = new RequirementValidator(this.storage);

    // ビュー自動更新コールバックを設定
    this.storage.setViewUpdateCallback(async () => {
      try {
        console.error('Updating views automatically...');
        await this.viewExporter.exportAllViews('./views');
        console.error('Views updated successfully');
      } catch (error) {
        console.error('Failed to update views:', error);
      }
    });

    this.server = new Server(
      {
        name: 'requirements-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers(): void {
    // ツール一覧の提供
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: this.getTools(),
      };
    });

    // ツール実行
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'add_requirement':
            return await this.handleAddRequirement(args);
          case 'get_requirement':
            return await this.handleGetRequirement(args);
          case 'list_requirements':
            return await this.handleListRequirements();
          case 'update_requirement':
            return await this.handleUpdateRequirement(args);
          case 'delete_requirement':
            return await this.handleDeleteRequirement(args);
          case 'search_requirements':
            return await this.handleSearchRequirements(args);
          case 'analyze_impact':
            return await this.handleAnalyzeImpact(args);
          case 'get_dependency_graph':
            return await this.handleGetDependencyGraph(args);
          case 'propose_change':
            return await this.handleProposeChange(args);
          case 'validate_requirement':
            return await this.handleValidateRequirement(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text' as const,
              text: `Error: ${error.message}`,
            },
          ],
        };
      }
    });
  }

  private getTools(): Tool[] {
    return [
      {
        name: 'add_requirement',
        description: '新しい要求を追加します。タイトル、説明、優先度、カテゴリなどを指定できます。',
        inputSchema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: '要求のタイトル' },
            description: { type: 'string', description: '要求の詳細説明' },
            priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'], description: '優先度' },
            category: { type: 'string', description: 'カテゴリ' },
            tags: { type: 'array', items: { type: 'string' }, description: 'タグ' },
            dependencies: { type: 'array', items: { type: 'string' }, description: '依存する要求のID' },
            author: { type: 'string', description: '作成者' },
            assignee: { type: 'string', description: '担当者' },
          },
          required: ['title', 'description', 'priority', 'category'],
        },
      },
      {
        name: 'get_requirement',
        description: '指定されたIDの要求を取得します。',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '取得する要求のID' },
          },
          required: ['id'],
        },
      },
      {
        name: 'list_requirements',
        description: 'すべての要求の一覧を取得します。',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'update_requirement',
        description: '既存の要求を更新します。変更したいフィールドのみ指定してください。',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '更新する要求のID' },
            title: { type: 'string', description: '新しいタイトル' },
            description: { type: 'string', description: '新しい説明' },
            status: { type: 'string', enum: ['draft', 'proposed', 'approved', 'in_progress', 'completed', 'rejected', 'on_hold'], description: '新しいステータス' },
            priority: { type: 'string', enum: ['critical', 'high', 'medium', 'low'], description: '新しい優先度' },
            category: { type: 'string', description: '新しいカテゴリ' },
            tags: { type: 'array', items: { type: 'string' }, description: '新しいタグ' },
            dependencies: { type: 'array', items: { type: 'string' }, description: '新しい依存関係' },
            assignee: { type: 'string', description: '新しい担当者' },
          },
          required: ['id'],
        },
      },
      {
        name: 'delete_requirement',
        description: '指定されたIDの要求を削除します。',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '削除する要求のID' },
          },
          required: ['id'],
        },
      },
      {
        name: 'search_requirements',
        description: '条件を指定して要求を検索します。',
        inputSchema: {
          type: 'object',
          properties: {
            status: { type: 'string', description: 'ステータスで絞り込み' },
            priority: { type: 'string', description: '優先度で絞り込み' },
            category: { type: 'string', description: 'カテゴリで絞り込み' },
            tags: { type: 'array', items: { type: 'string' }, description: 'タグで絞り込み' },
            searchText: { type: 'string', description: 'タイトルまたは説明で検索' },
          },
        },
      },
      {
        name: 'analyze_impact',
        description: '要求の変更がシステムに与える影響を分析します。影響を受ける要求、推定工数、リスク、推奨事項を返します。',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '影響範囲を分析する要求のID' },
            proposedChanges: { type: 'object', description: '提案する変更内容（オプション）' },
          },
          required: ['id'],
        },
      },
      {
        name: 'get_dependency_graph',
        description: '要求の依存関係グラフを取得します。可視化に利用できます。',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '依存関係グラフを取得する要求のID' },
          },
          required: ['id'],
        },
      },
      {
        name: 'propose_change',
        description: '要求に対する変更提案を作成します。影響範囲の分析結果も含まれます。',
        inputSchema: {
          type: 'object',
          properties: {
            targetRequirementId: { type: 'string', description: '変更対象の要求ID' },
            proposedChanges: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string', description: '変更するフィールド' },
                  currentValue: { description: '現在の値' },
                  proposedValue: { description: '提案する値' },
                  reason: { type: 'string', description: '変更理由' },
                },
                required: ['field', 'currentValue', 'proposedValue', 'reason'],
              },
            },
          },
          required: ['targetRequirementId', 'proposedChanges'],
        },
      },
      {
        name: 'validate_requirement',
        description: '要求の妥当性をチェックします。上位・下位要求との整合性、詳細化、分解、粒度などを検証します。',
        inputSchema: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '妥当性チェックする要求のID' },
          },
          required: ['id'],
        },
      },
    ];
  }

  private async handleAddRequirement(args: any) {
    const params = AddRequirementSchema.parse(args);

    const requirement: Requirement = {
      id: `REQ-${Date.now()}`,
      title: params.title,
      description: params.description,
      status: 'draft' as RequirementStatus,
      priority: params.priority as RequirementPriority,
      category: params.category,
      tags: params.tags || [],
      dependencies: params.dependencies || [],
      createdAt: new Date(),
      updatedAt: new Date(),
      author: params.author,
      assignee: params.assignee,
    };

    const added = await this.storage.addRequirement(requirement);

    return {
      content: [
        {
          type: 'text' as const,
          text: `要求を追加しました:\n\n${JSON.stringify(added, null, 2)}`,
        },
      ],
    };
  }

  private async handleGetRequirement(args: any) {
    const params = GetRequirementSchema.parse(args);
    const requirement = await this.storage.getRequirement(params.id);

    if (!requirement) {
      throw new Error(`Requirement ${params.id} not found`);
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(requirement, null, 2),
        },
      ],
    };
  }

  private async handleListRequirements() {
    const requirements = await this.storage.getAllRequirements();

    return {
      content: [
        {
          type: 'text' as const,
          text: `全要求一覧 (${requirements.length}件):\n\n${JSON.stringify(requirements, null, 2)}`,
        },
      ],
    };
  }

  private async handleUpdateRequirement(args: any) {
    const params = UpdateRequirementSchema.parse(args);
    const { id, ...updates } = params;

    const updated = await this.storage.updateRequirement(id, updates);

    if (!updated) {
      throw new Error(`Requirement ${id} not found`);
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: `要求を更新しました:\n\n${JSON.stringify(updated, null, 2)}`,
        },
      ],
    };
  }

  private async handleDeleteRequirement(args: any) {
    const params = DeleteRequirementSchema.parse(args);
    const deleted = await this.storage.deleteRequirement(params.id);

    if (!deleted) {
      throw new Error(`Requirement ${params.id} not found`);
    }

    return {
      content: [
        {
          type: 'text' as const,
          text: `要求 ${params.id} を削除しました`,
        },
      ],
    };
  }

  private async handleSearchRequirements(args: any) {
    const params = SearchRequirementsSchema.parse(args);
    const results = await this.storage.searchRequirements(params);

    return {
      content: [
        {
          type: 'text' as const,
          text: `検索結果 (${results.length}件):\n\n${JSON.stringify(results, null, 2)}`,
        },
      ],
    };
  }

  private async handleAnalyzeImpact(args: any) {
    const params = AnalyzeImpactSchema.parse(args);
    const analysis = await this.analyzer.analyzeImpact(
      params.id,
      params.proposedChanges
    );

    return {
      content: [
        {
          type: 'text' as const,
          text: `影響範囲分析:\n\n${JSON.stringify(analysis, null, 2)}`,
        },
      ],
    };
  }

  private async handleGetDependencyGraph(args: any) {
    const params = GetDependencyGraphSchema.parse(args);
    const graph = await this.analyzer.getDependencyGraph(params.id);

    return {
      content: [
        {
          type: 'text' as const,
          text: `依存関係グラフ:\n\n${JSON.stringify(graph, null, 2)}`,
        },
      ],
    };
  }

  private async handleProposeChange(args: any) {
    const params = ProposeChangeSchema.parse(args);

    // 影響分析を実行
    const proposedChangesObj: any = {};
    for (const change of params.proposedChanges) {
      proposedChangesObj[change.field] = change.proposedValue;
    }

    const impactAnalysis = await this.analyzer.analyzeImpact(
      params.targetRequirementId,
      proposedChangesObj
    );

    // 変更提案を作成
    const proposal: ChangeProposal = {
      id: `PROP-${Date.now()}`,
      targetRequirementId: params.targetRequirementId,
      proposedChanges: params.proposedChanges,
      impactAnalysis,
      status: 'pending',
      createdAt: new Date(),
    };

    const added = await this.storage.addProposal(proposal);

    return {
      content: [
        {
          type: 'text' as const,
          text: `変更提案を作成しました:\n\n${JSON.stringify(added, null, 2)}`,
        },
      ],
    };
  }

  private async handleValidateRequirement(args: any) {
    const params = ValidateRequirementSchema.parse(args);
    const report = await this.validator.validate(params.id);

    // レポートを整形
    let text = `## 要求妥当性チェック結果\n\n`;
    text += `**要求ID**: ${report.requirementId}\n`;
    text += `**タイトル**: ${report.requirementTitle}\n`;
    text += `**チェック日時**: ${report.timestamp.toLocaleString('ja-JP')}\n\n`;
    text += `**妥当性**: ${report.isValid ? '✅ 妥当' : '❌ 問題あり'}\n`;
    text += `- エラー: ${report.errorCount}件\n`;
    text += `- 警告: ${report.warningCount}件\n`;
    text += `- 情報: ${report.infoCount}件\n\n`;

    if (report.results.length > 0) {
      text += `### 詳細\n\n`;

      const errors = report.results.filter(r => r.severity === 'error');
      const warnings = report.results.filter(r => r.severity === 'warning');
      const infos = report.results.filter(r => r.severity === 'info');

      if (errors.length > 0) {
        text += `#### ❌ エラー\n\n`;
        for (const result of errors) {
          text += `**[${result.ruleId}] ${result.ruleName}**\n`;
          text += `- ${result.message}\n`;
          if (result.suggestion) {
            text += `- 💡 提案: ${result.suggestion}\n`;
          }
          text += `\n`;
        }
      }

      if (warnings.length > 0) {
        text += `#### ⚠️ 警告\n\n`;
        for (const result of warnings) {
          text += `**[${result.ruleId}] ${result.ruleName}**\n`;
          text += `- ${result.message}\n`;
          if (result.suggestion) {
            text += `- 💡 提案: ${result.suggestion}\n`;
          }
          text += `\n`;
        }
      }

      if (infos.length > 0) {
        text += `#### ℹ️ 情報\n\n`;
        for (const result of infos) {
          text += `**[${result.ruleId}] ${result.ruleName}**\n`;
          text += `- ${result.message}\n`;
          if (result.suggestion) {
            text += `- 💡 提案: ${result.suggestion}\n`;
          }
          text += `\n`;
        }
      }
    } else {
      text += `すべてのチェックに合格しました！\n`;
    }

    return {
      content: [
        {
          type: 'text' as const,
          text,
        },
      ],
    };
  }

  async start(): Promise<void> {
    await this.storage.initialize();
    await this.logger.initialize();
    await this.validator.initialize();

    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    console.error('Requirements MCP Server running on stdio');
  }
}

// サーバー起動
const server = new RequirementsMCPServer();
server.start().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
