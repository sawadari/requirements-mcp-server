#!/usr/bin/env tsx
import * as fs from 'fs';

const data = JSON.parse(fs.readFileSync('./data/requirements.json', 'utf-8'));

console.log('=== ツリーグループ化のシミュレーション ===\n');

const groups: any = {
  stakeholder: { name: 'ステークホルダ要求', items: [] },
  system: { name: 'システム要求', items: [] },
  functional: { name: 'システム機能要求', items: [] }
};

Object.entries(data).forEach(([id, req]: [string, any]) => {
  // typeフィールドの正規化: system_functional -> functional
  let type = req.type;
  if (type === 'system_functional') {
    type = 'functional';
  }

  // typeフィールドがない場合、categoryやIDから推測
  if (!type) {
    if (id.startsWith('STK-')) {
      type = 'stakeholder';
    } else if (id.startsWith('SYS-')) {
      type = 'system';
    } else if (id.startsWith('FUNC-')) {
      type = 'functional';
    } else if (req.category?.includes('ステークホルダ')) {
      type = 'stakeholder';
    } else if (req.category?.includes('システム要求')) {
      type = 'system';
    } else if (req.category?.includes('機能') || req.category?.includes('システム機能')) {
      type = 'functional';
    } else {
      type = 'stakeholder'; // デフォルト
    }
  }

  if (groups[type]) {
    groups[type].items.push({ id, title: req.title, originalType: req.type });
  }
});

// グループごとに表示
Object.entries(groups).forEach(([typeKey, group]: [string, any]) => {
  console.log(`\n${group.name} (${group.items.length}件):`);
  group.items.forEach((item: any) => {
    console.log(`  - ${item.id}: ${item.title} (type: ${item.originalType})`);
  });
});

console.log('\n\n=== 集計 ===');
console.log(`ステークホルダ要求: ${groups.stakeholder.items.length}件`);
console.log(`システム要求: ${groups.system.items.length}件`);
console.log(`システム機能要求: ${groups.functional.items.length}件`);
console.log(`合計: ${groups.stakeholder.items.length + groups.system.items.length + groups.functional.items.length}件`);
