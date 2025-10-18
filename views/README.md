# 要求管理ビュー一覧

生成日時: 2025/10/17 22:50:38

## 利用可能なビュー

### ステークホルダ要求リスト

ステークホルダ要求の一覧

- **タイプ**: list
- **形式**: markdown
- **ファイル**: [stakeholder-requirements.md](markdown/stakeholder-requirements.md)

### システム要求リスト

システム要求の一覧

- **タイプ**: list
- **形式**: markdown
- **ファイル**: [system-requirements.md](markdown/system-requirements.md)

### システム機能要求リスト

システム機能要求の一覧

- **タイプ**: list
- **形式**: markdown
- **ファイル**: [functional-requirements.md](markdown/functional-requirements.md)

### 全要求一覧

すべての要求の一覧

- **タイプ**: list
- **形式**: markdown
- **ファイル**: [all-requirements.md](markdown/all-requirements.md)

### ステークホルダ要求-システム要求マトリックス

ステークホルダ要求とシステム要求のトレーサビリティマトリックス

- **タイプ**: matrix
- **形式**: markdown
- **ファイル**: [stakeholder-system-matrix.md](markdown/stakeholder-system-matrix.md)

### システム要求-機能要求マトリックス

システム要求とシステム機能要求のトレーサビリティマトリックス

- **タイプ**: matrix
- **形式**: markdown
- **ファイル**: [system-functional-matrix.md](markdown/system-functional-matrix.md)

### 重要度Critical要求

優先度がCriticalの要求一覧

- **タイプ**: list
- **形式**: markdown
- **ファイル**: [critical-requirements.md](markdown/critical-requirements.md)

### 実装中要求

ステータスがin_progressの要求一覧

- **タイプ**: list
- **形式**: markdown
- **ファイル**: [in-progress-requirements.md](markdown/in-progress-requirements.md)


## ビューの種類

### リストビュー
要求を表形式で一覧表示します。

### マトリックスビュー
要求間の依存関係をマトリックス形式で表示します（トレーサビリティマトリックス）。

## ファイル形式

- **Markdown (.md)**: VSCodeのプレビュー機能で表示できます
- **HTML (.html)**: ブラウザで表示できます
- **CSV (.csv)**: Excel等の表計算ソフトで開けます

## VSCodeでの表示方法

### Markdownファイル
1. VSCodeでファイルを開く
2. 右上のプレビューアイコンをクリック、または `Ctrl+Shift+V` (Windows/Linux) / `Cmd+Shift+V` (Mac)

### HTMLファイル
1. VSCodeでファイルを開く
2. 右クリック → "Open with Live Server" (Live Server拡張機能が必要)

または、ファイルをブラウザで直接開く

### CSVファイル
1. VSCodeの拡張機能 "Excel Viewer" または "Rainbow CSV" をインストール
2. CSVファイルを開くと自動的に表形式で表示されます
