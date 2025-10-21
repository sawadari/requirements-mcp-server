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

**Labels**: `enhancement`, `phase-4`, `configuration`
**Priority**: Low
**Estimate**: 2-3 days
