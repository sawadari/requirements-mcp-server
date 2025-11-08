# 機能実装ワークフロー

requirements-mcp-serverでの新機能実装時の標準ワークフロー

**更新日**: 2025-01-08
**バージョン**: 1.0.0

---

## 🎯 目的

新機能実装時に以下を保証する:
1. **設計との整合性** - アーキテクチャ原則に従う
2. **影響分析の実施** - 既存機能への影響を事前評価
3. **テスト駆動開発** - 品質を担保する

---

## 📋 実装フェーズ

### Phase 0: 準備 (Planning)

#### 0.1 要求の明確化

**実施内容**:
- 実装する機能の要求を明確にする
- ユースケースを定義する
- 成功条件を定義する

**成果物**:
- Issue または 要求書

**チェックリスト**:
- [ ] 機能の目的が明確か？
- [ ] ユーザーストーリーが定義されているか？
- [ ] 成功条件が測定可能か？

#### 0.2 用語の確認

**実施内容**:
- [GLOSSARY.md](../GLOSSARY.md) で用語を確認
- 新規用語がある場合はGLOSSARYに追加

**成果物**:
- 用語リスト（必要に応じてGLOSSARY更新）

**チェックリスト**:
- [ ] 既存用語と統一されているか？
- [ ] 「要求」(○) vs 「要件」(✗) など表記ルールに従っているか？

---

### Phase 1: 設計整合性確認 (Design Alignment)

#### 1.1 アーキテクチャ確認

**実施内容**:
- [architecture/overview.md](../architecture/overview.md) でアーキテクチャを確認
- 実装する機能がどのレイヤーに属するか特定
- レイヤードアーキテクチャの原則に従っているか確認

**確認項目**:
```
┌─────────────────────────────────────┐
│  1. MCP Server Layer               │  ← 新MCPツール？
│  2. Business Logic Layer            │  ← ビジネスロジック？
│  3. Fix Engine Layer                │  ← 修正機能？
│  4. Ontology Layer                  │  ← オントロジー関連？
│  5. Data Access Layer               │  ← データアクセス？
│  6. Web Viewer (別プロセス)         │  ← UI機能？
└─────────────────────────────────────┘
```

**成果物**:
- アーキテクチャ適合性レポート (簡易メモでOK)

**チェックリスト**:
- [ ] 適切なレイヤーに配置されるか？
- [ ] 関心の分離が守られているか？
- [ ] 依存性の方向が正しいか？ (下位レイヤーへの依存のみ)

#### 1.2 設計原則の確認

**実施内容**:
- [architecture/design-principles.md](../architecture/design-principles.md) を確認
- 実装が以下の原則に従っているか確認:
  - オントロジー (要求の段階的詳細化)
  - MECE原則
  - トレーサビリティ

**チェックリスト**:
- [ ] オントロジーに影響する場合、OntologyManagerを使用するか?
- [ ] MECE原則を維持するか?
- [ ] 操作ログを記録するか? (OperationLogger)

#### 1.3 既存コンポーネントの確認

**実施内容**:
- 類似機能が既に実装されていないか確認
- 再利用可能なコンポーネントを特定

**確認先**:
```bash
# 既存のクラスを検索
grep -r "class.*Validator" src/
grep -r "class.*Manager" src/
grep -r "class.*Engine" src/

# 既存のMCPツールを確認
grep -n "name:" src/index.ts | grep -A1 "Tool"
```

**チェックリスト**:
- [ ] 重複する機能はないか？
- [ ] 既存コンポーネントを再利用できるか？
- [ ] 既存パターンに従っているか？

---

### Phase 2: 影響分析 (Impact Analysis)

#### 2.1 依存関係の特定

**実施内容**:
- 実装する機能が依存するコンポーネントをリストアップ
- 実装する機能に依存するコンポーネントをリストアップ

**ツール**:
```bash
# ファイルのインポートを確認
grep -r "import.*from.*'\./" src/

# 特定クラスの使用箇所を検索
grep -r "new ValidationEngine" src/
grep -r "storage\." src/
```

**成果物**:
- 依存関係マップ (簡易図でOK)

**例**:
```
新機能: ProjectValidator
  ├─ 依存: OntologyManager
  ├─ 依存: ValidationEngine
  └─ 使用元: ValidationService
```

#### 2.2 影響範囲の評価

**実施内容**:
- 既存機能への影響を評価
- 破壊的変更がないか確認
- データ移行が必要か確認

