# AIチャット機能の統合手順

WebビューアーにAnthropic Claude APIを使った自然な対話機能を追加します。

## 📦 作成済みファイル

1. **`src/ai-chat-assistant.ts`** - AIチャットアシスタントモジュール（完成）
2. **`scripts/patch-chat-ai.cjs`** - view-server.tsへのパッチスクリプト（完成）

## 🔧 統合手順

### 1. パッケージのインストール（完了✅）

```bash
npm install @anthropic-ai/sdk
```

### 2. view-server.tsの手動編集

**A. import文の追加**

`src/view-server.ts`の14行目付近に以下を追加：

```typescript
import { createChatAssistant } from './ai-chat-assistant.js';
```

**B. chatAssistant初期化の追加**

20行目付近の`const validator`の直後に追加：

```typescript
// AI Chat Assistant
const chatAssistant = createChatAssistant(storage, validator);
```

**C. チャットAPIエンドポイントの置き換え**

`app.post('/api/chat'...`のセクション（約2325-2624行）を以下に置き換え：

```typescript
app.post('/api/chat', express.json(), async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        response: '❌ メッセージが空です。質問を入力してください。'
      });
    }

    // AIチャットアシスタントを使用
    const response = await chatAssistant.chat(message);

    res.json({ response });
  } catch (error: any) {
    console.error('Chat API error:', error);
    res.status(500).json({
      response: `❌ エラーが発生しました:\n\n${error.message}\n\nもう一度お試しください。`
    });
  }
});

// 会話履歴クリアエンドポイント
app.post('/api/chat/clear', express.json(), async (req, res) => {
  try {
    chatAssistant.clearHistory();
    res.json({ success: true, message: '会話履歴をクリアしました。' });
  } catch (error: any) {
    console.error('Chat clear error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// AI利用可能状態の確認エンドポイント
app.get('/api/chat/status', async (req, res) => {
  try {
    const isAvailable = chatAssistant.isAvailable();
    res.json({
      aiEnabled: isAvailable,
      message: isAvailable
        ? 'AIチャット機能が有効です'
        : 'AIチャット機能を使用するには ANTHROPIC_API_KEY を設定してください'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

### 3. ビルド

```bash
npm run build
```

### 4. 環境変数の設定

**Windows:**
```cmd
set ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
```

**Linux/Mac:**
```bash
export ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
```

または、`.env`ファイルに追加：
```env
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx
```

### 5. サーバー起動

```bash
npm run view-server
```

## ✨ 機能

### AIチャット（ANTHROPIC_API_KEY設定時）

- **自然な対話**: 定型質問だけでなく、自由な質問に対応
- **コンテキスト認識**: 要求データを理解して回答
- **会話履歴**: 過去の対話を記憶（最新20件）
- **要求ID検出**: 質問中の要求IDを自動検出し詳細を取得

### フォールバック（API Key未設定時）

- 定型質問（妥当性チェック、検索、統計等）に対応
- API Key設定方法を案内

## 💬 使用例

### 例1: 要求の詳細質問

```
ユーザー: STK-001について教えて

AI: STK-001は「ロボットによる搬送作業の自動化」に関するステークホルダ要求です。

【詳細】
- タイトル: ロボットによる搬送作業の自動化
- ステータス: approved
- 優先度: high
- 説明: 製造部門が、ロボットを使用して工場内の部品搬送作業を自動化することを要求する...

この要求は2件のシステム要求（SYS-001, SYS-002）に洗練されています。
```

### 例2: 自由な質問

```
ユーザー: 画像認識に関する要求はある？

AI: はい、画像認識に関する要求がいくつかあります：

1. **FUNC-001**: 画像認識による物体検出
   - カメラ画像から物体の位置・形状・色を抽出し、機械学習モデルで種類を判定

2. **FUNC-002**: 障害物検知
   - カメラとLiDARで障害物を検出し回避

これらの要求は、自律移動ロボットの認識機能を実現するためのものです。
```

### 例3: 依存関係の質問

```
ユーザー: SYS-001に依存している要求は？

AI: SYS-001「自律移動機能の実装」に依存している要求は以下の通りです：

【下位要求（洗練）】
- FUNC-003: 経路計画
- FUNC-004: 移動制御
- FUNC-005: センサー統合

これらの機能要求により、システム要求が具体的な実装レベルに詳細化されています。
```

## 🛠️ トラブルシューティング

### ビルドエラー

```
error TS2304: Cannot find name 'chatAssistant'
```

→ `const chatAssistant = createChatAssistant(...)`の初期化が追加されていません。手順2-Bを確認してください。

### API認証エラー

```
❌ API認証エラー: ANTHROPIC_API_KEYが無効です
```

→ API Keyが正しく設定されているか確認してください。

### レート制限

```
⚠️ APIレート制限に達しました
```

→ Anthropicのレート制限に達しています。少し待ってから再試行してください。

## 📚 技術詳細

### システムプロンプト

AIは以下の情報を基に回答します：

- 要求データの統計（総数、タイプ別件数）
- 利用可能な機能リスト
- 要求ID形式の説明
- 回答ガイドライン（具体的、簡潔、構造化、実行可能、誠実）

### コンテキスト追加

質問に応じて自動的に以下を追加：

- 指定された要求IDの詳細
- 検索キーワードに関連する要求リスト（最大5件）

### 会話履歴管理

- 最新20件の会話を保持
- メモリ節約のため古い履歴は自動削除
- `/api/chat/clear`でクリア可能

## 🎯 次の改善案

1. **ストリーミング応答**: リアルタイムで回答を表示
2. **要求の追加・更新**: チャットから直接要求を操作
3. **検証提案**: 品質問題を検出して修正提案
4. **依存関係可視化**: Mermaidダイアグラムで図示
5. **多言語対応**: 英語・日本語の切り替え

---

**作成日**: 2025-10-23
**対応バージョン**: requirements-mcp-server v0.1.0
