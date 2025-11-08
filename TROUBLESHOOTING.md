# トラブルシューティング：UI更新が反映されない問題

## 問題の概要
dynamic-shell.tsにプロジェクトセレクターのHTMLコードを追加したが、ブラウザで表示されるまでに時間がかかった。

## 根本原因の分析

### 1. **複数のサーバープロセスが同時実行されていた**
- 問題発生時、100以上のnodeプロセスが起動していた
- 古いプロセスがポート5002を占有していた可能性
- 新しいコードを読み込んだサーバーではなく、古いサーバーにアクセスしていた

### 2. **ブラウザキャッシュ**
- ブラウザが古いHTMLをキャッシュしていた
- 通常のリロードではキャッシュがクリアされない

### 3. **tsx実行時のモジュールキャッシュ**
- TypeScriptファイルをトランスパイルした結果がキャッシュされる
- `--no-cache`フラグを使用していたが、既に起動中のプロセスには影響しない

## 検証結果

```bash
# テストスクリプトで直接実行した場合
npx tsx test-dynamic-shell.ts
# → プロジェクトセレクターは正しく含まれていた

# サーバー経由で確認
curl http://localhost:5002/ui/dynamic | grep "project-selector"
# → 最初は見つからなかった
# → プロセス再起動後は正しく含まれていた
```

## 解決策

### 即座に反映させる手順

1. **全サーバープロセスを確実に停止**
   ```bash
   # ポート5002を使用しているプロセスを特定
   netstat -ano | findstr ":5002"

   # プロセスを強制終了（Windowsの場合）
   cmd //c "taskkill /F /PID <PID> 2>nul"
   ```

2. **キャッシュをクリア**
   ```bash
   # tsxキャッシュをクリア
   rm -rf node_modules/.cache

   # ブラウザでスーパーリロード
   # Chrome/Edge: Ctrl+Shift+R
   # Firefox: Ctrl+F5
   ```

3. **サーバーを再起動**
   ```bash
   npm run view-server
   ```

4. **変更が反映されたか確認**
   ```bash
   # HTMLに含まれているか確認
   curl -s http://localhost:5002/ui/dynamic | grep "project-selector-container"

   # デバッグログで確認（view-server.tsにログ追加済み）
   # コンソールに以下が表示されるはず：
   # [DEBUG] HTML length: 29014
   # [DEBUG] Has project-selector-container: true
   ```

## 予防策

### 1. **開発時の推奨ワークフロー**

```bash
# 監視モードでサーバーを起動（ファイル変更時に自動再起動）
npm run view-server:watch
```

### 2. **デバッグログの追加**

view-server.tsに既に追加済み：

```typescript
app.get('/ui/dynamic', (_req, res) => {
  const html = renderDynamicShell({ title: 'Requirements Command Board - Dynamic' });
  console.log('[DEBUG] HTML length:', html.length);
  console.log('[DEBUG] Has project-selector-container:', html.includes('project-selector-container'));
  res.send(html);
});
```

これにより、サーバーが正しいHTMLを生成しているかすぐに確認できます。

### 3. **開発時のブラウザ設定**

- DevToolsを開いた状態で「Disable cache」をチェック
- または、プライベートブラウジングモードを使用

### 4. **プロセス管理の改善**

```bash
# 起動前に既存プロセスをクリーンアップ
npm run view-server:clean

# または package.json に追加:
"scripts": {
  "view-server:clean": "taskkill /F /IM node.exe /T 2>nul || true && npm run view-server"
}
```

## 今回の問題が発生した理由のまとめ

1. **コード自体は正しかった**
   - dynamic-shell.tsのプロジェクトセレクターコードは最初から正しく書かれていた
   - test-dynamic-shell.tsで直接実行した時点で確認済み

2. **古いプロセスが動き続けていた**
   - 複数回の再起動試行で多数のnodeプロセスが残っていた
   - 最後に全プロセスを停止してから起動したサーバーで正しく動作した

3. **ブラウザキャッシュの影響**
   - 古いHTMLがブラウザにキャッシュされていた可能性

## 教訓

- **UI変更時は必ずプロセスを確実に停止してから再起動**
- **ブラウザキャッシュをクリアする習慣をつける**
- **デバッグログで問題の切り分けを早期に行う**
- **直接実行テストで問題箇所を特定する**（今回のtest-dynamic-shell.tsのような方法）

## 次回の対応

UI更新が反映されない場合の診断チェックリスト：

1. [ ] コード自体は正しいか？（テストスクリプトで直接実行）
2. [ ] サーバープロセスは最新のコードを読み込んでいるか？（デバッグログ確認）
3. [ ] ブラウザキャッシュをクリアしたか？（スーパーリロード）
4. [ ] 古いプロセスが残っていないか？（netstat確認）

この順序で確認すれば、問題を素早く特定できます。
