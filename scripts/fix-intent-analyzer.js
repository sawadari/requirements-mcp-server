/**
 * IntentAnalyzerのJSON解析を修正するパッチ
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const INTENT_ANALYZER_PATH = path.join(__dirname, '../src/orchestrator/intent-analyzer.ts');

async function main() {
  console.log('🔧 Fixing IntentAnalyzer JSON parsing...\n');

  let content = await fs.readFile(INTENT_ANALYZER_PATH, 'utf-8');

  // JSON解析を改善
  const oldCode = `      const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
      const parsed = JSON.parse(text);`;

  const newCode = `      const text = response.content[0].type === 'text' ? response.content[0].text : '{}';

      // JSONを抽出（コードブロックや説明文を除去）
      const jsonMatch = text.match(/\\{[\\s\\S]*\\}/);
      const jsonText = jsonMatch ? jsonMatch[0] : text;

      const parsed = JSON.parse(jsonText);`;

  if (content.includes(oldCode)) {
    content = content.replace(oldCode, newCode);
    console.log('✅ Fixed JSON parsing logic');
  } else if (content.includes('const jsonMatch')) {
    console.log('ℹ️  JSON parsing already fixed');
  } else {
    console.log('⚠️  Could not find target code to replace');
  }

  await fs.writeFile(INTENT_ANALYZER_PATH, content, 'utf-8');
  console.log('\n✅ Patch completed');
  console.log('📝 Modified:', INTENT_ANALYZER_PATH);
}

main().catch(err => {
  console.error('❌ Patch failed:', err);
  process.exit(1);
});
