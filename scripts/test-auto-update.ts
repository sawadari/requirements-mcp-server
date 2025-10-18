/**
 * ビュー自動更新のテストスクリプト
 */

import { RequirementsStorage } from '../src/storage.js';
import { ViewExporter } from '../src/views.js';

async function testAutoUpdate() {
  console.log('\n========================================');
  console.log('ビュー自動更新テスト');
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

  console.log('1. 要求を1件取得します...');
  const req = await storage.getRequirement('FUNC-005');

  if (!req) {
    console.log('❌ 要求FUNC-005が見つかりません');
    return;
  }

  console.log(`   現在のステータス: ${req.status}\n`);

  console.log('2. 要求のステータスを更新します...');
  console.log(`   ${req.status} → completed\n`);

  await storage.updateRequirement('FUNC-005', {
    status: 'completed',
  });

  console.log('3. 更新完了！ビューファイルを確認してください。\n');
  console.log('   views/markdown/in-progress-requirements.md');
  console.log('   views/markdown/all-requirements.md\n');

  console.log('========================================');
  console.log('テスト完了');
  console.log('========================================\n');
}

testAutoUpdate().catch((error) => {
  console.error('エラーが発生しました:', error);
  process.exit(1);
});
