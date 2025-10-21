/**
 * 統合検証エンジン
 * 全ドメイン（A-E）の検証を統合し、ルール設定の読み込みと検証実行を管理
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type {
  Requirement,
  ValidationViolation,
  ValidationResult,
  ValidationRule,
  ValidationRuleConfig,
} from '../types.js';

import { StructureValidationEngine, HierarchyValidator, GraphHealthValidator } from './structure-validator.js';
import { NLPAnalyzer, QualityStyleValidator } from './nlp-analyzer.js';
import { AbstractionValidator, MECEValidator } from './mece-validator.js';
import { LLMEvaluator } from './llm-evaluator.js';
import { OntologyManager, OntologyLoader } from '../ontology/index.js';

/**
 * ルール設定ローダー
 */
export class RuleConfigLoader {
  private static cachedConfig: ValidationRuleConfig | null = null;

  /**
   * validation-rules.jsonc を読み込み
   */
  static async loadRules(configPath?: string): Promise<ValidationRuleConfig> {
    if (this.cachedConfig) {
      return this.cachedConfig;
    }

    const defaultPath = path.join(process.cwd(), 'validation-rules.jsonc');
    const filePath = configPath || defaultPath;

    try {
      const content = await fs.readFile(filePath, 'utf-8');

      // JSONCのコメントを削除（簡易実装）
      const jsonContent = content
        .split('\n')
        .filter(line => !line.trim().startsWith('//'))
        .join('\n')
        .replace(/,(\s*[}\]])/g, '$1'); // trailing commas対応

      const config = JSON.parse(jsonContent) as ValidationRuleConfig;
      this.cachedConfig = config;
      return config;
    } catch (error) {
      console.error(`Failed to load validation rules from ${filePath}:`, error);
      // デフォルト設定を返す
      return this.getDefaultConfig();
    }
  }

  /**
   * デフォルトルール設定を取得
   */
  static getDefaultConfig(): ValidationRuleConfig {
    return {
      version: '1.0.0',
      rules: {
        hierarchy: [
          {
            id: 'A1',
            domain: 'hierarchy',
            name: 'レベル間の関係制約',
            description: 'stakeholder要求はsystem要求のみを子に持つ',
            severity: 'error',
            enabled: true,
            parameters: {
              allowedParentChildPairs: [
                { parent: 'stakeholder', child: 'system' },
                { parent: 'system', child: 'system_functional' },
              ],
            },
          },
          {
            id: 'A2',
            domain: 'hierarchy',
            name: '親要求の存在チェック',
            description: 'system/functional要求は親を持つ必要がある',
            severity: 'error',
            enabled: true,
            parameters: {
              requireParent: ['system', 'system_functional'],
            },
          },
        ],
        graph_health: [
          {
            id: 'B1',
            domain: 'graph_health',
            name: 'DAG検証',
            description: 'グラフは有向非巡回グラフでなければならない',
            severity: 'error',
            enabled: true,
          },
        ],
        abstraction: [],
        mece: [],
        quality_style: [],
      },
    };
  }

  /**
   * キャッシュをクリア
   */
  static clearCache(): void {
    this.cachedConfig = null;
  }
}

/**
 * 統合検証エンジン
 */
export class ValidationEngine {
  private config: ValidationRuleConfig;
  private ontologyManager?: OntologyManager;

  constructor(config: ValidationRuleConfig, ontologyManager?: OntologyManager) {
    this.config = config;
    this.ontologyManager = ontologyManager;

    // Set ontology manager for validators
    if (ontologyManager) {
      HierarchyValidator.setOntologyManager(ontologyManager);
    }
  }

  /**
   * ファクトリメソッド: ルール設定を読み込んでエンジンを作成
   */
  static async create(configPath?: string, ontologyPath?: string): Promise<ValidationEngine> {
    const config = await RuleConfigLoader.loadRules(configPath);

    // Load ontology if path provided or from environment
    let ontologyManager: OntologyManager | undefined;
    try {
      if (ontologyPath) {
        ontologyManager = await OntologyLoader.loadFromFile(ontologyPath);
      } else {
        ontologyManager = await OntologyLoader.loadFromEnvironment();
      }
    } catch (error) {
      console.warn('Failed to load ontology, continuing without it:', error);
    }

    return new ValidationEngine(config, ontologyManager);
  }

