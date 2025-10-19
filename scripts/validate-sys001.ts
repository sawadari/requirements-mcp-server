#!/usr/bin/env tsx

import { RequirementsStorage } from '../src/storage.js';
import { ValidationEngine } from '../src/validation/validation-engine.js';

async function validate() {
  const storage = new RequirementsStorage('./data');
  await storage.initialize();

  const engine = await ValidationEngine.create();

  // SYS-001を取得
  const requirement = await storage.getRequirement('SYS-001');
  if (!requirement) {
    console.log('SYS-001が見つかりません');
    return;
  }

  // すべての要求を取得
  const allRequirements = await storage.getAllRequirements();
  const requirementsMap = new Map(allRequirements.map(r => [r.id, r]));

  // 検証実行
  const result = await engine.validateRequirement(
    requirement,
    requirementsMap,
    { useLLM: false, updateMetrics: true }
  );

  // 結果を表示
  console.log('=== SYS-001: ' + requirement.title + ' の検証結果 ===\n');
  console.log('結果: ' + (result.passed ? '✅ 合格' : '❌ 違反あり'));
  console.log('品質スコア: ' + result.score + '/100');
  console.log('違反数: ' + result.violations.length + '件\n');

  if (result.violations.length > 0) {
    const errors = result.violations.filter(v => v.severity === 'error');
    const warnings = result.violations.filter(v => v.severity === 'warning');
    const infos = result.violations.filter(v => v.severity === 'info');

    if (errors.length > 0) {
      console.log('❌ エラー (' + errors.length + '件):');
      for (const v of errors) {
        console.log('  [' + v.ruleId + '] ' + v.message);
        if (v.details) console.log('    - ' + v.details);
        if (v.suggestedFix) console.log('    💡 ' + v.suggestedFix);
        console.log('');
      }
    }

    if (warnings.length > 0) {
      console.log('⚠️  警告 (' + warnings.length + '件):');
      for (const v of warnings) {
        console.log('  [' + v.ruleId + '] ' + v.message);
        if (v.details) console.log('    - ' + v.details);
        if (v.suggestedFix) console.log('    💡 ' + v.suggestedFix);
        console.log('');
      }
    }

    if (infos.length > 0) {
      console.log('ℹ️  情報 (' + infos.length + '件):');
      for (const v of infos) {
        console.log('  [' + v.ruleId + '] ' + v.message);
        if (v.details) console.log('    - ' + v.details);
        console.log('');
      }
    }
  } else {
    console.log('✅ すべての検証ルールに合格しました！\n');
  }

  // NLP指標を表示
  console.log('📊 NLP指標:');
  console.log('  トークン数: ' + (requirement.length_tokens || 'N/A'));
  console.log('  抽象度スコア: ' + (requirement.abstraction_score?.toFixed(2) || 'N/A'));
  console.log('  単一性スコア: ' + (requirement.atomicity_score?.toFixed(2) || 'N/A'));

  // 要求の内容を表示
  console.log('\n📄 要求内容:');
  console.log('  ID: ' + requirement.id);
  console.log('  タイトル: ' + requirement.title);
  console.log('  説明: ' + requirement.description);
  console.log('  優先度: ' + requirement.priority);
  console.log('  ステータス: ' + requirement.status);
  console.log('  カテゴリ: ' + requirement.category);
  console.log('  タイプ: ' + (requirement.type || 'N/A'));
  console.log('  タグ: ' + (requirement.tags?.join(', ') || 'なし'));
  console.log('  依存関係: ' + (requirement.dependencies?.length || 0) + '件');
}

validate().catch(console.error);
