/**
 * 要求管理システムの型定義
 */

export interface Requirement {
  id: string;
  title: string;
  description: string;
  rationale?: string; // 要求の理由・根拠
  status: RequirementStatus;
  priority: RequirementPriority;
  category: string;
  type?: RequirementType; // 要求の種類（階層構造用）
  parentId?: string; // 親要求のID（階層構造用）
  tags: string[];
  dependencies: string[]; // 依存する要求のID（レガシー、横方向依存として扱う）
  createdAt: Date;
  updatedAt: Date;
  author?: string;
  assignee?: string;

  // ========== 新しいエッジ種別（検証システム用） ==========
  refines?: string[]; // 階層エッジ: この要求が具体化する親要求のID群
  depends_on?: string[]; // 横方向依存: 実装順序や論理的依存関係
  conflicts_with?: string[]; // 競合: 同時に満たせない要求
  duplicates?: string[]; // 重複候補: 内容が類似している要求

  // ========== 解析メタデータ ==========
  abstraction_score?: number; // 抽象度スコア (0.0=具体的 〜 1.0=抽象的)
  atomicity_score?: number; // 単一性スコア (0.0=複数関心事 〜 1.0=単一関心事)
  length_tokens?: number; // トークン数（説明文の長さ）
  last_validated_at?: string; // 最終検証日時（ISO 8601形式）
}

export type RequirementStatus =
  | 'draft'       // 下書き
  | 'proposed'    // 提案済み
  | 'approved'    // 承認済み
  | 'in_progress' // 実装中
  | 'completed'   // 完了
  | 'rejected'    // 却下
  | 'on_hold';    // 保留

export type RequirementPriority =
  | 'critical'  // P0: 致命的
  | 'high'      // P1: 高
  | 'medium'    // P2: 中
  | 'low';      // P3: 低

export type RequirementType =
  | 'stakeholder'  // ステークホルダ要求
  | 'system'       // システム要求
  | 'functional';  // システム機能要求

export interface ImpactAnalysis {
  requirementId: string;
  affectedRequirements: {
    id: string;
    title: string;
    impactType: 'direct' | 'indirect';
    description: string;
  }[];
  estimatedEffort: string;
  risks: string[];
  recommendations: string[];
}

export interface ChangeProposal {
  id: string;
  targetRequirementId: string;
  proposedChanges: {
    field: string;
    currentValue?: any;
    proposedValue?: any;
    reason: string;
  }[];
  impactAnalysis: ImpactAnalysis;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
}

/**
 * ========== 検証システムの型定義 ==========
 */

/**
 * 検証違反の重要度
 */
export type ViolationSeverity = 'error' | 'warning' | 'info';

/**
 * 検証ルールのドメイン
 */
export type RuleDomain = 'hierarchy' | 'graph_health' | 'abstraction' | 'mece' | 'quality_style';

/**
 * 検証違反
 */
export interface ValidationViolation {
  id: string; // 違反ID
  requirementId: string; // 違反している要求のID
  ruleDomain: RuleDomain; // ルールドメイン (A-E)
  ruleId: string; // ルールID (例: "A1", "B2")
  severity: ViolationSeverity; // 重要度
  message: string; // 違反メッセージ
  details?: string; // 詳細説明
  comparisonTargets?: string[]; // 比較対象の要求ID（MECE、抽象度チェック用）
  suggestedFix?: string; // 修正提案（LLM生成）
  detectedAt: string; // 検出日時（ISO 8601）
}

/**
 * 検証結果
 */
export interface ValidationResult {
  requirementId: string;
  validatedAt: string; // ISO 8601
  violations: ValidationViolation[];
  passed: boolean; // 全てのルールに適合しているか
  score?: number; // 品質スコア (0-100)
}

/**
 * 検証ルール定義（JSON/JSONCベースDSL）
 */
export interface ValidationRule {
  id: string; // ルールID (例: "A1", "B2")
  domain: RuleDomain; // ルールドメイン
  name: string; // ルール名
  description: string; // ルール説明
  severity: ViolationSeverity; // 違反時の重要度
  enabled: boolean; // ルールが有効かどうか
  parameters?: Record<string, any>; // ルール固有のパラメータ
}

/**
 * 検証ルール設定（DSL全体）
 */
export interface ValidationRuleConfig {
  version: string; // スキーマバージョン
  rules: {
    hierarchy: ValidationRule[]; // A: 階層ルール
    graph_health: ValidationRule[]; // B: グラフヘルス
    abstraction: ValidationRule[]; // C: 抽象度
    mece: ValidationRule[]; // D: MECE
    quality_style: ValidationRule[]; // E: 品質スタイル
  };
}
