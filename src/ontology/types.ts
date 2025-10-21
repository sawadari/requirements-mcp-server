/**
 * オントロジー関連の型定義
 */

/**
 * 要求の段階定義
 */
export interface StageDefinition {
  /** 段階の一意識別子 */
  id: string;

  /** 段階の表示名 */
  name: string;

  /** 段階の説明 */
  description: string;

  /** 階層レベル（1が最上位） */
  level: number;

  /** 抽象度レベル（high/medium/low） */
  abstractionLevel: 'high' | 'medium' | 'low';

  /** 子要求を持てるか */
  canHaveChildren: boolean;

  /** 親要求を持てるか */
  canHaveParent: boolean;

  /** 許可される親段階のID */
  parentStages: string[];

  /** 許可される子段階のID */
  childStages: string[];

  /** UIでの表示色 */
  color?: string;

  /** UIでのアイコン */
  icon?: string;
}

/**
 * 派生ルール
 */
export interface DerivationRule {
  /** 許可される子段階 */
  allowedChildren: string[];

  /** MECE原則が必須か */
  meceRequired: boolean;

  /** ルールの説明 */
  description: string;
}

/**
 * 粒度ルール
 */
export interface GranularityRule {
  /** 説明文の長さ制約 */
  descriptionLength: {
    min: number;
    max: number;
    recommended: number;
  };

  /** タイトルの長さ制約 */
  titleLength: {
    min: number;
    max: number;
    recommended: number;
  };

  /** 抽象度スコア制約 */
  abstractionScore: {
    min: number;
    max: number;
    recommended: number;
  };
}

/**
 * バリデーションルール（段階別）
 */
export interface StageValidationRule {
  /** 必須フィールド */
  requiredFields: string[];

  /** オプショナルフィールド */
  optionalFields: string[];

  /** 禁止フィールド */
  forbiddenFields: string[];
}

/**
 * グローバルバリデーションルール
 */
export interface GlobalValidationRule {
  /** 最大階層深度 */
  maxDepth: number;

  /** 循環参照を許可するか */
  allowCycles: boolean;

  /** 一意なIDが必要か */
  requireUniqueIds: boolean;
}

/**
 * オントロジースキーマ
 */
export interface OntologySchema {
  /** スキーマバージョン */
  $schema?: string;

  /** タイトル */
  title?: string;

  /** 説明 */
  description?: string;

  /** バージョン */
  version: string;

  /** 段階定義 */
  stages: StageDefinition[];

  /** 派生ルール */
  derivationRules: Record<string, DerivationRule>;

  /** 粒度ルール */
  granularityRules: Record<string, GranularityRule>;

  /** バリデーションルール */
  validationRules: {
    global: GlobalValidationRule;
    byStage: Record<string, StageValidationRule>;
  };

  /** メタデータ */
  metadata?: {
    author?: string;
    createdAt?: string;
    description?: string;
  };
}

/**
 * オントロジー検証エラー
 */
export interface OntologyValidationError {
  code: string;
  message: string;
  stageId?: string;
  field?: string;
}

/**
 * オントロジー検証結果
 */
export interface OntologyValidationResult {
  valid: boolean;
  errors: OntologyValidationError[];
}
