/**
 * LLM評価層
 * 境界ケースの判定、詳細な比較分析、修正提案の生成を担当
 *
 * 注: この実装ではLLM統合のインターフェースを定義し、
 * 実際のLLM呼び出しは将来の拡張として残します
 */

import type {
  Requirement,
  ValidationViolation,
} from '../types.js';

/**
 * LLM評価のプロンプトテンプレート
 */
export class LLMPrompts {
  /**
   * 兄弟要求の抽象度一貫性を評価するプロンプト
   */
  static abstractionConsistency(req: Requirement, siblings: Requirement[]): string {
    return `以下の要求について、兄弟要求間の抽象度が一貫しているか評価してください。

対象要求:
ID: ${req.id}
タイトル: ${req.title}
説明: ${req.description}
抽象度スコア: ${req.abstraction_score?.toFixed(2)}

兄弟要求:
${siblings.map(s => `
- ID: ${s.id}
  タイトル: ${s.title}
  抽象度スコア: ${s.abstraction_score?.toFixed(2)}
`).join('\n')}

評価観点:
1. 各要求の抽象度レベルは適切か
2. 兄弟間で粒度が揃っているか
3. ばらつきがある場合、どの要求を調整すべきか

評価結果（JSON形式）:
{
  "consistent": true/false,
  "issues": ["問題点1", "問題点2"],
  "recommendations": ["推奨事項1", "推奨事項2"]
}`;
  }

  /**
   * 親子間の具体化度差を評価するプロンプト
   */
  static parentChildConcreteness(child: Requirement, parent: Requirement): string {
    return `以下の親子要求について、適切な具体化関係になっているか評価してください。

親要求:
ID: ${parent.id}
タイトル: ${parent.title}
説明: ${parent.description}
抽象度スコア: ${parent.abstraction_score?.toFixed(2)}

子要求:
ID: ${child.id}
タイトル: ${child.title}
説明: ${child.description}
抽象度スコア: ${child.abstraction_score?.toFixed(2)}

評価観点:
1. 子要求は親要求を適切に具体化しているか
2. 具体化の程度は適切か（不足/過剰）
3. どのように改善すべきか

評価結果（JSON形式）:
{
  "appropriate": true/false,
  "concreteness_level": "too_abstract/appropriate/too_concrete",
  "suggestions": ["改善案1", "改善案2"]
}`;
  }

  /**
   * 兄弟要求間の重複を評価するプロンプト
   */
  static siblingOverlap(req1: Requirement, req2: Requirement): string {
    return `以下の2つの兄弟要求について、意味的な重複があるか評価してください。

要求1:
ID: ${req1.id}
タイトル: ${req1.title}
説明: ${req1.description}

要求2:
ID: ${req2.id}
タイトル: ${req2.title}
説明: ${req2.description}

評価観点:
1. 2つの要求は意味的に重複しているか
2. 重複している場合、どの程度重複しているか
3. 統合すべきか、差異を明確にすべきか

評価結果（JSON形式）:
{
  "overlapping": true/false,
  "overlap_degree": "none/partial/high/complete",
  "distinction": "明確な差異の説明",
  "recommendation": "統合/差異の明確化/そのまま"
}`;
  }

  /**
   * 親要求のカバレッジを評価するプロンプト
   */
  static parentCoverage(parent: Requirement, children: Requirement[]): string {
    return `以下の親要求について、子要求群が親要求の内容を十分にカバーしているか評価してください。

親要求:
ID: ${parent.id}
タイトル: ${parent.title}
説明: ${parent.description}

子要求群:
${children.map(c => `
- ID: ${c.id}
  タイトル: ${c.title}
  説明: ${c.description}
`).join('\n')}

評価観点:
1. 親要求の内容が子要求群で十分に具体化されているか
2. 不足している観点や内容はないか
3. 追加すべき子要求はあるか

評価結果（JSON形式）:
{
  "sufficient_coverage": true/false,
  "coverage_percentage": 0-100,
  "missing_aspects": ["不足観点1", "不足観点2"],
  "suggested_children": [
    {"title": "追加すべき子要求1", "description": "説明"}
  ]
}`;
  }

  /**
   * 主語の明示性を評価するプロンプト
   */
  static actorPresence(req: Requirement): string {
    return `以下の要求について、主語（誰が/何が）が明確に記述されているか評価してください。

要求:
ID: ${req.id}
タイトル: ${req.title}
説明: ${req.description}

評価観点:
1. 主語が明示されているか
2. 責任範囲が明確か
3. どのように改善すべきか

評価結果（JSON形式）:
{
  "actor_present": true/false,
  "actors_identified": ["主語1", "主語2"],
  "clarity": "clear/ambiguous/missing",
  "improved_version": "改善された要求文"
}`;
  }

  /**
   * 修正提案を生成するプロンプト
   */
  static generateFix(req: Requirement, violation: ValidationViolation): string {
    return `以下の検証違反について、具体的な修正提案を生成してください。

要求:
ID: ${req.id}
タイトル: ${req.title}
説明: ${req.description}

違反内容:
ルール: ${violation.ruleId} (${violation.ruleDomain})
メッセージ: ${violation.message}
詳細: ${violation.details || 'なし'}

修正提案（JSON形式）:
{
  "quick_fixes": [
    {"description": "簡易修正1", "before": "修正前", "after": "修正後"}
  ],
  "detailed_recommendation": "詳細な推奨事項",
  "examples": ["改善例1", "改善例2"]
}`;
  }
}

