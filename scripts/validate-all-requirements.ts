#!/usr/bin/env tsx
/**
 * すべての要求の妥当性チェックを実行するスクリプト
 */

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function validateAll() {
  const client = new Client({
    name: 'validate-all-client',
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

  const projectId = process.argv[2] || 'watch-project';

  // プロジェクトIDに基づいて要求IDを動的に取得
  let requirementIds: string[];

  if (projectId === 'watch-project') {
    requirementIds = [
      'STK-001', 'STK-002',
      'SYS-001', 'SYS-002', 'SYS-003', 'SYS-004',
      'FUNC-001', 'FUNC-002', 'FUNC-003'
    ];
  } else {
    // 他のプロジェクトの場合は引数から取得
    requirementIds = process.argv.slice(2);
  }

  console.log(`=== ${projectId} - 全要求の妥当性チェック ===\n`);

  let totalViolations = 0;
  let totalRecommendations = 0;

  for (const reqId of requirementIds) {
    console.log(`\n📋 ${reqId} の検証中...`);
    try {
      const result = await client.callTool({
        name: 'validate_requirement',
        arguments: {
          id: reqId
        },
      });

      const resultText = result.content[0].text;
      console.log(resultText);

      // 違反数と推奨事項数を抽出
      const violationsMatch = resultText.match(/違反数[**]*[:：]\s*(\d+)/);
      const recommendationsMatch = resultText.match(/推奨事項[**]*[:：]\s*(\d+)/);

      if (violationsMatch) {
        totalViolations += parseInt(violationsMatch[1]);
      }
      if (recommendationsMatch) {
        totalRecommendations += parseInt(recommendationsMatch[1]);
      }
    } catch (error: any) {
      console.error(`❌ エラー: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 検証結果サマリー');
  console.log('='.repeat(60));
  console.log(`総違反数: ${totalViolations}`);
  console.log(`総推奨事項数: ${totalRecommendations}`);
  console.log(`検証した要求数: ${requirementIds.length}`);

  if (totalViolations === 0 && totalRecommendations === 0) {
    console.log('\n✅ すべての要求が妥当性基準を満たしています！');
  } else {
    console.log('\n⚠️  改善が推奨される要求があります。');
  }

  await client.close();
  process.exit(0);
}

validateAll().catch(console.error);
