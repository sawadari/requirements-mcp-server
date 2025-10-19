#!/usr/bin/env tsx
import * as fs from 'fs';

const data = JSON.parse(fs.readFileSync('./data/requirements.json', 'utf-8'));

console.log('=== 全要求のカテゴリとtype一覧 ===\n');

Object.entries(data).forEach(([id, req]: [string, any]) => {
  console.log(`${id}:`);
  console.log(`  category: "${req.category}"`);
  console.log(`  type: "${req.type || '(なし)'}"`);
  console.log(`  title: "${req.title}"`);
  console.log('');
});

console.log('\n=== カテゴリ別集計 ===\n');
const categoryCount: Record<string, number> = {};
Object.values(data).forEach((req: any) => {
  categoryCount[req.category] = (categoryCount[req.category] || 0) + 1;
});

Object.entries(categoryCount).sort().forEach(([cat, count]) => {
  console.log(`${cat}: ${count}件`);
});

console.log('\n=== type別集計 ===\n');
const typeCount: Record<string, number> = {};
Object.values(data).forEach((req: any) => {
  const type = req.type || '(なし)';
  typeCount[type] = (typeCount[type] || 0) + 1;
});

Object.entries(typeCount).sort().forEach(([type, count]) => {
  console.log(`${type}: ${count}件`);
});