**影響レベル**:
- 🟢 **Low**: 新規追加のみ、既存機能への影響なし
- 🟡 **Medium**: 既存コンポーネントの拡張、後方互換性あり
- 🔴 **High**: 既存機能の変更、破壊的変更、データ移行必要

**チェックリスト**:
- [ ] 既存のMCPツールに影響するか？
- [ ] 既存のデータフォーマットに影響するか？
- [ ] 既存のAPIシグネチャに影響するか？
- [ ] データ移行スクリプトが必要か？

#### 2.3 リスク評価

**実施内容**:
- 実装に伴うリスクを特定
- リスク軽減策を検討

**リスクカテゴリ**:
- **技術リスク**: 複雑度、パフォーマンス、スケーラビリティ
- **品質リスク**: テストの難易度、バグ混入の可能性
- **運用リスク**: ユーザーへの影響、ロールバック可能性

**成果物**:
- リスク評価表

| リスク | レベル | 軽減策 |
|--------|--------|--------|
| 例: パフォーマンス劣化 | Medium | ベンチマークテスト実施 |

---

### Phase 3: テスト設計 (Test Design - TDD準備)

#### 3.1 テストケースの設計

**実施内容**:
- 実装前にテストケースを設計 (TDDの"Red"フェーズ準備)
- 正常系・異常系・境界値をカバー

**テストカテゴリ**:
1. **ユニットテスト**: 個別関数・メソッドのテスト
2. **統合テスト**: コンポーネント間連携のテスト
3. **E2Eテスト**: MCPツール経由の動作テスト

**成果物**:
- テスト計画書 (簡易リストでOK)

**例**:
```
機能: ProjectValidator

ユニットテスト:
- [ ] validateProject() - 正常なプロジェクト
- [ ] validateProject() - 不正なプロジェクトID
- [ ] validateProject() - 存在しないプロジェクト

統合テスト:
- [ ] ValidationService経由での呼び出し
- [ ] OntologyManagerとの連携

E2Eテスト:
- [ ] MCPツール validate_project 経由
```

#### 3.2 テストファイルの作成

**実施内容**:
- テストファイルを先に作成 (TDDの"Red"フェーズ)
- 失敗するテストを書く

**ファイル配置**:
```
src/project-validator.ts       # 実装 (まだ作らない)
tests/project-validator.test.ts # テスト (先に作る)
```

**テンプレート**:
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ProjectValidator } from '../src/project-validator.js';

describe('ProjectValidator', () => {
  let validator: ProjectValidator;

  beforeEach(() => {
    validator = new ProjectValidator();
  });

  describe('validateProject', () => {
    it('正常なプロジェクトを検証できる', () => {
      const result = validator.validateProject('valid-project');
      expect(result.isValid).toBe(true);
    });

    it('不正なプロジェクトIDを検出する', () => {
      const result = validator.validateProject('INVALID-ID');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid project ID format');
    });
  });
});
```

**チェックリスト**:
- [ ] テストが失敗することを確認 (`npm test`)
- [ ] テストケースが網羅的か？
- [ ] テストが読みやすいか？

---

### Phase 4: 実装 (Implementation - TDD)

#### 4.1 最小実装 (Green)

**実施内容**:
- テストを通過する最小限の実装
- リファクタリングは後回し

**TDDサイクル**:
```
1. 🔴 Red:   テストを書く (失敗する)
2. 🟢 Green: テストを通す (最小実装)
3. 🔵 Refactor: リファクタリング
```

**チェックリスト**:
- [ ] テストが通ることを確認 (`npm test`)
- [ ] テストカバレッジが80%以上か？ (`npm run test:coverage`)

#### 4.2 リファクタリング (Refactor)

**実施内容**:
- コードの可読性向上
- 重複コードの削除
- デザインパターンの適用

**確認項目**:
- [ ] 単一責任の原則 (SRP) に従っているか？
- [ ] 命名規則に従っているか？ (camelCase, PascalCase)
- [ ] JSDocコメントが書かれているか？
- [ ] 型定義が正確か？

#### 4.3 統合

**実施内容**:
- 既存システムへの統合
- MCPツールとして登録 (必要な場合)
- ドキュメント更新

**MCPツール追加の場合**:
```typescript
// src/index.ts に追加

// 1. Zodスキーマ定義
const NewToolSchema = z.object({
  param1: z.string().describe('説明'),
});

// 2. getTools() に追加
{
  name: 'new_tool',
  description: '新ツールの説明',
  inputSchema: zodToJsonSchema(NewToolSchema),
}

