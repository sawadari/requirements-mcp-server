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

**Labels**: `enhancement`, `phase-4`, `architecture`
**Priority**: Low
**Estimate**: 3-4 days
