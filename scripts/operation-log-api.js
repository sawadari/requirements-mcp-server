// 操作ログAPIエンドポイント - view-server.tsに追加するコード

const operationLogAPI = `
// 操作ログのコンテンツを取得
app.get('/api/operation-logs', async (req, res) => {
  try {
    const logger = new OperationLogger('./data');
    await logger.initialize();

    const logs = logger.getAllLogs();
    const stats = logger.getStatistics();

    // HTMLを生成
    let html = \\\`
      <h1>🔍 操作履歴（デバッグ）</h1>
      <p>MCPサーバーへのすべての操作を記録</p>
      <hr>

      <h2>📊 統計情報</h2>
      <table>
        <tr><th>総操作数</th><td>\\\${stats.totalOperations}</td></tr>
        <tr><th>成功</th><td style="color: #10b981">\\\${stats.successCount}</td></tr>
        <tr><th>エラー</th><td style="color: #ef4444">\\\${stats.errorCount}</td></tr>
        <tr><th>平均実行時間</th><td>\\\${stats.averageDuration.toFixed(2)}ms</td></tr>
      </table>

      <h2>📝 操作履歴</h2>
    \\\`;

    if (logs.length === 0) {
      html += '<p style="color: #94a3b8">まだ操作履歴がありません</p>';
    } else {
      logs.forEach(log => {
        const timestamp = new Date(log.timestamp).toLocaleString('ja-JP');
        const statusIcon = log.error ? '❌' : '✅';
        const statusColor = log.error ? '#ef4444' : '#10b981';

        html += \\\`
          <div style="border: 1px solid #475569; border-radius: 8px; padding: 16px; margin: 16px 0; background: #1e293b">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px">
              <span style="color: \\\${statusColor}; font-size: 20px">\\\${statusIcon}</span>
              <span style="color: #cbd5e1; font-size: 13px">\\\${timestamp}</span>
            </div>

            <h3 style="margin: 0 0 8px 0; color: #f1f5f9">\\\${log.operation}</h3>
            <p style="color: #94a3b8; font-size: 13px; margin: 4px 0">
              <strong>ツール:</strong> \\\${log.toolName}
              \\\${log.duration ? \\\` | <strong>実行時間:</strong> \\\${log.duration}ms\\\` : ''}
            </p>

            \\\${log.error ? \\\`
              <div style="background: #7f1d1d; padding: 12px; border-radius: 4px; margin-top: 12px">
                <strong style="color: #fca5a5">エラー:</strong>
                <pre style="margin: 8px 0 0 0; color: #fecaca">\\\${log.error}</pre>
              </div>
            \\\` : ''}

            <details style="margin-top: 12px">
              <summary style="cursor: pointer; color: #3b82f6">詳細を表示</summary>
              <div style="margin-top: 12px; padding: 12px; background: #0f172a; border-radius: 4px">
                <h4 style="margin: 0 0 8px 0; color: #f1f5f9">パラメータ:</h4>
                <pre style="color: #cbd5e1; font-size: 12px; overflow-x: auto">\\\${JSON.stringify(log.parameters, null, 2)}</pre>

                \\\${log.result ? \\\`
                  <h4 style="margin: 16px 0 8px 0; color: #f1f5f9">結果:</h4>
                  <pre style="color: #cbd5e1; font-size: 12px; overflow-x: auto">\\\${JSON.stringify(log.result, null, 2)}</pre>
                \\\` : ''}

                \\\${log.beforeState ? \\\`
                  <h4 style="margin: 16px 0 8px 0; color: #f1f5f9">変更前:</h4>
                  <pre style="color: #cbd5e1; font-size: 12px; overflow-x: auto">\\\${JSON.stringify(log.beforeState, null, 2)}</pre>
                \\\` : ''}

                \\\${log.afterState ? \\\`
                  <h4 style="margin: 16px 0 8px 0; color: #f1f5f9">変更後:</h4>
                  <pre style="color: #cbd5e1; font-size: 12px; overflow-x: auto">\\\${JSON.stringify(log.afterState, null, 2)}</pre>
                \\\` : ''}
              </div>
            </details>
          </div>
        \\\`;
      });
    }

    res.json({ html });
  } catch (error) {
    res.json({
      error: \\\`操作ログの読み込みに失敗しました: \\\${error.message}\\\`,
    });
  }
});
`;

console.log(operationLogAPI);
