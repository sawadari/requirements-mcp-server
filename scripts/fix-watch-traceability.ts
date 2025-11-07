#!/usr/bin/env tsx
/**
 * watch-projectのトレーサビリティ階層違反を修正するスクリプト
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function fixTraceability() {
  // MCPクライアントを初期化
  const client = new Client({
    name: 'fix-traceability-client',
    version: '1.0.0',
  }, {
    capabilities: {},
  });

  const serverPath = path.join(__dirname, '../build/index.js');
  const transport = new StdioClientTransport({
    command: 'node',
    args: [serverPath],
    env: {
      ...process.env,
      MCP_MODE: 'stdio',
    },
  });

  await client.connect(transport);

  console.log('=== watch-project トレーサビリティ階層違反の修正 ===\n');

  // 問題1: FUNC-002 (ストップウォッチ機能) が STK-001 から直接リンク
  console.log('📋 問題1: FUNC-002 (ストップウォッチ機能)');
  console.log('   現状: STK-001 → FUNC-002 (不正)');
  console.log('   修正案を生成中...\n');

  try {
    const proposal1 = await client.callTool({
      name: 'propose_change',
      arguments: {
        requirementId: 'FUNC-002',
        changeType: 'modify',
        reason: 'A1ルール違反: stakeholder要求から直接system_functional要求にリンクしている。system要求を経由する必要がある。',
        description: 'FUNC-002のrefinesをSTK-001からSYS-003（カレンダー表示機能）またはSYS-001（時刻設定機能）に変更する。ストップウォッチは時刻関連機能なのでSYS-001が適切。',
        changes: {
          refines: ['SYS-001']
        }
      }
    });

    console.log('✅ 変更提案1を作成しました:');
    console.log(proposal1.content[0].text);
    console.log('');
  } catch (error: any) {
    console.error(`❌ エラー: ${error.message}\n`);
  }

  // 問題2: FUNC-003 (心拍数計測機能) が STK-002 から直接リンク
  console.log('📋 問題2: FUNC-003 (心拍数計測機能)');
  console.log('   現状: STK-002 → FUNC-003 (不正)');
  console.log('   修正案を生成中...\n');

  try {
    const proposal2 = await client.callTool({
      name: 'propose_change',
      arguments: {
        requirementId: 'FUNC-003',
        changeType: 'modify',
        reason: 'A1ルール違反: stakeholder要求から直接system_functional要求にリンクしている。system要求を経由する必要がある。',
        description: 'FUNC-003のrefinesをSTK-002からSYS-002（GPS位置情報機能）に変更する。ただし、心拍数計測はGPSとは異なる機能なので、新しいシステム要求（健康センサー機能など）を作成するのが理想的。',
        changes: {
          refines: ['SYS-002']
        }
      }
    });

    console.log('✅ 変更提案2を作成しました:');
    console.log(proposal2.content[0].text);
    console.log('');
  } catch (error: any) {
    console.error(`❌ エラー: ${error.message}\n`);
  }

  // 提案の一覧を取得
  console.log('\n📋 作成された変更提案の一覧:');
  try {
    const result = await client.callTool({
      name: 'list_proposals',
      arguments: {}
    });

    console.log(result.content[0].text);
  } catch (error: any) {
    console.error(`❌ エラー: ${error.message}`);
  }

  await client.close();

  console.log('\n' + '='.repeat(60));
  console.log('💡 次のステップ:');
  console.log('='.repeat(60));
  console.log('1. 提案内容を確認してください');
  console.log('2. approve_proposal ツールで提案を承認・適用できます');
  console.log('3. または、手動でwatch-project.jsonを編集することもできます\n');
  console.log('推奨: FUNC-003用に新しいシステム要求「健康センサー機能」を追加');
  console.log('      その後、FUNC-003をその新要求にリンクする方が適切です。\n');
}

fixTraceability().catch(console.error);
