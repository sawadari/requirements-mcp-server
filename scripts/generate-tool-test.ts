/**
 * Tool Registry から自動的にテストテンプレートを生成
 *
 * 使用方法:
 * npm run generate-tool-test -- <tool-name>
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ToolRegistryEntry {
  name: string;
  category: string;
  description: string;
  useCases: string[];
  inputs: string[];
  outputs: string[];
  relatedTools: string[];
}

async function generateToolTest(toolName: string): Promise<void> {
  console.log(`Generating test for tool: ${toolName}`);

  // Load Tool Registry
  const registryPath = path.join(__dirname, '../config/tool-registry.json');
  const registryData = await fs.readFile(registryPath, 'utf-8');
  const registry = JSON.parse(registryData);

  // Check if tool exists
  const tool: ToolRegistryEntry = registry.tools[toolName];
  if (!tool) {
    console.error(`❌ Tool "${toolName}" not found in registry`);
    console.log(`   Available tools: ${Object.keys(registry.tools).join(', ')}`);
    process.exit(1);
  }

  // Load template
  const templatePath = path.join(__dirname, '../tests/templates/tool-test.template.ts');
  const template = await fs.readFile(templatePath, 'utf-8');

  // Replace placeholders
  const testCode = template
    .replace(/{{TOOL_NAME}}/g, toolName)
    .replace(/{{SUCCESS_CASE_DESCRIPTION}}/g, tool.useCases[0] || 'perform operation successfully');

  // Add tool-specific test cases based on inputs
  let additionalTests = '';

  if (tool.inputs.includes('id')) {
    additionalTests += `
  it('should require valid ID parameter', async () => {
    const result = await server.callTool('${toolName}', { id: '' });
    expect(result.content[0].text).toContain('Error');
  });
`;
  }

  // Insert additional tests before the last closing brace
  const enhancedTestCode = testCode.replace(
    /(\s+describe\('統合テスト')/,
    additionalTests + '$1'
  );

  // Output file path
  const testFileName = toolName.replace(/_/g, '-') + '.test.ts';
  const testPath = path.join(__dirname, '../tests/tools', testFileName);

  // Check if test already exists
  try {
    await fs.access(testPath);
    console.log(`⚠️  Test file already exists: ${testPath}`);
    console.log(`   Use --force to overwrite`);

    if (!process.argv.includes('--force')) {
      process.exit(1);
    }
  } catch {
    // File doesn't exist, proceed
  }

  // Write test file
  await fs.writeFile(testPath, enhancedTestCode, 'utf-8');

  console.log('✅ Test file generated successfully');
  console.log(`   Path: ${testPath}`);
  console.log('');
  console.log('次のステップ:');
  console.log(`1. ${testPath} を編集してテストケースを完成させる`);
  console.log('2. npm test を実行してテストが失敗することを確認（RED）');
  console.log(`3. src/index.ts に ${toolName} の実装を追加（GREEN）`);
  console.log('4. npm test を実行してテストが成功することを確認');
  console.log('5. リファクタリング & 再テスト');
}

// CLI parsing
const args = process.argv.slice(2);
const toolName = args.find(arg => !arg.startsWith('--'));

if (!toolName) {
  console.error('Usage: npm run generate-tool-test -- <tool-name> [--force]');
  console.error('');
  console.error('Example:');
  console.error('  npm run generate-tool-test -- batch_update_requirements');
  process.exit(1);
}

generateToolTest(toolName).catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
