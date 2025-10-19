/**
 * NLP分析と品質スタイルチェック（ドメインE）
 * トークン数、接続詞カウント、曖昧表現検出などの機械的NLP処理
 */

import type {
  Requirement,
  ValidationViolation,
  ValidationRule,
} from '../types.js';

/**
 * NLP指標計算
 */
export class NLPAnalyzer {
  /**
   * トークン数を計算（簡易実装: 文字数ベース）
   * 日本語の場合、1文字 ≒ 1トークンと近似
   */
  static calculateTokens(text: string): number {
    // 空白と改行を除いた文字数をカウント
    return text.replace(/\s/g, '').length;
  }

  /**
   * 接続詞の数をカウント
   */
  static countConjunctions(text: string): number {
    const conjunctions = [
      'また', 'さらに', 'そして', 'および', 'かつ',
      'または', 'もしくは', 'あるいは',
      'しかし', 'ただし', 'だが', 'けれども',
      'ので', 'ため', 'から',
    ];

    let count = 0;
    for (const conj of conjunctions) {
      const regex = new RegExp(conj, 'g');
      const matches = text.match(regex);
      if (matches) {
        count += matches.length;
      }
    }
    return count;
  }

  /**
   * 数値の密度を計算（テキスト中の数値の割合）
   */
  static calculateNumericDensity(text: string): number {
    const numericRegex = /\d+/g;
    const matches = text.match(numericRegex);
    const numericChars = matches ? matches.join('').length : 0;
    const totalChars = text.replace(/\s/g, '').length;

    return totalChars > 0 ? numericChars / totalChars : 0;
  }

  /**
   * 単一性スコアを推定（接続詞の数から逆算）
   * 接続詞が多い = 複数の関心事 = スコアが低い
   */
  static estimateAtomicityScore(text: string): number {
    const conjunctions = this.countConjunctions(text);
    const tokens = this.calculateTokens(text);

    if (tokens === 0) return 1.0;

    // 接続詞密度 = 接続詞数 / (トークン数 / 100)
    const density = conjunctions / (tokens / 100);

    // スコア = 1.0 - min(density, 1.0)
    // 密度が高いほどスコアが低くなる
    return Math.max(0, 1.0 - Math.min(density / 5, 1.0));
  }

  /**
   * 抽象度スコアを推定（簡易実装）
   * 具体的な単語（数値、固有名詞、技術用語）が多いほど具体的
   */
  static estimateAbstractionScore(text: string): number {
    const concreteIndicators = [
      /\d+/g, // 数値
      /[A-Z]{2,}/g, // 大文字の略語
      /\d+\.\d+/g, // バージョン番号
      /(API|DB|UI|ID|URL|HTTP|JSON|XML|SQL)/g, // 技術用語
      /(ボタン|画面|フォーム|テーブル|カラム|フィールド)/g, // UI要素
    ];

    let concreteCount = 0;
    for (const regex of concreteIndicators) {
      const matches = text.match(regex);
      if (matches) {
        concreteCount += matches.length;
      }
    }

    const tokens = this.calculateTokens(text);
    if (tokens === 0) return 0.5; // デフォルト中間値

    // 具体的指標の密度
    const concreteness = concreteCount / (tokens / 50);

    // スコア = 1.0 - min(concreteness, 1.0)
    // 具体的な要素が多いほど抽象度は低い
    return Math.max(0, 1.0 - Math.min(concreteness, 1.0));
  }

  /**
   * 要求のNLP指標を一括計算して更新
   */
  static analyzeRequirement(req: Requirement): Partial<Requirement> {
    const text = `${req.title} ${req.description} ${req.rationale || ''}`;

    return {
      length_tokens: this.calculateTokens(text),
      atomicity_score: this.estimateAtomicityScore(text),
      abstraction_score: this.estimateAbstractionScore(text),
    };
  }
}

/**
 * 品質スタイルバリデーター（ドメインE）
 */
export class QualityStyleValidator {
  /**
   * E1: 曖昧な表現の検出
   */
  static detectVagueTerms(
    req: Requirement,
    rule: ValidationRule
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];
    const vagueTerms = rule.parameters?.vagueTerms || [
      'など', '等', '適切に', '柔軟に', '必要に応じて',
      '可能な限り', '基本的に', '一般的に',
    ];

    const text = `${req.title} ${req.description} ${req.rationale || ''}`;

    for (const term of vagueTerms) {
      if (text.includes(term)) {
        violations.push({
          id: `${rule.id}-${req.id}-${term}`,
          requirementId: req.id,
          ruleDomain: 'quality_style',
          ruleId: rule.id,
          severity: rule.severity,
          message: `曖昧な表現が検出されました: "${term}"`,
          details: `"${term}"のような曖昧な表現は具体的な記述に置き換えてください`,
          suggestedFix: `具体的な条件、範囲、または例を記載してください`,
          detectedAt: new Date().toISOString(),
        });
      }
    }

