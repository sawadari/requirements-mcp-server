/**
 * Intent Analyzerに update インテントを追加
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INTENT_ANALYZER_PATH = path.join(__dirname, '../src/orchestrator/intent-analyzer.ts');

async function main() {
  console.log('🔧 Adding update intent to IntentAnalyzer...\n');

  let content = await fs.readFile(INTENT_ANALYZER_PATH, 'utf-8');

  // updateインテントを追加
  const updateRule = `
    // update: 「ステータスを変更」「承認済にする」など
    if (msg.includes('ステータス') || msg.includes('status') ||
        msg.includes('変更') || msg.includes('update') ||
        msg.includes('承認済') || msg.includes('approved')) {
      const reqIdMatch = userMessage.match(/([A-Z]+-\\d+)/i);
      const statusMatch = msg.match(/(承認済|approved|draft|proposed|in_progress|completed|rejected|on_hold)/i);
      return {
        type: 'update',
        entities: {
          requirementId: reqIdMatch ? reqIdMatch[1].toUpperCase() : undefined,
          status: statusMatch ? statusMatch[1] : undefined,
        },
        confidence: 0.8,
        rawMessage: userMessage,
      };
    }
`;

  // fix:の前に挿入
  const fixRuleStart = `    // fix: 「修正」「自動修正」など`;

  if (content.includes(fixRuleStart) && !content.includes("// update: 「ステータスを変更」")) {
    content = content.replace(fixRuleStart, updateRule + '\n' + fixRuleStart);
    console.log('✅ Added update intent rule');
  } else if (content.includes("// update: 「ステータスを変更」")) {
    console.log('ℹ️  Update intent rule already exists');
  } else {
    console.log('⚠️  Could not find insertion point');
  }

  await fs.writeFile(INTENT_ANALYZER_PATH, content, 'utf-8');
  console.log('\n✅ Patch completed');
  console.log('📝 Modified:', INTENT_ANALYZER_PATH);
}

main().catch(err => {
  console.error('❌ Patch failed:', err);
  process.exit(1);
});
