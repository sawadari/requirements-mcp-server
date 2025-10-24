/**
 * 自動湯沸かし器システムの要求を妥当性チェック
 */

const { RequirementsStorage } = require('../dist/storage.js');
const { ValidationEngine } = require('../dist/validation/validation-engine.js');

async function validateRequirements() {
  try {
    console.log('🔍 自動湯沸かし器システムの妥当性チェックを開始します...\n');

    // プロジェクトを切り替え
    const storage = new RequirementsStorage('./data');
    const pm = storage.getProjectManager();
    await pm.switchProject('water-heater');
    console.log('✅ プロジェクトを「自動湯沸かし器」に切り替えました\n');

    // Storageを再初期化してプロジェクトのデータをロード
    await storage.initialize();
    console.log('✅ Storageを再初期化しました\n');

    // ValidationEngineを初期化（storageを渡す）
    const validationEngine = await ValidationEngine.create(storage);
    console.log('✅ ValidationEngineを初期化しました\n');

    // すべての要求を取得
    const requirements = await storage.getAllRequirements();
    console.log(`📊 ${requirements.length}件の要求を検証します\n`);

    // 各要求を検証
    console.log('=' .repeat(80));
    console.log('妥当性チェック結果');
    console.log('=' .repeat(80));

    let passCount = 0;
    let failCount = 0;
    const violations = [];

    for (const req of requirements) {
      const result = await validationEngine.validateRequirement(req.id, false); // LLM使用なし

      const status = result.isValid ? '✅ PASS' : '❌ FAIL';
      console.log(`\n${status} ${req.id}: ${req.title}`);
      console.log(`   品質スコア: ${result.qualityScore.toFixed(1)}/100`);

      if (result.isValid) {
        passCount++;
      } else {
        failCount++;
        violations.push({
          id: req.id,
          title: req.title,
          violations: result.violations
        });
      }

      if (result.violations.length > 0) {
        console.log('   違反項目:');
        result.violations.forEach(v => {
          console.log(`     - [${v.severity}] ${v.code}: ${v.message}`);
        });
      }

      if (result.suggestions.length > 0) {
        console.log('   改善提案:');
        result.suggestions.forEach(s => {
          console.log(`     💡 ${s}`);
        });
      }
    }

    // サマリー
    console.log('\n' + '=' .repeat(80));
    console.log('検証サマリー');
    console.log('=' .repeat(80));
    console.log(`✅ 合格: ${passCount}件`);
    console.log(`❌ 不合格: ${failCount}件`);
    console.log(`📊 合格率: ${((passCount / requirements.length) * 100).toFixed(1)}%`);

    // 違反の詳細
    if (violations.length > 0) {
      console.log('\n' + '=' .repeat(80));
      console.log('修正が必要な要求');
      console.log('=' .repeat(80));

      violations.forEach(v => {
        console.log(`\n${v.id}: ${v.title}`);
        v.violations.forEach(violation => {
          console.log(`  - [${violation.severity}] ${violation.code}: ${violation.message}`);
          if (violation.suggestion) {
            console.log(`    💡 ${violation.suggestion}`);
          }
        });
      });
    }

    // 検証レポートを保存（簡易版）
    const fs = require('fs');
    const reportPath = './data/water-heater-validation-report.json';
    const report = {
      timestamp: new Date().toISOString(),
      totalRequirements: requirements.length,
      passCount,
      failCount,
      passRate: ((passCount / requirements.length) * 100).toFixed(1),
      violations
    };
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 詳細レポートを保存しました: ${reportPath}`);

    if (failCount === 0) {
      console.log('\n🎉 すべての要求が妥当性チェックに合格しました！');
    } else {
      console.log(`\n⚠️  ${failCount}件の要求に問題があります。修正が必要です。`);
    }

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

validateRequirements();
