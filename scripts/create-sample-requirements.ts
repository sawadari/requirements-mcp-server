/**
 * 工場自動搬送システムのサンプル要求を作成するスクリプト
 */

import { RequirementsStorage } from '../src/storage.js';
import { Requirement } from '../src/types.js';

async function createSampleRequirements() {
  const storage = new RequirementsStorage('./data');
  await storage.initialize();

  console.log('工場自動搬送システムのサンプル要求を作成します...\n');

  // ステークホルダ要求（3件）
  console.log('=== ステークホルダ要求 ===');

  const stakeholder1: Requirement = {
    id: 'STK-001',
    title: '生産効率の向上',
    description: '工場の生産ラインにおいて、部品や製品の搬送を自動化することで、人的作業を削減し、生産効率を30%向上させる',
    status: 'approved',
    priority: 'critical',
    category: 'ステークホルダ要求',
    tags: ['生産性', '自動化', 'ROI'],
    dependencies: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    author: '製造部門長',
  };
  await storage.addRequirement(stakeholder1);
  console.log(`✓ ${stakeholder1.id}: ${stakeholder1.title}`);

  const stakeholder2: Requirement = {
    id: 'STK-002',
    title: '作業安全性の確保',
    description: '重量物の搬送作業における作業員の怪我リスクを排除し、労働災害ゼロを実現する',
    status: 'approved',
    priority: 'critical',
    category: 'ステークホルダ要求',
    tags: ['安全性', '労災防止', 'コンプライアンス'],
    dependencies: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    author: '安全管理責任者',
  };
  await storage.addRequirement(stakeholder2);
  console.log(`✓ ${stakeholder2.id}: ${stakeholder2.title}`);

  const stakeholder3: Requirement = {
    id: 'STK-003',
    title: '運用コストの削減',
    description: '搬送作業の自動化により、人件費を年間3000万円削減し、3年でシステム投資を回収する',
    status: 'approved',
    priority: 'high',
    category: 'ステークホルダ要求',
    tags: ['コスト削減', '投資回収', '経営'],
    dependencies: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    author: '財務部門長',
  };
  await storage.addRequirement(stakeholder3);
  console.log(`✓ ${stakeholder3.id}: ${stakeholder3.title}\n`);

  // システム要求（6件）
  console.log('=== システム要求 ===');

  const system1: Requirement = {
    id: 'SYS-001',
    title: '自動搬送機能',
    description: 'システムは、指定された起点から終点まで、荷物を自動的に搬送する機能を提供すること',
    status: 'approved',
    priority: 'critical',
    category: 'システム要求',
    tags: ['自動化', '搬送', 'コア機能'],
    dependencies: ['STK-001', 'STK-002'],
    createdAt: new Date(),
    updatedAt: new Date(),
    author: 'システムアーキテクト',
  };
  await storage.addRequirement(system1);
  console.log(`✓ ${system1.id}: ${system1.title}`);

  const system2: Requirement = {
    id: 'SYS-002',
    title: '経路最適化機能',
    description: 'システムは、複数の搬送要求に対して、最短時間で完了するように経路を自動的に最適化すること',
    status: 'approved',
    priority: 'high',
    category: 'システム要求',
    tags: ['最適化', '効率化', 'アルゴリズム'],
    dependencies: ['STK-001'],
    createdAt: new Date(),
    updatedAt: new Date(),
    author: 'システムアーキテクト',
  };
  await storage.addRequirement(system2);
  console.log(`✓ ${system2.id}: ${system2.title}`);

  const system3: Requirement = {
    id: 'SYS-003',
    title: '障害物検知・回避機能',
    description: 'システムは、搬送経路上の障害物を検知し、自動的に回避または停止すること',
    status: 'approved',
    priority: 'critical',
    category: 'システム要求',
    tags: ['安全性', '障害物検知', 'センサー'],
    dependencies: ['STK-002'],
    createdAt: new Date(),
    updatedAt: new Date(),
    author: 'システムアーキテクト',
  };
  await storage.addRequirement(system3);
  console.log(`✓ ${system3.id}: ${system3.title}`);

  const system4: Requirement = {
    id: 'SYS-004',
    title: '稼働監視機能',
    description: 'システムは、すべての搬送車両の位置、状態、稼働状況をリアルタイムで監視できること',
    status: 'in_progress',
    priority: 'high',
    category: 'システム要求',
    tags: ['監視', 'リアルタイム', '可視化'],
    dependencies: ['STK-001', 'STK-003'],
    createdAt: new Date(),
    updatedAt: new Date(),
    author: 'システムアーキテクト',
    assignee: '開発チームリーダー',
  };
  await storage.addRequirement(system4);
  console.log(`✓ ${system4.id}: ${system4.title}`);

  const system5: Requirement = {
    id: 'SYS-005',
    title: '緊急停止機能',
    description: 'システムは、緊急時に全車両を即座に停止させる機能を提供すること',
    status: 'approved',
    priority: 'critical',
    category: 'システム要求',
    tags: ['安全性', '緊急停止', 'フェールセーフ'],
    dependencies: ['STK-002'],
    createdAt: new Date(),
    updatedAt: new Date(),
    author: '安全管理責任者',
  };
  await storage.addRequirement(system5);
  console.log(`✓ ${system5.id}: ${system5.title}`);

  const system6: Requirement = {
    id: 'SYS-006',
    title: 'バッテリー管理機能',
    description: 'システムは、各車両のバッテリー残量を監視し、自動充電を行うこと',
    status: 'approved',
    priority: 'high',
    category: 'システム要求',
    tags: ['電源管理', '自動充電', '稼働率'],
    dependencies: ['STK-001', 'STK-003'],
    createdAt: new Date(),
    updatedAt: new Date(),
    author: 'システムアーキテクト',
  };
  await storage.addRequirement(system6);
  console.log(`✓ ${system6.id}: ${system6.title}\n`);

  // システム機能要求（9件）
  console.log('=== システム機能要求 ===');

  const func1: Requirement = {
    id: 'FUNC-001',
    title: '搬送指示受付',
    description: '上位システムまたはオペレータから搬送指示（起点、終点、荷物情報）を受け付ける',
    status: 'completed',
    priority: 'critical',
    category: 'システム機能要求',
    tags: ['インターフェース', 'API', '入力'],
    dependencies: ['SYS-001'],
    createdAt: new Date(),
    updatedAt: new Date(),
    author: '開発チームリーダー',
    assignee: '開発者A',
  };
  await storage.addRequirement(func1);
  console.log(`✓ ${func1.id}: ${func1.title}`);

  const func2: Requirement = {
    id: 'FUNC-002',
    title: '車両割当',
    description: '搬送指示に対して、最適な車両を自動的に割り当てる',
    status: 'in_progress',
    priority: 'high',
    category: 'システム機能要求',
    tags: ['スケジューリング', '最適化'],
    dependencies: ['SYS-001', 'SYS-002'],
    createdAt: new Date(),
    updatedAt: new Date(),
    author: '開発チームリーダー',
    assignee: '開発者B',
  };
  await storage.addRequirement(func2);
  console.log(`✓ ${func2.id}: ${func2.title}`);

  const func3: Requirement = {
    id: 'FUNC-003',
    title: '経路計算',
    description: '起点から終点までの最適経路を計算する（A*アルゴリズムまたはDijkstra法を使用）',
    status: 'in_progress',
    priority: 'high',
    category: 'システム機能要求',
    tags: ['経路計画', 'アルゴリズム', '最適化'],
    dependencies: ['SYS-002'],
    createdAt: new Date(),
    updatedAt: new Date(),
    author: '開発チームリーダー',
    assignee: '開発者C',
  };
  await storage.addRequirement(func3);
  console.log(`✓ ${func3.id}: ${func3.title}`);

  const func4: Requirement = {
    id: 'FUNC-004',
    title: '車両制御',
    description: '割り当てられた車両に対して、移動指示（前進、後退、停止、回転）を送信する',
    status: 'completed',
    priority: 'critical',
    category: 'システム機能要求',
    tags: ['制御', '通信', 'ハードウェア連携'],
    dependencies: ['SYS-001'],
    createdAt: new Date(),
    updatedAt: new Date(),
    author: '開発チームリーダー',
    assignee: '開発者D',
  };
  await storage.addRequirement(func4);
  console.log(`✓ ${func4.id}: ${func4.title}`);

  const func5: Requirement = {
    id: 'FUNC-005',
    title: 'センサーデータ処理',
    description: 'LiDAR、カメラ、超音波センサーからのデータを処理し、障害物を検知する',
    status: 'in_progress',
    priority: 'critical',
    category: 'システム機能要求',
    tags: ['センサー', '画像処理', '信号処理'],
    dependencies: ['SYS-003'],
    createdAt: new Date(),
    updatedAt: new Date(),
    author: '開発チームリーダー',
    assignee: '開発者E',
  };
  await storage.addRequirement(func5);
  console.log(`✓ ${func5.id}: ${func5.title}`);

  const func6: Requirement = {
    id: 'FUNC-006',
    title: '衝突回避制御',
    description: '障害物検知時に、車両を自動的に減速・停止・迂回させる',
    status: 'approved',
    priority: 'critical',
    category: 'システム機能要求',
    tags: ['安全制御', '回避', 'リアルタイム'],
    dependencies: ['SYS-003', 'FUNC-005'],
    createdAt: new Date(),
    updatedAt: new Date(),
    author: '開発チームリーダー',
  };
  await storage.addRequirement(func6);
  console.log(`✓ ${func6.id}: ${func6.title}`);

  const func7: Requirement = {
    id: 'FUNC-007',
    title: '位置情報管理',
    description: '全車両の現在位置を追跡し、データベースに記録する',
    status: 'completed',
    priority: 'high',
    category: 'システム機能要求',
    tags: ['位置追跡', 'データベース', 'ロギング'],
    dependencies: ['SYS-004'],
    createdAt: new Date(),
    updatedAt: new Date(),
    author: '開発チームリーダー',
    assignee: '開発者F',
  };
  await storage.addRequirement(func7);
  console.log(`✓ ${func7.id}: ${func7.title}`);

  const func8: Requirement = {
    id: 'FUNC-008',
    title: '状態表示UI',
    description: 'オペレータ向けに、車両の位置、状態、搬送状況をグラフィカルに表示する',
    status: 'in_progress',
    priority: 'medium',
    category: 'システム機能要求',
    tags: ['UI', 'ダッシュボード', '可視化'],
    dependencies: ['SYS-004', 'FUNC-007'],
    createdAt: new Date(),
    updatedAt: new Date(),
    author: 'UIデザイナー',
    assignee: 'フロントエンド開発者',
  };
  await storage.addRequirement(func8);
  console.log(`✓ ${func8.id}: ${func8.title}`);

  const func9: Requirement = {
    id: 'FUNC-009',
    title: 'バッテリー残量監視・自動充電',
    description: 'バッテリー残量が20%以下になった車両を自動的に充電ステーションへ誘導する',
    status: 'approved',
    priority: 'high',
    category: 'システム機能要求',
    tags: ['電源管理', '自動制御', '稼働率向上'],
    dependencies: ['SYS-006', 'FUNC-002'],
    createdAt: new Date(),
    updatedAt: new Date(),
    author: '開発チームリーダー',
  };
  await storage.addRequirement(func9);
  console.log(`✓ ${func9.id}: ${func9.title}\n`);

  // 緊急停止機能の詳細要求
  const func10: Requirement = {
    id: 'FUNC-010',
    title: '緊急停止ボタン処理',
    description: '緊急停止ボタンが押された場合、全車両に即座に停止指令を送信し、0.5秒以内に停止させる',
    status: 'approved',
    priority: 'critical',
    category: 'システム機能要求',
    tags: ['安全性', '緊急停止', 'リアルタイム制御'],
    dependencies: ['SYS-005'],
    createdAt: new Date(),
    updatedAt: new Date(),
    author: '安全管理責任者',
  };
  await storage.addRequirement(func10);
  console.log(`✓ ${func10.id}: ${func10.title}`);

  console.log('\n✅ サンプル要求の作成が完了しました！');
  console.log(`\n作成された要求:`);
  console.log(`- ステークホルダ要求: 3件`);
  console.log(`- システム要求: 6件`);
  console.log(`- システム機能要求: 10件`);
  console.log(`- 合計: 19件\n`);
}

createSampleRequirements().catch((error) => {
  console.error('エラーが発生しました:', error);
  process.exit(1);
});
