/**
 * view-serverにMCP Chat Assistantを統合するパッチスクリプト
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VIEW_SERVER_PATH = path.join(__dirname, '../src/view-server.ts');

async function main() {
  console.log('🔧 Patching view-server.ts to integrate MCP Chat Assistant...\n');

  // ファイルを読み込み
  let content = await fs.readFile(VIEW_SERVER_PATH, 'utf-8');

  // 1. import文を追加
  if (!content.includes('mcp-chat-assistant')) {
    console.log('✅ Adding MCP Chat Assistant import...');
    content = content.replace(
      /import \{ createEnhancedChatAssistant.*?\} from '.\/enhanced-chat-assistant\.js';/,
      `import { createEnhancedChatAssistant, EnhancedAIChatAssistant } from './enhanced-chat-assistant.js';
import { createMCPChatAssistant, MCPChatAssistant } from './mcp-chat-assistant.js';`
    );
  } else {
    console.log('ℹ️  MCP Chat Assistant import already exists');
  }

  // 2. 変数宣言を追加
  if (!content.includes('mcpChatAssistant')) {
    console.log('✅ Adding MCP Chat Assistant variables...');
    content = content.replace(
      /let enhancedChatReady = false;\nlet chatAssistantReady = false;/,
      `let enhancedChatReady = false;
let chatAssistantReady = false;
let mcpChatAssistant: MCPChatAssistant | null = null;
let mcpChatReady = false;`
    );
  } else {
    console.log('ℹ️  MCP Chat Assistant variables already exist');
  }

  // 3. 初期化コードを追加
  if (!content.includes('mcpChatAssistant = await createMCPChatAssistant')) {
    console.log('✅ Adding MCP Chat Assistant initialization...');
    content = content.replace(
      /(console\.log\('✅ Enhanced Chat Assistant \(Orchestrator\) initialized'\);)\n(\}\)\(\);)/,
      `$1

  // Initialize MCP Chat Assistant (fallback to Enhanced if it fails)
  try {
    mcpChatAssistant = await createMCPChatAssistant();
    mcpChatReady = true;
    console.log('✅ MCP Chat Assistant initialized');
  } catch (error: any) {
    console.warn('⚠️  MCP Chat Assistant initialization failed:', error.message);
    console.warn('    Falling back to Enhanced Chat Assistant');
  }
$2`
    );
  } else {
    console.log('ℹ️  MCP Chat Assistant initialization already exists');
  }

  // 4. チャットエンドポイントを更新
  if (!content.includes('mcpChatReady && mcpChatAssistant')) {
    console.log('✅ Updating chat endpoint to use MCP Chat Assistant...');
    content = content.replace(
      /\/\/ Enhanced Chat Assistant \(Orchestrator\)を優先使用\n\s+if \(enhancedChatReady && enhancedChatAssistant\.isAvailable\(\)\) \{/,
      `// MCP Chat Assistant (highest priority)
    if (mcpChatReady && mcpChatAssistant && mcpChatAssistant.isAvailable()) {
      console.log('[Chat] Using MCP Chat Assistant');
      const response = await mcpChatAssistant.chat(message);
      res.json({ response });
    } else if (enhancedChatReady && enhancedChatAssistant.isAvailable()) {`
    );
  } else {
    console.log('ℹ️  Chat endpoint already uses MCP Chat Assistant');
  }

  // 5. clearエンドポイントを更新
  if (!content.includes('mcpChatAssistant?.clearHistory')) {
    console.log('✅ Updating clear endpoint...');
    const clearEndpointMatch = content.match(
      /(app\.post\('\/api\/chat\/clear'.*?\n.*?try \{[\s\S]*?)(res\.json\(\{ message: '会話履歴をクリアしました' \}\);)/
    );
    if (clearEndpointMatch) {
      const before = clearEndpointMatch[1];
      const after = clearEndpointMatch[2];
      content = content.replace(
        clearEndpointMatch[0],
        `${before}
    // Clear all chat assistants
    if (mcpChatAssistant) {
      mcpChatAssistant.clearHistory();
    }
    ${after}`
      );
    }
  } else {
    console.log('ℹ️  Clear endpoint already updated');
  }

  // 書き込み
  await fs.writeFile(VIEW_SERVER_PATH, content, 'utf-8');
  console.log('\n✅ Patch completed successfully!');
  console.log('📝 Modified:', VIEW_SERVER_PATH);
}

main().catch(err => {
  console.error('❌ Patch failed:', err);
  process.exit(1);
});
