/**
 * スマート体重計プロジェクトの妥当性チェック
 */

const fs = require('fs');
const path = require('path');

function validateSmartScale() {
  try {
    console.log('🔍 スマート体重計プロジェクトの妥当性チェックを開始します...\n');

    const dataPath = path.join(__dirname, '..', 'data', 'smart-scale.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    // すべての要求をロード
    const allRequirements = Object.keys(data)
      .filter(key => key !== '_metadata')
      .map(key => data[key]);

    console.log(`📊 ${allRequirements.length}件の要求を検証します\n`);
    console.log('=' .repeat(80));
    console.log('妥当性チェック結果');
    console.log('=' .repeat(80) + '\n');

    let passCount = 0;
    let failCount = 0;
    const issues = [];

    // 各要求を検証
    for (const req of allRequirements) {
      const reqIssues = [];

      // 1. 必須フィールドのチェック
      if (!req.id) reqIssues.push('IDが未設定');
      if (!req.title) reqIssues.push('タイトルが未設定');
      if (!req.description) reqIssues.push('説明が未設定');
      if (!req.category) reqIssues.push('カテゴリが未設定');
      if (!req.priority) reqIssues.push('優先度が未設定');
      if (!req.status) reqIssues.push('ステータスが未設定');

      // 2. 階層構造のチェック
      if (req.refines && req.refines.length > 0) {
        for (const parentId of req.refines) {
          const parent = allRequirements.find(r => r.id === parentId);
          if (!parent) {
            reqIssues.push(`存在しない親要求を参照: ${parentId}`);
          }
        }
      }

      // 3. タイトルと説明の長さチェック
      if (req.title && req.title.length < 5) {
        reqIssues.push('タイトルが短すぎる（5文字未満）');
      }
      if (req.description && req.description.length < 10) {
        reqIssues.push('説明が短すぎる（10文字未満）');
      }

      // 4. 循環参照のチェック
      if (req.refines && req.refines.includes(req.id)) {
        reqIssues.push('自己参照が検出されました');
      }

      // 結果を集計
      if (reqIssues.length === 0) {
        console.log(`✅ PASS ${req.id}: ${req.title}`);
        passCount++;
      } else {
        console.log(`❌ FAIL ${req.id}: ${req.title}`);
        reqIssues.forEach(issue => {
          console.log(`     - ${issue}`);
        });
        failCount++;
        issues.push({ id: req.id, title: req.title, issues: reqIssues });
      }
    }

    // サマリー
    console.log('\n' + '=' .repeat(80));
    console.log('検証サマリー');
    console.log('=' .repeat(80));
    console.log(`✅ 合格: ${passCount}件`);
    console.log(`❌ 不合格: ${failCount}件`);
    console.log(`📊 合格率: ${((passCount / allRequirements.length) * 100).toFixed(1)}%`);

    // 階層構造の確認
    console.log('\n' + '=' .repeat(80));
    console.log('階層構造');
    console.log('=' .repeat(80));

    const stakeholders = allRequirements.filter(r => r.id.startsWith('STK-'));
    const systems = allRequirements.filter(r => r.id.startsWith('SYS-'));
    const functionals = allRequirements.filter(r => r.id.startsWith('FUNC-'));

    console.log(`\nステークホルダ要求: ${stakeholders.length}件`);
    stakeholders.forEach(stk => {
      const children = systems.filter(sys => sys.refines && sys.refines.includes(stk.id));
      console.log(`  ${stk.id}: ${stk.title} (子要求: ${children.length}件)`);
    });

    console.log(`\nシステム要求: ${systems.length}件`);
    systems.forEach(sys => {
      const parents = sys.refines || [];
      const children = functionals.filter(func => func.refines && func.refines.includes(sys.id));
      console.log(`  ${sys.id}: ${sys.title}`);
      console.log(`    → 親: [${parents.join(', ')}], 子: ${children.length}件`);
    });

    console.log(`\n機能要求: ${functionals.length}件`);
    functionals.forEach(func => {
      const parents = func.refines || [];
      console.log(`  ${func.id}: ${func.title} → 親: [${parents.join(', ')}]`);
    });

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

validateSmartScale();
