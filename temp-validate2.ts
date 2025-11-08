import * as fs from 'fs/promises';
import { Requirement } from './src/types.js';
import { ValidationEngine } from './src/validation/validation-engine.js';

async function main() {
  const content = await fs.readFile('./data/cleaning-robot.json', 'utf-8');
  const data = JSON.parse(content);
  const { _metadata, ...requirements } = data;

  const allReqs = new Map<string, Requirement>();
  for (const [id, req] of Object.entries(requirements)) {
    allReqs.set(id, req as Requirement);
  }

  const engine = await ValidationEngine.create();

  console.log('='.repeat(70));
  console.log('警告と推奨事項の詳細');
  console.log('='.repeat(70));

  for (const [id, req] of allReqs.entries()) {
    const result = await engine.validateRequirement(req, allReqs, {
      useLLM: false,
      updateMetrics: false,
    });

    const warnings = result.violations.filter(v => v.severity === 'warning');
    const infos = result.violations.filter(v => v.severity === 'info');

    if (warnings.length > 0 || infos.length > 0) {
      console.log(`\n${id}: ${req.title}`);
      
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
