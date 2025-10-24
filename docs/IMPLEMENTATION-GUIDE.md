# Requirements Chat 実装ガイド

## 🎯 プロジェクトの目標

**「Webビューアー上で `npx requirements-chat` が動作しているような体験」を実現する**

- ユーザーが「ステークホルダ要求を追加して」と言うだけで
- 関連する下位要求をすべて自動生成
- 依存関係を自動設定
- 妥当性チェック＆自動修正
- すべて完了してレポート表示

## 📐 アーキテクチャ

詳細は [REQUIREMENTS-CHAT-ARCHITECTURE.md](./REQUIREMENTS-CHAT-ARCHITECTURE.md) を参照。

**3層構造：**
1. **MCP Server Layer** - 機械的な情報授受（CRUD、検証、分析）
2. **AI Orchestration Layer** - 意図判断・タスク調整
3. **User Interface Layer** - Web Chat、CLI Tool

## 🚀 実装ロードマップ

### Phase 1: MCP Layer強化 ✅（設計完了）

**新規追加ツール：**

1. **ValidationTools** (`src/tools/validation-tools.ts`)
   - `validateRequirement(id)` - 単一要求の妥当性チェック
   - `validateAllRequirements()` - 全要求の一括検証
   - `getValidationErrors()` - エラー一覧取得
   - `suggestFixes()` - 修正提案生成
   - `applyFix(id, field, value)` - 修正適用
   - `autoFixAll()` - 全エラー自動修正

2. **BatchTools** (`src/tools/batch-tools.ts`)
   - `batchAddRequirements(reqs[])` - 複数要求の一括追加
   - `batchSetRelationships(rels[])` - 依存関係の一括設定
   - `generateNextId(type)` - 次の要求ID生成
   - `getStatistics()` - 統計情報取得
   - `createRequirementTree()` - 要求ツリー一括作成

**実装状況：**
- ✅ 基本構造設計完了
- ⏳ 型エラー修正中（既存ValidationEngineとの統合）
- 🔜 index.tsへの統合

### Phase 2: AI Orchestration Layer 🔜

**コンポーネント構成：**

```
src/orchestrator/
├── intent-analyzer.ts      # ユーザー意図分析
├── task-planner.ts         # タスク計画作成
├── step-executor.ts        # ステップ実行
└── context-manager.ts      # コンテキスト管理
```

#### 2.1 IntentAnalyzer

```typescript
export interface Intent {
  type: 'add_requirement' | 'add_tree' | 'validate' | 'search' | 'analyze' | 'fix';
  entities: {
    requirementType?: 'stakeholder' | 'system' | 'functional';
    requirementId?: string;
    keywords?: string[];
    scope?: 'single' | 'tree' | 'all';
  };
  confidence: number;
}

export class IntentAnalyzer {
  async analyze(userMessage: string): Promise<Intent> {
    // Anthropic Claude APIで意図を分析
    // 「ステークホルダ要求を追加」→ add_tree
    // 「STK-001をチェック」→ validate (single)
  }
}
```

#### 2.2 TaskPlanner

```typescript
export interface ExecutionPlan {
  steps: Step[];
  description: string;
  estimatedDuration: string;
}

export interface Step {
  id: string;
  type: 'mcp_call' | 'ai_generation' | 'validation' | 'confirmation';
  tool?: string;
  params?: any;
  description: string;
  dependencies: string[];
}

export class TaskPlanner {
  async createPlan(intent: Intent): Promise<ExecutionPlan> {
    // インテントからステップを生成
    // 例: add_tree → 9ステップの実行計画
  }
}
```

#### 2.3 StepExecutor

```typescript
export class StepExecutor {
  async executeStep(step: Step, context: ExecutionContext): Promise<StepResult> {
    switch (step.type) {
      case 'mcp_call':
        return await this.callMCPTool(step.tool, step.params);
      case 'ai_generation':
        return await this.generateWithAI(step.description, context);
      case 'validation':
        return await this.validate(context);
      case 'confirmation':
        return await this.generateReport(context);
    }
  }
}
```

