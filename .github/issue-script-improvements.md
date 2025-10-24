# スクリプト管理の改善提案

## 現状の問題

現在、新しいプロジェクトや要求を追加するたびに個別のスクリプトを作成しているが、以下の問題がある：

1. **コードの重複**: 各プロジェクト用に似たようなスクリプトを作成している
   - `add-water-heater-requirements.cjs`
   - `create-smart-scale-project.cjs`
   - など

2. **メンテナンス性の低下**: スクリプトが増えるたびに管理が煩雑になる

3. **本来の設計意図との乖離**: MCPツールやJSON直接編集の方が効率的

## 提案される改善策

### 1. 汎用的なインポートスクリプトの作成

プロジェクト固有のスクリプトではなく、データファイルから読み込む汎用スクリプトを作成：

```javascript
// scripts/import-requirements.cjs
// 使い方: node scripts/import-requirements.cjs data/templates/my-project.json
```

**利点:**
- スクリプトは1つだけ
- データとロジックの分離
- YAMLやCSVからのインポートにも対応可能

### 2. テンプレート機構の導入

```
data/templates/
  ├── project-template.json
  ├── stakeholder-req-template.json
  ├── system-req-template.json
  └── functional-req-template.json
```

**利点:**
- 新規プロジェクトはテンプレートからコピー
- 標準的な要求構造を維持
- VSCodeでの直接編集が容易

### 3. CLIツールの作成

```bash
npm run req -- create-project --name "My Project" --id "my-project"
npm run req -- add-requirement --file requirements.yaml
npm run req -- validate --project "my-project"
```

**利点:**
- 統一されたインターフェース
- スクリプトの乱立を防ぐ
- ヘルプ機能で使い方を提示

### 4. データファイル直接編集の推奨

**最もシンプルなアプローチ:**
```bash
# 1. 既存プロジェクトをコピー
cp data/smart-scale.json data/new-project.json

# 2. VSCodeで編集（JSON検証が自動で動く）

# 3. ブラウザでリフレッシュして確認
```

**利点:**
- スクリプト不要
- 即座に編集・確認できる
- JSONスキーマ検証が効く

## 実装優先度

### Phase 1: 即座に実施可能
- [ ] READMEに「データファイル直接編集」の推奨方法を記載
- [ ] 既存の個別スクリプトを `scripts/examples/` に移動
- [ ] `.gitignore` に `scripts/examples/` を追加（参考用として残すが追跡しない）

### Phase 2: 汎用ツールの作成
- [ ] `scripts/import-requirements.cjs` の実装
  - JSON, YAML, CSV形式のサポート
  - バリデーション機能
  - ドライラン機能（`--dry-run`）

### Phase 3: テンプレート機構
- [ ] `data/templates/` ディレクトリの作成
- [ ] 標準テンプレートの作成
- [ ] テンプレートからのプロジェクト生成機能

### Phase 4: CLIツール
- [ ] `npm run req` コマンドの実装
- [ ] サブコマンド対応（create, add, validate, export）
- [ ] インタラクティブモード

## 関連Issue

- #XX: プロジェクト管理機能の強化
- #XX: バリデーション機能の改善

## 期待される効果

1. **開発効率の向上**: スクリプトを書く時間が不要に
2. **コードベースの簡潔化**: 重複コードの削減
3. **学習コストの低下**: 統一されたインターフェース
4. **保守性の向上**: メンテナンスすべきコードが減る

## 実装上の注意点

- 既存のスクリプトは削除せず `scripts/examples/` に移動（後方互換性）
- MCPツールとの整合性を保つ
- JSONスキーマ検証を強化
- エラーメッセージをわかりやすく

## 参考資料

- [既存のスクリプト一覧](../scripts/)
- [データ形式仕様](../docs/DATA-FORMAT.md)
- [MCP Tool Registry](../config/tool-registry.json)
