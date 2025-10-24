/**
 * 関係性APIのテスト
 */

const fs = require('fs');

const data = JSON.parse(fs.readFileSync('./data/water-heater.json', 'utf8'));

// すべての要求をロード
const allRequirements = Object.keys(data)
  .filter(key => key !== '_metadata')
  .map(key => data[key]);

console.log(`Total requirements: ${allRequirements.length}\n`);

// SYS-001の関係を確認
const id = 'SYS-001';
const requirement = data[id];

console.log(`Checking ${id}:`);
console.log(`  refines: ${JSON.stringify(requirement.refines)}`);
console.log(`  dependencies: ${JSON.stringify(requirement.dependencies)}`);

// 上位要求を取得
const parents = allRequirements.filter(r =>
  (requirement.dependencies && requirement.dependencies.includes(r.id)) ||
  (requirement.refines && requirement.refines.includes(r.id)) ||
  requirement.parentId === r.id
);

console.log(`\nParents of ${id}:`);
parents.forEach(p => {
  console.log(`  - ${p.id}: ${p.title}`);
});

// 下位要求を取得
const children = allRequirements.filter(r =>
  (r.dependencies && r.dependencies.includes(id)) ||
  (r.refines && r.refines.includes(id)) ||
  r.parentId === id
);

console.log(`\nChildren of ${id}:`);
children.forEach(c => {
  console.log(`  - ${c.id}: ${c.title}`);
});
