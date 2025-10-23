# Phase 3: 自動化ワークフロー設計

requirements-mcp-serverとMiyabiの完全統合による自動化ワークフロー

## 概要

Phase 3では、要求管理とGitHubのIssue/PR管理を完全に統合し、以下の自動化を実現します：

1. **要求変更 → Issue自動作成**
2. **影響範囲分析 → Agent自動実行**
3. **Fix Engine → PR自動作成**

---

## 1. 要求変更 → Issue自動作成

### 目的

新しい要求が追加されたとき、または既存要求が大きく変更されたとき、関連する実装タスクを自動的にGitHub Issueとして作成します。

### アーキテクチャ

```
add_requirement() / update_requirement()
  ↓
RequirementsStorage.save()
  ↓
ValidationService.validate()
  ↓
[Hook] IssueAutoCreator.onCreate()
  ↓
GitHub API: issues.create()
  ↓
Issue作成完了
  ↓
[オプション] MiyabiAgent.run(issueNumber)
```

### 実装設計

#### ファイル: `src/integrations/issue-auto-creator.ts`

```typescript
export interface IssueCreationOptions {
  createForNew: boolean;           // 新規要求でIssue作成
  createForUpdates: boolean;       // 更新時にIssue作成
  createForDependencies: boolean;  // 依存関係変更でIssue作成
  autoAssign: boolean;             // 自動アサイン
  useLabels: boolean;              // ラベル自動付与
  createSubtasks: boolean;         // サブタスクIssue作成
}

export class IssueAutoCreator {
  async createIssueForRequirement(req: Requirement): Promise<string>;
  async createSubtaskIssues(req: Requirement): Promise<string[]>;
  async updateIssueFromRequirement(req: Requirement, issueNumber: number): Promise<void>;
}
```

#### Issue テンプレート

```markdown
---
title: "[REQ-{{id}}] {{title}}"
labels:
  - "type:feature"
  - "priority:{{priority}}"
  - "category:{{category}}"
  - "from:requirements-mcp"
assignees: {{assignee}}
---

# 要求: {{title}}

## 概要
{{description}}

## 詳細情報
- **ID**: {{id}}
- **優先度**: {{priority}}
- **カテゴリ**: {{category}}
- **ステータス**: {{status}}
- **作成日**: {{createdAt}}
- **更新日**: {{updatedAt}}

## 依存関係
{{#dependencies}}
- [ ] {{id}}: {{title}} (#{{issueNumber}})
{{/dependencies}}

## 実装タスク
- [ ] 要件定義レビュー
- [ ] 設計ドキュメント作成
- [ ] 実装
- [ ] ユニットテスト作成
- [ ] 統合テスト実行
- [ ] コードレビュー
- [ ] デプロイ準備

## 受入条件
{{#acceptanceCriteria}}
- [ ] {{.}}
{{/acceptanceCriteria}}

---
🤖 自動生成 by requirements-mcp-server
📊 要求データと同期: [View in Web UI](http://localhost:5002?id={{id}})
```

### 設定

```typescript
// src/integrations/issue-auto-creator-config.ts
export const issueAutoCreatorConfig = {
  enabled: process.env.MIYABI_AUTO_ISSUE_CREATE === 'true',
  options: {
    createForNew: true,
    createForUpdates: false, // 大きな変更のみ
    createForDependencies: true,
    autoAssign: true,
    useLabels: true,
    createSubtasks: true,
  },
  repository: process.env.GITHUB_REPOSITORY || 'sawadari/requirements-mcp-server',
  labelPrefix: 'req:',
};
```

### フック統合

```typescript
// src/storage.ts に追加
import { IssueAutoCreator } from './integrations/issue-auto-creator.js';

export class RequirementsStorage {
  private issueCreator?: IssueAutoCreator;

  async addRequirement(requirement: Requirement): Promise<Requirement> {
    // ... 既存の処理 ...

    // Issue自動作成フック
    if (this.issueCreator && process.env.MIYABI_AUTO_ISSUE_CREATE === 'true') {
      try {
        const issueNumber = await this.issueCreator.createIssueForRequirement(requirement);
        console.log(`✅ Issue #${issueNumber} created for ${requirement.id}`);

        // オプション: Agent自動実行
        if (process.env.MIYABI_AUTO_AGENT_RUN === 'true') {
          await this.runMiyabiAgent(issueNumber);
        }
      } catch (error) {
        console.error('Failed to create issue:', error);
        // エラーは記録するが、要求作成自体は成功扱い
      }
    }

    return requirement;
  }
}
```

---

## 2. 影響範囲分析 → Agent自動実行

### 目的

要求の影響範囲分析を行った際、影響が大きい場合は自動的にMiyabi AgentのDAG分解 → 並列実行パイプラインを起動します。

### アーキテクチャ

```
analyze_impact(requirementId)
  ↓
