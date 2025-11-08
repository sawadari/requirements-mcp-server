import { ProjectManager } from '../src/project/project-manager.js';
import { ValidationEngine } from '../src/validation/validation-engine.js';

async function main() {
  const projectId = process.argv[2] || 'aircon-project';

  const pm = new ProjectManager();
  const project = await pm.loadProject(projectId);
  const engine = await ValidationEngine.create();
  const results = await engine.validateAll(project.requirements);

  console.log('='.repeat(70));
  console.log('詳細違反レポート');
  console.log('='.repeat(70));

  // 違反のある要求のみ抽出してソート
  const violatedReqs = Array.from(results.entries())
    .filter(([_, result]) => result.violations.length > 0)
    .sort((a, b) => {
      // エラー > 警告 > 推奨 の順
      const severityOrder = { error: 0, warning: 1, info: 2 };
      const aMaxSeverity = Math.min(...a[1].violations.map(v => severityOrder[v.severity]));
      const bMaxSeverity = Math.min(...b[1].violations.map(v => severityOrder[v.severity]));
      return aMaxSeverity - bMaxSeverity;
    });

  for (const [id, result] of violatedReqs) {
    const req = project.requirements.get(id);
    console.log(`\n${id}: ${req?.title || ''}`);
    console.log('-'.repeat(70));
    console.log(`Type: ${req?.type}, Status: ${req?.status}`);
    console.log(`Description: ${req?.description.substring(0, 100)}...`);
    console.log(`\n違反 (${result.violations.length}件):`);

    for (const v of result.violations) {
      const icon = v.severity === 'error' ? '🔴' : v.severity === 'warning' ? '⚠️' : 'ℹ️';
      console.log(`  ${icon} [${v.severity.toUpperCase()}] ${v.ruleId}: ${v.message}`);
      if (v.details) {
        console.log(`     詳細: ${v.details}`);
      }
      if (v.suggestedFix) {
        console.log(`     💡 修正案: ${v.suggestedFix}`);
      }
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('サマリー');
  console.log('='.repeat(70));
  const totalViolations = Array.from(results.values()).reduce((sum, r) => sum + r.violations.length, 0);
  const byDomain = new Map<string, number>();
  const bySeverity = { error: 0, warning: 0, info: 0 };

  for (const result of results.values()) {
    for (const v of result.violations) {
      bySeverity[v.severity]++;
      byDomain.set(v.ruleDomain, (byDomain.get(v.ruleDomain) || 0) + 1);
    }
  }

  console.log(`\n総違反数: ${totalViolations}`);
  console.log(`  🔴 エラー: ${bySeverity.error}`);
  console.log(`  ⚠️  警告: ${bySeverity.warning}`);
  console.log(`  ℹ️  推奨事項: ${bySeverity.info}`);
  console.log(`\nドメイン別:`);
  for (const [domain, count] of byDomain) {
    console.log(`  ${domain}: ${count}件`);
  }
}

main().catch(console.error);
