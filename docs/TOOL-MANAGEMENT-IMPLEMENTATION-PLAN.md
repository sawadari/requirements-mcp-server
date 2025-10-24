# Tool Management Implementation Plan

## 概要

MCPサーバーの機能重複を防ぐため、Tool Registryシステムを導入します。このドキュメントは段階的な実装計画を示します。

## 🎯 目的

1. **重複開発の防止**: 新機能追加前に既存ツールとの重複を自動チェック
2. **可視性の向上**: 16個の既存ツールを一元管理し、全体像を把握
3. **Claude Code統合**: `/tool-check` コマンドで開発フロー中に重複確認
4. **Miyabi統合**: IssueAgent/CoordinatorAgentが自動的に重複を検出

## 📦 実装済みコンポーネント

### Phase 0: 基盤構築 ✅ 完了

#### Tool Registry
- [x] `config/tool-registry.json` - 16ツールの中央レジストリ
- [x] `docs/MCP-TOOL-MANAGEMENT.md` - 管理システムの設計ドキュメント
- [x] `.claude/commands/tool-check.md` - Claude Code スラッシュコマンド
- [x] `scripts/register-tool.ts` - 新規ツール登録スクリプト
- [x] `CLAUDE.md` 更新 - MCP Tool Registryセクション追加
- [x] `package.json` 更新 - `npm run register-tool` スクリプト追加

#### TDD Integration ✅ 完了
- [x] `docs/TDD-TOOL-DEVELOPMENT.md` - TDD開発ガイド（15,000文字超）
- [x] `tests/templates/tool-test.template.ts` - テストテンプレート
- [x] `scripts/generate-tool-test.ts` - テスト自動生成スクリプト
- [x] `scripts/validate-registry.ts` - Registry整合性チェック
- [x] `package.json` 更新 - TDD関連スクリプト追加
  - `npm run generate-tool-test`
  - `npm run validate-registry`
- [x] `CLAUDE.md` 更新 - TDD開発フロー追加

## 🚀 次のステップ

### Phase 1: 基本機能の完成（P1-High）

#### 1.1 ツールドキュメント自動生成

**ファイル**: `scripts/generate-tool-docs.ts`

```typescript
// Tool Registryから各ツールのMarkdownドキュメントを自動生成
// - docs/tools/INDEX.md (全ツール索引)
// - docs/tools/crud.md (カテゴリ別)
// - docs/tools/analysis.md
// - docs/tools/validation.md
// - docs/tools/change_management.md
```

**期待される成果物**:
- `docs/tools/INDEX.md` - 全ツール一覧
- `docs/tools/<category>.md` - カテゴリ別詳細ドキュメント

**実装時間**: 2-3時間

#### 1.2 使用例テンプレート

**ディレクトリ**: `examples/`

各ツールの使用例JSONを作成:

```json
// examples/add_requirement.json
{
  "tool": "add_requirement",
  "description": "新しいステークホルダー要求を追加する例",
  "input": {
    "title": "システムは10秒以内に応答すること",
    "description": "ユーザー操作に対して10秒以内に応答を返す必要がある",
    "priority": "high",
    "category": "performance",
    "type": "stakeholder"
  },
  "expectedOutput": {
    "id": "STK-007",
    "status": "draft",
    "createdAt": "2025-10-24T12:00:00Z"
  }
}
```

**成果物**: 16個のツールそれぞれに使用例を1つ以上作成

**実装時間**: 4-5時間

### Phase 2: 自動化とCI/CD統合（P2-Medium）

#### 2.1 GitHub Actions ワークフロー

**ファイル**: `.github/workflows/tool-registry-check.yml`

```yaml
name: Tool Registry Check

on:
  issues:
    types: [opened, edited]
  pull_request:
    types: [opened, synchronize]

jobs:
  check-duplication:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Check for tool duplication in Issue
        if: github.event_name == 'issues'
        run: |
          # Issue本文からツール追加の意図を検出
          # Tool Registryと照合して類似ツールを検索
          npm run tool-check:issue -- ${{ github.event.issue.number }}

      - name: Comment on Issue
        if: steps.check.outputs.has_duplication
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              body: '⚠️ **既存ツールとの重複の可能性**\n\n...'
            })
```

**成果物**:
- Issue作成時に自動的に重複チェック
- PRに新しいツールが含まれる場合、Registry更新を確認

**実装時間**: 6-8時間