ImpactAnalyzer.analyze()
  ↓
impactScore > threshold?
  ↓ Yes
AgentOrchestrator.orchestrate()
  ↓
CoordinatorAgent.createDAG()
  ↓
Parallel Execution:
  - CodeGenAgent
  - ReviewAgent
  - TestAgent
  ↓
PRAgent.createPullRequest()
```

### 実装設計

#### ファイル: `src/integrations/agent-orchestrator.ts`

```typescript
export interface AgentOrchestrationOptions {
  impactThreshold: number;         // 影響スコア閾値
  maxConcurrency: number;          // 最大並列実行数
  autoCreatePR: boolean;           // PR自動作成
  requireApproval: boolean;        // 承認が必要か
  dryRun: boolean;                 // ドライラン
}

export class AgentOrchestrator {
  /**
   * 影響範囲に基づいてAgent実行を調整
   */
  async orchestrateFromImpact(
    impactAnalysis: ImpactAnalysis,
    options?: Partial<AgentOrchestrationOptions>
  ): Promise<AgentExecutionResult>;

  /**
   * 要求グループをDAGに変換
   */
  async createExecutionDAG(
    requirements: Requirement[]
  ): Promise<ExecutionDAG>;

  /**
   * Agent並列実行
   */
  async executeAgentPipeline(
    dag: ExecutionDAG,
    concurrency: number
  ): Promise<AgentExecutionResult[]>;
}
```

#### Impact Score 計算

```typescript
export function calculateImpactScore(impact: ImpactAnalysis): number {
  let score = 0;

  // 直接影響
  score += impact.directlyAffected.length * 10;

  // 間接影響
  score += impact.indirectlyAffected.length * 5;

  // 優先度補正
  if (impact.targetRequirement.priority === 'critical') score *= 2;
  if (impact.targetRequirement.priority === 'high') score *= 1.5;

  // 推定工数
  score += impact.estimatedEffort * 2;

  // リスク補正
  score += impact.risks.length * 3;

  return score;
}

// 閾値: 50以上で自動Agent実行
const IMPACT_THRESHOLD = 50;
```

### 統合

```typescript
// src/analyzer.ts に追加

export class ImpactAnalyzer {
  private orchestrator?: AgentOrchestrator;

  async analyzeImpact(
    requirementId: string,
    proposedChanges?: string
  ): Promise<ImpactAnalysis> {
    const impact = await this.performAnalysis(requirementId, proposedChanges);

    // 影響スコア計算
    const score = calculateImpactScore(impact);
    impact.impactScore = score;

    console.log(`📊 Impact Score: ${score}`);

    // 閾値を超えた場合、Agent自動実行
    if (score >= IMPACT_THRESHOLD && this.orchestrator) {
      console.log('🚀 High impact detected, triggering Agent orchestration...');

      try {
        const result = await this.orchestrator.orchestrateFromImpact(impact, {
          maxConcurrency: 2,
          autoCreatePR: true,
          requireApproval: false,
        });

        impact.agentExecutionResult = result;
      } catch (error) {
        console.error('Agent orchestration failed:', error);
      }
    }

    return impact;
  }
}
```

### 設定

```env
# .env
MIYABI_AUTO_AGENT_RUN=true
MIYABI_IMPACT_THRESHOLD=50
MIYABI_AGENT_CONCURRENCY=2
MIYABI_AUTO_PR_CREATE=true
```

---

## 3. Fix Engine → PR自動作成

### 目的

Fix Engineで修正を適用した際、自動的にGit branchを作成し、変更をコミットして、Draft PRを作成します。

### アーキテクチャ

```
apply_fixes(changeSetId)
  ↓
FixExecutor.applyChangeSet()
  ↓
Success?
  ↓ Yes
PRAutoCreator.createFromChangeSet()
  ↓
Git Operations:
  1. Create branch: fix/CS-xxx-description
  2. Commit changes
  3. Push to remote
  ↓
GitHub API: pulls.create(draft: true)
  ↓
PR作成完了
  ↓
