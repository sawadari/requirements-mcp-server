/**
 * Tool Registry の整合性をチェック
 *
 * チェック内容:
 * 1. 全ツールがsrc/index.tsに実装されているか
 * 2. カテゴリの割り当てが正しいか
 * 3. 関連ツールが実在するか
 * 4. changelog のバージョン整合性
 * 5. 全ツールにテストファイルが存在するか
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ValidationResult {
  passed: boolean;
  errors: string[];
  warnings: string[];
}

async function validateRegistry(): Promise<ValidationResult> {
  const result: ValidationResult = {
    passed: true,
    errors: [],
    warnings: []
  };

  console.log('=== Tool Registry Validation ===\n');

  // Load registry
  const registryPath = path.join(__dirname, '../config/tool-registry.json');
  const registry = JSON.parse(await fs.readFile(registryPath, 'utf-8'));

  // Load src/index.ts
  const indexPath = path.join(__dirname, '../src/index.ts');
  const indexContent = await fs.readFile(indexPath, 'utf-8');

  // Check 1: All tools are implemented in src/index.ts
  console.log('Check 1: Tool implementation');
  for (const toolName of Object.keys(registry.tools)) {
    const casePattern = `case '${toolName}':`;
    if (!indexContent.includes(casePattern)) {
      result.errors.push(`Tool "${toolName}" not implemented in src/index.ts`);
      result.passed = false;
    } else {
      console.log(`  ✅ ${toolName} - implemented`);
    }
  }

  // Check 2: Category assignment
  console.log('\nCheck 2: Category assignment');
  for (const [toolName, tool] of Object.entries(registry.tools) as any) {
    const category = registry.categories[tool.category];
    if (!category) {
      result.errors.push(`Tool "${toolName}" has invalid category: ${tool.category}`);
      result.passed = false;
    } else if (!category.tools.includes(toolName)) {
      result.errors.push(`Tool "${toolName}" not listed in category "${tool.category}"`);
      result.passed = false;
    } else {
      console.log(`  ✅ ${toolName} - category: ${tool.category}`);
    }
  }

  // Check 3: Related tools exist
  console.log('\nCheck 3: Related tools');
  for (const [toolName, tool] of Object.entries(registry.tools) as any) {
    for (const relatedTool of tool.relatedTools || []) {
      if (!registry.tools[relatedTool]) {
        result.errors.push(`Tool "${toolName}" references non-existent related tool: ${relatedTool}`);
        result.passed = false;
      } else {
        console.log(`  ✅ ${toolName} → ${relatedTool}`);
      }
    }
  }

  // Check 4: Changelog version consistency
  console.log('\nCheck 4: Changelog versions');
  for (const [toolName, tool] of Object.entries(registry.tools) as any) {
    if (!tool.changelog || tool.changelog.length === 0) {
      result.warnings.push(`Tool "${toolName}" has no changelog`);
    } else {
      const latestChangelogVersion = tool.changelog[tool.changelog.length - 1].version;
      if (latestChangelogVersion !== tool.version) {
        result.warnings.push(`Tool "${toolName}" version mismatch: registry=${tool.version}, changelog=${latestChangelogVersion}`);
      } else {
        console.log(`  ✅ ${toolName} - version: ${tool.version}`);
      }
    }
  }

  // Check 5: Test files exist
  console.log('\nCheck 5: Test coverage');
  const testsDir = path.join(__dirname, '../tests/tools');
  try {
    await fs.access(testsDir);
  } catch {
    result.warnings.push('tests/tools directory does not exist');
  }

  for (const toolName of Object.keys(registry.tools)) {
    const testFileName = toolName.replace(/_/g, '-') + '.test.ts';
    const testPath = path.join(testsDir, testFileName);
    try {
      await fs.access(testPath);
      console.log(`  ✅ ${toolName} - test exists`);
    } catch {
      result.warnings.push(`Tool "${toolName}" has no test file: ${testFileName}`);
    }
  }

  // Summary
  console.log('\n=== Validation Summary ===');
  console.log(`Total tools: ${Object.keys(registry.tools).length}`);
  console.log(`Errors: ${result.errors.length}`);
  console.log(`Warnings: ${result.warnings.length}`);

  if (result.errors.length > 0) {
    console.log('\n❌ Errors:');
    result.errors.forEach(err => console.log(`  - ${err}`));
  }

  if (result.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    result.warnings.forEach(warn => console.log(`  - ${warn}`));
  }

  if (result.passed && result.warnings.length === 0) {
    console.log('\n✅ All checks passed!');
  } else if (result.passed) {
    console.log('\n✅ Validation passed with warnings');
  } else {
    console.log('\n❌ Validation failed');
  }

  return result;
}

validateRegistry()
  .then(result => {
    process.exit(result.passed ? 0 : 1);
  })
  .catch(error => {
    console.error('Error:', error.message);
    process.exit(1);
  });
