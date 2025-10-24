/**
 * TaskPlannerに update プランを追加
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TASK_PLANNER_PATH = path.join(__dirname, '../src/orchestrator/task-planner.ts');

async function main() {
  console.log('🔧 Adding update plan to TaskPlanner...\n');

  let content = await fs.readFile(TASK_PLANNER_PATH, 'utf-8');

  // updateケースを追加
  const updateCase = `      case 'update':
        return this.createUpdatePlan(intent);
`;

  const fixCase = `      case 'fix':`;

  if (content.includes(fixCase) && !content.includes("case 'update':")) {
    content = content.replace(fixCase, updateCase + '\n' + fixCase);
    console.log('✅ Added update case');
  } else if (content.includes("case 'update':")) {
    console.log('ℹ️  Update case already exists');
  } else {
    console.log('⚠️  Could not find insertion point');
  }

  // createUpdatePlan メソッドを追加
  const updateMethod = `
  /**
   * 要求更新プラン
   */
  private createUpdatePlan(intent: Intent): ExecutionPlan {
    const requirementId = intent.entities.requirementId;
    const status = intent.entities.status;

    return {
      steps: [
        {
          id: 'step1',
          type: 'mcp_call',
          tool: 'update_requirement',
          params: {
            id: requirementId,
            status: status || 'approved',
          },
          description: \`\${requirementId}の要求を更新\`,
          dependencies: [],
        },
      ],
      description: '要求を更新',
      estimatedDuration: '< 1秒',
    };
  }
`;

  const createSearchPlanStart = `  /**
   * 検索プラン
   */
  private createSearchPlan(intent: Intent):`;

  if (content.includes(createSearchPlanStart) && !content.includes('createUpdatePlan')) {
    content = content.replace(createSearchPlanStart, updateMethod + '\n' + createSearchPlanStart);
    console.log('✅ Added createUpdatePlan method');
  } else if (content.includes('createUpdatePlan')) {
    console.log('ℹ️  createUpdatePlan method already exists');
  } else {
    console.log('⚠️  Could not find method insertion point');
  }

  await fs.writeFile(TASK_PLANNER_PATH, content, 'utf-8');
  console.log('\n✅ Patch completed');
  console.log('📝 Modified:', TASK_PLANNER_PATH);
}

main().catch(err => {
  console.error('❌ Patch failed:', err);
  process.exit(1);
});