  /**
   * Get the ontology manager
   */
  getOntologyManager(): OntologyManager | undefined {
    return this.ontologyManager;
  }

  /**
   * 単一要求を検証
   */
  async validateRequirement(
    req: Requirement,
    allRequirements: Map<string, Requirement>,
    options: {
      useLLM?: boolean;
      updateMetrics?: boolean;
    } = {}
  ): Promise<ValidationResult> {
    const violations: ValidationViolation[] = [];

    // NLP指標を計算・更新（オプション）
    if (options.updateMetrics) {
      const metrics = NLPAnalyzer.analyzeRequirement(req);
      Object.assign(req, metrics);
    }

    // A: 階層ルール
    const hierarchyRules = this.config.rules.hierarchy.filter(r => r.enabled);
    const hierarchyViolations = StructureValidationEngine.validateRequirement(
      req,
      allRequirements,
      hierarchyRules
    );
    violations.push(...hierarchyViolations);

    // B: グラフヘルス（要求単位: B2-B5）
    const graphRules = this.config.rules.graph_health.filter(r => r.enabled && r.id !== 'B1');
    const graphViolations = StructureValidationEngine.validateRequirement(
      req,
      allRequirements,
      graphRules
    );
    violations.push(...graphViolations);

    // C: 抽象度ルール
    const abstractionRules = this.config.rules.abstraction.filter(r => r.enabled);
    const abstractionViolations = AbstractionValidator.validateAll(
      req,
      allRequirements,
      abstractionRules
    );
    violations.push(...abstractionViolations);

    // D: MECEルール
    const meceRules = this.config.rules.mece.filter(r => r.enabled);
    if (this.ontologyManager) {
      MECEValidator.setOntologyManager(this.ontologyManager);
    }
    const meceViolations = MECEValidator.validateAll(
      req,
      allRequirements,
      meceRules
    );
    violations.push(...meceViolations);

    // E: 品質スタイルルール
    const qualityRules = this.config.rules.quality_style.filter(r => r.enabled);
    const qualityViolations = QualityStyleValidator.validateAll(req, qualityRules);
    violations.push(...qualityViolations);

    // LLM評価を追加（オプション）
    let enhancedViolations = violations;
    if (options.useLLM && LLMEvaluator.isAvailable()) {
      enhancedViolations = await Promise.all(
        violations.map(v => LLMEvaluator.enhanceViolationWithLLM(req, v, allRequirements))
      );
    }

    // スコア計算
    const score = this.calculateQualityScore(enhancedViolations);

    return {
      requirementId: req.id,
      validatedAt: new Date().toISOString(),
      violations: enhancedViolations,
      passed: enhancedViolations.length === 0,
      score,
    };
  }

  /**
   * 全要求を検証
   */
  async validateAll(
    allRequirements: Map<string, Requirement>,
    options: {
      useLLM?: boolean;
      updateMetrics?: boolean;
    } = {}
  ): Promise<Map<string, ValidationResult>> {
    const results = new Map<string, ValidationResult>();

    // NLP指標を一括計算（オプション）
    if (options.updateMetrics) {
      for (const [id, req] of allRequirements) {
        const metrics = NLPAnalyzer.analyzeRequirement(req);
        Object.assign(req, metrics);
      }
    }

    // グラフ全体のチェック（B1: DAG）
    const dagRule = this.config.rules.graph_health.find(r => r.id === 'B1' && r.enabled);
    const globalViolations = new Map<string, ValidationViolation[]>();

    if (dagRule) {
      const dagViolations = GraphHealthValidator.validateDAG(allRequirements, dagRule);
      for (const violation of dagViolations) {
        const existing = globalViolations.get(violation.requirementId) || [];
        globalViolations.set(violation.requirementId, [...existing, violation]);
      }
    }

    // 個別要求のチェック
    for (const [id, req] of allRequirements) {
      const result = await this.validateRequirement(req, allRequirements, {
        useLLM: options.useLLM,
        updateMetrics: false, // 既に一括更新済み
      });

      // グローバル違反を追加
      const global = globalViolations.get(id) || [];
      const allViolations = [...result.violations, ...global];

      results.set(id, {
        ...result,
        violations: allViolations,
        passed: allViolations.length === 0,
        score: this.calculateQualityScore(allViolations),
      });
    }

    return results;
  }

