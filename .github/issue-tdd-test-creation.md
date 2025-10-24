# Phase 1.3: 既存16ツールのテスト作成

## 概要

Tool Registry に登録されている既存16ツールのテストコードを作成し、テストカバレッジ80%以上を達成する。

## 背景

- Tool Registry System と TDD Integration が完了（Commit 2623e57）
- テスト自動生成スクリプト（`npm run generate-tool-test`）が利用可能
- 現在、16ツール全てがテストファイル未作成の警告状態

```bash
$ npm run validate-registry

⚠️ Warnings:
  - Tool "add_requirement" has no test file: add-requirement.test.ts
  - Tool "get_requirement" has no test file: get-requirement.test.ts
  ... (残り14ツール)
```

## 目的

1. **品質保証**: 全ツールが仕様通りに動作することを自動的に検証
2. **リグレッション防止**: 将来の変更が既存機能を壊さないことを保証
3. **ドキュメント化**: テストコードが実行可能な仕様書として機能
4. **保守性向上**: 新規開発者がコードを理解しやすくなる

## 対象ツール（16個）

### CRUD Operations (6ツール)
- [ ] `add_requirement` - 新しい要求を追加
- [ ] `get_requirement` - 要求を取得
- [ ] `list_requirements` - 全要求を一覧表示
- [ ] `update_requirement` - 要求を更新
- [ ] `delete_requirement` - 要求を削除
- [ ] `search_requirements` - 条件検索

### Analysis & Insights (2ツール)
- [ ] `analyze_impact` - 影響範囲分析
- [ ] `get_dependency_graph` - 依存関係グラフ取得

### Validation & Quality (3ツール)
- [ ] `validate_requirement` - 単一要求の妥当性検証
- [ ] `validate_all_requirements` - 全要求の妥当性検証
- [ ] `get_validation_report` - 検証レポート取得

### Change Management (5ツール)
- [ ] `propose_change` - 変更提案を作成
- [ ] `load_policy` - 修正ポリシーを読み込み
- [ ] `preview_fixes` - 修正プレビュー
- [ ] `apply_fixes` - 修正を適用
- [ ] `rollback_fixes` - 修正をロールバック

## 実装手順（各ツール共通）

### ステップ1: テストテンプレート生成

```bash
npm run generate-tool-test -- <tool-name>
```

例:
```bash
npm run generate-tool-test -- add_requirement
```

### ステップ2: テストケース編集

生成された `tests/tools/<tool-name>.test.ts` を編集:

1. **正常系テスト**: 基本的な動作を確認
2. **異常系テスト**: エラーハンドリングを確認
3. **エッジケーステスト**: 境界値、空データ、大量データなど
4. **統合テスト**: 関連ツールとの連携を確認

### ステップ3: テスト実行

```bash
npm test
```

全テストが通ることを確認。

### ステップ4: カバレッジ確認

```bash
npm run test:coverage
```

対象ツールのカバレッジが90%以上であることを確認。

### ステップ5: レジストリ検証

```bash
npm run validate-registry
```

該当ツールの警告が消えたことを確認。

## 品質基準

### テストカバレッジ

- **各ツール**: 90%以上
- **全体**: 80%以上

### テストケース数

各ツール最低限必要なテストケース:
- 正常系: 2-3ケース
- 異常系: 2-3ケース（無効な入力、存在しないリソースなど）
- エッジケース: 1-2ケース（空データ、大量データなど）

合計: 5-8テストケース/ツール

### テストの独立性

- 各テストは独立して実行可能
- `beforeEach` / `afterEach` でクリーンアップ
- テスト間で状態を共有しない

## 推定時間

- **1ツールあたり**: 1.5-2時間
  - テンプレート生成: 5分
  - テストケース編集: 1-1.5時間
  - テスト実行・デバッグ: 30分

- **合計**: 24-32時間（16ツール）

## 実装の優先順位

### フェーズ1: CRUD Operations（必須・基盤）
高優先度 - 他のツールの基礎となる
- `add_requirement`
- `get_requirement`
- `update_requirement`
- `delete_requirement`
- `list_requirements`
- `search_requirements`

推定: 9-12時間

### フェーズ2: Validation & Quality（品質保証）
中優先度 - 品質を保証する重要機能
- `validate_requirement`
- `validate_all_requirements`
- `get_validation_report`

推定: 4.5-6時間

### フェーズ3: Analysis & Insights（分析機能）
中優先度 - 依存関係の理解に重要
- `analyze_impact`
- `get_dependency_graph`

推定: 3-4時間

### フェーズ4: Change Management（変更管理）
低優先度 - 高度な機能
- `propose_change`
- `load_policy`
- `preview_fixes`
- `apply_fixes`
- `rollback_fixes`

推定: 7.5-10時間

## 受け入れ基準

以下の全てを満たすこと:

- [ ] 16ツール全てにテストファイルが存在
- [ ] `npm test` が全て成功
- [ ] `npm run test:coverage` で全体カバレッジ80%以上
- [ ] `npm run validate-registry` がエラー・警告なし
- [ ] 各テストが独立して実行可能
- [ ] 各テストに明確な説明コメント
- [ ] CIで自動テスト実行可能

## 関連ドキュメント

- [docs/TDD-TOOL-DEVELOPMENT.md](../docs/TDD-TOOL-DEVELOPMENT.md) - TDD開発ガイド
- [docs/TOOL-MANAGEMENT-IMPLEMENTATION-PLAN.md](../docs/TOOL-MANAGEMENT-IMPLEMENTATION-PLAN.md) - 実装計画
- [tests/templates/tool-test.template.ts](../tests/templates/tool-test.template.ts) - テストテンプレート

## 実装例

### add_requirement のテスト例

```typescript
describe('add_requirement tool', () => {
  it('should add a new stakeholder requirement', async () => {
    const result = await server.callTool('add_requirement', {
      title: 'システムは10秒以内に応答すること',
      description: 'ユーザー操作に対して10秒以内に応答を返す',
      priority: 'high',
      category: 'performance',
      type: 'stakeholder'
    });

    const output = JSON.parse(result.content[0].text);
    expect(output).toHaveProperty('id');
    expect(output.title).toBe('システムは10秒以内に応答すること');
    expect(output.type).toBe('stakeholder');
  });

  it('should reject invalid priority value', async () => {
    const result = await server.callTool('add_requirement', {
      title: 'Test',
      description: 'Test',
      priority: 'invalid',
      category: 'test'
    });

    expect(result.content[0].text).toContain('Error');
  });
});
```

## 次のステップ

テスト作成完了後:
1. Phase 1.4: 既存コードのリファクタリング（テストで保護された状態で）
2. Phase 2: GitHub Actions統合（自動テスト実行）
3. Phase 3: 新規ツール追加時のTDDフロー実践

## 備考

- 各フェーズは独立して実装可能
- 優先度の高いものから順次対応
- テストカバレッジは段階的に向上させる
- 既存コードの動作を変更しないこと（リグレッション防止）
