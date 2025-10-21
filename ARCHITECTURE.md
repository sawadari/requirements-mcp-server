# requirements-mcp-server アーキテクチャドキュメント

## 概要

requirements-mcp-serverは、Model Context Protocol (MCP)を使用した要求管理システムです。レイヤードアーキテクチャを採用し、関心の分離と保守性を実現しています。

本システムは [REQUIREMENTS-PRINCIPLES.md](./REQUIREMENTS-PRINCIPLES.md) で定義された要求管理の要諦に基づいて設計されています。

## アーキテクチャ図

```
┌─────────────────────────────────────────────────────────┐
│                    Claude Code (Client)                  │
└─────────────────────┬───────────────────────────────────┘
                      │ MCP Protocol
                      ↓
┌─────────────────────────────────────────────────────────┐
│                   MCP Server Layer                       │
│                    (src/index.ts)                        │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Tool Handlers (13 tools)                        │   │
│  │  - add/get/update/delete/search requirements     │   │
│  │  - analyze_impact, get_dependency_graph          │   │
│  │  - validate_requirement, validate_all            │   │
│  │  - load_policy, preview/apply/rollback_fixes     │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        ↓                           ↓
┌───────────────────┐     ┌──────────────────────┐
│  Business Logic   │     │   Fix Engine Layer   │
│      Layer        │     │                      │
│                   │     │  ┌────────────────┐  │
│  ┌─────────────┐  │     │  │ FixExecutor    │  │
│  │  Analyzer   │  │     │  │ FixPlanner     │  │
│  │  Validator  │  │     │  │ ChangeEngine   │  │
│  └─────────────┘  │     │  └────────────────┘  │
│                   │     │                      │
│  ┌─────────────┐  │     │  Policy-Driven      │
│  │ Validation  │  │     │  - split/merge      │
│  │   Engine    │  │     │  - rewire/cycle     │
│  └─────────────┘  │     │  - transactions     │
└─────────┬─────────┘     └──────────────────────┘
          │
          ↓
┌─────────────────────────────────────────────────────────┐
│                 Data Access Layer                        │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Storage    │  │    Logger    │  │  ViewExport  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────┐
│               Persistence Layer (JSON)                   │
│  ./data/requirements.json                                │
│  ./data/proposals.json                                   │
│  ./data/operations.log                                   │
└─────────────────────────────────────────────────────────┘
```

## レイヤー詳細

### 1. MCP Server Layer (`src/index.ts`)

**責務**: MCPプロトコルとビジネスロジックの橋渡し

**主要コンポーネント**:
- `RequirementsMCPServer`: メインサーバークラス
- Tool Handlers: 13個のMCPツールハンドラ
- Schema Validation: Zodによる入力検証

**設計原則**:
- 各ツールハンドラは単一責任
- ビジネスロジックは下位レイヤーに委譲
- エラーハンドリングの一元化

### 2. Business Logic Layer

#### 2.1 要求分析 (`src/analyzer.ts`)

**責務**: 要求の影響範囲分析

**主要機能**:
- 依存関係の追跡
- 影響を受ける要求の特定
- リスク評価と推奨事項の生成

#### 2.2 バリデーション (`src/validator.ts`, `src/validation/`)

**責務**: 要求の妥当性検証

**階層構造**:
```
ValidationEngine (validation-engine.ts)
├── StructureValidator (structure-validator.ts)
│   └── 必須フィールド、型、依存関係の検証
├── MECEValidator (mece-validator.ts)
│   └── MECE原則の検証
├── NLPAnalyzer (nlp-analyzer.ts)
│   └── 自然言語処理による品質分析
└── LLMEvaluator (llm-evaluator.ts)
    └── LLMによる意味的検証
```

**設計パターン**:
- Strategy Pattern: 複数のバリデーターを切り替え可能
- Chain of Responsibility: バリデーターの連鎖実行

### 3. Fix Engine Layer (`src/fix-engine/`)

**責務**: ポリシーベースの要求修正

**コンポーネント**:

#### 3.1 FixExecutor (`fix-executor.ts`)
- ポリシーに基づく修正の実行制御
- Strict/Suggest/Assistモードの管理
- 反復実行と停止条件の制御

#### 3.2 FixPlanner (`fix-planner.ts`)
- 違反検出とChangeSet生成
- 修正戦略の選択
- 依存関係の解析

#### 3.3 ChangeEngine (`change-engine.ts`)
- ChangeSetの適用・ロールバック
- トランザクション境界の保証
- 可逆性の管理

**主要な修正操作**:
- `split`: 要求の分割
- `merge`: 要求の統合
- `rewire`: リンクの再配線
- `introduce`: 中間層の導入
- `rewrite`: テキストの書き換え
- `break_cycle`: 循環の切断

