const fs = require('fs');

const content = fs.readFileSync('src/view-server.ts', 'utf8');

// Find and replace the /api/chat endpoint
const oldEndpoint = `app.post('/api/chat', express.json(), async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        response: '❌ メッセージが空です。質問を入力してください。'
      });
    }

    // AIチャットアシスタントの準備完了を待つ
    const assistant = await ensureChatAssistantReady();
    const response = await assistant.chat(message);

    res.json({ response });
  } catch (error: any) {
    console.error('Chat API error:', error);
    res.status(500).json({
      response: \`❌ エラーが発生しました:\n\n\${error.message}\n\nもう一度お試しください。\`
    });
  }
});`;

const newEndpoint = `app.post('/api/chat', express.json(), async (req, res) => {
  try {
    const { message, useEnhanced } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({
        response: '❌ メッセージが空です。質問を入力してください。'
      });
    }

    // Enhanced Chat Assistant (Orchestrator)を優先使用
    if (enhancedChatReady && enhancedChatAssistant.isAvailable()) {
      console.log('[Chat] Using Enhanced Chat Assistant (Orchestrator)');
      const response = await enhancedChatAssistant.chat(message);
      res.json({ response });
    } else {
      // Fallback to basic chat assistant
      console.log('[Chat] Using Basic Chat Assistant');
      const assistant = await ensureChatAssistantReady();
      const response = await assistant.chat(message);
      res.json({ response });
    }
  } catch (error: any) {
    console.error('Chat API error:', error);
    res.status(500).json({
      response: \`❌ エラーが発生しました:\n\n\${error.message}\n\nもう一度お試しください。\`
    });
  }
});`;

const updated = content.replace(oldEndpoint, newEndpoint);

if (updated === content) {
  console.error('❌ Failed to find and replace endpoint');
  process.exit(1);
}

fs.writeFileSync('src/view-server.ts', updated);
console.log('✅ /api/chat endpoint updated');
