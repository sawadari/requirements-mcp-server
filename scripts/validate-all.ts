/**
 * 全要求の妥当性チェック
 */

import { RequirementsStorage } from '../src/storage.js';
import { ValidationEngine } from '../src/validation/validation-engine.js';

const storage = new RequirementsStorage('./data');
await storage.initialize();

const engine = await ValidationEngine.create();
const allRequirements = await storage.getAllRequirements();
const requirementsMap = new Map(allRequirements.map(r => [r.id, r]));

console.log('妥当性チェック実行中...\n');

const results = await engine.validateAll(requirementsMap, {
  useLLM: false,
  updateMetrics: false
});

// 結果の集計
const totalReqs = results.size;
const passedReqs = Array.from(results.values()).filter(r => r.passed).length;
const failedReqs = totalReqs - passedReqs;

console.log('=== 妥当性チェック結果 ===');
console.log(`総要求数: ${totalReqs}`);
console.log(`合格: ${passedReqs} (${(passedReqs/totalReqs*100).toFixed(1)}%)`);
console.log(`違反あり: ${failedReqs} (${(failedReqs/totalReqs*100).toFixed(1)}%)`);

// 違反が多い要求をリストアップ
const failedList = Array.from(results.entries())
  .filter(([id, result]) => !result.passed)
  .sort((a, b) => b[1].violations.length - a[1].violations.length)
  .slice(0, 15);

console.log('\n=== 違反が多い要求 (上位15件) ===');
failedList.forEach(([id, result]) => {
  const req = requirementsMap.get(id);
  console.log(`${id}: ${req?.title}`);
  console.log(`  スコア: ${result.score}/100`);
  console.log(`  違反数: ${result.violations.length}`);

  // エラーのみ表示
  const errors = result.violations.filter(v => v.severity === 'error');
  if (errors.length > 0) {
    errors.slice(0, 3).forEach(v => {
      console.log(`    - [${v.ruleId}] ${v.message}`);
    });
  }
  console.log('');
});

process.exit(0);
