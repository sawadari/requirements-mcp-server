#!/usr/bin/env node
/**
 * お掃除ロボットプロジェクト作成スクリプト
 */

import { ProjectManager } from '../src/project-manager.js';
import { RequirementsStorage } from '../src/storage.js';
import { createLogger } from '../src/common/logger.js';

const logger = createLogger('CreateCleaningRobotProject');

async function main() {
  try {
    logger.info('Starting cleaning robot project creation...');

    // ProjectManagerインスタンス作成
    const projectManager = new ProjectManager('./data');

    // 1. 新規プロジェクト作成
    logger.info('Creating new project: cleaning-robot');
    const project = await projectManager.createProject({
      projectId: 'cleaning-robot',
      projectName: 'Cleaning Robot System',
      systemName: 'お掃除ロボット',
      description: 'お掃除ロボットシステムの要求管理プロジェクト',
    });

    logger.info('Project created successfully', { project });

    // 2. プロジェクトに切り替え
    await projectManager.switchProject('cleaning-robot');
    logger.info('Switched to cleaning-robot project');

    // 3. Storageインスタンス作成（dataDirとprojectIdを指定）
    const storage = new RequirementsStorage('./data', 'cleaning-robot');

    // 4. ステークホルダ要求を追加
    logger.info('Adding stakeholder requirements...');

    // SH-1: 自動清掃
    const sh1 = await storage.addRequirement({
      id: 'SH-1',
      title: '自動で床を清掃できること',
      description: 'ユーザーの操作なしに、室内の床を自動的に清掃できる。ゴミやホコリを効率的に吸引する。',
      status: 'approved',
      priority: 'critical',
      category: 'stakeholder',
      tags: ['自動化', 'ユーザー要求', 'ステークホルダ'],
      dependencies: [],
      author: 'User',
      stakeholder: 'ユーザー',
      rationale: 'ユーザーの清掃負担を軽減し、常に清潔な環境を維持するため',
      acceptanceCriteria: '90%以上の床面積を清掃できること',
    });
    logger.info('Added SH-1', { id: sh1.id });

    // SH-2: 障害物回避
    const sh2 = await storage.addRequirement({
      id: 'SH-2',
      title: '障害物を避けて移動できること',
      description: '家具や壁などの障害物を検知し、衝突せずに回避して移動できる。',
      status: 'approved',
      priority: 'critical',
      category: 'stakeholder',
      tags: ['安全性', 'ユーザー要求', 'ステークホルダ'],
      dependencies: [],
      author: 'User',
      stakeholder: 'ユーザー',
      rationale: '家具の損傷や本体の故障を防ぐため',
      acceptanceCriteria: '障害物との衝突回数が清掃100回あたり1回以下であること',
    });
    logger.info('Added SH-2', { id: sh2.id });

    // SH-3: 自動充電
    const sh3 = await storage.addRequirement({
      id: 'SH-3',
      title: 'バッテリー残量が少なくなったら自動で充電できること',
      description: 'バッテリー残量が一定以下になったら、自動的に充電ステーションに戻って充電を行う。',
      status: 'approved',
      priority: 'high',
      category: 'stakeholder',
      tags: ['利便性', 'ユーザー要求', 'ステークホルダ'],
      dependencies: [],
      author: 'User',
      stakeholder: 'ユーザー',
      rationale: 'ユーザーが充電を気にせず使えるようにするため',
      acceptanceCriteria: 'バッテリー残量15%以下で自動的に充電ステーションに戻ること',
    });
    logger.info('Added SH-3', { id: sh3.id });

    // SH-4: スケジュール清掃
    const sh4 = await storage.addRequirement({
      id: 'SH-4',
      title: '指定した時刻に清掃を開始できること',
      description: 'ユーザーが設定したスケジュールに従って、自動的に清掃を開始する。',
      status: 'approved',
      priority: 'medium',
      category: 'stakeholder',
      tags: ['利便性', 'ユーザー要求', 'ステークホルダ'],
      dependencies: [],
      author: 'User',
      stakeholder: 'ユーザー',
      rationale: 'ユーザーの在宅時間を避けて清掃できるようにするため',
      acceptanceCriteria: '設定時刻の±5分以内に清掃を開始すること',
    });
    logger.info('Added SH-4', { id: sh4.id });

    // 5. システム要求を追加
    logger.info('Adding system requirements...');

    // SYS-1: センサーシステム
    const sys1 = await storage.addRequirement({
      id: 'SYS-1',
      title: '障害物検知センサー',
      description: '赤外線センサーまたは超音波センサーにより、前方および側面の障害物を検知する。',
      status: 'approved',
      priority: 'critical',
      category: 'system',
      tags: ['ハードウェア', 'センサー', '安全性'],
      dependencies: ['SH-2'],
      author: 'System Engineer',
      parentRequirement: 'SH-2',
      rationale: '障害物との衝突を防ぐため',
      acceptanceCriteria: '10cm以内の障害物を検知できること',
    });
    logger.info('Added SYS-1', { id: sys1.id });

    // SYS-2: ナビゲーションシステム
    const sys2 = await storage.addRequirement({
      id: 'SYS-2',
      title: 'ナビゲーションアルゴリズム',
      description: 'センサー情報をもとに、効率的な清掃経路を計算し、室内をカバーする。',
      status: 'approved',
      priority: 'critical',
      category: 'system',
      tags: ['ソフトウェア', 'アルゴリズム', '制御'],
      dependencies: ['SH-1', 'SYS-1'],
      author: 'Software Engineer',
      parentRequirement: 'SH-1',
      rationale: '効率的な清掃経路により清掃時間を短縮するため',
      acceptanceCriteria: '同じ場所を2回以上通過する率が10%以下であること',
    });
    logger.info('Added SYS-2', { id: sys2.id });

    // SYS-3: 吸引システム
    const sys3 = await storage.addRequirement({
      id: 'SYS-3',
      title: '強力な吸引機能',
      description: '十分な吸引力を持つモーターとブラシにより、ゴミやホコリを効率的に吸引する。',
      status: 'approved',
      priority: 'critical',
      category: 'system',
      tags: ['ハードウェア', '清掃性能'],
      dependencies: ['SH-1'],
      author: 'Hardware Engineer',
      parentRequirement: 'SH-1',
      rationale: '清掃品質を確保するため',
      acceptanceCriteria: '吸引力1500Pa以上、清掃率90%以上であること',
    });
    logger.info('Added SYS-3', { id: sys3.id });

    // SYS-4: バッテリー管理システム
    const sys4 = await storage.addRequirement({
      id: 'SYS-4',
      title: 'バッテリー残量監視機能',
      description: 'バッテリー残量をリアルタイムで監視し、残量が一定以下になった場合に充電モードに移行する。',
      status: 'in_progress',
      priority: 'high',
      category: 'system',
      tags: ['ソフトウェア', '電源管理'],
      dependencies: ['SH-3'],
      author: 'Software Engineer',
      parentRequirement: 'SH-3',
      rationale: 'バッテリー切れによる動作停止を防ぐため',
      acceptanceCriteria: 'バッテリー残量15%以下で充電モードに移行すること',
    });
    logger.info('Added SYS-4', { id: sys4.id });

    // SYS-5: 自動ドッキング機能
    const sys5 = await storage.addRequirement({
      id: 'SYS-5',
      title: '充電ステーション自動復帰機能',
      description: '赤外線ビーコンを利用して充電ステーションの位置を特定し、自動的にドッキングする。',
      status: 'in_progress',
      priority: 'high',
      category: 'system',
      tags: ['ソフトウェア', 'ハードウェア', '制御'],
      dependencies: ['SH-3', 'SYS-4'],
      author: 'System Engineer',
      parentRequirement: 'SH-3',
      rationale: '確実に充電を行うため',
      acceptanceCriteria: 'ドッキング成功率が95%以上であること',
    });
    logger.info('Added SYS-5', { id: sys5.id });

    // SYS-6: タイマー機能
    const sys6 = await storage.addRequirement({
      id: 'SYS-6',
      title: 'スケジュール管理機能',
      description: '曜日や時刻を設定し、指定したタイミングで清掃を自動開始する機能を実装する。',
      status: 'proposed',
      priority: 'medium',
      category: 'system',
      tags: ['ソフトウェア', 'UI/UX'],
      dependencies: ['SH-4'],
      author: 'Software Engineer',
      parentRequirement: 'SH-4',
      rationale: 'ユーザーの利便性を向上させるため',
      acceptanceCriteria: '最大7つの異なるスケジュールを設定できること',
    });
    logger.info('Added SYS-6', { id: sys6.id });

    // SYS-7: モバイルアプリ連携
    const sys7 = await storage.addRequirement({
      id: 'SYS-7',
      title: 'スマートフォンアプリ連携',
      description: 'Wi-Fi経由でスマートフォンアプリと連携し、遠隔操作や状態確認ができる。',
      status: 'proposed',
      priority: 'medium',
      category: 'system',
      tags: ['ソフトウェア', 'UI/UX', '通信'],
      dependencies: ['SH-4'],
      author: 'Software Engineer',
      parentRequirement: 'SH-4',
      rationale: '外出先からも操作できるようにするため',
      acceptanceCriteria: 'アプリから清掃開始、停止、スケジュール設定ができること',
    });
    logger.info('Added SYS-7', { id: sys7.id });

    // 6. 結果を表示
    const allRequirements = await storage.getAllRequirements();
    logger.info('Project creation completed!', {
      projectId: 'cleaning-robot',
      systemName: 'お掃除ロボット',
      totalRequirements: allRequirements.length,
      stakeholderRequirements: allRequirements.filter(r => r.category === 'stakeholder').length,
      systemRequirements: allRequirements.filter(r => r.category === 'system').length,
    });

    console.log('\n✅ プロジェクト作成完了！\n');
    console.log('📁 プロジェクト: cleaning-robot');
    console.log('🎯 システム名: お掃除ロボット');
    console.log(`📝 要求数: ${allRequirements.length}件`);
    console.log(`   - ステークホルダ要求: ${allRequirements.filter(r => r.category === 'stakeholder').length}件`);
    console.log(`   - システム要求: ${allRequirements.filter(r => r.category === 'system').length}件`);
    console.log('\n📊 要求一覧:');
    allRequirements.forEach(req => {
      console.log(`   ${req.id}: ${req.title} [${req.status}]`);
    });

  } catch (error: any) {
    logger.error('Failed to create cleaning robot project', error);
    console.error('❌ エラー:', error.message);
    process.exit(1);
  }
}

main();
