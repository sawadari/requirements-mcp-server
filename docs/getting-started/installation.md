# Requirements MCP Server - セットアップガイド

## 前提条件

- Node.js >= 18
- Git
- GitHub CLI (gh)
- Claude Code または MCP対応クライアント

## 1. リポジトリのクローンとインストール

```bash
git clone https://github.com/sawadari/requirements-mcp-server.git
cd requirements-mcp-server
npm install
```

## 2. 環境変数の設定

### 2.1 環境変数ファイルの作成

```bash
cp .env.example .env
```

### 2.2 GitHub Token の取得

1. https://github.com/settings/tokens にアクセス
2. "Generate new token (classic)" をクリック
3. 必要なスコープを選択:
   - `repo` (フルコントロール)
   - `read:org` (組織の読み取り)
   - `workflow` (GitHub Actions)
4. トークンをコピーして `.env` の `GITHUB_TOKEN` に設定

```bash
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

### 2.3 Anthropic API Key の取得（オプション）

AI機能を使用する場合:

1. https://console.anthropic.com/ にアクセス
2. API Keyを作成
3. `.env` の `ANTHROPIC_API_KEY` に設定

```bash
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx
```

### 2.4 環境変数の読み込み

**Bash/Zsh:**
```bash
export $(cat .env | xargs)
```

**PowerShell (Windows):**
```powershell
Get-Content .env | ForEach-Object {
  if ($_ -match '^([^=]+)=(.*)$') {
    [Environment]::SetEnvironmentVariable($matches[1], $matches[2])
  }
}
```

**永続的に設定する場合 (Bash):**
```bash
echo 'export GITHUB_TOKEN=ghp_xxx' >> ~/.bashrc
echo 'export ANTHROPIC_API_KEY=sk-ant-xxx' >> ~/.bashrc
source ~/.bashrc
```

**永続的に設定する場合 (Windows):**
```powershell
[Environment]::SetEnvironmentVariable("GITHUB_TOKEN", "ghp_xxx", "User")
[Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", "sk-ant-xxx", "User")
```

## 3. ビルド

```bash
npm run build
```

## 4. Miyabi統合のセットアップ

### 4.1 システムヘルスチェック

```bash
npx miyabi doctor
```

すべての項目が✅であることを確認してください。

### 4.2 Miyabiのインストール（既存プロジェクトに追加）

```bash
npx miyabi install
```

### 4.3 GitHub認証

GitHub CLIで認証していない場合:

```bash
gh auth login
```

または、既にトークンがある場合:

```bash
gh auth login --with-token < token.txt
```

## 5. Claude Codeとの統合

### 5.1 MCP設定ファイルの編集

**Claude Code用:** `~/.claude/mcp.json` または `~/.config/claude-code/mcp.json`

```json
{
  "mcpServers": {
    "requirements": {
      "command": "node",
      "args": ["C:/dev/requirements-mcp-server/build/index.js"],
      "env": {
        "GITHUB_TOKEN": "ghp_xxx",
        "ANTHROPIC_API_KEY": "sk-ant-xxx"
      }
    },
    "miyabi-integration": {
      "command": "node",
      "args": ["C:/dev/requirements-mcp-server/.claude/mcp-servers/miyabi-integration.js"],
      "env": {
        "GITHUB_TOKEN": "ghp_xxx"
      }
    }
  }
}
```

**開発モードの場合:**
```json
{
  "mcpServers": {
    "requirements": {
      "command": "npx",
      "args": ["-y", "tsx", "C:/dev/requirements-mcp-server/src/index.ts"],
      "env": {
        "GITHUB_TOKEN": "ghp_xxx",
        "ANTHROPIC_API_KEY": "sk-ant-xxx"
      }
    }
  }
}
```

### 5.2 Claude Codeの再起動

MCPサーバーの変更を反映するため、Claude Codeを再起動してください。

## 6. 動作確認

### 6.1 MCPサーバーの起動確認

```bash
npm run dev
```

別のターミナルで:
```bash
# 要求の追加テスト
npx tsx scripts/test-auto-validation.ts
```

### 6.2 Webビューアーの起動

```bash
npm run view-server
```

ブラウザで http://localhost:5002 にアクセス

### 6.3 Miyabi統合の確認

```bash
npx miyabi status
```

## 7. トラブルシューティング

### GITHUB_TOKEN not found

**症状:** `miyabi status` や `miyabi agent run` で "GITHUB_TOKEN not found" エラー

**解決方法:**
1. `.env` ファイルが存在し、正しく設定されているか確認
2. 環境変数が読み込まれているか確認: `echo $GITHUB_TOKEN` (Bash) / `$env:GITHUB_TOKEN` (PowerShell)
3. Claude CodeのMCP設定で `env` フィールドにトークンを直接指定

### MCPサーバーが起動しない

**症状:** Claude Codeで "MCP server failed to start"

**解決方法:**
1. ビルドが完了しているか確認: `npm run build`
2. パスが正しいか確認（絶対パスを使用）
3. Node.jsのバージョン確認: `node --version` (>= 18)
4. Claude Codeのログを確認

### 型エラーが出る

```bash
npm run typecheck
```

でエラーを確認し、修正してください。

### テストが失敗する

```bash
npm test
```

特定のテストのみ実行:
```bash
npm test -- storage.test.ts
```

## 8. 次のステップ

- [README.md](./README.md) - 機能の詳細
- [ONTOLOGY-GUIDE.md](./ONTOLOGY-GUIDE.md) - オントロジーのカスタマイズ
- [FIX-ENGINE-README.md](./FIX-ENGINE-README.md) - Fix Engineの使い方
- [CLAUDE.md](./CLAUDE.md) - Miyabiフレームワーク統合
- [MIYABI-INTEGRATION.md](./MIYABI-INTEGRATION.md) - Miyabi v0.15統合ガイド

## サポート

問題が解決しない場合は、GitHubのIssueで報告してください:
https://github.com/sawadari/requirements-mcp-server/issues
