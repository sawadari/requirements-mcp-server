# アーキテクチャ改善提案

## 現状分析

### 強み ✅

1. **明確なレイヤー分離**
   - MCP Server、Business Logic、Data Accessの3層構造
   - 各層の責務が明確

2. **拡張性の高い設計**
   - Fix Engineのプラグイン可能な構造
   - バリデーターの追加が容易

3. **トランザクション保証**
   - ChangeSetの適用・ロールバックが完全に可逆
   - all-or-nothingの保証

4. **包括的なテスト**
   - 20テスト、100%合格
   - トランザクション、グラフ、分割/統合を網羅

### 改善点 ⚠️

## 1. 型システムの洗練

### 現状の問題

```typescript
// src/index.ts
const reqRecord = Object.fromEntries(requirements.map((r: Requirement) => [r.id, r as any]));
```

**問題**: `as any` による型安全性の損失

### 改善案

```typescript
// src/fix-engine/types.ts に追加
export type RequirementRecord = Record<ReqID, Requirement>;

// 型安全なヘルパー関数を追加
export function toRequirementRecord(requirements: Requirement[]): RequirementRecord {
  return Object.fromEntries(
    requirements.map(r => [r.id, r])
  ) as RequirementRecord;
}

// 使用例
const reqRecord = toRequirementRecord(requirements);
```

**効果**:
- 型安全性の向上
- コードの可読性向上
- IDEの補完サポート強化

## 2. エラーハンドリングの統一

### 現状の問題

複数のエラーハンドリングパターンが混在:

```typescript
// パターン1: try-catchで捕捉
try {
  await this.storage.updateRequirement(id, req);
} catch (error: any) {
  return { success: false, error: error.message };
}

// パターン2: Result型のような返却値
const result = await this.changeEngine.apply(changeSet, reqRecord);
if (!result.success) {
  // エラー処理
}
```

### 改善案

**Result型パターンの導入**:

```typescript
// src/common/result.ts
export type Result<T, E = Error> =
  | { success: true; value: T }
  | { success: false; error: E };

export function Ok<T>(value: T): Result<T, never> {
  return { success: true, value };
}

export function Err<E>(error: E): Result<never, E> {
  return { success: false, error };
}

// 使用例
async function updateRequirement(id: string, updates: Partial<Requirement>): Promise<Result<Requirement, string>> {
  try {
    const updated = await this.storage.updateRequirement(id, updates);
    if (!updated) {
      return Err(`Requirement ${id} not found`);
    }
    return Ok(updated);
  } catch (error: any) {
    return Err(error.message);
  }
}
```

**効果**:
- エラーハンドリングの一貫性
- 型安全なエラー処理
- より明示的なAPI

## 3. 依存性注入の改善

### 現状の問題

```typescript
class RequirementsMCPServer {
  constructor() {
    this.storage = new RequirementsStorage('./data');
    this.analyzer = new ImpactAnalyzer(this.storage);
    // 依存関係がハードコーディング
  }
}
```

**問題**:
- テスタビリティの低下
- モックの作成が困難
- 設定変更時に再ビルドが必要

### 改善案

```typescript
// src/common/container.ts
interface Dependencies {
  storage: RequirementsStorage;
  analyzer: ImpactAnalyzer;
  validator: RequirementValidator;
  fixExecutor?: FixExecutor;
  changeEngine: ChangeEngine;
}

class RequirementsMCPServer {
  constructor(private deps: Dependencies) {
    // 依存性を注入
  }
}

// ファクトリー関数
function createServer(config?: Partial<Config>): RequirementsMCPServer {
  const dataDir = config?.dataDir || './data';
  const storage = new RequirementsStorage(dataDir);
  const analyzer = new ImpactAnalyzer(storage);
  const validator = new RequirementValidator(storage);
  const changeEngine = new ChangeEngine();

  return new RequirementsMCPServer({
    storage,
    analyzer,
    validator,
    changeEngine,
  });
}
```

