# GitHub Issues - 残タスク

以下のイシューをGitHubに登録してください。

---

## Issue 1: Phase 2 - ChangeSetRepositoryの実装

**Labels**: `enhancement`, `phase-2`
**Priority**: High
**Estimate**: 3-5 days

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

---

## Issue 2: Phase 2 - バックアップ機能の追加

**Labels**: `enhancement`, `phase-2`
**Priority**: Medium
**Estimate**: 2-3 days

### 概要

要求データとChangeSetの自動バックアップ機能を実装する。データ損失のリスクを最小化し、任意の時点への復元を可能にする。

### 目的

- データ損失の防止
- 任意の時点への復元機能
- 定期的な自動バックアップ

### 実装内容

#### 1. BackupService クラスの作成

```typescript
// src/services/backup-service.ts
export class BackupService {
  constructor(private dataDir: string, private backupDir: string) {}

  async createBackup(): Promise<string> // バックアップIDを返す
  async listBackups(): Promise<BackupInfo[]>
  async restore(backupId: string): Promise<void>
  async deleteBackup(backupId: string): Promise<void>
  async scheduleAutoBackup(interval: number): void
}
```

#### 2. バックアップ構造

```
./backups/
├── 2025-10-21T12-30-00Z/
│   ├── requirements.json
│   ├── changesets/
│   ├── metadata.json
│   └── checksum.sha256
└── ...
```

#### 3. 設定

```json
{
  "backup": {
    "enabled": true,
    "interval": "1h",
    "retention": 7,
    "compression": true
  }
}
```

### 受け入れ基準

- [ ] BackupServiceクラスの実装
- [ ] 自動バックアップのスケジューリング
- [ ] 復元機能の実装
- [ ] チェックサムによる整合性検証
- [ ] 圧縮オプション（.tar.gz）
- [ ] 保持期間の設定
- [ ] MCPツールへの統合（backup_now, list_backups, restore_backup）
- [ ] ユニットテストの追加

---

## Issue 3: Phase 2 - トランザクションログの実装

**Labels**: `enhancement`, `phase-2`
**Priority**: Medium
**Estimate**: 2-3 days

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

---

## Issue 4: Phase 3 - ビュー生成の差分更新

**Labels**: `enhancement`, `phase-3`, `performance`
**Priority**: Medium
**Estimate**: 3-4 days

### 概要

ビュー生成を最適化し、変更があった部分のみを再生成する。現在は毎回全ビューを再生成しており、パフォーマンスのボトルネックになる可能性がある。

### 目的

- ビュー生成時間の50%削減
- メモリ使用量の削減
- スケーラビリティの向上

### 実装内容

#### 1. キャッシュ機構

```typescript
// src/views/view-cache.ts
export class ViewCache {
  private cache: Map<string, CacheEntry>

  async get(viewName: string, hash: string): Promise<string | null>
  async set(viewName: string, hash: string, content: string): Promise<void>
  async invalidate(viewName: string): Promise<void>
  async clear(): Promise<void>
}

interface CacheEntry {
  hash: string
  content: string
  timestamp: number
}
```

#### 2. ハッシュ計算

- 要求データのハッシュ（SHA-256）
- キャッシュヒット判定
- 差分更新の判断

#### 3. ViewExporter の更新

- キャッシュチェック機構の追加
- 変更検知とスキップロジック
- メトリクスの記録

### 受け入れ基準

- [ ] ViewCacheクラスの実装
- [ ] ハッシュベースのキャッシュ判定
- [ ] ViewExporterへの統合
- [ ] パフォーマンステストの追加
- [ ] メトリクス記録（ヒット率、生成時間）
- [ ] ベンチマーク（Before/After比較）

---

## Issue 5: Phase 3 - バリデーションのバッチ処理

**Labels**: `enhancement`, `phase-3`, `performance`
**Priority**: Low
**Estimate**: 2-3 days

### 概要

複数要求のバリデーションを並列実行し、処理時間を短縮する。

### 目的

- バリデーション時間の30%削減
- リソース使用効率の向上
- 大規模データセット対応

### 実装内容

#### 1. バッチバリデーション

```typescript
// src/validation/validation-engine.ts
async validateBatch(
  requirements: Requirement[],
  options?: ValidationOptions
): Promise<Map<string, ValidationResult>>
```

#### 2. 並列実行制御

- Promise.allによる並列実行
- 同時実行数の制限（デフォルト: 10）
- エラーハンドリング

#### 3. プログレスレポート

- バリデーション進捗の報告
- MCPツールへの統合

### 受け入れ基準

- [ ] バッチバリデーションAPIの実装
- [ ] 並列実行制御
- [ ] プログレス報告機能
- [ ] パフォーマンステスト
- [ ] ベンチマーク
- [ ] 既存APIとの互換性維持

---

## Issue 6: Phase 4 - イベント駆動アーキテクチャへの移行

**Labels**: `enhancement`, `phase-4`, `architecture`
**Priority**: Low
**Estimate**: 5-7 days

