---
description: Miyabiシステムヘルスチェック
---

# Miyabi Doctor - システム診断

プロジェクトのMiyabi統合状態と環境の健全性をチェックします。

## 実行内容

1. **Node.js** - バージョンと互換性確認
2. **Git** - インストールとアクセシビリティ
3. **GitHub CLI** - インストールと認証状態
4. **GITHUB_TOKEN** - 環境変数の設定確認
5. **Network** - GitHub APIへの接続性
6. **Repository** - Gitリポジトリの検出とリモート確認
7. **Claude Code** - 実行環境の検出

## 使い方

Claude Code内で以下のように依頼してください:

```
Miyabiのシステムヘルスチェックを実行してください
```

または

```
miyabi doctorを実行して、問題がないか確認してください
```

## MCPツール

このコマンドは以下のMCPツールを使用します:

- `miyabi__doctor` - システムヘルスチェックの実行

## 出力例

```json
{
  "checks": [
    {
      "name": "Node.js",
      "status": "pass",
      "message": "v22.20.0 (OK)",
      "details": "Node.js v22.20.0 meets minimum requirement (≥18)"
    },
    {
      "name": "GITHUB_TOKEN",
      "status": "fail",
      "message": "Not set",
      "suggestion": "Set GITHUB_TOKEN environment variable or run 'gh auth login'"
    }
  ],
  "summary": {
    "passed": 6,
    "warned": 0,
    "failed": 1,
    "total": 7
  },
  "overallStatus": "critical"
}
```

## ステータスの意味

- **pass** ✅ - 問題なし
- **warn** ⚠️ - 警告（動作するが改善推奨）
- **fail** ❌ - エラー（機能が制限される）

## トラブルシューティング

### GITHUB_TOKEN が fail

**解決方法:**
1. `.env`ファイルに `GITHUB_TOKEN=ghp_xxx` を追加
2. 環境変数として設定: `export GITHUB_TOKEN=ghp_xxx`
3. または `gh auth login` を実行

### GitHub CLI が fail

**解決方法:**
```bash
# Windows (winget)
winget install GitHub.cli

# Mac (Homebrew)
brew install gh

# Linux (apt)
sudo apt install gh
```

### Node.js バージョンが古い

**解決方法:**
- Node.js 18以上にアップグレードしてください
- https://nodejs.org/

## 自動修復

一部の問題は自動修復可能です:

```
miyabi doctor --fix
```

これにより、以下が試行されます:
- GitHub CLIの自動認証
- 環境変数の設定提案
- 不足パッケージのインストール提案

## CI/CDでの使用

GitHub Actionsで自動チェック:

```yaml
- name: Miyabi Health Check
  run: npx miyabi doctor --json
```

失敗時にビルドを停止:

```yaml
- name: Miyabi Health Check
  run: |
    RESULT=$(npx miyabi doctor --json)
    STATUS=$(echo $RESULT | jq -r '.overallStatus')
    if [ "$STATUS" = "critical" ]; then
      echo "Critical issues found"
      exit 1
    fi
```

---

💡 **ヒント**: 定期的に `miyabi doctor` を実行して、環境の健全性を保ちましょう。
