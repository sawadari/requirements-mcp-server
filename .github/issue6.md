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

**Labels**: `enhancement`, `phase-4`, `architecture`
**Priority**: Low
**Estimate**: 5-7 days
