/**
 * MECE検証と抽象度チェック（ドメインC, D）
 * 兄弟要求間の重複、抽象度の一貫性、カバレッジなどを検証
 */

import type {
  Requirement,
  ValidationViolation,
  ValidationRule,
} from '../types.js';

/**
 * 簡易的なテキスト類似度計算（コサイン類似度の代替）
 * 実運用では埋め込みベクトルを使用するが、ここでは単語の共通度を使用
 */
export class TextSimilarity {
  /**
   * テキストを単語に分割（日本語対応）
   */
  static tokenize(text: string): string[] {
    // 助詞・記号を除去して、意味のある単語を抽出
    const cleaned = text
      .replace(/[、。！？\s]/g, ' ')
      .replace(/[はがをにへとでや]/g, ' ');

    // 2文字以上の単語を抽出
    const words: string[] = [];
    for (let i = 0; i < cleaned.length - 1; i++) {
      words.push(cleaned.substring(i, i + 2));
    }
    return words;
  }

  /**
   * Jaccard類似度を計算（簡易的な類似度指標）
   */
  static jaccardSimilarity(text1: string, text2: string): number {
    const tokens1 = new Set(this.tokenize(text1));
    const tokens2 = new Set(this.tokenize(text2));

    const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
    const union = new Set([...tokens1, ...tokens2]);

    if (union.size === 0) return 0;
    return intersection.size / union.size;
  }

  /**
   * 2つの要求の類似度を計算
   */
  static calculateRequirementSimilarity(req1: Requirement, req2: Requirement): number {
    const text1 = `${req1.title} ${req1.description}`;
    const text2 = `${req2.title} ${req2.description}`;

    return this.jaccardSimilarity(text1, text2);
  }
}

/**
 * 抽象度バリデーター（ドメインC）
 */
export class AbstractionValidator {
  /**
   * C1: 兄弟要求の抽象度一貫性チェック
   */
  static validateSiblingConsistency(
    req: Requirement,
    allRequirements: Map<string, Requirement>,
    rule: ValidationRule
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];

    if (!req.refines || req.refines.length === 0) {
      return violations; // 親がない場合はスキップ
    }

    // 同じ親を持つ兄弟要求を取得
    const siblings = Array.from(allRequirements.values()).filter(
      r => r.id !== req.id &&
           r.refines?.some(parentId => req.refines?.includes(parentId))
    );

    if (siblings.length === 0) {
      return violations; // 兄弟がいない場合はスキップ
    }

    // 兄弟要求の抽象度スコアを収集
    const scores = [req.abstraction_score, ...siblings.map(s => s.abstraction_score)]
      .filter((s): s is number => s !== undefined);

    if (scores.length < 2) {
      return violations; // スコアが不足している場合はスキップ
    }

    // 分散を計算
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;

    const maxVariance = rule.parameters?.maxVariance || 0.15;

    if (variance > maxVariance) {
      violations.push({
        id: `${rule.id}-${req.id}`,
        requirementId: req.id,
        ruleDomain: 'abstraction',
        ruleId: rule.id,
        severity: rule.severity,
        message: `兄弟要求間で抽象度のばらつきが大きいです（分散: ${variance.toFixed(3)}）`,
        details: `同じ親を持つ要求は抽象度を揃えることで、構造が理解しやすくなります`,
        comparisonTargets: siblings.map(s => s.id),
        suggestedFix: rule.parameters?.useLLMForBoundary
          ? `LLMによる詳細分析を推奨`
          : `抽象度を${mean.toFixed(2)}付近に揃えてください`,
        detectedAt: new Date().toISOString(),
      });
    }

