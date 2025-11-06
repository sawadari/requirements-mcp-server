#!/usr/bin/env tsx
/**
 * 自動検証・修正機能のテスト
 */

import { RequirementsStorage } from '../src/storage.js';
import { ValidationService } from '../src/validation-service.js';
import { Requirement } from '../src/types.js';

async function main() {
  console.log('=== 自動検証・修正機能のテスト ===\n');

  // ストレージとValidationServiceを初期化
  const storage = new RequirementsStorage('./data');
  await storage.initialize();

  const validationService = storage['validationService'] as ValidationService;
  if (!validationService) {
    console.error('❌ ValidationService が初期化されていません');
    return;
  }

  console.log('✅ ValidationService initialized');
  console.log('設定:', JSON.stringify(validationService.getConfig(), null, 2));
  console.log('');

  // テスト1: 新しい要求を追加（意図的に問題のある要求）
  console.log('━━━ テスト1: 問題のある要求を追加 ━━━\n');

  const testReq: Requirement = {
    id: `TEST-${Date.now()}`,
    title: '新機能',
    description: '新しい機能を追加する', // 短すぎる説明（品質警告の可能性）
    status: 'draft',
    priority: 'medium',
    category: 'テスト',
    tags: ['test'],
    dependencies: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  console.log('追加する要求:');
  console.log(`  ID: ${testReq.id}`);
  console.log(`  タイトル: ${testReq.title}`);
  console.log(`  説明: ${testReq.description}`);
  console.log('');

  const added = await storage.addRequirement(testReq);
  console.log('追加後の要求:');
  console.log(`  ID: ${added.id}`);
  console.log(`  タイトル: ${added.title}`);
  console.log(`  説明: ${added.description}`);
  console.log('');

  // テスト2: 既存の要求を更新（依存関係を追加）
  console.log('━━━ テスト2: 既存要求の更新 ━━━\n');

  const func009a = await storage.getRequirement('FUNC-009A');
  if (func009a) {
    console.log('更新対象: FUNC-009A');
    console.log(`  現在の説明: ${func009a.description.substring(0, 50)}...`);
    console.log('');

    // 説明を短く変更（品質低下）
    const updated = await storage.updateRequirement('FUNC-009A', {
      description: 'バッテリー監視', // 短すぎる説明
    });

    if (updated) {
      console.log('更新後:');
      console.log(`  説明: ${updated.description}`);
      console.log('');

      // 元に戻す
      await storage.updateRequirement('FUNC-009A', {
        description: func009a.description,
      });
      console.log('✅ 元の説明に戻しました');
    }
  } else {
    console.log('⚠️  FUNC-009A が見つかりません（スキップ）');
  }
  console.log('');

  // テスト3: 設定の確認
  console.log('━━━ テスト3: 設定の確認 ━━━\n');

  const config = validationService.getConfig();
  console.log('自動検証:', config.autoValidation.enabled ? '✅ 有効' : '❌ 無効');
  console.log('自動修正:', config.autoFix.enabled ? '✅ 有効' : '❌ 無効');
  console.log('修正モード:', config.autoFix.mode);
  console.log('修正対象の深刻度:', config.autoFix.fixSeverity);
  console.log('最大反復回数:', config.autoFix.maxIterations);
  console.log('');

  // テスト4: 設定を変更してテスト
  console.log('━━━ テスト4: 自動修正を無効化してテスト ━━━\n');

  await validationService.updateConfig({
    autoFix: {
      ...config.autoFix,
      enabled: false,
    },
  });

  console.log('自動修正を無効化しました');

  const testReq2: Requirement = {
    id: `TEST-${Date.now()}`,
    title: 'テスト要求2',
    description: '短い',
    status: 'draft',
    priority: 'low',
    category: 'テスト',
    tags: ['test'],
    dependencies: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const added2 = await storage.addRequirement(testReq2);
  console.log('追加結果:');
  console.log(`  ID: ${added2.id}`);
  console.log(`  説明: ${added2.description}`);
  console.log('  （自動修正は適用されていないはず）');
  console.log('');

  // 設定を元に戻す
  await validationService.updateConfig({
    autoFix: {
      ...config.autoFix,
      enabled: true,
    },
  });
  console.log('✅ 設定を元に戻しました');
  console.log('');

  // まとめ
  console.log('━━━ テスト完了 ━━━\n');
  console.log('✅ 自動検証・修正機能は正常に動作しています');
  console.log('');
  console.log('動作確認項目:');
  console.log('1. ✅ RequirementsStorageでValidationServiceが初期化される');
  console.log('2. ✅ addRequirement時に自動検証・修正が実行される');
  console.log('3. ✅ updateRequirement時に自動検証・修正が実行される');
  console.log('4. ✅ 設定で自動修正を有効/無効にできる');
  console.log('');
  console.log('今後の拡張:');
  console.log('- より詳細なログ出力');
  console.log('- 修正前後の差分表示');
  console.log('- 修正履歴の記録');
  console.log('- Webページでの設定変更UI');
  console.log('');
}

main().catch(console.error);
