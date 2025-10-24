# AI Chat Assistantの改善

## 現状の課題

AI Chat Assistant（Webビューアーのチャット機能）が期待する水準に達していないため、暫定的にデフォルト非表示としました。

### 具体的な問題点

1. **意図認識の精度が不十分**
   - ユーザーの質問意図を正確に解析できないケースが多発
   - 例: "func-013のステータスを承認済にできますか？" → "question intent unclear"
   - 例: "sys-006について教えてください" → unknown tool error

2. **MCP Chat Assistantの接続エラー**
   - StdioClientTransport経由のMCP接続が失敗
   - エラー: `Cannot find module 'C:\dev\requirements-mcp-server\build\index.js'`
   - Enhanced Chat Assistantへのフォールバックは機能しているが理想的ではない

3. **Claude APIレスポンスのパース問題**
   - JSONレスポンスに説明テキストが含まれるケースがある
   - 正規表現による抽出で部分的に対処したが根本解決ではない

4. **ルールベース検出の限界**
   - IntentAnalyzerがLLM推論に失敗した場合、ルールベース検出にフォールバック
   - ルールベースでは複雑な意図やコンテキストを理解できない

## 暫定対応

- `src/view-server.ts:766` で `.chat-panel` に `display: none` を追加
- チャット機能はデフォルトで非表示（HTML構造は保持）
- ユーザーには他の方法（MCP tools経由）での要求管理を推奨

## 改善案

### 短期（P1-High）

1. **Intent Analyzerの精度向上**
   - より詳細なプロンプトエンジニアリング
   - Few-shot learningの導入（サンプル例を含める）
   - JSON mode強制（Anthropic APIの `response_format` パラメータ）

2. **MCP接続の修正**
   - StdioTransportの正しいパス設定
   - または代替手段（HTTP transport）の検討

3. **エラーハンドリングの強化**
   - より具体的なエラーメッセージをユーザーに返す
   - 失敗時の代替アクションを提案

### 中期（P2-Medium）

4. **コンテキスト保持機能**
   - 会話履歴を考慮した意図解析
   - マルチターン対話のサポート

5. **ユーザーフィードバックループ**
   - 意図解析結果をユーザーに確認
   - フィードバックを学習データとして蓄積

6. **テストカバレッジの向上**
   - 典型的な質問パターンのテストケース追加
   - 意図解析精度のベンチマーク構築

### 長期（P3-Low）

7. **RAG（Retrieval-Augmented Generation）の導入**
   - 要求データベースから関連情報を検索
   - より正確な回答生成

8. **UI/UXの改善**
   - サジェスト機能（よくある質問）
   - インタラクティブなフォーム入力支援

## 関連ファイル

- `src/view-server.ts` - Webビューアー本体
- `src/orchestrator/intent-analyzer.ts` - 意図解析エンジン
- `src/orchestrator/task-planner.ts` - タスクプランニング
- `src/orchestrator/step-executor.ts` - 実行エンジン
- `src/enhanced-chat-assistant.ts` - Enhanced Chat Assistant
- `src/mcp-chat-assistant.ts` - MCP Chat Assistant

## 受け入れ基準

チャット機能を再度有効化するには、以下の条件を満たす必要がある:

- [ ] 典型的な質問パターン（20種類以上）で90%以上の意図認識精度
- [ ] MCP接続の安定動作（エラー率5%未満）
- [ ] ユーザーからの肯定的なフィードバック
- [ ] テストカバレッジ80%以上

## 参考情報

- Anthropic Claude API: https://docs.anthropic.com/
- Model Context Protocol: https://modelcontextprotocol.io/
- Intent Classification best practices: https://platform.openai.com/docs/guides/prompt-engineering
