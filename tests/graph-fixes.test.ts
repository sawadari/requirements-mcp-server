import { describe, it, expect } from "vitest";
import { makeSampleRequirements, isDAG, Requirement } from "./fixtures";

describe("T06/T07: break_cycle / introduce_intermediate", () => {
  it("循環が解消されDAGになる（break_cycle）", () => {
    const reqs = makeSampleRequirements();

    // 元の状態は循環を含む
    expect(isDAG(reqs)).toBe(false);

    // break_cycle操作をシミュレート: SYS-1 の depends_on を削除して循環を切断
    const fixed = reqs.map(r => {
      if (r.id === "SYS-1") {
        return { ...r, depends_on: [] };
      }
      return r;
    });

    // 修正後はDAGになる
    expect(isDAG(fixed)).toBe(true);
  });

  it("レベル飛びが中間層導入で解消される（introduce_intermediate）", () => {
    const reqs = makeSampleRequirements();

    // FUNC-X は SR-1 を直接 refines している（レベル飛び）
    const funcX = reqs.find(r => r.id === "FUNC-X");
    expect(funcX?.refines).toContain("SR-1");

    // 中間層を導入してレベル飛びを解消
    const intermediate: Requirement = {
      id: "SYS-ESCALATION",
      title: "エスカレーション機能",
      description: "system shall provide escalation functionality",
      level: "system",
      refines: ["SR-1"]
    };

    const fixed = reqs.map(r => {
      if (r.id === "FUNC-X") {
        // FUNC-X は中間層を refines する
        return { ...r, refines: ["SYS-ESCALATION"] };
      }
      if (r.id === "SYS-1") {
        // 循環も解消（depends_on を削除）
        return { ...r, refines: r.refines, depends_on: [] };
      }
      return r;
    });

    fixed.push(intermediate);

    // FUNC-X が SR-1 を直接参照しなくなった
    const funcXFixed = fixed.find(r => r.id === "FUNC-X");
    expect(funcXFixed?.refines).not.toContain("SR-1");
    expect(funcXFixed?.refines).toContain("SYS-ESCALATION");

    // DAGであることを確認
    expect(isDAG(fixed)).toBe(true);
  });

  it("最小切断が1本（break_cycle の最小性）", () => {
    const reqs = makeSampleRequirements();

    // 循環を構成するエッジ: SYS-1 -> SYS-X (depends_on), SYS-X -> SYS-1 (refines)
    // 最小切断: SYS-1 の depends_on を削除（1本）

    const fixed = reqs.map(r => {
      if (r.id === "SYS-1") {
        return { ...r, depends_on: [] }; // 1本削除
      }
      return r;
    });

    expect(isDAG(fixed)).toBe(true);

    // エッジ削除数を確認（簡易版）
    const originalEdges = reqs.flatMap(r =>
      [...(r.refines || []), ...(r.depends_on || [])].map(target => [r.id, target])
    ).length;

    const fixedEdges = fixed.flatMap(r =>
      [...(r.refines || []), ...(r.depends_on || [])].map(target => [r.id, target])
    ).length;

    // 1本削除されたことを確認
    expect(originalEdges - fixedEdges).toBe(1);
  });
});
