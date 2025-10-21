# GitHub Pages Setup Guide

このディレクトリには、requirements-mcp-serverのGitHub Pages用のランディングページが含まれています。

## セットアップ方法

### 1. GitHubリポジトリの設定

1. GitHubリポジトリページにアクセス
2. **Settings** → **Pages** を開く
3. **Source** を以下のように設定：
   - **Source**: Deploy from a branch
   - **Branch**: `main`
   - **Folder**: `/docs`
4. **Save** をクリック

### 2. 自動デプロイの有効化

`.github/workflows/pages.yml`ファイルが自動的にGitHub Actionsを設定します。

- `main`ブランチへのプッシュで自動デプロイ
- 手動実行も可能（Actions タブから）

### 3. カスタマイズ

#### サイトタイトルと説明の変更

`_config.yml`を編集：

```yaml
title: 要求管理MCPサーバー
description: あなたの説明をここに
```

#### リポジトリURLの変更

`_config.yml`と`index.md`内の以下を変更：

```yaml
github:
  repository_url: https://github.com/yourusername/requirements-mcp-server
```

#### スタイルのカスタマイズ

`assets/css/style.scss`を編集してカスタムCSSを追加できます。

### 4. ローカルでのプレビュー

Jekyll をインストールしてローカルでプレビュー：

```bash
# Jekyll のインストール（初回のみ）
gem install bundler jekyll

# docs ディレクトリに移動
cd docs

# Gemfile を作成（初回のみ）
cat > Gemfile << 'EOF'
source "https://rubygems.org"
gem "github-pages", group: :jekyll_plugins
gem "jekyll-seo-tag"
EOF

# 依存関係をインストール
bundle install

# ローカルサーバーを起動
bundle exec jekyll serve

# ブラウザで http://localhost:4000 を開く
```

## ファイル構成

```
docs/
├── index.md              # メインのランディングページ
├── _config.yml          # Jekyll 設定ファイル
├── README.md            # このファイル
└── assets/
    └── css/
        └── style.scss   # カスタムCSS
```

## トラブルシューティング

### ページが表示されない

1. GitHub Pages の設定を確認
2. Actions タブでビルドが成功しているか確認
3. `_config.yml`の設定を確認

### スタイルが適用されない

1. `assets/css/style.scss`の先頭に以下があることを確認：
   ```yaml
   ---
   ---
   ```
2. ブラウザのキャッシュをクリア

### リンクが切れている

- 相対パスを確認（`../README.md`など）
- GitHubリポジトリのURLを確認

## 参考リンク

- [GitHub Pages ドキュメント](https://docs.github.com/ja/pages)
- [Jekyll ドキュメント](https://jekyllrb.com/docs/)
- [Cayman テーマ](https://github.com/pages-themes/cayman)
