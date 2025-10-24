# Requirements Chat Architecture

## 🎯 ビジョン

**"Webビューアー上で `npx requirements-chat` が動作しているような体験"**

ユーザーが「ステークホルダ要求を追加して」と言うだけで：
1. 関連する下位要求をすべて自動生成
2. 依存関係を自動設定
3. 妥当性チェック＆自動修正
4. すべて完了してレポート表示

## 🏛️ 3層アーキテクチャ

```
┌─────────────────────────────────────────────┐
│          User Interface Layer               │
│  - Web Viewer Chat                          │
│  - CLI Tool (npx requirements-chat)         │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│          AI Orchestration Layer             │
│  - Intent Analysis (ユーザー意図判断)        │
│  - Task Planning (実行計画作成)              │
│  - Multi-step Execution (連鎖実行)           │
│  - Context Management (会話履歴)             │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│          MCP Server Layer                   │
│  - Requirements CRUD (機械的な操作)          │
│  - Validation Engine (検証)                  │
│  - Dependency Analysis (依存関係分析)        │
│  - Impact Analysis (影響範囲分析)            │
└─────────────────────────────────────────────┘
```

## 📦 Layer 1: MCP Server (機械的な情報授受)

### 既存ツール
- ✅ `add_requirement` - 要求追加
- ✅ `update_requirement` - 要求更新
- ✅ `delete_requirement` - 要求削除
- ✅ `search_requirements` - 検索
- ✅ `get_requirement` - 詳細取得
- ✅ `get_dependency_graph` - 依存関係グラフ
- ✅ `analyze_impact` - 影響範囲分析

### 追加が必要なツール
- 🆕 `validate_requirement` - 単一要求の妥当性チェック
- 🆕 `validate_all_requirements` - 全要求の一括検証
- 🆕 `get_validation_errors` - 検証エラー一覧取得
- 🆕 `suggest_fixes` - 修正提案生成
- 🆕 `apply_fix` - 修正の適用
- 🆕 `batch_add_requirements` - 複数要求の一括追加
- 🆕 `set_relationship` - 依存関係設定
- 🆕 `get_next_id` - 次の要求ID取得
- 🆕 `get_statistics` - 統計情報取得

## 🤖 Layer 2: AI Orchestration (意図判断・タスク調整)

### コンポーネント

#### 1. IntentAnalyzer (意図分析器)
ユーザーの発言を分析して実行すべきタスクを判断

```typescript
interface Intent {
  type: 'add_requirement' | 'add_tree' | 'validate' | 'search' | 'analyze' | 'fix';
  entities: {
    requirementType?: 'stakeholder' | 'system' | 'functional';
    requirementId?: string;
    keywords?: string[];
    scope?: 'single' | 'tree' | 'all';
  };
  confidence: number;
}
```

**例:**
- 「ステークホルダ要求を追加して」→ `add_tree` (下位要求も含む)
- 「STK-001をチェック」→ `validate` (単一)
- 「すべて検証」→ `validate` (全体)

#### 2. TaskPlanner (タスク計画器)
インテントからステップバイステップの実行計画を作成

```typescript
interface ExecutionPlan {
  steps: Step[];
  description: string;
  estimatedDuration: string;
}

interface Step {
  id: string;
  type: 'mcp_call' | 'ai_generation' | 'validation' | 'confirmation';
  tool?: string;
  params?: any;
  description: string;
  dependencies: string[]; // 依存する前ステップID
}
```

