# GitHubにIssueを登録する手順

## 方法1: Web UIから登録（推奨）

### ステップ1: GitHubリポジトリにアクセス

https://github.com/sawadari/requirements-mcp-server/issues

### ステップ2: 新規Issueを作成

1. 右上の **「New issue」** ボタンをクリック

### ステップ3: Issueの内容を入力

#### タイトル:
```
要求ツリー内の要求項目が重複表示される
```

#### 本文:
`ISSUE_DUPLICATION.md` の内容をすべてコピー＆ペーストしてください。

**ファイルの場所**: `C:\dev\requirements-mcp-server\ISSUE_DUPLICATION.md`

または、以下のリンクから直接内容を確認できます:
https://github.com/sawadari/requirements-mcp-server/blob/main/ISSUE_DUPLICATION.md

### ステップ4: ラベルを設定

右側の「Labels」セクションで以下を選択:
- `bug`
- `priority-high` （なければ `enhancement` などで代用）
- `backend`

ラベルが存在しない場合は、後から追加してください。

### ステップ5: Issueを作成

画面下部の **「Submit new issue」** ボタンをクリック

---

## 方法2: GitHub CLIをインストールして登録

### GitHub CLIのインストール

**Windows (Winget)**:
```bash
winget install --id GitHub.cli
```

**Windows (Scoop)**:
```bash
scoop install gh
```

**Windows (Chocolatey)**:
```bash
choco install gh
```

### 認証

```bash
gh auth login
```

画面の指示に従って、GitHubアカウントでログインしてください。

### Issueを作成

```bash
cd C:\dev\requirements-mcp-server
gh issue create --title "要求ツリー内の要求項目が重複表示される" --body-file ISSUE_DUPLICATION.md --label "bug,priority-high,backend"
```

---

## 確認

Issueが作成されたら、以下のURLで確認できます:

https://github.com/sawadari/requirements-mcp-server/issues

---

## トラブルシューティング

### Q: ラベルが存在しないと言われる

A: ラベルなしでIssueを作成し、後からWeb UIでラベルを追加してください:

```bash
gh issue create --title "要求ツリー内の要求項目が重複表示される" --body-file ISSUE_DUPLICATION.md
```

### Q: GitHub CLIがコマンドとして認識されない

A: インストール後、ターミナルを再起動してください。それでも認識されない場合は、方法1（Web UI）を使用してください。

---

## Issue番号の確認

Issueが作成されると、Issue番号（例: #1, #2）が割り当てられます。この番号は、今後のコミットメッセージやPRで参照できます。

例:
```bash
git commit -m "fix: 要求ツリーの重複表示を修正 (close #1)"
```
