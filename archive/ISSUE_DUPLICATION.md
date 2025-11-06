# 要求ツリー内の要求項目が重複表示される

## 問題の説明

ツリービュー (`http://localhost:5002/tree`) で、同じ要求が複数回表示される問題が発生しています。

例えば、`SYS-001 自動搬送機能` が「ステークホルダ要求」「システム要求」の両方のグループに表示されるなど、同じIDの要求が重複して表示されます。

## 再現手順

1. サーバーを起動
   ```bash
   cd requirements-mcp-server
   npm run view-server
   ```

2. ブラウザで `http://localhost:5002/tree` にアクセス

3. 各グループヘッダー（ステークホルダ要求、システム要求、システム機能要求）を展開

4. **問題**: 同じ要求が複数のグループに重複して表示される

## 期待される動作

各要求は **1回だけ** 表示され、その要求の `type` に基づいて適切なグループに分類される:

- **ステークホルダ要求** (`type: 'stakeholder'`): `STK-001`, `STK-002`, `STK-003`
- **システム要求** (`type: 'system'`): `SYS-001`, `SYS-002`, `SYS-003`, ...
- **システム機能要求** (`type: 'functional'`): `FUNC-001`, `FUNC-002`, `FUNC-003`, ...

## 現在の動作

同じ要求が複数のグループに表示される。

**例**:
- `SYS-001` がステークホルダ要求グループとシステム要求グループの両方に表示
- `FUNC-002` がシステム要求グループとシステム機能要求グループの両方に表示

## 根本原因の分析

### APIレスポンスの問題

`/api/tree` エンドポイントが返すデータに、同じ要求が複数回含まれています。

```bash
curl http://localhost:5002/api/tree
```

このコマンドを実行すると、以下のような構造のデータが返ってきます:

```json
{
  "tree": [
    {
      "requirement": { "id": "STK-001", ... },
      "children": [
        { "requirement": { "id": "SYS-001", ... } },  // ← 1回目
        { "requirement": { "id": "SYS-002", ... } }
      ]
    },
    { "requirement": { "id": "SYS-001", ... } },      // ← 2回目（重複）
    { "requirement": { "id": "SYS-002", ... } },      // ← 2回目（重複）
    {
      "requirement": { "id": "STK-002", ... },
      "children": [
        { "requirement": { "id": "SYS-001", ... } }   // ← 3回目（重複）
      ]
    }
  ]
}
```

### データソースの問題

`src/storage.ts` の `getAllRequirements()` メソッドが、階層構造を含むデータを返しているため、同じ要求が以下のように複数箇所に含まれている:

1. **親要求のchildren配列の中**
2. **トップレベルの独立した要求として**
3. **別の親要求のchildren配列の中**

## 試した修正と結果

### 修正1: フロントエンドでSetを使った重複除去

**場所**: `src/view-server.ts:524-564`

**コード**:
```javascript
const groups = {
  stakeholder: { name: 'ステークホルダ要求', items: [], ids: new Set() },
  system: { name: 'システム要求', items: [], ids: new Set() },
  functional: { name: 'システム機能要求', items: [], ids: new Set() }
};

tree.forEach(node => {
  const req = node.requirement;

  // type推測ロジック
  let type = req.type || inferTypeFromId(req.id);

  // 重複チェック
  if (groups[type] && !groups[type].ids.has(req.id)) {
    groups[type].items.push(req);
    groups[type].ids.add(req.id);
  }
});
```

**結果**: ❌ **効果なし**

理由: APIから返されるデータ自体に重複が含まれているため、フロントエンドでの重複除去では解決できない

### 修正2: APIでMapを使った重複除去

**場所**: `src/view-server.ts:1191-1221`

