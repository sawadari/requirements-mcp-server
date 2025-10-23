/**
 * AI Chat Assistant for Requirements Management
 *
 * Anthropic Claude APIを使用して、要求管理システムとの自然な対話を実現
 */

import Anthropic from '@anthropic-ai/sdk';
import { RequirementsStorage } from './storage.js';
import { ValidationEngine } from './validation/validation-engine.js';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatContext {
  allRequirements?: any[];
  recentRequirement?: any;
  conversationHistory: ChatMessage[];
}

export class AIChatAssistant {
  private anthropic: Anthropic | null = null;
  private storage: RequirementsStorage;
  private validator: ValidationEngine;
  private context: ChatContext;

  constructor(storage: RequirementsStorage, validator: ValidationEngine) {
    this.storage = storage;
    this.validator = validator;
    this.context = {
      conversationHistory: [],
    };

    // ANTHROPIC_API_KEYが設定されている場合のみ初期化
    const apiKey = process.env.ANTHROPIC_API_KEY;
    console.log('[AI Chat] ANTHROPIC_API_KEY status:', apiKey ? `Set (length: ${apiKey.length})` : 'NOT SET');

    if (apiKey) {
      this.anthropic = new Anthropic({
        apiKey: apiKey,
      });
      console.log('[AI Chat] ✅ Anthropic client initialized successfully');
    } else {
      console.log('[AI Chat] ⚠️  Anthropic client NOT initialized - API key missing');
    }
  }

  /**
   * AIが利用可能かチェック
   */
  isAvailable(): boolean {
    return this.anthropic !== null;
  }

  /**
   * システムプロンプトを生成
   */
  private async generateSystemPrompt(): Promise<string> {
    await this.storage.initialize();
    const allReqs = await this.storage.getAllRequirements();

    const stakeholderReqs = allReqs.filter(r => r.type === 'stakeholder');
    const systemReqs = allReqs.filter(r => r.type === 'system');
    const functionalReqs = allReqs.filter(r => r.type === 'system_functional' || r.type === 'functional');

    return `あなたは要求管理システムのAIアシスタントです。以下の情報を基にユーザーの質問に答えてください。

## システム概要
このシステムは、要求管理（Requirements Management）を支援するツールです。
要求の追加、検索、検証、依存関係分析、品質チェックなどの機能があります。

## 現在の要求データ
- 総要求数: ${allReqs.length}件
- ステークホルダ要求: ${stakeholderReqs.length}件
- システム要求: ${systemReqs.length}件
- 機能要求: ${functionalReqs.length}件

## 利用可能な機能
1. **要求の検索**: キーワードで要求を検索
2. **妥当性チェック**: 要求IDを指定して品質検証
3. **依存関係分析**: 要求の上位・下位関係を表示
4. **統計情報**: 要求の統計サマリを表示
5. **要求詳細**: 要求IDから詳細情報を取得

## 要求ID形式
- STK-XXX: ステークホルダ要求
- SYS-XXX: システム要求
- FUNC-XXX: 機能要求

## 回答のガイドライン
1. **具体的に**: 要求データを基に具体的な情報を提供
2. **簡潔に**: 必要な情報のみ、わかりやすく
3. **構造化**: Markdown形式で見やすく整形
4. **実行可能**: ユーザーが次にとるべきアクションを提案
5. **誠実に**: できないことは「できない」と明示

## できないこと
- 要求の追加・更新・削除（これらはツリービューから操作可能と案内）
- システム外部の情報取得
- コード生成や実装の詳細

ユーザーの質問に対して、親切で正確な回答を心がけてください。`;
  }

  /**
   * ユーザーメッセージを処理してAI応答を生成
   */
  async chat(userMessage: string): Promise<string> {
    if (!this.anthropic) {
      return this.getFallbackResponse(userMessage);
    }

    try {
      // 会話履歴に追加
      this.context.conversationHistory.push({
        role: 'user',
        content: userMessage,
      });

      // 要求データのコンテキストを準備
      await this.prepareContext(userMessage);

      // システムプロンプト生成
      const systemPrompt = await this.generateSystemPrompt();

      // 追加コンテキスト（要求データ）を生成
      const additionalContext = await this.generateAdditionalContext(userMessage);

      // Claude APIを呼び出し
      const response = await this.anthropic.messages.create({
        model: 'claude-3-7-sonnet-20250219',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [
          ...this.context.conversationHistory.slice(-10), // 最新10件の履歴
          {
            role: 'user',
            content: `${additionalContext}\n\n${userMessage}`,
          },
        ],
      });

      const assistantMessage = response.content[0].type === 'text'
        ? response.content[0].text
        : '';

      // 会話履歴に追加
      this.context.conversationHistory.push({
        role: 'assistant',
        content: assistantMessage,
      });

      // 履歴が長くなりすぎたら古いものを削除
      if (this.context.conversationHistory.length > 20) {
        this.context.conversationHistory = this.context.conversationHistory.slice(-20);
      }

      return assistantMessage;
    } catch (error: any) {
      console.error('AI Chat error:', error);

      // エラー時はフォールバック
      if (error.status === 401) {
        return '❌ API認証エラー: ANTHROPIC_API_KEYが無効です。環境変数を確認してください。';
      } else if (error.status === 429) {
        return '⚠️ APIレート制限に達しました。少し待ってから再度お試しください。';
      }

      return this.getFallbackResponse(userMessage);
    }
  }

