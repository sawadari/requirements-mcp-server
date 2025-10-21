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

**Labels**: `enhancement`, `phase-3`, `performance`
**Priority**: Medium
**Estimate**: 3-4 days
