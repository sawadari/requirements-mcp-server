# Requirements Chat - ロードマップ

## 🎯 ビジョン

**「Webビューアー上で `npx requirements-chat` が動作しているような体験」**

ユーザーが自然言語で要求を指示するだけで、MCPサーバーとAIが協調して：
- 要求ツリーの自動生成
- 依存関係の自動設定
- 妥当性チェック＆自動修正
- すべてを完了してレポート表示

## 📊 現状（2025-10-24）

### ✅ 完了

1. **アーキテクチャ設計** (`docs/REQUIREMENTS-CHAT-ARCHITECTURE.md`)
   - 3層アーキテクチャ（MCP / AI Orchestration / UI）
   - 詳細な実行フローとコンポーネント設計

2. **実装ガイド** (`docs/IMPLEMENTATION-GUIDE.md`)
   - 各Phaseの具体的な実装手順
   - コード例とテスト戦略

3. **既存AI Chat機能** (`src/ai-chat-assistant.ts`)
   - 基本的な会話機能
   - 単一要求の追加（`add_requirement` ツール）

### ⏳ 進行中

1. **MCPツールの追加**
   - ValidationTools（妥当性チェック）
   - BatchTools（一括操作）
   - 型定義の修正中

### 🔜 未着手

1. **AI Orchestration Layer**
   - IntentAnalyzer
   - TaskPlanner
   - StepExecutor

2. **CLI Tool**
   - 対話モード
   - 単発実行

3. **Web統合**
   - Orchestrator統合
   - ストリーミング応答

## 📅 実装スケジュール

### Week 1-2: Phase 1 - MCP Layer強化

**目標**: MCPサーバーに必要なツールを完全実装

- [ ] **Day 1-2**: ValidationToolsの完成
  - 既存ValidationEngineとの統合
  - 型エラーの解決
  - ユニットテスト作成

- [ ] **Day 3-4**: BatchToolsの完成
  - 一括追加機能
  - 依存関係設定機能
  - 要求ツリー作成機能

- [ ] **Day 5-7**: index.tsへの統合
  - 新ツールのMCP登録
  - エンドツーエンドテスト
  - ビルド＆デプロイ確認

**成功基準**:
- ✅ `npm run build` が成功
- ✅ すべての新ツールがMCPから呼び出し可能
- ✅ ユニットテストカバレッジ > 80%

### Week 3-4: Phase 2 - AI Orchestration Layer

**目標**: 意図分析とタスク自動実行の実装

- [ ] **Day 8-10**: IntentAnalyzerの実装
  - Claude APIによる意図分析
  - 6種類のIntent対応（add_requirement, add_tree, validate, search, analyze, fix）
  - 精度テスト（confidence > 0.7）

- [ ] **Day 11-13**: TaskPlannerの実装
  - IntentからExecutionPlan生成
  - ステップ依存関係の定義
  - 実行時間の推定

- [ ] **Day 14-17**: StepExecutorの実装
  - MCPツール呼び出し
  - AI生成（Claude API）
  - エラーハンドリング＆リトライ

- [ ] **Day 18-21**: ContextManagerの実装
  - 会話履歴管理
  - 作成要求のトラッキング
  - 検証結果の保存

**成功基準**:
- ✅ 「ステークホルダ要求を追加」で要求ツリーが自動生成される
- ✅ 妥当性チェック＆自動修正が動作
- ✅ 実行時間 < 60秒

### Week 5-6: Phase 3 - CLI Tool

**目標**: `npx requirements-chat` の実装

- [ ] **Day 22-24**: CLIフレームワークのセットアップ
  - `commander`, `inquirer`, `chalk`, `ora` のインストール
  - エントリポイント作成（`bin/requirements-chat.ts`）
  - package.jsonの設定

- [ ] **Day 25-28**: 対話モードの実装
  - REPL（Read-Eval-Print Loop）
  - Markdownレンダリング
  - 進捗表示（スピナー、プログレスバー）

- [ ] **Day 29-30**: 単発実行モードの実装
  - コマンドライン引数パース
  - JSON出力オプション
  - ヘルプ・バージョン表示

**成功基準**:
- ✅ `npx requirements-chat` で対話モード起動
- ✅ `npx requirements-chat "要求を追加"` で単発実行
- ✅ カラー出力とMarkdownレンダリングが正しく動作

### Week 7-8: Phase 4 - Web統合

**目標**: WebビューアーにOrchestrator統合

- [ ] **Day 31-33**: view-server.tsの拡張
  - EnhancedAIChatAssistantの統合
  - `/api/chat` エンドポイントの強化

- [ ] **Day 34-36**: ストリーミング応答対応
  - Server-Sent Events（SSE）の実装
  - リアルタイム進捗表示

- [ ] **Day 37-40**: UI/UXの改善
  - 進捗バー（Web版）
  - 実行計画の表示
  - 確認ダイアログ

**成功基準**:
- ✅ Webチャットで要求ツリー作成が動作
- ✅ リアルタイムで進捗が表示される
- ✅ ユーザー体験が直感的

### Week 9-10: Phase 5 - テスト＆ドキュメント

