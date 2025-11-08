/**
 * 品質基準設定のローダー
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type {
  QualityThresholds,
  ValidationRuleConfig,
  ValidationRule,
  ViolationSeverity,
  ValidationResult,
} from '../types.js';

export class QualityThresholdsLoader {
  private static readonly DEFAULT_THRESHOLDS: QualityThresholds = {
    errorTolerance: 0,
    warningTolerance: Infinity,
    infoTolerance: Infinity,
    disabledRules: [],
    severityOverrides: {},
  };

  /**
   * config/quality-thresholds.json を読み込む
   * ファイルが存在しない場合はデフォルト設定を返す
   */
  static async loadThresholds(configPath?: string): Promise<QualityThresholds> {
    const defaultPath = path.join(process.cwd(), 'config/quality-thresholds.json');
    const filePath = configPath || defaultPath;

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const config = JSON.parse(content) as Partial<QualityThresholds>;

      // デフォルト値とマージ
      const thresholds: QualityThresholds = {
        errorTolerance: config.errorTolerance ?? this.DEFAULT_THRESHOLDS.errorTolerance,
        warningTolerance: config.warningTolerance ?? this.DEFAULT_THRESHOLDS.warningTolerance,
        infoTolerance: config.infoTolerance ?? this.DEFAULT_THRESHOLDS.infoTolerance,
        disabledRules: config.disabledRules ?? this.DEFAULT_THRESHOLDS.disabledRules,
        severityOverrides: config.severityOverrides ?? this.DEFAULT_THRESHOLDS.severityOverrides,
      };

      // バリデーション
      this.validateThresholds(thresholds);

      return thresholds;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // ファイルが存在しない場合はデフォルトを返す（警告なし）
        return this.DEFAULT_THRESHOLDS;
      }

      // JSON解析エラーなど
      console.error(`Failed to load quality thresholds from ${filePath}:`, error.message);
      console.error('Using default thresholds.');
      return this.DEFAULT_THRESHOLDS;
    }
  }

  /**
   * 設定値のバリデーション
   */
  private static validateThresholds(thresholds: QualityThresholds): void {
    // 負の許容数を0に修正
    if (thresholds.errorTolerance < 0) {
      console.warn(`Invalid errorTolerance (${thresholds.errorTolerance}), using 0`);
      thresholds.errorTolerance = 0;
    }
    if (thresholds.warningTolerance < 0) {
      console.warn(`Invalid warningTolerance (${thresholds.warningTolerance}), using 0`);
      thresholds.warningTolerance = 0;
    }
    if (thresholds.infoTolerance < 0) {
      console.warn(`Invalid infoTolerance (${thresholds.infoTolerance}), using 0`);
      thresholds.infoTolerance = 0;
    }

    // severityOverridesの値チェック
    const validSeverities: ViolationSeverity[] = ['error', 'warning', 'info'];
    for (const [ruleId, severity] of Object.entries(thresholds.severityOverrides)) {
      if (!validSeverities.includes(severity)) {
        console.warn(
          `Invalid severity "${severity}" for rule "${ruleId}". Valid values: error, warning, info. Skipping this override.`
        );
        delete thresholds.severityOverrides[ruleId];
      }
    }
  }

  /**
   * QualityThresholdsをValidationRuleConfigに適用
   * - disabledRulesに指定されたルールを無効化
   * - severityOverridesを適用
   */
  static applyToRuleConfig(
    config: ValidationRuleConfig,
    thresholds: QualityThresholds
  ): ValidationRuleConfig {
    // ディープコピー
    const newConfig: ValidationRuleConfig = JSON.parse(JSON.stringify(config));

    // 全ルールを取得
    const allRules: ValidationRule[] = [
      ...newConfig.rules.hierarchy,
      ...newConfig.rules.graph_health,
      ...newConfig.rules.abstraction,
      ...newConfig.rules.mece,
      ...newConfig.rules.quality_style,
    ];

    // disabledRulesの適用
    for (const ruleId of thresholds.disabledRules) {
      const rule = allRules.find((r) => r.id === ruleId);
      if (rule) {
        rule.enabled = false;
      } else {
        console.warn(`Rule "${ruleId}" not found. Skipping disable.`);
      }
    }

    // severityOverridesの適用
    for (const [ruleId, newSeverity] of Object.entries(thresholds.severityOverrides)) {
      const rule = allRules.find((r) => r.id === ruleId);
      if (rule) {
        rule.severity = newSeverity;
      } else {
        console.warn(`Rule "${ruleId}" not found. Skipping severity override.`);
      }
    }

    return newConfig;
  }

  /**
   * 検証結果が許容範囲内かチェック
   */
  static checkTolerances(
    results: Map<string, ValidationResult>,
    thresholds: QualityThresholds
  ): {
    withinTolerance: boolean;
    summary: {
      errorCount: number;
      warningCount: number;
      infoCount: number;
      exceedsError: boolean;
      exceedsWarning: boolean;
      exceedsInfo: boolean;
    };
  } {
    let errorCount = 0;
    let warningCount = 0;
    let infoCount = 0;

    // 全違反を集計
    for (const result of results.values()) {
      for (const violation of result.violations) {
        if (violation.severity === 'error') errorCount++;
        else if (violation.severity === 'warning') warningCount++;
        else if (violation.severity === 'info') infoCount++;
      }
    }

    const exceedsError = errorCount > thresholds.errorTolerance;
    const exceedsWarning = warningCount > thresholds.warningTolerance;
    const exceedsInfo = infoCount > thresholds.infoTolerance;

    return {
      withinTolerance: !exceedsError && !exceedsWarning && !exceedsInfo,
      summary: {
        errorCount,
        warningCount,
        infoCount,
        exceedsError,
        exceedsWarning,
        exceedsInfo,
      },
    };
  }

  /**
   * デフォルト設定を取得
   */
  static getDefaultThresholds(): QualityThresholds {
    return { ...this.DEFAULT_THRESHOLDS };
  }
}
