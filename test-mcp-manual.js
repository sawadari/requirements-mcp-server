#!/usr/bin/env node

/**
 * MCP Server Manual Test Script
 * MCPサーバーに手動でコマンドを送信するテストスクリプト
 */

import { spawn } from 'child_process';
import readline from 'readline';

// MCPサーバープロセスを起動
const mcpServer = spawn('node', ['./build/index.js'], {
  stdio: ['pipe', 'pipe', 'inherit']
});

let messageId = 1;

// 標準出力からの応答を処理
mcpServer.stdout.on('data', (data) => {
  const lines = data.toString().split('\n').filter(line => line.trim());
  lines.forEach(line => {
    try {
      const response = JSON.parse(line);
      console.log('\n📥 Response:');
      console.log(JSON.stringify(response, null, 2));
    } catch (e) {
      console.log('Raw output:', line);
    }
  });
});

// MCPサーバーにメッセージを送信
function sendMessage(method, params = {}) {
  const message = {
    jsonrpc: '2.0',
    id: messageId++,
    method,
    params
  };

  console.log('\n📤 Sending:');
  console.log(JSON.stringify(message, null, 2));

  mcpServer.stdin.write(JSON.stringify(message) + '\n');
}

// 初期化メッセージを送信
setTimeout(() => {
  console.log('🚀 MCPサーバーに接続しました\n');

  // 1. サーバーを初期化
  sendMessage('initialize', {
    protocolVersion: '2024-11-05',
    capabilities: {},
    clientInfo: {
      name: 'manual-test-client',
      version: '1.0.0'
    }
  });

}, 1000);

// インタラクティブモード
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log(`
========================================
🧪 MCP Manual Test Client
========================================

使用可能なコマンド:
  list          - 利用可能なツール一覧を取得
  add           - 新しい要求を追加
  get <id>      - 要求を取得
  all           - すべての要求をリスト
  search        - 要求を検索
  help          - このヘルプを表示
  exit          - 終了

初期化完了後、コマンドを入力してください...
`);

setTimeout(() => {
  // 初期化完了通知を送信
  sendMessage('initialized', {});

  console.log('\n✅ 準備完了！コマンドを入力してください > ');

  // コマンド入力ループ
  rl.on('line', (input) => {
    const [cmd, ...args] = input.trim().split(' ');

    switch (cmd) {
      case 'list':
        sendMessage('tools/list', {});
        break;

      case 'add':
        console.log('📝 新しい要求を追加します...');
        sendMessage('tools/call', {
          name: 'add_requirement',
          arguments: {
            title: 'テスト要求',
            description: 'これは手動テストで追加された要求です',
            priority: 'high',
            category: 'テスト'
          }
        });
        break;

      case 'get':
        if (!args[0]) {
          console.log('❌ エラー: IDを指定してください。例: get REQ-123');
          break;
        }
        sendMessage('tools/call', {
          name: 'get_requirement',
          arguments: { id: args[0] }
        });
        break;

      case 'all':
        sendMessage('tools/call', {
          name: 'list_requirements',
          arguments: {}
        });
        break;

      case 'search':
        sendMessage('tools/call', {
          name: 'search_requirements',
          arguments: {
            priority: 'high'
          }
        });
        break;

      case 'help':
        console.log(`
使用可能なコマンド:
  list          - 利用可能なツール一覧を取得
  add           - 新しい要求を追加
  get <id>      - 要求を取得
  all           - すべての要求をリスト
  search        - 要求を検索（priority=high）
  help          - このヘルプを表示
  exit          - 終了
        `);
        break;

      case 'exit':
        console.log('👋 終了します...');
        mcpServer.kill();
        process.exit(0);
        break;

      default:
        console.log(`❌ 不明なコマンド: ${cmd}`);
        console.log('help コマンドでヘルプを表示');
    }

    console.log('\n> ');
  });

}, 2000);

// プロセス終了時のクリーンアップ
process.on('SIGINT', () => {
  console.log('\n👋 終了します...');
  mcpServer.kill();
  process.exit(0);
});
