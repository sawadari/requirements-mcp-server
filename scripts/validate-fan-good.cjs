/**
 * 問題のある扇風機プロジェクトの妥当性チェック
 */

const fs = require('fs');
const path = require('path');

function validateFan() {
  try {
    console.log('🔍 扇風機プロジェクト（改善版）の妥当性チェック\n');
    console.log('=' .repeat(80));

    const dataPath = path.join(__dirname, '..', 'data', 'fan-good.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    const allRequirements = Object.keys(data)
      .filter(key => key !== '_metadata')
      .map(key => data[key]);

    console.log(`📊 ${allRequirements.length}件の要求を検証\n`);

    const issues = [];
    let issueCount = 0;

    // 詳細な妥当性チェック
    for (const req of allRequirements) {
      const reqIssues = [];

      // 1. タイトルの品質チェック
      if (!req.title || req.title.trim() === '') {
        reqIssues.push({ severity: 'ERROR', message: 'タイトルが空' });
      } else if (req.title.length < 5) {
        reqIssues.push({ severity: 'WARNING', message: `タイトルが短すぎる（${req.title.length}文字）` });
      } else if (req.title.includes('TODO') || req.title.includes('あとで')) {
        reqIssues.push({ severity: 'ERROR', message: 'タイトルが未確定（TODOを含む）' });
      } else if (req.title.includes('、') || req.title.includes('と')) {
        reqIssues.push({ severity: 'WARNING', message: 'タイトルに複数の関心事が含まれている可能性（単一責任原則違反）' });
      }

      // 2. 説明文の品質チェック
      if (!req.description || req.description.trim() === '') {
        reqIssues.push({ severity: 'ERROR', message: '説明が空' });
      } else if (req.description.length < 10) {
        reqIssues.push({ severity: 'WARNING', message: `説明が短すぎる（${req.description.length}文字）` });
      } else if (req.description === req.title) {
        reqIssues.push({ severity: 'WARNING', message: 'タイトルと説明が同じ（追加情報なし）' });
      } else if (req.description.includes('TODO')) {
        reqIssues.push({ severity: 'ERROR', message: '説明が未確定（TODOを含む）' });
      } else if (req.description.includes('。') && req.description.split('。').length > 5) {
        reqIssues.push({ severity: 'WARNING', message: '説明が長すぎる（複数の要求を含む可能性）' });
      } else if (req.description.includes('いい感じ') || req.description.includes('できれば')) {
        reqIssues.push({ severity: 'WARNING', message: '曖昧な表現が含まれている' });
      }

      // 3. 階層関係のチェック
      if (req.refines && req.refines.length > 0) {
        for (const parentId of req.refines) {
          const parent = allRequirements.find(r => r.id === parentId);
          if (!parent) {
            reqIssues.push({ severity: 'ERROR', message: `存在しない親要求を参照: ${parentId}` });
          }
        }
      }

      // 4. 循環参照チェック
      if (req.dependencies && req.dependencies.includes(req.id)) {
        reqIssues.push({ severity: 'ERROR', message: '自己参照（循環依存）が検出された' });
      }

      // 5. カテゴリの妥当性
      const validCategories = ['ステークホルダ要求', 'システム要求', 'システム機能要求'];
      if (!validCategories.includes(req.category)) {
        reqIssues.push({ severity: 'WARNING', message: `不正なカテゴリ: ${req.category}` });
      }

      // 6. 優先度の妥当性
      const validPriorities = ['critical', 'high', 'medium', 'low'];
      if (!validPriorities.includes(req.priority)) {
        reqIssues.push({ severity: 'WARNING', message: `不正な優先度: ${req.priority}` });
      }

      // 7. タグの有無
      if (!req.tags || req.tags.length === 0) {
        reqIssues.push({ severity: 'INFO', message: 'タグが設定されていない' });
      }

      // 8. 重複チェック
      const duplicates = allRequirements.filter(r =>
        r.id !== req.id &&
        (r.title === req.title || r.title.includes('同じ') || req.title.includes('同じ'))
      );
      if (duplicates.length > 0) {
        reqIssues.push({ severity: 'WARNING', message: `重複の可能性: ${duplicates.map(d => d.id).join(', ')}` });
      }

      // 9. 命名規則チェック
      if (!req.id.match(/^(STK|SYS|FUNC)-\d{3}$/)) {
        reqIssues.push({ severity: 'WARNING', message: `ID命名規則違反: ${req.id}` });
      }

      // 結果を表示
      if (reqIssues.length > 0) {
        const errorCount = reqIssues.filter(i => i.severity === 'ERROR').length;
        const warnCount = reqIssues.filter(i => i.severity === 'WARNING').length;
        const symbol = errorCount > 0 ? '❌' : warnCount > 0 ? '⚠️' : 'ℹ️';

        console.log(`${symbol} ${req.id}: ${req.title || '(タイトルなし)'}`);
        reqIssues.forEach(issue => {
          const icon = issue.severity === 'ERROR' ? '  🔴' : issue.severity === 'WARNING' ? '  🟡' : '  🔵';
          console.log(`${icon} [${issue.severity}] ${issue.message}`);
        });
        console.log('');

        issues.push({ req, issues: reqIssues });
        issueCount += reqIssues.length;
      } else {
        console.log(`✅ ${req.id}: ${req.title}`);
      }
    }

    // サマリー
    console.log('\n' + '=' .repeat(80));
    console.log('検証サマリー');
    console.log('=' .repeat(80));

    const errorReqs = issues.filter(i => i.issues.some(iss => iss.severity === 'ERROR'));
    const warnReqs = issues.filter(i => i.issues.some(iss => iss.severity === 'WARNING') && !errorReqs.includes(i));
    const infoReqs = issues.filter(i => !errorReqs.includes(i) && !warnReqs.includes(i));

    console.log(`❌ エラー: ${errorReqs.length}件の要求`);
    console.log(`⚠️  警告: ${warnReqs.length}件の要求`);
    console.log(`ℹ️  情報: ${infoReqs.length}件の要求`);
    console.log(`✅ 問題なし: ${allRequirements.length - issues.length}件の要求`);
    console.log(`\n📊 合格率: ${(((allRequirements.length - errorReqs.length) / allRequirements.length) * 100).toFixed(1)}%`);

    // 主な問題点のサマリー
    console.log('\n' + '=' .repeat(80));
    console.log('検出された主な問題');
    console.log('=' .repeat(80));

    const problemTypes = {};
    issues.forEach(item => {
      item.issues.forEach(issue => {
        const key = issue.message.split('（')[0].split(':')[0];
        problemTypes[key] = (problemTypes[key] || 0) + 1;
      });
    });

    Object.entries(problemTypes)
      .sort((a, b) => b[1] - a[1])
      .forEach(([problem, count]) => {
        console.log(`  • ${problem}: ${count}件`);
      });

    console.log('\n💡 改善推奨アクション:');
    if (errorReqs.length > 0) {
      console.log('  1. エラーを含む要求を優先的に修正');
    }
    if (warnReqs.length > 0) {
      console.log('  2. 曖昧な表現を具体的な表現に書き換え');
      console.log('  3. 複数の関心事を含む要求を分割');
    }
    console.log('  4. タグを適切に設定');
    console.log('  5. 存在しない参照を修正');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    console.error(error.stack);
    process.exit(1);
  }
}

validateFan();
