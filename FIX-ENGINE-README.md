# 修正エンジン（Fix Engine）

## 概要

要求品質違反を検出し、**修正候補（ChangeSet）** を生成・適用する自動修正エンジンです。
**可逆性・局所化→波及・段階的適用** を原則とし、人間の承認を前提とした安全な設計になっています。

本エンジンは [REQUIREMENTS-PRINCIPLES.md](./REQUIREMENTS-PRINCIPLES.md) の「ツール的側面」および「妥当性」に基づいて設計されています：
- **影響分析による影響範囲の特定**: 要求の追加・変更・削除の影響を自動分析
- **整合性の自動維持**: 影響範囲内で要求を正しく妥当性をもって修正
- **可逆性**: すべての修正操作はロールバック可能

## 設計原則

### 1. 可逆性（Reversibility）
- すべての修正は **ChangeSet** として記録
- 各Changeに逆操作（inverse）を定義
- いつでもロールバック可能

### 2. 局所化→波及（Locality First）
- まず当該要求を修正
- 影響集合（親・子・兄弟・横依存）に順次適用
- 対象 → 親 → 兄弟 → 子 → 横依存 → テスト の順

### 3. 一意な責任（Unique Responsibility）
- 分割・統合は親子関係とMECEの観点で比較対象を明示
- カノニカル選定は履歴・参照数・安定度で決定

**REQUIREMENTS-PRINCIPLESとの対応**: MECE原則により、下位要求は互いに重複せず、上位要求を完全にカバーする

### 4. 段階的適用（Staged Application）
- **Strict**（構造系）: 即時修復（自動適用可能）
- **Suggest**（内容系）: 候補提示→承認後に適用

### 5. 停止条件（Stopping Criteria）
- 各ChangeSet適用後に再検証
- 固定点（no new strict violations）で停止
- 最大反復回数（default: 5回）で無限ループを回避

## アーキテクチャ

```
fix-policy.jsonc          # 修正ポリシー定義（人間が記述）
src/fix-engine/
├── types.ts              # 型定義
├── change-engine.ts      # ChangeSet適用エンジン（apply/rollback/preview）
├── fix-planner.ts        # 修正プランナー（違反→ChangeSet生成）
├── fix-executor.ts       # 再検証ループ実行（plan→apply→revalidate→stop）
└── index.ts              # エクスポート + ポリシーローダー
```

## 主要な型

### ChangeSet（変更集合）
```typescript
interface ChangeSet {
  id: string;
  createdAt: string;
  violations: string[];       // 対応する違反コード
  changes: Change[];          // 個別変更のリスト
  impacted: ReqID[];          // 影響を受けるノード
  reversible: boolean;        // 逆操作が全て定義されているか
  status: 'proposed' | 'approved' | 'applied' | 'rolled_back';
}
```

### Change（個別変更）
```typescript
interface Change {
  op: "split" | "merge" | "rewire" | "introduce" | "rewrite" | "alias" | "break_cycle";
  target: ReqID | ReqID[];
  payload?: { /* 操作固有のパラメータ */ };
  rationale: string;          // 修正の理由
  preview: Diff[];            // UI表示用の差分
  inverse?: Change;           // 逆操作（ロールバック用）
}
```

### Requirement（来歴フィールド追加）
```typescript
interface Requirement {
  // ... 標準フィールド
  derived_from?: ReqID[];     // 分割元
  supersedes?: ReqID[];       // 統合で置き換えた旧ID
  canonical_of?: ReqID[];     // 自分が代表する旧ID群
}
```

## 使用方法

### 1. ポリシーのロード

```typescript
import { loadPolicy } from './src/fix-engine/index.js';

const policy = loadPolicy(); // fix-policy.jsonc を自動ロード
```

### 2. 修正プランの生成

```typescript
import { FixPlanner } from './src/fix-engine/index.js';

const planner = new FixPlanner(policy);
const plan = await planner.planFixes(violations, requirements);

console.log(plan.preview); // Markdown形式のプレビュー
```

### 3. 修正の実行（再検証ループ）

```typescript
import { FixExecutor } from './src/fix-engine/index.js';

const executor = new FixExecutor(policy);

// 検証関数を渡して実行
const result = await executor.execute(requirements, async (reqs) => {
  // 再検証ロジック
  return await validateRequirements(reqs);
});

console.log(`成功: ${result.success}`);
console.log(`反復回数: ${result.iterations}`);
console.log(`修正された違反: ${result.fixedViolations.length}件`);
```