**実装優先度：**
- High: IntentAnalyzer（意図分析がコア機能）
- High: TaskPlanner（実行計画生成）
- Medium: StepExecutor（順次実行）
- Low: ContextManager（会話履歴管理）

### Phase 3: CLI Tool 🔜

```
src/cli/
├── requirements-chat.ts    # CLIエントリポイント
├── ui-renderer.ts          # UI表示（Markdown、進捗バー）
└── progress-tracker.ts     # 進捗管理

bin/
└── requirements-chat.js    # npxエントリポイント
```

**技術スタック：**
- `commander` - CLI引数パース
- `inquirer` - 対話的プロンプト
- `chalk` - カラー出力
- `ora` - スピナー・プログレスバー
- `marked-terminal` - Markdownレンダリング

**使い方：**
```bash
# 対話モード
npx requirements-chat

# 単発実行
npx requirements-chat "ステークホルダ要求を追加"

# オプション
npx requirements-chat --help
npx requirements-chat --json  # JSON出力
```

### Phase 4: Web統合 🔜

**view-server.tsへの統合：**
1. Orchestratorのインスタンス化
2. `/api/chat` エンドポイントの拡張
3. ストリーミング応答対応
4. 進捗表示UI（Web版）

**現在の実装：**
```typescript
// src/ai-chat-assistant.ts
export class AIChatAssistant {
  async chat(userMessage: string): Promise<string> {
    // 単純な要求追加のみ対応
    // ツール: add_requirement
  }
}
```

**拡張後：**
```typescript
// src/ai-chat-assistant.ts (強化版)
export class EnhancedAIChatAssistant {
  private orchestrator: RequirementOrchestrator;

  async chat(userMessage: string): Promise<string> {
    // 1. 意図分析
    const intent = await this.orchestrator.analyzeIntent(userMessage);

    // 2. 実行計画作成
    const plan = await this.orchestrator.createPlan(intent);

    // 3. 実行
    const result = await this.orchestrator.execute(plan);

    // 4. レポート生成
    return this.generateReport(result);
  }
}
```

## 🔨 実装手順

### ステップ1: MCPツールの追加

**1.1 ValidationToolsの実装**

```bash
cd requirements-mcp-server
```

`src/tools/validation-tools.ts` を作成（既存ValidationEngineを活用）

```typescript
import { ValidationEngine } from '../validation/validation-engine.js';
import { RequirementsStorage } from '../storage.js';

export class ValidationTools {
  constructor(
    private storage: RequirementsStorage,
    private validationEngine: ValidationEngine
  ) {}

  async validateRequirement(id: string): Promise<ValidationResult> {
    const requirement = await this.storage.getRequirement(id);
    const allReqs = await this.getAllRequirementsMap();

    return await this.validationEngine.validateRequirement(
      requirement,
      allReqs,
      { useLLM: false, updateMetrics: false }
    );
  }

  // ... 他のメソッド
}
```

**1.2 BatchToolsの実装**

`src/tools/batch-tools.ts` を作成

```typescript
export class BatchTools {
  async batchAddRequirements(
    requirements: BatchRequirementInput[]
  ): Promise<BatchAddResult> {
    const added: Requirement[] = [];

    for (const reqInput of requirements) {
      const newId = await this.generateNextId(reqInput.type);
      const req = this.createRequirement(newId, reqInput);
      await this.storage.addRequirement(req);
      added.push(req);
    }

    return { success: true, added };
  }
}
```

**1.3 index.tsへの統合**

