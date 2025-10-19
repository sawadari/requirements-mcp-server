#!/usr/bin/env tsx
/**
 * 修正エンジンのデモンストレーション
 */

import * as fs from 'fs';
import { loadPolicy, FixExecutor, FixPlanner, type Requirement, type ReqID } from '../src/fix-engine/index.js';

async function main() {
  console.log('=== 修正エンジン デモンストレーション ===\n');

  // 1. ポリシーをロード
  console.log('📋 ポリシーをロード中...');
  const policy = loadPolicy();
  console.log(`  ポリシー: ${policy.policy}`);
  console.log(`  ルール数: ${policy.rules.length}件`);
  console.log(`  最大反復: ${policy.stopping.max_iterations}回\n`);

  // 2. サンプル要求を作成
  console.log('📝 サンプル要求を作成中...');
  const requirements: Record<ReqID, Requirement> = {
    'TEST-001': {
      id: 'TEST-001',
      title: 'テストケース1',
      description: 'データを登録し、検索し、削除する機能を提供すること',  // 単一性が低い
      status: 'draft',
      priority: 'high',
      category: 'システム要求',
      type: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    'TEST-002': {
      id: 'TEST-002',
      title: 'テストケース2',
      description: '主語なし：緊急時に停止する',  // E3違反（主語なし）
      status: 'draft',
      priority: 'high',
      category: 'システム要求',
      type: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    'TEST-003': {
      id: 'TEST-003',
      title: 'テストケース3',
      description: 'システムは適切にデータを処理すること',  // E1違反（曖昧）
      status: 'draft',
      priority: 'high',
      category: 'システム要求',
      type: 'system',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  };

  console.log(`  作成された要求: ${Object.keys(requirements).length}件\n`);

  // 3. 簡易的な検証関数（デモ用）
  async function validate(reqs: Record<ReqID, Requirement>): Promise<any[]> {
    const violations: any[] = [];

    Object.values(reqs).forEach(req => {
      // 単一性チェック（簡易）
      if (req.description.includes('、') || req.description.match(/し、|、|および/)) {
        violations.push({
          code: 'atomicity.low',
          ruleName: 'atomicity.low',
          reqId: req.id,
          message: '単一性が低い：複数の関心事が含まれています',
          confidence: 0.8
        });
      }

      // 主語チェック（E3）
      if (!req.description.match(/^(システムは|.*が)/)) {
        violations.push({
          code: 'E3',
          ruleName: 'E3',
          reqId: req.id,
          message: '主語が欠落しています',
          confidence: 0.9
        });
      }

      // 曖昧表現チェック（E1）
      if (req.description.match(/適切に|など|必要に応じて/)) {
        violations.push({
          code: 'E1',
          ruleName: 'E1',
          reqId: req.id,
          message: '曖昧な表現が含まれています',
          confidence: 0.85
        });
      }
    });

    return violations;
  }

  // 4. 初期検証
  console.log('🔍 初期検証を実行中...');
  const initialViolations = await validate(requirements);
  console.log(`  違反数: ${initialViolations.length}件\n`);
  initialViolations.forEach(v => {
    console.log(`  - [${v.code}] ${v.reqId}: ${v.message}`);
  });
  console.log('');

  // 5. 修正プランをプレビュー
  console.log('📊 修正プランを生成中...');
  const planner = new FixPlanner(policy);
  const plan = await planner.planFixes(initialViolations, requirements);

  console.log(`  ChangeSet数: ${plan.changeSets.length}件`);
  console.log(`  変更総数: ${plan.totalChanges}件`);
  console.log(`  影響要求数: ${plan.estimatedImpact.requirementsAffected}件`);
  console.log(`  新規要求: ${plan.estimatedImpact.newRequirements}件`);
  console.log(`  修正要求: ${plan.estimatedImpact.modifiedRequirements}件\n`);

  // 6. プレビューを表示
  console.log('=== 修正プレビュー ===\n');
  console.log(plan.preview);

  // 7. 修正を実行（自動適用可能なもののみ）
  console.log('\n=== 修正を実行 ===\n');
  const executor = new FixExecutor(policy);
  const result = await executor.execute(requirements, validate);

  console.log('\n=== 実行結果 ===\n');
  console.log(`成功: ${result.success ? '✅' : '❌'}`);
  console.log(`反復回数: ${result.iterations}回`);
  console.log(`停止理由: ${result.stoppedReason}`);
  console.log(`適用されたChangeSet: ${result.appliedChangeSets.length}件`);
  console.log(`修正された違反: ${result.fixedViolations.length}件`);
  console.log(`残存違反: ${result.newViolations.length}件\n`);

  if (result.fixedViolations.length > 0) {
    console.log('修正された違反:');
    result.fixedViolations.forEach(v => console.log(`  ✅ ${v}`));
    console.log('');
  }

  if (result.newViolations.length > 0) {
    console.log('残存違反（承認が必要）:');
    result.newViolations.forEach(v => console.log(`  ⚠️  [${v.code}] ${v.reqId}: ${v.message}`));
    console.log('');
  }

  // 8. 適用されたChangeSetsの詳細
  if (result.appliedChangeSets.length > 0) {
    console.log('=== 適用されたChangeSetの詳細 ===\n');
    result.appliedChangeSets.forEach((cs, idx) => {
      console.log(`${idx + 1}. ${cs.id}`);
      console.log(`   対応違反: ${cs.violations.join(', ')}`);
      console.log(`   変更数: ${cs.changes.length}件`);
      console.log(`   影響範囲: ${cs.impacted.length}件の要求\n`);
    });
  }

  console.log('=== デモ完了 ===\n');
}

main().catch(console.error);
