#!/usr/bin/env tsx

import * as fs from 'fs';

const data = JSON.parse(fs.readFileSync('./data/requirements.json', 'utf-8'));

console.log('=== 要求の分類 ===\n');

const stk: any[] = [];
const sys: any[] = [];
const func: any[] = [];
const other: any[] = [];

for (const [id, req] of Object.entries(data as any)) {
  if (id.startsWith('STK-')) {
    stk.push({ id, title: req.title, type: req.type, refines: req.refines });
  } else if (id.startsWith('SYS-')) {
    sys.push({ id, title: req.title, type: req.type, refines: req.refines, deps: req.dependencies });
  } else if (id.startsWith('FUNC-')) {
    func.push({ id, title: req.title, type: req.type, refines: req.refines, deps: req.dependencies });
  } else {
    other.push({ id, title: req.title, type: req.type });
  }
}

console.log('ステークホルダ要求 (STK-):');
stk.forEach(r => console.log(`  ${r.id}: type=${r.type || 'なし'}, refines=${r.refines || 'なし'}`));

console.log('\nシステム要求 (SYS-):');
sys.forEach(r => console.log(`  ${r.id}: type=${r.type || 'なし'}, refines=${r.refines || 'なし'}, deps=${r.deps?.join(',') || 'なし'}`));

console.log('\nシステム機能要求 (FUNC-):');
func.forEach(r => console.log(`  ${r.id}: type=${r.type || 'なし'}, refines=${r.refines || 'なし'}, deps=${r.deps?.join(',') || 'なし'}`));

console.log('\nその他 (REQ-):');
other.forEach(r => console.log(`  ${r.id}: type=${r.type || 'なし'}`));

console.log('\n=== 修正が必要な要求 ===\n');

console.log('typeフィールドがない要求:');
[...stk, ...sys, ...func].forEach(r => {
  if (!r.type) {
    console.log(`  ${r.id}: ${r.title}`);
  }
});

console.log('\nrefinesがないSYS-/FUNC-要求 (STK-を親に持つべき):');
[...sys, ...func].forEach(r => {
  if (!r.refines || r.refines.length === 0) {
    console.log(`  ${r.id}: ${r.title}`);
  }
});
