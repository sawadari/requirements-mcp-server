# 用語集 (Glossary)

requirements-mcp-serverで使用される用語の定義と統一ルール

---

## 📚 基本概念

### 要求 (Requirement)
**統一表記**: 要求 / Requirement

システムが満たすべき条件や機能を記述したもの。本システムの中心的な管理対象。

**注意**: 「要件」という表記は使用しない。常に「要求」を使用する。

**関連用語**:
- 要求ID (Requirement ID / ReqID): 要求を一意に識別する識別子
- 要求タイトル (Requirement Title): 要求の概要を表す短い文章
- 要求説明 (Requirement Description): 要求の詳細内容

---

## 🏗️ アーキテクチャ用語

### MCP (Model Context Protocol)
ClaudeなどのLLMがツールを呼び出すための標準プロトコル。本システムはMCPサーバーとして実装されている。

### MCPツール (MCP Tool)
Claude Codeから呼び出し可能な機能単位。本システムは21個のMCPツールを提供。

**例**: `add_requirement`, `validate_requirement`, `switch_project`

### MCPサーバー (MCP Server)
**実装**: `src/index.ts` の `RequirementsMCPServer` クラス

MCPプロトコルを介してツールを提供するサーバープロセス。

---

## 📊 要求管理の階層

### オントロジー (Ontology)
**統一表記**: オントロジー / Ontology

要求の段階や階層構造を定義する概念的枠組み。

**デフォルトの要求段階**:
1. **ステークホルダ要求** (Stakeholder Requirements)
   - システムを利用するステークホルダのニーズ

2. **システム要求** (System Requirements)
   - システムをブラックボックスとしてみたときの要求

3. **システム機能要求** (System Functional Requirements)
   - システムをホワイトボックスとしてみたときの要求

**実装**: `src/ontology/ontology-manager.ts`

### 要求タイプ (Requirement Type)
**統一表記**: 要求タイプ / Requirement Type

要求がどの段階に属するかを示す分類。

**値**: `stakeholder`, `system`, `functional`

---

## ✅ 検証・妥当性

### 検証 (Validation)
**統一表記**: 検証 / Validation

要求の妥当性を確認するプロセス。「バリデーション」という表記も許容するが、「検証」を優先。

### 検証エンジン (ValidationEngine)
**実装**: `src/validation/validation-engine.ts`

複数のバリデーターを統合して要求の妥当性を総合的に検証するコンポーネント。

### バリデーター (Validator)
特定の観点から要求を検証するコンポーネント。

**主要なバリデーター**:
- **StructureValidator**: 構造検証（階層、グラフ）
- **MECEValidator**: MECE原則検証
- **NLPAnalyzer**: 自然言語品質分析
- **LLMEvaluator**: LLMによる意味的検証

### 検証ルール (Validation Rule)
要求が満たすべき具体的な条件。

**ルール命名**: `A1`, `B2`, `C3`, `D1`, `E1` など

**ドメイン**:
- **Aドメイン**: 階層構造の検証
- **Bドメイン**: グラフ構造の検証
- **Cドメイン**: 抽象度・粒度の検証
- **Dドメイン**: MECE原則の検証
- **Eドメイン**: スタイル・品質の検証

### 違反 (Violation)
**統一表記**: 違反 / Violation

検証ルールに適合しない状態。

**重大度**: `error`, `warning`, `info`

---

## 🔧 修正機能

### Fix Engine
**統一表記**: Fix Engine / 修正エンジン

ポリシーに基づいて要求の違反を自動的に修正する機能群。

**主要コンポーネント**:
- **FixExecutor**: 修正の実行制御
- **FixPlanner**: 修正計画の立案
- **ChangeEngine**: 変更の適用・ロールバック

**実装**: `src/fix-engine/`

### ChangeSet
**統一表記**: ChangeSet / 変更セット

複数の変更操作をまとめたもの。トランザクション単位として扱われる。

### 修正操作 (Fix Operation)
具体的な修正アクション。

**主要な操作**:
- `split`: 要求の分割
- `merge`: 要求の統合
- `rewire`: リンクの再配線
- `introduce`: 中間層の導入
- `rewrite`: テキストの書き換え
- `break_cycle`: 循環依存の切断

### ポリシー (Policy / Fix Policy)
どの違反をどのように修正するかを定義したルールセット。

**設定ファイル**: `config/fix-policy.jsonc`

---

## 📁 プロジェクト管理

### プロジェクト (Project)
**統一表記**: プロジェクト / Project

要求データの管理単位。複数のプロジェクトを切り替えて管理可能。

**実装**: `src/project-manager.ts`

### プロジェクトID (Project ID)
プロジェクトを一意に識別する文字列。

**命名規則**: `[a-z0-9-]+`（小文字英数字とハイフンのみ）

**例**: `requirements`, `smart-watch`, `water-heater`

### デフォルトプロジェクト (Default Project)
プロジェクトID: `requirements`

初期状態で使用されるプロジェクト。

---

## 🔄 依存関係

### 依存関係 (Dependency)
**統一表記**: 依存関係 / Dependency

ある要求が他の要求に依存している関係。

### 親要求 (Parent Requirement)
**統一表記**: 親要求 / Parent Requirement

特定の要求に対して、統合的・上位の要求。

### 子要求 (Child Requirement)
**統一表記**: 子要求 / Child Requirement

親要求から派生・分解された下位の要求。

### トレーサビリティ (Traceability)
**統一表記**: トレーサビリティ / 追跡可能性

要求間の依存関係や変更履歴を追跡できる性質。

---

## 📊 MECE原則

### MECE (Mutually Exclusive, Collectively Exhaustive)
**読み**: ミーシー / ミッシー