**目標**: 品質保証とドキュメント整備

- [ ] **Day 41-45**: テスト作成
  - ユニットテスト（全コンポーネント）
  - 統合テスト（E2Eシナリオ）
  - パフォーマンステスト

- [ ] **Day 46-50**: ドキュメント作成
  - ユーザーガイド
  - APIリファレンス
  - トラブルシューティング

**成功基準**:
- ✅ テストカバレッジ > 80%
- ✅ すべてのE2Eシナリオがパス
- ✅ ドキュメントが完備

## 🎯 マイルストーン

### M1: MCP Layer完成（Week 2終了時）
- MCPサーバーが全ツールをサポート
- 既存機能との互換性維持

### M2: AI Orchestrator動作（Week 4終了時）
- 意図分析＆タスク自動実行が動作
- 要求ツリー作成のデモが可能

### M3: CLI Tool公開（Week 6終了時）
- `npx requirements-chat` がnpmで公開可能
- 対話モードが安定動作

### M4: Web統合完了（Week 8終了時）
- Webビューアー上でClaude Codeのような体験
- ストリーミング応答対応

### M5: リリース準備完了（Week 10終了時）
- すべてのテストがパス
- ドキュメント完備
- v1.0.0リリース

## 📈 成功指標（KPI）

### 機能性
- ✅ 要求ツリー作成成功率 > 95%
- ✅ 妥当性チェック精度 > 90%
- ✅ 自動修正成功率 > 80%

### パフォーマンス
- ✅ 単一要求追加 < 5秒
- ✅ 要求ツリー作成 < 60秒
- ✅ 妥当性チェック（全要求） < 30秒

### ユーザー体験
- ✅ 意図分析精度 > 90%
- ✅ ユーザー満足度 > 4.0/5.0
- ✅ エラー率 < 5%

## 🔧 技術的負債と改善項目

### 短期（Week 1-4）
1. ValidationToolsの型定義修正
2. BatchToolsのエラーハンドリング強化
3. 既存コードとの統合テスト

### 中期（Week 5-8）
4. 並列実行の最適化
5. キャッシング機構の実装
6. ストリーミング応答の安定化

### 長期（Week 9以降）
7. LLM Evaluatorの統合（より高精度な検証）
8. マルチ言語対応（英語・日本語）
9. プラグインアーキテクチャ（カスタムツール追加）

## 🚀 次の具体的なアクション

### 今すぐできること

1. **ValidationToolsの完成**
   ```bash
   cd requirements-mcp-server
   # 型エラーを修正
   npm run build
   npm test
   ```

2. **IntentAnalyzerのプロトタイプ作成**
   ```bash
   mkdir -p src/orchestrator
   # intent-analyzer.ts を作成
   # 簡単な意図分析をテスト
   ```

3. **CLIのセットアップ**
   ```bash
   npm install commander inquirer chalk ora marked-terminal
   mkdir -p bin
   # requirements-chat.ts を作成
   ```

### 推奨する実装順序

**最初のプロトタイプ（1-2日で動くもの）**:
1. ValidationToolsを最小限の機能で実装
2. IntentAnalyzerで「add_requirement」のみ対応
3. TaskPlannerで単純な2-3ステッププラン
4. 既存AI Chat Assistantに統合

→ **これで「要求追加」の基本フローが動く**

**次のイテレーション（3-5日）**:
1. add_tree インテント対応
2. 要求ツリー作成の自動化
3. 妥当性チェック統合

→ **これで「要求ツリー自動生成」が動く**

**完成形（2-3週間）**:
1. すべてのインテント対応
2. CLI Tool実装
3. Web統合＆ストリーミング
4. テスト＆ドキュメント

## 💡 よくある質問（FAQ）

### Q1: 既存の機能に影響はありますか？
A: いいえ。新しい機能は既存のMCPツールやAI Chatに追加される形です。後方互換性を維持します。

### Q2: どのAIモデルを使いますか？
A:
- 意図分析: Claude 3.5 Haiku（高速・低コスト）
- 要求生成: Claude 3.5 Sonnet（高品質）
- 計画作成: Claude 3.5 Sonnet

### Q3: コストはどのくらいかかりますか？
A:
- 要求ツリー作成（1回）: 約$0.10-0.20
- 妥当性チェック（全要求）: 約$0.05-0.10
- 対話（1ターン）: 約$0.01-0.05

### Q4: オフラインでも動作しますか？
A: 一部機能のみ。MCPツール（CRUD、検証）はオフラインで動作しますが、AI機能（意図分析、要求生成）にはインターネット接続が必要です。

### Q5: カスタムツールを追加できますか？
A: Phase 5以降でプラグインアーキテクチャを実装予定です。それまでは直接コードを修正してください。

## 📞 サポート

- **Issue**: [GitHub Issues](https://github.com/your-repo/requirements-mcp-server/issues)
- **Discussion**: [GitHub Discussions](https://github.com/your-repo/requirements-mcp-server/discussions)
- **Email**: your-email@example.com

---

**最終更新**: 2025-10-24
**バージョン**: 1.0
**ステータス**: Active Development
