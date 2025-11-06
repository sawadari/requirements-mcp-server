# ドキュメント構造最適化計画

## 現状分析

**問題点:**
- ルートに23個のMarkdownファイルが散在
- 重複コンテンツが存在
- ドキュメント間の関係が不明確
- 新規ユーザーがどこから読めばいいか分からない

## 提案: README.mdをハブとしたドキュメント体系

### 📁 新しい構造

```
requirements-mcp-server/
├── README.md                        # 🏠 ハブ - 最初に読むドキュメント
│
├── docs/                           # 📚 詳細ドキュメント
│   ├── getting-started/           # 🚀 入門ガイド
│   │   ├── installation.md        # インストール手順（統合: SETUP.md）
│   │   ├── quick-start.md         # クイックスタート（統合: HOW-TO-USE.md）
│   │   └── tutorial.md            # チュートリアル（統合: USE-CASES.md）
│   │
│   ├── user-guide/                # 📖 ユーザーガイド
│   │   ├── mcp-tools.md           # MCPツールリファレンス（MCP-TOOLS-GUIDE.md）
│   │   ├── web-viewer.md          # Webビューアー使い方（README.mdから抽出）
│   │   ├── validation.md          # バリデーション機能（test-validation.md）
│   │   └── project-management.md  # プロジェクト管理
│   │
│   ├── advanced/                  # 🔧 高度な機能
│   │   ├── fix-engine.md          # Fix Engine（FIX-ENGINE-README.md）
│   │   ├── ontology.md            # オントロジー（ONTOLOGY-GUIDE.md）
│   │   ├── ai-chat.md             # AIチャット統合（AI-CHAT-INTEGRATION.md）
│   │   └── manual-testing.md      # 手動テスト（manual-test-example.md）
│   │
│   ├── architecture/              # 🏗️ アーキテクチャ
│   │   ├── overview.md            # 概要（ARCHITECTURE.md）
│   │   ├── design-principles.md   # 設計原則（REQUIREMENTS-PRINCIPLES.md）
│   │   └── improvements.md        # 改善提案（ARCHITECTURE-IMPROVEMENTS.md）
│   │
│   ├── development/               # 👨‍💻 開発者向け
│   │   ├── miyabi-integration.md  # Miyabi統合（MIYABI-INTEGRATION.md）
│   │   ├── tool-management.md     # ツール管理（docs/MCP-TOOL-MANAGEMENT.md）
│   │   ├── issue-workflow.md      # Issue作成（HOW_TO_CREATE_ISSUE.md）
│   │   └── testing.md             # テスト（docs/TDD-TOOL-DEVELOPMENT.md）
│   │
│   └── reference/                 # 📋 リファレンス
│       ├── roadmap.md             # ロードマップ（ROADMAP.md）
│       ├── changelog.md           # 変更履歴（COMPLETION-SUMMARY.md統合）
│       └── claude-integration.md  # Claude Code統合（CLAUDE.md）
│
└── archive/                       # 🗄️ アーカイブ（削除候補）
    ├── IMPROVEMENTS.md            # 古い改善提案
    ├── IMPROVEMENTS-V2.md
    ├── NEXT-STEPS.md
    ├── ISSUE_DUPLICATION.md
    └── PRINCIPLES-COMPLIANCE-ANALYSIS.md
```

---

## 統合・移動・削除の詳細

### ✅ 統合するファイル

| 元ファイル | 統合先 | 理由 |
|-----------|--------|------|
| SETUP.md | docs/getting-started/installation.md | インストール手順を一箇所に |
| HOW-TO-USE.md | docs/getting-started/quick-start.md | 使い方ガイドを統合 |
| USE-CASES.md | docs/getting-started/tutorial.md | 実例を含むチュートリアルに |
| MCP-TOOLS-GUIDE.md | docs/user-guide/mcp-tools.md | ユーザーガイドとして整理 |
| test-validation.md | docs/user-guide/validation.md | バリデーション機能を統合 |

### 📦 移動するファイル