### 概要

EventEmitterを導入し、コンポーネント間の疎結合を実現する。

### 目的

- 疎結合なアーキテクチャ
- 拡張性の向上
- リアクティブな処理

### 実装内容

#### 1. DomainEventEmitter

```typescript
// src/events/event-emitter.ts
export type DomainEvent =
  | { type: 'requirement.added'; requirement: Requirement }
  | { type: 'requirement.updated'; id: string; changes: Partial<Requirement> }
  | { type: 'requirement.deleted'; id: string }
  | { type: 'changeset.applied'; changeSetId: string }
  | { type: 'changeset.rolledback'; changeSetId: string }

export class DomainEventEmitter extends EventEmitter {
  emit(event: DomainEvent['type'], ...args: any[]): boolean
  on(event: DomainEvent['type'], listener: (...args: any[]) => void): this
}
```

#### 2. イベントハンドラー

- ViewExporter: requirement.* イベントをリッスン
- OperationLogger: すべてのイベントをリッスン
- ValidationEngine: requirement.* イベントをリッスン

#### 3. 移行戦略

- 段階的な移行（既存コードとの併存）
- イベント駆動とコールバックの両方をサポート
- テストの追加

### 受け入れ基準

- [ ] DomainEventEmitterの実装
- [ ] イベント型定義の完成
- [ ] 主要コンポーネントのリスナー実装
- [ ] Storage からのイベント発火
- [ ] 既存機能の維持
- [ ] 統合テストの追加
- [ ] ドキュメント更新

---

## Issue 7: Phase 4 - 依存性注入の改善

**Labels**: `enhancement`, `phase-4`, `architecture`
**Priority**: Low
**Estimate**: 3-4 days

### 概要

コンストラクタ注入とファクトリーパターンを導入し、テスタビリティを向上させる。

### 目的

- テストの容易性
- モック作成の簡略化
- 設定の外部化

### 実装内容

#### 1. Dependencies インターフェース

```typescript
// src/common/container.ts
interface Dependencies {
  storage: RequirementsStorage
  analyzer: ImpactAnalyzer
  validator: RequirementValidator
  fixExecutor?: FixExecutor
  changeEngine: ChangeEngine
  eventEmitter: DomainEventEmitter
}
```

#### 2. ファクトリー関数

```typescript
function createServer(config?: Partial<Config>): RequirementsMCPServer {
  const dataDir = config?.dataDir || './data'
  const storage = new RequirementsStorage(dataDir)
  const analyzer = new ImpactAnalyzer(storage)
  // ...
  return new RequirementsMCPServer({ storage, analyzer, ... })
}
```

#### 3. 設定の外部化

- config/default.json
- 環境変数オーバーライド
- Config インターフェース

### 受け入れ基準

- [ ] Dependencies インターフェースの定義
- [ ] ファクトリー関数の実装
- [ ] 設定ファイルの導入
- [ ] RequirementsMCPServer のコンストラクタ更新
- [ ] ユニットテストでのモック使用例
- [ ] ドキュメント更新

---

## Issue 8: Phase 4 - 設定管理の外部化

**Labels**: `enhancement`, `phase-4`, `configuration`
**Priority**: Low
**Estimate**: 2-3 days

### 概要

設定をJSONファイルに外部化し、環境変数によるオーバーライドをサポートする。

### 実装内容

#### 1. 設定ファイル

```json
// config/default.json
{
  "server": {
    "name": "requirements-mcp-server",
    "version": "1.0.0"
  },
  "storage": {
    "dataDir": "./data",
    "autoSave": true,
    "backupEnabled": true
  },
  "validation": {
    "autoValidate": true,
    "useLLM": false,
    "updateMetrics": true
  },
  "fixEngine": {
    "defaultPolicy": "./fix-policy.jsonc",
    "maxIterations": 10
  },
  "logging": {
    "level": "INFO",
    "format": "json"
  }
}
```

#### 2. Config型定義

```typescript
// src/config/config.ts
export interface Config {
  server: ServerConfig
  storage: StorageConfig
  validation: ValidationConfig
  fixEngine: FixEngineConfig
  logging: LoggingConfig
}
```

#### 3. 環境変数マッピング

- `DATA_DIR` → storage.dataDir
- `LOG_LEVEL` → logging.level
- `LOG_FORMAT` → logging.format

### 受け入れ基準

- [ ] config/default.json の作成
- [ ] Config型定義
- [ ] loadConfig() 関数の実装
- [ ] 環境変数オーバーライドのサポート
- [ ] 既存コードの設定値を外部化
- [ ] ドキュメント更新

---

## 登録方法

各イシューをGitHubで以下の手順で作成してください：

1. https://github.com/sawadari/requirements-mcp-server/issues/new
2. タイトルと本文をコピー＆ペースト
3. ラベルを設定
4. Submit

または、GitHub CLIを使用：

```bash
gh issue create --title "Issue Title" --body "Issue Body" --label "label1,label2"
```

---

最終更新: 2025-10-21
