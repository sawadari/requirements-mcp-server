# 🚀 Next Steps - Requirements Chat

## ✅ 完成した機能（2025-10-24）

### Phase 1: MCP Layer ✅
- **ValidationTools**: 妥当性チェック、エラー取得、修正提案
- **BatchTools**: 一括追加、依存関係設定、統計取得
- index.tsへの統合完了

### Phase 2: AI Orchestration Layer ✅
- **IntentAnalyzer**: AI/ルールベースの意図分析（6種類のIntent対応）
- **TaskPlanner**: 実行計画自動生成（8ステッププラン）
- **StepExecutor**: ステップ順次実行、AI生成、MCP呼び出し
- **EnhancedAIChatAssistant**: Orchestrator統合版チャット

## 📁 作成されたファイル

```
requirements-mcp-server/
├── src/
│   ├── tools/
│   │   ├── validation-tools.ts         ✅ NEW
│   │   └── batch-tools.ts              ✅ NEW
│   ├── orchestrator/
│   │   ├── intent-analyzer.ts          ✅ NEW
│   │   ├── task-planner.ts             ✅ NEW
│   │   └── step-executor.ts            ✅ NEW
│   ├── enhanced-chat-assistant.ts      ✅ NEW
│   └── index.ts                        ✅ Updated
├── docs/
│   ├── REQUIREMENTS-CHAT-ARCHITECTURE.md  ✅
│   └── IMPLEMENTATION-GUIDE.md            ✅
├── ROADMAP.md                             ✅
├── test-orchestrator.ts                   ✅ NEW
└── NEXT-STEPS.md                          ✅ (このファイル)
```

## 🧪 テスト方法

### 1. ビルド
```bash
cd requirements-mcp-server
npm run build
```

### 2. Orchestratorのテスト
```bash
# test-orchestrator.tsを実行
tsx test-orchestrator.ts
```

### 3. 手動テスト

#### A. IntentAnalyzerのテスト
```typescript
import { IntentAnalyzer } from './src/orchestrator/intent-analyzer.js';

const analyzer = new IntentAnalyzer();

// テストケース1: 要求ツリー作成
const intent1 = await analyzer.analyze('ステークホルダ要求を追加して');
console.log(intent1);
// => { type: 'add_tree', confidence: 0.8, ... }

// テストケース2: 妥当性チェック
const intent2 = await analyzer.analyze('STK-001をチェック');
console.log(intent2);
// => { type: 'validate', entities: { requirementId: 'STK-001' }, ... }
```

#### B. TaskPlannerのテスト
```typescript
import { TaskPlanner } from './src/orchestrator/task-planner.js';

const planner = new TaskPlanner();
const plan = await planner.createPlan(intent1);

console.log(`Plan: ${plan.description}`);
console.log(`Steps: ${plan.steps.length}`);
plan.steps.forEach(step => console.log(`- ${step.description}`));
```

#### C. EnhancedChatAssistantのテスト
```typescript
import { EnhancedAIChatAssistant } from './src/enhanced-chat-assistant.js';

const assistant = new EnhancedAIChatAssistant(storage, validationEngine);

const response = await assistant.chat('セキュリティに関する要求を作成');
console.log(response);
```

## 🎯 次の実装タスク

### Priority 1: Web統合（最重要）

**目的**: WebビューアーでEnhancedChatAssistantを使えるようにする

**実装手順**:

1. **view-server.tsの修正**

```typescript
// src/view-server.ts に追加

import { createEnhancedChatAssistant } from './enhanced-chat-assistant.js';

// 初期化部分
const enhancedChatAssistant = createEnhancedChatAssistant(storage, validator);

// /api/chat エンドポイントを置き換え
app.post('/api/chat', express.json(), async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        response: '❌ メッセージが空です。'
      });
    }

    // EnhancedChatAssistantを使用
    const response = await enhancedChatAssistant.chat(message);

    res.json({ response });
  } catch (error: any) {
    console.error('Chat API error:', error);
    res.status(500).json({
      response: `❌ エラーが発生しました:\n\n${error.message}`
    });
  }
});
```

2. **テスト**

```bash
# ビューサーバー起動
npm run view-server

# ブラウザで http://localhost:3010 を開く
# チャットで「ステークホルダ要求を追加して」と入力
```

### Priority 2: エラーハンドリング強化

