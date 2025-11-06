# MCP Tool Management - 機能重複防止ガイド

## 概要

このドキュメントでは、MCPサーバーの機能（ツール）が重複開発されないように管理する方法を説明します。Claude Code と Miyabi フレームワークを活用した管理システムを提案します。

## 現状分析

### 現在の課題

1. **ツールの可視性不足**
   - 16個のツールが `src/index.ts` に分散定義
   - 新しい機能を追加する際、既存ツールとの重複チェックが困難
   - ツール間の関係性が不明確

2. **ドキュメントの分散**
   - ツールの説明が InputSchema の description のみ
   - 使用例やベストプラクティスが散在
   - 変更履歴の追跡が困難

3. **開発フローの課題**
   - Issue作成時に既存ツールとの重複確認プロセスがない
   - Miyabi の Agent が既存機能を認識できない
   - Claude Code が過去の実装を参照しづらい

### 現在のツール一覧（16個）

| カテゴリ | ツール名 | 説明 |
|---------|---------|------|
| **CRUD** | add_requirement | 新しい要求を追加 |
| | get_requirement | 要求を取得 |
| | list_requirements | 全要求を一覧表示 |
| | update_requirement | 要求を更新 |
| | delete_requirement | 要求を削除 |
| | search_requirements | 条件検索 |
| **分析** | analyze_impact | 影響範囲分析 |
| | get_dependency_graph | 依存関係グラフ取得 |
| **検証** | validate_requirement | 単一要求の妥当性検証 |
| | validate_all_requirements | 全要求の妥当性検証 |
| | get_validation_report | 検証レポート取得 |
| **変更管理** | propose_change | 変更提案を作成 |
| | load_policy | 修正ポリシーを読み込み |
| | preview_fixes | 修正プレビュー |
| | apply_fixes | 修正を適用 |
| | rollback_fixes | 修正をロールバック |

## 提案: ツールレジストリシステム

### 1. 中央管理されたツールレジストリ

**ファイル**: `config/tool-registry.json`

```json
{
  "version": "1.0.0",
  "lastUpdated": "2025-10-24",
  "categories": {
    "crud": {
      "name": "CRUD Operations",
      "description": "基本的な作成・読取・更新・削除操作",
      "tools": ["add_requirement", "get_requirement", "list_requirements", "update_requirement", "delete_requirement", "search_requirements"]
    },
    "analysis": {
      "name": "Analysis & Insights",
      "description": "影響分析・依存関係分析",
      "tools": ["analyze_impact", "get_dependency_graph"]
    },
    "validation": {
      "name": "Validation & Quality",
      "description": "妥当性検証・品質チェック",
      "tools": ["validate_requirement", "validate_all_requirements", "get_validation_report"]
    },
    "change_management": {
      "name": "Change Management",
      "description": "変更提案・修正管理",
      "tools": ["propose_change", "load_policy", "preview_fixes", "apply_fixes", "rollback_fixes"]
    }
  },
  "tools": {
    "add_requirement": {
      "name": "add_requirement",
      "category": "crud",
      "version": "1.0.0",
      "status": "stable",
      "description": "新しい要求を追加します",
      "useCases": [
        "ステークホルダー要求の追加",
        "システム要求の追加",
        "機能要求の追加"
      ],
      "relatedTools": ["update_requirement", "validate_requirement"],
      "examples": ["examples/add_requirement.json"],
      "changelog": [
        {"version": "1.0.0", "date": "2025-01-15", "changes": "初回実装"}
      ]
    }
  }
}
```

### 2. Claude Code 統合

#### A. カスタムスラッシュコマンド: `/tool-check`

**ファイル**: `.claude/commands/tool-check.md`

```markdown
# Tool Check Command

新しい機能を実装する前に、既存ツールとの重複をチェックします。

## 実行内容

1. `config/tool-registry.json` を読み込み
2. ユーザーが説明した機能と類似するツールを検索
3. 既存ツールで実現可能か判定
4. 新規実装が必要な場合、カテゴリとネーミングを提案

## 使用方法

/tool-check <実装したい機能の説明>

例: /tool-check 要求のステータスを一括変更したい
```

#### B. CLAUDE.md への追記

`CLAUDE.md` に以下のセクションを追加:

```markdown
## MCP Tool Registry

新しい機能を追加する前に、必ず以下を確認してください:

1. `config/tool-registry.json` で既存ツールを確認
2. `/tool-check` コマンドで重複チェック
3. 新規ツール追加時は `scripts/register-tool.ts` を実行してレジストリを更新

### ツール追加の手順

1. Issue作成前に `/tool-check` で重複確認
2. Issue にツール仕様を明記（入力・出力・関連ツール）
3. 実装後、`scripts/register-tool.ts` でレジストリに登録
4. `docs/tools/<tool-name>.md` にドキュメント作成
5. `examples/<tool-name>.json` に使用例を追加
```

### 3. Miyabi フレームワーク統合

#### A. IssueAgent の拡張

**ファイル**: `.github/workflows/issue-tool-check.yml`

```yaml
name: Issue Tool Duplication Check

on:
  issues:
    types: [opened, edited]

jobs:
  check-tool-duplication:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'

      - name: Check for tool duplication
        run: |
          npm run tool-check:issue -- ${{ github.event.issue.number }}

      - name: Comment on Issue
        if: steps.check.outputs.has_duplication == 'true'
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '⚠️ **既存ツールとの重複の可能性があります**\n\n' +
                    process.env.SIMILAR_TOOLS
            })
```

#### B. CoordinatorAgent の事前チェック

Issue分解時に、Tool Registryを参照して既存機能を確認:

