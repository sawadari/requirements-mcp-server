# P0: テスト連携基盤の実装

## 概要

ブログ記事で言及している「テスト管理との連携」機能を実装し、要求→テストのトレーサビリティを自動維持する。

## 背景

ブログ記事「要求の"自動修正"を安全に回すコツ」で以下を謳っているが未実装:
- 受入条件の自動抽出
- テストIDの紐付け
- 影響範囲の通知（要求変更時、関連テストに自動通知）

ランディングページでも「テスト可能性」を品質5原則の一つとして強調。

## 目的

要求とテストケースを自動リンクし、変更の影響範囲を即座に把握できるようにする。

## 実装内容

### 新規ツール (3個)

#### 1. `extract_acceptance_criteria`
**説明:** 要求から観測可能な受入条件を抽出する

**入力:**
- `requirementId`: 対象の要求ID

**出力:**
```json
{
  "requirementId": "REQ-001",
  "acceptanceCriteria": [
    {
      "id": "AC-001",
      "description": "データ更新から5分以内に通知が送信される",
      "testable": true,
      "measurable": true,
      "suggestedTestCase": "通知送信時間を計測し、5分以内であることを確認"
    }
  ]
}
```

#### 2. `link_test_cases`
**説明:** 要求とテストケースを紐付ける

**入力:**
- `requirementId`: 要求ID
- `testCaseIds`: テストケースIDリスト

**出力:**
```json
{
  "requirementId": "REQ-001",
  "linkedTests": ["TEST-001", "TEST-002"],
  "coverage": "100%"
}
```

#### 3. `notify_test_impact`
**説明:** 要求変更時に関連テストへ影響を通知する

**入力:**
- `requirementId`: 変更された要求ID
- `changeType`: 変更種別（update/delete）

**出力:**
```json
{
  "requirementId": "REQ-001",
  "affectedTests": [
    {
      "testId": "TEST-001",
      "impact": "high",
      "reason": "受入条件が変更されたためテストケースの更新が必要",
      "suggestedAction": "テストケースの実行条件を5分以内に変更"
    }
  ],
  "notificationsSent": 2
}
```

### データモデル拡張

#### Requirement に追加
```typescript
interface Requirement {
  // 既存フィールド...
  acceptanceCriteria?: AcceptanceCriterion[];
  linkedTests?: string[];
  testCoverage?: number; // 0-100
}

interface AcceptanceCriterion {
  id: string;
  description: string;
  testable: boolean;
  measurable: boolean;
  linkedTestCases: string[];
}
```

### 自動通知の仕組み

`update_requirement` / `delete_requirement` 実行時に自動的に `notify_test_impact` を呼び出す。

### Webビューアー統合

要求詳細画面に以下を追加:
- 受入条件一覧
- リンクされたテストケース一覧
- テストカバレッジ表示

## 受け入れ基準

- [ ] 3つのツールが実装されている
- [ ] 要求データモデルに acceptanceCriteria / linkedTests が追加されている
- [ ] update_requirement 実行時に自動的に影響通知が送信される
- [ ] Webビューアーに受入条件・テストリンク表示が追加されている
- [ ] テストカバレッジの計算が正しい
- [ ] テストカバレッジ90%以上
- [ ] 扇風機プロジェクトで動作確認

## 推定作業時間

1週間

## 関連Issue

- #17 (TDD)
- ブログ記事: 「要求の"自動修正"を安全に回すコツ」

## 実装例

```typescript
// 1. 受入条件を抽出
const criteria = await server.callTool('extract_acceptance_criteria', {
  requirementId: 'REQ-001'
});

// 2. テストケースを紐付け
const linked = await server.callTool('link_test_cases', {
  requirementId: 'REQ-001',
  testCaseIds: ['TEST-001', 'TEST-002']
});

// 3. 要求変更時に自動通知
const updated = await server.callTool('update_requirement', {
  id: 'REQ-001',
  description: '新しい説明'
});
// → notify_test_impact が自動実行される
```
