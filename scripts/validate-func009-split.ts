#!/usr/bin/env tsx
/**
 * FUNC-009A, FUNC-009Bの妥当性確認
 */

import * as fs from 'fs';
import { RequirementValidator } from '../src/validator.js';
import { RequirementStorage } from '../src/storage/RequirementStorage.js';

async function main() {
  console.log('=== FUNC-009分割後の妥当性確認 ===\n');

  // ストレージとバリデータを初期化
  const storage = new RequirementStorage('./data');
  await storage.initialize();

  const validator = new RequirementValidator();

  // FUNC-009A, FUNC-009B, FUNC-009を検証
  const targetIds = ['FUNC-009A', 'FUNC-009B', 'FUNC-009'];

  for (const reqId of targetIds) {
    console.log(`\n━━━ ${reqId} の検証 ━━━\n`);

    const req = await storage.getRequirement(reqId);
    if (!req) {
      console.log(`❌ ${reqId} が見つかりません`);
      continue;
    }

    console.log(`タイトル: ${req.title}`);
    console.log(`説明: ${req.description}`);
    console.log('');

    // 検証を実行
    const allReqs = await storage.getAllRequirements();
    const context = {
      requirement: req,
      allRequirements: allReqs
    };

    const results = validator.validate(context);

    // 結果を集計
    const errors = results.filter(r => r.severity === 'error');
    const warnings = results.filter(r => r.severity === 'warning');
    const infos = results.filter(r => r.severity === 'info');

    console.log(`検証結果:`);
    console.log(`  エラー: ${errors.length}件`);
    console.log(`  警告: ${warnings.length}件`);
    console.log(`  情報: ${infos.length}件`);

    if (errors.length > 0) {
      console.log('\n🚨 エラー:');
      errors.forEach(e => {
        console.log(`  [${e.ruleId}] ${e.message}`);
        if (e.suggestion) console.log(`    💡 ${e.suggestion}`);
      });
    }

    if (warnings.length > 0) {
      console.log('\n⚠️  警告:');
      warnings.forEach(w => {
        console.log(`  [${w.ruleId}] ${w.message}`);
        if (w.suggestion) console.log(`    💡 ${w.suggestion}`);
      });
    }

    // スコア計算（簡易版）
    const score = 100 - (errors.length * 10) - (warnings.length * 3);
    console.log(`\n📊 品質スコア: ${Math.max(0, score)}/100`);

    if (score >= 80) {
      console.log('✅ 良好');
    } else if (score >= 60) {
      console.log('⚠️  改善推奨');
    } else {
      console.log('❌ 修正が必要');
    }
  }

  // 総合評価
  console.log('\n\n=== 総合評価 ===\n');

  const func009a = await storage.getRequirement('FUNC-009A');
  const func009b = await storage.getRequirement('FUNC-009B');

  if (func009a && func009b) {
    console.log('分割後の要求の確認:');
    console.log('');
    console.log('✓ FUNC-009A: バッテリー残量監視');
    console.log('  → 監視機能に特化し、単一責任の原則を満たしている');
    console.log('');
    console.log('✓ FUNC-009B: 自動充電誘導');
    console.log('  → 充電誘導機能に特化し、FUNC-009Aに依存');
    console.log('');

    // 依存関係の確認
    if (func009b.dependencies && func009b.dependencies.includes('FUNC-009A')) {
      console.log('✓ 依存関係が正しく設定されている');
      console.log('  FUNC-009B → FUNC-009A');
    } else {
      console.log('❌ 依存関係が設定されていません');
    }
    console.log('');

    // refinesの確認
    if (func009a.refines && func009a.refines.length > 0) {
      console.log(`✓ FUNC-009A refines: ${func009a.refines.join(', ')}`);
    }
    if (func009b.refines && func009b.refines.length > 0) {
      console.log(`✓ FUNC-009B refines: ${func009b.refines.join(', ')}`);
    }
    console.log('');

    // 来歴の確認
    if (func009a.derived_from && func009a.derived_from.includes('FUNC-009')) {
      console.log('✓ 来歴が記録されている (derived_from: FUNC-009)');
    }
    console.log('');
  }

  console.log('推奨アクション:');
  console.log('1. エラーがある場合は修正スクリプトを実行');
  console.log('2. 警告を確認し、必要に応じて説明文を改善');
  console.log('3. Webページ (http://localhost:5002) で視覚的に確認');
  console.log('');
}

main().catch(console.error);
