# 修正エンジン - 実践的なユースケース

## ユースケース1: 日常的な品質チェック

**シナリオ**: 毎日の要求レビューで、新規追加された要求の品質をチェックし、自動修正可能なものは即座に修正する。

```typescript
import { loadPolicy, FixExecutor } from './src/fix-engine/index.js';

// 1. ポリシーをロード
const policy = loadPolicy();
const executor = new FixExecutor(policy);

// 2. 検証関数（実際の検証ロジックを使用）
async function validate(reqs) {
  const validator = new YourValidationEngine();
  return await validator.validateAll(reqs);
}

// 3. 自動修正ループを実行（Strictのみ）
const result = await executor.execute(requirements, validate);

console.log(`修正された違反: ${result.fixedViolations.length}件`);
console.log(`残存違反（承認必要）: ${result.newViolations.length}件`);
```

**結果**:
- 循環依存 → 自動切断
- 主語なし・曖昧表現 → 承認待ち

---

## ユースケース2: 大規模リファクタリング

**シナリオ**: 100件以上の要求を一括で品質改善したい。まずプレビューで影響範囲を確認し、段階的に適用。

```typescript
import { FixPlanner, FixExecutor, ChangeEngine } from './src/fix-engine/index.js';

// ステップ1: 全違反を検出
const violations = await validateAll(requirements);
console.log(`違反: ${violations.length}件`);

// ステップ2: 修正プランを生成
const planner = new FixPlanner(policy);
const plan = await planner.planFixes(violations, requirements);

console.log(`影響要求数: ${plan.estimatedImpact.requirementsAffected}件`);
console.log(`新規要求: ${plan.estimatedImpact.newRequirements}件`);

// ステップ3: プレビューを確認
const engine = new ChangeEngine();
plan.changeSets.forEach(cs => {
  console.log(engine.preview(cs, requirements));
});

// ステップ4: 優先度の高いものから段階的に適用
const highPriorityIds = plan.changeSets
  .filter(cs => cs.violations.includes('graph.cycle'))
  .map(cs => cs.id);

const executor = new FixExecutor(policy);
const result = await executor.applySelected(
  highPriorityIds,
  requirements,
  plan.changeSets
);

console.log(`第1段階: ${result.appliedChangeSets.length}件を適用`);
```

**段階的アプローチ**:
1. 構造系（循環・階層）を優先修正
2. 内容系（主語・曖昧表現）を次に修正
3. 最適化系（分割・統合）を最後に修正

---

## ユースケース3: 要求分割の承認フロー

**シナリオ**: AIが提案した分割案を人間がレビュー・承認してから適用。

```typescript
// ステップ1: 単一性が低い要求を検出
const lowAtomicityViolations = violations.filter(v => v.code === 'atomicity.low');

// ステップ2: 分割案を生成
const plan = await planner.planFixes(lowAtomicityViolations, requirements);

// ステップ3: 各分割案をレビュー
for (const cs of plan.changeSets) {
  console.log('━━━ 分割案 ━━━');
  console.log(engine.preview(cs, requirements));

  // ユーザーに承認を求める
  const approved = await askUserApproval(cs);

  if (approved) {
    // 承認されたら適用
    const result = await executor.applySelected([cs.id], requirements, plan.changeSets);
    console.log(`✅ 適用完了: ${cs.id}`);
  } else {
    console.log(`⏸️  スキップ: ${cs.id}`);
  }
}
```

**承認UIのイメージ**:
```
━━━ 分割案 ━━━
元の要求: SYS-001
「システムは、指定された起点から終点まで、荷物を自動的に搬送する」

↓ 分割後

新要求1: SYS-001-S1
「システムは、指定された起点から終点まで荷物を搬送する」

新要求2: SYS-001-S2
「システムは、搬送を自動的に行う」

[✅ 承認] [❌ 拒否] [✏️ 編集]
```

---

## ユースケース4: カスタム修正ルールの追加

**シナリオ**: プロジェクト固有の修正ルールを追加したい。

**fix-policy.jsonc に追加**:
```jsonc
{
  "rules": [
    {
      "id": "fix-custom-numbering",
      "whenViolation": "CUSTOM-001",
      "priority": 95,
      "severity": "suggest",
      "description": "要求IDの採番ルール違反を修正",
      "actions": [
        {
          "use": "rewrite_text",
          "mode": "assist",
          "params": {
            "renumber": true,
            "id_pattern": "REQ-${category}-${seq:04d}"
          }
        }
      ]
    }
  ]
}
```

**カスタム操作の実装**:
```typescript
// fix-planner.ts に追加
private createRenumberChange(req, violation, params) {
  const newId = this.generateNewId(req, params.id_pattern);

  return {
    op: 'rewrite',
    target: req.id,
    payload: {
      newId,
      updateReferences: true
    },
    rationale: `IDの採番ルール適合 (${violation.code})`,
    preview: [...]
  };
}
```

---

## ユースケース5: ロールバックとやり直し

**シナリオ**: 修正を適用したが、問題が見つかったので取り消して別の案を試す。

```typescript
// ステップ1: 修正を適用
const result1 = await executor.applySelected(['CS-001'], requirements, plan.changeSets);
console.log('修正を適用しました');

// ステップ2: テストで問題発覚
const testResult = await runTests(result1.modified);
if (!testResult.passed) {
  console.log('⚠️  テスト失敗。ロールバックします。');

  // ステップ3: ロールバック
  const rollback = await executor.rollbackAll(
    result1.appliedChangeSets,
    requirements
  );

  console.log(`✅ ロールバック完了: ${rollback.success}`);

  // ステップ4: 別の修正案を試す
  const result2 = await executor.applySelected(['CS-002'], requirements, plan.changeSets);
  console.log('別の修正案を適用しました');
}
```