  /**
   * コンテキストを準備（要求IDを検出して詳細取得）
   */
  private async prepareContext(message: string): Promise<void> {
    const idMatch = message.match(/([A-Z]+-\d+)/i);

    if (idMatch) {
      const reqId = idMatch[1].toUpperCase();
      try {
        const requirement = await this.storage.getRequirement(reqId);
        if (requirement) {
          this.context.recentRequirement = requirement;
        }
      } catch (error) {
        // 要求が見つからない場合は無視
      }
    }

    // 全要求データをキャッシュ（検索用）
    if (!this.context.allRequirements) {
      this.context.allRequirements = await this.storage.getAllRequirements();
    }
  }

  /**
   * 追加コンテキスト生成（要求データを含む）
   */
  private async generateAdditionalContext(message: string): Promise<string> {
    let context = '';

    // 要求IDが指定されている場合、その詳細を含める
    if (this.context.recentRequirement) {
      const req = this.context.recentRequirement;
      context += `\n## 指定された要求の詳細\n`;
      context += `- **ID**: ${req.id}\n`;
      context += `- **タイトル**: ${req.title}\n`;
      context += `- **タイプ**: ${req.type}\n`;
      context += `- **ステータス**: ${req.status}\n`;
      context += `- **優先度**: ${req.priority}\n`;
      context += `- **説明**: ${req.description}\n`;

      if (req.dependencies && req.dependencies.length > 0) {
        context += `- **依存関係**: ${req.dependencies.join(', ')}\n`;
      }

      if (req.refines && req.refines.length > 0) {
        context += `- **洗練**: ${req.refines.join(', ')}\n`;
      }
    }

    // 検索キーワードが含まれる場合、関連要求を含める
    if (message.includes('検索') || message.includes('探')) {
      const keywords = message.match(/「(.+?)」/);
      if (keywords && this.context.allRequirements) {
        const keyword = keywords[1];
        const results = this.context.allRequirements
          .filter(req =>
            req.title.includes(keyword) ||
            req.description.includes(keyword)
          )
          .slice(0, 5);

        if (results.length > 0) {
          context += `\n## 検索結果（キーワード: ${keyword}）\n`;
          results.forEach(req => {
            context += `- **${req.id}**: ${req.title}\n`;
          });
        }
      }
    }

    return context;
  }

  /**
   * フォールバック応答（AIが利用できない場合）
   */
  private getFallbackResponse(message: string): string {
    const messageLower = message.toLowerCase();

    if (messageLower.includes('妥当性') || messageLower.includes('チェック')) {
      return '✅ 妥当性チェック機能を使用するには、要求IDを指定してください。\n\n例: 「STK-001の妥当性をチェック」\n\n💡 AIチャット機能を使用するには、環境変数 `ANTHROPIC_API_KEY` を設定してください。';
    }

    if (messageLower.includes('検索')) {
      return '🔍 検索機能を使用するには、キーワードを「」で囲んで指定してください。\n\n例: 「搬送」を検索\n\n💡 AIチャット機能を使用するには、環境変数 `ANTHROPIC_API_KEY` を設定してください。';
    }

    return `こんにちは！要求管理システムのアシスタントです。🤖

現在、基本的な定型質問に対応しています。

## 利用可能な機能
1. 妥当性チェック: 「STK-001の妥当性をチェック」
2. 要求検索: 「搬送」を検索
3. 統計情報: 「統計を表示」
4. 依存関係: 「SYS-001の依存関係を分析」
5. 要求詳細: 「FUNC-001の詳細を表示」

## 💡 AIチャット機能を有効化
より自然な対話を行うには、環境変数 \`ANTHROPIC_API_KEY\` を設定してください。

\`\`\`bash
export ANTHROPIC_API_KEY=sk-ant-xxxxx
\`\`\`

設定後、サーバーを再起動してください。`;
  }

  /**
   * 会話履歴をクリア
   */
  clearHistory(): void {
    this.context.conversationHistory = [];
    this.context.recentRequirement = undefined;
  }
}

/**
 * シングルトンインスタンスを作成
 */
let chatAssistantInstance: AIChatAssistant | null = null;

export function createChatAssistant(
  storage: RequirementsStorage,
  validator: ValidationEngine
): AIChatAssistant {
  if (!chatAssistantInstance) {
    chatAssistantInstance = new AIChatAssistant(storage, validator);
  }
  return chatAssistantInstance;
}

export function getChatAssistant(): AIChatAssistant | null {
  return chatAssistantInstance;
}
