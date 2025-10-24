/**
 * 自動湯沸かし器システムの要求を追加するスクリプト
 */

const { RequirementsStorage } = require('../dist/storage.js');
const path = require('path');

const storage = new RequirementsStorage('./data');

async function addRequirements() {
  try {
    // プロジェクトを切り替え
    const pm = storage.getProjectManager();
    await pm.switchProject('water-heater');
    console.log('✅ プロジェクトを「自動湯沸かし器」に切り替えました\n');

    // ステークホルダ要求を追加
    const stakeholderReqs = [
      {
        id: 'STK-001',
        title: '安全な給湯',
        description: 'ユーザーが火傷しないように、適切な温度で湯を提供する必要がある',
        category: 'ステークホルダ要求',
        priority: 'critical',
        status: 'approved',
        author: 'Product Owner',
        tags: ['安全性', 'ユーザー体験']
      },
      {
        id: 'STK-002',
        title: '省エネルギー',
        description: '無駄なエネルギー消費を抑え、環境に配慮した運用を実現する',
        category: 'ステークホルダ要求',
        priority: 'high',
        status: 'approved',
        author: 'Product Owner',
        tags: ['環境', 'コスト削減']
      },
      {
        id: 'STK-003',
        title: '使いやすい操作',
        description: '誰でも簡単に操作できる直感的なインターフェースを提供する',
        category: 'ステークホルダ要求',
        priority: 'high',
        status: 'approved',
        author: 'Product Owner',
        tags: ['ユーザビリティ', 'アクセシビリティ']
      }
    ];

    // システム要求を追加
    const systemReqs = [
      {
        id: 'SYS-001',
        title: '温度制御機能',
        description: '設定温度と実際の水温を監視し、ヒーターを制御して目標温度を維持する',
        category: 'システム要求',
        priority: 'critical',
        status: 'approved',
        author: 'System Engineer',
        dependencies: ['STK-001'],
        tags: ['制御', '温度管理']
      },
      {
        id: 'SYS-002',
        title: '過熱保護機能',
        description: '水温が設定上限を超えた場合、自動的に加熱を停止し、警告を発する',
        category: 'システム要求',
        priority: 'critical',
        status: 'approved',
        author: 'System Engineer',
        dependencies: ['STK-001'],
        tags: ['安全性', '保護機能']
      },
      {
        id: 'SYS-003',
        title: '省エネモード',
        description: '使用パターンを学習し、必要な時だけ加熱する省エネモードを実装する',
        category: 'システム要求',
        priority: 'high',
        status: 'draft',
        author: 'System Engineer',
        dependencies: ['STK-002'],
        tags: ['省エネ', 'AI学習']
      },
      {
        id: 'SYS-004',
        title: 'タッチパネルUI',
        description: '大きなボタンと明確な表示を持つタッチパネルインターフェースを提供する',
        category: 'システム要求',
        priority: 'high',
        status: 'approved',
        author: 'System Engineer',
        dependencies: ['STK-003'],
        tags: ['UI', 'タッチパネル']
      }
    ];

    // 機能要求を追加
    const functionalReqs = [
      {
        id: 'FUNC-001',
        title: '温度センサー読み取り',
        description: '水温センサーから1秒ごとに温度データを取得する',
        category: 'システム機能要求',
        priority: 'critical',
        status: 'approved',
        author: 'Developer',
        dependencies: ['SYS-001'],
        tags: ['センサー', 'データ取得']
      },
      {
        id: 'FUNC-002',
        title: 'PID制御アルゴリズム',
        description: 'PID制御を用いて、目標温度への追従性とオーバーシュート抑制を両立する',
        category: 'システム機能要求',
        priority: 'critical',
        status: 'draft',
        author: 'Developer',
        dependencies: ['SYS-001'],
        tags: ['制御アルゴリズム', 'PID']
      },
      {
        id: 'FUNC-003',
        title: '温度上限監視',
        description: '温度が85度を超えた場合、即座にヒーターを停止する',
        category: 'システム機能要求',
        priority: 'critical',
        status: 'approved',
        author: 'Developer',
        dependencies: ['SYS-002'],
        tags: ['安全機能', '監視']
      },
      {
        id: 'FUNC-004',
        title: '警告音とLED表示',
        description: '過熱検出時、ブザーを鳴らし、赤色LEDを点滅させる',
        category: 'システム機能要求',
        priority: 'high',
        status: 'approved',
        author: 'Developer',
        dependencies: ['SYS-002'],
        tags: ['警告', 'フィードバック']
      },
      {
        id: 'FUNC-005',
        title: '使用パターン記録',
        description: '過去30日間の使用時間帯と使用量を記録する',
        category: 'システム機能要求',
        priority: 'medium',
        status: 'draft',
        author: 'Developer',
        dependencies: ['SYS-003'],
        tags: ['データ記録', 'AI学習']
      },
      {
        id: 'FUNC-006',
        title: '予測加熱スケジュール',
        description: '使用パターンから次回の使用時刻を予測し、事前に加熱を開始する',
        category: 'システム機能要求',
        priority: 'medium',
        status: 'draft',
        author: 'Developer',
        dependencies: ['SYS-003', 'FUNC-005'],
        tags: ['予測', 'スケジューリング']
      },
      {
        id: 'FUNC-007',
        title: 'タッチイベント処理',
        description: 'タッチパネルからの入力を検出し、対応する処理を実行する',
        category: 'システム機能要求',
        priority: 'high',
        status: 'approved',
        author: 'Developer',
        dependencies: ['SYS-004'],
        tags: ['入力処理', 'イベント']
      },
      {
        id: 'FUNC-008',
        title: '温度・状態表示',
        description: '現在温度、設定温度、動作状態を見やすく表示する',
        category: 'システム機能要求',
        priority: 'high',
        status: 'approved',
        author: 'Developer',
        dependencies: ['SYS-004'],
        tags: ['表示', 'UI']
      }
    ];

    // すべての要求を追加
    const allReqs = [...stakeholderReqs, ...systemReqs, ...functionalReqs];

    console.log(`📝 ${allReqs.length}件の要求を追加中...\n`);

    for (const req of allReqs) {
      const added = await storage.addRequirement(req);
      console.log(`✅ ${added.id}: ${added.title}`);
    }

    console.log('\n🎉 すべての要求を追加しました！');
    console.log(`\n📊 要求サマリー:`);
    console.log(`   - ステークホルダ要求: ${stakeholderReqs.length}件`);
    console.log(`   - システム要求: ${systemReqs.length}件`);
    console.log(`   - 機能要求: ${functionalReqs.length}件`);
    console.log(`   - 合計: ${allReqs.length}件`);

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    process.exit(1);
  }
}

addRequirements();
