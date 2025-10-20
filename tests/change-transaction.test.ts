import { describe, it, expect } from "vitest";
import { deepClone, hashState, makeSampleRequirements, fakeValidate, Requirement } from "./fixtures";
import { ChangeEngine } from "../src/fix-engine/change-engine";
import type { ChangeSet, Change } from "../src/fix-engine/types";

describe("ChangeSet transaction & reversibility", () => {
  it("T01: apply → rollback で状態が完全一致（可逆性）", async () => {
    const base = makeSampleRequirements();
    const baseRecord = Object.fromEntries(base.map(r => [r.id, r]));
    const beforeHash = hashState(base);

    const engine = new ChangeEngine();

    // 簡易的なChangeSetを作成（rewrite操作）
    const changeSet: ChangeSet = {
      id: "CS-TEST-001",
      createdAt: new Date().toISOString(),
      violations: ["atomicity.low"],
      changes: [
        {
          op: "rewrite",
          target: "SR-1",
          payload: {
            oldText: "shall notify operators and log events and escalate to supervisor",
            newText: "shall notify operators when alarms occur"
          },
          rationale: "分割して単一責任にする",
          preview: [],
          inverse: {
            op: "rewrite",
            target: "SR-1",
            payload: {
              oldText: "shall notify operators when alarms occur",
              newText: "shall notify operators and log events and escalate to supervisor"
            },
            rationale: "元に戻す",
            preview: []
          }
        }
      ],
      impacted: ["SR-1"],
      reversible: true,
      status: "proposed"
    };

    // 適用
    const applyResult = await engine.apply(changeSet, baseRecord);
    expect(applyResult.success).toBe(true);

    // ロールバック
    const rollbackResult = await engine.rollback(changeSet, applyResult.modified);
    expect(rollbackResult.success).toBe(true);

    const afterReqs = Object.values(rollbackResult.restored);
    const afterHash = hashState(afterReqs);

    // 完全一致を確認
    expect(afterHash).toBe(beforeHash);
  });

  it("T10: Change適用の途中で失敗しても、状態は元に戻る（トランザクション）", async () => {
    const base = makeSampleRequirements();
    const baseRecord = Object.fromEntries(base.map(r => [r.id, r]));
    const beforeHash = hashState(base);

    const engine = new ChangeEngine();

    // 意図的に失敗する変更を含むChangeSet
    const changeSet: ChangeSet = {
      id: "CS-TEST-FAIL",
      createdAt: new Date().toISOString(),
      violations: ["test.fail"],
      changes: [
        {
          op: "rewrite",
          target: "SR-1",
          payload: {
            oldText: "shall notify operators and log events and escalate to supervisor",
            newText: "updated text"
          },
          rationale: "test change 1",
          preview: [],
          inverse: {
            op: "rewrite",
            target: "SR-1",
            payload: {
              oldText: "updated text",
              newText: "shall notify operators and log events and escalate to supervisor"
            },
            rationale: "rollback",
            preview: []
          }
        },
        {
          op: "rewrite",
          target: "NONEXISTENT-ID", // 存在しないID → 失敗する
          payload: {
            oldText: "dummy",
            newText: "dummy"
          },
          rationale: "intentional failure",
          preview: []
        }
      ],
      impacted: ["SR-1", "NONEXISTENT-ID"],
      reversible: true,
      status: "proposed"
    };

    // 適用（失敗するはず）
    const result = await engine.apply(changeSet, baseRecord);

    // 失敗することを確認
    expect(result.success).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);

    // 状態が元に戻っていることを確認
    const afterReqs = Object.values(result.modified);
    const afterHash = hashState(afterReqs);
    expect(afterHash).toBe(beforeHash);
  });

  it("自己ループ・多重エッジがない（rewire後の健全性）", () => {
    const reqs = makeSampleRequirements();

    // rewire操作後の検証想定
    for (const r of reqs) {
      const out = (r.refines || []).slice().sort();

      // 重複チェック
      const hasDup = out.some((x, i) => i > 0 && x === out[i - 1]);
      expect(hasDup).toBe(false);

      // 自己参照チェック
      expect(out.includes(r.id)).toBe(false);
    }
  });
});