**例: 「ステークホルダ要求を追加」の実行計画**
```json
{
  "steps": [
    {
      "id": "step1",
      "type": "ai_generation",
      "description": "ステークホルダ要求の内容を生成",
      "dependencies": []
    },
    {
      "id": "step2",
      "type": "mcp_call",
      "tool": "add_requirement",
      "description": "ステークホルダ要求を追加 (STK-XXX)",
      "dependencies": ["step1"]
    },
    {
      "id": "step3",
      "type": "ai_generation",
      "description": "関連するシステム要求2-3件を生成",
      "dependencies": ["step2"]
    },
    {
      "id": "step4",
      "type": "mcp_call",
      "tool": "batch_add_requirements",
      "description": "システム要求を一括追加",
      "dependencies": ["step3"]
    },
    {
      "id": "step5",
      "type": "ai_generation",
      "description": "各システム要求に対する機能要求を生成",
      "dependencies": ["step4"]
    },
    {
      "id": "step6",
      "type": "mcp_call",
      "tool": "batch_add_requirements",
      "description": "機能要求を一括追加",
      "dependencies": ["step5"]
    },
    {
      "id": "step7",
      "type": "mcp_call",
      "tool": "validate_all_requirements",
      "description": "全要求の妥当性チェック",
      "dependencies": ["step6"]
    },
    {
      "id": "step8",
      "type": "mcp_call",
      "tool": "apply_fix",
      "description": "検証エラーを自動修正",
      "dependencies": ["step7"]
    },
    {
      "id": "step9",
      "type": "confirmation",
      "description": "完了レポート生成",
      "dependencies": ["step8"]
    }
  ],
  "description": "ステークホルダ要求とその下位要求ツリーを作成",
  "estimatedDuration": "30-60秒"
}
```

#### 3. StepExecutor (ステップ実行器)
計画された各ステップを順次実行

```typescript
class StepExecutor {
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

#### 4. ContextManager (コンテキスト管理)
会話履歴とタスク実行状態を管理

```typescript
interface ExecutionContext {
  conversationHistory: ChatMessage[];
  currentPlan?: ExecutionPlan;
  executedSteps: StepResult[];
  createdRequirements: Requirement[];
  validationResults: ValidationResult[];
}
```

## 💬 Layer 3: User Interface

### A. Web Viewer Chat (既存)
- Webビューアー上のチャットUI
- バックエンドでOrchestratorを呼び出し
- ストリーミング応答対応

### B. CLI Tool (新規)
```bash
npx requirements-chat
```

**機能:**
1. **対話モード**: 連続した会話
2. **単発実行**: `npx requirements-chat "ステークホルダ要求を追加"`
3. **自動補完**: タブ補完で要求ID、コマンド候補
4. **カラー出力**: 見やすいMarkdownレンダリング
5. **進捗表示**: マルチステップ実行時のプログレスバー

**技術スタック:**
- `commander` - CLI引数パース
- `inquirer` - 対話的プロンプト
- `chalk` - カラー出力
- `ora` - スピナー・プログレスバー
- `marked-terminal` - Markdownレンダリング

## 🔄 実行フロー例

### シナリオ: 「セキュリティに関するステークホルダ要求を追加して」

```
1. User Input
   ↓
2. IntentAnalyzer
   → Intent: add_tree (stakeholder, category: security)
   ↓
3. TaskPlanner
   → 9-step ExecutionPlan 生成
   ↓
4. User Confirmation (optional)
   "以下の手順で実行します:
    1. ステークホルダ要求を生成
    2. 関連システム要求を生成
    3. 機能要求を生成
    4. 依存関係を設定
    5. 妥当性チェック
    6. 自動修正
   よろしいですか？ [Y/n]"
   ↓
5. StepExecutor (順次実行)
   Step 1: AI生成 → STK-004の内容生成
   Step 2: MCP call → add_requirement(STK-004)
   Step 3: AI生成 → SYS-007, SYS-008の内容生成
   Step 4: MCP call → batch_add_requirements([SYS-007, SYS-008])
   Step 5: AI生成 → FUNC-015, FUNC-016, FUNC-017生成
   Step 6: MCP call → batch_add_requirements([FUNC-015~017])
   Step 7: MCP call → validate_all_requirements()
   Step 8: MCP call → apply_fix(errors)
   ↓
6. Report Generation
   "✅ 完了しました！

   作成された要求:
   - STK-004: アクセス制御の強化
   - SYS-007: 認証システムの実装
   - SYS-008: 監査ログの記録
   - FUNC-015: マルチファクタ認証
   - FUNC-016: ロールベースアクセス制御
   - FUNC-017: ログ保存期間の設定

   妥当性チェック: ✅ すべてクリア
   依存関係: ✅ 正しく設定

   詳細を確認: http://localhost:3010"
