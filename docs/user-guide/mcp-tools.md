# MCPツール完全ガイド - requirements-mcp-server

**バージョン**: 1.0.0
**最終更新**: 2025-11-08
**ツール総数**: 22個

このドキュメントでは、requirements-mcp-serverで利用可能な22個のMCPツールについて詳しく説明します。

---

## 📚 目次

- [ツール一覧](#ツール一覧)
- [カテゴリ別詳細](#カテゴリ別詳細)
  - [1. CRUD操作（6ツール）](#1-crud操作6ツール)
  - [2. 分析・インサイト（2ツール）](#2-分析インサイト2ツール)
  - [3. バリデーション・品質（3ツール）](#3-バリデーション品質3ツール)
  - [4. 変更管理（5ツール）](#4-変更管理5ツール)
  - [5. プロジェクト管理（6ツール）](#5-プロジェクト管理6ツール)
- [使用例](#使用例)
- [関連ドキュメント](#関連ドキュメント)

---

## ツール一覧

| # | ツール名 | カテゴリ | 説明 |
|---|---------|---------|------|
| 1 | add_requirement | CRUD | 新しい要求を追加 |
| 2 | get_requirement | CRUD | 要求を取得 |
| 3 | list_requirements | CRUD | 全要求を一覧表示 |
| 4 | update_requirement | CRUD | 要求を更新 |
| 5 | delete_requirement | CRUD | 要求を削除 |
| 6 | search_requirements | CRUD | 条件検索 |
| 7 | analyze_impact | Analysis | 影響範囲分析 |
| 8 | get_dependency_graph | Analysis | 依存関係グラフ取得 |
| 9 | validate_requirement | Validation | 単一要求の妥当性検証 |
| 10 | validate_all_requirements | Validation | 全要求の妥当性検証 |
| 11 | get_validation_report | Validation | 検証レポート取得 |
| 12 | propose_change | Change Mgmt | 変更提案を作成 |
| 13 | load_policy | Change Mgmt | 修正ポリシーを読み込み |
| 14 | preview_fixes | Change Mgmt | 修正プレビュー |
| 15 | apply_fixes | Change Mgmt | 修正を適用 |
| 16 | rollback_fixes | Change Mgmt | 修正をロールバック |
| 17 | list_projects | Project Mgmt | プロジェクト一覧を取得 |
| 18 | get_current_project | Project Mgmt | 現在のプロジェクト情報 |
| 19 | switch_project | Project Mgmt | プロジェクトを切り替え |
| 20 | create_project | Project Mgmt | 新規プロジェクト作成 |
| 21 | delete_project | Project Mgmt | プロジェクトを削除 |
| 22 | infer_and_switch_project | Project Mgmt | 自然言語からプロジェクト推論・切替 |

---

## カテゴリ別詳細

### 1. CRUD操作（6ツール）

基本的な作成・読取・更新・削除操作

#### 1.1 add_requirement

**説明**: 新しい要求を追加します

**入力パラメータ**:
- `title` (必須) - 要求のタイトル
- `description` (必須) - 要求の詳細説明
- `priority` (必須) - 優先度: `critical`, `high`, `medium`, `low`
- `category` (必須) - カテゴリ
- `tags` (オプション) - タグの配列
- `dependencies` (オプション) - 依存する要求のIDの配列
- `author` (オプション) - 作成者
- `assignee` (オプション) - 担当者

**出力**: 作成された `Requirement` オブジェクト

**使用例**:
```
新しい要求を追加してください。
タイトル: ユーザー認証機能
説明: JWTを使用したユーザー認証システムを実装する
優先度: high
カテゴリ: セキュリティ
タグ: 認証, JWT
```

**関連ツール**: `update_requirement`, `validate_requirement`

---

#### 1.2 get_requirement

**説明**: 指定されたIDの要求を取得します

**入力パラメータ**:
- `id` (必須) - 取得する要求のID（例: REQ-1234567890）

**出力**: `Requirement` オブジェクト

**使用例**:
```
要求REQ-1234567890の詳細を表示してください
```

**関連ツール**: `list_requirements`, `search_requirements`

---

#### 1.3 list_requirements

**説明**: すべての要求の一覧を取得します

**入力パラメータ**: なし

**出力**: `Requirement[]` 配列

**使用例**:
```
すべての要求をリストアップしてください
```

**関連ツール**: `search_requirements`, `get_requirement`

---

#### 1.4 update_requirement

**説明**: 既存の要求を更新します。変更したいフィールドのみ指定

**入力パラメータ**:
- `id` (必須) - 更新する要求のID
- `title` (オプション) - 新しいタイトル
- `description` (オプション) - 新しい説明
- `status` (オプション) - 新しいステータス: `draft`, `proposed`, `approved`, `in_progress`, `completed`, `rejected`, `on_hold`
- `priority` (オプション) - 新しい優先度
- `category` (オプション) - 新しいカテゴリ
- `tags` (オプション) - 新しいタグ
- `dependencies` (オプション) - 新しい依存関係
- `assignee` (オプション) - 新しい担当者

**出力**: 更新された `Requirement` オブジェクト

**使用例**:
```
要求REQ-123のステータスをin_progressに更新してください
```

**関連ツール**: `get_requirement`, `validate_requirement`

---

#### 1.5 delete_requirement

**説明**: 指定されたIDの要求を削除します

**入力パラメータ**:
- `id` (必須) - 削除する要求のID

**出力**: `boolean` (成功/失敗)

**使用例**:
```
要求REQ-123を削除してください
```

**関連ツール**: `get_requirement`

---

#### 1.6 search_requirements

**説明**: 条件を指定して要求を検索します

**入力パラメータ**:
- `status` (オプション) - ステータスで絞り込み
- `priority` (オプション) - 優先度で絞り込み
- `category` (オプション) - カテゴリで絞り込み
- `tags` (オプション) - タグで絞り込み（配列）
- `searchText` (オプション) - タイトルまたは説明で全文検索

**出力**: `Requirement[]` 配列

**使用例**:
```
優先度がhighで、ステータスがdraftの要求を検索してください
```

**関連ツール**: `list_requirements`, `get_requirement`

---

### 2. 分析・インサイト（2ツール）

影響分析・依存関係分析

#### 2.1 analyze_impact

**説明**: 要求の変更がシステムに与える影響を分析します

**入力パラメータ**:
- `id` (必須) - 影響範囲を分析する要求のID
- `proposedChanges` (オプション) - 提案する変更内容

**出力**: `ImpactAnalysis` オブジェクト
- 影響を受ける要求のリスト（直接・間接）
- 推定工数
- リスク
- 推奨事項

**使用例**:
```
要求REQ-123の影響範囲を分析してください
```

**関連ツール**: `get_dependency_graph`, `propose_change`

---

#### 2.2 get_dependency_graph

**説明**: 要求の依存関係グラフを取得します。可視化に利用できます

**入力パラメータ**:
- `format` (オプション) - 出力フォーマット

**出力**: `DependencyGraph` オブジェクト

**使用例**:
```
全要求の依存関係グラフを取得してください
```

**関連ツール**: `analyze_impact`

---

### 3. バリデーション・品質（3ツール）

妥当性検証・品質チェック

#### 3.1 validate_requirement

**説明**: 単一要求の妥当性をチェックします。以下5つのドメインで検証:
- 階層構造（Hierarchy）
- グラフヘルス（Graph Health）
- 抽象度（Abstraction）
- MECE原則
- 品質スタイル（Quality Style）

**入力パラメータ**:
- `id` (必須) - 妥当性チェックする要求のID
- `useLLM` (オプション) - LLM評価を使用するか（デフォルト: false）
- `updateMetrics` (オプション) - NLP指標を更新するか（デフォルト: true）

**出力**: `ValidationResult` オブジェクト
- 違反リスト
- 品質スコア
- 推奨事項

**使用例**:
```
要求REQ-123の妥当性をチェックしてください
```

**関連ツール**: `validate_all_requirements`, `get_validation_report`

---

#### 3.2 validate_all_requirements

**説明**: すべての要求を一括検証します

**入力パラメータ**:
- `useLLM` (オプション) - LLM評価を使用するか
- `updateMetrics` (オプション) - NLP指標を更新するか

**出力**: `Map<string, ValidationResult>` 全要求の検証結果

**使用例**:
```
すべての要求を検証してください
```

**関連ツール**: `validate_requirement`, `get_validation_report`

---

#### 3.3 get_validation_report

**説明**: 検証結果のレポートを生成します

**入力パラメータ**:
- `format` (オプション) - レポート形式: `json`, `markdown`（デフォルト: json）

**出力**: `ValidationReport` オブジェクト
- サマリー
- 違反数別内訳
- ドメイン別集計
- 違反のある要求リスト

**使用例**:
```
検証レポートをMarkdown形式で取得してください
```

**関連ツール**: `validate_all_requirements`

---

### 4. 変更管理（5ツール）

変更提案・修正管理

#### 4.1 propose_change

**説明**: 要求に対する変更提案を作成します。影響範囲の分析結果も含まれます

**入力パラメータ**:
- `targetRequirementId` (必須) - 変更対象の要求ID
- `proposedChanges` (必須) - 提案する変更内容の配列
  - `field` - 変更するフィールド
  - `currentValue` - 現在の値
  - `proposedValue` - 提案する値
  - `reason` - 変更理由

**出力**: `ChangeProposal` オブジェクト

**使用例**:
```
要求REQ-123の優先度をhighからcriticalに変更する提案を作成してください。
理由: セキュリティの脆弱性が発見されたため、緊急対応が必要
```

**関連ツール**: `analyze_impact`, `preview_fixes`

---

#### 4.2 load_policy

**説明**: Fix Engineのポリシーファイルを読み込みます

**入力パラメータ**:
- `policyPath` (オプション) - ポリシーファイルのパス（デフォルト: `./config/fix-policy.jsonc`）

**出力**: `FixPolicy` オブジェクト

**使用例**:
```
Fix Engineのポリシーを読み込んでください
```

**詳細**: ポリシーファイルには、要求の自動修正ルール、実行モード（strict/suggest/assist）、停止条件などが定義されています。

**関連ツール**: `preview_fixes`, `apply_fixes`

---

#### 4.3 preview_fixes

**説明**: 提案された修正のプレビューを表示します。実際には適用されません

**入力パラメータ**:
- `changeSetId` (オプション) - プレビューするChangeSetのID（省略時は最新）

**出力**: `ChangeSet` オブジェクト
- 変更内容
- 影響を受ける要求
- 変更の詳細

**使用例**:
```
最新の修正提案をプレビューしてください
```

**関連ツール**: `load_policy`, `apply_fixes`

---

#### 4.4 apply_fixes

**説明**: ChangeSetを適用して要求を修正します。トランザクション境界が保証され、失敗時は自動ロールバックされます

**入力パラメータ**:
- `changeSetId` (必須) - 適用するChangeSetのID
- `force` (オプション) - 警告を無視して強制適用するか（デフォルト: false）

**出力**: `ApplyResult` オブジェクト

**使用例**:
```
ChangeSet CS-001を適用してください
```

**詳細**: すべての変更が成功するか、すべてロールバックされるかのどちらか（ACID保証）

**関連ツール**: `preview_fixes`, `rollback_fixes`

---

#### 4.5 rollback_fixes

**説明**: 適用済みのChangeSetをロールバックします

**入力パラメータ**:
- `changeSetId` (必須) - ロールバックするChangeSetのID

**出力**: `RollbackResult` オブジェクト

**使用例**:
```
ChangeSet CS-001をロールバックしてください
```

**詳細**: 可逆性が保証されているChangeSetのみロールバック可能です

**関連ツール**: `apply_fixes`

---

### 5. プロジェクト管理（6ツール）

複数プロジェクトの管理・切り替え

#### 5.1 list_projects

**説明**: すべてのプロジェクトの一覧を取得します

**入力パラメータ**: なし

**出力**: `ProjectInfo[]` 配列
- プロジェクトID
- プロジェクト名
- ファイルパス
- 要求数
- 更新日時

**使用例**:
```
すべてのプロジェクトをリストアップしてください
```

**関連ツール**: `get_current_project`, `switch_project`

---

#### 5.2 get_current_project

**説明**: 現在アクティブなプロジェクトの情報を取得します

**入力パラメータ**: なし

**出力**: `ProjectInfo` オブジェクト

**使用例**:
```
現在のプロジェクト情報を表示してください
```

**関連ツール**: `list_projects`, `switch_project`

---

#### 5.3 switch_project

**説明**: 別のプロジェクトに切り替えます。以降の操作は切り替え先のプロジェクトに対して実行されます

**入力パラメータ**:
- `projectId` (必須) - 切り替え先のプロジェクトID

**出力**: `ProjectInfo` オブジェクト

**使用例**:
```
プロジェクトをproject-alphaに切り替えてください
```

**ユースケース**:
- 複数システムの開発で対象を切り替え
- 異なるプロジェクトフェーズへの切り替え
- 環境ごとの要求管理切り替え

**関連ツール**: `list_projects`, `get_current_project`

---

#### 5.4 create_project

**説明**: 新しいプロジェクトを作成します。既存プロジェクトからコピーすることも可能

**入力パラメータ**:
- `projectId` (必須) - 新規プロジェクトのID（[a-z0-9-]+）
- `projectName` (必須) - プロジェクト名
- `description` (オプション) - プロジェクトの説明
- `copyFrom` (オプション) - コピー元のプロジェクトID

**出力**: `ProjectInfo` オブジェクト

**使用例**:
```
新しいプロジェクト「project-beta」を作成してください
プロジェクト名: Beta System
説明: 次世代システムの要求管理
```

**関連ツール**: `list_projects`, `switch_project`

---

#### 5.5 delete_project

**説明**: プロジェクトを削除します。デフォルトプロジェクト（requirements）は削除できません

**入力パラメータ**:
- `projectId` (必須) - 削除するプロジェクトID

**出力**: `boolean` (成功/失敗)

**使用例**:
```
プロジェクト「project-test」を削除してください
```

**関連ツール**: `list_projects`

---

#### 5.6 infer_and_switch_project

**説明**: 自然言語のクエリからプロジェクトを推論して切り替えます。プロジェクトIDや名前の一部から自動的にマッチングします

**入力パラメータ**:
- `query` (必須) - プロジェクトを特定するためのクエリ（例: "エアコン", "aircon", "smart watch"）

**出力**: `ProjectInfo` オブジェクト または 候補リスト

**マッチングロジック**:
1. **完全一致** - プロジェクトIDまたはプロジェクト名と完全一致（信頼度: exact）
2. **部分一致** - IDまたは名前に含まれる（信頼度: partial）
3. **複数候補** - 複数のプロジェクトがマッチした場合は候補リストを返す
4. **該当なし** - マッチするプロジェクトがない場合はエラー

**使用例**:
```
エアコンのプロジェクトに要求を追加して
→ "aircon-system"プロジェクトに自動切り替え

smartで始まるプロジェクトに切り替えて
→ 複数候補がある場合は候補リストを表示
```

**ユースケース**:
- プロジェクトID正確に覚えていないとき
- 自然言語での対話的な操作
- Claudeとの会話でスムーズにプロジェクト切り替え

**関連ツール**: `switch_project`, `list_projects`

---

## 使用例

### シナリオ1: 新しい機能要求の追加と検証

```
1. 要求を追加
   新しい要求を追加してください。
   タイトル: プロフィール画像アップロード機能
   説明: ユーザーがプロフィール画像をアップロードできる機能を追加したい
   優先度: medium
   カテゴリ: 機能

2. 妥当性を検証
   要求REQ-1234567890の妥当性をチェックしてください

3. 検証レポートを確認
   検証レポートをMarkdown形式で取得してください
```

### シナリオ2: 要求の変更と影響範囲の分析

```
1. 影響範囲を分析
   要求REQ-123の影響範囲を分析してください

2. 変更提案を作成
   要求REQ-123の優先度をhighからcriticalに変更する提案を作成してください。
   理由: セキュリティの脆弱性が発見されたため緊急対応が必要

3. 変更を適用
   要求REQ-123の優先度をcriticalに更新してください
```

### シナリオ3: 複数プロジェクトの管理

```
1. プロジェクト一覧を確認
   すべてのプロジェクトをリストアップしてください

2. プロジェクトを切り替え
   プロジェクトをproject-alphaに切り替えてください

3. 要求を追加
   新しい要求を追加してください...

4. 元のプロジェクトに戻る
   プロジェクトをrequirementsに切り替えてください
```

---

## 関連ドキュメント

- **README.md** - プロジェクト概要と使い方
- **docs/MCP-TOOL-MANAGEMENT.md** - ツール管理ガイド（重複防止）
- **config/tool-registry.json** - ツールレジストリ（全ツールの定義）
- **FIX-ENGINE-README.md** - Fix Engine詳細ガイド
- **ONTOLOGY-GUIDE.md** - オントロジーガイド
- **manual-test-example.md** - 手動テストの実行方法

---

## 手動テスト方法

MCPサーバーに直接JSON-RPCコマンドを送る方法については、`manual-test-example.md`を参照してください。

---

**🌸 Miyabi Framework との統合**

このプロジェクトはMiyabiフレームワークで構築されており、自律型開発ワークフローが利用できます。詳細は`CLAUDE.md`を参照してください。

---

**ライセンス**: MIT
