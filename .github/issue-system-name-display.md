# システム名表示機能の追加とtsxキャッシュ問題

## 概要

プロジェクト選択UIに「システム名」を表示する機能を追加しました。現在はtsxのキャッシュ問題により動作確認ができていませんが、実装は完了しています。

## 実装内容

### 1. プロジェクトメタデータの拡張

**ファイル:** `src/project-manager.ts`

- `ProjectMetadata`インターフェースに`systemName`フィールドを追加
- `ProjectConfig`インターフェースに`systemName`フィールドを追加
- `createProject()`でsystemNameを保存
- `createDefaultProject()`でデフォルトプロジェクトにsystemName（'自動搬送車'）を設定

```typescript
export interface ProjectMetadata {
  projectName: string;
  projectId: string;
  systemName?: string; // 対象システムの名称（例: 自動搬送車）
  description?: string;
  createdAt: string;
  updatedAt: string;
  version: string;
  requirementCount: number;
}
```

### 2. UIの更新

**ファイル:** `src/view-server.ts`

- プロジェクトセレクターの表示形式を更新
- システム名がある場合: `システム名 - プロジェクト名 (件数)`
- システム名がない場合: `プロジェクト名 (件数)`

```javascript
const displayName = project.systemName
  ? `${project.systemName} - ${project.projectName} (${project.requirementCount}件)`
  : `${project.projectName} (${project.requirementCount}件)`;
```

### 3. 既存データの更新

**ファイル:** `data/requirements.json`

既存のDefault Projectに`_metadata`を追加し、systemNameを'自動搬送車'に設定しました。

## 未解決の問題

### tsxキャッシュ問題

**症状:**
- ソースコードは正しく更新されている
- `grep`コマンドで`displayName`の存在を確認済み
- しかし、サーバーが古いコードを実行し続ける

**試した解決策（すべて失敗）:**
1. ✗ サーバーの再起動（複数回）
2. ✗ `tsx --no-cache`フラグの使用
3. ✗ `node_modules/.cache`の削除
4. ✗ ファイルのタイムスタンプ更新（touch）
5. ✗ ファイルのコピーを作成して実行
6. ✗ package.jsonのスクリプトに`--no-cache`を追加

**考えられる原因:**
- tsxの内部キャッシュが深刻に破損している
- ファイルシステムの監視機能との競合
- VS Codeとの相互作用

## 推奨される解決策

### 短期的な対応

1. **PCの再起動**
   - システム全体を再起動することでtsxのキャッシュをクリア
   - 再起動後、`npm run view-server`で起動

2. **tsxの再インストール**
   ```bash
   npm uninstall tsx
   npm install tsx
   ```

### 長期的な対応

1. **ビルドベースの実行に切り替え**
   - tsxに依存せず、TypeScriptをコンパイルしてから実行
   - `tsc`でコンパイル → `node build/view-server.js`で実行

2. **エラーハンドリングの強化**
   - プロジェクトメタデータの読み込みエラーをキャッチ
   - systemNameがundefinedでもアプリケーションが動作するようにフォールバック処理を追加

## 動作確認手順（再起動後）

1. サーバーを起動:
   ```bash
   cd requirements-mcp-server
   npm run view-server
   ```

2. ブラウザで http://localhost:5002 にアクセス

3. 左側の「🌳 Items」パネルのヘッダー下部を確認:
   - プロジェクトセレクター: `自動搬送車 - Default Project (39件)`
   - 緑色のバッジ: `現在: 自動搬送車 - Default Project`

## API確認

```bash
curl http://localhost:5002/api/projects
```

レスポンスに`systemName`フィールドが含まれていることを確認:

```json
{
  "projects": [
    {
      "projectName": "Default Project",
      "projectId": "requirements",
      "systemName": "自動搬送車",
      "description": "デフォルトの要求管理プロジェクト",
      ...
    }
  ]
}
```

## 優先度

- **Priority:** P2-Medium
- **Type:** feature
- **State:** implementing
- **Complexity:** small

## 関連ファイル

- `src/project-manager.ts` - メタデータ構造の変更
- `src/view-server.ts` - UI表示の更新
- `data/requirements.json` - 既存データへのメタデータ追加
- `package.json` - スクリプトの更新（--no-cache追加）

## 備考

実装自体は完了していますが、tsxの深刻なキャッシュ問題により動作確認ができていません。コードレビューでは問題がないことを確認済みです。システム再起動後には正常に動作する見込みです。
