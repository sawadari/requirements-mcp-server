/**
 * ValidationService
 * 要求変更時の自動検証・修正を統合管理
 */
import fs from 'fs/promises';
import path from 'path';
import { ValidationEngine } from './validation/validation-engine.js';
import { FixExecutor } from './fix-engine/fix-executor.js';
import { parse as parseJsonc } from 'jsonc-parser';
export class ValidationService {
    validationEngine = null;
    fixExecutor = null;
    config;
    configPath;
    constructor(configPath = './src/auto-validation-config.jsonc') {
        this.configPath = configPath;
        this.config = this.getDefaultConfig();
    }
    getDefaultConfig() {
        return {
            autoValidation: {
                enabled: true,
                validation: {
                    useLLM: false,
                    updateMetrics: true,
                },
            },
            autoFix: {
                enabled: true,
                mode: 'strict',
                policyFile: './src/fix-engine/fix-policy.jsonc',
                revalidateAfterFix: true,
                maxIterations: 3,
                fixSeverity: 'error',
            },
            logging: {
                enabled: true,
                verbose: false,
            },
        };
    }
    async initialize() {
        // 設定ファイル読み込み
        try {
            const configData = await fs.readFile(this.configPath, 'utf-8');
            const parsed = parseJsonc(configData);
            this.config = { ...this.getDefaultConfig(), ...parsed };
            this.log('ValidationService initialized with config:', this.config);
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                this.log('Config file not found, using default config');
                // デフォルト設定を保存
                await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
            }
            else {
                throw error;
            }
        }
        // ValidationEngineを初期化
        try {
            this.validationEngine = await ValidationEngine.create();
            this.log('ValidationEngine initialized');
        }
        catch (error) {
            console.error('Failed to initialize ValidationEngine:', error);
        }
        // FixExecutorを初期化（ポリシーファイル読み込み）
        if (this.config.autoFix.enabled && this.config.autoFix.mode !== 'disabled') {
            try {
                const policyPath = path.resolve(this.config.autoFix.policyFile);
                const policyData = await fs.readFile(policyPath, 'utf-8');
                const policy = parseJsonc(policyData);
                this.fixExecutor = new FixExecutor(policy);
                this.log('FixExecutor initialized with policy:', policy.policy);
            }
            catch (error) {
                if (error.code === 'ENOENT') {
                    this.log('Policy file not found, auto-fix disabled');
                }
                else {
                    console.error('Failed to initialize FixExecutor:', error);
                }
            }
        }
    }
    /**
     * 要求変更後の自動検証・修正
     * @param requirement 変更された要求
     * @param allRequirements 全要求のMap
     * @returns 修正結果（修正が適用された場合は新しい要求Map、なければ元のまま）
     */
    async validateAndFix(requirement, allRequirements) {
        const log = [];
        // 自動検証が無効なら何もしない
        if (!this.config.autoValidation.enabled) {
            return {
                modifiedRequirements: allRequirements,
                validationResult: null,
                fixResult: null,
            };
        }
        if (!this.validationEngine) {
            this.log('ValidationEngine not initialized, skipping validation');
            return {
                modifiedRequirements: allRequirements,
                validationResult: null,
                fixResult: null,
            };
        }
        // 1. 要求を検証
        log.push(`[ValidationService] Validating requirement: ${requirement.id}`);
        const validationResult = await this.validationEngine.validateRequirement(requirement, allRequirements, {
            useLLM: this.config.autoValidation.validation.useLLM,
            updateMetrics: this.config.autoValidation.validation.updateMetrics,
        });
        log.push(`[ValidationService] Validation result: score=${validationResult.score}, violations=${validationResult.violations.length}`);
        // 2. 違反がなければ終了
        if (validationResult.violations.length === 0) {
            log.push('[ValidationService] No violations found, skipping fix');
            this.logAll(log);
            return {
                modifiedRequirements: allRequirements,
                validationResult,
                fixResult: null,
            };
        }
        // 3. 自動修正が無効なら検証結果のみ返す
        if (!this.config.autoFix.enabled ||
            this.config.autoFix.mode === 'disabled' ||
            !this.fixExecutor) {
            log.push('[ValidationService] Auto-fix is disabled');
            this.logAll(log);
            return {
                modifiedRequirements: allRequirements,
                validationResult,
                fixResult: null,
            };
        }
        // 4. 修正対象の違反をフィルタリング
        const targetViolations = this.filterViolationsBySeverity(validationResult.violations, this.config.autoFix.fixSeverity);
        if (targetViolations.length === 0) {
            log.push(`[ValidationService] No violations with severity >= ${this.config.autoFix.fixSeverity}`);
            this.logAll(log);
            return {
                modifiedRequirements: allRequirements,
                validationResult,
                fixResult: null,
            };
        }
        log.push(`[ValidationService] Attempting to fix ${targetViolations.length} violations`);
        // 5. 修正を実行
        let currentRequirements = new Map(allRequirements);
        let changesApplied = 0;
        let iteration = 0;
        while (iteration < this.config.autoFix.maxIterations) {
            iteration++;
            log.push(`[ValidationService] Fix iteration ${iteration}`);
            // 全要求を再検証
            const allValidationResults = await this.validationEngine.validateAll(currentRequirements, {
                useLLM: this.config.autoValidation.validation.useLLM,
                updateMetrics: this.config.autoValidation.validation.updateMetrics,
            });
            // 修正対象の違反を収集
            const allViolations = [];
            for (const [reqId, result] of allValidationResults.entries()) {
                const filtered = this.filterViolationsBySeverity(result.violations, this.config.autoFix.fixSeverity);
                for (const violation of filtered) {
                    allViolations.push({ requirementId: reqId, violation });
                }
            }
            if (allViolations.length === 0) {
                log.push('[ValidationService] All violations fixed');
                break;
            }
            log.push(`[ValidationService] Found ${allViolations.length} violations to fix`);
            // 型変換: Requirement -> FixEngine.Requirement
            const fixEngineReqs = {};
            for (const [id, req] of currentRequirements.entries()) {
                fixEngineReqs[id] = {
                    ...req,
                    createdAt: req.createdAt?.toISOString() || new Date().toISOString(),
                    updatedAt: req.updatedAt?.toISOString() || new Date().toISOString(),
                };
            }
            // FixExecutorで修正を実行
            const fixResult = await this.fixExecutor.execute(fixEngineReqs, async (reqs) => {
                // 型変換: FixEngine.Requirement -> Requirement
                const reqsMap = new Map();
                for (const [id, req] of Object.entries(reqs)) {
                    const createdAt = typeof req.createdAt === 'string' ? new Date(req.createdAt) : new Date(req.createdAt || Date.now());
                    const updatedAt = typeof req.updatedAt === 'string' ? new Date(req.updatedAt) : new Date(req.updatedAt || Date.now());
                    reqsMap.set(id, {
                        id: req.id,
                        title: req.title,
                        description: req.description,
                        status: req.status, // Fix Engine uses string, Storage uses RequirementStatus
                        priority: req.priority,
                        category: req.category,
                        type: req.type,
                        tags: req.tags || [],
                        dependencies: req.depends_on || [],
                        refines: req.refines,
                        depends_on: req.depends_on,
                        createdAt,
                        updatedAt,
                        author: req.author,
                        assignee: req.assignee,
                        rationale: req.rationale,
                    });
                }
                const results = await this.validationEngine.validateAll(reqsMap, {
                    useLLM: false,
                    updateMetrics: false,
                });
                return Array.from(results.values());
            });
            if (fixResult.success && fixResult.appliedChangeSets && fixResult.appliedChangeSets.length > 0) {
                // 型変換: FixEngine.Requirement -> Requirement
                const convertedReqs = new Map();
                for (const [id, req] of Object.entries(fixResult.requirements || {})) {
                    const createdAt = typeof req.createdAt === 'string' ? new Date(req.createdAt) : new Date(req.createdAt || Date.now());
                    const updatedAt = typeof req.updatedAt === 'string' ? new Date(req.updatedAt) : new Date(req.updatedAt || Date.now());
                    convertedReqs.set(id, {
                        id: req.id,
                        title: req.title,
                        description: req.description,
                        status: req.status,
                        priority: req.priority,
                        category: req.category,
                        type: req.type,
                        tags: req.tags || [],
                        dependencies: req.depends_on || [],
                        refines: req.refines,
                        depends_on: req.depends_on,
                        createdAt,
                        updatedAt,
                        author: req.author,
                        assignee: req.assignee,
                        rationale: req.rationale,
                    });
                }
                currentRequirements = convertedReqs;
                changesApplied += fixResult.appliedChangeSets.length;
                log.push(`[ValidationService] Applied ${fixResult.appliedChangeSets.length} ChangeSets`);
            }
            else {
                log.push('[ValidationService] No changes applied, stopping');
                break;
            }
        }
        // 6. 最終検証
        let finalValidation = null;
        if (this.config.autoFix.revalidateAfterFix) {
            log.push('[ValidationService] Running final validation');
            const updatedReq = currentRequirements.get(requirement.id);
            if (updatedReq) {
                finalValidation = await this.validationEngine.validateRequirement(updatedReq, currentRequirements, {
                    useLLM: this.config.autoValidation.validation.useLLM,
                    updateMetrics: this.config.autoValidation.validation.updateMetrics,
                });
                log.push(`[ValidationService] Final validation: score=${finalValidation.score ?? 0}, violations=${finalValidation.violations.length}`);
            }
        }
        const fixResult = {
            applied: changesApplied > 0,
            changesApplied,
            modifiedRequirements: currentRequirements,
            finalValidation: finalValidation || undefined,
            log,
        };
        this.logAll(log);
        return {
            modifiedRequirements: currentRequirements,
            validationResult,
            fixResult,
        };
    }
    /**
     * 深刻度でフィルタリング
     */
    filterViolationsBySeverity(violations, minSeverity) {
        const severityRank = { error: 3, warning: 2, info: 1 };
        const minRank = severityRank[minSeverity];
        return violations.filter((v) => severityRank[v.severity] >= minRank);
    }
    log(...args) {
        if (this.config.logging.enabled) {
            if (this.config.logging.verbose) {
                console.error('[ValidationService]', ...args);
            }
        }
    }
    logAll(logs) {
        if (this.config.logging.enabled && this.config.logging.verbose) {
            for (const log of logs) {
                console.error(log);
            }
        }
    }
    /**
     * 設定を取得
     */
    getConfig() {
        return this.config;
    }
    /**
     * 設定を更新
     */
    async updateConfig(updates) {
        this.config = { ...this.config, ...updates };
        await fs.writeFile(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
        this.log('Config updated:', this.config);
    }
}