**課題**: 現在、AI生成が失敗した場合の処理が不十分

**実装内容**:
- リトライロジック（最大3回）
- フォールバック応答
- エラーログの詳細化

### Priority 3: ストリーミング応答

**目的**: リアルタイムで進捗を表示

**実装手順**:
1. Server-Sent Events (SSE) の実装
2. StepExecutorにプログレスコールバック追加
3. フロントエンドでSSE受信

### Priority 4: CLI Tool実装

**目的**: `npx requirements-chat` コマンド

**実装手順**:
1. `bin/requirements-chat.ts` 作成
2. package.jsonに`bin`フィールド追加
3. 対話モードの実装

## 📝 現在の制限事項

### 1. AI生成の精度
- システムプロンプトの改善が必要
- 生成される要求の品質がばらつく
- → **解決策**: Few-shot例の追加、プロンプトチューニング

### 2. 依存関係の自動設定
- refinesは設定されるが、dependenciesは手動
- → **解決策**: 依存関係分析ロジックの追加

### 3. エラーハンドリング
- ステップ失敗時のロールバックがない
- → **解決策**: トランザクション機構の実装

### 4. パフォーマンス
- 全ステップが順次実行（並列化なし）
- → **解決策**: 依存関係のないステップを並列実行

## 🔧 改善案

### 短期（1-2週間）
1. ✅ **Web統合** - view-server.tsへの組み込み
2. **エラーハンドリング強化** - リトライ、フォールバック
3. **ログ改善** - 詳細なデバッグログ

### 中期（3-4週間）
4. **ストリーミング応答** - SSE実装
5. **CLI Tool** - npx requirements-chat
6. **テストカバレッジ** - ユニット/統合テスト

### 長期（5週間以降）
7. **並列実行** - ステップの最適化
8. **LLM Evaluator統合** - より高精度な検証
9. **プラグインアーキテクチャ** - カスタムツール追加

## 💡 使い方

### Web Chat（統合後）

```
👤 ユーザー: セキュリティに関するステークホルダ要求を追加して

🤖 AI:
## ✅ 完了しました！

**実行ステップ**: 8/8 成功
**処理時間**: 45.3秒

### 作成された要求 (7件)

**ステークホルダ要求**:
- **STK-004**: アクセス制御の強化

**システム要求**:
- **SYS-007**: 認証システムの実装
- **SYS-008**: 監査ログの記録

**機能要求**:
- **FUNC-015**: マルチファクタ認証
- **FUNC-016**: ロールベースアクセス制御
- **FUNC-017**: ログ保存期間の設定
- **FUNC-018**: 不正アクセス検知

### 妥当性チェック

- ✅ 合格: 7件

---

📊 詳細を確認: http://localhost:3010
```

## 🐛 既知の問題

### Issue #1: API Key未設定時のエラー
**症状**: ANTHROPIC_API_KEYがない場合、AI生成がスキップされる
**回避策**: .envファイルにAPI Keyを設定
**恒久対応**: フォールバックロジックの改善

### Issue #2: 大量要求作成時のタイムアウト
**症状**: 10件以上の要求を一度に作成するとタイムアウト
**回避策**: バッチサイズを小さくする
**恒久対応**: タイムアウト設定の調整、並列実行

## 📚 参考資料

- [REQUIREMENTS-CHAT-ARCHITECTURE.md](./docs/REQUIREMENTS-CHAT-ARCHITECTURE.md) - 詳細設計
- [IMPLEMENTATION-GUIDE.md](./docs/IMPLEMENTATION-GUIDE.md) - 実装ガイド
- [ROADMAP.md](./ROADMAP.md) - 10週間のロードマップ
- [Anthropic Claude API](https://docs.anthropic.com/) - AI APIドキュメント

## 🎉 成果

たった数時間で、以下を実現しました：

1. ✅ MCPサーバーに新ツール追加（ValidationTools, BatchTools）
2. ✅ AI Orchestration Layer完成（IntentAnalyzer, TaskPlanner, StepExecutor）
3. ✅ EnhancedChatAssistant実装
4. ✅ ビルド成功、動作確認可能な状態

**次は Web統合で、実際にWebチャットから要求ツリーを自動生成できるようになります！** 🚀

---

**最終更新**: 2025-10-24
**ステータス**: Phase 1 & 2 完成、Phase 3 準備完了
