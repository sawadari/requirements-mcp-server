#!/usr/bin/env tsx
/**
 * FUNC-009を「バッテリー残量監視」と「自動充電」に分割
 */

import * as fs from 'fs';

const data = JSON.parse(fs.readFileSync('./data/requirements.json', 'utf-8'));

console.log('=== FUNC-009の分割 ===\n');

const func009 = data['FUNC-009'];
if (!func009) {
  console.error('❌ FUNC-009が見つかりません');
  process.exit(1);
}

console.log('現在のFUNC-009:');
console.log(`  ID: ${func009.id}`);
console.log(`  タイトル: ${func009.title}`);
console.log(`  説明: ${func009.description}`);
console.log('');

// FUNC-009を「バッテリー残量監視」に変更
const func009a = {
  ...func009,
  id: 'FUNC-009A',
  title: 'バッテリー残量監視',
  description: 'システムは、搬送車両のバッテリー残量を常時監視し、残量が20%以下になったことを検知すること',
  tags: ['電源管理', '監視', '稼働率向上'],
  rationale: 'SYS-006(バッテリー管理機能)を実現するため、バッテリー残量を常時監視する必要がある。閾値（20%）を下回ったことを検知し、充電が必要な状態を判定する。',
  updatedAt: new Date().toISOString(),
  derived_from: ['FUNC-009']
};

// FUNC-009Bとして「自動充電」を新規作成
const func009b = {
  ...func009,
  id: 'FUNC-009B',
  title: '自動充電誘導',
  description: 'システムは、バッテリー残量が閾値を下回った車両を自動的に充電ステーションへ誘導すること',
  tags: ['電源管理', '自動制御', '充電管理'],
  dependencies: ['SYS-006', 'FUNC-002', 'FUNC-009A'], // FUNC-009Aへの依存を追加
  rationale: 'SYS-006(バッテリー管理機能)を実現するため、充電が必要な車両を自動で充電ステーションへ移動させる必要がある。稼働停止を防ぎ、24時間運用を実現する。',
  updatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  derived_from: ['FUNC-009']
};

// FUNC-009を統合親として残す（supersededに設定）
func009.title = 'バッテリー残量監視・自動充電（統合）';
func009.description = '【統合要求】バッテリー管理に関する機能群。FUNC-009AとFUNC-009Bに分割。';
func009.status = 'superseded';
func009.supersedes = ['FUNC-009A', 'FUNC-009B'];
func009.updatedAt = new Date().toISOString();

// データに追加
data['FUNC-009A'] = func009a;
data['FUNC-009B'] = func009b;
data['FUNC-009'] = func009;

// 保存
fs.writeFileSync('./data/requirements.json', JSON.stringify(data, null, 2), 'utf-8');

console.log('✅ 分割完了\n');
console.log('【新規要求1】');
console.log(`  ID: ${func009a.id}`);
console.log(`  タイトル: ${func009a.title}`);
console.log(`  説明: ${func009a.description}`);
console.log('');

console.log('【新規要求2】');
console.log(`  ID: ${func009b.id}`);
console.log(`  タイトル: ${func009b.title}`);
console.log(`  説明: ${func009b.description}`);
console.log(`  依存: ${func009b.dependencies.join(', ')}`);
console.log('');

console.log('【元のFUNC-009】');
console.log(`  ステータス: ${func009.status} (統合親として保持)`);
console.log(`  統合先: ${func009.supersedes.join(', ')}`);
console.log('');

console.log('=== 来歴の記録 ===');
console.log(`FUNC-009A.derived_from: ${func009a.derived_from?.join(', ')}`);
console.log(`FUNC-009B.derived_from: ${func009b.derived_from?.join(', ')}`);
console.log(`FUNC-009.supersedes: ${func009.supersedes.join(', ')}`);
console.log('');
