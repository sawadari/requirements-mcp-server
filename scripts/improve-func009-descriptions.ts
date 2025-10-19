#!/usr/bin/env tsx
/**
 * FUNC-009A, FUNC-009Bの説明文を改善
 * C2警告（親要求との具体化度の差不足）を解消するため、より具体的な記述に修正
 */

import * as fs from 'fs';

const data = JSON.parse(fs.readFileSync('./data/requirements.json', 'utf-8'));

console.log('=== FUNC-009A, FUNC-009Bの説明文改善 ===\n');

// FUNC-009Aの改善
const func009a = data['FUNC-009A'];
console.log('【FUNC-009A】改善前:');
console.log(`  ${func009a.description}\n`);

func009a.description = 'システムは、各搬送車両のバッテリー残量を1秒ごとに監視し、残量が設定閾値（デフォルト20%）以下になった場合に充電要求イベントを発生させること。残量データは中央管理サーバーに送信され、リアルタイムで表示される。';
func009a.updatedAt = new Date().toISOString();

console.log('【FUNC-009A】改善後:');
console.log(`  ${func009a.description}\n`);

// FUNC-009Bの改善
const func009b = data['FUNC-009B'];
console.log('【FUNC-009B】改善前:');
console.log(`  ${func009b.description}\n`);

func009b.description = 'システムは、充電要求イベントを受信した車両に対して、最寄りの利用可能な充電ステーションを検索し、当該車両に移動指令を送信すること。移動経路は他の搬送タスクとの競合を回避するように計算され、充電完了後は元のタスクに自動復帰する。';
func009b.updatedAt = new Date().toISOString();

console.log('【FUNC-009B】改善後:');
console.log(`  ${func009b.description}\n`);

// 保存
fs.writeFileSync('./data/requirements.json', JSON.stringify(data, null, 2), 'utf-8');

console.log('✅ 改善完了\n');

console.log('改善のポイント:');
console.log('1. FUNC-009A:');
console.log('   - 監視頻度を明示（1秒ごと）');
console.log('   - 閾値の具体値を記載（デフォルト20%）');
console.log('   - イベント発生の具体的な動作を記述');
console.log('   - データの送信先と表示方法を明記');
console.log('');
console.log('2. FUNC-009B:');
console.log('   - トリガー条件を明示（充電要求イベント）');
console.log('   - 充電ステーション選択の具体的なロジック');
console.log('   - 移動指令の詳細（経路計算、競合回避）');
console.log('   - 充電完了後の動作を記述');
console.log('');

console.log('これにより、親要求（SYS-006）よりも具体的な記述になり、');
console.log('C2警告（具体化度の差不足）が解消されるはずです。');
console.log('');
