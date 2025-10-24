# requirements-mcp-server - Claude Code Context

## プロジェクト概要

**requirements-mcp-server** - Miyabiフレームワークで構築された自律型開発プロジェクト

このプロジェクトは識学理論(Shikigaku Theory)とAI Agentsを組み合わせた自律型開発環境で運用されています。

## 🌸 Miyabi Framework

### 7つの自律エージェント

1. **CoordinatorAgent** - タスク統括・並列実行制御
   - DAG（Directed Acyclic Graph）ベースのタスク分解
   - Critical Path特定と並列実行最適化

2. **IssueAgent** - Issue分析・ラベル管理
   - 識学理論65ラベル体系による自動分類
   - タスク複雑度推定（小/中/大/特大）

3. **CodeGenAgent** - AI駆動コード生成
   - Claude Sonnet 4による高品質コード生成
   - TypeScript strict mode完全対応

4. **ReviewAgent** - コード品質判定
   - 静的解析・セキュリティスキャン
   - 品質スコアリング（100点満点、80点以上で合格）

5. **PRAgent** - Pull Request自動作成
   - Conventional Commits準拠
   - Draft PR自動生成

6. **DeploymentAgent** - CI/CDデプロイ自動化
   - 自動デプロイ・ヘルスチェック
   - 自動Rollback機能

7. **TestAgent** - テスト自動実行
   - テスト実行・カバレッジレポート
   - 80%+カバレッジ目標

## GitHub OS Integration

このプロジェクトは「GitHubをOSとして扱う」設計思想で構築されています:

### 自動化されたワークフロー

1. **Issue作成** → IssueAgentが自動ラベル分類
2. **CoordinatorAgent** → タスクをDAG分解、並列実行プラン作成
3. **CodeGenAgent** → コード実装、テスト生成
4. **ReviewAgent** → 品質チェック（80点以上で次へ）
5. **TestAgent** → テスト実行（カバレッジ確認）
6. **PRAgent** → Draft PR作成
7. **DeploymentAgent** → マージ後に自動デプロイ

**全工程が自律実行、人間の介入は最小限。**

## ラベル体系（識学理論準拠）

### 10カテゴリー、53ラベル

- **type:** bug, feature, refactor, docs, test, chore, security
- **priority:** P0-Critical, P1-High, P2-Medium, P3-Low
- **state:** pending, analyzing, implementing, reviewing, testing, deploying, done
- **agent:** codegen, review, deployment, test, coordinator, issue, pr
- **complexity:** small, medium, large, xlarge
- **phase:** planning, design, implementation, testing, deployment
- **impact:** breaking, major, minor, patch
- **category:** frontend, backend, infra, dx, security
- **effort:** 1h, 4h, 1d, 3d, 1w, 2w
- **blocked:** waiting-review, waiting-deployment, waiting-feedback

## 開発ガイドライン

### TypeScript設定

```json
{
  "compilerOptions": {
    "strict": true,
    "module": "ESNext",
    "target": "ES2022"
  }
}
```

### セキュリティ

- **機密情報は環境変数で管理**: `GITHUB_TOKEN`, `ANTHROPIC_API_KEY`
- **.env を .gitignore に含める**
- **Webhook検証**: HMAC-SHA256署名検証

### テスト

```bash
npm test                    # 全テスト実行
npm run test:watch          # Watch mode
npm run test:coverage       # カバレッジレポート
```

目標: 80%+ カバレッジ

## 使用方法

### Issue作成（Claude Code推奨）

```bash
# Claude Code から直接実行
gh issue create --title "機能追加: ユーザー認証" --body "JWT認証を実装"
```

または Claude Code のスラッシュコマンド:

```
/create-issue
```

### 状態確認

```bash
npx miyabi status          # 現在の状態
npx miyabi status --watch  # リアルタイム監視
```

### Agent実行

```bash
/agent-run                 # Claude Code から実行
```

## プロジェクト構造

```
requirements-mcp-server/
├── .claude/               # Claude Code設定
│   ├── agents/           # Agent定義
│   ├── commands/         # カスタムコマンド
│   └── settings.json     # Claude設定
├── .github/
│   └── workflows/        # 26+ GitHub Actions
├── src/                  # ソースコード
├── tests/                # テストコード
├── CLAUDE.md             # このファイル
└── package.json
```

## MCP Tool Registry（重要）

**新しい機能を追加する前に、必ず既存ツールとの重複をチェックしてください。**

### ツール重複チェック

```
/tool-check <実装したい機能の説明>
```

例: `/tool-check 要求のステータスを一括変更したい`

### ツール追加の手順（TDD）

**テスト駆動開発(TDD)により品質を保証します:**

1. **重複確認**: `/tool-check <機能説明>` で既存ツールとの重複をチェック
2. **レジストリ登録**: `npm run register-tool -- <tool-name> --category <cat>`
3. **テスト生成**: `npm run generate-tool-test -- <tool-name>`
4. **RED**: テストケースを編集 → `npm test` で失敗を確認
5. **GREEN**: `src/index.ts` に実装を追加 → `npm test` で成功を確認
6. **Refactor**: コードを改善 → `npm test` で再確認
7. **ドキュメント**: 使用例を `examples/<tool-name>.json` に追加
8. **検証**: `npm run validate-registry` で整合性チェック

詳細: `docs/TDD-TOOL-DEVELOPMENT.md` を参照

### 現在のツール一覧

**config/tool-registry.json** に16個のツールが登録されています:

- **CRUD Operations** (6): add_requirement, get_requirement, list_requirements, update_requirement, delete_requirement, search_requirements
- **Analysis & Insights** (2): analyze_impact, get_dependency_graph
- **Validation & Quality** (3): validate_requirement, validate_all_requirements, get_validation_report
- **Change Management** (5): propose_change, load_policy, preview_fixes, apply_fixes, rollback_fixes

詳細: `docs/MCP-TOOL-MANAGEMENT.md` を参照

## カスタムスラッシュコマンド

Claude Code で以下のコマンドが使用可能:

- `/tool-check` - MCP Tool重複チェック（新機能追加前に必須）
- `/test` - プロジェクト全体のテストを実行
- `/generate-docs` - コードからドキュメント自動生成
- `/create-issue` - Agent実行用Issueを対話的に作成
- `/deploy` - デプロイ実行
- `/verify` - システム動作確認（環境・コンパイル・テスト）
- `/security-scan` - セキュリティ脆弱性スキャン実行
- `/agent-run` - Autonomous Agent実行（Issue自動処理パイプライン）

## 識学理論（Shikigaku Theory）5原則

1. **責任の明確化** - 各AgentがIssueに対する責任を負う
2. **権限の委譲** - Agentは自律的に判断・実行可能
3. **階層の設計** - CoordinatorAgent → 各専門Agent
4. **結果の評価** - 品質スコア、カバレッジ、実行時間で評価
5. **曖昧性の排除** - DAGによる依存関係明示、状態ラベルで進捗可視化

## 環境変数

```bash
# GitHub Personal Access Token（必須）
GITHUB_TOKEN=ghp_xxxxx

# Anthropic API Key（必須 - Agent実行時）
ANTHROPIC_API_KEY=sk-ant-xxxxx
```

## サポート

- **Framework**: [Miyabi](https://github.com/ShunsukeHayashi/Autonomous-Operations)
- **Documentation**: README.md
- **Issues**: GitHub Issues で管理

---

🌸 **Miyabi** - Beauty in Autonomous Development

*このファイルは Claude Code が自動的に参照します。プロジェクトの変更に応じて更新してください。*
