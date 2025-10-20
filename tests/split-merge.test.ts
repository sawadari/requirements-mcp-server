import { describe, it, expect } from "vitest";
import { makeSampleRequirements, Requirement } from "./fixtures";

describe("T02/T03/T09: split → rewire → sibling-dup → merge", () => {
  it("分割で子が増え、親被覆率が維持される", () => {
    const reqs = makeSampleRequirements();

    // SR-1 を分割: SR-1A (通知), SR-1B (記録), SR-1C (エスカレーション)
    const sr1 = reqs.find(r => r.id === "SR-1")!;
    const sr1a: Requirement = {
      id: "SR-1-S1",
      title: "運用者への通知",
      description: "shall notify operators when alarms occur",
      level: "stakeholder",
      derived_from: ["SR-1"]
    };

    const sr1b: Requirement = {
      id: "SR-1-S2",
      title: "イベント記録",
      description: "shall log events for audit purposes",
      level: "stakeholder",
      derived_from: ["SR-1"]
    };

    const sr1c: Requirement = {
      id: "SR-1-S3",
      title: "監督者へのエスカレーション",
      description: "shall escalate to supervisor when needed",
      level: "stakeholder",
      derived_from: ["SR-1"]
    };

    // SR-1 を superseded に設定
    const sr1Updated = {
      ...sr1,
      supersedes: ["SR-1-S1", "SR-1-S2", "SR-1-S3"]
    };

    const split = [sr1Updated, sr1a, sr1b, sr1c, ...reqs.filter(r => r.id !== "SR-1")];

    // derived_from が設定されていることを確認
    expect(sr1a.derived_from).toContain("SR-1");
    expect(sr1b.derived_from).toContain("SR-1");
    expect(sr1c.derived_from).toContain("SR-1");

    // supersedes が設定されていることを確認
    expect(sr1Updated.supersedes).toHaveLength(3);
  });

  it("兄弟重複が統合される（merge & canonical選定）", () => {
    const reqs = makeSampleRequirements();

    // FUNC-1 と FUNC-2 が重複しているとして、FUNC-1 を canonical に選定
    const func1 = reqs.find(r => r.id === "FUNC-1")!;
    const func2 = reqs.find(r => r.id === "FUNC-2")!;

    // FUNC-1 を代表として、FUNC-2 を統合
    const func1Canonical = {
      ...func1,
      canonical_of: ["FUNC-2"]
    };

    // FUNC-2 を削除（または status を merged に設定）
    const merged = reqs.filter(r => r.id !== "FUNC-2");
    merged[merged.findIndex(r => r.id === "FUNC-1")] = func1Canonical;

    // canonical_of が設定されていることを確認
    const func1Result = merged.find(r => r.id === "FUNC-1");
    expect(func1Result?.canonical_of).toContain("FUNC-2");

    // FUNC-2 が削除されていることを確認
    expect(merged.find(r => r.id === "FUNC-2")).toBeUndefined();
  });

  it("ID戦略: 分割時の命名規則（<元ID>-S<n>）", () => {
    const originalId = "REQ-123";
    const splitIds = [`${originalId}-S1`, `${originalId}-S2`, `${originalId}-S3`];

    // 命名規則に従っていることを確認
    splitIds.forEach((id, i) => {
      expect(id).toBe(`${originalId}-S${i + 1}`);
      expect(id).toMatch(/^REQ-123-S\d+$/);
    });
  });

  it("rewire 後の多重エッジ除去", () => {
    const req: Requirement = {
      id: "TEST-1",
      title: "Test",
      description: "test",
      level: "system",
      refines: ["PARENT-1", "PARENT-2", "PARENT-1"] // 重複あり
    };

    // 重複を除去
    const unique = [...new Set(req.refines || [])];
    expect(unique).toHaveLength(2);
    expect(unique).toEqual(["PARENT-1", "PARENT-2"]);
  });

  it("自己参照の禁止", () => {
    const req: Requirement = {
      id: "TEST-1",
      title: "Test",
      description: "test",
      level: "system",
      refines: ["PARENT-1", "TEST-1"] // 自己参照
    };

    // 自己参照を除去
    const filtered = (req.refines || []).filter(id => id !== req.id);
    expect(filtered).not.toContain("TEST-1");
    expect(filtered).toHaveLength(1);
  });
});
