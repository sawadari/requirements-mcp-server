# requirements-mcp-server

**要求管理MCPサーバー** - Claude Codeとの対話的な要求管理システム

📘 **[プロジェクトランディングページ](https://sawadari.github.io/requirements-mcp-server/)** - 効果実績、アーキテクチャ、はじめ方を詳しく解説

📘 **[人間中心AI時代の組織憲章](https://sawadari.github.io/principle/)** - 設計の前提条件

## 目次

- [概要](#概要)
- [主な機能](#主な機能)
- [インストール](#インストール)
- [使い方](#使い方)
- [Webビューアー](#webビューアー)
- [MCPツール](#mcpツール)
- [要求データ構造](#要求データ構造)
- [使用シナリオ例](#使用シナリオ例)
- [Miyabiフレームワークとの統合](#miyabiフレームワークとの統合)
- [ライセンス](#ライセンス)

## 概要

requirements-mcp-serverは、Model Context Protocol (MCP)を使用した要求管理システムです。Claude Codeと統合することで、対話しながら要求の追加・更新・削除、影響範囲の分析、変更提案の作成などを実行できます。

### 主な機能

- **要求管理**: 要求の追加、取得、更新、削除、検索
- **依存関係管理**: 要求間の依存関係を定義・追跡
- **影響範囲分析**: 要求の変更が他の要求に与える影響を自動分析
- **変更提案**: 変更内容と影響分析を含む提案を作成
- **依存関係グラフ**: 要求の依存関係を可視化
- **オントロジー**: カスタマイズ可能な要求段階定義（NEW!）
  - 外部JSON定義による柔軟なオントロジーカスタマイズ
  - プロジェクトやドメインに応じた段階（stakeholder/system/functionalなど）定義
  - MECE原則、粒度ルール、派生ルールの段階別設定
  - 詳細は [ONTOLOGY-GUIDE.md](./ONTOLOGY-GUIDE.md) を参照
- **Webビューアー**: インタラクティブなブラウザUIで要求を可視化
  - ツリービュー、検索・フィルター、マトリックスビュー
  - リサイズ可能なパネル、カスタムビュー設定
- **バリデーション**: 要求データの整合性チェック
  - 必須フィールド、依存関係、循環参照の検証
  - オントロジーベースの段階別バリデーション
- **自動検証・修正**: 要求変更時の自動品質チェックと修正
  - 要求追加・更新時に自動的に妥当性を評価
  - 設定可能な自動修正エンジン（Strict/Suggestモード）
  - 品質スコアリングと違反レポート
- **Fix Engine**: ポリシーベースの要求修正エンジン
  - ポリシー駆動の自動修正（分割、統合、リンク再配線など）
  - トランザクション境界と可逆性の保証
  - プレビュー、適用、ロールバック機能

## インストール

```bash
npm install
npm run build
```

## 使い方

### MCPサーバーとして起動

```bash
npm run dev
```

または

```bash
npm start
```

### Claude Codeとの統合

Claude Codeの設定ファイル（`claude_desktop_config.json`または`mcp-servers.json`）に以下を追加:

```json
{
  "mcpServers": {
    "requirements": {
      "command": "node",
      "args": ["/path/to/requirements-mcp-server/build/index.js"]
    }
  }
}
```

または、開発モードで使用する場合:

```json
{
  "mcpServers": {
    "requirements": {
      "command": "npx",
      "args": ["-y", "tsx", "/path/to/requirements-mcp-server/src/index.ts"]
    }
  }
}
```

## 利用可能なツール

### 1. add_requirement
新しい要求を追加します。

**パラメータ:**
- `title` (必須): 要求のタイトル
- `description` (必須): 要求の詳細説明
- `priority` (必須): 優先度 (`critical`, `high`, `medium`, `low`)
- `category` (必須): カテゴリ
- `tags` (オプション): タグの配列
- `dependencies` (オプション): 依存する要求のIDの配列
- `author` (オプション): 作成者
- `assignee` (オプション): 担当者

**使用例:**
```
新しい要求を追加してください。
タイトル: ユーザー認証機能
説明: JWTを使用したユーザー認証システムを実装する
優先度: high
カテゴリ: セキュリティ
```

### 2. get_requirement
指定されたIDの要求を取得します。

**パラメータ:**
- `id` (必須): 要求のID

### 3. list_requirements
すべての要求の一覧を取得します。

### 4. update_requirement
既存の要求を更新します。

**パラメータ:**
- `id` (必須): 更新する要求のID
- その他のフィールド (オプション): 更新したいフィールドのみ指定

**使用例:**
```
要求REQ-123のステータスをin_progressに更新してください。
```

### 5. delete_requirement
要求を削除します。

**パラメータ:**
- `id` (必須): 削除する要求のID

### 6. search_requirements
条件を指定して要求を検索します。

**パラメータ:**
- `status` (オプション): ステータスで絞り込み
- `priority` (オプション): 優先度で絞り込み
- `category` (オプション): カテゴリで絞り込み
- `tags` (オプション): タグで絞り込み
- `searchText` (オプション): テキスト検索

**使用例:**
```
優先度がhighで、ステータスがdraftの要求を検索してください。
```

### 7. analyze_impact
要求の変更がシステムに与える影響を分析します。

**パラメータ:**
- `id` (必須): 分析する要求のID
- `proposedChanges` (オプション): 提案する変更内容

**使用例:**
```
要求REQ-123の影響範囲を分析してください。
```

**返される情報:**
- 影響を受ける要求のリスト（直接・間接）
- 推定工数
- リスク
- 推奨事項

### 8. get_dependency_graph
要求の依存関係グラフを取得します。

**パラメータ:**
- `id` (必須): グラフを取得する要求のID

### 9. propose_change
要求に対する変更提案を作成します。

**パラメータ:**
- `targetRequirementId` (必須): 変更対象の要求ID
- `proposedChanges` (必須): 提案する変更内容の配列

**使用例:**
```
要求REQ-123の優先度をhighからcriticalに変更する提案を作成してください。
理由: セキュリティの脆弱性が発見されたため、緊急対応が必要
```

### 10. load_policy
Fix Engineのポリシーファイルを読み込みます。

**パラメータ:**
- `policyPath` (オプション): ポリシーファイルのパス（デフォルト: `./fix-policy.jsonc`）

**使用例:**
```
Fix Engineのポリシーを読み込んでください
```

**詳細:**
ポリシーファイルには、要求の自動修正ルール、実行モード（strict/suggest/assist）、停止条件などが定義されています。詳細は[Fix Engineドキュメント](./FIX-ENGINE-README.md)を参照してください。

### 11. preview_fixes
提案された修正のプレビューを表示します。

**パラメータ:**
- `changeSetId` (オプション): プレビューするChangeSetのID（省略時は最新）

**使用例:**
```
最新の修正提案をプレビューしてください
```

**詳細:**
ChangeSetの内容、影響を受ける要求、変更の詳細を確認できます。実際には適用されません。

### 12. apply_fixes
ChangeSetを適用して要求を修正します。

**パラメータ:**
- `changeSetId` (必須): 適用するChangeSetのID
- `force` (オプション): 警告を無視して強制適用するか（デフォルト: false）

**使用例:**
```
ChangeSet CS-001を適用してください
```

**詳細:**
トランザクション境界が保証され、失敗時は自動ロールバックされます。すべての変更が成功するか、すべてロールバックされるかのどちらかです。

### 13. rollback_fixes
適用済みのChangeSetをロールバックします。

**パラメータ:**
- `changeSetId` (必須): ロールバックするChangeSetのID

**使用例:**
```
ChangeSet CS-001をロールバックしてください
```

**詳細:**
可逆性が保証されているChangeSetのみロールバック可能です。要求が元の状態に戻ります。

## データモデル

### Requirement（要求）

```typescript
{
  id: string;              // 要求ID（例: REQ-1234567890）
  title: string;           // タイトル
  description: string;     // 詳細説明
  status: RequirementStatus;  // ステータス
  priority: RequirementPriority; // 優先度
  category: string;        // カテゴリ
  tags: string[];          // タグ
  dependencies: string[];  // 依存要求のID
  createdAt: Date;         // 作成日時
  updatedAt: Date;         // 更新日時
  author?: string;         // 作成者
  assignee?: string;       // 担当者
}
```

### ステータス

- `draft`: 下書き
- `proposed`: 提案済み
- `approved`: 承認済み
- `in_progress`: 実装中
- `completed`: 完了
- `rejected`: 却下
- `on_hold`: 保留

### 優先度

- `critical`: P0 - 致命的
- `high`: P1 - 高
- `medium`: P2 - 中
- `low`: P3 - 低

## 使用シナリオ例

### シナリオ1: 新しい機能要求の追加

```
User: 新しい要求を追加したいです。ユーザーがプロフィール画像をアップロードできる機能を追加したい。

Claude: 承知しました。プロフィール画像アップロード機能の要求を追加します。
[add_requirementツールを使用]

要求を追加しました:
- ID: REQ-1729180800000
- タイトル: プロフィール画像アップロード機能
- 優先度: medium
- ステータス: draft
```

### シナリオ2: 影響範囲の分析

```
User: REQ-1729180800000を実装中に変更したいです。影響範囲を教えてください。

Claude: 影響範囲を分析します。
[analyze_impactツールを使用]

影響範囲分析の結果:
- 影響を受ける要求: 3件
  - REQ-XXX: ユーザープロフィール表示機能 (直接依存)
  - REQ-YYY: 画像ストレージ設定 (直接依存)
  - REQ-ZZZ: ユーザー設定画面 (間接依存)
- 推定工数: 2日
- リスク:
  - 既存のプロフィール表示機能への影響があります
  - 画像ストレージの容量計画の見直しが必要です
- 推奨事項:
  - 影響を受ける要求のレビューとテスト計画を作成してください
  - 段階的な変更とテストを推奨します
```

### シナリオ3: 変更提案の作成

```
User: セキュリティ上の理由で、REQ-1729180800000の優先度をcriticalに上げる提案を作成してください。

Claude: 変更提案を作成します。
[propose_changeツールを使用]

変更提案を作成しました:
- 提案ID: PROP-1729180900000
- 対象: REQ-1729180800000
- 変更内容:
  - 優先度: medium → critical
  - 理由: セキュリティの脆弱性対応のため緊急実装が必要
- 影響分析:
  - 影響を受ける要求: 3件
  - 推定工数: 2日
  - スケジュールへの影響が予想されます
```

## 自動検証・修正機能

requirements-mcp-serverは、要求変更時に自動的に妥当性を評価し、必要に応じて修正を適用する機能を搭載しています。

### 設定ファイル

設定は `src/auto-validation-config.jsonc` で管理されます:

```jsonc
{
  "autoValidation": {
    "enabled": true,           // 自動検証を有効化
    "validation": {
      "useLLM": false,         // LLM評価を使用するか
      "updateMetrics": true    // NLP指標を更新するか
    }
  },
  "autoFix": {
    "enabled": true,           // 自動修正を有効化
    "mode": "strict",          // 修正モード: "strict" | "suggest" | "disabled"
    "policyFile": "./src/fix-engine/fix-policy.jsonc",
    "revalidateAfterFix": true,  // 修正後に再検証を実行
    "maxIterations": 3,          // 最大修正反復回数
    "fixSeverity": "error"       // 修正対象: "error" | "warning" | "info"
  },
  "logging": {
    "enabled": true,           // ログを記録
    "verbose": false           // 詳細ログ
  }
}
```

### 動作フロー

1. **要求の追加・更新**
   - `addRequirement()` または `updateRequirement()` が呼ばれる

2. **自動検証**
   - ValidationEngineが要求を検証
   - 階層構造、グラフヘルス、抽象度、MECE、品質スタイルをチェック

3. **自動修正**（違反がある場合）
   - FixExecutorが修正プランを生成
   - 設定に応じて自動適用（Strictモード）または提案のみ（Suggestモード）
   - 修正の適用順序（局所化→波及）:

     | 順序 | 対象 | 説明 |
     |------|------|------|
     | 1 | 対象要求 | 違反が発生した要求自体を修正 |
     | 2 | 親要求 | refinesで参照される上位要求 |
     | 3 | 兄弟要求 | 同じ親を持つ要求 |
     | 4 | 子要求 | 対象要求をrefinesする下位要求 |
     | 5 | 横依存 | dependenciesで参照される要求 |
     | 6 | テスト | 関連するテストケース |

4. **再検証**
   - 修正後の要求を再検証
   - 最終的な品質スコアを計算

### テスト

自動検証・修正機能のテストスクリプト:

```bash
npx tsx scripts/test-auto-validation.ts
```

### カスタマイズ

修正ポリシーは `fix-policy.jsonc` でカスタマイズ可能です。詳細は[Fix Engineドキュメント](./FIX-ENGINE-README.md)を参照してください。

## プロジェクト構造

```
requirements-mcp-server/
├── src/
│   ├── index.ts                    # MCPサーバーのメインエントリーポイント
│   ├── types.ts                    # 型定義
│   ├── storage.ts                  # データストレージ層（自動検証統合）
│   ├── analyzer.ts                 # 影響範囲分析ロジック
│   ├── validation-service.ts       # 自動検証・修正サービス
│   ├── auto-validation-config.jsonc # 自動検証設定
│   ├── validation/                 # 検証エンジン
│   └── fix-engine/                 # 修正エンジン
│       ├── types.ts                # 修正エンジン型定義
│       ├── fix-planner.ts          # 修正プラン生成
│       ├── fix-executor.ts         # 修正実行
│       ├── change-engine.ts        # 変更適用
│       └── fix-policy.jsonc        # 修正ポリシー
├── data/                           # 要求データ（自動生成）
│   ├── requirements.json           # 要求データ
│   └── proposals.json              # 変更提案データ
├── build/                # ビルド出力（自動生成）
├── package.json
├── tsconfig.json
└── README.md
```

## 開発

### ビルド

```bash
npm run build
```

### 開発モード（ホットリロード）

```bash
npm run dev
```

### 型チェック

```bash
npm run typecheck
```

### テスト

```bash
npm test
```

## ビュー機能

要求データを様々な形式で出力・表示できます。

### 利用可能なビュー

以下の8種類のビューが定義されています:

1. **ステークホルダ要求リスト**: ステークホルダ要求のみを表示
2. **システム要求リスト**: システム要求のみを表示
3. **システム機能要求リスト**: 機能要求のみを表示
4. **全要求一覧**: すべての要求を表示
5. **ステークホルダ要求-システム要求マトリックス**: トレーサビリティマトリックス
6. **システム要求-機能要求マトリックス**: トレーサビリティマトリックス
7. **重要度Critical要求**: 優先度がCriticalの要求のみ
8. **実装中要求**: ステータスがin_progressの要求のみ

### ビューの生成

```bash
npx tsx scripts/generate-views.ts
```

これにより、`views/` ディレクトリ配下にMarkdown、HTML、CSV形式でビューファイルが生成されます。

### VSCodeでの表示

#### Markdownファイル
1. VSCodeでファイルを開く
2. `Ctrl+Shift+V` (Windows/Linux) または `Cmd+Shift+V` (Mac) でプレビュー
3. プレビューを開いたまま、要求を更新すると**自動的にプレビューも更新されます**

**自動更新の動作:**
- 要求の追加・更新・削除を行うと、すべてのビューファイルが自動再生成されます
- VSCodeのMarkdownプレビューは、ファイル変更を検知して自動的に表示を更新します
- プレビューウィンドウを閉じる必要はありません

#### 推奨VSCode拡張機能
プロジェクトを開くと、以下の拡張機能のインストールが推奨されます:
- **Markdown All in One**: Markdownのプレビューと編集
- **Markdown Preview Enhanced**: 高機能なMarkdownプレビュー
- **Excel Viewer**: CSV/TSVファイルを表形式で表示
- **Rainbow CSV**: CSVファイルをカラフルに表示
- **Live Server**: HTMLファイルをブラウザで表示

#### リアルタイム監視の確認方法
1. `views/markdown/in-progress-requirements.md` を開いてプレビュー表示
2. 別のターミナルで要求のステータスを更新:
   ```bash
   npx tsx scripts/test-auto-update.ts
   ```
3. プレビューが自動的に更新されることを確認

詳細は `views/README.md` を参照してください。

## Miyabiフレームワークとの統合

このプロジェクトはMiyabiフレームワークで構築されており、以下の自動化機能が利用できます:

- **自動Issue管理**: GitHubのIssueから自動的にタスクを処理
- **AI Agents**: 6つの専門エージェントによる自律開発
- **ラベル駆動**: 46種類のラベルによる状態管理
- **自動PR作成**: Issue → 実装 → PR の自動フロー

詳細は`.claude/`ディレクトリと`CLAUDE.md`を参照してください。

## Webビューアー

要求管理システムには、インタラクティブなWebビューアーが付属しています。

### 起動方法

```bash
npm run view-server
```

ブラウザで http://localhost:5002 にアクセスしてください。

### 主な機能

#### 1. ツリービュー
- 要求を階層構造で表示
- カテゴリ別（ステークホルダ要求、システム要求、システム機能要求）にグループ化
- 要求をクリックすると右側に詳細表示

#### 2. Search & Filter（検索・フィルター）
- **リサイズ可能**: 上端をドラッグして表示領域を調整可能
- **キーワード検索**: 要求のタイトル、説明、IDで検索
- **フィルター機能**:
  - ステータス
  - 優先度
  - カテゴリ
  - 作成者（動的に生成）
  - タグ（カンマ区切りで複数指定可能）
- **ビュー選択**:
  - リスト: 検索結果を一覧表示
  - マトリックス: ステークホルダ→システム: ステークホルダ要求とシステム要求のトレーサビリティマトリックス
  - マトリックス: システム→機能: システム要求とシステム機能要求のトレーサビリティマトリックス

#### 3. マトリックスビュー
要求間の依存関係を2次元マトリックス形式で可視化します。
- 行: 上位要求（例: ステークホルダ要求）
- 列: 下位要求（例: システム要求）
- ●マーク: 依存関係がある箇所

#### 4. カスタムビュー設定
`view-config.json` ファイルを編集することで、独自のビューを追加できます。

**例: カスタムマトリックスの追加**
```json
{
  "views": [
    {
      "id": "custom-matrix-1",
      "name": "カスタムマトリックス",
      "type": "matrix",
      "description": "ステークホルダ要求とシステム機能要求の直接マトリックス",
      "rowType": "stakeholder",
      "colType": "functional",
      "rowName": "ステークホルダ要求",
      "colName": "システム機能要求"
    }
  ]
}
```

サーバーを再起動すると、新しいビューが「ビュー」ドロップダウンに表示されます。

#### 5. Claudeアシスタント
- 右側のチャットパネルで要求管理についてClaudeに質問可能
- 要求の追加、検索、依存関係分析などをサポート

#### 6. 自動更新
- ファイルシステムの変更を検知して自動リフレッシュ（5秒間隔）
- 常に最新の要求情報を表示

## ライセンス

MIT

## 貢献

Issue、Pull Requestを歓迎します。

## サポート

質問や問題がある場合は、GitHubのIssueで報告してください。