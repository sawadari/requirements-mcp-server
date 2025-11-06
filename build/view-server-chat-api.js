// AI Chat API エンドポイント
// view-server.tsの2325-2624行目を置き換える新しいコード
import { createChatAssistant } from './ai-chat-assistant.js';
// グローバルスコープでchatAssistantを初期化（view-server.tsに追加）
const chatAssistant = createChatAssistant(storage, validator);
// 新しいチャットAPIエンドポイント
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
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
