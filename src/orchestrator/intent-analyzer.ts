/**
 * Intent Analyzer
 * ユーザーの発言から意図を分析
 */

import Anthropic from '@anthropic-ai/sdk';
import { createLogger } from '../common/logger.js';

const logger = createLogger('IntentAnalyzer');

export interface Intent {
  type: 'add_requirement' | 'add_tree' | 'validate' | 'search' | 'analyze' | 'fix' | 'update' | 'unknown';
  entities: {
    requirementType?: 'stakeholder' | 'system' | 'functional';
    requirementId?: string;
    keywords?: string[];
    scope?: 'single' | 'tree' | 'all';
    status?: string;
  };
  confidence: number;
  rawMessage: string;
}

export class IntentAnalyzer {
  private anthropic: Anthropic | null = null;

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey) {
      this.anthropic = new Anthropic({ apiKey });
      logger.info('IntentAnalyzer initialized with Anthropic API');
    } else {
      logger.warn('ANTHROPIC_API_KEY not set - using rule-based analyzer');
    }
  }

  /**
   * ユーザーメッセージから意図を分析
   */
  async analyze(userMessage: string): Promise<Intent> {
    if (this.anthropic) {
      return await this.analyzeWithAI(userMessage);
    } else {
      return this.analyzeWithRules(userMessage);
    }
  }

  /**
   * AI（Claude）を使った意図分析
   */
  private async analyzeWithAI(userMessage: string): Promise<Intent> {
    try {
      const response = await this.anthropic!.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 1024,
        system: `あなたは要求管理システムの意図分析AIです。
ユーザーの発言から以下のいずれかの意図を判定してください:

- **add_requirement**: 単一要求の追加
- **add_tree**: 要求ツリー（ステークホルダ→システム→機能）の作成
- **validate**: 妥当性チェック
- **search**: 要求検索
- **analyze**: 依存関係分析
- **fix**: 自動修正
- **unknown**: 判定不能

JSON形式で返してください。例:
{
  "type": "add_tree",
  "entities": {
    "requirementType": "stakeholder",
    "scope": "tree",
    "keywords": ["セキュリティ"]
  },
  "confidence": 0.95
}`,
        messages: [{ role: 'user', content: userMessage }],
      });

      const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
      // JSONを抽出（コードブロックや説明文を除去）
      const jsonMatch = text.match(/{[sS]*}/);
      const jsonText = jsonMatch ? jsonMatch[0] : text;

      const parsed = JSON.parse(jsonText);

      return {
        type: parsed.type || 'unknown',
        entities: parsed.entities || {},
        confidence: parsed.confidence || 0.5,
        rawMessage: userMessage,
      };
    } catch (error) {
      logger.error('Failed to analyze intent with AI', error as Error);
      return this.analyzeWithRules(userMessage);
    }
  }

  /**
   * ルールベースの意図分析（フォールバック）
   */
  private analyzeWithRules(userMessage: string): Intent {
    const msg = userMessage.toLowerCase();

    // add_tree: 「ステークホルダ要求を追加」など
    if ((msg.includes('ステークホルダ') || msg.includes('stakeholder')) &&
        (msg.includes('追加') || msg.includes('作成') || msg.includes('add'))) {
      return {
        type: 'add_tree',
        entities: {
          requirementType: 'stakeholder',
          scope: 'tree',
        },
        confidence: 0.8,
        rawMessage: userMessage,
      };
    }

    // validate: 「チェック」「検証」など
    if (msg.includes('チェック') || msg.includes('検証') || msg.includes('validate')) {
      const reqIdMatch = userMessage.match(/([A-Z]+-\d+)/i);
      return {
        type: 'validate',
        entities: {
          requirementId: reqIdMatch ? reqIdMatch[1].toUpperCase() : undefined,
          scope: reqIdMatch ? 'single' : 'all',
        },
        confidence: 0.8,
        rawMessage: userMessage,
      };
    }

    // search: 「検索」「探す」など
    if (msg.includes('検索') || msg.includes('探') || msg.includes('search')) {
      const keywords = this.extractKeywords(userMessage);
      return {
        type: 'search',
        entities: {
          keywords,
          scope: 'all',
        },
        confidence: 0.8,
        rawMessage: userMessage,
      };
    }


    // update: 「ステータスを変更」「承認済にする」など
    if (msg.includes('ステータス') || msg.includes('status') ||
        msg.includes('変更') || msg.includes('update') ||
        msg.includes('承認済') || msg.includes('approved')) {
      const reqIdMatch = userMessage.match(/([A-Z]+-\d+)/i);
      const statusMatch = msg.match(/(承認済|approved|draft|proposed|in_progress|completed|rejected|on_hold)/i);
      return {
        type: 'update',
        entities: {
          requirementId: reqIdMatch ? reqIdMatch[1].toUpperCase() : undefined,
          status: statusMatch ? statusMatch[1] : undefined,
        },
        confidence: 0.8,
        rawMessage: userMessage,
      };
    }

    // fix: 「修正」「自動修正」など
    if (msg.includes('修正') || msg.includes('fix')) {
      return {
        type: 'fix',
        entities: {
          scope: 'all',
        },
        confidence: 0.8,
        rawMessage: userMessage,
      };
    }

    // add_requirement: 単純な「追加」
    if (msg.includes('追加') || msg.includes('add')) {
      return {
        type: 'add_requirement',
        entities: {},
        confidence: 0.6,
        rawMessage: userMessage,
      };
    }

    // unknown
    return {
      type: 'unknown',
      entities: {},
      confidence: 0.3,
      rawMessage: userMessage,
    };
  }

  /**
   * キーワード抽出（簡易版）
   */
  private extractKeywords(message: string): string[] {
    // 「」で囲まれたキーワードを抽出
    const quotedMatch = message.match(/「(.+?)」/g);
    if (quotedMatch) {
      return quotedMatch.map(m => m.replace(/[「」]/g, ''));
    }

    // 簡易的に名詞っぽいものを抽出
    const words = message.split(/[\s、。，．]/);
    return words.filter(w => w.length > 1 && w.length < 10);
  }
}
