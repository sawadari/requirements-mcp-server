/**
 * Tool Registry への新規ツール登録スクリプト
 *
 * 使用方法:
 * npm run register-tool -- <tool-name> --category <category>
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ToolRegistryEntry {
  name: string;
  category: string;
  version: string;
  status: 'draft' | 'stable' | 'deprecated';
  description: string;
  useCases: string[];
  inputs: string[];
  outputs: string[];
  relatedTools: string[];
  changelog: Array<{
    version: string;
    date: string;
    changes: string;
  }>;
}

interface ToolRegistry {
  version: string;
  lastUpdated: string;
  description: string;
  categories: Record<string, {
    name: string;
    description: string;
    tools: string[];
  }>;
  tools: Record<string, ToolRegistryEntry>;
}

async function registerTool(
  toolName: string,
  category: string,
  options: {
    description?: string;
    useCases?: string[];
    inputs?: string[];
    outputs?: string[];
    relatedTools?: string[];
  } = {}
): Promise<void> {
  const registryPath = path.join(__dirname, '../config/tool-registry.json');

  // Load existing registry
  const registryData = await fs.readFile(registryPath, 'utf-8');
  const registry: ToolRegistry = JSON.parse(registryData);

  // Check if tool already exists
  if (registry.tools[toolName]) {
    console.error(`❌ Tool "${toolName}" already exists in registry`);
    console.log(`   Current version: ${registry.tools[toolName].version}`);
    console.log(`   Use update-tool script to modify existing tool`);
    process.exit(1);
  }

  // Check if category exists
  if (!registry.categories[category]) {
    console.error(`❌ Category "${category}" does not exist`);
    console.log(`   Available categories: ${Object.keys(registry.categories).join(', ')}`);
    process.exit(1);
  }

  // Create new tool entry
  const newTool: ToolRegistryEntry = {
    name: toolName,
    category,
    version: '1.0.0',
    status: 'draft',
    description: options.description || `${toolName} の説明`,
    useCases: options.useCases || ['使用例を追加してください'],
    inputs: options.inputs || [],
    outputs: options.outputs || [],
    relatedTools: options.relatedTools || [],
    changelog: [
      {
        version: '1.0.0',
        date: new Date().toISOString().split('T')[0],
        changes: '初回実装',
      },
    ],
  };

  // Add tool to registry
  registry.tools[toolName] = newTool;
  registry.categories[category].tools.push(toolName);
  registry.lastUpdated = new Date().toISOString().split('T')[0];

  // Save registry
  await fs.writeFile(
    registryPath,
    JSON.stringify(registry, null, 2),
    'utf-8'
  );

  console.log('✅ Tool registered successfully');
  console.log(`   Name: ${toolName}`);
  console.log(`   Category: ${category}`);
  console.log(`   Status: draft`);
  console.log('');
  console.log('次のステップ:');
  console.log(`1. src/index.ts に ${toolName} の実装を追加`);
  console.log(`2. config/tool-registry.json の description と useCases を更新`);
  console.log(`3. docs/tools/${toolName}.md にドキュメントを作成`);
  console.log(`4. examples/${toolName}.json に使用例を追加`);
  console.log(`5. status を "stable" に変更`);
}

// CLI parsing
const args = process.argv.slice(2);
const toolName = args[0];
const categoryIndex = args.indexOf('--category');
const category = categoryIndex >= 0 ? args[categoryIndex + 1] : undefined;

if (!toolName || !category) {
  console.error('Usage: npm run register-tool -- <tool-name> --category <category>');
  console.error('');
  console.error('Categories: crud, analysis, validation, change_management');
  process.exit(1);
}

registerTool(toolName, category).catch(error => {
  console.error('Error:', error.message);
  process.exit(1);
});
