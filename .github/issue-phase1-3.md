### 概要

型システムを洗練し、`as any` による型安全性の損失を排除する。現在、複数箇所で型アサーションが使用されており、型安全性が損なわれている。

### 目的

- 型安全性の向上
- `as any` の完全排除
- コードの可読性向上
- IDEの補完サポート強化

### 現状の問題

```typescript
// src/index.ts
const reqRecord = Object.fromEntries(
  requirements.map((r: Requirement) => [r.id, r as any])
);
```

**問題**: `as any` による型安全性の損失

### 実装内容

#### 1. 型安全なヘルパー関数

```typescript
// src/fix-engine/types.ts に追加
export type RequirementRecord = Record<ReqID, Requirement>;

export function toRequirementRecord(requirements: Requirement[]): RequirementRecord {
  return Object.fromEntries(
    requirements.map(r => [r.id, r])
  ) as RequirementRecord;
}
```

#### 2. 型定義の改善

- より具体的な型定義の追加
- Union型とDiscriminated Unionの活用
- Generic型の適切な使用

#### 3. 既存コードの移行

- `as any` を使用している箇所を特定
- 型安全なコードに書き換え
- TypeScript strict mode での検証

### 受け入れ基準

- [ ] `as any` の使用箇所を0にする
- [ ] 型安全なヘルパー関数の実装
- [ ] TypeScript strict mode での完全なコンパイル
- [ ] IDEの型チェックで警告が出ないことを確認
- [ ] ユニットテストの追加
- [ ] ドキュメント更新

### メトリクス

- **現状**: `as any` の使用箇所 5+ 箇所
- **目標**: `as any` の使用箇所 0 箇所

### 関連ドキュメント

- [ARCHITECTURE-IMPROVEMENTS.md](../ARCHITECTURE-IMPROVEMENTS.md) - Phase 1, Section 1

**Labels**: `enhancement`, `phase-1`, `type-system`
**Priority**: High
**Estimate**: 2-3 days
