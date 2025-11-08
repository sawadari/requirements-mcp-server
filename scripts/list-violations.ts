import { ProjectManager } from '../src/project/project-manager.js';
import { ValidationEngine } from '../src/validation/validation-engine.js';

async function main() {
  const projectId = process.argv[2] || 'aircon-project';

  const pm = new ProjectManager();
  const project = await pm.loadProject(projectId);
  const engine = await ValidationEngine.create();
  const results = await engine.validateAll(project.requirements);

  // 違反のある要求のみ抽出
  for (const [id, result] of results) {
    if (result.violations.length > 0) {
      const req = project.requirements.get(id);
      console.log(`\n${id}: ${req?.title || ''}`);
      for (const v of result.violations) {
        console.log(`  [${v.severity.toUpperCase()}] ${v.ruleId}: ${v.message}`);
      }
    }
  }
}

main().catch(console.error);
