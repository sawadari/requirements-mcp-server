# requirements-mcp-server

**要求管理MCPサーバー** - Claude Codeとの対話的な要求管理システム

## 概要

requirements-mcp-serverは、Model Context Protocol (MCP)を使用した要求管理システムです。Claude Codeと統合することで、対話しながら要求の追加・更新・削除、影響範囲の分析、変更提案の作成などを実行できます。

### 主な機能

- **要求管理**: 要求の追加、取得、更新、削除、検索
- **依存関係管理**: 要求間の依存関係を定義・追跡
- **影響範囲分析**: 要求の変更が他の要求に与える影響を自動分析
- **変更提案**: 変更内容と影響分析を含む提案を作成
- **依存関係グラフ**: 要求の依存関係を可視化

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

## プロジェクト構造

```
requirements-mcp-server/
├── src/
│   ├── index.ts          # MCPサーバーのメインエントリーポイント
│   ├── types.ts          # 型定義
│   ├── storage.ts        # データストレージ層
│   └── analyzer.ts       # 影響範囲分析ロジック
├── data/                 # 要求データ（自動生成）
│   ├── requirements.json # 要求データ
│   └── proposals.json    # 変更提案データ
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

## Miyabiフレームワークとの統合

このプロジェクトはMiyabiフレームワークで構築されており、以下の自動化機能が利用できます:

- **自動Issue管理**: GitHubのIssueから自動的にタスクを処理
- **AI Agents**: 6つの専門エージェントによる自律開発
- **ラベル駆動**: 46種類のラベルによる状態管理
- **自動PR作成**: Issue → 実装 → PR の自動フロー

詳細は`.claude/`ディレクトリと`CLAUDE.md`を参照してください。

## ライセンス

MIT

## 貢献

Issue、Pull Requestを歓迎します。

## サポート

質問や問題がある場合は、GitHubのIssueで報告してください。