// 3. ハンドラ実装
private async handleNewTool(args: any) {
  const params = NewToolSchema.parse(args);
  // 実装
}

// 4. switchステートメントに追加
case 'new_tool':
  return await this.handleNewTool(args);
```

**チェックリスト**:
- [ ] ビルドが成功するか？ (`npm run build`)
- [ ] 型チェックが通るか？ (`npm run typecheck`)
- [ ] Lintエラーがないか？ (`npm run lint`)

---

### Phase 5: ドキュメント更新 (Documentation)

#### 5.1 設計書の更新

**更新対象**:
- [ ] [architecture/overview.md](../architecture/overview.md)
  - アーキテクチャ図に新コンポーネント追加
  - レイヤー詳細に説明追加
- [ ] [GLOSSARY.md](../GLOSSARY.md)
  - 新規用語を追加
- [ ] [user-guide/mcp-tools.md](../user-guide/mcp-tools.md) (MCPツールの場合)
  - ツール一覧に追加
  - 使用例を記載

#### 5.2 README更新

**更新対象**:
- [ ] [README.md](../../README.md)
  - 主な機能に追加 (重要な機能の場合)
  - MCPツール数を更新 (ツール追加の場合)

#### 5.3 実装ガイド更新

**作成ドキュメント**:
- [ ] 新機能の使い方ガイド (必要に応じて)
- [ ] トラブルシューティング

---

### Phase 6: レビュー・検証 (Review & Validation)

#### 6.1 セルフレビュー

**チェックリスト**:
- [ ] テストが全て通るか？
- [ ] テストカバレッジが基準を満たすか？
- [ ] 設計原則に従っているか？
- [ ] GLOSSARYの用語に従っているか？
- [ ] コードコメントが十分か？

#### 6.2 影響確認

**実施内容**:
- 既存テストが全て通ることを確認
- 既存機能が動作することを手動確認

**コマンド**:
```bash
# 全テスト実行
npm test

# ビルド確認
npm run build

# 型チェック
npm run typecheck

# Lint
npm run lint
```

#### 6.3 動作確認

**実施内容**:
- 実際にMCPサーバーを起動して動作確認
- Claude Codeから新機能を使用してみる

```bash
# MCPサーバー起動
npm run dev

# 別ターミナルでClaude Codeから接続
# 新機能を試す
```

---

## 📊 チェックリスト全体

### 必須項目 (Must)

- [ ] **Phase 0**: 要求が明確である
- [ ] **Phase 1**: アーキテクチャに適合している
- [ ] **Phase 2**: 影響分析を実施した
- [ ] **Phase 3**: テストを先に書いた (TDD)
- [ ] **Phase 4**: 全テストが通る
- [ ] **Phase 5**: ドキュメントを更新した
- [ ] **Phase 6**: セルフレビュー完了

### 推奨項目 (Should)

- [ ] 用語がGLOSSARYに従っている
- [ ] テストカバレッジ80%以上
- [ ] JSDocコメント記載
- [ ] 既存パターンに従っている
- [ ] リスク軽減策を実施した

---

## 🔄 イテレーション

実装中に問題が発生した場合:

1. **設計の見直し**: Phase 1に戻る
2. **影響範囲の再評価**: Phase 2に戻る
3. **テスト追加**: Phase 3に戻る

---

## 📚 関連ドキュメント

- [architecture/overview.md](../architecture/overview.md) - アーキテクチャ全体像
- [architecture/design-principles.md](../architecture/design-principles.md) - 設計原則
- [GLOSSARY.md](../GLOSSARY.md) - 用語集
- [development/testing.md](testing.md) - テストガイド
- [development/implementation-guide.md](implementation-guide.md) - 実装ガイド (既存)

---

## 🤖 エージェント向けプロンプト

新機能実装時にこのワークフローを参照してください:

```
新機能「{機能名}」を実装します。

Phase 0: 要求の明確化
- 目的: {目的}
- ユースケース: {ユースケース}
- 成功条件: {成功条件}

Phase 1: 設計整合性確認
- 配置レイヤー: {レイヤー名}
- 依存コンポーネント: {コンポーネント}

Phase 2: 影響分析
- 影響レベル: {Low/Medium/High}
- リスク: {リスク}

Phase 3: テスト設計
- テストケース数: {N}個
- カバレッジ目標: 80%

Phase 4-6: 実装・ドキュメント・検証
- TDDサイクルで実装
- ドキュメント更新
- セルフレビュー実施

このワークフローに従って実装を進めてください。
```

---

最終更新: 2025-01-08
バージョン: 1.0.0
