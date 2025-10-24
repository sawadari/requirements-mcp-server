/**
 * 関連付けができていない要求をチェック
 */

const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../data/requirements.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

console.log('=== 関連付けチェック ===\n');

// ステークホルダ要求と関連付けられていないシステム要求
const stakeholderIds = Object.values(data).filter(r => r.type === 'stakeholder').map(r => r.id);
const systemReqs = Object.values(data).filter(r => r.type === 'system');

console.log('■ ステークホルダ要求と関連付けられていないシステム要求:');
let unlinkedSystem = 0;
systemReqs.forEach(req => {
  if (!req.refines || req.refines.length === 0) {
    console.log(`  X ${req.id}: ${req.title}`);
    console.log(`     refines: ${JSON.stringify(req.refines || [])}`);
    unlinkedSystem++;
  }
});
if (unlinkedSystem === 0) {
  console.log('  なし');
}

// システム要求と関連付けられていない機能要求
const systemIds = systemReqs.map(r => r.id);
const funcReqs = Object.values(data).filter(r => r.type === 'system_functional');

console.log('\n■ システム要求と関連付けられていない機能要求:');
let unlinkedFunc = 0;
funcReqs.forEach(req => {
  if (!req.refines || req.refines.length === 0) {
    console.log(`  X ${req.id}: ${req.title}`);
    console.log(`     refines: ${JSON.stringify(req.refines || [])}`);
    unlinkedFunc++;
  }
});
if (unlinkedFunc === 0) {
  console.log('  なし');
}

// 存在しないIDを参照している要求
console.log('\n■ 存在しないIDを参照している要求:');
const allIds = Object.keys(data);
let invalidRefs = 0;
Object.values(data).forEach(req => {
  if (req.refines) {
    req.refines.forEach(refId => {
      if (!allIds.includes(refId)) {
        console.log(`  ! ${req.id}: ${req.title}`);
        console.log(`     -> 存在しないID: ${refId}`);
        invalidRefs++;
      }
    });
  }
});
if (invalidRefs === 0) {
  console.log('  なし');
}

console.log('\n=== サマリー ===');
console.log(`関連付けなしシステム要求: ${unlinkedSystem}件`);
console.log(`関連付けなし機能要求: ${unlinkedFunc}件`);
console.log(`無効な参照: ${invalidRefs}件`);
console.log(`総問題数: ${unlinkedSystem + unlinkedFunc + invalidRefs}件`);
