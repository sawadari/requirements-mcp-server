/**
 * AI Chat統合パッチスクリプト
 * view-server.tsにAIチャット機能を統合
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 AI Chat統合パッチを適用します...\n');

const viewServerPath = path.join(__dirname, '../src/view-server.ts');

// ファイルを読み込み
let content = fs.readFileSync(viewServerPath, 'utf-8');

// 1. import文を追加
console.log('📝 Step 1: import文を追加...');
if (!content.includes('ai-chat-assistant')) {
  content = content.replace(
    "import { RequirementValidator } from './validator.js';",
    "import { RequirementValidator } from './validator.js';\nimport { createChatAssistant } from './ai-chat-assistant.js';"
  );
  console.log('✅ import文を追加しました');
} else {
  console.log('✅ import文は既に存在します');
}

// 2. chatAssistant初期化を追加
console.log('\n📝 Step 2: chatAssistant初期化を追加...');
if (!content.includes('createChatAssistant')) {
  content = content.replace(
    'const validator = new RequirementValidator(storage);',
    `const validator = new RequirementValidator(storage);

// AI Chat Assistant
const chatAssistant = createChatAssistant(storage, validator);`
  );
  console.log('✅ 初期化コードを追加しました');
} else {
  console.log('✅ 初期化コードは既に存在します');
}

// 3. チャットAPIエンドポイントを置き換え
console.log('\n📝 Step 3: チャットAPIエンドポイントを置き換え...');

const newChatAPI = `app.post('/api/chat', express.json(), async (req, res) => {
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
      response: \`❌ エラーが発生しました:\\n\\n\${error.message}\\n\\nもう一度お試しください。\`
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
});`;

// 既存のチャットAPIエンドポイントを置き換え
const chatAPIPattern = /app\.post\('\/api\/chat',[\s\S]*?\n\}\);/;
if (chatAPIPattern.test(content)) {
  content = content.replace(chatAPIPattern, newChatAPI);
  console.log('✅ チャットAPIエンドポイントを置き換えました');
} else {
  console.log('⚠️ 既存のチャットAPIエンドポイントが見つかりませんでした');
}

// ファイルに書き込み
fs.writeFileSync(viewServerPath, content, 'utf-8');

console.log('\n🎉 パッチ適用完了！\n');
console.log('次のステップ:');
console.log('1. npm run build でビルド');
console.log('2. 環境変数を設定:');
console.log('   Windows: set ANTHROPIC_API_KEY=sk-ant-xxx');
console.log('   Linux/Mac: export ANTHROPIC_API_KEY=sk-ant-xxx');
console.log('3. npm run view-server でサーバー起動\n');