#### 2.2 Tool Registry 妥当性チェック

**ファイル**: `scripts/validate-registry.ts`

```typescript
// Tool Registryの整合性チェック:
// - 全ツールがsrc/index.tsに実装されているか
// - カテゴリの割り当てが正しいか
// - 関連ツールが実在するか
// - changelog のバージョン整合性
```

**CI統合**: `npm test` 時に自動実行

**実装時間**: 3-4時間

### Phase 3: Miyabi Agent統合（P2-Medium）

#### 3.1 IssueAgent 拡張

**ファイル**: `.github/workflows/issue-labeling.yml` (既存の拡張)

```yaml
# IssueAgentが Issue本文を解析時に:
# 1. Tool Registry を読み込み
# 2. 新機能追加の意図を検出
# 3. 類似ツールがあれば label: duplicate-risk を付与
# 4. 新規ツールの場合 label: tool:new を付与
# 5. 既存ツール拡張の場合 label: tool:extend を付与
```

**成果物**:
- `duplicate-risk` ラベルによる自動警告
- `tool:new` / `tool:extend` による分類

**実装時間**: 5-6時間

#### 3.2 CoordinatorAgent 事前チェック

**統合先**: Miyabi CoordinatorAgent

```typescript
// タスク分解前に Tool Registry をチェック:
// - 既存ツールで実現可能な場合、新規実装タスクを生成しない
// - 既存ツールの拡張が必要な場合、拡張タスクとして明示
// - 新規ツール追加が必要な場合、register-tool タスクを追加
```

**成果物**:
- DAG生成時に重複タスクを排除
- より効率的なタスク分解

**実装時間**: 8-10時間

### Phase 4: 高度な機能（P3-Low）

#### 4.1 自然言語処理による類似度判定

**ファイル**: `scripts/similarity-checker.ts`

```typescript
// Anthropic Claude APIを使用:
// - ユーザーの説明文と既存ツールのdescription/useCasesを比較
// - 意味的な類似度を計算
// - 閾値以上なら重複候補としてアラート
```

**実装時間**: 10-12時間

#### 4.2 ツール使用統計の収集

**ファイル**: `src/analytics/tool-usage.ts`

```typescript
// MCPサーバーのツール呼び出しをトラッキング:
// - 各ツールの呼び出し回数
// - 成功率・エラー率
// - よく使われる組み合わせ
// - 使われていないツール（削除候補）
```

**成果物**:
- `data/tool-usage-stats.json` - 統計データ
- 定期的なレポート生成

**実装時間**: 12-15時間

#### 4.3 推奨リファクタリング提案

**ファイル**: `scripts/suggest-refactoring.ts`

```typescript
// Tool Registry分析に基づく提案:
// - 類似機能のツールを統合
// - よく使われる組み合わせを新ツールとして提案
// - 使われていないツールの非推奨化
```

**実装時間**: 8-10時間

## 📊 実装スケジュール

| Phase | タスク | 優先度 | 推定時間 | 累計時間 |
|-------|--------|--------|----------|----------|
| **Phase 0** | 基盤構築 | P0-Critical | 4h | 4h |
| **Phase 1.1** | ドキュメント自動生成 | P1-High | 3h | 7h |
| **Phase 1.2** | 使用例テンプレート | P1-High | 5h | 12h |
| **Phase 2.1** | GitHub Actions | P2-Medium | 7h | 19h |
| **Phase 2.2** | Registry妥当性チェック | P2-Medium | 4h | 23h |
| **Phase 3.1** | IssueAgent拡張 | P2-Medium | 6h | 29h |
| **Phase 3.2** | CoordinatorAgent統合 | P2-Medium | 9h | 38h |
| **Phase 4.1** | 類似度判定 | P3-Low | 11h | 49h |
| **Phase 4.2** | 使用統計 | P3-Low | 14h | 63h |
| **Phase 4.3** | リファクタリング提案 | P3-Low | 9h | 72h |

**推奨実装順序**:
1. Phase 0 ✅ 完了
2. Phase 1.1, 1.2 (次の優先タスク)
3. Phase 2.1, 2.2
4. Phase 3.1, 3.2
5. Phase 4.x (必要に応じて)

## 🎬 使用例: 実際の開発フロー

### シナリオ: "要求のステータス一括変更" 機能を追加したい

#### Step 1: Claude Code で重複チェック