**定義**:
- **ME (Mutually Exclusive)**: 相互排他的 - 重複がない
- **CE (Collectively Exhaustive)**: 完全網羅的 - 漏れがない

親要求と子要求の関係において、子要求群がこの原則を満たすべき。

---

## 🎨 ビュー・UI

### ビュー (View)
**統一表記**: ビュー / View

要求データを特定の形式で可視化したもの。

**主要なビュー**:
- **リストビュー** (List View): 一覧表示
- **ツリービュー** (Tree View): 階層構造表示
- **マトリックスビュー** (Matrix View): 依存関係マトリックス

### ビューエクスポーター (ViewExporter)
**実装**: `src/views.ts`

各種ビューをHTML/JSON形式でエクスポートするコンポーネント。

### Webビューアー (Web Viewer)
**実装**: `src/view-server.ts`

ブラウザでビューを表示するWebサーバー。

**起動コマンド**: `npm run view-server`

**ポート**: 5002

---

## 🤖 AI機能

### AIチャットアシスタント (AI Chat Assistant)
**実装**: `src/ai-chat-assistant.ts`, `src/enhanced-chat-assistant.ts`, `src/mcp-chat-assistant.ts`

Webビューアー内で動作する対話型アシスタント。Claudeを利用。

**注意**: MCPサーバー本体とは独立した機能。

### オーケストレーション層 (Orchestration Layer)
**実装**: `src/orchestrator/`

AIチャットアシスタントで使用される、意図解析・タスク計画・実行を行う機能群。

**コンポーネント**:
- **IntentAnalyzer**: 意図解析
- **TaskPlanner**: タスク計画
- **StepExecutor**: ステップ実行

---

## 💾 データ管理

### ストレージ (Storage)
**統一表記**: ストレージ / Storage

**実装**: `src/storage.ts` の `RequirementsStorage` クラス

要求データの永続化を担当するコンポーネント。

### データディレクトリ (Data Directory)
**デフォルト**: `./data`

要求データと操作ログが保存されるディレクトリ。

**主要ファイル**:
- `requirements.json`: デフォルトプロジェクトの要求データ
- `<project-id>.json`: 各プロジェクトの要求データ
- `proposals.json`: 変更提案データ
- `operation-logs.json`: 操作履歴

### 操作ログ (Operation Log)
**実装**: `src/operation-logger.ts`

MCPツールの実行履歴を記録するログ。

---

## 🔧 開発者向け用語

### レイヤードアーキテクチャ (Layered Architecture)
本システムが採用するアーキテクチャパターン。

**レイヤー構成**:
1. MCP Server Layer
2. Business Logic Layer
3. Data Access Layer
4. Persistence Layer

### トランザクション (Transaction)
ChangeSetの適用において、all-or-nothing（全て成功または全て失敗）を保証する仕組み。

### ロールバック (Rollback)
適用したChangeSetを元に戻す操作。

---

## 📝 その他

### 自動検証 (Auto Validation)
**実装**: `src/validation-service.ts` の `ValidationService` クラス

要求の追加・更新時に自動的に検証を実行する機能。

### 自動修正 (Auto Fix)
自動検証と連携して、違反を自動的に修正する機能。

### NLP (Natural Language Processing)
**統一表記**: NLP / 自然言語処理

要求の説明文を分析して品質指標を算出する技術。

**実装**: `src/validation/nlp-analyzer.ts`

### LLM (Large Language Model)
**統一表記**: LLM / 大規模言語モデル

要求の意味的検証に使用されるAIモデル。本システムではClaude (Anthropic) を使用。

**実装**: `src/validation/llm-evaluator.ts`

---

## 表記ルール

### 日本語・英語の使い分け

**基本方針**:
- ドキュメント内では日本語を優先
- 技術用語で英語が一般的なものはそのまま使用
- 初出時は「日本語 (English)」の形式で併記

**例外**:
- クラス名、関数名、ファイル名は常に英語
- コード内コメントは英語推奨、日本語も可

### 略語の扱い

**一般的な略語**:
- MCP: Model Context Protocol
- CRUD: Create, Read, Update, Delete
- MECE: Mutually Exclusive, Collectively Exhaustive
- NLP: Natural Language Processing
- LLM: Large Language Model
- UI: User Interface
- API: Application Programming Interface

**初出時は正式名称を併記**:
- ❌ MCPツールを使用
- ✅ MCP (Model Context Protocol) ツールを使用

### 統一すべき表記

| ❌ 避けるべき表記 | ✅ 推奨表記 |
|----------------|-----------|
| 要件 | 要求 |
| バリデーション | 検証 (文脈によりValidationも可) |
| リクワイアメント | 要求 / Requirement |
| バリデータ | バリデーター / Validator |
| フィックス | 修正 / Fix |
| チェンジセット | ChangeSet / 変更セット |

---

## 命名規則

### 要求ID (Requirement ID)
**形式**: `REQ-<TYPE>-<NUMBER>`

**例**:
- `REQ-SH-001`: ステークホルダ要求 001
- `REQ-SYS-042`: システム要求 042
- `REQ-FUNC-123`: システム機能要求 123

### 検証ルールID
**形式**: `<DOMAIN><NUMBER>`

**例**: `A1`, `A2`, `B1`, `C1`, `D1`, `E1`

### ファイル命名
**TypeScript**: kebab-case
- ✅ `validation-engine.ts`
- ❌ `ValidationEngine.ts`
- ❌ `validation_engine.ts`

**クラス名**: PascalCase
- ✅ `ValidationEngine`
- ❌ `validationEngine`
- ❌ `validation_engine`

**関数名・変数名**: camelCase
- ✅ `validateRequirement`
- ❌ `ValidateRequirement`
- ❌ `validate_requirement`

---

最終更新: 2025-01-08
バージョン: 1.0.0
