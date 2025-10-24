#!/usr/bin/env node
/**
 * 自動湯沸かし器プロジェクト作成スクリプト
 */

import { ProjectManager } from '../src/project-manager.js';
import { RequirementsStorage } from '../src/storage.js';
import { createLogger } from '../src/common/logger.js';

const logger = createLogger('CreateWaterHeaterProject');

async function main() {
  try {
    logger.info('Starting water heater project creation...');

    // ProjectManagerインスタンス作成
    const projectManager = new ProjectManager('./data');

    // 1. 新規プロジェクト作成
    logger.info('Creating new project: water-heater');
    const project = await projectManager.createProject({
      projectId: 'water-heater',
      projectName: 'Water Heater System',
      systemName: '自動湯沸かし器',
      description: '自動湯沸かし器システムの要求管理プロジェクト',
    });

    logger.info('Project created successfully', { project });

    // 2. プロジェクトに切り替え
    await projectManager.switchProject('water-heater');
    logger.info('Switched to water-heater project');

    // 3. Storageインスタンス作成（dataDirとprojectIdを指定）
    const storage = new RequirementsStorage('./data', 'water-heater');

    // 4. ステークホルダ要求を追加
    logger.info('Adding stakeholder requirements...');

    // SH-1: 安全な湯沸かし
    const sh1 = await storage.addRequirement({
      id: 'SH-1',
      title: '安全に湯を沸かせること',
      description: 'ユーザーが安全かつ簡単に湯を沸かすことができる。やけどや火災のリスクを最小限に抑える。',
      status: 'approved',
      priority: 'critical',
      category: 'stakeholder',
      tags: ['安全性', 'ユーザー要求', 'ステークホルダ'],
      dependencies: [],
      author: 'User',
      stakeholder: 'ユーザー',
      rationale: 'ユーザーの安全を確保し、事故を防ぐため',
      acceptanceCriteria: '湯沸かし中の事故発生率が0.001%以下であること',
    });
    logger.info('Added SH-1', { id: sh1.id });

    // SH-2: 温度設定
    const sh2 = await storage.addRequirement({
      id: 'SH-2',
      title: '好みの温度に設定できること',
      description: 'ユーザーが希望する温度（60℃〜100℃）に湯を沸かすことができる。',
      status: 'approved',
      priority: 'high',
      category: 'stakeholder',
      tags: ['ユーザビリティ', 'ユーザー要求', 'ステークホルダ'],
      dependencies: [],
      author: 'User',
      stakeholder: 'ユーザー',
      rationale: '用途に応じた適切な温度の湯を提供するため',
      acceptanceCriteria: '設定温度と実際の温度の誤差が±3℃以内であること',
    });
    logger.info('Added SH-2', { id: sh2.id });

    // SH-3: 保温機能
    const sh3 = await storage.addRequirement({
      id: 'SH-3',
      title: '一定時間保温できること',
      description: '沸かした湯を一定時間（最大2時間）設定温度で保温できる。',
      status: 'approved',
      priority: 'medium',
      category: 'stakeholder',
      tags: ['利便性', 'ユーザー要求', 'ステークホルダ'],
      dependencies: ['SH-2'],
      author: 'User',
      stakeholder: 'ユーザー',
      rationale: '再加熱の手間を省き、すぐに使える湯を維持するため',
      acceptanceCriteria: '保温中の温度低下が1時間あたり5℃以内であること',
    });
    logger.info('Added SH-3', { id: sh3.id });

    // 5. システム要求を追加（SH-1の下位要求）
    logger.info('Adding system requirements...');

    // SYS-1: 温度センサー
    const sys1 = await storage.addRequirement({
      id: 'SYS-1',
      title: '正確な温度測定機能',
      description: '水温を±1℃の精度で測定できる温度センサーを搭載する。',
      status: 'approved',
      priority: 'critical',
      category: 'system',
      tags: ['ハードウェア', '安全性', 'センサー'],
      dependencies: ['SH-1', 'SH-2'],
      author: 'System Engineer',
      parentRequirement: 'SH-1',
      rationale: '正確な温度制御により安全性とユーザビリティを確保するため',
      acceptanceCriteria: '測定精度が±1℃以内であること',
    });
    logger.info('Added SYS-1', { id: sys1.id });

    // SYS-2: 過熱防止機能
    const sys2 = await storage.addRequirement({
      id: 'SYS-2',
      title: '過熱防止機能',
      description: '水温が105℃を超えた場合、自動的に加熱を停止する。',
      status: 'approved',
      priority: 'critical',
      category: 'system',
      tags: ['安全性', 'ハードウェア', '制御'],
      dependencies: ['SH-1', 'SYS-1'],
      author: 'System Engineer',
      parentRequirement: 'SH-1',
      rationale: '過熱による事故や機器の損傷を防ぐため',
      acceptanceCriteria: '105℃到達後0.5秒以内に加熱を停止すること',
    });
    logger.info('Added SYS-2', { id: sys2.id });

    // SYS-3: 空焚き防止
    const sys3 = await storage.addRequirement({
      id: 'SYS-3',
      title: '空焚き防止機能',
      description: '水位センサーにより水が少ない場合は加熱を開始しない。',
      status: 'approved',
      priority: 'critical',
      category: 'system',
      tags: ['安全性', 'ハードウェア', 'センサー'],
      dependencies: ['SH-1'],
      author: 'System Engineer',
      parentRequirement: 'SH-1',
      rationale: '空焚きによる火災や機器の損傷を防ぐため',
      acceptanceCriteria: '水位が最低ライン以下の場合、加熱を開始しないこと',
    });
    logger.info('Added SYS-3', { id: sys3.id });

    // SYS-4: 温度制御ロジック
    const sys4 = await storage.addRequirement({
      id: 'SYS-4',
      title: '温度制御ロジック',
      description: '設定温度に基づいてヒーターのオン/オフを制御するロジックを実装する。',
      status: 'in_progress',
      priority: 'high',
      category: 'system',
      tags: ['ソフトウェア', '制御', 'アルゴリズム'],
      dependencies: ['SH-2', 'SYS-1'],
      author: 'Software Engineer',
      parentRequirement: 'SH-2',
      rationale: '目標温度への正確な到達と維持を実現するため',
      acceptanceCriteria: '目標温度±3℃の範囲内で制御できること',
    });
    logger.info('Added SYS-4', { id: sys4.id });

    // SYS-5: ユーザーインターフェース
    const sys5 = await storage.addRequirement({
      id: 'SYS-5',
      title: 'ユーザーインターフェース',
      description: '温度設定と現在温度を表示するLCDディスプレイと操作ボタンを提供する。',
      status: 'proposed',
      priority: 'high',
      category: 'system',
      tags: ['UI/UX', 'ハードウェア', 'ディスプレイ'],
      dependencies: ['SH-2'],
      author: 'UI Designer',
      parentRequirement: 'SH-2',
      rationale: 'ユーザーが直感的に操作できるインターフェースを提供するため',
      acceptanceCriteria: '操作方法を説明なしで80%のユーザーが理解できること',
    });
    logger.info('Added SYS-5', { id: sys5.id });

    // SYS-6: 保温制御
    const sys6 = await storage.addRequirement({
      id: 'SYS-6',
      title: '保温制御機能',
      description: '設定温度を維持するために、定期的に再加熱を行う保温モードを実装する。',
      status: 'proposed',
      priority: 'medium',
      category: 'system',
      tags: ['ソフトウェア', '制御', '省エネ'],
      dependencies: ['SH-3', 'SYS-4'],
      author: 'Software Engineer',
      parentRequirement: 'SH-3',
      rationale: 'エネルギー効率を保ちながら適温を維持するため',
      acceptanceCriteria: '保温時の消費電力が加熱時の30%以下であること',
    });
    logger.info('Added SYS-6', { id: sys6.id });

    // 6. 結果を表示
    const allRequirements = await storage.listRequirements();
    logger.info('Project creation completed!', {
      projectId: 'water-heater',
      systemName: '自動湯沸かし器',
      totalRequirements: allRequirements.length,
      stakeholderRequirements: allRequirements.filter(r => r.category === 'stakeholder').length,
      systemRequirements: allRequirements.filter(r => r.category === 'system').length,
    });

    console.log('\n✅ プロジェクト作成完了！\n');
    console.log('📁 プロジェクト: water-heater');
    console.log('🎯 システム名: 自動湯沸かし器');
    console.log(`📝 要求数: ${allRequirements.length}件`);
    console.log(`   - ステークホルダ要求: ${allRequirements.filter(r => r.category === 'stakeholder').length}件`);
    console.log(`   - システム要求: ${allRequirements.filter(r => r.category === 'system').length}件`);
    console.log('\n📊 要求一覧:');
    allRequirements.forEach(req => {
      console.log(`   ${req.id}: ${req.title} [${req.status}]`);
    });

  } catch (error: any) {
    logger.error('Failed to create water heater project', error);
    console.error('❌ エラー:', error.message);
    process.exit(1);
  }
}

main();
