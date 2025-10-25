/**
 * スマート体重計プロジェクトを作成し、要求を追加するスクリプト
 */

const { RequirementsStorage } = require('../dist/storage.js');

const storage = new RequirementsStorage('./data');

async function createSmartScaleProject() {
  try {
    console.log('🎯 スマート体重計プロジェクトを作成します...\n');

    // プロジェクトマネージャーを取得
    const pm = storage.getProjectManager();

    // プロジェクトを作成
    const project = await pm.createProject({
      projectId: 'smart-scale',
      projectName: 'Smart Scale System',
      systemName: 'スマート体重計',
      description: 'Bluetooth連携機能を持つスマート体重計システムの要求管理プロジェクト'
    });

    console.log('✅ プロジェクトを作成しました:', project.projectName);
    console.log(`   システム名: ${project.systemName}`);
    console.log(`   プロジェクトID: ${project.projectId}\n`);

    // プロジェクトに切り替え
    await pm.switchProject('smart-scale');
    await storage.initialize();
    console.log('✅ プロジェクトを切り替えました\n');

    // ステークホルダ要求
    const stakeholderReqs = [
      {
        id: 'STK-001',
        title: '正確な体重測定',
        description: 'ユーザーが信頼できる正確な体重データを取得できる必要がある',
        category: 'ステークホルダ要求',
        priority: 'critical',
        status: 'approved',
        author: 'Product Manager',
        tags: ['精度', '信頼性'],
        refines: [],
        dependencies: []
      },
      {
        id: 'STK-002',
        title: '健康データの可視化',
        description: '体重の推移やBMI、体脂肪率などの健康指標をスマートフォンで確認できる',
        category: 'ステークホルダ要求',
        priority: 'high',
        status: 'approved',
        author: 'Product Manager',
        tags: ['ユーザー体験', 'データ分析'],
        refines: [],
        dependencies: []
      },
      {
        id: 'STK-003',
        title: '複数ユーザー対応',
        description: '家族で利用できるように、複数ユーザーのデータを個別に管理する',
        category: 'ステークホルダ要求',
        priority: 'high',
        status: 'approved',
        author: 'Product Manager',
        tags: ['マルチユーザー', 'プライバシー'],
        refines: [],
        dependencies: []
      },
      {
        id: 'STK-004',
        title: '簡単な初期設定',
        description: '初めてのユーザーでも迷わず体重計とスマートフォンをペアリングできる',
        category: 'ステークホルダ要求',
        priority: 'medium',
        status: 'approved',
        author: 'Product Manager',
        tags: ['ユーザビリティ', 'オンボーディング'],
        refines: [],
        dependencies: []
      }
    ];

    // システム要求
    const systemReqs = [
      {
        id: 'SYS-001',
        title: '高精度荷重センサー',
        description: '±100g以内の精度で体重を測定できるロードセル式センサーを搭載する',
        category: 'システム要求',
        priority: 'critical',
        status: 'approved',
        author: 'Hardware Engineer',
        tags: ['センサー', '精度'],
        refines: ['STK-001'],
        dependencies: []
      },
      {
        id: 'SYS-002',
        title: '体組成計測機能',
        description: 'BIA（生体インピーダンス）法により体脂肪率、筋肉量、体水分量を測定する',
        category: 'システム要求',
        priority: 'high',
        status: 'approved',
        author: 'Hardware Engineer',
        tags: ['体組成', 'BIA'],
        refines: ['STK-001', 'STK-002'],
        dependencies: []
      },
      {
        id: 'SYS-003',
        title: 'Bluetooth Low Energy通信',
        description: 'BLE 5.0を使用してスマートフォンとデータ通信を行う',
        category: 'システム要求',
        priority: 'critical',
        status: 'approved',
        author: 'System Engineer',
        tags: ['通信', 'BLE'],
        refines: ['STK-002'],
        dependencies: []
      },
      {
        id: 'SYS-004',
        title: 'ユーザー認識機能',
        description: '体重データから自動的にユーザーを識別し、適切なプロファイルに記録する',
        category: 'システム要求',
        priority: 'high',
        status: 'draft',
        author: 'System Engineer',
        tags: ['AI', 'ユーザー認識'],
        refines: ['STK-003'],
        dependencies: []
      },
      {
        id: 'SYS-005',
        title: 'ペアリング簡素化',
        description: 'NFCタップまたはQRコードスキャンで即座にペアリングを開始できる',
        category: 'システム要求',
        priority: 'medium',
        status: 'approved',
        author: 'System Engineer',
        tags: ['NFC', 'QRコード', 'ペアリング'],
        refines: ['STK-004'],
        dependencies: []
      }
    ];

    // 機能要求
    const functionalReqs = [
      {
        id: 'FUNC-001',
        title: '荷重データ取得',
        description: 'ロードセルから10Hzの頻度でアナログ荷重信号を取得する',
        category: 'システム機能要求',
        priority: 'critical',
        status: 'approved',
        author: 'Developer',
        tags: ['データ取得', 'ADC'],
        refines: ['SYS-001'],
        dependencies: []
      },
      {
        id: 'FUNC-002',
        title: 'デジタル信号変換',
        description: '24bit ADCを使用してアナログ信号を高精度にデジタル変換する',
        category: 'システム機能要求',
        priority: 'critical',
        status: 'approved',
        author: 'Developer',
        tags: ['ADC', '信号処理'],
        refines: ['SYS-001'],
        dependencies: []
      },
      {
        id: 'FUNC-003',
        title: 'ノイズフィルタリング',
        description: '移動平均フィルタを適用して、測定値のブレを抑制する',
        category: 'システム機能要求',
        priority: 'high',
        status: 'approved',
        author: 'Developer',
        tags: ['フィルタ', 'ノイズ除去'],
        refines: ['SYS-001'],
        dependencies: []
      },
      {
        id: 'FUNC-004',
        title: 'BIA測定電流制御',
        description: '微弱な交流電流（50kHz, 500μA）を体に流し、インピーダンスを測定する',
        category: 'システム機能要求',
        priority: 'high',
        status: 'approved',
        author: 'Developer',
        tags: ['BIA', '電流制御'],
        refines: ['SYS-002'],
        dependencies: []
      },
      {
        id: 'FUNC-005',
        title: '体組成推定アルゴリズム',
        description: 'インピーダンス値と身長・年齢・性別から体脂肪率などを推定する',
        category: 'システム機能要求',
        priority: 'high',
        status: 'draft',
        author: 'Developer',
        tags: ['アルゴリズム', '推定'],
        refines: ['SYS-002'],
        dependencies: []
      },
      {
        id: 'FUNC-006',
        title: 'BLEアドバタイズ',
        description: 'デバイス名とサービスUUIDを含むアドバタイズパケットを定期送信する',
        category: 'システム機能要求',
        priority: 'critical',
        status: 'approved',
        author: 'Developer',
        tags: ['BLE', 'アドバタイズ'],
        refines: ['SYS-003'],
        dependencies: []
      },
      {
        id: 'FUNC-007',
        title: 'GATT通信',
        description: 'カスタムGATTサービスで体重・体組成データをスマホに送信する',
        category: 'システム機能要求',
        priority: 'critical',
        status: 'approved',
        author: 'Developer',
        tags: ['BLE', 'GATT'],
        refines: ['SYS-003'],
        dependencies: []
      },
      {
        id: 'FUNC-008',
        title: 'ユーザー体重プロファイル',
        description: '各ユーザーの過去の体重範囲をデバイスに記憶する',
        category: 'システム機能要求',
        priority: 'high',
        status: 'draft',
        author: 'Developer',
        tags: ['プロファイル', 'メモリ'],
        refines: ['SYS-004'],
        dependencies: []
      },
      {
        id: 'FUNC-009',
        title: '体重マッチング',
        description: '測定された体重が誰のプロファイルに最も近いかを判定する',
        category: 'システム機能要求',
        priority: 'high',
        status: 'draft',
        author: 'Developer',
        tags: ['マッチング', 'アルゴリズム'],
        refines: ['SYS-004'],
        dependencies: []
      },
      {
        id: 'FUNC-010',
        title: 'NFCタグ読み取り',
        description: 'NFCリーダーでスマホからペアリング情報を受信する',
        category: 'システム機能要求',
        priority: 'medium',
        status: 'approved',
        author: 'Developer',
        tags: ['NFC', 'ペアリング'],
        refines: ['SYS-005'],
        dependencies: []
      },
      {
        id: 'FUNC-011',
        title: 'QRコード表示',
        description: '本体ディスプレイにペアリング用QRコードを表示する',
        category: 'システム機能要求',
        priority: 'medium',
        status: 'approved',
        author: 'Developer',
        tags: ['QRコード', 'ディスプレイ'],
        refines: ['SYS-005'],
        dependencies: []
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
    console.error(error.stack);
    process.exit(1);
  }
}

createSmartScaleProject();
