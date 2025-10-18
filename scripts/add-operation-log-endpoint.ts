/**
 * view-server.tsに追加する操作ログAPIのコード
 */

// 既存の app.get('/api/view/:viewId') を修正して、operation-logsの処理を追加

const modifiedAPI = `
app.get('/api/view/:viewId', async (req, res) => {
  const { viewId } = req.params;

  try {
    // operation-logsビューの場合は専用処理
    if (viewId === 'operation-logs') {
      const logger = new OperationLogger('./data');
      await logger.initialize();

      const logs = logger.getAllLogs();
      const stats = logger.getStatistics();

      let html = '<h1>🔍 操作履歴（デバッグ）</h1><p>MCPサーバーへのすべての操作を記録</p><hr><h2>📊 統計情報</h2><table><tr><th>総操作数</th><td>' + stats.totalOperations + '</td></tr><tr><th>成功</th><td style="color: #10b981">' + stats.successCount + '</td></tr><tr><th>エラー</th><td style="color: #ef4444">' + stats.errorCount + '</td></tr></table><h2>📝 操作履歴</h2>';

      if (logs.length === 0) {
        html += '<p style="color: #94a3b8">まだ操作履歴がありません</p>';
      } else {
        logs.forEach(log => {
          const timestamp = new Date(log.timestamp).toLocaleString('ja-JP');
          const statusIcon = log.error ? '❌' : '✅';
          const statusColor = log.error ? '#ef4444' : '#10b981';

          html += '<div style="border: 1px solid #475569; border-radius: 8px; padding: 16px; margin: 16px 0; background: #1e293b"><div style="display: flex; justify-content: space-between;"><span style="color: ' + statusColor + '">' + statusIcon + ' ' + log.operation + '</span><span style="color: #cbd5e1; font-size: 13px">' + timestamp + '</span></div><p style="color: #94a3b8; font-size: 13px"><strong>ツール:</strong> ' + log.toolName + (log.duration ? ' | <strong>実行時間:</strong> ' + log.duration + 'ms' : '') + '</p>';

          if (log.error) {
            html += '<div style="background: #7f1d1d; padding: 12px; border-radius: 4px; margin-top: 12px"><strong style="color: #fca5a5">エラー:</strong><pre style="margin: 8px 0 0 0; color: #fecaca">' + log.error + '</pre></div>';
          }

          html += '<details style="margin-top: 12px"><summary style="cursor: pointer; color: #3b82f6">詳細を表示</summary><div style="margin-top: 12px; padding: 12px; background: #0f172a; border-radius: 4px"><h4>パラメータ:</h4><pre style="color: #cbd5e1; font-size: 12px">' + JSON.stringify(log.parameters, null, 2) + '</pre>';

          if (log.result) {
            html += '<h4 style="margin-top: 16px">結果:</h4><pre style="color: #cbd5e1; font-size: 12px">' + JSON.stringify(log.result, null, 2) + '</pre>';
          }

          html += '</div></details></div>';
        });
      }

      return res.json({ html, lastModified: Date.now() });
    }

    // 通常のビューの処理
    const mdPath = path.join(process.cwd(), 'views', 'markdown', \`\${viewId}.md\`);
    const content = await fs.readFile(mdPath, 'utf-8');
    const html = marked(content);
    const stats = await fs.stat(mdPath);

    res.json({
      html,
      lastModified: stats.mtimeMs,
    });
  } catch (error) {
    res.json({
      error: \`ビューの読み込みに失敗しました: \${error.message}\`,
    });
  }
});
`;

console.log("このコードをview-server.tsの既存のapp.get('/api/view/:viewId')と置き換えてください");
