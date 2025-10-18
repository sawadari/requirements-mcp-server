#!/bin/bash

# view-server.tsのloadView関数にoperation-logs処理を追加

FILE="/c/dev/requirements-mcp-server/src/view-server.ts"

# tryの直後に処理を追加（line 349）
sed -i '349a\
        if (view.id === '"'"'operation-logs'"'"') {\
          const logResponse = await fetch('"'"'/api/operation-logs-data'"'"');\
          const logData = await logResponse.json();\
          \
          let html = '"'"'<h1>🔍 操作履歴</h1><p>まだ操作履歴がありません</p>'"'"';\
          \
          if (logData.logs && logData.logs.length > 0) {\
            html = '"'"'<h1>🔍 操作履歴（デバッグ）</h1><h2>統計: '"'"' + logData.stats.totalOperations + '"'"' 件</h2>'"'"';\
            logData.logs.forEach(log => {\
              html += '"'"'<div style="border:1px solid #475569; padding:16px; margin:16px 0"><h3>'"'"' + log.operation + '"'"'</h3><p>ツール: '"'"' + log.toolName + '"'"'</p><details><summary>詳細</summary><pre>'"'"' + JSON.stringify(log.parameters, null, 2) + '"'"'</pre></details></div>'"'"';\
            });\
          }\
          \
          document.getElementById('"'"'content'"'"').innerHTML = '"'"'<div class="markdown-content">'"'"' + html + '"'"'</div>'"'"';\
          return;\
        }' "$FILE"

echo "✓ Patched operation-logs view handling"
