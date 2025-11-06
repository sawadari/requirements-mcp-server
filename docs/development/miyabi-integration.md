# Miyabi v0.15 統合ガイド

requirements-mcp-serverとMiyabi v0.15の統合機能についての完全ガイドです。

## 📚 目次

- [新機能概要](#新機能概要)
- [セットアップ](#セットアップ)
- [Phase 1: 環境設定の改善](#phase-1-環境設定の改善)
- [Phase 2: Dashboard連携](#phase-2-dashboard連携)
- [Phase 3: 自動化ワークフロー](#phase-3-自動化ワークフロー)
- [MCPツール](#mcpツール)
- [スラッシュコマンド](#スラッシュコマンド)
- [CI/CD統合](#cicd統合)
- [トラブルシューティング](#トラブルシューティング)

---

## 新機能概要

### Miyabi v0.15の新機能

1. **`miyabi doctor`** - システムヘルスチェック
   - Node.js、Git、GitHub CLIの確認
   - 環境変数の検証
   - ネットワーク接続テスト
   - 自動修復オプション

2. **`miyabi onboard`** - 初回セットアップウィザード
   - デモプロジェクト作成
   - 機能紹介ツアー
   - 対話的セットアップ

3. **`miyabi dashboard`** - ダッシュボード管理
   - リアルタイム可視化
   - カスタムウィジェット
   - メトリクス監視

4. **mizusumashi Agent** - Super App Designer
   - アプリYAML自動生成
   - 自己修復関数
   - 要求定義からの設計生成

### requirements-mcp-serverの統合強化

#### Phase 1: 環境設定の改善 ✅ 完了

- ✅ `.env.example` - 環境変数テンプレート
- ✅ `SETUP.md` - 詳細なセットアップガイド
- ✅ `/miyabi-doctor` - スラッシュコマンド
- ✅ GitHub Actions - CI/CDヘルスチェック

#### Phase 2: Dashboard連携 🚧 進行中

- ✅ `dashboard-integration.ts` - Dashboard統合モジュール
- 🚧 Storage統合 - 要求変更時の自動更新
- 🚧 MCPツール拡張 - dashboard操作API

#### Phase 3: 自動化ワークフロー 📋 計画中

- 📋 要求変更 → Issue自動作成
- 📋 影響範囲分析 → Agent自動実行
- 📋 Fix Engine → PR自動作成

---

## セットアップ

### 前提条件

```bash
# Node.js 18+
node --version

# Git
git --version

# GitHub CLI
gh --version

# Miyabi v0.15+
npx miyabi --version
```

### 環境変数の設定

1. `.env`ファイルを作成:

```bash
cp .env.example .env
```

2. 必要な値を設定:

```env
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx
MIYABI_AUTO_ISSUE_CREATE=true
MIYABI_AUTO_PR_CREATE=true
```

3. 環境変数を読み込み:

**Bash/Zsh:**
```bash
export $(cat .env | xargs)
```

**PowerShell:**
```powershell
Get-Content .env | ForEach-Object {
  if ($_ -match '^([^=]+)=(.*)$') {
    [Environment]::SetEnvironmentVariable($matches[1], $matches[2])
  }
}
```

### ヘルスチェックの実行

```bash
npx miyabi doctor
```

すべてのチェックが✅であることを確認してください。

---

## Phase 1: 環境設定の改善

### 1. システムヘルスチェック

#### コマンドライン

```bash
# 基本チェック
npx miyabi doctor

# JSON出力（CI/CD用）
npx miyabi doctor --json

# 自動修復を試行
npx miyabi doctor --fix
```

#### Claude Code

```
Miyabiのシステムヘルスチェックを実行してください
```

または `/miyabi-doctor` スラッシュコマンドを使用。

#### 出力例

```json
{
  "checks": [
    {
      "name": "Node.js",
      "status": "pass",
      "message": "v22.20.0 (OK)"
    },
    {
      "name": "GITHUB_TOKEN",
      "status": "fail",
      "message": "Not set",
      "suggestion": "Set GITHUB_TOKEN environment variable"
    }
  ],
  "summary": {
    "passed": 6,
    "failed": 1,
    "total": 7
  },
  "overallStatus": "critical"
}
```

### 2. CI/CD統合

GitHub Actionsワークフロー `.github/workflows/miyabi-health-check.yml` が自動的に:

- ✅ プッシュ/PRごとにヘルスチェック実行
- ✅ 毎日定期実行（午前9時 UTC）
- ✅ 失敗時に自動でIssue作成
- ✅ PRにコメントで結果表示

**手動実行:**

GitHub Actions → "Miyabi Health Check" → "Run workflow"

---

## Phase 2: Dashboard連携

### Dashboard統合モジュール

`src/dashboard-integration.ts` - 要求データをダッシュボード用に変換・可視化

#### 主な機能

1. **メトリクス生成**
   - 要求総数、ステータス別集計
   - 優先度分布、完了率
   - 依存関係の健全性

2. **ウィジェット生成**
   - 統計カード
   - グラフ（円グラフ、棒グラフ）
   - 最近更新リスト

3. **自動更新**
   - 要求変更時に自動再生成
   - 差分更新対応（最適化）

#### 使用例

```typescript
import { createDashboardIntegration } from './dashboard-integration.js';

const dashboard = createDashboardIntegration();

// 全要求からダッシュボード生成
await dashboard.generateAndSaveDashboard(requirements);

// 差分更新
await dashboard.updateDashboardIncremental(changedRequirements, allRequirements);
```

#### 出力ファイル

```
dashboard/
├── metrics.json      # メトリクスデータ
├── widgets.json      # ウィジェット定義
└── last-updated.json # 最終更新タイムスタンプ
```

### Webビューアーとの統合

Webビューアー（http://localhost:5002）にダッシュボードタブを追加予定:

- 📊 リアルタイムメトリクス表示
- 📈 インタラクティブグラフ
- 🔄 自動更新（5秒間隔）

---

## Phase 3: 自動化ワークフロー

### 1. 要求変更 → Issue自動作成

**仕組み:**

```
add_requirement() → ValidationService → Issue作成
  ↓
  新しい要求が追加される
  ↓
  影響範囲を自動分析
  ↓
  関連タスクをGitHub Issueとして作成
```

**設定:**

```env
MIYABI_AUTO_ISSUE_CREATE=true
```

**GitHub Issue例:**

```markdown
# 要求 REQ-1234567890 の実装

## 概要
タイトル: ユーザー認証機能
優先度: high
カテゴリ: セキュリティ

## 依存関係
- REQ-XXX: データベース設計
- REQ-YYY: APIエンドポイント

## タスク
- [ ] 要件定義レビュー
- [ ] 設計ドキュメント作成
- [ ] 実装
- [ ] テスト
- [ ] デプロイ

自動生成 by requirements-mcp-server
```

### 2. 影響範囲分析 → Agent自動実行

**仕組み:**

```
analyze_impact() → DAG分解 → Agent並列実行
  ↓
  影響を受ける要求を特定
  ↓
  CoordinatorAgentがタスク分解
  ↓
  CodeGenAgent、ReviewAgent、PRAgentを並列実行
```

**使用例:**

```typescript
// 影響範囲分析
const impact = await analyzer.analyzeImpact('REQ-123');

// Agent自動実行
if (impact.affectedRequirements.length > 5) {
  await runMiyabiAgent({
    requirements: impact.affectedRequirements,
    concurrency: 2,
  });
}
```

### 3. Fix Engine → PR自動作成

**仕組み:**

```
apply_fixes() → ChangeSet適用 → Branch作成 → PR作成
  ↓
  修正を適用
  ↓
  Git branchを作成
  ↓
  変更をコミット
  ↓
  Draft PRを自動作成
```

**設定:**

```env
MIYABI_AUTO_PR_CREATE=true
```

**PR例:**

```markdown
# Fix: REQ-123の品質改善

## 変更内容
- 抽象度の調整
- MECE原則違反の修正
- 依存関係の再配線

## ChangeSet
- CS-001: splitRequirement (REQ-123 → REQ-123-1, REQ-123-2)
- CS-002: updateField (REQ-124, abstraction → 0.7)

## 影響範囲
- 影響を受ける要求: 3件
- 修正された違反: 5件

🤖 自動生成 by Fix Engine + Miyabi PRAgent
```

---

## MCPツール

requirements-mcp-serverは以下のMCPツールを提供します:

### Miyabi統合ツール

| ツール名 | 説明 | パラメータ |
|---------|------|-----------|
| `miyabi__doctor` | システムヘルスチェック | `fix?: boolean` |
| `miyabi__onboard` | 初回セットアップ | `skipDemo?, skipTour?` |
| `miyabi__dashboard` | ダッシュボード管理 | `action: 'refresh'\|'status'\|'open'` |
| `miyabi__status` | プロジェクト状態確認 | `watch?: boolean` |
| `miyabi__agent_run` | Agent実行 | `issueNumber?, concurrency?` |
| `miyabi__auto` | Water Spider起動 | `maxIssues?, interval?` |

### 要求管理ツール

| ツール名 | 説明 |
|---------|------|
| `add_requirement` | 要求追加 |
| `update_requirement` | 要求更新 |
| `analyze_impact` | 影響範囲分析 |
| `propose_change` | 変更提案作成 |
| `apply_fixes` | 修正適用 |

---

## スラッシュコマンド

Claude Code内で使用可能なスラッシュコマンド:

### 新規追加（v0.15統合）

- `/miyabi-doctor` - システムヘルスチェック
- `/miyabi-status` - プロジェクト状態確認
- `/miyabi-agent` - Agent実行

### 既存コマンド

- `/test` - テスト実行
- `/verify` - システム動作確認
- `/generate-docs` - ドキュメント生成
- `/create-issue` - Issue対話的作成
- `/deploy` - デプロイ実行
- `/security-scan` - セキュリティスキャン

---

## CI/CD統合

### GitHub Actions

#### 1. Miyabi Health Check (`.github/workflows/miyabi-health-check.yml`)

- トリガー: push, PR, 毎日定期実行
- 実行内容: `miyabi doctor`を実行
- 失敗時: 自動でIssue作成

#### 2. Autonomous Agent (`.github/workflows/autonomous-agent.yml`)

- トリガー: Issue作成/更新
- 実行内容: 自動でAgentパイプラインを実行

### ステータスバッジ

README.mdに追加:

```markdown
![Miyabi Health](https://github.com/sawadari/requirements-mcp-server/workflows/Miyabi%20Health%20Check/badge.svg)
```

---

## トラブルシューティング

### GITHUB_TOKEN not found

**症状:**
```
Error: GITHUB_TOKEN not found in environment
```

**解決方法:**

1. `.env`ファイルに設定:
```env
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxx
```

2. 環境変数として設定:
```bash
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxxx
```

3. または `gh auth login` を実行

### miyabi doctor failed

**症状:**
```json
{
  "overall Status": "critical",
  "failed": 3
}
```

**解決方法:**

```bash
# 自動修復を試行
npx miyabi doctor --fix

# 詳細ログ
npx miyabi doctor --debug
```

### Dashboard not updating

**症状:** Dashboardのデータが古い

**解決方法:**

```bash
# 手動で再生成
npx tsx scripts/regenerate-dashboard.ts

# Webビューアーを再起動
npm run view-server
```

### Agent execution failed

**症状:**
```
Error: Agent execution failed
```

**解決方法:**

1. GitHub CLIの認証確認:
```bash
gh auth status
```

2. ログを確認:
```bash
npx miyabi agent status --verbose
```

3. Issue番号を指定して再実行:
```bash
npx miyabi agent run --issue 123
```

---

## 参考リンク

- [README.md](./README.md) - プロジェクト概要
- [SETUP.md](./SETUP.md) - セットアップガイド
- [CLAUDE.md](./CLAUDE.md) - Miyabiフレームワーク詳細
- [FIX-ENGINE-README.md](./FIX-ENGINE-README.md) - Fix Engine
- [ONTOLOGY-GUIDE.md](./ONTOLOGY-GUIDE.md) - オントロジーカスタマイズ

---

## サポート

質問や問題がある場合:

1. [GitHub Issues](https://github.com/sawadari/requirements-mcp-server/issues)で報告
2. `/miyabi-doctor`を実行して診断情報を添付
3. ログファイルを確認: `logs/miyabi-*.log`

---

**🌸 Miyabi** - Beauty in Autonomous Development

*この統合により、requirements-mcp-serverは真の自律型開発環境となります。*