    return violations;
  }

  /**
   * C2: 親子間の具体化度差チェック
   */
  static validateParentChildConcreteness(
    req: Requirement,
    allRequirements: Map<string, Requirement>,
    rule: ValidationRule
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];

    if (!req.refines || req.refines.length === 0) {
      return violations;
    }

    const childScore = req.abstraction_score;
    if (childScore === undefined) {
      return violations;
    }

    const minDifference = rule.parameters?.minDifference || 0.1;

    for (const parentId of req.refines) {
      const parent = allRequirements.get(parentId);
      if (!parent || parent.abstraction_score === undefined) {
        continue;
      }

      const parentScore = parent.abstraction_score;
      const difference = parentScore - childScore; // 親は子より抽象的であるべき

      if (difference < minDifference) {
        violations.push({
          id: `${rule.id}-${req.id}-${parentId}`,
          requirementId: req.id,
          ruleDomain: 'abstraction',
          ruleId: rule.id,
          severity: rule.severity,
          message: `親要求との具体化度の差が不足しています（差: ${difference.toFixed(2)}）`,
          details: `子要求は親要求よりも具体的であるべきです（抽象度スコアが低いべき）`,
          comparisonTargets: [parentId],
          suggestedFix: rule.parameters?.useLLMForBoundary
            ? `LLMによる詳細分析を推奨`
            : `子要求をより具体的に記述するか、親要求をより抽象的にしてください`,
          detectedAt: new Date().toISOString(),
        });
      }
    }

    return violations;
  }

  /**
   * C3: 抽象度スコアの範囲チェック
   */
  static validateScoreRange(
    req: Requirement,
    rule: ValidationRule
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];

    if (req.abstraction_score === undefined) {
      return violations;
    }

    const score = req.abstraction_score;

    if (score < 0 || score > 1.0) {
      violations.push({
        id: `${rule.id}-${req.id}`,
        requirementId: req.id,
        ruleDomain: 'abstraction',
        ruleId: rule.id,
        severity: rule.severity,
        message: `抽象度スコアが範囲外です（${score}）`,
        details: `抽象度スコアは0.0〜1.0の範囲でなければなりません`,
        detectedAt: new Date().toISOString(),
      });
    }

    return violations;
  }

  /**
   * 抽象度全体の検証
   */
  static validateAll(
    req: Requirement,
    allRequirements: Map<string, Requirement>,
    rules: ValidationRule[]
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];

    for (const rule of rules) {
      if (!rule.enabled) continue;

      switch (rule.id) {
        case 'C1':
          violations.push(...this.validateSiblingConsistency(req, allRequirements, rule));
          break;
        case 'C2':
          violations.push(...this.validateParentChildConcreteness(req, allRequirements, rule));
          break;
        case 'C3':
          violations.push(...this.validateScoreRange(req, rule));
          break;
      }
    }

    return violations;
  }
}

/**
 * MECEバリデーター（ドメインD）
 */
export class MECEValidator {
  /**
   * D1: 兄弟要求間の重複検出
   */
  static detectSiblingOverlap(
    req: Requirement,
    allRequirements: Map<string, Requirement>,
    rule: ValidationRule
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];

    if (!req.refines || req.refines.length === 0) {
      return violations;
    }

    // 同じ親を持つ兄弟要求を取得
    const siblings = Array.from(allRequirements.values()).filter(
      r => r.id !== req.id &&
           r.refines?.some(parentId => req.refines?.includes(parentId))
    );

    if (siblings.length === 0) {
      return violations;
    }

    const threshold = rule.parameters?.similarityThreshold || 0.8;

    // 各兄弟との類似度をチェック
    for (const sibling of siblings) {
      const similarity = TextSimilarity.calculateRequirementSimilarity(req, sibling);

      if (similarity >= threshold) {
        violations.push({
          id: `${rule.id}-${req.id}-${sibling.id}`,
          requirementId: req.id,
          ruleDomain: 'mece',
          ruleId: rule.id,
          severity: rule.severity,
          message: `兄弟要求との重複が検出されました（類似度: ${(similarity * 100).toFixed(1)}%）`,
          details: `要求 ${sibling.id} と内容が重複している可能性があります`,
          comparisonTargets: [sibling.id],
          suggestedFix: rule.parameters?.useLLMForBoundary
            ? `LLMによる詳細な重複分析を推奨`
            : `要求を統合するか、差異を明確にしてください`,
          detectedAt: new Date().toISOString(),
        });
      }
    }

