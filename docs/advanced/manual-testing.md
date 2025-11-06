# MCP Server 手動テスト - コマンド例

## JSON-RPC 2.0形式でのコマンド送信

MCPサーバーは標準入出力(stdio)でJSON-RPC 2.0プロトコルを使用します。

### 基本的なメッセージ構造

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "メソッド名",
  "params": { /* パラメータ */ }
}
```

---

## 1. 初期化 (Initialize)

**送信:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {
      "name": "manual-client",
      "version": "1.0.0"
    }
  }
}
```

**応答:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2024-11-05",
    "capabilities": {
      "tools": {}
    },
    "serverInfo": {
      "name": "requirements-mcp-server",
      "version": "1.0.0"
    }
  }
}
```

---

## 2. ツール一覧を取得 (tools/list)

**送信:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list",
  "params": {}
}
```

**応答:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "tools": [
      {
        "name": "add_requirement",
        "description": "新しい要求を追加",
        "inputSchema": { ... }
      },
      {
        "name": "get_requirement",
        "description": "要求を取得",
        "inputSchema": { ... }
      },
      // ... 他のツール
    ]
  }
}
```

---

## 3. 要求を追加 (add_requirement)

**送信:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "add_requirement",
    "arguments": {
      "title": "ユーザー認証機能",
      "description": "JWTを使用したユーザー認証システムを実装する",
      "priority": "high",
      "category": "セキュリティ",
      "tags": ["認証", "JWT", "セキュリティ"]
    }
  }
}
```

**応答:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "要求を追加しました: REQ-1730909902182"
      }
    ]
  }
}
```

---

## 4. 要求をリスト (list_requirements)

**送信:**
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "method": "tools/call",
  "params": {
    "name": "list_requirements",
    "arguments": {}
  }
}
```

**応答:**
```json
{
  "jsonrpc": "2.0",
  "id": 4,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "要求一覧 (合計: 1件)\n\nREQ-1730909902182\nタイトル: ユーザー認証機能\n..."
      }
    ]
  }
}
```

---

## 5. 要求を取得 (get_requirement)

**送信:**
```json
{
  "jsonrpc": "2.0",
  "id": 5,
  "method": "tools/call",
  "params": {
    "name": "get_requirement",
    "arguments": {
      "id": "REQ-1730909902182"
    }
  }
}
```

---

## 6. 要求を検索 (search_requirements)

**送信:**
```json
{
  "jsonrpc": "2.0",
  "id": 6,
  "method": "tools/call",
  "params": {
    "name": "search_requirements",
    "arguments": {
      "priority": "high",
      "status": "draft"
    }
  }
}
```

---

## 7. 影響範囲を分析 (analyze_impact)

**送信:**
```json
{
  "jsonrpc": "2.0",
  "id": 7,
  "method": "tools/call",
  "params": {
    "name": "analyze_impact",
    "arguments": {
      "id": "REQ-1730909902182"
    }
  }
}
```

---

## 8. 依存関係グラフを取得 (get_dependency_graph)

**送信:**
```json
{
  "jsonrpc": "2.0",
  "id": 8,
  "method": "tools/call",
  "params": {
    "name": "get_dependency_graph",
    "arguments": {
      "id": "REQ-1730909902182"
    }
  }
}
```

---

## 9. 変更提案を作成 (propose_change)

**送信:**
```json
{
  "jsonrpc": "2.0",
  "id": 9,
  "method": "tools/call",
  "params": {
    "name": "propose_change",
    "arguments": {
      "targetRequirementId": "REQ-1730909902182",
      "proposedChanges": [
        {
          "field": "priority",
          "currentValue": "high",
          "proposedValue": "critical",
          "reason": "セキュリティの脆弱性が発見されたため"
        }
      ],
      "proposer": "test-user",
      "rationale": "緊急対応が必要"
    }
  }
}
```

---

## 実際のテスト方法

### 方法1: echoとパイプを使用

```bash
cd requirements-mcp-server

# 初期化
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | node build/index.js

# ツール一覧
echo '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' | node build/index.js

# 要求を追加
echo '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"add_requirement","arguments":{"title":"テスト","description":"テスト説明","priority":"high","category":"テスト"}}}' | node build/index.js
```

### 方法2: test-mcp-manual.jsスクリプトを使用

```bash
node test-mcp-manual.js
```

インタラクティブモードで以下のコマンドが使えます:
- `list` - ツール一覧
- `add` - 要求追加
- `all` - 全要求リスト
- `get <id>` - 要求取得
- `search` - 検索
- `help` - ヘルプ
- `exit` - 終了

### 方法3: curlを使用（HTTPエンドポイント経由）

MCPサーバーはstdioモードのため、curlは使えません。
WebビューアーのAPIエンドポイントを使用してください:

```bash
# Webビューアーが起動している場合
curl http://localhost:5002/api/requirements
```

---

## 利用可能なMCPツール (16個)

1. **add_requirement** - 新しい要求を追加
2. **get_requirement** - 要求を取得
3. **list_requirements** - すべての要求をリスト
4. **update_requirement** - 要求を更新
5. **delete_requirement** - 要求を削除
6. **search_requirements** - 条件検索
7. **analyze_impact** - 影響範囲分析
8. **get_dependency_graph** - 依存関係グラフ取得
9. **validate_requirement** - 要求の検証
10. **validate_all_requirements** - 全要求の検証
11. **get_validation_report** - 検証レポート取得
12. **propose_change** - 変更提案作成
13. **load_policy** - ポリシー読み込み
14. **preview_fixes** - 修正プレビュー
15. **apply_fixes** - 修正適用
16. **rollback_fixes** - 修正ロールバック

---

## デバッグ情報

- **MCPサーバーログ**: `stderr` にJSON形式で出力
- **操作ログ**: `data/logs/operations-YYYY-MM-DD.jsonl`
- **データファイル**: `data/requirements.json`
