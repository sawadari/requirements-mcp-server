/**
 * 違反の詳細分析
 */

import { RequirementsStorage } from '../src/storage.js';
import { ValidationEngine } from '../src/validation/validation-engine.js';

const storage = new RequirementsStorage('./data');
await storage.initialize();

const engine = await ValidationEngine.create();
const allRequirements = await storage.getAllRequirements();
const requirementsMap = new Map(allRequirements.map(r => [r.id, r]));

const results = await engine.validateAll(requirementsMap, {
  useLLM: false,
  updateMetrics: false
});

// 違反をルールIDごとに集計
const violationsByRule = new Map<string, number>();
const violationsByDomain = new Map<string, number>();

Array.from(results.values()).forEach(result => {
  result.violations.forEach(v => {
    violationsByRule.set(v.ruleId, (violationsByRule.get(v.ruleId) || 0) + 1);
    violationsByDomain.set(v.domain, (violationsByDomain.get(v.domain) || 0) + 1);
  });
});

console.log('=== 違反の種類別集計 ===\n');

console.log('■ ドメイン別:');
Array.from(violationsByDomain.entries())
  .sort((a, b) => b[1] - a[1])
  .forEach(([domain, count]) => {
    console.log(`  ${domain}: ${count}件`);
  });

console.log('\n■ ルールID別 (上位10件):');
Array.from(violationsByRule.entries())
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .forEach(([ruleId, count]) => {
    console.log(`  ${ruleId}: ${count}件`);
  });

// 最も多い違反の詳細を表示
const topRuleId = Array.from(violationsByRule.entries())
  .sort((a, b) => b[1] - a[1])[0][0];

console.log(`\n=== 最も多い違反: ${topRuleId} ===`);

const examplesWithTopRule = Array.from(results.entries())
  .filter(([id, result]) => result.violations.some(v => v.ruleId === topRuleId))
  .slice(0, 5);

examplesWithTopRule.forEach(([id, result]) => {
  const req = requirementsMap.get(id);
  const violation = result.violations.find(v => v.ruleId === topRuleId);
  console.log(`\n${id}: ${req?.title}`);
  console.log(`  メッセージ: ${violation?.message}`);
  if (violation?.suggestedFix) {
    console.log(`  推奨修正: ${violation.suggestedFix}`);
  }
});

process.exit(0);
