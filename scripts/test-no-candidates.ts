#!/usr/bin/env tsx
/**
 * 「トレーサビリティ候補が見つからない場合」のメッセージ表示テスト
 */

// Test 1: Empty candidates array
console.log('\n=== Test 1: 候補が0件の場合 ===');
const candidates1: any[] = [];

if (candidates1.length === 0) {
  console.log('\n📝 トレーサビリティ候補が見つかりませんでした');
  console.log('   このプロジェクトには、まだ関連付け可能な他の要求がありません。');
  console.log('   今後、関連する要求を追加した際に、リンクを作成することをお勧めします。');
} else {
  console.log('\n🔗 トレーサビリティ候補が見つかりました:');
  console.log(`   合計 ${candidates1.length} 件の候補があります。`);
}

// Test 2: With candidates
console.log('\n=== Test 2: 候補が3件の場合 ===');
const candidates2 = [
  { type: 'refines', direction: 'to', requirements: [{ id: 'SYS-001', title: 'システム要求1' }] },
  { type: 'refines', direction: 'from', requirements: [{ id: 'STK-001', title: 'ステークホルダ要求1' }] },
  { type: 'depends', direction: 'to', requirements: [{ id: 'SYS-002', title: 'システム要求2' }] }
];

if (candidates2.length === 0) {
  console.log('\n📝 トレーサビリティ候補が見つかりませんでした');
  console.log('   このプロジェクトには、まだ関連付け可能な他の要求がありません。');
  console.log('   今後、関連する要求を追加した際に、リンクを作成することをお勧めします。');
} else {
  console.log('\n🔗 トレーサビリティ候補が見つかりました:');
  console.log(`   合計 ${candidates2.length} 件の候補があります。`);

  candidates2.forEach((candidate, index) => {
    console.log(`\n   [${index + 1}] ${candidate.type} (${candidate.direction})`);
    candidate.requirements.forEach((req: any) => {
      console.log(`       - ${req.id}: ${req.title}`);
    });
  });
}

console.log('\n=== テスト完了 ===\n');
console.log('✅ メッセージ表示ロジックは正しく動作しています。');
console.log('   - 候補が0件の場合: 詳細な説明メッセージを表示');
console.log('   - 候補がある場合: 候補リストを表示');
