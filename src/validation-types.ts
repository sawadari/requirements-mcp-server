/**
 * 要求妥当性チェックの型定義
 */

import { Requirement } from './types.js';

export interface ValidationRule {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  severity: 'error' | 'warning' | 'info';
  check: (requirement: Requirement, context: ValidationContext) => ValidationResult[];
}

export interface ValidationContext {
  requirement: Requirement;
  allRequirements: Requirement[];
  parentRequirements: Requirement[];
  childRequirements: Requirement[];
  siblingRequirements: Requirement[];
}

export interface ValidationResult {
  ruleId: string;
  ruleName: string;
  severity: 'error' | 'warning' | 'info';
  message: string;
  suggestion?: string;
}

export interface ValidationReport {
  requirementId: string;
  requirementTitle: string;
  timestamp: Date;
  results: ValidationResult[];
  isValid: boolean;
  errorCount: number;
  warningCount: number;
  infoCount: number;
}

export interface ValidationRuleConfig {
  // 上位要求との整合性チェック
  parentConsistency: {
    enabled: boolean;
    severity: 'error' | 'warning' | 'info';
    keywords: {
      stakeholder: string[]; // ステークホルダ要求のキーワード（～を、～が）
      system: string[]; // システム要求のキーワード（システムは、～すること）
      functional: string[]; // システム機能要求のキーワード
    };
  };

  // 詳細化チェック
  refinement: {
    enabled: boolean;
    severity: 'error' | 'warning' | 'info';
    hierarchy: {
      stakeholder: {
        subjectPattern: string; // 主語パターン（正規表現）
        requiredPhrases: string[]; // 必須フレーズ
        forbiddenPhrases: string[]; // 禁止フレーズ
      };
      system: {
        subjectPattern: string;
        requiredPhrases: string[];
        verbPattern: string; // 動詞パターン（～すること）
      };
      functional: {
        requiredPhrases: string[];
        maxComplexity: number; // 最大複雑度（単一機能かどうか）
      };
    };
  };

  // 下位要求との整合性チェック
  childConsistency: {
    enabled: boolean;
    severity: 'error' | 'warning' | 'info';
    minChildren: number; // 最小下位要求数
    maxChildren: number; // 最大下位要求数
  };

  // 分解チェック（同じ親を持つ兄弟要求との関係）
  decomposition: {
    enabled: boolean;
    severity: 'error' | 'warning' | 'info';
    checkOverlap: boolean; // 重複チェック
    checkCoverage: boolean; // 網羅性チェック
    similarityThreshold: number; // 類似度閾値（0-1）
  };

  // 粒度・抽象度チェック
  granularity: {
    enabled: boolean;
    severity: 'error' | 'warning' | 'info';
    descriptionLength: {
      stakeholder: { min: number; max: number };
      system: { min: number; max: number };
      functional: { min: number; max: number };
    };
    complexityScore: {
      // 複雑度スコア（文の数、句読点の数など）
      maxSentences: number;
      maxClauses: number;
    };
  };

  // 理由の整合性チェック
  rationaleConsistency?: {
    enabled: boolean;
    severity: 'error' | 'warning' | 'info';
    checkDescriptionAlignment: boolean; // 説明との整合性チェック
    checkParentAlignment: boolean; // 上位要求への言及チェック
    checkKeywordPresence: boolean; // キーワード存在チェック
    minLength: number; // 最小文字数
    requiredElements: {
      stakeholder: string[]; // ステークホルダ要求の理由に必要な要素
      system: string[]; // システム要求の理由に必要な要素
      functional: string[]; // 機能要求の理由に必要な要素
    };
  };
}