    return violations;
  }

  /**
   * E2: 受動態の検出
   */
  static detectPassiveVoice(
    req: Requirement,
    rule: ValidationRule
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];
    const passivePatterns = rule.parameters?.passivePatterns || ['される', 'れる', 'られる'];

    const text = `${req.title} ${req.description}`;
    let foundPassive = false;

    for (const pattern of passivePatterns) {
      if (text.includes(pattern)) {
        foundPassive = true;
        break;
      }
    }

    if (foundPassive) {
      violations.push({
        id: `${rule.id}-${req.id}`,
        requirementId: req.id,
        ruleDomain: 'quality_style',
        ruleId: rule.id,
        severity: rule.severity,
        message: `受動態が検出されました`,
        details: `能動態で「誰が/何が」を明示すると理解しやすくなります`,
        suggestedFix: `「システムは〜する」「ユーザーは〜できる」などの能動態に書き換えてください`,
        detectedAt: new Date().toISOString(),
      });
    }

    return violations;
  }

  /**
   * E3: 主語の明示チェック（簡易実装）
   * 「システムは」「ユーザーは」などの主語が含まれているかチェック
   */
  static validateActorPresence(
    req: Requirement,
    rule: ValidationRule
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];

    if (!rule.parameters?.requireActor) {
      return violations;
    }

    const text = `${req.title} ${req.description}`;
    const actorPatterns = [
      'システムは', 'システムが',
      'ユーザーは', 'ユーザーが',
      '管理者は', '管理者が',
      'アプリは', 'アプリが',
      'サーバーは', 'サーバーが',
      '〜は', '〜が',
    ];

    const hasActor = actorPatterns.some(pattern => text.includes(pattern));

    if (!hasActor) {
      violations.push({
        id: `${rule.id}-${req.id}`,
        requirementId: req.id,
        ruleDomain: 'quality_style',
        ruleId: rule.id,
        severity: rule.severity,
        message: `主語が明示されていません`,
        details: `「誰が/何が」を明確にすることで要求の責任範囲が明確になります`,
        suggestedFix: `「システムは〜」「ユーザーは〜」などの主語を追加してください`,
        detectedAt: new Date().toISOString(),
      });
    }

    return violations;
  }

  /**
   * E4: 長さの妥当性チェック
   */
  static validateLength(
    req: Requirement,
    rule: ValidationRule
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];
    const minTokens = rule.parameters?.minTokens || 10;
    const maxTokens = rule.parameters?.maxTokens || 200;

    const tokens = req.length_tokens || NLPAnalyzer.calculateTokens(
      `${req.title} ${req.description} ${req.rationale || ''}`
    );

    if (tokens < minTokens) {
      violations.push({
        id: `${rule.id}-${req.id}-short`,
        requirementId: req.id,
        ruleDomain: 'quality_style',
        ruleId: rule.id,
        severity: rule.severity,
        message: `要求の説明が短すぎます（${tokens} < ${minTokens}トークン）`,
        details: `要求の背景、目的、具体的な内容を追加してください`,
        detectedAt: new Date().toISOString(),
      });
    }

    if (tokens > maxTokens) {
      violations.push({
        id: `${rule.id}-${req.id}-long`,
        requirementId: req.id,
        ruleDomain: 'quality_style',
        ruleId: rule.id,
        severity: rule.severity,
        message: `要求の説明が長すぎます（${tokens} > ${maxTokens}トークン）`,
        details: `要求を複数の小さな要求に分割することを検討してください`,
        suggestedFix: `複数の関心事が含まれている場合は分割してください`,
        detectedAt: new Date().toISOString(),
      });
    }

    return violations;
  }

  /**
   * E5: 単一性チェック（atomicity_score使用）
   */
  static validateAtomicity(
    req: Requirement,
    rule: ValidationRule
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];
    const minScore = rule.parameters?.minAtomicityScore || 0.7;

    const score = req.atomicity_score ?? NLPAnalyzer.estimateAtomicityScore(
      `${req.title} ${req.description}`
    );

    if (score < minScore) {
      violations.push({
        id: `${rule.id}-${req.id}`,
        requirementId: req.id,
        ruleDomain: 'quality_style',
        ruleId: rule.id,
        severity: rule.severity,
        message: `単一性スコアが低いです（${score.toFixed(2)} < ${minScore}）`,
        details: `1つの要求に複数の関心事が含まれている可能性があります`,
        suggestedFix: `接続詞（「また」「さらに」「および」など）で繋がれた内容を別の要求に分割してください`,
        detectedAt: new Date().toISOString(),
      });
    }

    return violations;
  }

  /**
   * 品質スタイル全体の検証
   */
  static validateAll(
    req: Requirement,
    rules: ValidationRule[]
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];

    for (const rule of rules) {
      if (!rule.enabled) continue;

      switch (rule.id) {
        case 'E1':
          violations.push(...this.detectVagueTerms(req, rule));
          break;
        case 'E2':
          violations.push(...this.detectPassiveVoice(req, rule));
          break;
        case 'E3':
          violations.push(...this.validateActorPresence(req, rule));
          break;
        case 'E4':
          violations.push(...this.validateLength(req, rule));
          break;
        case 'E5':
          violations.push(...this.validateAtomicity(req, rule));
          break;
      }
    }

    return violations;
  }
}