  /**
   * 品質スコアを計算（0-100）
   * 違反の重要度と数に基づいてスコアを算出
   */
  private calculateQualityScore(violations: ValidationViolation[]): number {
    if (violations.length === 0) {
      return 100;
    }

    const weights = {
      error: 20,
      warning: 10,
      info: 5,
    };

    const totalDeduction = violations.reduce((sum, v) => {
      return sum + weights[v.severity];
    }, 0);

    return Math.max(0, 100 - totalDeduction);
  }

  /**
   * 検証レポートを生成（Markdown形式）
   */
  generateReport(
    results: Map<string, ValidationResult>,
    allRequirements: Map<string, Requirement>
  ): string {
    const totalRequirements = results.size;
    const passedRequirements = Array.from(results.values()).filter(r => r.passed).length;
    const totalViolations = Array.from(results.values()).reduce(
      (sum, r) => sum + r.violations.length,
      0
    );

    const avgScore =
      Array.from(results.values()).reduce((sum, r) => sum + (r.score || 0), 0) /
      totalRequirements;

    let report = `# 要求検証レポート

生成日時: ${new Date().toLocaleString('ja-JP')}

## サマリー

- 総要求数: ${totalRequirements}
- 合格要求数: ${passedRequirements} (${((passedRequirements / totalRequirements) * 100).toFixed(1)}%)
- 総違反数: ${totalViolations}
- 平均品質スコア: ${avgScore.toFixed(1)} / 100

## 違反数別の内訳

`;

    // 重要度別の集計
    const bySeverity = {
      error: 0,
      warning: 0,
      info: 0,
    };

    for (const result of results.values()) {
      for (const violation of result.violations) {
        bySeverity[violation.severity]++;
      }
    }

    report += `- エラー: ${bySeverity.error}\n`;
    report += `- 警告: ${bySeverity.warning}\n`;
    report += `- 情報: ${bySeverity.info}\n\n`;

    // ドメイン別の集計
    const byDomain = new Map<string, number>();
    for (const result of results.values()) {
      for (const violation of result.violations) {
        const count = byDomain.get(violation.ruleDomain) || 0;
        byDomain.set(violation.ruleDomain, count + 1);
      }
    }

    report += `## ドメイン別の違反数\n\n`;
    for (const [domain, count] of byDomain) {
      report += `- ${domain}: ${count}\n`;
    }
    report += '\n';

    // 違反のある要求のリスト
    const violatedRequirements = Array.from(results.entries())
      .filter(([_, result]) => !result.passed)
      .sort((a, b) => (b[1].score || 0) - (a[1].score || 0)); // スコアの低い順

    if (violatedRequirements.length > 0) {
      report += `## 違反のある要求（スコア順）\n\n`;

      for (const [reqId, result] of violatedRequirements) {
        const req = allRequirements.get(reqId);
        if (!req) continue;

        report += `### ${req.id}: ${req.title}\n\n`;
        report += `- スコア: ${result.score}/100\n`;
        report += `- 違反数: ${result.violations.length}\n\n`;

        for (const violation of result.violations) {
          report += `- **[${violation.severity.toUpperCase()}] ${violation.ruleId}**: ${violation.message}\n`;
          if (violation.details) {
            report += `  - ${violation.details}\n`;
          }
          if (violation.suggestedFix) {
            report += `  - 💡 ${violation.suggestedFix}\n`;
          }
        }
        report += '\n';
      }
    }

    return report;
  }

  /**
   * ルール設定を取得
   */
  getConfig(): ValidationRuleConfig {
    return this.config;
  }
}