**効果**:
- テストが容易
- モックの差し替え可能
- 設定の外部化

## 4. ChangeSet管理の改善

### 現状の問題

```typescript
private changeSets: Map<string, ChangeSet> = new Map();
```

**問題**:
- メモリ内のみで管理（サーバー再起動で消失）
- 永続化されない
- 履歴管理がない

### 改善案

**ChangeSetRepository の導入**:

```typescript
// src/repositories/changeset-repository.ts
export class ChangeSetRepository {
  constructor(private dataDir: string) {}

  async save(changeSet: ChangeSet): Promise<void> {
    const filePath = path.join(this.dataDir, 'changesets', `${changeSet.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(changeSet, null, 2));
  }

  async findById(id: string): Promise<ChangeSet | null> {
    const filePath = path.join(this.dataDir, 'changesets', `${id}.json`);
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  async findAll(): Promise<ChangeSet[]> {
    const dir = path.join(this.dataDir, 'changesets');
    const files = await fs.readdir(dir);
    const changeSets = await Promise.all(
      files
        .filter(f => f.endsWith('.json'))
        .map(f => this.findById(path.basename(f, '.json')))
    );
    return changeSets.filter((cs): cs is ChangeSet => cs !== null);
  }

  async delete(id: string): Promise<void> {
    const filePath = path.join(this.dataDir, 'changesets', `${id}.json`);
    await fs.unlink(filePath);
  }
}
```

**効果**:
- 永続化によるデータ保護
- 履歴の追跡可能
- 監査証跡の確保

## 5. イベント駆動アーキテクチャの導入

### 現状の問題

```typescript
// 変更が発生したら手動でビュー更新を呼び出し
await this.storage.updateRequirement(id, updates);
await this.viewExporter.exportAllViews('./views');
```

**問題**:
- 密結合
- 更新忘れのリスク
- 拡張性の低下

### 改善案

**EventEmitterの導入**:

```typescript
// src/events/event-emitter.ts
import { EventEmitter } from 'events';

export type DomainEvent =
  | { type: 'requirement.added'; requirement: Requirement }
  | { type: 'requirement.updated'; id: string; changes: Partial<Requirement> }
  | { type: 'requirement.deleted'; id: string }
  | { type: 'changeset.applied'; changeSetId: string }
  | { type: 'changeset.rolledback'; changeSetId: string };

export class DomainEventEmitter extends EventEmitter {
  emit(event: DomainEvent['type'], ...args: any[]): boolean {
    return super.emit(event, ...args);
  }

  on(event: DomainEvent['type'], listener: (...args: any[]) => void): this {
    return super.on(event, listener);
  }
}

// 使用例
class RequirementsStorage {
  constructor(
    private dataDir: string,
    private eventEmitter: DomainEventEmitter
  ) {}

  async addRequirement(requirement: Requirement): Promise<void> {
    // 保存
    this.requirements.set(requirement.id, requirement);
    await this.save();

    // イベント発火
    this.eventEmitter.emit('requirement.added', requirement);
  }
}

// リスナー登録
eventEmitter.on('requirement.added', async (requirement) => {
  await viewExporter.exportAllViews('./views');
});

eventEmitter.on('changeset.applied', async (changeSetId) => {
  await logger.log({ type: 'changeset_applied', changeSetId });
});
```

**効果**:
- 疎結合
- 拡張性の向上
- リアクティブな処理

## 6. パフォーマンス最適化

### 6.1 ビュー生成の最適化

**現状**: 毎回全ビューを再生成

**改善案**: 差分更新

```typescript
class ViewExporter {
  private cache: Map<string, { hash: string; content: string }> = new Map();

