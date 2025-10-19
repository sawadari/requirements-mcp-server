#!/usr/bin/env tsx
import * as fs from 'fs';

const data = JSON.parse(fs.readFileSync('./data/requirements.json', 'utf-8'));

console.log('=== 分割結果の確認 ===\n');

console.log('【FUNC-009A】バッテリー残量監視');
const func009a = data['FUNC-009A'];
console.log(`  タイトル: ${func009a.title}`);
console.log(`  説明: ${func009a.description}`);
console.log(`  タグ: ${func009a.tags.join(', ')}`);
console.log(`  依存: ${func009a.dependencies.join(', ')}`);
console.log(`  refines: ${func009a.refines.join(', ')}`);
console.log(`  derived_from: ${func009a.derived_from?.join(', ') || 'なし'}`);
console.log('');

console.log('【FUNC-009B】自動充電誘導');
const func009b = data['FUNC-009B'];
console.log(`  タイトル: ${func009b.title}`);
console.log(`  説明: ${func009b.description}`);
console.log(`  タグ: ${func009b.tags.join(', ')}`);
console.log(`  依存: ${func009b.dependencies.join(', ')}`);
console.log(`  refines: ${func009b.refines.join(', ')}`);
console.log(`  derived_from: ${func009b.derived_from?.join(', ') || 'なし'}`);
console.log('');

console.log('【FUNC-009】統合親（superseded）');
const func009 = data['FUNC-009'];
console.log(`  タイトル: ${func009.title}`);
console.log(`  説明: ${func009.description}`);
console.log(`  ステータス: ${func009.status}`);
console.log(`  supersedes: ${func009.supersedes.join(', ')}`);
console.log('');

console.log('=== 要求数 ===');
const totalReqs = Object.keys(data).length;
console.log(`  総要求数: ${totalReqs}件`);
console.log('');
