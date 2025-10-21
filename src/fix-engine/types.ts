/**
 * 修正エンジンの型定義
 * 可逆性・局所化→波及・段階的適用を実現する
 */

export type ReqID = string;

/**
 * 個別の変更操作
 */
export interface Change {
  /** 操作タイプ */
  op:
    | "split"              // 要求の分割
    | "merge"              // 要求の統合
    | "rewire"             // リンクの再配線
    | "introduce"          // 中間層の導入
    | "rewrite"            // テキストの書き換え
    | "alias"              // エイリアスの設定
    | "break_cycle";       // 循環の切断

  /** 対象要求ID（複数の場合あり） */
  target: ReqID | ReqID[];

  /** 操作固有のパラメータ */
  payload?: {
    // split用
    splitPoints?: number[];           // テキスト内の分割位置
    splitTexts?: string[];            // 分割後のテキスト

    // merge用
    canonicalId?: ReqID;              // 統合先のカノニカルID
    mergedText?: string;              // 統合後のテキスト
    conflicts?: string[];             // 矛盾箇所

    // rewire用
    oldEdges?: Array<[ReqID, ReqID]>; // 旧リンク
    newEdges?: Array<[ReqID, ReqID]>; // 新リンク
    edgeType?: 'refines' | 'depends_on';

    // introduce用
    newReqDraft?: Partial<Requirement>; // 新要求のドラフト
    position?: 'above' | 'below';      // 挿入位置

    // rewrite用
    oldText?: string;
    newText?: string;
    changes?: Array<{ type: string; old: string; new: string }>;

    // alias用
    aliasFor?: ReqID;                 // エイリアス先

    // break_cycle用
    cycleEdges?: Array<[ReqID, ReqID]>; // 循環を構成する辺
    cutEdge?: [ReqID, ReqID];          // 切断する辺
  };

  /** 修正の理由（どの違反に対応するか） */
  rationale: string;

  /** UI表示用の差分 */
  preview: Diff[];

  /** 逆操作（ロールバック用） */
  inverse?: Change;
}

/**
 * 差分表示用
 */
export interface Diff {
  type: 'add' | 'remove' | 'modify' | 'rewire';
  field?: string;
  oldValue?: any;
  newValue?: any;
  reqId?: ReqID;
  description: string;
}

/**
 * 変更集合（可逆性の単位）
 */
export interface ChangeSet {
  /** 変更集合ID */
  id: string;

  /** 作成日時 */
  createdAt: string;

  /** 対応する違反コード */
  violations: string[];

  /** 個別変更のリスト */
  changes: Change[];

  /** 影響を受けるノード */
  impacted: ReqID[];

  /** 逆操作が全て定義されているか */
  reversible: boolean;

  /** 状態 */
  status: 'proposed' | 'approved' | 'applied' | 'rolled_back';

  /** 承認者・適用者 */
  approvedBy?: string;
  appliedBy?: string;
  appliedAt?: string;

  /** ロールバック時刻 */
  rolledBackAt?: string;
  rolledBackBy?: string;

  /** メタデータ */
  metadata?: {
    policyId?: string;
    ruleId?: string;
    iteration?: number;
  };
}

/**
 * 要求の拡張（来歴フィールド追加）
 */
export interface Requirement {
  id: ReqID;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  type?: string;

  // 階層・依存関係
  refines?: ReqID[];
  depends_on?: ReqID[];

  // 来歴フィールド（追跡性）
  derived_from?: ReqID[];      // 分割元
  supersedes?: ReqID[];        // 統合で置き換えた旧ID
  canonical_of?: ReqID[];      // 自分が代表する旧ID群

  // 解析メタデータ
  analysis?: {
    atomicity?: number;
    abstraction_level?: number;
    token_count?: number;
    has_subject?: boolean;
    ambiguous_terms?: string[];
  };

  // 標準フィールド
  tags?: string[];
  author?: string;
  assignee?: string;
  rationale?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * 修正ルール定義
 */
export interface FixRule {
  id: string;
  whenViolation: string;
  priority: number;
  severity: 'strict' | 'suggest';
  description: string;

  guard?: {
    level?: string[];
    min_confidence?: number;
    min_similarity?: number;
    same_parent?: boolean;
    min_coverage?: number;
  };

