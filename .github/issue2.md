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

**Labels**: `enhancement`, `phase-2`
**Priority**: Medium
**Estimate**: 2-3 days
