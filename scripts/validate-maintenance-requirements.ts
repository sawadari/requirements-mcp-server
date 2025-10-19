#!/usr/bin/env tsx
/**
 * メンテナンス関連要求の妥当性検証
 */

import { RequirementsStorage } from '../src/storage.js';
import { ValidationEngine } from '../src/validation/validation-engine.js';

async function main() {
  console.log('=== メンテナンス関連要求の妥当性検証 ===\n');

  // ストレージとValidationEngineを初期化
  const storage = new RequirementsStorage('./data');
  await storage.initialize();

  const validationEngine = await ValidationEngine.create();

  // 検証対象の要求ID
  const targetIds = ['SYS-008', 'FUNC-016', 'FUNC-017', 'FUNC-018', 'FUNC-019'];

  const allRequirements = await storage.getAllRequirements();
  const requirementsMap = new Map(allRequirements.map(r => [r.id, r]));

  let totalScore = 0;
  let totalViolations = 0;

  for (const reqId of targetIds) {
    console.log(`━━━ ${reqId} の検証 ━━━\n`);

    const req = await storage.getRequirement(reqId);
    if (!req) {
      console.log(`❌ ${reqId} が見つかりません\n`);
      continue;
    }

    console.log(`タイトル: ${req.title}`);
    console.log(`説明: ${req.description.substring(0, 100)}...`);
    console.log('');

    // 検証を実行
    const result = await validationEngine.validateRequirement(
      req,
      requirementsMap,
      {
        useLLM: false,
        updateMetrics: true,
      }
    );

    // 結果を集計
    const errors = result.violations.filter(r => r.severity === 'error');
    const warnings = result.violations.filter(r => r.severity === 'warning');
    const infos = result.violations.filter(r => r.severity === 'info');

    console.log(`検証結果:`);
    console.log(`  品質スコア: ${result.score ?? 0}/100`);
    console.log(`  エラー: ${errors.length}件`);
    console.log(`  警告: ${warnings.length}件`);
    console.log(`  情報: ${infos.length}件`);

    totalScore += result.score ?? 0;
    totalViolations += result.violations.length;

    if (errors.length > 0) {
      console.log('\n🚨 エラー:');
      errors.forEach(e => {
        console.log(`  [${e.ruleId}] ${e.message}`);
        if (e.suggestedFix) console.log(`    💡 ${e.suggestedFix}`);
      });
    }

    if (warnings.length > 0) {
      console.log('\n⚠️  警告:');
      warnings.forEach(w => {
        console.log(`  [${w.ruleId}] ${w.message}`);
        if (w.suggestedFix) console.log(`    💡 ${w.suggestedFix}`);
      });
    }

    // スコア評価
    const score = result.score ?? 0;
    console.log('');
    if (score >= 90) {
      console.log('✅ 優秀');
    } else if (score >= 80) {
      console.log('✅ 良好');
    } else if (score >= 70) {
      console.log('⚠️  改善推奨');
    } else {
      console.log('❌ 修正が必要');
    }
    console.log('\n');
  }

  // 総合評価
  console.log('=== 総合評価 ===\n');
  const avgScore = totalScore / targetIds.length;
  console.log(`平均品質スコア: ${avgScore.toFixed(1)}/100`);
  console.log(`総違反数: ${totalViolations}件`);
  console.log('');

  if (avgScore >= 80) {
    console.log('✅ 全体的に良好な品質です');
  } else if (avgScore >= 70) {
    console.log('⚠️  いくつかの改善が推奨されます');
  } else {
    console.log('❌ 修正が必要な要求があります');
  }
  console.log('');

  // 階層構造の確認
  console.log('=== 階層構造の確認 ===\n');

  const sys008 = await storage.getRequirement('SYS-008');
  if (sys008) {
    console.log(`✓ SYS-008 refines: ${sys008.refines?.join(', ') || 'なし'}`);
    console.log(`  → ステークホルダー要求への接続: ${sys008.refines?.length ? '✅' : '❌'}`);
  }

  for (const funcId of ['FUNC-016', 'FUNC-017', 'FUNC-018', 'FUNC-019']) {
    const func = await storage.getRequirement(funcId);
    if (func) {
      console.log(`✓ ${funcId} refines: ${func.refines?.join(', ') || 'なし'}`);
      console.log(`  → SYS-008への接続: ${func.refines?.includes('SYS-008') ? '✅' : '❌'}`);
    }
  }
  console.log('');

  // 依存関係の確認
  console.log('=== 依存関係の確認 ===\n');

  for (const reqId of targetIds) {
    const req = await storage.getRequirement(reqId);
    if (req && req.dependencies && req.dependencies.length > 0) {
      console.log(`${reqId} → ${req.dependencies.join(', ')}`);

      // 依存先が存在するか確認
      for (const depId of req.dependencies) {
        const dep = await storage.getRequirement(depId);
        if (!dep) {
          console.log(`  ❌ ${depId} が見つかりません`);
        }
      }
    }
  }
  console.log('');

  console.log('推奨アクション:');
  console.log('1. Webページで視覚的に確認: http://localhost:5002');
  console.log('2. 依存関係グラフで全体像を確認');
  console.log('3. 警告がある場合は説明文を改善');
  console.log('');
}

main().catch(console.error);
