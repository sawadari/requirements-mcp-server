# 自動検証・修正機能

## 概要

requirements-mcp-serverの自動検証・修正機能は、要求の追加・更新時に自動的に品質チェックを行い、必要に応じて修正を適用します。

## アーキテクチャ

```
┌─────────────────────────────────────────────────────┐
│           RequirementsStorage                       │
│  ┌─────────────────────────────────────────┐       │
│  │  addRequirement / updateRequirement      │       │
│  └────────────────┬────────────────────────┘       │
│                   │                                  │
│                   ▼                                  │
│  ┌─────────────────────────────────────────┐       │
│  │       ValidationService                  │       │
│  │  ┌───────────────────────────────────┐  │       │
│  │  │  1. Validate (ValidationEngine)   │  │       │
│  │  │     - 階層構造チェック               │  │       │
│  │  │     - グラフヘルスチェック           │  │       │
│  │  │     - 抽象度チェック                 │  │       │
│  │  │     - MECEチェック                  │  │       │
│  │  │     - 品質スタイルチェック           │  │       │
│  │  └───────────────────────────────────┘  │       │
│  │                   │                      │       │
│  │                   ▼                      │       │
│  │  ┌───────────────────────────────────┐  │       │
│  │  │  2. Fix (FixExecutor)             │  │       │
│  │  │     - 修正プラン生成                 │  │       │
│  │  │     - ChangeSet適用                │  │       │
│  │  │     - 再検証                        │  │       │
│  │  └───────────────────────────────────┘  │       │
│  └─────────────────────────────────────────┘       │
│                   │                                  │
│                   ▼                                  │
│  ┌─────────────────────────────────────────┐       │
│  │     修正後の要求データを保存              │       │
│  └─────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────┘
```

## 設定

### `src/auto-validation-config.jsonc`

```jsonc
{
  "autoValidation": {
    "enabled": true,           // 自動検証を有効化
    "validation": {
      "useLLM": false,         // LLM評価を使用するか
      "updateMetrics": true    // NLP指標を更新するか
    }
  },
  "autoFix": {
    "enabled": true,           // 自動修正を有効化
    "mode": "strict",          // 修正モード
    "policyFile": "./src/fix-engine/fix-policy.jsonc",
    "revalidateAfterFix": true,
    "maxIterations": 3,        // 最大修正反復回数
    "fixSeverity": "error"     // 修正対象の深刻度
  },
  "logging": {
    "enabled": true,
    "verbose": false
  }
}
```

### 修正モード

- **strict**: 違反を自動的に修正（無人運用向け）
- **suggest**: 修正案を提示するのみ（承認必要）
- **disabled**: 自動修正を無効化（検証のみ）

### 修正対象の深刻度

- **error**: エラーレベルの違反のみ修正
- **warning**: エラー+警告レベルを修正
- **info**: すべての違反を修正

## 検証ルール

### 1. 階層構造 (Hierarchy)

- **H1**: 孤立ノード（親も子もない要求）
- **H2**: 階層レベルの不整合
- **H3**: 循環参照の検出

### 2. グラフヘルス (Graph Health)

- **G1**: 依存関係の欠落
- **G2**: 不適切な依存方向
- **G3**: 過度に複雑な依存関係

### 3. 抽象度 (Abstraction)

- **A1**: 抽象度レベルの不一致
- **A2**: 親子間の具体化度の差が不足
- **A3**: 同階層での抽象度のばらつき

### 4. MECE (Mutually Exclusive, Collectively Exhaustive)

- **M1**: 子要求間の重複
- **M2**: 親要求のカバレッジ不足
- **M3**: 単一責任の原則違反

### 5. 品質スタイル (Quality Style)

- **Q1**: 説明文が短すぎる
- **Q2**: 主語の欠落
- **Q3**: 曖昧な用語の使用
- **Q4**: 受動態の多用

## 修正操作

FixEngineは以下の7種類の修正操作をサポート:

1. **split**: 要求の分割（単一責任違反の解消）
2. **merge**: 要求の統合（重複の解消）
3. **rewire**: リンクの再配線（依存関係の修正）
4. **introduce**: 中間層の導入（抽象度のギャップ解消）
5. **rewrite**: テキストの書き換え（品質スタイルの改善）
6. **alias**: エイリアスの設定（重複の軽減）
7. **break_cycle**: 循環の切断（循環参照の解消）

## 使用例

### プログラムからの利用

```typescript
import { RequirementsStorage } from './storage.js';

const storage = new RequirementsStorage('./data');
await storage.initialize();

// 要求を追加（自動検証・修正が実行される）
const requirement = await storage.addRequirement({
  id: 'REQ-001',
  title: '新機能',
  description: '新しい機能を追加する',
  status: 'draft',
  priority: 'medium',
  category: 'テスト',
  tags: [],
  dependencies: [],
  createdAt: new Date(),
  updatedAt: new Date(),
});

// 要求を更新（自動検証・修正が実行される）
const updated = await storage.updateRequirement('REQ-001', {
  description: 'より詳細な説明',
});
```

### 設定の変更

```typescript
import { ValidationService } from './validation-service.js';

const service = new ValidationService();
await service.initialize();

// 自動修正を無効化
await service.updateConfig({
  autoFix: {
    enabled: false,
  },
});

// 修正モードをSuggestに変更
await service.updateConfig({
  autoFix: {
    mode: 'suggest',
  },
});
```

## テスト

```bash
# 自動検証・修正機能のテスト
npx tsx scripts/test-auto-validation.ts

# 型チェック
npm run typecheck

# すべてのテスト
npm test
```

## トラブルシューティング

### 自動修正が適用されない

1. 設定ファイルで `autoFix.enabled` が `true` になっているか確認
2. `autoFix.mode` が `"disabled"` になっていないか確認
3. 違反の深刻度が `fixSeverity` 以上か確認

### 修正が無限ループする

1. `maxIterations` の値を確認（デフォルト: 3）
2. 修正ポリシーファイルに矛盾がないか確認
3. `logging.verbose` を `true` にして詳細ログを確認

### パフォーマンスが低い

1. `useLLM` を `false` に設定（LLM評価は重い）
2. `revalidateAfterFix` を `false` に設定（最終検証をスキップ）
3. `fixSeverity` を `"error"` に限定

## 今後の拡張

- [ ] 修正履歴の記録とロールバック機能
- [ ] Webページからの設定変更UI
- [ ] 修正前後の差分可視化
- [ ] カスタム検証ルールの追加
- [ ] 並列処理による高速化
- [ ] リアルタイム検証の通知機能

## 関連ドキュメント

- [Fix Engine仕様](./fix-engine.md)
- [Validation Engine仕様](./validation-engine.md)
- [README](../README.md)
