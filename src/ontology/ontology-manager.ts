/**
 * OntologyManager - オントロジーの管理と検証
 */

import type {
  OntologySchema,
  StageDefinition,
  DerivationRule,
  GranularityRule,
  StageValidationRule,
  OntologyValidationError,
  OntologyValidationResult,
} from './types.js';
import { createLogger } from '../common/logger.js';

const logger = createLogger('OntologyManager');

export class OntologyManager {
  private schema: OntologySchema;
  private stageMap: Map<string, StageDefinition>;

  constructor(schema: OntologySchema) {
    this.schema = schema;
    this.stageMap = new Map();

    // ステージマップを構築
    for (const stage of schema.stages) {
      this.stageMap.set(stage.id, stage);
    }

    logger.info('OntologyManager initialized', {
      version: schema.version,
      stagesCount: schema.stages.length,
    });
  }

  /**
   * スキーマを検証
   */
  validateSchema(): OntologyValidationResult {
    const errors: OntologyValidationError[] = [];

    // 1. 段階定義の検証
    for (const stage of this.schema.stages) {
      // 親段階の存在確認
      for (const parentId of stage.parentStages) {
        if (!this.stageMap.has(parentId)) {
          errors.push({
            code: 'INVALID_PARENT_STAGE',
            message: `Stage "${stage.id}" references non-existent parent stage "${parentId}"`,
            stageId: stage.id,
          });
        }
      }

      // 子段階の存在確認
      for (const childId of stage.childStages) {
        if (!this.stageMap.has(childId)) {
          errors.push({
            code: 'INVALID_CHILD_STAGE',
            message: `Stage "${stage.id}" references non-existent child stage "${childId}"`,
            stageId: stage.id,
          });
        }
      }

      // レベルの整合性
      if (stage.level < 1) {
        errors.push({
          code: 'INVALID_LEVEL',
          message: `Stage "${stage.id}" has invalid level ${stage.level} (must be >= 1)`,
          stageId: stage.id,
        });
      }
    }

    // 2. 派生ルールの検証
    for (const [stageId, rule] of Object.entries(this.schema.derivationRules)) {
      if (!this.stageMap.has(stageId)) {
        errors.push({
          code: 'INVALID_DERIVATION_RULE',
          message: `Derivation rule references non-existent stage "${stageId}"`,
        });
      }

      for (const childId of rule.allowedChildren) {
        if (!this.stageMap.has(childId)) {
          errors.push({
            code: 'INVALID_DERIVATION_CHILD',
            message: `Derivation rule for "${stageId}" references non-existent child stage "${childId}"`,
            stageId,
          });
        }
      }
    }

    // 3. 粒度ルールの検証
    for (const [stageId, rule] of Object.entries(this.schema.granularityRules)) {
      if (!this.stageMap.has(stageId)) {
        errors.push({
          code: 'INVALID_GRANULARITY_RULE',
          message: `Granularity rule references non-existent stage "${stageId}"`,
        });
      }

      // 長さ制約の妥当性
      if (rule.descriptionLength.min > rule.descriptionLength.max) {
        errors.push({
          code: 'INVALID_LENGTH_CONSTRAINT',
          message: `Stage "${stageId}" has invalid description length constraint (min > max)`,
          stageId,
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * 段階が有効か検証
   */
  validateStage(stageId: string): boolean {
    return this.stageMap.has(stageId);
  }

  /**
   * 段階情報を取得
   */
  getStageInfo(stageId: string): StageDefinition | null {
    return this.stageMap.get(stageId) || null;
  }

  /**
   * すべての段階を取得
   */
  getAllStages(): StageDefinition[] {
    return Array.from(this.stageMap.values());
  }

  /**
   * レベル順にソートされた段階を取得
   */
  getStagesByLevel(): StageDefinition[] {
    return Array.from(this.stageMap.values()).sort((a, b) => a.level - b.level);
  }

  /**
   * 許可される親段階を取得
   */
  getAllowedParentStages(stageId: string): string[] {
    const stage = this.stageMap.get(stageId);
    return stage ? stage.parentStages : [];
  }

  /**
   * 許可される子段階を取得
   */
  getAllowedChildStages(stageId: string): string[] {
    const stage = this.stageMap.get(stageId);
    return stage ? stage.childStages : [];
  }

  /**
   * 派生が妥当か検証
   */
  validateDerivation(parentStageId: string, childStageId: string): boolean {
    const parentStage = this.stageMap.get(parentStageId);
    if (!parentStage) {
      return false;
    }

    return parentStage.childStages.includes(childStageId);
  }

  /**
   * 粒度ルールを取得
   */
  getGranularityRules(stageId: string): GranularityRule | null {
    return this.schema.granularityRules[stageId] || null;
  }

  /**
   * 派生ルールを取得
   */
  getDerivationRule(stageId: string): DerivationRule | null {
    return this.schema.derivationRules[stageId] || null;
  }

  /**
   * バリデーションルールを取得
   */
  getValidationRule(stageId: string): StageValidationRule | null {
    return this.schema.validationRules.byStage[stageId] || null;
  }

  /**
   * グローバルバリデーションルールを取得
   */
  getGlobalValidationRules() {
    return this.schema.validationRules.global;
  }

  /**
   * MECEが必須か確認
   */
  isMeceRequired(stageId: string): boolean {
    const rule = this.getDerivationRule(stageId);
    return rule ? rule.meceRequired : false;
  }

  /**
   * 段階が子を持てるか確認
   */
  canHaveChildren(stageId: string): boolean {
    const stage = this.stageMap.get(stageId);
    return stage ? stage.canHaveChildren : false;
  }

  /**
   * 段階が親を持てるか確認
   */
  canHaveParent(stageId: string): boolean {
    const stage = this.stageMap.get(stageId);
    return stage ? stage.canHaveParent : false;
  }

  /**
   * 最上位段階を取得
   */
  getRootStages(): StageDefinition[] {
    return Array.from(this.stageMap.values()).filter((stage) => !stage.canHaveParent);
  }

  /**
   * 最下位段階を取得
   */
  getLeafStages(): StageDefinition[] {
    return Array.from(this.stageMap.values()).filter((stage) => !stage.canHaveChildren);
  }

  /**
   * 段階間の階層関係を検証
   */
  validateHierarchy(stages: Array<{ id: string; type: string; parentId?: string }>): OntologyValidationResult {
    const errors: OntologyValidationError[] = [];

    for (const req of stages) {
      // 段階の存在確認
      if (!this.validateStage(req.type)) {
        errors.push({
          code: 'INVALID_STAGE',
          message: `Requirement "${req.id}" has invalid stage "${req.type}"`,
          stageId: req.type,
        });
        continue;
      }

      // 親子関係の検証
      if (req.parentId) {
        const parent = stages.find((s) => s.id === req.parentId);
        if (!parent) {
          errors.push({
            code: 'PARENT_NOT_FOUND',
            message: `Requirement "${req.id}" references non-existent parent "${req.parentId}"`,
          });
          continue;
        }

        // 派生の妥当性検証
        if (!this.validateDerivation(parent.type, req.type)) {
          errors.push({
            code: 'INVALID_DERIVATION',
            message: `Invalid derivation: "${parent.type}" → "${req.type}" is not allowed`,
            stageId: req.type,
          });
        }
      } else {
        // 親がない場合、ルート段階である必要がある
        const stage = this.getStageInfo(req.type);
        if (stage && stage.canHaveParent) {
          errors.push({
            code: 'MISSING_PARENT',
            message: `Requirement "${req.id}" of stage "${req.type}" should have a parent`,
            stageId: req.type,
          });
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * スキーマをJSONとしてエクスポート
   */
  exportSchema(): OntologySchema {
    return JSON.parse(JSON.stringify(this.schema));
  }
}