[オプション] ReviewAgent.review(prNumber)
```

### 実装設計

#### ファイル: `src/integrations/pr-auto-creator.ts`

```typescript
export interface PRCreationOptions {
  draft: boolean;                  // Draft PRとして作成
  autoReview: boolean;             // 自動レビュー依頼
  autoAssignReviewers: boolean;    // レビュアー自動アサイン
  includeChecklist: boolean;       // チェックリスト含める
  linkIssues: boolean;             // 関連Issue自動リンク
}

export class PRAutoCreator {
  /**
   * ChangeSetからPRを作成
   */
  async createFromChangeSet(
    changeSet: ChangeSet,
    options?: Partial<PRCreationOptions>
  ): Promise<PullRequestInfo>;

  /**
   * Git操作
   */
  private async createBranch(branchName: string): Promise<void>;
  private async commitChanges(message: string): Promise<void>;
  private async pushBranch(branchName: string): Promise<void>;

  /**
   * PR本文生成
   */
  private generatePRBody(changeSet: ChangeSet): string;
}
```

#### PR テンプレート

```markdown
# Fix: {{changeSet.summary}}

## 📝 変更内容

{{changeSet.description}}

## 🔧 ChangeSet Details

**ChangeSet ID**: {{changeSet.id}}
**適用日時**: {{changeSet.appliedAt}}
**可逆性**: {{changeSet.reversible ? '✅ あり' : '❌ なし'}}

### 適用された修正

