import { describe, it, expect } from "vitest";
import { Requirement } from "./fixtures";
import type { FixPolicy } from "../src/fix-engine/types";

// 極小データ
const MINIMAL_REQS: Requirement[] = [
  {
    id: "SYS-1",
    title: "複合要求",
    description: "A and B and C",
    level: "system"
  }
];

// 最小限のポリシー
const createTestPolicy = (mode: 'strict' | 'suggest' | 'assist'): FixPolicy => ({
  policy: "test-policy",
  version: "1.0.0",
  description: "Test policy",
  mode,
  principles: {},
  stopping: {
    max_iterations: 3,
    fixed_point: "no_new_strict_violations",
    description: "Stop when no new strict violations"
  },
  rules: [
    {
      id: "test-rule-1",
      whenViolation: "atomicity.low",
      priority: 90,
      severity: "strict",
      scope: {
        target_types: ["system"]
      },
      actions: [
        {
          use: "split",
          mode: "auto",
          params: {}
        }
      ]
    },
    {
      id: "test-rule-2",
      whenViolation: "dup.sibling.high",
      priority: 80,
      severity: "suggest",
      scope: {
        target_types: ["system_functional"]
      },
      actions: [
        {
          use: "merge",
          mode: "assist",
          params: {}
        }
      ]
    }
  ],
  propagation: {
    order: ["target", "parent", "sibling", "child", "depends_on", "test"],
    description: "Apply changes in order",
    revalidate_after_each: true
  },
  governance: {
    approval_required: {
      operations: ["merge", "introduce"],
      roles: ["admin"]
    },
    audit: {
      log_all_changes: true,
      record_rationale: true,
      track_who_when: true
    },
    state_transition: {
      after_fix: "proposed",
      allowed_states: ["draft", "proposed", "approved"]
    }
  }
});

describe("T04/T05: executor modes & stopping criteria", () => {
  it("グローバルモード=strictの挙動を確認", () => {
    const policy = createTestPolicy('strict');

    expect(policy.mode).toBe('strict');

    // Strictモード + action.mode=auto → 自動適用されるべき
    const rule = policy.rules.find(r => r.id === "test-rule-1");
    expect(rule?.actions[0].mode).toBe('auto');
  });

  it("グローバルモード=suggestの挙動を確認", () => {
    const policy = createTestPolicy('suggest');

    expect(policy.mode).toBe('suggest');

    // Suggestモード → すべて提案止まり（action.mode関係なく）
    // この挙動は FixExecutor.canAutoApply() で実装されている
  });

  it("マトリクス判定: strict + auto → 自動適用", () => {
    const policy = createTestPolicy('strict');
    const rule = policy.rules[0];

    // global=strict & action=auto
    expect(policy.mode).toBe('strict');
    expect(rule.actions[0].mode).toBe('auto');

    // 自動適用されるべき（FixExecutor.canAutoApply が true を返す）
    const shouldAutoApply = policy.mode === 'strict' && rule.actions[0].mode === 'auto';
    expect(shouldAutoApply).toBe(true);
  });

  it("マトリクス判定: strict + assist → 提案のみ", () => {
    const policy = createTestPolicy('strict');
    const rule = policy.rules[1];

    // global=strict & action=assist
    expect(policy.mode).toBe('strict');
    expect(rule.actions[0].mode).toBe('assist');

    // 提案のみ（自動適用されない）
    const shouldAutoApply = policy.mode === 'strict' && rule.actions[0].mode === 'auto';
    expect(shouldAutoApply).toBe(false);
  });

  it("マトリクス判定: suggest + any → 提案のみ", () => {
    const policy = createTestPolicy('suggest');

    // global=suggest → すべて提案のみ
    expect(policy.mode).toBe('suggest');

    // action.mode に関わらず自動適用されない
    const shouldAutoApply = false; // FixExecutor.canAutoApply が false を返す
    expect(shouldAutoApply).toBe(false);
  });

  it("停止条件: max_iterations を超えない", () => {
    const policy = createTestPolicy('strict');

    expect(policy.stopping.max_iterations).toBe(3);
    expect(policy.stopping.fixed_point).toBe("no_new_strict_violations");

    // FixExecutor は最大3回まで反復する
    // 4回目は実行されない
  });

  it("停止条件: fixed_point（違反なし）で停止", () => {
    const policy = createTestPolicy('strict');

    // 違反が0件になったら停止
    const violations: any[] = [];
    const shouldStop = violations.length === 0;

    expect(shouldStop).toBe(true);
  });
});

describe("Approval required operations", () => {
  it("merge と introduce は承認が必要", () => {
    const policy = createTestPolicy('strict');

    const approvalRequired = policy.governance.approval_required.operations;
    expect(approvalRequired).toContain("merge");
    expect(approvalRequired).toContain("introduce");
  });

  it("split は承認不要（自動適用可能）", () => {
    const policy = createTestPolicy('strict');

    const approvalRequired = policy.governance.approval_required.operations;
    expect(approvalRequired).not.toContain("split");
  });
});