**設計原則**:
- Command Pattern: 各修正操作をコマンドとして実装
- Transaction Pattern: all-or-nothing の保証
- Memento Pattern: 状態の保存とロールバック

### 4. Data Access Layer

#### 4.1 Storage (`src/storage.ts`)

**責務**: 要求データの永続化

**主要機能**:
- CRUD操作
- ファイルI/O
- 自動ビュー更新のトリガー

#### 4.2 OperationLogger (`src/operation-logger.ts`)

**責務**: 操作履歴の記録

**主要機能**:
- 操作ログの追記
- タイムスタンプとメタデータの記録

#### 4.3 ViewExporter (`src/views.ts`)

**責務**: ビューの生成とエクスポート

**主要機能**:
- HTML/JSON形式でのエクスポート
- マトリックスビュー、ツリービューの生成

## データフロー

### 要求追加のフロー

```
1. Claude Code
   ↓ add_requirement(title, description, ...)
2. MCP Server (handleAddRequirement)
   ↓ Zodバリデーション
3. Storage (addRequirement)
   ↓ 要求の作成・保存
4. ValidationEngine (validate)
   ↓ 自動検証
5. ViewExporter (exportAllViews)
   ↓ ビュー更新
6. Response → Claude Code
```

### Fix Engine適用のフロー

```
1. Claude Code
   ↓ load_policy(policyPath)
2. MCP Server (handleLoadPolicy)
   ↓ JSONCパース
3. FixExecutor (初期化)
   ↓
4. Claude Code
   ↓ apply_fixes(changeSetId)
5. MCP Server (handleApplyFixes)
   ↓
6. ChangeEngine (apply)
   ├─ 状態のディープコピー
   ├─ 各Changeの適用
   ├─ 失敗時ロールバック
   └─ 成功時コミット
7. Storage (updateRequirement × N)
   ↓ 各要求を更新
8. Response → Claude Code
```

## 要求管理の基本原則

本システムは [REQUIREMENTS-PRINCIPLES.md](./REQUIREMENTS-PRINCIPLES.md) で定義された要諦に基づいています。

### オントロジー

要求は以下の段階を経て詳細化されます：
- **ステークホルダ要求**: システムを利用するステークホルダのニーズ
- **システム要求**: システムをブラックボックスとしてみたときの要求
- **システム機能要求**: システムをホワイトボックスとしてみたときの要求

**MECE原則**: 親子関係において、下位要求は互いに重複せず、上位要求を完全にカバーする

**粒度の一貫性**: 同一段階内の要求は、文章の長さと抽象度が揃っている

### セマンティクス

- **要求の構成**: 主題（title）・説明（description）・理由（rationale）・属性（metadata）
- **段階別カスタマイズ**: 各段階に応じた属性セット（実装予定: Issue #16）

### 妥当性

- **構造的妥当性**: オントロジーへの適合（StructureValidator, MECEValidator）
- **意味的整合性**: 連続性・整合性・論理性（LLMEvaluator - 実装予定: Issue #13）

### ツール的側面

- **影響分析**: ImpactAnalyzerによる依存関係の追跡
- **自動修正**: Fix Engineによる整合性の自動維持
- **トレーサビリティ**: OperationLoggerによる変更履歴の記録

### 原則の実装マッピング

| 原則 | 実装コンポーネント | ファイル | 状態 |
|------|-------------------|----------|------|
| 段階的詳細化 | Requirement.type | src/types.ts | ✅ 実装済み |
| MECE原則 | MECEValidator | src/validation/mece-validator.ts | ✅ 実装済み |
| 粒度の一貫性 | GranularityValidator | src/validation/granularity-validator.ts | ⏳ Issue #17 |
| 影響分析 | ImpactAnalyzer | src/analyzer.ts | ✅ 実装済み |
| 自動修正 | Fix Engine | src/fix-engine/ | ✅ 実装済み |
| トレーサビリティ | OperationLogger | src/operation-logger.ts | ✅ 実装済み |
| オントロジー可変性 | OntologyManager | src/ontology/ | ⏳ Issue #15 |
| セマンティクス可変性 | SemanticsManager | src/semantics/ | ⏳ Issue #16 |

詳細は [REQUIREMENTS-PRINCIPLES.md](./REQUIREMENTS-PRINCIPLES.md) および [PRINCIPLES-COMPLIANCE-ANALYSIS.md](./PRINCIPLES-COMPLIANCE-ANALYSIS.md) を参照。

---

## アーキテクチャ設計原則

### 1. 関心の分離 (Separation of Concerns)

各レイヤーは明確な責務を持ち、上位レイヤーは下位レイヤーに依存:
- MCP Server → Business Logic
- Business Logic → Data Access
- Data Access → Persistence

