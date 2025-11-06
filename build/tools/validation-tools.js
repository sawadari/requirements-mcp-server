/**
 * Validation Tools for MCP Server
 * 妥当性チェック関連のツール群
 */
import { createLogger } from '../common/logger.js';
const logger = createLogger('ValidationTools');
export class ValidationTools {
    storage;
    validationEngine;
    constructor(storage, validationEngine) {
        this.storage = storage;
        this.validationEngine = validationEngine;
    }
    /**
     * 全要求をMapに変換
     */
    async getAllRequirementsMap() {
        await this.storage.initialize();
        const allReqs = await this.storage.getAllRequirements();
        const reqMap = new Map();
        allReqs.forEach(req => reqMap.set(req.id, req));
        return reqMap;
    }
    /**
     * 単一要求の妥当性チェック
     */
    async validateRequirement(id, options = {}) {
        logger.info(`Validating requirement: ${id}`);
        await this.storage.initialize();
        const requirement = await this.storage.getRequirement(id);
        if (!requirement) {
            throw new Error(`Requirement not found: ${id}`);
        }
        const allRequirements = await this.getAllRequirementsMap();
        const validationResult = await this.validationEngine.validateRequirement(requirement, allRequirements, {
            useLLM: options.useLLM ?? false,
            updateMetrics: options.updateMetrics ?? false,
        });
        const errors = [];
        const warnings = [];
        validationResult.violations.forEach(violation => {
            const error = {
                requirementId: id,
                field: 'general',
                severity: violation.severity,
                message: violation.message,
                rule: violation.ruleId,
            };
            if (violation.severity === 'error') {
                errors.push(error);
            }
            else if (violation.severity === 'warning') {
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
    async validateAllRequirements(options = {}) {
        logger.info('Validating all requirements');
        await this.storage.initialize();
        const allReqs = await this.storage.getAllRequirements();
        const results = [];
        for (const requirement of allReqs) {
            try {
                const result = await this.validateRequirement(requirement.id, options);
                results.push(result);
            }
            catch (error) {
                const err = error;
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
    async getValidationErrors(options = {}) {
        logger.info('Getting validation errors');
        const results = options.requirementId
            ? [await this.validateRequirement(options.requirementId)]
            : await this.validateAllRequirements();
        const allErrors = [];
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
    async suggestFixes(requirementId) {
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
