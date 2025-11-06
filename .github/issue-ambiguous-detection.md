# P0: 曖昧語検出と具体化提案機能の実装

## 概要

ブログ記事で詳述している「曖昧語の自動検出と具体化提案」機能を実装し、要求品質を機械的に向上させる。

## 背景

ランディングページとブログ記事で以下を謳っているが未実装:
- 曖昧語（「なるべく」「適切に」「十分な」など）の自動検出
- 具体化提案の生成
- Before/Afterの差分表示

## 目的

要求記述の曖昧性を排除し、テスト可能な具体的な要求に自動変換する。

## 実装内容

### 新規ツール (2個)

#### 1. `detect_ambiguous_terms`
**説明:** 要求内の曖昧な表現を検出する

**入力:**
- `requirementId`: 検査対象の要求ID

**出力:**
```json
{
  "requirementId": "REQ-001",
  "ambiguousTerms": [
    {
      "term": "適切なタイミングで",
      "position": { "start": 15, "end": 24 },
      "severity": "high",
      "reason": "時間条件が不明確"
    }
  ]
}
```

#### 2. `suggest_clarification`
**説明:** 曖昧語の具体化提案を生成する

**入力:**
- `requirementId`: 対象の要求ID
- `ambiguousTerm`: 曖昧語（省略時は全て）

**出力:**
```json
{
  "requirementId": "REQ-001",
  "suggestions": [
    {
      "original": "適切なタイミングで",
      "suggested": "データ更新から5分以内に",
      "reason": "時間条件を具体化",
      "confidence": 0.85
    }
  ],
  "preview": {
    "before": "システムは、適切なタイミングでユーザーに通知を送信する",
    "after": "システムは、データ更新から5分以内にユーザーにプッシュ通知を送信する"
  }
}
```

### 検出対象の曖昧語

**時間表現:**
- なるべく早く、適宜、適時、適切なタイミングで

**程度表現:**
- 十分な、適切な、必要に応じて、可能な限り

**列挙の不完全性:**
- など、等、...

**条件の不明確:**
- 必要に応じて、場合によっては

### 具体化ルール

1. **時間表現** → 具体的な秒数/分数
2. **程度表現** → 数値基準
3. **列挙** → 完全な列挙または条件指定
4. **条件** → if-then形式で明確化

## ValidationEngineとの統合

既存の `ValidationEngine` に新しい検査ルールを追加:

```typescript
async detectAmbiguity(requirement: Requirement): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  const ambiguousPatterns = [
    { pattern: /なるべく|できれば/g, severity: 'high' },
    { pattern: /適切|十分な|必要に応じて/g, severity: 'medium' },
    { pattern: /など|等|\.\.\.$/g, severity: 'low' }
  ];

  // 検出ロジック...

  return issues;
}
```

## 受け入れ基準

- [ ] `detect_ambiguous_terms` ツールが実装され、20種類以上の曖昧表現を検出可能
- [ ] `suggest_clarification` ツールが具体化提案を生成
- [ ] Before/After差分がわかりやすく表示される
- [ ] 既存の `validate_requirement` で曖昧語検出が実行される
- [ ] テストカバレッジ90%以上
- [ ] 扇風機プロジェクトで動作確認（例: "いい感じにする" を検出）

## 推定作業時間

2-3日

## 関連Issue

- #17 (TDD)
- ブログ記事: 「要求の"自動修正"を安全に回すコツ」

## 実装例

```typescript
// 使用例
const result = await server.callTool('detect_ambiguous_terms', {
  requirementId: 'STK-001'
});

// 曖昧語が検出された場合
const suggestions = await server.callTool('suggest_clarification', {
  requirementId: 'STK-001'
});

// 提案を確認してから適用
await server.callTool('update_requirement', {
  id: 'STK-001',
  description: suggestions.preview.after
});
```
