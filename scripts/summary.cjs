const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data/requirements.json', 'utf-8'));

console.log('=== 最終確認 ===\n');

// 要求の種類別集計
const byType = {
  stakeholder: 0,
  system: 0,
  system_functional: 0
};

Object.values(data).forEach(req => {
  if (req.type) byType[req.type]++;
});

console.log('要求数:');
console.log(`  総数: ${Object.keys(data).length}`);
console.log(`  ステークホルダ要求: ${byType.stakeholder}`);
console.log(`  システム要求: ${byType.system}`);
console.log(`  機能要求: ${byType.system_functional}`);

// ステータス別集計
const byStatus = {};
Object.values(data).forEach(req => {
  byStatus[req.status] = (byStatus[req.status] || 0) + 1;
});

console.log('\nステータス別:');
Object.entries(byStatus).sort((a, b) => b[1] - a[1]).forEach(([status, count]) => {
  console.log(`  ${status}: ${count}`);
});

// 優先度別集計
const byPriority = {};
Object.values(data).forEach(req => {
  byPriority[req.priority] = (byPriority[req.priority] || 0) + 1;
});

console.log('\n優先度別:');
['critical', 'high', 'medium', 'low'].forEach(priority => {
  if (byPriority[priority]) {
    console.log(`  ${priority}: ${byPriority[priority]}`);
  }
});
