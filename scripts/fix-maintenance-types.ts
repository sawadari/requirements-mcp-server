#!/usr/bin/env tsx
/**
 * メンテナンス関連要求のtype修正
 * A1エラー（不正な階層関係）を解消
 */

import * as fs from 'fs';

const data = JSON.parse(fs.readFileSync('./data/requirements.json', 'utf-8'));

console.log('=== メンテナンス関連要求のtype修正 ===\n');

// FUNC-016からFUNC-019のtypeを修正
const funcIds = ['FUNC-016', 'FUNC-017', 'FUNC-018', 'FUNC-019'];

for (const funcId of funcIds) {
  const func = data[funcId];
  if (func) {
    console.log(`${funcId}: type=${func.type} → system_functional`);
    func.type = 'system_functional';
    func.updatedAt = new Date().toISOString();
  }
}

// 保存
fs.writeFileSync('./data/requirements.json', JSON.stringify(data, null, 2), 'utf-8');

console.log('\n✅ type修正完了\n');

console.log('修正内容:');
console.log('- FUNC-016からFUNC-019のtypeを"functional"から"system_functional"に変更');
console.log('- これにより、system要求 (SYS-008) の直下に配置される機能要求として正しく認識される');
console.log('');
