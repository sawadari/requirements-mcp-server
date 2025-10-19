/**
 * 要求妥当性チェックエンジン
 */

import { Requirement, RequirementType } from './types.js';
import {
  ValidationContext,
  ValidationResult,
  ValidationReport,
  ValidationRuleConfig,
} from './validation-types.js';
import { RequirementsStorage } from './storage.js';
import fs from 'fs/promises';
import path from 'path';

export class RequirementValidator {
  private config: ValidationRuleConfig;
  private storage: RequirementsStorage;

  constructor(storage: RequirementsStorage) {
    this.storage = storage;
    this.config = {} as ValidationRuleConfig;
  }

  async initialize(): Promise<void> {
    await this.loadConfig();
  }

  async loadConfig(configPath?: string): Promise<void> {
    const defaultPath = path.join(process.cwd(), 'validation-rules.json');
    const targetPath = configPath || defaultPath;

    try {
      const content = await fs.readFile(targetPath, 'utf-8');
      this.config = JSON.parse(content);
    } catch (error) {
      console.error('Failed to load validation config, using defaults:', error);
      this.config = this.getDefaultConfig();
    }
  }

  async saveConfig(configPath?: string): Promise<void> {
    const defaultPath = path.join(process.cwd(), 'validation-rules.json');
    const targetPath = configPath || defaultPath;
    await fs.writeFile(targetPath, JSON.stringify(this.config, null, 2), 'utf-8');
  }

  getConfig(): ValidationRuleConfig {
    return this.config;
  }

  updateConfig(config: Partial<ValidationRuleConfig>): void {
    this.config = { ...this.config, ...config };
  }

  async validate(requirementId: string): Promise<ValidationReport> {
    const requirement = await this.storage.getRequirement(requirementId);
    if (!requirement) {
      throw new Error(`Requirement ${requirementId} not found`);
    }

    const allRequirements = await this.storage.getAllRequirements();
    const context = this.buildContext(requirement, allRequirements);
    const results: ValidationResult[] = [];

    // 各ルールを実行
    if (this.config.parentConsistency?.enabled) {
      results.push(...this.checkParentConsistency(context));
    }

    if (this.config.refinement?.enabled) {
      results.push(...this.checkRefinement(context));
    }

    if (this.config.childConsistency?.enabled) {
      results.push(...this.checkChildConsistency(context));
    }

    if (this.config.decomposition?.enabled) {
      results.push(...this.checkDecomposition(context));
    }

    if (this.config.granularity?.enabled) {
      results.push(...this.checkGranularity(context));
    }

    if (this.config.rationaleConsistency?.enabled) {
      results.push(...this.checkRationaleConsistency(context));
    }

    const errorCount = results.filter((r) => r.severity === 'error').length;
    const warningCount = results.filter((r) => r.severity === 'warning').length;
    const infoCount = results.filter((r) => r.severity === 'info').length;

    return {
      requirementId: requirement.id,
      requirementTitle: requirement.title,
      timestamp: new Date(),
      results,
      isValid: errorCount === 0,
      errorCount,
      warningCount,
      infoCount,
    };
  }

  private buildContext(
    requirement: Requirement,
    allRequirements: Requirement[]
  ): ValidationContext {
    const requirementType = this.inferType(requirement);

    // 上位要求を取得
    // 機能要求の場合、他の機能要求は上位要求として認識しない（同レベルの依存関係）
    const parentRequirements = allRequirements.filter((r) => {
      if (requirement.parentId === r.id) return true;
      if (requirement.dependencies.includes(r.id)) {
        const parentType = this.inferType(r);
        // 機能要求同士は階層関係とみなさない
        if (requirementType === 'functional' && parentType === 'functional') {
          return false;
        }
        return true;
      }
      return false;
    });

    // 下位要求を取得
    const childRequirements = allRequirements.filter(
      (r) => r.dependencies.includes(requirement.id) || r.parentId === requirement.id
    );

    // 兄弟要求を取得（同じ親を持つ要求）
    const siblingRequirements = allRequirements.filter((r) => {
      if (r.id === requirement.id) return false;
      // 同じ親IDを持つ
      if (requirement.parentId && r.parentId === requirement.parentId) return true;
      // 同じ依存関係を持つ
      const sharedParents = r.dependencies.filter((dep) =>
        requirement.dependencies.includes(dep)
      );
      return sharedParents.length > 0;
    });

    return {
      requirement,
      allRequirements,
      parentRequirements,
      childRequirements,
      siblingRequirements,
    };
  }

