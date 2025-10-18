/**
 * 目的地設定機能の要求を追加するスクリプト
 */

import { RequirementsStorage } from '../src/storage.js';
import { ViewExporter } from '../src/views.js';
import { Requirement } from '../src/types.js';

async function addDestinationSettingRequirement() {
  console.log('\n========================================');
  console.log('目的地設定機能の要求を追加');
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

  // システム機能要求: 目的地設定機能
  const func15: Requirement = {
    id: 'FUNC-015',
    title: '目的地設定機能',
    description: 'オペレータが自動搬送車に目的地を設定できる機能。地図上のクリック、座標入力、登録済みポイントから選択など、複数の設定方法をサポートする',
    status: 'approved',
    priority: 'high',
    category: 'システム機能要求',
    tags: ['目的地設定', 'ナビゲーション', 'UI', '経路計画'],
    dependencies: ['SYS-001', 'FUNC-002', 'FUNC-003'],
    createdAt: new Date(),
    updatedAt: new Date(),
    author: '開発チームリーダー',
  };

  await storage.addRequirement(func15);
  console.log(`✓ ${func15.id}: ${func15.title}`);

  console.log('\n✅ 目的地設定機能の要求を追加しました！\n');

  // 統計情報を表示
  const allReqs = await storage.getAllRequirements();
  console.log(`総要求数: ${allReqs.length}件`);

  const newReqs = allReqs.filter(r => r.id === 'FUNC-015');
  console.log(`追加された要求: ${newReqs.length}件\n`);

  console.log('追加された要求:');
  for (const req of newReqs) {
    console.log(`  - ${req.id}: ${req.title} [${req.status}]`);
    console.log(`    依存関係: ${req.dependencies.join(', ')}`);
  }

  console.log('\n');
}

addDestinationSettingRequirement().catch((error) => {
  console.error('エラーが発生しました:', error);
  process.exit(1);
});