{{#changeSet.changes}}
- **{{type}}**: {{description}}
  - 対象: {{targetId}}
  - 詳細: {{details}}
{{/changeSet.changes}}

## 🎯 影響範囲

- 影響を受ける要求: {{affectedRequirements.length}}件
  {{#affectedRequirements}}
  - {{id}}: {{title}}
  {{/affectedRequirements}}

- 修正された違反: {{fixedViolations.length}}件

## ✅ チェックリスト

- [ ] ビルドが通ることを確認
- [ ] テストが全てパス
- [ ] 要求データの整合性を確認
- [ ] ドキュメントを更新
- [ ] レビュー完了

## 🔗 関連Issue

{{#relatedIssues}}
Closes #{{number}}
{{/relatedIssues}}

---
🤖 自動生成 by Fix Engine + Miyabi PRAgent
📊 ChangeSet: {{changeSet.id}}
```

### 統合

```typescript
// src/fix-engine/fix-executor.ts に追加

export class FixExecutor {
  private prCreator?: PRAutoCreator;

  async applyFixes(changeSetId: string, force: boolean = false): Promise<FixExecutionResult> {
    // ... 既存の修正適用処理 ...

    if (result.success) {
      console.log('✅ Fixes applied successfully');

      // PR自動作成
      if (this.prCreator && process.env.MIYABI_AUTO_PR_CREATE === 'true') {
        try {
          const pr = await this.prCreator.createFromChangeSet(changeSet, {
            draft: true,
            autoReview: true,
            autoAssignReviewers: true,
            includeChecklist: true,
            linkIssues: true,
          });

          console.log(`✅ Pull Request #${pr.number} created: ${pr.url}`);
          result.pullRequestUrl = pr.url;
        } catch (error) {
          console.error('Failed to create PR:', error);
        }
      }
    }

    return result;
  }
}
```

### Git Operations

```typescript
// src/integrations/git-operations.ts

export class GitOperations {
  /**
   * Branch作成
   */
  async createBranch(baseBranch: string, newBranch: string): Promise<void> {
    await execAsync(`git checkout ${baseBranch}`);
    await execAsync(`git pull origin ${baseBranch}`);
    await execAsync(`git checkout -b ${newBranch}`);
  }

  /**
   * 変更をコミット
   */
  async commitChanges(message: string): Promise<void> {
    await execAsync('git add .');
    await execAsync(`git commit -m "${message}"`);
  }

  /**
   * リモートにプッシュ
   */
  async pushBranch(branchName: string): Promise<void> {
    await execAsync(`git push -u origin ${branchName}`);
  }

  /**
   * ブランチ名生成
   */
  generateBranchName(changeSetId: string, summary: string): string {
    const sanitized = summary.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50);
    return `fix/${changeSetId}-${sanitized}`;
  }
}
```

---

## 統合テストシナリオ

### シナリオ1: 新規要求 → Issue → Agent → PR

```typescript
// tests/integration/full-workflow.test.ts

test('Full workflow: Requirement → Issue → Agent → PR', async () => {
  // 1. 新規要求を追加
  const req = await storage.addRequirement({
    title: 'ユーザー認証機能',
    description: 'JWT認証を実装',
    priority: 'high',
    category: 'セキュリティ',
  });

  // 2. Issue自動作成を確認
  await sleep(2000);
  const issue = await githubAPI.getIssueByLabel(`req:${req.id}`);
  expect(issue).toBeDefined();

  // 3. Agent自動実行を確認
  await sleep(10000);
  const agentResult = await miyabiAPI.getAgentStatus(issue.number);
  expect(agentResult.status).toBe('completed');

  // 4. PR作成を確認
  const prs = await githubAPI.getPRsForIssue(issue.number);
  expect(prs.length).toBeGreaterThan(0);
  expect(prs[0].draft).toBe(true);
});
```

### シナリオ2: 影響範囲分析 → Agent並列実行

```typescript
test('Impact analysis triggers agent orchestration', async () => {
  // 高優先度要求を複数作成
  const reqs = await Promise.all([
    storage.addRequirement({ title: 'REQ-1', priority: 'critical', ... }),
    storage.addRequirement({ title: 'REQ-2', priority: 'high', ... }),
    storage.addRequirement({ title: 'REQ-3', priority: 'high', ... }),
  ]);

  // 依存関係を設定
  await storage.updateRequirement(reqs[0].id, {
    dependencies: [reqs[1].id, reqs[2].id],
  });

  // 影響範囲分析
  const impact = await analyzer.analyzeImpact(reqs[0].id);

  // 高impactでAgent自動実行されることを確認
  expect(impact.impactScore).toBeGreaterThan(50);
  expect(impact.agentExecutionResult).toBeDefined();
  expect(impact.agentExecutionResult.executedAgents.length).toBeGreaterThan(0);
});
```

### シナリオ3: Fix Engine → PR自動作成

```typescript
test('Fix engine creates PR automatically', async () => {
  // 違反がある要求を作成
  const req = await storage.addRequirement({
    title: 'あいまいな要求',
    description: '何か実装する',
    priority: 'low',
    category: 'その他',
  });

  // 修正を適用
  const result = await fixExecutor.applyFixes('CS-001');

  expect(result.success).toBe(true);
  expect(result.pullRequestUrl).toBeDefined();

  // PR確認
  const pr = await githubAPI.getPRByURL(result.pullRequestUrl);
  expect(pr.draft).toBe(true);
  expect(pr.title).toContain('Fix:');
});
```

---

## 設定ファイル例

### `.env`

```env
# Phase 3 Automation
MIYABI_AUTO_ISSUE_CREATE=true
MIYABI_AUTO_AGENT_RUN=true
MIYABI_AUTO_PR_CREATE=true

# Thresholds
MIYABI_IMPACT_THRESHOLD=50
MIYABI_AGENT_CONCURRENCY=2

# Options
MIYABI_CREATE_SUBTASKS=true
MIYABI_AUTO_ASSIGN=true
MIYABI_DRAFT_PR=true
MIYABI_AUTO_REVIEW=true
```

### `src/integrations/automation-config.jsonc`

```jsonc
{
  "issueAutoCreation": {
    "enabled": true,
    "triggers": {
      "onNew": true,
      "onUpdate": false,
      "onDependencyChange": true
    },
    "options": {
      "createSubtasks": true,
      "autoAssign": true,
      "useLabels": true
    }
  },
  "agentOrchestration": {
    "enabled": true,
    "impactThreshold": 50,
    "maxConcurrency": 2,
    "autoCreatePR": true,
    "requireApproval": false
  },
  "prAutoCreation": {
    "enabled": true,
    "draft": true,
    "autoReview": true,
    "autoAssignReviewers": true,
    "includeChecklist": true,
    "linkIssues": true
  }
}
```

---

## ロードマップ

### Phase 3.1: Issue自動作成 (Week 1-2)

- [ ] `IssueAutoCreator`実装
- [ ] Storage統合
- [ ] テンプレート作成
- [ ] テスト作成

### Phase 3.2: Agent Orchestration (Week 3-4)

- [ ] `AgentOrchestrator`実装
- [ ] Impact score計算
- [ ] DAG分解ロジック
- [ ] 並列実行制御

### Phase 3.3: PR自動作成 (Week 5-6)

- [ ] `PRAutoCreator`実装
- [ ] Git操作実装
- [ ] Fix Engine統合
- [ ] PR テンプレート

### Phase 3.4: 統合テスト (Week 7-8)

- [ ] E2Eテストシナリオ
- [ ] パフォーマンステスト
- [ ] エラーハンドリング
- [ ] ドキュメント完成

---

**目標:** 完全自律型の要求管理 + 開発ワークフロー

*要求を追加するだけで、Issue作成 → 実装 → PR → レビューまで自動化*