### 4. プレビューのみ（適用しない）

```typescript
const preview = await executor.previewFixes(requirements, validate);
console.log(preview);
```

### 5. 特定のChangeSetsのみ適用

```typescript
const result = await executor.applySelected(
  ['CS-123', 'CS-456'],  // ChangeSet ID
  requirements,
  plan.changeSets
);
```

### 6. ロールバック

```typescript
const { success, restored, errors } = await executor.rollbackAll(
  appliedChangeSets,
  currentRequirements
);
```

## 修正操作（Operations）

| 操作 | 説明 | 可逆性 | 例 |
|------|------|--------|-----|
| `split` | 要求の分割 | ✅ | 列挙・接続詞で分割 |
| `merge` | 要求の統合 | ✅ | 類似要求をカノニカル1件に |
| `rewire` | リンクの再配線 | ✅ | 分割後の親子関係の再接続 |
| `introduce` | 中間層の導入 | ✅ | 抽象度の段差を埋める |
| `rewrite` | テキストの書き換え | ✅ | 主語追加・曖昧表現の具体化 |
| `alias` | エイリアスの設定 | ✅ | 旧IDを検索可能に保持 |
| `break_cycle` | 循環の切断 | ✅ | 最小フィードバック辺を切断 |

## 修正ルール定義（fix-policy.jsonc）

```jsonc
{
  "rules": [
    {
      "id": "fix-atomicity-low",
      "whenViolation": "atomicity.low",
      "priority": 90,
      "severity": "suggest",
      "guard": {
        "level": ["system", "system_functional"],
        "min_confidence": 0.7
      },
      "actions": [
        {
          "use": "split_requirement",
          "mode": "assist",  // 承認必須
          "params": {
            "max_tokens": 120,
            "split_on": ["list", "and_or", "multi_shall"]
          },
          "onSuccess": ["rewire_edges", "revalidate_siblings"]
        }
      ]
    }
  ]
}
```

## デモスクリプト

```bash
# 修正エンジンのデモを実行
npx tsx scripts/demo-fix-engine.ts
```

### デモの流れ

1. ポリシーをロード
2. サンプル要求を作成（単一性が低い、主語なし、曖昧表現）
3. 初期検証を実行
4. 修正プランを生成・プレビュー
5. 修正を実行（自動適用可能なもののみ）
6. 結果サマリーを表示

## 出力例

```
=== 修正プレビュー ===

# 変更プレビュー: CS-1760882885109-3l0kxanmx

**対応違反**: atomicity.low
**影響要求数**: 1件
**可逆性**: ✅

## 変更一覧 (1件)

### 1. 要求の分割

**対象**: TEST-001
**理由**: 単一性が低い (atomicity.low): 複数の関心事を分離

**差分**:
➖ 元の要求 TEST-001 を 3 件に分割
➕ 新要求 TEST-001-S1
➕ 新要求 TEST-001-S2
➕ 新要求 TEST-001-S3
```

## ガバナンス

### 承認フロー

```typescript
{
  "governance": {
    "approval_required": {
      "operations": ["split_requirement", "merge_requirements", "introduce_intermediate"],
      "roles": ["owner", "reviewer"]
    }
  }
}
```

### 監査ログ

```typescript
{
  "audit": {
    "log_all_changes": true,
    "record_rationale": true,
    "track_who_when": true
  }
}
```

### 状態遷移

```
draft → proposed → approved → applied
                          ↓
                    rolled_back
```

## 今後の拡張

### 優先度順

1. **LLM統合**
   - 分割候補の比較評価（A/B/C案のスコアリング）
   - 未被覆スパンの抽出
   - 中間層要求のドラフト生成

2. **Web UI統合**
   - 差分カードの表示
   - 承認ワークフロー
   - 一括適用

3. **高度な操作**
   - `rebalance_children`: 子要求の再配置
   - `propose_missing_children`: 未被覆スパンから子要求生成
   - `tighten_parent_text`: 親要求の範囲明確化

4. **波及処理の強化**
   - テスト資産の再紐付け
   - 設計ドキュメントへの影響分析
   - 横依存の矛盾検査

## 参考

- **ポリシー定義**: `fix-policy.jsonc`
- **デモスクリプト**: `scripts/demo-fix-engine.ts`
- **型定義**: `src/fix-engine/types.ts`

---

🌸 **可逆性・局所化→波及・段階的適用** による安全な要求修正
