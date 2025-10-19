#!/usr/bin/env tsx
/**
 * 故障検知・メンテナンス・タスク復帰の要求を追加
 */

import * as fs from 'fs';

const data = JSON.parse(fs.readFileSync('./data/requirements.json', 'utf-8'));

console.log('=== 故障検知・メンテナンス機能の要求追加 ===\n');

// システム要求: SYS-008 メンテナンス管理機能
const sys008 = {
  id: 'SYS-008',
  title: 'メンテナンス管理機能',
  description: 'システムは、搬送車両の故障を検知し、メンテナンスステーションへの自動誘導、メンテナンス作業の管理、および作業完了後のタスク復帰を自動で実行すること。車両の稼働率を最大化し、予期しないダウンタイムを最小化する。',
  type: 'system',
  status: 'approved',
  priority: 'high',
  category: 'システム機能',
  tags: ['メンテナンス', '故障検知', '稼働率向上', '予防保全'],
  dependencies: ['STK-001', 'STK-002'],
  refines: ['STK-001', 'STK-002'],
  rationale: 'STK-001(生産性向上)とSTK-002(安全性確保)を実現するため、車両の故障を早期に検知し、計画的なメンテナンスを実行する必要がある。故障による突然の稼働停止を防ぎ、安全性を確保しながら、高い稼働率を維持する。',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// システム機能要求: FUNC-016 故障検知機能
const func016 = {
  id: 'FUNC-016',
  title: '故障検知機能',
  description: 'システムは、搬送車両の各センサーとアクチュエーターの動作状態を常時監視し、異常値や動作不良を検知した場合、故障アラートを発生させること。検知項目には、モーター電流異常、センサー応答なし、通信エラー、過熱、異常振動を含む。故障レベル（警告/エラー/致命的）を判定し、中央管理システムに通報する。',
  type: 'functional',
  status: 'approved',
  priority: 'high',
  category: 'システム機能要求',
  tags: ['故障検知', '監視', '異常検知', 'アラート'],
  dependencies: ['SYS-008', 'FUNC-007'],
  refines: ['SYS-008'],
  rationale: 'SYS-008(メンテナンス管理機能)を実現するため、車両の故障を早期に検知する必要がある。センサーとアクチュエーターの動作状態を常時監視し、異常が発生した時点で即座にアラートを発生させることで、大きな故障に発展する前に対処できる。',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// システム機能要求: FUNC-017 メンテナンスステーション誘導機能
const func017 = {
  id: 'FUNC-017',
  title: 'メンテナンスステーション誘導機能',
  description: 'システムは、故障アラートを受信した車両に対して、現在実行中のタスクを安全に中断し、最寄りの利用可能なメンテナンスステーションを検索して、当該車両に移動指令を送信すること。移動経路は他の車両との競合を回避するように計算され、故障レベルに応じて優先度を設定する。致命的な故障の場合は緊急停止し、警告レベルの場合は現在のタスク完了後に移動する。',
  type: 'functional',
  status: 'approved',
  priority: 'high',
  category: 'システム機能要求',
  tags: ['メンテナンス', '自動誘導', '経路計算', 'タスク中断'],
  dependencies: ['SYS-008', 'FUNC-016', 'FUNC-003', 'FUNC-002'],
  refines: ['SYS-008'],
  rationale: 'SYS-008(メンテナンス管理機能)を実現するため、故障を検知した車両を自動的にメンテナンスステーションへ誘導する必要がある。故障レベルに応じて適切なタイミングで移動を開始し、他の車両の運用を妨げないように経路を計算することで、効率的なメンテナンス運用を実現する。',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// システム機能要求: FUNC-018 メンテナンス作業管理機能
const func018 = {
  id: 'FUNC-018',
  title: 'メンテナンス作業管理機能',
  description: 'システムは、メンテナンスステーションに到着した車両のステータスを「メンテナンス中」に更新し、作業内容と予想作業時間を記録すること。作業員がメンテナンス作業を実施し、完了を登録するまで待機状態を維持する。作業完了後、自己診断テストを実行し、すべてのセンサーとアクチュエーターが正常に動作することを確認してから、ステータスを「稼働可能」に更新する。',
  type: 'functional',
  status: 'approved',
  priority: 'high',
  category: 'システム機能要求',
  tags: ['メンテナンス', '作業管理', 'ステータス管理', '自己診断'],
  dependencies: ['SYS-008', 'FUNC-017', 'FUNC-007'],
  refines: ['SYS-008'],
  rationale: 'SYS-008(メンテナンス管理機能)を実現するため、メンテナンス作業の状態を正確に管理する必要がある。作業員が作業内容を記録し、完了を登録することで、メンテナンス履歴を追跡可能にする。自己診断テストにより、修理が確実に完了したことを確認してから運用に復帰させる。',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// システム機能要求: FUNC-019 タスク復帰機能
const func019 = {
  id: 'FUNC-019',
  title: 'タスク復帰機能',
  description: 'システムは、メンテナンス完了後の車両に対して、中断前のタスクが完了していない場合は元のタスクに自動復帰させること。タスクが既に他の車両に再割当されている場合や、タスクの有効期限が切れている場合は、新しいタスクをタスクキューから割り当てる。タスク復帰時には、車両の現在位置から最適な再開ポイントを計算し、効率的にタスクを継続する。',
  type: 'functional',
  status: 'approved',
  priority: 'medium',
  category: 'システム機能要求',
  tags: ['タスク復帰', 'タスク管理', '自動復帰', '最適化'],
  dependencies: ['SYS-008', 'FUNC-018', 'FUNC-002'],
  refines: ['SYS-008'],
  rationale: 'SYS-008(メンテナンス管理機能)を実現するため、メンテナンス完了後に車両を速やかに運用に復帰させる必要がある。中断前のタスクに復帰することで、全体的なタスク遂行効率を維持し、顧客への影響を最小化する。タスクの状態を確認し、適切な復帰方法を自動判定することで、オペレータの負担を軽減する。',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

// データに追加
data['SYS-008'] = sys008;
data['FUNC-016'] = func016;
data['FUNC-017'] = func017;
data['FUNC-018'] = func018;
data['FUNC-019'] = func019;

// 保存
fs.writeFileSync('./data/requirements.json', JSON.stringify(data, null, 2), 'utf-8');

console.log('✅ 要求を追加しました\n');

console.log('【SYS-008】メンテナンス管理機能');
console.log(`  説明: ${sys008.description.substring(0, 80)}...`);
console.log(`  依存: ${sys008.dependencies.join(', ')}`);
console.log(`  refines: ${sys008.refines.join(', ')}`);
console.log('');

console.log('【FUNC-016】故障検知機能');
console.log(`  説明: ${func016.description.substring(0, 80)}...`);
console.log(`  依存: ${func016.dependencies.join(', ')}`);
console.log(`  refines: ${func016.refines.join(', ')}`);
console.log('');

console.log('【FUNC-017】メンテナンスステーション誘導機能');
console.log(`  説明: ${func017.description.substring(0, 80)}...`);
console.log(`  依存: ${func017.dependencies.join(', ')}`);
console.log(`  refines: ${func017.refines.join(', ')}`);
console.log('');

console.log('【FUNC-018】メンテナンス作業管理機能');
console.log(`  説明: ${func018.description.substring(0, 80)}...`);
console.log(`  依存: ${func018.dependencies.join(', ')}`);
console.log(`  refines: ${func018.refines.join(', ')}`);
console.log('');

console.log('【FUNC-019】タスク復帰機能');
console.log(`  説明: ${func019.description.substring(0, 80)}...`);
console.log(`  依存: ${func019.dependencies.join(', ')}`);
console.log(`  refines: ${func019.refines.join(', ')}`);
console.log('');

console.log('=== 要求の階層構造 ===\n');
console.log('STK-001 (生産性向上)');
console.log('STK-002 (安全性確保)');
console.log('  ↓ refines');
console.log('SYS-008 (メンテナンス管理機能)');
console.log('  ↓ refines');
console.log('  ├─ FUNC-016 (故障検知機能)');
console.log('  ├─ FUNC-017 (メンテナンスステーション誘導機能)');
console.log('  ├─ FUNC-018 (メンテナンス作業管理機能)');
console.log('  └─ FUNC-019 (タスク復帰機能)');
console.log('');

console.log('=== 要求数 ===');
const totalReqs = Object.keys(data).length;
console.log(`  総要求数: ${totalReqs}件 (+5件)`);
console.log('');

console.log('次のステップ:');
console.log('1. 要求の妥当性を検証する');
console.log('2. Webページで視覚的に確認する (http://localhost:5002)');
console.log('3. 依存関係グラフを確認する');
console.log('');
