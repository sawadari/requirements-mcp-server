#!/usr/bin/env tsx
/**
 * 修正エンジンの使い方の例
 * 実際のrequirements.jsonを使った実演
 */

import * as fs from 'fs';
import { loadPolicy, FixExecutor, FixPlanner, ChangeEngine, type Requirement, type ReqID } from '../src/fix-engine/index.js';
import { ValidationEngine } from '../src/validation/ValidationEngine.js';
import { RequirementStorage } from '../src/storage/RequirementStorage.js';

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('    修正エンジンの使い方 - 実践例');
  console.log('═══════════════════════════════════════════════════════\n');

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 例1: 修正プランのプレビュー（適用前に確認）
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('\n📋 例1: 修正プランのプレビュー\n');
  console.log('用途: 修正内容を事前に確認し、影響範囲を把握する\n');

  // 1-1. ポリシーをロード
  const policy = loadPolicy();
  console.log(`✓ ポリシーをロード: ${policy.policy}`);

  // 1-2. 要求データをロード
  const storage = new RequirementStorage('./data');
  await storage.initialize();
  const requirements = await storage.getAllRequirements();
  const reqsRecord: Record<ReqID, Requirement> = {};
  requirements.forEach(r => { reqsRecord[r.id] = r as any; });
  console.log(`✓ 要求データをロード: ${requirements.length}件\n`);

  // 1-3. 検証を実行
  const validator = new ValidationEngine(storage);
  const allViolations: any[] = [];

  for (const req of requirements) {
    const report = await validator.validate(req.id);
    report.results.forEach(result => {
      allViolations.push({
        code: result.ruleName,
        ruleName: result.ruleName,
        reqId: req.id,
        message: result.message,
        confidence: 0.8,
        severity: result.severity
      });
    });
  }

  console.log(`✓ 検証完了: ${allViolations.length}件の違反を検出\n`);

  // 違反の内訳を表示
  const violationCounts = new Map<string, number>();
  allViolations.forEach(v => {
    violationCounts.set(v.code, (violationCounts.get(v.code) || 0) + 1);
  });

  console.log('違反の内訳:');
  Array.from(violationCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([code, count]) => {
      console.log(`  ${code}: ${count}件`);
    });
  console.log('');

  // 1-4. 修正プランを生成
  const planner = new FixPlanner(policy);
  console.log('修正プランを生成中...');

  // 上位5件の違反のみを対象（デモ用）
  const topViolations = allViolations.slice(0, 5);
  const plan = await planner.planFixes(topViolations, reqsRecord);

  console.log(`\n✓ 修正プラン生成完了\n`);
  console.log(`  ChangeSet数: ${plan.changeSets.length}件`);
  console.log(`  変更総数: ${plan.totalChanges}件`);
  console.log(`  影響要求数: ${plan.estimatedImpact.requirementsAffected}件`);
  console.log(`  新規要求: ${plan.estimatedImpact.newRequirements}件`);
  console.log(`  修正要求: ${plan.estimatedImpact.modifiedRequirements}件\n`);

  // 1-5. プレビューを表示（最初の2件のみ）
  console.log('━━━ プレビュー（最初の2件）━━━\n');
  const engine = new ChangeEngine();
  plan.changeSets.slice(0, 2).forEach((cs, idx) => {
    console.log(`【ChangeSet ${idx + 1}】`);
    console.log(engine.preview(cs, reqsRecord));
    console.log('');
  });

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 例2: 特定のChangeSetのみを適用
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('\n📝 例2: 特定のChangeSetのみを適用\n');
  console.log('用途: プレビューを確認後、承認したChangeSetのみを適用\n');

  if (plan.changeSets.length > 0) {
    const executor = new FixExecutor(policy);
    const selectedIds = [plan.changeSets[0].id]; // 最初の1件のみ選択

    console.log(`承認されたChangeSet: ${selectedIds.join(', ')}\n`);
    console.log('適用中...');

    const result = await executor.applySelected(
      selectedIds,
      reqsRecord,
      plan.changeSets
    );

    console.log(`\n✓ 適用完了\n`);
    console.log(`  成功: ${result.success ? '✅' : '❌'}`);
    console.log(`  適用されたChangeSet: ${result.appliedChangeSets.length}件`);
    console.log(`  修正された違反: ${result.fixedViolations.length}件\n`);
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 例3: 自動修正ループの実行（Strictのみ）
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('\n🔄 例3: 自動修正ループの実行\n');
  console.log('用途: Strict違反を自動的に修正（循環依存など）\n');

  const executor = new FixExecutor(policy);

  // 簡易的な検証関数
  async function quickValidate(reqs: Record<ReqID, Requirement>): Promise<any[]> {
    const violations: any[] = [];
    // Strict違反のみを検出（デモ用: 実際は循環検出などを実装）
    return violations;
  }

  console.log('自動修正ループを開始...');
  const result = await executor.execute(reqsRecord, quickValidate);

  console.log(`\n✓ 自動修正完了\n`);
  console.log(`  成功: ${result.success ? '✅' : '❌'}`);
  console.log(`  反復回数: ${result.iterations}回`);
  console.log(`  停止理由: ${result.stoppedReason}`);
  console.log(`  適用されたChangeSet: ${result.appliedChangeSets.length}件`);
  console.log(`  修正された違反: ${result.fixedViolations.length}件`);
  console.log(`  残存違反: ${result.newViolations.length}件\n`);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 例4: 個別の修正操作（手動）
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('\n🛠️  例4: 個別の修正操作（手動）\n');
  console.log('用途: カスタムロジックで特定の修正を手動実行\n');

  // 例: FUNC-002の主語を追加
  if (reqsRecord['FUNC-002']) {
    const targetReq = reqsRecord['FUNC-002'];

    console.log(`対象要求: ${targetReq.id} - ${targetReq.title}`);
    console.log(`現在の記述: "${targetReq.description}"\n`);

    // Changeを手動で作成
    const manualChange = {
      op: 'rewrite' as const,
      target: 'FUNC-002',
      payload: {
        oldText: targetReq.description,
        newText: `システムは${targetReq.description}`
      },
      rationale: '主語を明示化（手動修正）',
      preview: [{
        type: 'modify' as const,
        reqId: 'FUNC-002',
        field: 'description',
        description: '主語を追加',
        oldValue: targetReq.description,
        newValue: `システムは${targetReq.description}`
      }]
    };

    // ChangeSetを作成
    const manualChangeSet = {
      id: `MANUAL-${Date.now()}`,
      createdAt: new Date().toISOString(),
      violations: ['E3'],
      changes: [manualChange],
      impacted: ['FUNC-002'],
      reversible: true,
      status: 'proposed' as const
    };

    console.log('プレビュー:');
    console.log(engine.preview(manualChangeSet, reqsRecord));
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 例5: ロールバック
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('\n⏮️  例5: ロールバック\n');
  console.log('用途: 適用した修正を取り消す\n');

  if (result.appliedChangeSets.length > 0) {
    console.log(`ロールバック対象: ${result.appliedChangeSets.length}件のChangeSet\n`);

    const rollbackResult = await executor.rollbackAll(
      result.appliedChangeSets,
      reqsRecord
    );

    console.log(`✓ ロールバック完了\n`);
    console.log(`  成功: ${rollbackResult.success ? '✅' : '❌'}`);
    console.log(`  エラー: ${rollbackResult.errors.length}件\n`);
  } else {
    console.log('ℹ️  適用されたChangeSetがないため、ロールバック不要\n');
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // まとめ
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('═══════════════════════════════════════════════════════');
  console.log('    使い方のまとめ');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('【基本的なワークフロー】');
  console.log('1. ポリシーをロード: loadPolicy()');
  console.log('2. 要求データをロード');
  console.log('3. 検証を実行して違反を取得');
  console.log('4. FixPlannerで修正プランを生成');
  console.log('5. プレビューで内容を確認');
  console.log('6. FixExecutorで適用（手動選択 or 自動）');
  console.log('7. 必要に応じてロールバック\n');

  console.log('【主要なクラス】');
  console.log('• FixPlanner  - 修正プランの生成');
  console.log('• FixExecutor - 修正の実行・ロールバック');
  console.log('• ChangeEngine - ChangeSetの適用・プレビュー\n');

  console.log('【ポリシー定義】');
  console.log('• fix-policy.jsonc でルールを定義');
  console.log('• Strict（自動適用）とSuggest（承認必要）を区別');
  console.log('• 優先度・ガード条件・アクションを設定\n');

  console.log('═══════════════════════════════════════════════════════\n');
}

main().catch(console.error);