  async exportView(viewName: string, requirements: Requirement[]): Promise<void> {
    // ハッシュ計算
    const hash = this.calculateHash(requirements);

    // キャッシュチェック
    const cached = this.cache.get(viewName);
    if (cached && cached.hash === hash) {
      console.log(`View ${viewName} is up-to-date, skipping...`);
      return;
    }

    // 生成
    const content = await this.generateView(viewName, requirements);

    // キャッシュ更新
    this.cache.set(viewName, { hash, content });

    // 保存
    await this.saveView(viewName, content);
  }
}
```

### 6.2 バリデーションのバッチ処理

**現状**: 1件ずつ検証

**改善案**: バッチ検証

```typescript
class ValidationEngine {
  async validateBatch(requirements: Requirement[]): Promise<Map<string, ValidationResult>> {
    // 並列実行
    const results = await Promise.all(
      requirements.map(async req => ({
        id: req.id,
        result: await this.validate(req)
      }))
    );

    return new Map(results.map(r => [r.id, r.result]));
  }
}
```

## 7. 設定管理の改善

### 現状の問題

設定がハードコーディング:

```typescript
this.storage = new RequirementsStorage('./data');
```

### 改善案

**設定ファイルの導入**:

```typescript
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
  }
}

// src/config/config.ts
import * as fs from 'fs/promises';
import * as path from 'path';

export interface Config {
  server: {
    name: string;
    version: string;
  };
  storage: {
    dataDir: string;
    autoSave: boolean;
    backupEnabled: boolean;
  };
  validation: {
    autoValidate: boolean;
    useLLM: boolean;
    updateMetrics: boolean;
  };
  fixEngine: {
    defaultPolicy: string;
    maxIterations: number;
  };
}

export async function loadConfig(configPath = './config/default.json'): Promise<Config> {
  const content = await fs.readFile(configPath, 'utf-8');
  return JSON.parse(content);
}
```

## 8. ログの構造化

### 現状の問題

```typescript
console.error('ValidationEngine initialized');
```

**問題**:
- ログレベルがない
- 構造化されていない
- 検索・分析が困難

### 改善案

**構造化ロギングの導入**:

```typescript
// src/common/logger.ts
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
}

export class Logger {
  constructor(private minLevel: LogLevel = LogLevel.INFO) {}

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context);
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    if (level < this.minLevel) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
    };

    console.error(JSON.stringify(entry));
  }
}

// 使用例
const logger = new Logger(LogLevel.INFO);
logger.info('ValidationEngine initialized', {
  validators: ['structure', 'mece', 'nlp'],
  timestamp: Date.now(),
});
```

## 実装優先順位

### Phase 1: 基盤強化（1-2週間）

1. ✅ アーキテクチャドキュメント作成
2. ⏳ Result型パターンの導入
3. ⏳ 構造化ロギングの導入
4. ⏳ 型システムの洗練

### Phase 2: 永続化改善（2-3週間）

1. ⏳ ChangeSetRepositoryの実装
2. ⏳ バックアップ機能の追加
3. ⏳ トランザクションログの実装

### Phase 3: パフォーマンス最適化（3-4週間）

1. ⏳ ビュー生成の差分更新
2. ⏳ バリデーションのバッチ処理
3. ⏳ キャッシング戦略の実装

### Phase 4: アーキテクチャ進化（4-8週間）

1. ⏳ イベント駆動アーキテクチャへの移行
2. ⏳ 依存性注入の改善
3. ⏳ 設定管理の外部化

## メトリクス

### 品質メトリクス

- **テストカバレッジ**: 現在 33.89% → 目標 80%+
- **型安全性**: `as any` の削減 → 目標 0件
- **循環的複雑度**: 平均 5以下を維持

### パフォーマンスメトリクス

- **ビュー生成時間**: 差分更新で 50%削減目標
- **バリデーション時間**: バッチ処理で 30%削減目標
- **メモリ使用量**: キャッシング最適化で 20%削減目標

---

最終更新: 2025-10-21
バージョン: 1.0.0
