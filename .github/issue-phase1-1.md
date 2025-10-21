### 概要

Result型パターンを導入し、エラーハンドリングを統一する。現在は複数のエラーハンドリングパターンが混在しており、一貫性が欠けている。

### 目的

- エラーハンドリングの一貫性を確保
- 型安全なエラー処理の実現
- より明示的なAPIの提供

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

### 実装内容

#### 1. Result型の定義

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
```

#### 2. 既存コードの移行

- RequirementsStorage のメソッドを Result 型に変更
- ImpactAnalyzer のメソッドを Result 型に変更
- MCPツールハンドラーを Result 型に対応

#### 3. ユーティリティ関数

```typescript
// Result型の便利なヘルパー関数
export function mapResult<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E>

export function flatMapResult<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E>
```

### 受け入れ基準

- [ ] Result型の定義とヘルパー関数の実装
- [ ] 既存のエラーハンドリングコードを段階的に移行
- [ ] 型安全性の検証（TypeScript strict mode）
- [ ] ユニットテストの追加
- [ ] ドキュメント更新

### 関連ドキュメント

- [ARCHITECTURE-IMPROVEMENTS.md](../ARCHITECTURE-IMPROVEMENTS.md) - Phase 1, Section 2

**Labels**: `enhancement`, `phase-1`, `type-system`
**Priority**: High
**Estimate**: 2-3 days