  // ルール1: 上位要求との整合性チェック
  private checkParentConsistency(context: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    const { requirement, parentRequirements } = context;
    const config = this.config.parentConsistency;

    if (parentRequirements.length === 0) {
      // ルート要求の場合はスキップ
      return results;
    }

    // 親要求の種類を確認
    for (const parent of parentRequirements) {
      const parentType = this.inferType(parent);
      const childType = this.inferType(requirement);

      // 階層関係が正しいかチェック
      const validHierarchy = this.isValidHierarchy(parentType, childType);
      if (!validHierarchy) {
        results.push({
          ruleId: 'parent-consistency-hierarchy',
          ruleName: '上位要求との階層整合性',
          severity: config.severity,
          message: `親要求「${parent.id}: ${parent.title}」の種類（${parentType}）と整合しない階層関係です（${childType}）`,
          suggestion: `${parentType}の下位は${this.getExpectedChildType(parentType)}である必要があります`,
        });
      }
    }

    return results;
  }

  // ルール2: 詳細化チェック
  private checkRefinement(context: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    const { requirement } = context;
    const config = this.config.refinement;
    const type = this.inferType(requirement);

    if (type === 'stakeholder') {
      const hierarchyConfig = config.hierarchy.stakeholder;

      // 主語パターンチェック
      const subjectRegex = new RegExp(hierarchyConfig.subjectPattern);
      if (!subjectRegex.test(requirement.description)) {
        results.push({
          ruleId: 'refinement-stakeholder-subject',
          ruleName: 'ステークホルダ要求の主語チェック',
          severity: config.severity,
          message: 'ステークホルダを主語にした記述になっていません',
          suggestion: '「作業員が」「オペレータが」「管理者が」などステークホルダを主語にしてください',
        });
      }

      // 禁止フレーズチェック
      for (const phrase of hierarchyConfig.forbiddenPhrases) {
        if (requirement.description.includes(phrase)) {
          results.push({
            ruleId: 'refinement-stakeholder-forbidden',
            ruleName: 'ステークホルダ要求の禁止フレーズ',
            severity: config.severity,
            message: `ステークホルダ要求に「${phrase}」という実装寄りの表現が含まれています`,
            suggestion: 'ステークホルダの視点で、システムに何を期待するかを記述してください',
          });
        }
      }
    } else if (type === 'system') {
      const hierarchyConfig = config.hierarchy.system;

      // 主語パターンチェック（システムは、システムが）
      if (!requirement.description.includes('システムは') && !requirement.description.includes('システムが')) {
        results.push({
          ruleId: 'refinement-system-subject',
          ruleName: 'システム要求の主語チェック',
          severity: config.severity,
          message: 'システムを主語にした記述になっていません',
          suggestion: '「システムは〜すること」という形式で記述してください',
        });
      }

      // 動詞パターンチェック（～すること）
      const verbRegex = new RegExp(hierarchyConfig.verbPattern);
      if (!verbRegex.test(requirement.description)) {
        results.push({
          ruleId: 'refinement-system-verb',
          ruleName: 'システム要求の動詞形式チェック',
          severity: config.severity,
          message: '「～すること」という動詞形式になっていません',
          suggestion: 'システムが担うべき役割を「〜すること」という形式で記述してください',
        });
      }
    } else if (type === 'functional') {
      const hierarchyConfig = config.hierarchy.functional;

      // 複雑度チェック（単一機能かどうか）
      const sentenceCount = (requirement.description.match(/[。.]/g) || []).length;
      if (sentenceCount > hierarchyConfig.maxComplexity) {
        results.push({
          ruleId: 'refinement-functional-complexity',
          ruleName: 'システム機能要求の複雑度チェック',
          severity: config.severity,
          message: `機能が複雑すぎます（${sentenceCount}文）。基本機能は単一の責務を持つべきです`,
          suggestion: '複数の機能が含まれている場合は、分割してください',
        });
      }
    }

    return results;
  }

  // ルール3: 下位要求との整合性チェック
  private checkChildConsistency(context: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    const { requirement, childRequirements } = context;
    const config = this.config.childConsistency;

    // 下位要求が存在しない場合（リーフノード）はスキップ
    if (childRequirements.length === 0) {
      return results;
    }

    // 最小下位要求数チェック
    if (childRequirements.length < config.minChildren) {
      results.push({
        ruleId: 'child-consistency-min',
        ruleName: '下位要求の最小数チェック',
        severity: config.severity,
        message: `下位要求が少なすぎます（${childRequirements.length}件）`,
        suggestion: `最低${config.minChildren}件の下位要求が必要です`,
      });
    }

    // 最大下位要求数チェック
    if (childRequirements.length > config.maxChildren) {
      results.push({
        ruleId: 'child-consistency-max',
        ruleName: '下位要求の最大数チェック',
        severity: config.severity,
        message: `下位要求が多すぎます（${childRequirements.length}件）`,
        suggestion: `最大${config.maxChildren}件に抑えるか、さらに階層化してください`,
      });
    }

    return results;
  }

