#!/usr/bin/env tsx
/**
 * watch-projectの要求を直接検証するスクリプト
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { Requirement, ValidationViolation } from '../src/types.js';
import { ValidationEngine } from '../src/validation/validation-engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface WatchProjectData {
  _metadata: {
    projectName: string;
    projectId: string;
    requirementCount: number;
  };
  [key: string]: any;
}

async function validateWatchProject() {
  console.log('=== デジタル腕時計プロジェクト - 全要求の妥当性チェック ===\n');

  // 1. watch-project.jsonを読み込み
  const dataPath = path.join(__dirname, '../data/watch-project.json');
  const content = await fs.readFile(dataPath, 'utf-8');
  const data: WatchProjectData = JSON.parse(content);

  const { _metadata, ...requirements } = data;

  console.log(`プロジェクト: ${_metadata.projectName}`);
  console.log(`要求数: ${_metadata.requirementCount}`);
  console.log(`更新日時: ${_metadata.updatedAt}\n`);

  // 2. 要求をMapに変換
  const allRequirements = new Map<string, Requirement>();
  for (const [id, req] of Object.entries(requirements)) {
    allRequirements.set(id, req as Requirement);
  }

  // 3. ValidationEngineを作成
  const engine = await ValidationEngine.create();

  // デバッグ: オントロジーマネージャーを確認
  const ontologyMgr = engine.getOntologyManager();
  if (ontologyMgr) {
    const systemStage = ontologyMgr.getAllStages().find(s => s.id === 'system');
    console.log(`\n[デバッグ] system stage の requiresChildren: ${systemStage?.requiresChildren}\n`);
  } else {
    console.log('\n[デバッグ] オントロジーマネージャーが設定されていません\n');
  }

  // 4. 各要求を検証
  let totalViolations = 0;
  let totalRecommendations = 0;

  const requirementIds = Array.from(allRequirements.keys()).sort();

  for (const reqId of requirementIds) {
    const req = allRequirements.get(reqId)!;
    console.log(`\n📋 ${reqId} の検証中...`);
    console.log(`   タイプ: ${req.type}`);
    console.log(`   タイトル: ${req.title}`);

    try {
      const result = await engine.validateRequirement(req, allRequirements, {
        useLLM: false,
        updateMetrics: false,
      });

      // 結果を表示
      if (result.violations.length === 0) {
        console.log(`   ✅ 違反なし (スコア: ${result.score}/100)`);
      } else {
        console.log(`   ⚠️  違反数: ${result.violations.length} (スコア: ${result.score}/100)`);

        const errors = result.violations.filter(v => v.severity === 'error');
        const warnings = result.violations.filter(v => v.severity === 'warning');
        const infos = result.violations.filter(v => v.severity === 'info');

        if (errors.length > 0) {
          console.log(`\n   🔴 エラー (${errors.length}件):`);
          errors.forEach(v => {
            console.log(`      [${v.ruleId}] ${v.message}`);
            if (v.details) {
              console.log(`         詳細: ${v.details}`);
            }
            if (v.suggestedFix) {
              console.log(`         💡 修正案: ${v.suggestedFix}`);
            }
          });
        }

        if (warnings.length > 0) {
          console.log(`\n   ⚠️  警告 (${warnings.length}件):`);
          warnings.forEach(v => {
            console.log(`      [${v.ruleId}] ${v.message}`);
            if (v.details) {
              console.log(`         詳細: ${v.details}`);
            }
          });
        }

        if (infos.length > 0) {
          console.log(`\n   ℹ️  推奨事項 (${infos.length}件):`);
          infos.forEach(v => {
            console.log(`      [${v.ruleId}] ${v.message}`);
          });
        }

        totalViolations += errors.length;
        totalRecommendations += warnings.length + infos.length;
      }
    } catch (error: any) {
      console.error(`   ❌ エラー: ${error.message}`);
    }
  }

  // 5. サマリー
  console.log('\n' + '='.repeat(60));
  console.log('📊 検証結果サマリー');
  console.log('='.repeat(60));
  console.log(`総違反数: ${totalViolations}`);
  console.log(`総推奨事項数: ${totalRecommendations}`);
  console.log(`検証した要求数: ${requirementIds.length}`);

  if (totalViolations === 0 && totalRecommendations === 0) {
    console.log('\n✅ すべての要求が妥当性基準を満たしています!');
  } else {
    console.log('\n⚠️  改善が推奨される要求があります。');
  }

  console.log('');
}

validateWatchProject().catch(console.error);
