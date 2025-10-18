/**
 * 要求一覧を表示するスクリプト
 */

import { RequirementsStorage } from '../src/storage.js';

async function listRequirements() {
  const storage = new RequirementsStorage('./data');
  await storage.initialize();

  const allRequirements = await storage.getAllRequirements();

  console.log('\n========================================');
  console.log('工場自動搬送システム 要求一覧');
  console.log('========================================\n');

  // カテゴリ別にグループ化
  const byCategory: { [key: string]: typeof allRequirements } = {};
  for (const req of allRequirements) {
    if (!byCategory[req.category]) {
      byCategory[req.category] = [];
    }
    byCategory[req.category].push(req);
  }

  // カテゴリ順で表示
  const categoryOrder = ['ステークホルダ要求', 'システム要求', 'システム機能要求'];

  for (const category of categoryOrder) {
    if (!byCategory[category]) continue;

    console.log(`\n【${category}】`);
    console.log('─'.repeat(60));

    const reqs = byCategory[category].sort((a, b) => a.id.localeCompare(b.id));

    for (const req of reqs) {
      const statusEmoji = {
        draft: '📝',
        proposed: '💡',
        approved: '✅',
        in_progress: '🚧',
        completed: '✔️',
        rejected: '❌',
        on_hold: '⏸️',
      }[req.status] || '❓';

      const priorityEmoji = {
        critical: '🔴',
        high: '🟠',
        medium: '🟡',
        low: '🟢',
      }[req.priority] || '⚪';

      console.log(`\n${req.id}: ${req.title}`);
      console.log(`  状態: ${statusEmoji} ${req.status}  優先度: ${priorityEmoji} ${req.priority}`);
      console.log(`  説明: ${req.description}`);

      if (req.dependencies.length > 0) {
        console.log(`  依存: ${req.dependencies.join(', ')}`);
      }

      if (req.assignee) {
        console.log(`  担当: ${req.assignee}`);
      }

      if (req.tags.length > 0) {
        console.log(`  タグ: ${req.tags.join(', ')}`);
      }
    }
  }

  // 統計情報
  console.log('\n\n========================================');
  console.log('統計情報');
  console.log('========================================');
  console.log(`\n総要求数: ${allRequirements.length}件\n`);

  // カテゴリ別
  console.log('カテゴリ別:');
  for (const [category, reqs] of Object.entries(byCategory)) {
    console.log(`  ${category}: ${reqs.length}件`);
  }

  // ステータス別
  const byStatus: { [key: string]: number } = {};
  for (const req of allRequirements) {
    byStatus[req.status] = (byStatus[req.status] || 0) + 1;
  }
  console.log('\nステータス別:');
  for (const [status, count] of Object.entries(byStatus)) {
    console.log(`  ${status}: ${count}件`);
  }

  // 優先度別
  const byPriority: { [key: string]: number } = {};
  for (const req of allRequirements) {
    byPriority[req.priority] = (byPriority[req.priority] || 0) + 1;
  }
  console.log('\n優先度別:');
  for (const [priority, count] of Object.entries(byPriority)) {
    console.log(`  ${priority}: ${count}件`);
  }

  console.log('\n');
}

listRequirements().catch((error) => {
  console.error('エラーが発生しました:', error);
  process.exit(1);
});
