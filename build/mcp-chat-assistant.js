/**
 * MCP-Integrated AI Chat Assistant
 *
 * MCPサーバーのツールを直接使用する統合型チャットアシスタント
 */
import Anthropic from '@anthropic-ai/sdk';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';
import { createLogger } from './common/logger.js';
const logger = createLogger('MCPChatAssistant');
export class MCPChatAssistant {
    anthropic = null;
    mcpClient = null;
    mcpProcess = null;
    conversationHistory = [];
    availableTools = [];
    isInitialized = false;
    constructor() {
        const apiKey = process.env.ANTHROPIC_API_KEY;
        if (apiKey) {
            this.anthropic = new Anthropic({ apiKey });
            logger.info('Anthropic client initialized');
        }
        else {
            logger.warn('ANTHROPIC_API_KEY not set');
        }
    }
    /**
     * MCPサーバーに接続
     */
    async initialize() {
        if (this.isInitialized) {
            return;
        }
        try {
            // MCPサーバープロセスを起動
            logger.info('Starting MCP server process...');
            // Node.jsでMCPサーバーを起動
            this.mcpProcess = spawn('node', ['build/index.js'], {
                cwd: process.cwd(),
                stdio: ['pipe', 'pipe', 'pipe'],
            });
            // MCPクライアントを作成
            this.mcpClient = new Client({
                name: 'requirements-chat-client',
                version: '1.0.0',
            }, {
                capabilities: {},
            });
            // トランスポート接続
            const transport = new StdioClientTransport({
                command: 'node',
                args: ['build/index.js'],
                cwd: process.cwd(),
            });
            await this.mcpClient.connect(transport);
            logger.info('Connected to MCP server');
            // 利用可能なツールを取得
            const toolsResponse = await this.mcpClient.listTools();
            if (toolsResponse && toolsResponse.tools) {
                this.availableTools = toolsResponse.tools;
                logger.info(`Loaded ${this.availableTools.length} tools from MCP server`);
            }
            this.isInitialized = true;
        }
        catch (error) {
            logger.error('Failed to initialize MCP connection', error);
            throw error;
        }
    }
    /**
     * AIが利用可能かチェック
     */
    isAvailable() {
        return this.anthropic !== null && this.isInitialized;
    }
    /**
     * MCPツールをAnthropic Tool形式に変換
     */
    convertMCPToolsToAnthropicFormat() {
        return this.availableTools.map(tool => ({
            name: tool.name,
            description: tool.description,
            input_schema: tool.inputSchema,
        }));
    }
    /**
     * MCPツールを実行
     */
    async executeMCPTool(name, args) {
        if (!this.mcpClient) {
            throw new Error('MCP client not initialized');
        }
        try {
            logger.info(`Executing MCP tool: ${name}`, { args });
            const result = await this.mcpClient.callTool({
                name,
                arguments: args,
            });
            logger.info(`Tool ${name} executed successfully`);
            return result;
        }
        catch (error) {
            logger.error(`Tool ${name} execution failed`, error);
            throw error;
        }
    }
    /**
     * チャット処理（ツール使用対応）
     */
    async chat(userMessage) {
        if (!this.anthropic) {
            return '❌ Anthropic APIキーが設定されていません。';
        }
        if (!this.isInitialized) {
            try {
                await this.initialize();
            }
            catch (error) {
                return `❌ MCPサーバーへの接続に失敗しました: ${error.message}`;
            }
        }
        try {
            // 会話履歴に追加
            this.conversationHistory.push({
                role: 'user',
                content: userMessage,
            });
            // システムプロンプト
            const systemPrompt = this.generateSystemPrompt();
            // Claude APIを呼び出し
            let response = await this.anthropic.messages.create({
                model: 'claude-3-7-sonnet-20250219',
                max_tokens: 4096,
                system: systemPrompt,
                tools: this.convertMCPToolsToAnthropicFormat(),
                messages: this.conversationHistory.slice(-10),
            });
            let finalText = '';
            let continueLoop = true;
            // ツール使用ループ（複数ラウンド対応）
            while (continueLoop) {
                continueLoop = false;
                const toolUses = [];
                const toolResults = [];
                for (const block of response.content) {
                    if (block.type === 'text') {
                        finalText += block.text;
                    }
                    else if (block.type === 'tool_use') {
                        toolUses.push(block);
                        // MCPツールを実行
                        try {
                            const result = await this.executeMCPTool(block.name, block.input);
                            toolResults.push({
                                type: 'tool_result',
                                tool_use_id: block.id,
                                content: JSON.stringify(result),
                            });
                        }
                        catch (error) {
                            toolResults.push({
                                type: 'tool_result',
                                tool_use_id: block.id,
                                content: JSON.stringify({ error: error.message }),
                                is_error: true,
                            });
                        }
                    }
                }
                // ツールが使用された場合、続きを生成
                if (toolResults.length > 0) {
                    this.conversationHistory.push({
                        role: 'assistant',
                        content: response.content,
                    });
                    this.conversationHistory.push({
                        role: 'user',
                        content: toolResults,
                    });
                    // 次のラウンド
                    response = await this.anthropic.messages.create({
                        model: 'claude-3-7-sonnet-20250219',
                        max_tokens: 4096,
                        system: systemPrompt,
                        tools: this.convertMCPToolsToAnthropicFormat(),
                        messages: this.conversationHistory.slice(-10),
                    });
                    continueLoop = true;
                }
            }
            // 最終応答を履歴に追加
            this.conversationHistory.push({
                role: 'assistant',
                content: finalText,
            });
            // 履歴管理
            if (this.conversationHistory.length > 20) {
                this.conversationHistory = this.conversationHistory.slice(-20);
            }
            return finalText;
        }
        catch (error) {
            logger.error('Chat error', error);
            if (error.status === 401) {
                return '❌ API認証エラー: ANTHROPIC_API_KEYが無効です。';
            }
            else if (error.status === 429) {
                return '⚠️ APIレート制限に達しました。少し待ってから再度お試しください。';
            }
            return `❌ エラーが発生しました: ${error.message}`;
        }
    }
    /**
     * システムプロンプトを生成
     */
    generateSystemPrompt() {
        const toolsList = this.availableTools
            .map(t => `- **${t.name}**: ${t.description}`)
            .join('\n');
        return `あなたは要求管理システムのAIアシスタントです。

## あなたの役割
ユーザーの要求管理に関する質問に答え、MCPサーバーのツールを使って実際の操作を実行します。

## 利用可能なツール
${toolsList}

## 応答のガイドライン
1. **具体的に**: ツールを活用して実データに基づいた回答を提供
2. **簡潔に**: 必要な情報のみ、わかりやすく
3. **構造化**: Markdown形式で見やすく整形
4. **実行可能**: ユーザーが次にとるべきアクションを提案
5. **誠実に**: できないことは「できない」と明示

## 要求ID形式
- STK-XXX: ステークホルダ要求
- SYS-XXX: システム要求
- FUNC-XXX: 機能要求
- REQ-XXX: 一般要求

## 重要な注意事項
- ツールの使用前に、必要なパラメータが揃っているか確認すること
- エラーが発生した場合は、ユーザーに分かりやすく説明すること
- 複数のステップが必要な場合は、順序立てて実行すること

ユーザーの質問に対して、親切で正確な回答を心がけてください。`;
    }
    /**
     * 会話履歴をクリア
     */
    clearHistory() {
        this.conversationHistory = [];
        logger.info('Conversation history cleared');
    }
    /**
     * クリーンアップ
     */
    async dispose() {
        if (this.mcpClient) {
            await this.mcpClient.close();
            this.mcpClient = null;
        }
        if (this.mcpProcess) {
            this.mcpProcess.kill();
            this.mcpProcess = null;
        }
        this.isInitialized = false;
        logger.info('MCPChatAssistant disposed');
    }
}
/**
 * シングルトンインスタンスを作成
 */
let instance = null;
export async function createMCPChatAssistant() {
    if (!instance) {
        instance = new MCPChatAssistant();
        await instance.initialize();
    }
    return instance;
}
export async function getMCPChatAssistant() {
    return instance;
}