```typescript
// src/index.ts
import { ValidationTools } from './tools/validation-tools.js';
import { BatchTools } from './tools/batch-tools.js';

class RequirementsMCPServer {
  private validationTools: ValidationTools;
  private batchTools: BatchTools;

  constructor() {
    this.validationTools = new ValidationTools(this.storage, this.validationEngine);
    this.batchTools = new BatchTools(this.storage);

    // ... ツール登録
  }

  private getTools(): Tool[] {
    return [
      // 既存ツール
      ...this.existingTools,

      // 新規ツール
      {
        name: 'validate_requirement_tool',
        description: 'Validate a single requirement',
        inputSchema: zodToJsonSchema(ValidateRequirementSchema),
      },
      {
        name: 'batch_add_requirements',
        description: 'Add multiple requirements at once',
        inputSchema: zodToJsonSchema(BatchAddRequirementsSchema),
      },
      // ...
    ];
  }
}
```

### ステップ2: Orchestratorの実装

**2.1 IntentAnalyzerの実装**

```typescript
// src/orchestrator/intent-analyzer.ts
export class IntentAnalyzer {
  constructor(private anthropic: Anthropic) {}

  async analyze(userMessage: string): Promise<Intent> {
    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022', // 高速・低コスト
      max_tokens: 1024,
      system: `あなたは要求管理システムの意図分析AIです。
ユーザーの発言から以下のいずれかの意図を判定してください:
- add_requirement: 単一要求の追加
- add_tree: 要求ツリー（ステークホルダ→システム→機能）の作成
- validate: 妥当性チェック
- search: 要求検索
- analyze: 依存関係分析
- fix: 自動修正

JSON形式で返してください:
{
  "type": "add_tree",
  "entities": {
    "requirementType": "stakeholder",
    "scope": "tree"
  },
  "confidence": 0.95
}`,
      messages: [{ role: 'user', content: userMessage }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
    return JSON.parse(text);
  }
}
```

**2.2 TaskPlannerの実装**

```typescript
// src/orchestrator/task-planner.ts
export class TaskPlanner {
  createPlanForAddTree(intent: Intent): ExecutionPlan {
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
          tool: 'add_requirement',
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
        // ... 続く
      ],
      description: 'ステークホルダ要求とその下位要求ツリーを作成',
      estimatedDuration: '30-60秒',
    };
  }
}
```

**2.3 StepExecutorの実装**

```typescript
// src/orchestrator/step-executor.ts
export class StepExecutor {
  constructor(
    private anthropic: Anthropic,
    private mcpClient: MCPClient
  ) {}

  async executeStep(step: Step, context: ExecutionContext): Promise<StepResult> {
    switch (step.type) {
      case 'mcp_call':
        return await this.callMCPTool(step.tool!, step.params);

      case 'ai_generation':
        return await this.generateWithAI(step.description, context);

      case 'validation':
        return await this.validate(context);

      case 'confirmation':
        return await this.generateReport(context);
    }
  }

  private async callMCPTool(tool: string, params: any): Promise<StepResult> {
    const result = await this.mcpClient.callTool({ name: tool, arguments: params });
    return { success: true, data: result };
  }

  private async generateWithAI(description: string, context: ExecutionContext): Promise<StepResult> {
    // Claude APIで要求内容を生成
    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2048,
      system: `あなたは要求エンジニアリングの専門家です。
${description}

これまでのコンテキスト:
${JSON.stringify(context.createdRequirements, null, 2)}`,
      messages: [{ role: 'user', content: description }],
    });

    const text = response.content[0].type === 'text' ? response.content[0].text : '';
    return { success: true, data: text };
  }
}
```

### ステップ3: AI Chat Assistantの強化

**3.1 Orchestratorの統合**

