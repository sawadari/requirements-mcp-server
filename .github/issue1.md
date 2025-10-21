### 概要

ChangeSetの永続化とライフサイクル管理を実装する。現在はメモリ内のみで管理されており、サーバー再起動で消失してしまう。

### 目的

- ChangeSetの永続化
- 履歴管理と監査証跡
- 長期的なトレーサビリティの確保

### 実装内容

#### 1. ChangeSetRepository クラスの作成

```typescript
// src/repositories/changeset-repository.ts
export class ChangeSetRepository {
  constructor(private dataDir: string) {}

  async save(changeSet: ChangeSet): Promise<void>
  async findById(id: string): Promise<ChangeSet | null>
  async findAll(): Promise<ChangeSet[]>
  async findByStatus(status: ChangeSetStatus): Promise<ChangeSet[]>
  async delete(id: string): Promise<void>
  async update(id: string, updates: Partial<ChangeSet>): Promise<ChangeSet | null>
}
```

#### 2. ディレクトリ構造

```
./data/
├── changesets/
│   ├── CS-001.json
│   ├── CS-002.json
│   └── ...
├── requirements.json
└── proposals.json
```

#### 3. 統合

- `src/index.ts` の `changeSets: Map` を `ChangeSetRepository` に置き換え
- MCPツール（preview_fixes, apply_fixes, rollback_fixes）の更新

### 受け入れ基準

- [ ] ChangeSetRepositoryクラスの実装
- [ ] ファイルベースの永続化
- [ ] CRUD操作の完全実装
- [ ] 既存のMCPツールとの統合
- [ ] ユニットテストの追加（10+テスト）
- [ ] TypeScript strict mode対応
- [ ] エラーハンドリングの実装

### 関連ドキュメント

- [ARCHITECTURE-IMPROVEMENTS.md](./ARCHITECTURE-IMPROVEMENTS.md) - Phase 2
- [ARCHITECTURE.md](./ARCHITECTURE.md) - Data Access Layer

**Labels**: `enhancement`, `phase-2`
**Priority**: High
**Estimate**: 3-5 days
