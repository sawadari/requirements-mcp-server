# ツリービューで要求が重複表示される問題

## 問題の概要

ツリービュー (`/tree`) で同じ要求が複数回表示される問題が発生しています。

## 再現手順

1. `npm run view-server` でサーバーを起動
2. ブラウザで `http://localhost:5002/tree` にアクセス
3. 各グループ（ステークホルダ要求、システム要求、システム機能要求）を展開
4. 同じIDの要求が複数回表示されることを確認

## 期待される動作

各要求は1回だけ表示され、type別にグループ化される:
- ステークホルダ要求（STK-XXX）
- システム要求（SYS-XXX）
- システム機能要求（FUNC-XXX）

## 現在の動作

同じ要求が複数のグループに重複して表示される。

## 調査結果

### 根本原因

`storage.getAllRequirements()` が階層構造データを返しており、同じ要求が以下のように複数箇所に含まれている:
1. 親要求のchildrenの中
2. トップレベルの独立した要求として
3. 別の親要求のchildrenの中

**例**: `SYS-001` が `STK-001.children`、トップレベル、`STK-002.children` の3箇所に登場

### curlでの確認結果

```bash
curl http://localhost:5002/api/tree
```

APIレスポンスを確認すると、同じrequirementオブジェクトが複数回出現している。

### 試した修正

#### 修正1: フロントエンドでSet使用

`src/view-server.ts:524-564`

```javascript
const groups = {
  stakeholder: { name: 'ステークホルダ要求', icon: '👥', items: [], ids: new Set() },
  system: { name: 'システム要求', icon: '⚙️', items: [], ids: new Set() },
  functional: { name: 'システム機能要求', icon: '🔧', items: [], ids: new Set() }
};

tree.forEach(node => {
  const req = node.requirement;
  // type推測ロジック...

  if (groups[type] && !groups[type].ids.has(req.id)) {
    groups[type].items.push(req);
    groups[type].ids.add(req.id);
  }
});
```

**結果**: ❌ 効果なし（APIから送られるデータ構造の問題）

#### 修正2: APIでMap使用

`src/view-server.ts:1191-1221`

```typescript
app.get('/api/tree', async (req, res) => {
  try {
    await storage.initialize();
    const requirements = await storage.getAllRequirements();

    // IDでユニーク化
    const uniqueRequirements = Array.from(
      new Map(requirements.map(req => [req.id, req])).values()
    );

    const flatTree = uniqueRequirements.map(req => ({
      requirement: req,
      children: [],
      level: 0,
      indent: 0
    }));

    res.json({
      tree: flatTree,
      count: flatTree.length,
    });
  } catch (error: any) {
    res.json({
      error: error.message,
      tree: [],
      count: 0,
    });
  }
});
```

**結果**: ❌ 効果なし（`storage.getAllRequirements()` 自体が重複データを返している）

### デバッグログの追加

以下のログを `src/view-server.ts:524-570` に追加済み:

```javascript
console.log('受信したツリーデータ:', tree.length + '件');
console.log('処理中の要求:', req.id, req.title);
console.warn('重複検出:', req.id, 'はすでに', type, 'グループに存在します');
console.log('ステークホルダ要求:', groups.stakeholder.items.length);
console.log('システム要求:', groups.system.items.length);
console.log('システム機能要求:', groups.functional.items.length);
```

**問題**: ブラウザのコンソール（F12 → Console）にログが表示されない
- バージョン番号は正常に表示・更新される
- ハードリフレッシュ（Ctrl+Shift+R）でも改善なし

## 必要な対応

### 優先度: High

1. **`storage.getAllRequirements()` の修正** ⭐ 最優先
   - 階層構造を含まない、完全にフラットなデータを返すように修正
   - または、既存データから重複を除去する処理を追加
   - `src/storage.ts` の `getAllRequirements()` メソッドを確認

2. **デバッグログが表示されない問題の調査**
   - JavaScriptが正しく実行されているか確認
   - ブラウザのキャッシュ問題の可能性
   - コンソールエラーの有無を確認

3. **TreeBuilderの利用検討**
   - `src/tree-view.ts` の `TreeBuilder` クラスが存在するが未使用
   - 階層構造が必要な場合は、これを正しく活用
   - フラットリスト表示の場合は、TreeBuilderを使わない設計に統一

4. **テストケースの追加**
   - 重複チェックのユニットテスト
   - APIエンドポイントの統合テスト
   - フロントエンドのレンダリングテスト

## 関連ファイル

- `src/view-server.ts:1191-1221` - `/api/tree` エンドポイント
- `src/view-server.ts:519-570` - フロントエンドのrenderTree関数
- `src/storage.ts` - `getAllRequirements()` メソッド（要調査）
- `src/tree-view.ts` - TreeBuilder（現在未使用）
- `src/types.ts` - Requirement型定義

## 環境

- Node.js: v22.20.0
- TypeScript: 5.8.3
- Express: 5.1.0
- ブラウザ: Chrome/Edge (開発者ツールのコンソールでログ確認不可)
- ポート: 5002

## ラベル

- `bug` - バグ修正
- `priority-high` - 高優先度
- `type:frontend` - フロントエンド関連
- `type:backend` - バックエンド関連
- `investigation` - さらなる調査が必要

## 補足情報

- バージョン番号表示(`v{Date.now()}`)は正常に動作しており、リロードごとに更新される
- グループのヘッダー（展開・折りたたみ）は正常に動作
- 要求の詳細表示も正常に動作
- 重複表示のみが問題

## 次のステップ

1. `src/storage.ts` の `getAllRequirements()` 実装を確認
2. データベース（JSONファイル）の構造を確認
3. 階層構造が本当に必要か、設計思想を再確認
4. 必要に応じて、ツリービューとフラットビューを分離

---

**作成日**: 2025-10-18
**報告者**: Claude Code
**ステータス**: Open
