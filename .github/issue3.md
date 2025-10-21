### 概要

すべての変更操作をトランザクションログに記録し、監査証跡とデバッグ情報を提供する。

### 目的

- 完全な監査証跡
- 変更履歴の追跡
- デバッグとトラブルシューティングの支援

### 実装内容

#### 1. TransactionLogger クラスの作成

```typescript
// src/services/transaction-logger.ts
export class TransactionLogger {
  async logTransaction(tx: Transaction): Promise<void>
  async getTransactions(filter: TransactionFilter): Promise<Transaction[]>
  async getTransactionById(id: string): Promise<Transaction | null>
  async replay(fromTimestamp: Date, toTimestamp: Date): Promise<void>
}

interface Transaction {
  id: string
  timestamp: string
  type: 'requirement' | 'changeset' | 'validation'
  operation: 'create' | 'update' | 'delete' | 'apply' | 'rollback'
  userId?: string
  before?: any
  after?: any
  metadata?: Record<string, any>
}
```

#### 2. ログ構造

```
./data/
├── transactions/
│   ├── 2025-10-21.jsonl  // 行区切りJSON
│   ├── 2025-10-22.jsonl
│   └── ...
```

#### 3. 統合ポイント

- Storage: add/update/delete時にログ記録
- ChangeEngine: apply/rollback時にログ記録
- ValidationEngine: バリデーション実行時にログ記録

### 受け入れ基準

- [ ] TransactionLoggerクラスの実装
- [ ] JSONL形式での追記型ログ
- [ ] トランザクション検索機能
- [ ] リプレイ機能（オプション）
- [ ] ログローテーション
- [ ] 既存コンポーネントへの統合
- [ ] ユニットテストの追加

**Labels**: `enhancement`, `phase-2`
**Priority**: Medium
**Estimate**: 2-3 days
