/**
 * 積み荷検知・取得機能の要求を追加するスクリプト
 */

import { RequirementsStorage } from '../src/storage.js';
import { ViewExporter } from '../src/views.js';
import { Requirement } from '../src/types.js';

async function addCargoDetectionRequirement() {
  console.log('\n========================================');
  console.log('積み荷検知・取得機能の要求を追加');
  console.log('========================================\n');

  const storage = new RequirementsStorage('./data');
  const viewExporter = new ViewExporter(storage);

  await storage.initialize();

  // ビュー自動更新コールバックを設定
  storage.setViewUpdateCallback(async () => {
    console.log('⏳ ビューを自動更新中...');
    await viewExporter.exportAllViews('./views');
    console.log('✅ ビューを自動更新しました');
  });

  // システム要求を追加
  const systemReq: Requirement = {
    id: 'SYS-007',
    title: '積み荷検知・管理機能',
    description: 'システムは、各車両の積み荷の有無を検知し、荷物情報（種類、重量、サイズ）を管理すること',
    status: 'approved',
    priority: 'high',
    category: 'システム要求',
    tags: ['センサー', '荷物管理', '積載管理'],
    dependencies: ['STK-001'],
    createdAt: new Date(),
    updatedAt: new Date(),
    author: 'システムアーキテクト',
  };

  await storage.addRequirement(systemReq);
  console.log(`✓ ${systemReq.id}: ${systemReq.title}`);

  // システム機能要求1: 積み荷検知
  const func11: Requirement = {
    id: 'FUNC-011',
    title: '積み荷検知センサー統合',
    description: '重量センサー、光学センサー、RFIDリーダーを統合し、積み荷の有無と種類を自動検知する',
    status: 'approved',
    priority: 'high',
    category: 'システム機能要求',
    tags: ['センサー統合', '重量検知', 'RFID'],
    dependencies: ['SYS-007'],
    createdAt: new Date(),
    updatedAt: new Date(),
    author: '開発チームリーダー',
  };

  await storage.addRequirement(func11);
  console.log(`✓ ${func11.id}: ${func11.title}`);

  // システム機能要求2: 荷物情報管理
  const func12: Requirement = {
    id: 'FUNC-012',
    title: '荷物情報データベース管理',
    description: '検知した荷物の情報（ID、種類、重量、サイズ、搬送元、搬送先）をデータベースに記録・管理する',
    status: 'in_progress',
    priority: 'high',
    category: 'システム機能要求',
    tags: ['データベース', '荷物管理', 'トラッキング'],
    dependencies: ['SYS-007', 'FUNC-011'],
    createdAt: new Date(),
    updatedAt: new Date(),
    author: '開発チームリーダー',
    assignee: '開発者G',
  };

  await storage.addRequirement(func12);
  console.log(`✓ ${func12.id}: ${func12.title}`);

  // システム機能要求3: 積載状態表示
  const func13: Requirement = {
    id: 'FUNC-013',
    title: '積載状態リアルタイム表示',
    description: 'オペレータ向けに、各車両の現在の積載状態（積載中/空車）と荷物情報をリアルタイム表示する',
    status: 'draft',
    priority: 'medium',
    category: 'システム機能要求',
    tags: ['UI', 'リアルタイム表示', '積載管理'],
    dependencies: ['SYS-007', 'FUNC-012', 'FUNC-008'],
    createdAt: new Date(),
    updatedAt: new Date(),
    author: 'UIデザイナー',
  };

  await storage.addRequirement(func13);
  console.log(`✓ ${func13.id}: ${func13.title}`);

  // システム機能要求4: 過積載検知・警告
  const func14: Requirement = {
    id: 'FUNC-014',
    title: '過積載検知・警告機能',
    description: '車両の最大積載量を超えた場合、自動的に警告を発し、搬送を停止する安全機能',
    status: 'approved',
    priority: 'critical',
    category: 'システム機能要求',
    tags: ['安全性', '過積載検知', '警告システム'],
    dependencies: ['SYS-007', 'FUNC-011'],
    createdAt: new Date(),
    updatedAt: new Date(),
    author: '安全管理責任者',
  };

  await storage.addRequirement(func14);
  console.log(`✓ ${func14.id}: ${func14.title}\n`);

  console.log('✅ 積み荷検知・取得機能の要求を追加しました！\n');

  // 統計情報を表示
  const allReqs = await storage.getAllRequirements();
  console.log(`総要求数: ${allReqs.length}件`);

  const newReqs = allReqs.filter(r => ['SYS-007', 'FUNC-011', 'FUNC-012', 'FUNC-013', 'FUNC-014'].includes(r.id));
  console.log(`追加された要求: ${newReqs.length}件\n`);

  console.log('追加された要求:');
  for (const req of newReqs) {
    console.log(`  - ${req.id}: ${req.title} [${req.status}]`);
  }

  console.log('\n');
}

addCargoDetectionRequirement().catch((error) => {
  console.error('エラーが発生しました:', error);
  process.exit(1);
});