```

## 📁 ファイル構成

```
requirements-mcp-server/
├── src/
│   ├── index.ts                    # MCPサーバーエントリポイント
│   ├── storage.ts                  # データストレージ
│   ├── validation/                 # 検証エンジン
│   │   └── validation-engine.ts
│   ├── tools/                      # MCPツール (Layer 1)
│   │   ├── requirement-tools.ts    # 既存CRUD
│   │   └── validation-tools.ts     # 🆕 検証ツール
│   ├── orchestrator/               # 🆕 AI層 (Layer 2)
│   │   ├── intent-analyzer.ts
│   │   ├── task-planner.ts
│   │   ├── step-executor.ts
│   │   └── context-manager.ts
│   ├── ai-chat-assistant.ts        # 既存チャット (強化)
│   ├── cli/                        # 🆕 CLI層 (Layer 3)
│   │   ├── requirements-chat.ts    # CLIエントリポイント
│   │   ├── ui-renderer.ts          # UI表示
│   │   └── progress-tracker.ts     # 進捗管理
│   └── view-server.ts              # Webビューアーサーバー
├── bin/
│   └── requirements-chat.js        # 🆕 npxエントリポイント
├── package.json
└── docs/
    └── REQUIREMENTS-CHAT-ARCHITECTURE.md  # このファイル
```

## 🎯 実装優先順位

### Phase 1: MCP Layer強化 (1-2日)
- [ ] `validate_requirement` ツール追加
- [ ] `batch_add_requirements` ツール追加
- [ ] `set_relationship` ツール追加
- [ ] `suggest_fixes` / `apply_fix` ツール追加

### Phase 2: Orchestrator実装 (2-3日)
- [ ] IntentAnalyzer実装
- [ ] TaskPlanner実装
- [ ] StepExecutor実装
- [ ] ContextManager実装

### Phase 3: CLI Tool実装 (2-3日)
- [ ] `requirements-chat` コマンド作成
- [ ] 対話モード実装
- [ ] 進捗表示UI実装
- [ ] Markdownレンダリング

### Phase 4: Web統合 (1-2日)
- [ ] view-server.tsにOrchestrator統合
- [ ] ストリーミング応答対応
- [ ] 進捗表示UI (Web版)

### Phase 5: テスト・ドキュメント (1-2日)
- [ ] ユニットテスト追加
- [ ] 統合テストシナリオ
- [ ] ユーザーガイド作成

## 🔧 技術的な考慮事項

### 1. AIモデル選択
- **意図分析**: Claude 3.5 Haiku (高速・低コスト)
- **要求生成**: Claude 3.5 Sonnet (高品質)
- **計画作成**: Claude 3.5 Sonnet

### 2. エラーハンドリング
- ステップ失敗時のロールバック機能
- リトライロジック (最大3回)
- エラー時のユーザーへのフィードバック

### 3. パフォーマンス
- 並列実行可能なステップの検出
- キャッシング (要求データ、検証結果)
- ストリーミング応答でUX向上

### 4. セキュリティ
- API Key管理 (環境変数)
- 入力サニタイゼーション
- レート制限

## 📊 成功指標

1. **機能性**:
   - ユーザーが「要求追加」と言うだけで下位要求ツリー完成
   - 妥当性チェック＆自動修正が動作

2. **UX**:
   - 応答時間 < 10秒 (通常の要求追加)
   - 応答時間 < 60秒 (ツリー作成)
   - 進捗が可視化されている

3. **信頼性**:
   - エラー率 < 5%
   - 自動修正成功率 > 80%

## 🚀 次のステップ

1. Phase 1のMCPツール追加から開始
2. 各Phaseごとに動作確認
3. 早期にプロトタイプをデモ

---

**作成日**: 2025-10-24
**バージョン**: 1.0
**ステータス**: Design Complete - Ready for Implementation