```typescript
// src/ai-chat-assistant.ts (強化版)
import { IntentAnalyzer } from './orchestrator/intent-analyzer.js';
import { TaskPlanner } from './orchestrator/task-planner.js';
import { StepExecutor } from './orchestrator/step-executor.js';

export class EnhancedAIChatAssistant {
  private intentAnalyzer: IntentAnalyzer;
  private taskPlanner: TaskPlanner;
  private stepExecutor: StepExecutor;

  async chat(userMessage: string): Promise<string> {
    // 1. 意図分析
    const intent = await this.intentAnalyzer.analyze(userMessage);

    if (intent.confidence < 0.7) {
      return this.askForClarification(userMessage);
    }

    // 2. 実行計画作成
    const plan = await this.taskPlanner.createPlan(intent);

    // 3. 確認（オプション）
    // ユーザーに計画を提示

    // 4. 実行
    const context: ExecutionContext = {
      conversationHistory: this.context.conversationHistory,
      currentPlan: plan,
      executedSteps: [],
      createdRequirements: [],
      validationResults: [],
    };

    for (const step of plan.steps) {
      const result = await this.stepExecutor.executeStep(step, context);
      context.executedSteps.push({ step, result });

      // 進捗通知（Webの場合はストリーミング）
      this.notifyProgress(step, result);
    }

    // 5. レポート生成
    return this.generateReport(context);
  }

  private generateReport(context: ExecutionContext): string {
    const created = context.createdRequirements;

    return `✅ 完了しました！

作成された要求:
${created.map(req => `- ${req.id}: ${req.title}`).join('\n')}

妥当性チェック: ✅ すべてクリア
依存関係: ✅ 正しく設定

詳細を確認: http://localhost:3010`;
  }
}
```

### ステップ4: CLI Toolの実装

**4.1 package.jsonの設定**

```json
{
  "name": "requirements-mcp-server",
  "version": "0.2.0",
  "bin": {
    "requirements-chat": "./bin/requirements-chat.js"
  },
  "scripts": {
    "build:cli": "tsc && chmod +x bin/requirements-chat.js"
  },
  "dependencies": {
    "commander": "^11.0.0",
    "inquirer": "^9.2.0",
    "chalk": "^5.3.0",
    "ora": "^7.0.1",
    "marked-terminal": "^6.0.0"
  }
}
```

**4.2 CLIエントリポイント**

```typescript
// bin/requirements-chat.ts
#!/usr/bin/env node

import { Command } from 'commander';
import { RequirementsChatCLI } from '../src/cli/requirements-chat.js';

const program = new Command();

program
  .name('requirements-chat')
  .description('要求管理システムの対話型CLI')
  .version('0.2.0')
  .argument('[message]', '実行するメッセージ（省略時は対話モード）')
  .option('--json', 'JSON形式で出力')
  .option('-v, --verbose', '詳細な出力')
  .action(async (message, options) => {
    const cli = new RequirementsChatCLI();

    if (message) {
      // 単発実行
      await cli.executeOnce(message, options);
    } else {
      // 対話モード
      await cli.startInteractive(options);
    }
  });

program.parse();
```

**4.3 対話モードの実装**

```typescript
// src/cli/requirements-chat.ts
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';
import { marked } from 'marked';
import TerminalRenderer from 'marked-terminal';

export class RequirementsChatCLI {
  private assistant: EnhancedAIChatAssistant;

  async startInteractive(options: any): Promise<void> {
    console.log(chalk.cyan('🤖 Requirements Chat へようこそ！'));
    console.log(chalk.gray('終了するには "exit" または Ctrl+C を押してください\n'));

    while (true) {
      const { message } = await inquirer.prompt([
        {
          type: 'input',
          name: 'message',
          message: chalk.green('あなた:'),
        },
      ]);

      if (message.toLowerCase() === 'exit') {
        console.log(chalk.cyan('さようなら！'));
        break;
      }

      const spinner = ora('考え中...').start();

      try {
        const response = await this.assistant.chat(message);
        spinner.stop();

        // Markdownレンダリング
        marked.setOptions({ renderer: new TerminalRenderer() });
        console.log('\n' + marked(response) + '\n');
      } catch (error) {
        spinner.fail('エラーが発生しました');
        console.error(chalk.red((error as Error).message));
      }
    }
  }