### 2. 依存性の注入 (Dependency Injection)

コンストラクタで依存を注入し、テスタビリティを向上:

```typescript
class RequirementsMCPServer {
  constructor() {
    this.storage = new RequirementsStorage('./data');
    this.analyzer = new ImpactAnalyzer(this.storage);
    this.validator = new RequirementValidator(this.storage);
    // ...
  }
}
```

### 3. 単一責任の原則 (Single Responsibility Principle)

各クラスは1つの責務のみを持つ:
- `Storage`: データの永続化
- `Analyzer`: 影響分析
- `Validator`: 検証
- `FixExecutor`: 修正実行

### 4. 開放閉鎖の原則 (Open/Closed Principle)

拡張に開き、修正に閉じる:
- 新しいバリデーターを追加可能
- 新しい修正操作を追加可能
- 既存コードの変更なし

### 5. インターフェース分離の原則 (Interface Segregation)

小さく、特化したインターフェース:
- `Requirement`: 要求データ
- `ChangeSet`: 修正セット
- `FixPolicy`: ポリシー定義

## トランザクション管理

### ChangeSetの適用

```typescript
async apply(changeSet: ChangeSet, requirements: Record<ReqID, Requirement>) {
  // 1. 元の状態を保存
  const original = deepCopy(requirements);
  const modified = deepCopy(requirements);

  try {
    // 2. 各変更を適用
    for (const change of changeSet.changes) {
      const result = await this.applyChange(change, modified);
      if (!result.success) {
        // 3. 失敗時: ロールバック
        return { success: false, modified: original, errors };
      }
    }
    // 4. 成功時: コミット
    return { success: true, modified, errors: [] };
  } catch (error) {
    // 5. 例外時: ロールバック
    return { success: false, modified: original, errors };
  }
}
```

**保証**:
- Atomicity: すべて成功 or すべて失敗
- Consistency: 整合性を維持
- Isolation: 独立した実行
- Durability: 永続化の保証

## 拡張ポイント

### 1. 新しいMCPツールの追加

1. Zodスキーマ定義
2. `getTools()` にツール追加
3. ハンドラメソッド実装
4. switchステートメントにケース追加

### 2. 新しいバリデーターの追加

1. `src/validation/` に新ファイル作成
2. `ValidationEngine` に統合
3. ポリシーに設定追加

### 3. 新しい修正操作の追加

1. `types.ts` に操作定義
2. `ChangeEngine` にハンドラ追加
3. `FixPlanner` に戦略追加
4. ポリシーにルール追加

## テスト戦略

### ユニットテスト

各コンポーネントを個別にテスト:
- `tests/change-transaction.test.ts`: トランザクション
- `tests/graph-fixes.test.ts`: グラフ修正
- `tests/split-merge.test.ts`: 分割/統合
- `tests/executor-modes.test.ts`: 実行モード

### フィクスチャ

`tests/fixtures.ts`:
- サンプルデータ生成
- テストユーティリティ
- モック関数

### テストカバレッジ目標

- Fix Engine: 80%+
- Business Logic: 70%+
- Data Access: 60%+

## パフォーマンス考慮事項

### 1. ファイルI/O最適化

- 非同期I/O使用
- バッファリング
- 差分更新

### 2. メモリ管理

- ディープコピーの最小化
- 大規模データセットの分割処理
- ガベージコレクション考慮

### 3. キャッシング

- ValidationEngine結果のキャッシュ
- ビュー生成結果のキャッシュ

## セキュリティ

### 1. 入力検証

- Zodによる厳密な型チェック
- SQLインジェクション対策（該当なし）
- パストラバーサル対策

### 2. エラーハンドリング

- 機密情報のマスキング
- 詳細なエラーログ
- ユーザーフレンドリーなエラーメッセージ

### 3. アクセス制御

- 現状: シングルユーザー
- 将来: RBAC実装予定

## 今後の改善方向

### 短期（1-3ヶ月）

1. ✅ Fix Engine MCPツール実装
2. ✅ テストスイート整備
3. ⏳ 統合テストの追加
4. ⏳ パフォーマンステスト

### 中期（3-6ヶ月）

1. マルチユーザー対応
2. リアルタイム同期
3. バージョン管理強化
4. WebSocketサポート

### 長期（6-12ヶ月）

1. 分散システム化
2. AI駆動の自動修正強化
3. グラフデータベース統合
4. エンタープライズ機能

## 参考資料

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Fix Engine README](./FIX-ENGINE-README.md)
- [Miyabi Framework](https://github.com/ShunsukeHayashi/Autonomous-Operations)
- [プロジェクトREADME](./README.md)

---

最終更新: 2025-10-21
バージョン: 1.0.0
