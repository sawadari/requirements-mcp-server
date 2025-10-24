const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/orchestrator/step-executor.ts');
let content = fs.readFileSync(filePath, 'utf8');

// Define the new cases to insert before the default case
const newCases = `
      case 'add_requirement':
        const reqData = this.extractRequirements(context)[0] || params;
        const addedReq = await this.storage.addRequirement(reqData);
        context.createdRequirements.push(addedReq);
        return {
          stepId: step.id,
          success: true,
          data: addedReq,
          duration: 0,
        };

      case 'update_requirement':
        const updateId = params.id?.toUpperCase() || params.id;
        const { id, ...updates } = params;
        const updatedReq = await this.storage.updateRequirement(updateId, updates);
        if (!updatedReq) {
          throw new Error(\`Requirement not found: \${updateId}\`);
        }
        return {
          stepId: step.id,
          success: true,
          data: updatedReq,
          duration: 0,
        };

      case 'get_requirement':
        const getId = params.id?.toUpperCase() || params.id;
        const requirement = await this.storage.getRequirement(getId);
        if (!requirement) {
          throw new Error(\`Requirement not found: \${getId}\`);
        }
        return {
          stepId: step.id,
          success: true,
          data: requirement,
          duration: 0,
        };

      case 'search_requirements':
        const searchResults = await this.storage.searchRequirements(params);
        return {
          stepId: step.id,
          success: true,
          data: searchResults,
          duration: 0,
        };
`;

// Find and replace - insert before the default case
const defaultCasePattern = /(\n\s+default:\s*\n\s+return\s+\{)/;

if (content.match(defaultCasePattern)) {
  content = content.replace(defaultCasePattern, newCases + '$1');
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Successfully patched step-executor.ts');
  console.log('Added: add_requirement, update_requirement, get_requirement, search_requirements');
} else {
  console.error('❌ Could not find default case pattern');
  process.exit(1);
}