```typescript
// CoordinatorAgent の拡張
async function checkToolRegistry(taskDescription: string): Promise<ToolCheckResult> {
  const registry = await loadToolRegistry();
  const similarTools = findSimilarTools(registry, taskDescription);

  if (similarTools.length > 0) {
    return {
      hasDuplication: true,
      suggestions: similarTools.map(t => ({
        toolName: t.name,
        reason: `類似機能: ${t.description}`,
        recommendation: `既存ツール ${t.name} の拡張で対応可能`
      }))
    };
  }

  return { hasDuplication: false };
}
```

### 4. 自動ドキュメント生成

#### スクリプト: `scripts/generate-tool-docs.ts`

```typescript
/**
 * Tool Registry から自動的にドキュメントを生成
 */
import fs from 'fs/promises';
import path from 'path';

async function generateToolDocs() {
  const registry = JSON.parse(
    await fs.readFile('config/tool-registry.json', 'utf-8')
  );

  // カテゴリ別にMarkdownを生成
  for (const [catId, category] of Object.entries(registry.categories)) {
    const markdown = generateCategoryDoc(category, registry.tools);
    await fs.writeFile(
      `docs/tools/${catId}.md`,
      markdown
    );
  }

  // 全体の索引を生成
  const indexMarkdown = generateIndexDoc(registry);
  await fs.writeFile('docs/tools/INDEX.md', indexMarkdown);
}
```

### 5. 開発フロー統合

#### 新機能追加の標準フロー

```mermaid
graph TD
    A[新機能のアイデア] --> B[/tool-check コマンド実行]
    B --> C{既存ツールで実現可能？}
    C -->|Yes| D[既存ツールを使用]
    C -->|No| E[Issue作成]
    E --> F[IssueAgent: 自動重複チェック]
    F --> G{重複検出？}
    G -->|Yes| H[コメントで警告]
    G -->|No| I[CoordinatorAgent: タスク分解]
    I --> J[CodeGenAgent: 実装]
    J --> K[scripts/register-tool.ts 実行]
    K --> L[Tool Registry更新]
    L --> M[ドキュメント自動生成]
    M --> N[PR作成]
```

## 実装優先度

### Phase 1: 基盤構築（P0-Critical）

- [ ] `config/tool-registry.json` の作成
- [ ] 既存16ツールの登録
- [ ] `/tool-check` スラッシュコマンドの実装
- [ ] `CLAUDE.md` の更新

### Phase 2: 自動化（P1-High）

- [ ] `scripts/register-tool.ts` の実装
- [ ] `scripts/generate-tool-docs.ts` の実装
- [ ] Issue作成時の自動チェック（GitHub Actions）
- [ ] `docs/tools/` ディレクトリの整備

### Phase 3: Miyabi統合（P2-Medium）

- [ ] IssueAgent の拡張
- [ ] CoordinatorAgent の事前チェック機能
- [ ] Label自動付与（`duplicate-risk`, `tool:new`, `tool:extend`）

### Phase 4: 高度な分析（P3-Low）

- [ ] 自然言語処理による類似度判定
- [ ] ツール使用頻度の分析
- [ ] 推奨リファクタリングの提案

## 具体例: 新ツール追加プロセス

### 例: "要求のステータス一括変更" 機能を追加したい場合

#### Step 1: Claude Code で確認

```bash
/tool-check 要求のステータスを一括で変更したい
```

**Claude Code の応答:**

```
既存ツールの確認結果:

✓ 類似ツール発見:
  - update_requirement: 単一要求の更新（ステータス変更可能）
  - search_requirements: 条件検索で対象を特定可能

❌ 一括更新機能は未実装

推奨アプローチ:
1. 新規ツール "batch_update_requirements" を追加
2. カテゴリ: "crud" または "change_management"
3. 関連ツール: search_requirements, update_requirement
```

#### Step 2: Issue作成

```markdown
# 新機能: batch_update_requirements

## 概要
複数の要求のステータスを一括で変更できるツールを追加

## 既存ツールとの関係
- search_requirements で対象を特定
- update_requirement を内部的に使用
- 新規ツールとして実装

## Tool Registry情報
- カテゴリ: crud
- 関連ツール: [search_requirements, update_requirement]
```

#### Step 3: 実装後にレジストリ更新

```bash
npm run register-tool -- batch_update_requirements --category crud
```

自動的に:
- `config/tool-registry.json` に追加
- `docs/tools/batch_update_requirements.md` 生成
- `docs/tools/INDEX.md` 更新

## メリット

### 1. 開発者向け

- ✅ 新機能実装前に既存ツールを確認できる
- ✅ ツールの全体像を把握しやすい
- ✅ ドキュメント作成の手間を削減

### 2. Claude Code向け

- ✅ コンテキストとして Tool Registry を参照可能
- ✅ 過去の実装パターンを学習しやすい
- ✅ 重複提案を回避

### 3. Miyabi Agents向け

- ✅ IssueAgent が自動的に重複をチェック
- ✅ CoordinatorAgent がタスク分解時に既存ツールを考慮
- ✅ CodeGenAgent が一貫した実装パターンを維持

## 今後の拡張性

1. **ツールの自動テスト生成**
   - Tool Registry からテストケースを自動生成

2. **APIドキュメントの自動生成**
   - OpenAPI/Swagger形式でエクスポート

3. **ツール依存関係の可視化**
   - Mermaid図で依存関係を表示

4. **使用統計の収集**
   - よく使われるツール、使われないツールを分析

## 参考資料

- Model Context Protocol: https://modelcontextprotocol.io/
- Claude Code Documentation: https://docs.claude.com/claude-code
- Miyabi Framework: https://github.com/ShunsukeHayashi/Autonomous-Operations