  // ルール4: 分解チェック
  private checkDecomposition(context: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    const { requirement, siblingRequirements } = context;
    const config = this.config.decomposition;

    if (siblingRequirements.length === 0) {
      return results;
    }

    // 重複チェック
    if (config.checkOverlap) {
      for (const sibling of siblingRequirements) {
        const similarity = this.calculateSimilarity(
          requirement.title,
          sibling.title
        );
        if (similarity > config.similarityThreshold) {
          results.push({
            ruleId: 'decomposition-overlap',
            ruleName: '兄弟要求との重複チェック',
            severity: config.severity,
            message: `「${sibling.id}: ${sibling.title}」と内容が重複している可能性があります（類似度: ${Math.round(similarity * 100)}%）`,
            suggestion: '重複している場合は統合するか、責務を明確に分けてください',
          });
        }
      }
    }

    return results;
  }

  // ルール5: 粒度・抽象度チェック
  private checkGranularity(context: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    const { requirement } = context;
    const config = this.config.granularity;
    const type = this.inferType(requirement);

    // 説明文の長さチェック
    const lengthConfig = config.descriptionLength[type];
    const descLength = requirement.description.length;

    if (descLength < lengthConfig.min) {
      results.push({
        ruleId: 'granularity-length-min',
        ruleName: '説明文の最小長チェック',
        severity: config.severity,
        message: `説明文が短すぎます（${descLength}文字）`,
        suggestion: `${type}要求は${lengthConfig.min}文字以上で記述してください`,
      });
    }

    if (descLength > lengthConfig.max) {
      results.push({
        ruleId: 'granularity-length-max',
        ruleName: '説明文の最大長チェック',
        severity: config.severity,
        message: `説明文が長すぎます（${descLength}文字）`,
        suggestion: `${type}要求は${lengthConfig.max}文字以内に抑えるか、分割してください`,
      });
    }

    return results;
  }

  // ヘルパーメソッド: 要求の種類を推測（system_functionalはfunctionalに正規化）
  private inferType(requirement: Requirement): 'stakeholder' | 'system' | 'functional' {
    if (requirement.type) {
      // system_functionalをfunctionalに正規化
      if (requirement.type === 'system_functional') return 'functional';
      if (requirement.type === 'functional') return 'functional';
      if (requirement.type === 'system') return 'system';
      if (requirement.type === 'stakeholder') return 'stakeholder';
    }

    // カテゴリから推測
    if (requirement.category.includes('ステークホルダ')) {
      return 'stakeholder';
    } else if (requirement.category.includes('システム要求')) {
      return 'system';
    } else if (requirement.category.includes('機能')) {
      return 'functional';
    }

    // IDから推測
    if (requirement.id.startsWith('STK-')) return 'stakeholder';
    if (requirement.id.startsWith('SYS-')) return 'system';
    if (requirement.id.startsWith('FUNC-')) return 'functional';

    return 'stakeholder'; // デフォルト
  }

  // ヘルパーメソッド: 階層関係の検証
  private isValidHierarchy(
    parentType: RequirementType,
    childType: RequirementType
  ): boolean {
    if (parentType === 'stakeholder' && childType === 'system') return true;
    if (parentType === 'system' && childType === 'functional') return true;
    return false;
  }

  // ヘルパーメソッド: 期待される子要求の種類
  private getExpectedChildType(parentType: RequirementType): string {
    if (parentType === 'stakeholder') return 'システム要求';
    if (parentType === 'system') return 'システム機能要求';
    return '不明';
  }