| 元ファイル | 移動先 | 理由 |
|-----------|--------|------|
| FIX-ENGINE-README.md | docs/advanced/fix-engine.md | 高度な機能として整理 |
| ONTOLOGY-GUIDE.md | docs/advanced/ontology.md | 高度な機能として整理 |
| AI-CHAT-INTEGRATION.md | docs/advanced/ai-chat.md | 高度な機能として整理 |
| manual-test-example.md | docs/advanced/manual-testing.md | 高度な機能として整理 |
| ARCHITECTURE.md | docs/architecture/overview.md | アーキテクチャドキュメントに整理 |
| REQUIREMENTS-PRINCIPLES.md | docs/architecture/design-principles.md | 設計原則として整理 |
| ARCHITECTURE-IMPROVEMENTS.md | docs/architecture/improvements.md | 改善提案として整理 |
| MIYABI-INTEGRATION.md | docs/development/miyabi-integration.md | 開発者向けドキュメント |
| HOW_TO_CREATE_ISSUE.md | docs/development/issue-workflow.md | Issue作成ワークフロー |
| ROADMAP.md | docs/reference/roadmap.md | リファレンスドキュメント |
| CLAUDE.md | docs/reference/claude-integration.md | Claude統合リファレンス |

### 🗑️ アーカイブ（削除候補）

| ファイル | 理由 |
|---------|------|
| IMPROVEMENTS.md | 古いバージョン、ARCHITECTURE-IMPROVEMENTS.mdに統合済み |
| IMPROVEMENTS-V2.md | 古いバージョン、ARCHITECTURE-IMPROVEMENTS.mdに統合済み |
| NEXT-STEPS.md | ROADMAPに統合可能 |
| ISSUE_DUPLICATION.md | 開発過程のメモ、不要 |
| COMPLETION-SUMMARY.md | Changelogに統合 |
| PRINCIPLES-COMPLIANCE-ANALYSIS.md | 分析結果、アーカイブ |

---

## 新しいREADME.md構造

```markdown
# requirements-mcp-server

**要求管理MCPサーバー** - Claude Codeとの対話的な要求管理システム

[バッジ類]

## 📚 ドキュメント

### 🚀 はじめに
- [インストール](docs/getting-started/installation.md)
- [クイックスタート](docs/getting-started/quick-start.md)
- [チュートリアル](docs/getting-started/tutorial.md)

### 📖 ユーザーガイド
- [MCPツールリファレンス](docs/user-guide/mcp-tools.md) - 21個のツール完全ガイド
- [Webビューアー](docs/user-guide/web-viewer.md)
- [バリデーション機能](docs/user-guide/validation.md)
- [プロジェクト管理](docs/user-guide/project-management.md)

### 🔧 高度な機能
- [Fix Engine](docs/advanced/fix-engine.md)
- [オントロジーカスタマイズ](docs/advanced/ontology.md)
- [AIチャット統合](docs/advanced/ai-chat.md)
- [手動テスト](docs/advanced/manual-testing.md)

### 👨‍💻 開発者向け
- [Miyabi統合](docs/development/miyabi-integration.md)
- [ツール管理](docs/development/tool-management.md)
- [Issue作成ワークフロー](docs/development/issue-workflow.md)

### 📋 リファレンス
- [アーキテクチャ](docs/architecture/overview.md)
- [ロードマップ](docs/reference/roadmap.md)
- [Claude Code統合](docs/reference/claude-integration.md)

## クイックスタート

[簡潔な使い方 - 3-5ステップ]

## 主な機能

[主要機能のハイライト]

## ライセンス

MIT
```

---

## 実装手順

### Phase 1: ディレクトリ構造作成
```bash
mkdir -p docs/{getting-started,user-guide,advanced,architecture,development,reference}
mkdir -p archive
```

### Phase 2: ファイル移動
```bash
# スクリプトで一括実行
npm run docs:restructure
```

### Phase 3: README.md更新
- 新しいハブ型README作成
- ドキュメントマップ追加
- クイックスタートを簡潔に

### Phase 4: 重複コンテンツ統合
- SETUP.md → installation.md
- HOW-TO-USE.md → quick-start.md
- USE-CASES.md → tutorial.md

### Phase 5: 古いファイルをアーカイブ
```bash
mv IMPROVEMENTS*.md archive/
mv NEXT-STEPS.md archive/
mv ISSUE_DUPLICATION.md archive/
```

---

## 期待される効果

### ✅ ユーザビリティ向上
- README一箇所から全てにアクセス可能
- 目的別に整理されたドキュメント
- 初心者にも分かりやすい導線

### ✅ メンテナンス性向上
- 重複コンテンツの削減
- ドキュメント間の関係が明確
- 更新箇所が特定しやすい

### ✅ 見通しの良さ
- カテゴリ別に整理
- 階層構造で理解しやすい
- 検索性が向上

---

## 次のステップ

1. このプランをレビュー
2. Phase 1から順次実行
3. 古いファイルへのリンクを更新
4. GitHub Pagesでドキュメントサイト公開（オプション）
