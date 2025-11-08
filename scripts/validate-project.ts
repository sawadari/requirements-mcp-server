#!/usr/bin/env tsx
/**
 * 汎用プロジェクト検証スクリプト
 * 使用方法:
 *   npx tsx scripts/validate-project.ts [プロジェクトファイルパス]
 *   npx tsx scripts/validate-project.ts data/watch-project.json
 *   npx tsx scripts/validate-project.ts  # デフォルトでdata/以下の全プロジェクトを検証
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { Requirement } from '../src/types.js';
import { ValidationEngine } from '../src/validation/validation-engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ProjectData {
  _metadata: {
    projectName: string;
    projectId: string;
    systemName?: string;
    requirementCount: number;
    updatedAt?: string;
  };
  [key: string]: any;
}

interface ValidationSummary {
  projectName: string;
  projectId: string;
  totalRequirements: number;
  totalViolations: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;
}

async function validateProject(projectPath: string): Promise<ValidationSummary> {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📂 プロジェクト検証: ${path.basename(projectPath)}`);
  console.log('='.repeat(70));

  // 1. プロジェクトファイルを読み込み
  const content = await fs.readFile(projectPath, 'utf-8');
  const data: ProjectData = JSON.parse(content);

  const { _metadata, ...requirements } = data;

  console.log(`\nプロジェクト名: ${_metadata.projectName}`);
  console.log(`プロジェクトID: ${_metadata.projectId}`);
  if (_metadata.systemName) {
    console.log(`システム名: ${_metadata.systemName}`);
  }
  console.log(`要求数: ${_metadata.requirementCount}`);
  if (_metadata.updatedAt) {
    console.log(`更新日時: ${_metadata.updatedAt}`);
  }
  console.log('');

  // 2. 要求をMapに変換
  const allRequirements = new Map<string, Requirement>();
  for (const [id, req] of Object.entries(requirements)) {
    allRequirements.set(id, req as Requirement);
  }

  // 3. ValidationEngineを作成
  const engine = await ValidationEngine.create();

  // 4. 各要求を検証
  let totalViolations = 0;
  let errorCount = 0;
  let warningCount = 0;
  let infoCount = 0;

  const requirementIds = Array.from(allRequirements.keys()).sort();

  for (const reqId of requirementIds) {
    const req = allRequirements.get(reqId)!;

    const result = await engine.validateRequirement(req, allRequirements, {
      useLLM: false,
      updateMetrics: false,
    });

    // 結果を集計
    if (result.violations.length > 0) {
      const errors = result.violations.filter(v => v.severity === 'error');
      const warnings = result.violations.filter(v => v.severity === 'warning');
      const infos = result.violations.filter(v => v.severity === 'info');

      errorCount += errors.length;
      warningCount += warnings.length;
      infoCount += infos.length;
      totalViolations += result.violations.length;

      // エラーのみ表示（簡潔版）
      if (errors.length > 0) {
        console.log(`❌ ${reqId}: ${req.title}`);
        errors.forEach(v => {
          console.log(`   [${v.ruleId}] ${v.message}`);
        });
      }
    }
  }

  // 5. サマリー表示
  console.log('\n' + '─'.repeat(70));
  console.log('📊 検証結果サマリー');
  console.log('─'.repeat(70));
  console.log(`検証した要求数: ${requirementIds.length}`);
  console.log(`総違反数: ${totalViolations}`);
  console.log(`  🔴 エラー: ${errorCount}`);
  console.log(`  ⚠️  警告: ${warningCount}`);
  console.log(`  ℹ️  推奨事項: ${infoCount}`);

  if (totalViolations === 0) {
    console.log('\n✅ すべての要求が妥当性基準を満たしています!');
  } else if (errorCount === 0) {
    console.log('\n✅ エラーレベルの違反はありません（警告・推奨事項のみ）');
  } else {
    console.log(`\n⚠️  ${errorCount}件のエラーレベル違反があります。修正が必要です。`);
  }

  return {
    projectName: _metadata.projectName,
    projectId: _metadata.projectId,
    totalRequirements: requirementIds.length,
    totalViolations,
    errorCount,
    warningCount,
    infoCount,
  };
}

async function findProjectFiles(dataDir: string): Promise<string[]> {
  const files = await fs.readdir(dataDir);
  const projectFiles: string[] = [];

  for (const file of files) {
    if (file.endsWith('.json') && !file.startsWith('.')) {
      const filePath = path.join(dataDir, file);
      const stat = await fs.stat(filePath);
      if (stat.isFile()) {
        projectFiles.push(filePath);
      }
    }
  }

  return projectFiles;
}

async function main() {
  const args = process.argv.slice(2);

  try {
    if (args.length > 0) {
      // 引数でプロジェクトファイルが指定された場合
      let projectPath = args[0];

      // プロジェクトIDだけが渡された場合、data/以下のファイルとして解決
      if (!projectPath.includes('/') && !projectPath.includes('\\') && !projectPath.endsWith('.json')) {
        projectPath = path.join(__dirname, '../data', `${projectPath}.json`);
      } else {
        projectPath = path.resolve(projectPath);
      }

      await validateProject(projectPath);
    } else {
      // 引数なしの場合、data/以下の全プロジェクトを検証
      const dataDir = path.join(__dirname, '../data');
      const projectFiles = await findProjectFiles(dataDir);

      if (projectFiles.length === 0) {
        console.log('⚠️  data/ ディレクトリにプロジェクトファイルが見つかりませんでした。');
        process.exit(1);
      }

      console.log(`\n🔍 ${projectFiles.length}個のプロジェクトを検証します...\n`);

      const summaries: ValidationSummary[] = [];

      for (const projectFile of projectFiles) {
        const summary = await validateProject(projectFile);
        summaries.push(summary);
      }

      // 全体サマリー
      if (summaries.length > 1) {
        console.log('\n\n' + '='.repeat(70));
        console.log('📊 全プロジェクト検証サマリー');
        console.log('='.repeat(70));

        const totalReqs = summaries.reduce((sum, s) => sum + s.totalRequirements, 0);
        const totalVio = summaries.reduce((sum, s) => sum + s.totalViolations, 0);
        const totalErr = summaries.reduce((sum, s) => sum + s.errorCount, 0);
        const totalWarn = summaries.reduce((sum, s) => sum + s.warningCount, 0);
        const totalInfo = summaries.reduce((sum, s) => sum + s.infoCount, 0);

        console.log(`\n検証プロジェクト数: ${summaries.length}`);
        console.log(`総要求数: ${totalReqs}`);
        console.log(`総違反数: ${totalVio}`);
        console.log(`  🔴 エラー: ${totalErr}`);
        console.log(`  ⚠️  警告: ${totalWarn}`);
        console.log(`  ℹ️  推奨事項: ${totalInfo}`);

        console.log('\n各プロジェクトの状態:');
        summaries.forEach(s => {
          const status = s.errorCount === 0 ? '✅' : '❌';
          console.log(`  ${status} ${s.projectName} (${s.projectId}): エラー${s.errorCount}件`);
        });

        if (totalErr === 0) {
          console.log('\n✅ すべてのプロジェクトがエラーなしで検証されました!');
        } else {
          console.log(`\n⚠️  ${totalErr}件のエラーレベル違反があります。修正が必要です。`);
        }
      }
    }
  } catch (error: any) {
    console.error(`\n❌ エラーが発生しました: ${error.message}`);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