  // ヘルパーメソッド: 類似度計算（簡易版）
  private calculateSimilarity(str1: string, str2: string): number {
    // Levenshtein距離ベースの類似度計算（簡易版）
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = [];

    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  /**
   * ルール6: 理由の整合性チェック
   * - 理由が存在するか
   * - 理由が説明と整合しているか
   * - 理由が上位要求を参照しているか
   * - 理由に必要なキーワードが含まれているか
   */
  private checkRationaleConsistency(context: ValidationContext): ValidationResult[] {
    const results: ValidationResult[] = [];
    const { requirement } = context;
    const config = this.config.rationaleConsistency;

    if (!config) return results;

    const requirementType = this.inferType(requirement);
    const severity = config.severity || 'error';

    // 理由が存在するかチェック
    if (!requirement.rationale || requirement.rationale.trim().length === 0) {
      results.push({
        ruleId: 'rationale-existence',
        ruleName: '理由の存在',
        message: '理由(rationale)が設定されていません',
        severity,
        suggestion: 'この要求が必要な理由や背景を記述してください',
      });
      return results; // 理由がない場合は他のチェックをスキップ
    }

    // 理由の長さチェック
    if (config.minLength && requirement.rationale.length < config.minLength) {
      results.push({
        ruleId: 'rationale-length',
        ruleName: '理由の長さ',
        message: `理由が短すぎます（${requirement.rationale.length}文字、最低${config.minLength}文字）`,
        severity: 'warning',
        suggestion: 'より詳細な理由や背景を記述してください',
      });
    }

    // 必要なキーワードのチェック
    if (config.checkKeywordPresence && config.requiredElements) {
      const requiredKeywords = config.requiredElements[requirementType] || [];
      const missingKeywords = requiredKeywords.filter(
        (keyword: string) => !requirement.rationale!.includes(keyword)
      );

      if (missingKeywords.length > 0) {
        results.push({
          ruleId: 'rationale-keywords',
          ruleName: '理由のキーワード',
          message: `理由に推奨キーワードが含まれていません: ${missingKeywords.join('、')}`,
          severity: 'info',
          suggestion: `理由の記述に「${missingKeywords.join('」「')}」などの表現を含めると、より明確になります`,
        });
      }
    }

    // 説明との整合性チェック
    if (config.checkDescriptionAlignment) {
      const descKeywords = this.extractKeywords(requirement.description);
      const rationaleKeywords = this.extractKeywords(requirement.rationale);

      // 説明と理由で共通するキーワードがあるかチェック
      const commonKeywords = descKeywords.filter((k) => rationaleKeywords.includes(k));

      if (commonKeywords.length === 0 && descKeywords.length > 0) {
        results.push({
          ruleId: 'rationale-description-alignment',
          ruleName: '理由と説明の整合性',
          message: '理由と説明の内容に関連性が見られません',
          severity: 'warning',
          suggestion: '理由には、要求の説明で述べられている内容を踏まえた背景や根拠を記述してください',
        });
      }
    }

    // 上位要求との整合性チェック
    if (config.checkParentAlignment && context.parentRequirements.length > 0) {
      const hasParentReference = context.parentRequirements.some((parent) => {
        return requirement.rationale!.includes(parent.id) ||
               requirement.rationale!.includes(parent.title);
      });

      if (!hasParentReference) {
        const parentIds = context.parentRequirements.map((p) => p.id).join('、');
        results.push({
          ruleId: 'rationale-parent-reference',
          ruleName: '理由と上位要求の整合性',
          message: `理由に上位要求への言及がありません（上位要求: ${parentIds}）`,
          severity: 'warning',
          suggestion: `理由には上位要求（${parentIds}）をどのように実現するかを明記してください`,
        });
      }
    }

    return results;
  }

  /**
   * テキストからキーワードを抽出する補助関数
   */
  private extractKeywords(text: string): string[] {
    // 名詞や重要な動詞を抽出（簡易版）
    const keywords: string[] = [];

    // カタカナ語を抽出
    const katakanaMatches = text.match(/[ァ-ヴー]+/g);
    if (katakanaMatches) {
      keywords.push(...katakanaMatches);
    }

    // 漢字を含む単語を抽出（2文字以上）
    const kanjiMatches = text.match(/[一-龯ぁ-ん]{2,}/g);
    if (kanjiMatches) {
      keywords.push(...kanjiMatches);
    }

    return [...new Set(keywords)]; // 重複除去
  }

  private getDefaultConfig(): ValidationRuleConfig {
    return {
      parentConsistency: {
        enabled: true,
        severity: 'error',
        keywords: {
          stakeholder: ['を向上', 'を削減', 'を確保', 'を実現'],
          system: ['システムは', 'こと', '機能を提供'],
          functional: ['受け付ける', '処理する', '制御する'],
        },
      },
      refinement: {
        enabled: true,
        severity: 'error',
        hierarchy: {
          stakeholder: {
            subjectPattern: '^(作業員|オペレータ|管理者|利用者)',
            requiredPhrases: [],
            forbiddenPhrases: ['システムは', '機能', '実装'],
          },
          system: {
            subjectPattern: 'システムは|システムが',
            requiredPhrases: ['こと'],
            verbPattern: '.*すること',
          },
          functional: {
            requiredPhrases: [],
            maxComplexity: 3,
          },
        },
      },
      childConsistency: {
        enabled: true,
        severity: 'warning',
        minChildren: 1,
        maxChildren: 10,
      },
      decomposition: {
        enabled: true,
        severity: 'warning',
        checkOverlap: true,
        checkCoverage: true,
        similarityThreshold: 0.8,
      },
      granularity: {
        enabled: true,
        severity: 'info',
        descriptionLength: {
          stakeholder: { min: 30, max: 200 },
          system: { min: 20, max: 150 },
          functional: { min: 15, max: 100 },
        },
        complexityScore: {
          maxSentences: 3,
          maxClauses: 5,
        },
      },
    };
  }
}
