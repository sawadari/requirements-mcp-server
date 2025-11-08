#!/usr/bin/env tsx
/**
 * requirements.jsonのみを検証するスクリプト
 */

import { readFile } from 'fs/promises';
import { ValidationEngine } from '../src/validation/validation-engine.js';

interface Requirement {
  id: string;
  title: string;
  description: string;
  category?: string;
  dependencies?: string[];
  [key: string]: any;
}

interface RequirementsData {
  _metadata?: {
    projectName?: string;
    systemName?: string;
    description?: string;
  };
  [key: string]: any;
}

async function validateRequirements() {
  console.log('======================================================================');
  console.log('📂 プロジェクト検証: requirements.json');
  console.log('======================================================================\n');

  // Load requirements.json
  const filePath = './data/requirements.json';
  const content = await readFile(filePath, 'utf-8');
  const data: RequirementsData = JSON.parse(content);

  const metadata = data._metadata || {};
  console.log(`プロジェクト名: ${metadata.projectName || 'N/A'}`);
  console.log(`システム名: ${metadata.systemName || 'N/A'}`);
  console.log(`説明: ${metadata.description || 'N/A'}`);

  // Extract requirements
  const requirements: Requirement[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (key !== '_metadata' && typeof value === 'object' && value !== null) {
      requirements.push(value as Requirement);
    }
  }

  console.log(`要求数: ${requirements.length}\n`);

  // Initialize ValidationEngine
  const validationEngine = await ValidationEngine.create();

  console.log('🔍 検証を開始します...\n');

  // Validate each requirement
  let totalViolations = 0;
  let errorCount = 0;
  let warningCount = 0;
  let infoCount = 0;

  for (const req of requirements) {
    const violations = await validationEngine.validateRequirement(req, requirements);

    if (violations.length > 0) {
      console.log(`\n❌ ${req.id}: ${req.title}`);
      for (const violation of violations) {
        const icon = violation.severity === 'error' ? '🔴' : violation.severity === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`   ${icon} [${violation.ruleId}] ${violation.message}`);

        totalViolations++;
        if (violation.severity === 'error') errorCount++;
        else if (violation.severity === 'warning') warningCount++;
        else infoCount++;
      }
    } else {
      console.log(`✅ ${req.id}: ${req.title}`);
    }
  }

  // Summary
  console.log('\n──────────────────────────────────────────────────────────────────────');
  console.log('📊 検証結果サマリー');
  console.log('──────────────────────────────────────────────────────────────────────');
  console.log(`検証した要求数: ${requirements.length}`);
  console.log(`総違反数: ${totalViolations}`);
  console.log(`  🔴 エラー: ${errorCount}`);
  console.log(`  ⚠️  警告: ${warningCount}`);
  console.log(`  ℹ️  推奨事項: ${infoCount}`);

  if (errorCount > 0) {
    console.log(`\n⚠️  ${errorCount}件のエラーレベル違反があります。修正が必要です。`);
    process.exit(1);
  } else if (warningCount > 0) {
    console.log(`\n✅ エラーはありませんが、${warningCount}件の警告があります。`);
  } else {
    console.log('\n✅ すべての検証をパスしました！');
  }
}

validateRequirements().catch((error) => {
  console.error('❌ エラーが発生しました:', error.message);
  process.exit(1);
});
