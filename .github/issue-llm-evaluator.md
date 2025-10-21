### 概要

LLM Evaluatorの実際のLLM呼び出し機能を実装する。現在は6つのメソッドがTODOとして未実装状態で、LLM評価機能が動作しない。

### 目的

- バリデーションにLLMによる意味的評価を導入
- 要求の品質を自動評価
- より高度な整合性チェックの実現

### 現状の問題

```typescript
// src/validation/llm-evaluator.ts
// TODO: 実際のLLM呼び出しを実装
throw new Error('LLM評価は未実装です');
```

**問題**: 以下の6つのメソッドが未実装
1. `evaluateAbstractionConsistency` - 抽象度の一貫性評価
2. `evaluateParentChildConcreteness` - 親子具体化度評価
3. `evaluateSiblingOverlap` - 兄弟要求の重複評価
4. `evaluateDependencyNecessity` - 依存関係の必要性評価
5. `evaluateCompleteness` - 要求の完全性評価
6. `suggestImprovement` - 改善提案

### 実装内容

#### 1. LLMクライアントの統合

- Anthropic Claude API の統合
- プロンプトテンプレートの実装
- レスポンスのパース処理

#### 2. 各評価メソッドの実装

```typescript
static async evaluateAbstractionConsistency(
  req: Requirement,
  siblings: Requirement[]
): Promise<{
  consistent: boolean;
  issues: string[];
  recommendations: string[];
}> {
  const prompt = LLMPrompts.abstractionConsistency(req, siblings);
  const response = await this.callLLM(prompt);
  return JSON.parse(response);
}
```

#### 3. エラーハンドリング

- API呼び出しの失敗時の処理
- レート制限の考慮
- タイムアウト処理

#### 4. 設定

- API Keyの環境変数管理
- LLM評価の有効/無効切り替え
- モデル選択（claude-3-5-sonnet等）

### 受け入れ基準

- [ ] LLMクライアントの実装
- [ ] 6つの評価メソッドの完全実装
- [ ] プロンプトテンプレートの作成
- [ ] エラーハンドリングの実装
- [ ] 環境変数による設定管理
- [ ] ユニットテスト（モックLLMを使用）
- [ ] 統合テスト（実際のLLM呼び出し）
- [ ] ドキュメント更新

### 技術的考慮事項

- **API Key管理**: 環境変数 `ANTHROPIC_API_KEY`
- **コスト**: API呼び出しコストの見積もり
- **キャッシング**: 同一評価のキャッシュ機構
- **フォールバック**: LLM利用不可時の動作

### 関連ファイル

- `src/validation/llm-evaluator.ts:232-356` - 未実装メソッド
- `src/validation/llm-prompts.ts` - プロンプトテンプレート

**Labels**: `enhancement`, `feature`, `llm`, `validation`
**Priority**: Medium
**Estimate**: 3-5 days
