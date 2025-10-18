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
  dependencies: string[]; // 依存する要求のID
  createdAt: Date;
  updatedAt: Date;
  author?: string;
  assignee?: string;
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