**来歴の追跡**:
```typescript
// 修正履歴を確認
requirements['SYS-001'].derived_from  // → ['SYS-001-OLD']
requirements['SYS-001'].supersedes    // → ['SYS-001-V1', 'SYS-001-V2']
```

---

## ユースケース6: CI/CDパイプラインへの組み込み

**シナリオ**: GitHubのPull Requestで自動的に品質チェック＋修正案の提示。

**GitHub Actions ワークフロー**:
```yaml
name: Requirements Quality Check

on:
  pull_request:
    paths:
      - 'data/requirements.json'

jobs:
  quality-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Run fix engine
        run: npx tsx scripts/ci-fix-check.ts

      - name: Post comment
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const preview = fs.readFileSync('fix-preview.md', 'utf8');

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `## 要求品質チェック結果\n\n${preview}`
            });
```

**scripts/ci-fix-check.ts**:
```typescript
import { loadPolicy, FixPlanner } from './src/fix-engine/index.js';
import * as fs from 'fs';

const policy = loadPolicy();
const requirements = loadRequirements();
const violations = await validate(requirements);

const planner = new FixPlanner(policy);
const plan = await planner.planFixes(violations, requirements);

// Markdownプレビューを生成
const preview = plan.preview;
fs.writeFileSync('fix-preview.md', preview);

// CI失敗条件
if (plan.estimatedImpact.requirementsAffected > 10) {
  console.error('⚠️  影響範囲が大きすぎます（10件以上）');
  process.exit(1);
}
```

---

## ユースケース7: バッチ処理での一括修正

**シナリオ**: 夜間バッチで全要求を検証し、Strict違反を自動修正。

```typescript
// cron-fix-batch.ts
import { loadPolicy, FixExecutor } from './src/fix-engine/index.js';
import { sendSlackNotification } from './utils/slack.js';

async function batchFix() {
  const policy = loadPolicy();
  const executor = new FixExecutor(policy);
  const requirements = await loadRequirements();

  console.log(`[${new Date().toISOString()}] バッチ修正開始`);

  const result = await executor.execute(requirements, validate);

  // 結果をSlackに通知
  await sendSlackNotification({
    channel: '#requirements-quality',
    text: `
      ✅ 夜間バッチ修正完了
      • 反復回数: ${result.iterations}回
      • 修正された違反: ${result.fixedViolations.length}件
      • 残存違反: ${result.newViolations.length}件
    `
  });

  // 修正後のデータを保存
  await saveRequirements(result.modified);

  console.log(`[${new Date().toISOString()}] バッチ修正完了`);
}

batchFix().catch(console.error);
```

**crontab設定**:
```bash
# 毎日AM2:00に実行
0 2 * * * cd /path/to/project && npx tsx scripts/cron-fix-batch.ts >> logs/fix-batch.log 2>&1
```

---

## ユースケース8: Web UIでのインタラクティブな修正

**シナリオ**: Webブラウザで修正案を確認し、クリックで適用。

**React コンポーネント例**:
```typescript
function FixSuggestions() {
  const [changeSets, setChangeSets] = useState([]);
  const [loading, setLoading] = useState(false);

  // 修正プランを取得
  useEffect(() => {
    async function loadPlan() {
      const response = await fetch('/api/fix-plan');
      const plan = await response.json();
      setChangeSets(plan.changeSets);
    }
    loadPlan();
  }, []);

  // 適用ハンドラ
  async function handleApply(csId) {
    setLoading(true);
    try {
      await fetch('/api/fix-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changeSetId: csId })
      });

      alert('✅ 修正を適用しました');
      // リロード
      window.location.reload();
    } catch (error) {
      alert('❌ 適用に失敗しました');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fix-suggestions">
      <h2>修正提案 ({changeSets.length}件)</h2>

      {changeSets.map(cs => (
        <div key={cs.id} className="change-card">
          <h3>{cs.violations.join(', ')}</h3>
          <p>影響範囲: {cs.impacted.length}件の要求</p>

          <pre>{cs.preview}</pre>

          <button
            onClick={() => handleApply(cs.id)}
            disabled={loading}
          >
            ✅ 適用
          </button>
          <button>⏸️ スキップ</button>
        </div>
      ))}
    </div>
  );
}
```

---

## まとめ

### ユースケース別の適用モード

| ユースケース | 適用モード | 承認 | 頻度 |
|------------|----------|------|------|
| 日常的な品質チェック | execute() | Strictのみ自動 | 毎日 |
| 大規模リファクタリング | applySelected() | 段階的承認 | 月次 |
| 要求分割の承認フロー | applySelected() | 1件ずつ承認 | 随時 |
| カスタムルール追加 | 独自実装 | カスタム | - |
| ロールバックとやり直し | rollbackAll() | - | 随時 |
| CI/CDパイプライン | previewFixes() | コメントで確認 | PR毎 |
| バッチ処理 | execute() | Strictのみ自動 | 夜間 |
| Web UIインタラクティブ | applySelected() | UI上で承認 | 随時 |

### 推奨ワークフロー

1. **開発時**: Web UIでインタラクティブに修正
2. **PR時**: CI/CDで自動チェック＋コメント
3. **マージ後**: バッチで自動修正（Strictのみ）
4. **定期メンテ**: 大規模リファクタリング（月次）

---

詳細は `FIX-ENGINE-README.md` を参照してください。