**コード**:
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

    res.json({ tree: flatTree, count: flatTree.length });
  } catch (error: any) {
    res.json({ error: error.message, tree: [], count: 0 });
  }
});
```

**結果**: ❌ **効果なし**

理由: `storage.getAllRequirements()` 自体が階層構造データを返しており、そのデータ構造の中で同じ要求が複数回参照されている

## 解決策の提案

### ✅ 推奨: storage.getAllRequirements() の修正

**ファイル**: `src/storage.ts`

**必要な対応**:

1. `getAllRequirements()` が完全にフラットなデータを返すように修正
2. 階層構造（children）を含まないようにする
3. 各要求を1回だけ返す

**実装例**:
```typescript
async getAllRequirements(): Promise<Requirement[]> {
  await this.initialize();

  // 全ての要求をフラットに取得
  const allRequirements: Requirement[] = [];
  const seenIds = new Set<string>();

  for (const req of this.requirements.values()) {
    if (!seenIds.has(req.id)) {
      // childrenを含まないクリーンなオブジェクトを作成
      const { ...cleanReq } = req;
      delete (cleanReq as any).children;

      allRequirements.push(cleanReq);
      seenIds.add(req.id);
    }
  }

  return allRequirements;
}
```

### 代替案: 専用メソッドの追加

階層構造が他の機能で必要な場合は、フラットリスト用の専用メソッドを追加:

```typescript
// 階層構造を返す（既存の動作を維持）
async getAllRequirements(): Promise<Requirement[]> {
  // 現在の実装
}

// フラットリストを返す（新規追加）
async getAllRequirementsFlat(): Promise<Requirement[]> {
  await this.initialize();
  return Array.from(this.requirements.values());
}
```

そして、ツリービューでは `getAllRequirementsFlat()` を使用:

```typescript
app.get('/api/tree', async (req, res) => {
  const requirements = await storage.getAllRequirementsFlat();
  // ...
});
```

## デバッグ情報

### コンソールログが表示されない問題

デバッグ用に以下のログを追加しましたが、ブラウザのコンソールに表示されません:

```javascript
console.log('受信したツリーデータ:', tree.length + '件');
console.log('処理中の要求:', req.id, req.title);
console.warn('重複検出:', req.id, 'はすでに', type, 'グループに存在します');
```

**確認事項**:
- F12キーで開発者ツールを開く
- Consoleタブを選択
- ページをリロード（Ctrl+R）
- エラーメッセージの有無を確認

## 影響範囲

### 影響を受ける機能
- ✅ ツリービュー (`/tree`)
- ❓ 他のビュー（要確認）

### 正常に動作している機能
- ✅ バージョン番号表示（リロードごとに更新）
- ✅ グループの展開・折りたたみ
- ✅ 要求の詳細表示
- ✅ リアルタイム更新

## 関連ファイル

- `src/storage.ts` - データストレージ層（**要修正**）
- `src/view-server.ts:1191-1221` - `/api/tree` エンドポイント
- `src/view-server.ts:519-570` - フロントエンドのrenderTree関数
- `src/tree-view.ts` - TreeBuilder（現在未使用）
- `src/types.ts` - Requirement型定義

## 環境情報

- **Node.js**: v22.20.0
- **TypeScript**: 5.8.3
- **Express**: 5.1.0
- **ブラウザ**: Chrome/Edge
- **ポート**: 5002

## 優先度

**Priority**: High 🔴

理由: ユーザーに誤解を与える可能性があり、要求管理の基本機能に影響

## ラベル

- `bug` - バグ修正
- `priority-high` - 高優先度
- `backend` - バックエンド修正が必要
- `data-structure` - データ構造の問題

## チェックリスト

実装時の確認事項:

- [ ] `storage.getAllRequirements()` が重複のないフラットなデータを返すことを確認
- [ ] 既存の機能（階層構造が必要な箇所）が正常に動作することを確認
- [ ] ツリービューで各要求が1回だけ表示されることを確認
- [ ] ブラウザのコンソールログが正しく表示されることを確認
- [ ] ユニットテストを追加
- [ ] 統合テストを追加

## 補足

このIssueは、`.github/ISSUE_TREE_VIEW_DUPLICATION.md` に詳細な調査結果が記録されています。

---

**作成日**: 2025-10-18
**報告者**: @sawadari
**ステータス**: Open
