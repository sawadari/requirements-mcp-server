#!/usr/bin/env tsx
import * as fs from 'fs';

const data = JSON.parse(fs.readFileSync('./data/requirements.json', 'utf-8'));

console.log('=== REQ-*要求のカテゴリ修正 ===\n');

let modified = 0;

Object.entries(data).forEach(([id, req]: [string, any]) => {
  if (id.startsWith('REQ-')) {
    const oldCategory = req.category;

    // categoryが"system"の場合、typeに基づいて適切なカテゴリに修正
    if (req.category === 'system') {
      if (req.type === 'stakeholder') {
        req.category = 'ステークホルダ要求';
        console.log(`✓ ${id}: category "${oldCategory}" → "ステークホルダ要求"`);
        modified++;
      } else if (req.type === 'system') {
        req.category = 'システム要求';
        console.log(`✓ ${id}: category "${oldCategory}" → "システム要求"`);
        modified++;
      } else if (req.type === 'system_functional') {
        req.category = 'システム機能要求';
        console.log(`✓ ${id}: category "${oldCategory}" → "システム機能要求"`);
        modified++;
      }
    }
  }
});

if (modified > 0) {
  fs.writeFileSync('./data/requirements.json', JSON.stringify(data, null, 2), 'utf-8');
  console.log(`\n✅ ${modified}件の要求を修正しました`);
} else {
  console.log('\n修正が必要な要求はありませんでした');
}
