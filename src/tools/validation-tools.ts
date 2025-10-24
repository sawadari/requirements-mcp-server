/**
 * Validation Tools for MCP Server
 * 妥当性チェック関連のツール群
 */

import { RequirementsStorage } from '../storage.js';
import { ValidationEngine } from '../validation/validation-engine.js';
import { Requirement } from '../types.js';
import { createLogger } from '../common/logger.js';

const logger = createLogger('ValidationTools');

export interface ValidationError {
  requirementId: string;
  field: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  rule?: string;
}

export interface ValidationToolResult {
  requirementId: string;
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  timestamp: Date;
}

export class ValidationTools {
  constructor(
    private storage: RequirementsStorage,
    private validationEngine: ValidationEngine
  ) {}

  /**
   * 全要求をMapに変換
   */
  private async getAllRequirementsMap(): Promise<Map<string, Requirement>> {
    await this.storage.initialize();
    const allReqs = await this.storage.getAllRequirements();
    const reqMap = new Map<string, Requirement>();
    allReqs.forEach(req => reqMap.set(req.id, req));
    return reqMap;
  }

  /**
   * 単一要求の妥当性チェック
   */
  async validateRequirement(
    id: string,
    options: { useLLM?: boolean; updateMetrics?: boolean } = {}
  ): Promise<ValidationToolResult> {
    logger.info(`Validating requirement: ${id}`);

    await this.storage.initialize();
    const requirement = await this.storage.getRequirement(id);

    if (!requirement) {
      throw new Error(`Requirement not found: ${id}`);
    }

    const allRequirements = await this.getAllRequirementsMap();

    const validationResult = await this.validationEngine.validateRequirement(
      requirement,
      allRequirements,
      {
        useLLM: options.useLLM ?? false,
        updateMetrics: options.updateMetrics ?? false,
      }
    );

    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    validationResult.violations.forEach(violation => {
      const error: ValidationError = {
        requirementId: id,
        field: 'general',
        severity: violation.severity,
        message: violation.message,
        rule: violation.ruleId,
      };

      if (violation.severity === 'error') {
        errors.push(error);
      } else if (violation.severity === 'warning') {
        warnings.push(error);
      }
    });

    return {
      requirementId: id,
      isValid: validationResult.passed,
      errors,
      warnings,
      timestamp: new Date(),
    };
  }

  /**
   * 全要求の一括検証
   */
  async validateAllRequirements(
    options: { useLLM?: boolean; updateMetrics?: boolean } = {}
  ): Promise<ValidationToolResult[]> {
    logger.info('Validating all requirements');

    await this.storage.initialize();
    const allReqs = await this.storage.getAllRequirements();

    const results: ValidationToolResult[] = [];

    for (const requirement of allReqs) {
      try {
        const result = await this.validateRequirement(requirement.id, options);
        results.push(result);
      } catch (error: unknown) {
        const err = error as Error;
        logger.error(`Failed to validate ${requirement.id}`, err);
        results.push({
          requirementId: requirement.id,
          isValid: false,
          errors: [{
            requirementId: requirement.id,
            field: 'general',
            severity: 'error',
            message: err.message,
          }],
          warnings: [],
          timestamp: new Date(),
        });
      }
    }

    return results;
  }

  /**
   * 検証エラー一覧取得
   */
  async getValidationErrors(
    options: { severity?: 'error' | 'warning'; requirementId?: string } = {}
  ): Promise<ValidationError[]> {
    logger.info('Getting validation errors');

    const results = options.requirementId
      ? [await this.validateRequirement(options.requirementId)]
      : await this.validateAllRequirements();

    const allErrors: ValidationError[] = [];

    for (const result of results) {
      const errors = options.severity === 'warning'
        ? result.warnings
        : options.severity === 'error'
        ? result.errors
        : [...result.errors, ...result.warnings];

      allErrors.push(...errors);
    }

    return allErrors;
  }

  /**
   * 修正提案を生成（簡易版）
   */
  async suggestFixes(requirementId?: string): Promise<Array<{
    requirementId: string;
    field: string;
    currentValue: string;
    suggestedValue: string;
    reason: string;
  }>> {
    logger.info(`Suggesting fixes for ${requirementId || 'all requirements'}`);

    const errors = await this.getValidationErrors({
      severity: 'error',
      requirementId
    });

    // 簡易的な修正提案（今後拡張可能）
    return errors.map(error => ({
      requirementId: error.requirementId,
      field: error.field,
      currentValue: '',
      suggestedValue: 'Please fix manually',
      reason: error.message,
    }));
  }
}