/**
 * LLM評価エンジン
 *
 * 注: 実際のLLM呼び出しは実装されていません。
 * 将来的にAnthropic Claude APIまたは他のLLMと統合する際の
 * インターフェースとして機能します。
 */
export class LLMEvaluator {
  /**
   * LLMが利用可能かチェック
   */
  static isAvailable(): boolean {
    // 環境変数などでLLM APIキーが設定されているかチェック
    return false; // 現在は未実装
  }

  /**
   * 抽象度一貫性を評価（LLM使用）
   */
  static async evaluateAbstractionConsistency(
    req: Requirement,
    siblings: Requirement[]
  ): Promise<{
    consistent: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    if (!this.isAvailable()) {
      return {
        consistent: true,
        issues: [],
        recommendations: ['LLM評価は現在利用できません'],
      };
    }

    // TODO: 実際のLLM呼び出しを実装
    // const prompt = LLMPrompts.abstractionConsistency(req, siblings);
    // const response = await callLLM(prompt);
    // return JSON.parse(response);

    throw new Error('LLM評価は未実装です');
  }

  /**
   * 親子具体化度を評価（LLM使用）
   */
  static async evaluateParentChildConcreteness(
    child: Requirement,
    parent: Requirement
  ): Promise<{
    appropriate: boolean;
    concreteness_level: string;
    suggestions: string[];
  }> {
    if (!this.isAvailable()) {
      return {
        appropriate: true,
        concreteness_level: 'appropriate',
        suggestions: ['LLM評価は現在利用できません'],
      };
    }

    // TODO: 実際のLLM呼び出しを実装
    throw new Error('LLM評価は未実装です');
  }

  /**
   * 兄弟要求の重複を評価（LLM使用）
   */
  static async evaluateSiblingOverlap(
    req1: Requirement,
    req2: Requirement
  ): Promise<{
    overlapping: boolean;
    overlap_degree: string;
    distinction: string;
    recommendation: string;
  }> {
    if (!this.isAvailable()) {
      return {
        overlapping: false,
        overlap_degree: 'none',
        distinction: 'LLM評価は現在利用できません',
        recommendation: 'そのまま',
      };
    }

    // TODO: 実際のLLM呼び出しを実装
    throw new Error('LLM評価は未実装です');
  }

  /**
   * 親要求のカバレッジを評価（LLM使用）
   */
  static async evaluateParentCoverage(
    parent: Requirement,
    children: Requirement[]
  ): Promise<{
    sufficient_coverage: boolean;
    coverage_percentage: number;
    missing_aspects: string[];
    suggested_children: Array<{ title: string; description: string }>;
  }> {
    if (!this.isAvailable()) {
      return {
        sufficient_coverage: true,
        coverage_percentage: 100,
        missing_aspects: [],
        suggested_children: [],
      };
    }

    // TODO: 実際のLLM呼び出しを実装
    throw new Error('LLM評価は未実装です');
  }

  /**
   * 主語の存在を評価（LLM使用）
   */
  static async evaluateActorPresence(
    req: Requirement
  ): Promise<{
    actor_present: boolean;
    actors_identified: string[];
    clarity: string;
    improved_version: string;
  }> {
    if (!this.isAvailable()) {
      return {
        actor_present: true,
        actors_identified: [],
        clarity: 'clear',
        improved_version: '',
      };
    }

    // TODO: 実際のLLM呼び出しを実装
    throw new Error('LLM評価は未実装です');
  }

  /**
   * 修正提案を生成（LLM使用）
   */
  static async generateFix(
    req: Requirement,
    violation: ValidationViolation
  ): Promise<{
    quick_fixes: Array<{ description: string; before: string; after: string }>;
    detailed_recommendation: string;
    examples: string[];
  }> {
    if (!this.isAvailable()) {
      return {
        quick_fixes: [],
        detailed_recommendation: 'LLM評価は現在利用できません',
        examples: [],
      };
    }

    // TODO: 実際のLLM呼び出しを実装
    throw new Error('LLM評価は未実装です');
  }

  /**
   * 検証違反に対してLLM評価を追加
   * 既存の機械的検証結果に対して、LLMによる詳細分析を付加
   */
  static async enhanceViolationWithLLM(
    req: Requirement,
    violation: ValidationViolation,
    allRequirements: Map<string, Requirement>
  ): Promise<ValidationViolation> {
    if (!this.isAvailable()) {
      return violation;
    }

    try {
      // ルールに応じて適切なLLM評価を実行
      if (violation.ruleId === 'C1' || violation.ruleId === 'C2') {
        // 抽象度関連の違反
        const fix = await this.generateFix(req, violation);
        return {
          ...violation,
          suggestedFix: fix.detailed_recommendation,
          details: `${violation.details}\n\nLLM分析:\n${fix.detailed_recommendation}`,
        };
      } else if (violation.ruleId === 'D1') {
        // MECE重複関連の違反
        const fix = await this.generateFix(req, violation);
        return {
          ...violation,
          suggestedFix: fix.detailed_recommendation,
        };
      } else if (violation.ruleId === 'E3') {
        // 主語明示関連の違反
        const fix = await this.generateFix(req, violation);
        return {
          ...violation,
          suggestedFix: fix.detailed_recommendation,
        };
      }
    } catch (error) {
      // LLM呼び出しエラーは無視して元の違反を返す
      console.error('LLM evaluation failed:', error);
    }

    return violation;
  }
}
