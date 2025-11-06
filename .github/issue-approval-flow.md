# P0: Human-in-the-loop 承認フロー機能の実装

## 概要

ランディングページとブログ記事で強調している「AI提案 → 人間承認 → 自動適用」のワークフローを実装する。

## 背景

ランディングページで以下を謳っているが未実装:
- AI → 修正案 / 人 → 承認/差戻し
- 承認後はトレース更新・差分記録を自動で反映
- 修正差分・理由・影響範囲を保持

ブログ記事「要求の"自動修正"を安全に回すコツ」でも3ステップとして詳述。

## 目的

自動修正の安全性を担保し、説明責任を果たせる承認プロセスを確立する。

## 実装内容

### 新規ツール (3個)

#### 1. `submit_for_approval`
**説明:** 修正案を承認待ち状態にする

**入力:**
- `changeSetId`: 修正セットID（preview_fixesの結果）
- `reason`: 修正理由
- `reviewer?`: レビュアー（省略時は要求のassignee）

**出力:**
```json
{
  "approvalId": "APR-001",
  "changeSetId": "CS-001",
  "status": "pending_approval",
  "submittedAt": "2024-10-26T10:00:00Z",
  "reviewer": "user@example.com",
  "changes": [
    {
      "requirementId": "REQ-001",
      "field": "description",
      "before": "適切なタイミングで通知",
      "after": "データ更新から5分以内に通知",
      "reason": "曖昧語の具体化"
    }
  ],
  "impactAnalysis": {
    "affectedRequirements": 3,
    "affectedTests": 5,
    "riskLevel": "low"
  }
}
```

#### 2. `approve_changes`
**説明:** 承認待ちの修正を承認し適用する

**入力:**
- `approvalId`: 承認ID
- `comment?`: 承認コメント

**出力:**
```json
{
  "approvalId": "APR-001",
  "status": "approved",
  "appliedAt": "2024-10-26T10:05:00Z",
  "changesApplied": 3,
  "traceabilityUpdated": true,
  "changeLog": {
    "version": "1.1.0",
    "changes": [
      {
        "requirementId": "REQ-001",
        "changeType": "clarification",
        "approvedBy": "user@example.com"
      }
    ]
  }
}
```

#### 3. `reject_changes`
**説明:** 承認待ちの修正を差戻す

**入力:**
- `approvalId`: 承認ID
- `reason`: 差戻し理由

**出力:**
```json
{
  "approvalId": "APR-001",
  "status": "rejected",
  "rejectedAt": "2024-10-26T10:03:00Z",
  "reason": "具体化の提案が不適切",
  "changeSetRolledBack": false
}
```

### データモデル拡張

#### ApprovalRequest
```typescript
interface ApprovalRequest {
  id: string;
  changeSetId: string;
  status: 'pending_approval' | 'approved' | 'rejected';
  submittedBy: string;
  submittedAt: string;
  reviewer: string;
  changes: Change[];
  impactAnalysis: ImpactAnalysis;
  approvedAt?: string;
  rejectedAt?: string;
  comment?: string;
}

interface Change {
  requirementId: string;
  field: string;
  before: string;
  after: string;
  reason: string;
}
```

### 承認フロー

```
1. preview_fixes → ChangeSet生成
2. submit_for_approval → ApprovalRequest作成（status: pending_approval）
3a. approve_changes → apply_fixes実行 → status: approved
3b. reject_changes → status: rejected
```

### Webビューアー統合

`src/view-server.ts` に承認UI追加:
- 承認待ち一覧表示
- Before/After差分表示
- 影響範囲表示
- 承認/差戻しボタン

## 受け入れ基準

- [ ] 3つのツール（submit/approve/reject）が実装されている
- [ ] ApprovalRequestのデータ永続化が実装されている
- [ ] Webビューアーに承認UI（一覧・詳細・差分表示）が追加されている
- [ ] 承認後に自動的にトレーサビリティが更新される
- [ ] 変更履歴に承認者・承認日時が記録される
- [ ] テストカバレッジ90%以上
- [ ] 扇風機プロジェクトで動作確認

## 推定作業時間

1週間

## 関連Issue

- #17 (TDD)
- ブログ記事: 「要求の"自動修正"を安全に回すコツ」

## 実装例

```typescript
// 1. 修正プレビュー
const preview = await server.callTool('preview_fixes', {});

// 2. 承認申請
const approval = await server.callTool('submit_for_approval', {
  changeSetId: preview.id,
  reason: '曖昧語の具体化'
});

// 3a. 承認（人間の判断）
const result = await server.callTool('approve_changes', {
  approvalId: approval.approvalId,
  comment: 'LGTM'
});

// 3b. 差戻し
const rejected = await server.callTool('reject_changes', {
  approvalId: approval.approvalId,
  reason: '提案が不適切'
});
```