    return violations;
  }

  /**
   * D2: 親要求のカバレッジチェック（簡易実装）
   * 子要求群が親要求の内容をカバーしているかチェック
   */
  static validateParentCoverage(
    req: Requirement,
    allRequirements: Map<string, Requirement>,
    rule: ValidationRule
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];

    // この要求が親の場合のみチェック
    const children = Array.from(allRequirements.values()).filter(
      r => r.refines?.includes(req.id)
    );

    if (children.length === 0) {
      return violations; // 子がいない場合はスキップ
    }

    // 親のキーワードが子要求群でカバーされているかチェック（簡易実装）
    const parentKeywords = TextSimilarity.tokenize(`${req.title} ${req.description}`);
    const childTexts = children.map(c => `${c.title} ${c.description}`).join(' ');
    const childKeywords = new Set(TextSimilarity.tokenize(childTexts));

    const coveredCount = parentKeywords.filter(kw => childKeywords.has(kw)).length;
    const coverage = parentKeywords.length > 0 ? coveredCount / parentKeywords.length : 1.0;

    // カバレッジが50%未満の場合は警告（info）
    if (coverage < 0.5) {
      violations.push({
        id: `${rule.id}-${req.id}`,
        requirementId: req.id,
        ruleDomain: 'mece',
        ruleId: rule.id,
        severity: rule.severity,
        message: `子要求群による親要求のカバレッジが低いです（${(coverage * 100).toFixed(1)}%）`,
        details: `親要求の内容が子要求群で十分に具体化されていない可能性があります`,
        comparisonTargets: children.map(c => c.id),
        suggestedFix: rule.parameters?.requireLLM
          ? `LLMによるカバレッジ分析を推奨`
          : `不足している内容を子要求として追加してください`,
        detectedAt: new Date().toISOString(),
      });
    }

    return violations;
  }

  /**
   * D3: 細分化の妥当性チェック
   */
  static validateFragmentation(
    req: Requirement,
    allRequirements: Map<string, Requirement>,
    rule: ValidationRule
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];

    const children = Array.from(allRequirements.values()).filter(
      r => r.refines?.includes(req.id)
    );

    if (children.length === 0) {
      return violations;
    }

    const maxChildren = rule.parameters?.maxChildren || 10;
    const minTokensPerChild = rule.parameters?.minTokensPerChild || 20;

    // 子要求が多すぎる場合
    if (children.length > maxChildren) {
      violations.push({
        id: `${rule.id}-${req.id}-count`,
        requirementId: req.id,
        ruleDomain: 'mece',
        ruleId: rule.id,
        severity: rule.severity,
        message: `子要求が多すぎます（${children.length} > ${maxChildren}）`,
        details: `関連する子要求をグループ化して中間階層を作成することを検討してください`,
        comparisonTargets: children.map(c => c.id),
        detectedAt: new Date().toISOString(),
      });
    }

    // 子要求が小さすぎる場合
    const tooSmallChildren = children.filter(
      c => (c.length_tokens || 0) < minTokensPerChild
    );

    if (tooSmallChildren.length > 0) {
      violations.push({
        id: `${rule.id}-${req.id}-size`,
        requirementId: req.id,
        ruleDomain: 'mece',
        ruleId: rule.id,
        severity: rule.severity,
        message: `細分化されすぎた子要求があります（${tooSmallChildren.length}個）`,
        details: `小さすぎる子要求は統合を検討してください`,
        comparisonTargets: tooSmallChildren.map(c => c.id),
        detectedAt: new Date().toISOString(),
      });
    }

    return violations;
  }

  /**
   * MECE全体の検証
   */
  static validateAll(
    req: Requirement,
    allRequirements: Map<string, Requirement>,
    rules: ValidationRule[]
  ): ValidationViolation[] {
    const violations: ValidationViolation[] = [];

    for (const rule of rules) {
      if (!rule.enabled) continue;

      switch (rule.id) {
        case 'D1':
          violations.push(...this.detectSiblingOverlap(req, allRequirements, rule));
          break;
        case 'D2':
          violations.push(...this.validateParentCoverage(req, allRequirements, rule));
          break;
        case 'D3':
          violations.push(...this.validateFragmentation(req, allRequirements, rule));
          break;
      }
    }

    return violations;
  }
}
