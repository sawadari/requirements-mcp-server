#!/bin/bash

# AI Chat統合パッチスクリプト

echo "🔧 AI Chat統合パッチを適用します..."

cd "$(dirname "$0")/.."

# 1. view-server.tsにimport文を追加
echo "📝 import文を追加..."

# ファイルの先頭部分を確認
if ! grep -q "ai-chat-assistant" src/view-server.ts; then
  # import文を追加（storageのimportの後に追加）
  sed -i '/import.*storage/a import { createChatAssistant } from '\''./ai-chat-assistant.js'\'';' src/view-server.ts
  echo "✅ import文を追加しました"
else
  echo "✅ import文は既に存在します"
fi

# 2. chatAssistant初期化コードを追加
echo "📝 chatAssistant初期化コードを追加..."

if ! grep -q "createChatAssistant" src/view-server.ts; then
  # storageとvalidatorの初期化後に追加
  sed -i '/const validator = new ValidationEngine/a \\nconst chatAssistant = createChatAssistant(storage, validator);' src/view-server.ts
  echo "✅ 初期化コードを追加しました"
else
  echo "✅ 初期化コードは既に存在します"
fi

# 3. チャットAPIエンドポイントを置き換え
echo "📝 チャットAPIエンドポイントを置き換え..."

# バックアップを作成
cp src/view-server.ts src/view-server.ts.backup

# Pythonスクリプトで置き換え
python3 << 'PYTHON_SCRIPT'
import re

with open('src/view-server.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 既存のチャットAPIエンドポイントを検索
pattern = r"app\.post\('/api/chat'.*?\}\);[\s\n]*\}\);"
new_endpoint = """app.post('/api/chat', express.json(), async (req, res) => {
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
      response: `❌ エラーが発生しました:\\n\\n${error.message}\\n\\nもう一度お試しください。`
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
});"""

# 置き換え
content_new = re.sub(pattern, new_endpoint, content, flags=re.DOTALL)

with open('src/view-server.ts', 'w', encoding='utf-8') as f:
    f.write(content_new)

print("✅ チャットAPIエンドポイントを置き換えました")
PYTHON_SCRIPT

echo ""
echo "🎉 パッチ適用完了！"
echo ""
echo "次のステップ:"
echo "1. npm run build でビルド"
echo "2. ANTHROPIC_API_KEY=sk-ant-xxx npm run view-server でサーバー起動"
echo ""
