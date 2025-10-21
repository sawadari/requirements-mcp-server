### 概要

構造化ロギングを導入し、ログの検索・分析を容易にする。現在は `console.error` による非構造化ログのみで、ログレベルや文脈情報が不足している。

### 目的

- ログレベルの導入（DEBUG, INFO, WARN, ERROR）
- 構造化されたログ出力（JSON形式）
- 検索・分析の容易化

### 現状の問題

```typescript
console.error('ValidationEngine initialized');
```

**問題点**:
- ログレベルがない
- 構造化されていない
- 文脈情報が不足
- 検索・分析が困難

### 実装内容

#### 1. Logger クラスの作成

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

  debug(message: string, context?: Record<string, any>): void
  info(message: string, context?: Record<string, any>): void
  warn(message: string, context?: Record<string, any>): void
  error(message: string, context?: Record<string, any>): void
}
```

#### 2. 既存コードの移行

- console.error を Logger.error に置き換え
- 適切なログレベルの設定
- 文脈情報の追加

#### 3. 設定との統合

- 環境変数によるログレベル制御（`LOG_LEVEL`）
- ログフォーマットの選択（JSON/テキスト）

### 受け入れ基準

- [ ] Logger クラスの実装
- [ ] LogLevel の定義
- [ ] 既存のログ出力を段階的に移行
- [ ] 環境変数による設定サポート
- [ ] ユニットテストの追加
- [ ] ドキュメント更新

### 関連ドキュメント

- [ARCHITECTURE-IMPROVEMENTS.md](../ARCHITECTURE-IMPROVEMENTS.md) - Phase 1, Section 8

**Labels**: `enhancement`, `phase-1`, `logging`
**Priority**: Medium
**Estimate**: 1-2 days