  actions: FixAction[];
}

export interface FixAction {
  use: string;
  mode: 'auto' | 'assist';
  params?: Record<string, any>;
  condition?: string;
  onSuccess?: string[];
}

/**
 * 修正ポリシー
 */
export interface FixPolicy {
  policy: string;
  version: string;
  description: string;
  mode?: 'strict' | 'suggest' | 'assist'; // グローバル実行モード（オプション）
  principles: Record<string, string>;
  stopping: {
    max_iterations: number;
    fixed_point: string;
    description: string;
  };
  rules: FixRule[];
  propagation: {
    order: string[];
    description: string;
    revalidate_after_each: boolean;
  };
  governance: {
    approval_required: {
      operations: string[];
      roles: string[];
    };
    audit: {
      log_all_changes: boolean;
      record_rationale: boolean;
      track_who_when: boolean;
    };
    state_transition: {
      after_fix: string;
      allowed_states: string[];
    };
  };
}

/**
 * 修正プラン
 */
export interface FixPlan {
  changeSets: ChangeSet[];
  totalChanges: number;
  estimatedImpact: {
    requirementsAffected: number;
    newRequirements: number;
    removedRequirements: number;
    modifiedRequirements: number;
  };
  preview: string; // Markdown形式のプレビュー
}

/**
 * 修正結果
 */
export interface FixResult {
  success: boolean;
  appliedChangeSets: ChangeSet[];
  newViolations: any[];
  fixedViolations: string[];
  iterations: number;
  stoppedReason: 'fixed_point' | 'max_iterations' | 'error';
  error?: string;
  requirements?: Record<ReqID, Requirement>;
}

/**
 * 要求のレコード型（ID → Requirement のマッピング）
 */
export type RequirementRecord = Record<ReqID, Requirement>;

/**
 * 要求の配列をレコードに変換
 *
 * @param requirements - 要求の配列
 * @returns 要求のレコード
 */
export function toRequirementRecord(requirements: Requirement[]): RequirementRecord {
  return Object.fromEntries(
    requirements.map(r => [r.id, r])
  ) as RequirementRecord;
}

/**
 * 要求のレコードを配列に変換
 *
 * @param record - 要求のレコード
 * @returns 要求の配列
 */
export function fromRequirementRecord(record: RequirementRecord): Requirement[] {
  return Object.values(record);
}

/**
 * Storage Requirement を Fix Engine Requirement に変換
 */
export function toFixEngineRequirement(req: any): Requirement {
  const fixEngineReq: Requirement = {
    id: req.id,
    title: req.title,
    description: req.description,
    status: req.status,
    priority: req.priority,
    category: req.category,
  };

  // オプショナルフィールド
  if (req.type) fixEngineReq.type = req.type;
  if (req.refines) fixEngineReq.refines = req.refines;
  if (req.depends_on) fixEngineReq.depends_on = req.depends_on;
  if (req.derived_from) fixEngineReq.derived_from = req.derived_from;
  if (req.supersedes) fixEngineReq.supersedes = req.supersedes;
  if (req.canonical_of) fixEngineReq.canonical_of = req.canonical_of;
  if (req.analysis) fixEngineReq.analysis = req.analysis;
  if (req.tags) fixEngineReq.tags = req.tags;
  if (req.author) fixEngineReq.author = req.author;
  if (req.assignee) fixEngineReq.assignee = req.assignee;
  if (req.rationale) fixEngineReq.rationale = req.rationale;
  if (req.createdAt) fixEngineReq.createdAt = typeof req.createdAt === 'string' ? req.createdAt : req.createdAt.toISOString();
  if (req.updatedAt) fixEngineReq.updatedAt = typeof req.updatedAt === 'string' ? req.updatedAt : req.updatedAt.toISOString();

  return fixEngineReq;
}

/**
 * Storage Requirements を Fix Engine Requirements に変換
 */
export function toFixEngineRequirements(reqs: any[]): Requirement[] {
  return reqs.map(toFixEngineRequirement);
}

/**
 * Fix Engine Requirement を Storage Requirement に変換
 * （Partial<Requirement>として返す）
 */
export function toStorageRequirement(req: Requirement): Record<string, any> {
  return {
    id: req.id,
    title: req.title,
    description: req.description,
    status: req.status,
    priority: req.priority,
    category: req.category,
    type: req.type,
    refines: req.refines,
    depends_on: req.depends_on,
    derived_from: req.derived_from,
    supersedes: req.supersedes,
    canonical_of: req.canonical_of,
    tags: req.tags || [],
    dependencies: req.depends_on || [],
    author: req.author,
    assignee: req.assignee,
    rationale: req.rationale,
  };
}