```
/tool-check 要求のステータスを一括で変更したい
```

**Claude Codeの応答**:

```markdown
## 既存ツールの確認結果

### 類似ツール
- **update_requirement**: 単一要求の更新（ステータス変更可能）
- **search_requirements**: 条件検索で対象を特定可能

### 判定
❌ 一括更新機能は未実装

### 推奨アプローチ
1. 新規ツール "batch_update_requirements" を追加
2. search_requirements で対象を特定 → update_requirement を繰り返し実行
3. バッチ操作の結果サマリーを返す

### 新規ツールが必要な場合
- 推奨ツール名: batch_update_requirements
- 推奨カテゴリ: crud
- 関連ツール: [search_requirements, update_requirement]
```

#### Step 2: Issue作成

GitHubで Issue を作成すると、IssueAgent が自動的に:
1. Tool Registry をチェック
2. 重複がないことを確認
3. `tool:new` ラベルを付与

#### Step 3: 実装

CodeGenAgent が実装:
- `src/index.ts` に `batch_update_requirements` ハンドラーを追加
- テストコードを生成

#### Step 4: Tool Registry更新

```bash
npm run register-tool -- batch_update_requirements --category crud
```

自動的に:
- `config/tool-registry.json` に追加
- `docs/tools/batch_update_requirements.md` 生成 (Phase 1.1実装後)
- `docs/tools/INDEX.md` 更新

#### Step 5: PR作成 & CI

PRAgentが自動PR作成 → GitHub Actions が:
1. Tool Registry整合性チェック
2. 新規ツールのドキュメントが存在するか確認
3. 使用例が追加されているか確認

#### Step 6: マージ後

- DeploymentAgent が自動デプロイ
- Tool Usage Analyticsが統計収集開始 (Phase 4.2実装後)

## 📈 期待される効果

### 定量的効果

- **重複開発の削減**: 推定 30-50% (新機能追加時の重複を防止)
- **ドキュメント作成時間**: 80% 削減 (自動生成)
- **新規開発者のオンボーディング時間**: 40% 削減 (全体像が明確)

### 定性的効果

- ✅ 開発者が既存ツールを理解しやすくなる
- ✅ Claude Code が過去の実装パターンを学習しやすくなる
- ✅ Miyabi Agents が賢い判断を下せるようになる
- ✅ コードベースの一貫性が向上

## 🔗 関連ドキュメント

- [MCP-TOOL-MANAGEMENT.md](./MCP-TOOL-MANAGEMENT.md) - 詳細設計
- [config/tool-registry.json](../config/tool-registry.json) - Tool Registry本体
- [CLAUDE.md](../CLAUDE.md#mcp-tool-registry) - Claude Code統合ガイド
- [.claude/commands/tool-check.md](../.claude/commands/tool-check.md) - /tool-check コマンド

## 📝 次のアクション

### すぐに実行可能

1. **ドキュメント自動生成スクリプトの実装** (Phase 1.1)
   ```bash
   # Issue #19 を作成
   gh issue create --title "Phase 1.1: Tool documentation auto-generation" \
     --body-file docs/issues/phase1-1-tool-docs.md \
     --label "enhancement,P1-High,tool:registry"
   ```

2. **使用例テンプレートの作成** (Phase 1.2)
   ```bash
   # Issue #20 を作成
   gh issue create --title "Phase 1.2: Create tool usage examples" \
     --body-file docs/issues/phase1-2-examples.md \
     --label "documentation,P1-High,tool:registry"
   ```

### 中期的に実施

3. **GitHub Actions統合** (Phase 2.1)
4. **Miyabi Agent統合** (Phase 3.x)

## ✅ チェックリスト

- [x] Phase 0: Tool Registry基盤構築
- [x] `/tool-check` コマンド実装
- [x] `npm run register-tool` スクリプト作成
- [x] CLAUDE.md 更新
- [ ] Phase 1.1: ドキュメント自動生成
- [ ] Phase 1.2: 使用例テンプレート
- [ ] Phase 2.1: GitHub Actions
- [ ] Phase 2.2: Registry妥当性チェック
- [ ] Phase 3.1: IssueAgent拡張
- [ ] Phase 3.2: CoordinatorAgent統合
- [ ] Phase 4.x: 高度な機能

---

**Last Updated**: 2025-10-24
**Status**: Phase 0 Complete, Phase 1 Ready to Start