  async executeOnce(message: string, options: any): Promise<void> {
    const response = await this.assistant.chat(message);

    if (options.json) {
      console.log(JSON.stringify({ message, response }, null, 2));
    } else {
      marked.setOptions({ renderer: new TerminalRenderer() });
      console.log(marked(response));
    }
  }
}
```

## 🧪 テスト戦略

### ユニットテスト

```typescript
// tests/orchestrator/intent-analyzer.test.ts
describe('IntentAnalyzer', () => {
  it('should detect add_tree intent', async () => {
    const analyzer = new IntentAnalyzer(mockAnthropic);
    const intent = await analyzer.analyze('ステークホルダ要求を追加して');

    expect(intent.type).toBe('add_tree');
    expect(intent.entities.requirementType).toBe('stakeholder');
    expect(intent.confidence).toBeGreaterThan(0.7);
  });
});
```

### 統合テスト

```typescript
// tests/integration/orchestrator.test.ts
describe('Full Orchestration', () => {
  it('should create requirement tree', async () => {
    const assistant = new EnhancedAIChatAssistant(storage, validator);
    const response = await assistant.chat('セキュリティに関するステークホルダ要求を追加');

    // 作成された要求を確認
    const allReqs = await storage.getAllRequirements();
    const stk = allReqs.find(r => r.type === 'stakeholder');
    const sys = allReqs.filter(r => r.type === 'system');
    const func = allReqs.filter(r => r.type === 'system_functional');

    expect(stk).toBeDefined();
    expect(sys.length).toBeGreaterThan(0);
    expect(func.length).toBeGreaterThan(0);

    // 依存関係を確認
    sys.forEach(s => {
      expect(s.refines).toContain(stk!.id);
    });
  });
});
```

## 📈 パフォーマンス最適化

### 1. 並列実行

```typescript
// 依存関係のないステップを並列実行
const parallelSteps = plan.steps.filter(s => s.dependencies.length === 0);
await Promise.all(parallelSteps.map(s => executor.executeStep(s, context)));
```

### 2. キャッシング

```typescript
// 要求データをメモリにキャッシュ
private requirementsCache: Map<string, Requirement> = new Map();

async getRequirement(id: string): Promise<Requirement> {
  if (this.requirementsCache.has(id)) {
    return this.requirementsCache.get(id)!;
  }

  const req = await this.storage.getRequirement(id);
  this.requirementsCache.set(id, req);
  return req;
}
```

### 3. ストリーミング応答

```typescript
// Claude APIのストリーミングを活用
const stream = await this.anthropic.messages.stream({
  model: 'claude-3-5-sonnet-20241022',
  messages: [{ role: 'user', content: prompt }],
});

for await (const chunk of stream) {
  if (chunk.type === 'content_block_delta') {
    // リアルタイムでクライアントに送信
    this.sendChunkToClient(chunk.delta.text);
  }
}
```

## 🚦 次のステップ

1. **Phase 1完了**: MCPツールの型エラー修正＆ビルド成功
2. **Phase 2開始**: IntentAnalyzerの実装
3. **Phase 2**: TaskPlannerの実装
4. **Phase 2**: StepExecutorの実装
5. **Phase 3**: CLI Toolの実装
6. **Phase 4**: Web統合
7. **テスト**: ユニットテスト＆統合テスト
8. **ドキュメント**: ユーザーガイドの作成

## 📚 参考資料

- [REQUIREMENTS-CHAT-ARCHITECTURE.md](./REQUIREMENTS-CHAT-ARCHITECTURE.md) - アーキテクチャ設計
- [AI-CHAT-INTEGRATION.md](../AI-CHAT-INTEGRATION.md) - 現在のAI Chat実装
- [Anthropic Claude API](https://docs.anthropic.com/) - AI APIドキュメント
- [MCP SDK](https://github.com/modelcontextprotocol/sdk) - MCPサーバーSDK

---

**作成日**: 2025-10-24
**バージョン**: 1.0
**ステータス**: Implementation Ready
