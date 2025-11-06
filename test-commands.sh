#!/bin/bash
# MCP Server Manual Test Commands

echo "========================================="
echo "🧪 MCPサーバー 手動テスト"
echo "========================================="
echo ""

# 1. ツール一覧を取得
echo "📝 1. 利用可能なツール一覧を取得"
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | node build/index.js 2>/dev/null &
sleep 1
echo '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' | node build/index.js 2>/dev/null | grep -v "^{.*INFO.*}$" | head -20
echo ""

# 2. 要求を追加
echo "📝 2. 新しい要求を追加"
cat << 'EOF' > /tmp/mcp-add.json
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"add_requirement","arguments":{"title":"テスト要求","description":"手動テストで追加された要求","priority":"high","category":"テスト"}}}
EOF
cat /tmp/mcp-add.json | node build/index.js 2>/dev/null | grep -v "^{.*INFO.*}$" | tail -5
echo ""

# 3. すべての要求をリスト
echo "📝 3. すべての要求をリスト"
cat << 'EOF' > /tmp/mcp-list.json
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}
{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"list_requirements","arguments":{}}}
EOF
cat /tmp/mcp-list.json | node build/index.js 2>/dev/null | grep -v "^{.*INFO.*}$" | tail -10
echo ""

echo "✅ テスト完了"
