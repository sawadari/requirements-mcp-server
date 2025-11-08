import { RequirementsStorage } from './src/storage.js';
import { ValidationEngine } from './src/validation/validation-engine.js';

async function main() {
  const storage = new RequirementsStorage('./data');
  await storage.initialize();
  await storage.switchProject('cleaning-robot');

  const engine = await ValidationEngine.create();
  const allReqs = await storage.listRequirements();

  console.log('='.repeat(70));
  console.log('警告の詳細');
  console.log('='.repeat(70));

  for (const req of allReqs) {
    const result = await engine.validateRequirement(req, new Map(allReqs.map(r => [r.id, r])), {
      useLLM: false,
      updateMetrics: false,
    });

    const warnings = result.violations.filter(v => v.severity === 'warning');
    const infos = result.violations.filter(v => v.severity === 'info');

    if (warnings.length > 0 || infos.length > 0) {
      console.log(`\n${req.id}: ${req.title}`);
      
      if (warnings.length > 0) {
        console.log('  ⚠️  警告:');
        warnings.forEach(w => {
          console.log(`    [${w.ruleId}] ${w.message}`);
        });
      }

      if (infos.length > 0) {
        console.log('  ℹ️  推奨:');
        infos.forEach(i => {
          console.log(`    [${i.ruleId}] ${i.message}`);
        });
      }
    }
  }
}

main().catch(console.error);
