/**
 * テスト用フィクスチャとユーティリティ
 */

export type Level = "stakeholder" | "system" | "system_functional";
export type ReqID = string;

export interface Requirement {
  id: ReqID;
  title: string;
  description: string;
  level: Level;
  refines?: ReqID[];        // 親
  depends_on?: ReqID[];     // 横
  derived_from?: ReqID[];   // 分割元
  supersedes?: ReqID[];     // 統合で置換した旧ID
  canonical_of?: ReqID[];   // 代表する旧ID群
  createdAt?: string;
  updatedAt?: string;
}

export interface Violation {
  code: string;         // 例: "atomicity.low" | "graph.cycle" | "abstraction.gap.invalid"
  target: ReqID;        // 違反対象
  severity: "error" | "warning" | "info";
  details?: Record<string, unknown>;
  ruleId?: string;
  message?: string;
}

/**
 * ディープコピー
 */
export function deepClone<T>(x: T): T {
  return JSON.parse(JSON.stringify(x));
}

/**
 * 状態のハッシュ化（比較用）
 * タイムスタンプフィールドは除外して比較
 */
export function hashState(reqs: Requirement[]): string {
  // 安定化のため id ソート & JSON 文字列化
  const sorted = deepClone(reqs).sort((a, b) => a.id.localeCompare(b.id));
  // updatedAt, createdAt, appliedAt などのタイムスタンプを除外
  const normalized = sorted.map(r => {
    const { updatedAt, createdAt, ...rest } = r;
    return rest;
  });
  return JSON.stringify(normalized);
}

/**
 * 小規模グラフ（わざと問題を含む）
 */
export function makeSampleRequirements(): Requirement[] {
  return [
    {
      id: "SR-1",
      title: "運用者はアラームに対応できること",
      description: "shall notify operators and log events and escalate to supervisor",
      level: "stakeholder"
    },

    {
      id: "SYS-1",
      title: "通知・記録・エスカレーションを提供",
      description: "system shall provide notification, logging, and escalation",
      level: "system",
      refines: ["SR-1"],
      depends_on: ["SYS-X"]  // これで循環: SYS-1 -> SYS-X -> SYS-1B -> SYS-1
    },

    {
      id: "FUNC-1",
      title: "通知機能",
      description: "shall send email and sms in 5 minutes",
      level: "system_functional",
      refines: ["SYS-1"]
    },

    {
      id: "FUNC-2",
      title: "記録機能（重複気味）",
      description: "shall log events and store logs",
      level: "system_functional",
      refines: ["SYS-1"]
    },

    // レベル飛び（意図的に不正）
    {
      id: "FUNC-X",
      title: "監督者エスカレーション",
      description: "shall escalate to supervisor within 2 minutes",
      level: "system_functional",
      refines: ["SR-1"]
    },

    // 循環（意図的）
    {
      id: "SYS-X",
      title: "循環ノードX",
      description: "placeholder",
      level: "system",
      refines: ["SYS-1"]
    },
    {
      id: "SYS-1B",
      title: "循環ノードY",
      description: "placeholder",
      level: "system",
      refines: ["SYS-X"],
      depends_on: ["SYS-1"]  // これで循環: SYS-1 -> SYS-X -> SYS-1B -> SYS-1
    },
  ];
}

/**
 * フェイク検証関数（テスト用）
 */
export async function fakeValidate(reqs: Requirement[]): Promise<Violation[]> {
  const v: Violation[] = [];

  // T01: 長文 → atomicity.low（単純に "and" を2回以上含む）
  for (const r of reqs) {
    const andCount = (r.description.match(/\band\b/gi) || []).length;
    if (andCount >= 2) {
      v.push({
        code: "atomicity.low",
        ruleId: "M3",
        target: r.id,
        severity: "warning",
        message: "単一責任の原則違反: 複数の責任が含まれています"
      });
    }
  }

  // T06: cycle（簡易）: SYS-1 -> SYS-X -> SYS-1B -> SYS-1
  const ids = reqs.map(r => r.id);
  const id = (s: string) => ids.includes(s);
  if (id("SYS-1") && id("SYS-X") && id("SYS-1B")) {
    v.push({
      code: "graph.cycle",
      ruleId: "G1",
      target: "SYS-1",
      severity: "error",
      message: "循環参照が検出されました"
    });
  }

  // T07: level skip: stakeholder → functional 直結
  const funcX = reqs.find(r => r.id === "FUNC-X");
  if (funcX?.refines?.includes("SR-1")) {
    v.push({
      code: "abstraction.gap.invalid",
      ruleId: "A1",
      target: funcX.id,
      severity: "error",
      message: "不正な階層関係: stakeholder → system_functional"
    });
  }

  // T02/T09: 兄弟重複（FUNC-2 の記述が他の子と被り気味）
  const func2 = reqs.find(r => r.id === "FUNC-2");
  if (func2) {
    v.push({
      code: "dup.sibling.high",
      ruleId: "M1",
      target: func2.id,
      severity: "warning",
      message: "兄弟要求間の重複が検出されました"
    });
  }

  return v;
}

/**
 * DAG判定（簡易）
 * refines と depends_on の両方のエッジをチェック
 */
export function isDAG(reqs: Requirement[]): boolean {
  const g = new Map<string, string[]>(); // child -> parents/dependencies
  // refines と depends_on の両方のエッジを追加
  reqs.forEach(r => {
    const edges = [...(r.refines || []), ...(r.depends_on || [])];
    g.set(r.id, edges);
  });
  const ids = new Set(reqs.map(r => r.id));
  const visiting = new Set<string>();
  const visited = new Set<string>();

  function dfs(id: string): boolean {
    if (visiting.has(id)) return false; // 循環検出
    if (visited.has(id)) return true;
    visiting.add(id);
    for (const p of g.get(id) || []) {
      if (!ids.has(p)) continue;
      if (!dfs(p)) return false;
    }
    visiting.delete(id);
    visited.add(id);
    return true;
  }

  return [...ids].every(dfs);
}
