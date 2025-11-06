#!/usr/bin/env tsx
/**
 * 修正エンジンの使い方 - シンプルな例
 */

import * as fs from 'fs';
import { loadPolicy, FixExecutor, FixPlanner, ChangeEngine, type Requirement, type ReqID } from '../src/fix-engine/index.js';

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('    修正エンジンの使い方');
  console.log('═══════════════════════════════════════════════════════\n');

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ステップ1: ポリシーのロード
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('【ステップ1】ポリシーのロード\n');

  const policy = loadPolicy();
  console.log(`✓ ポリシー: ${policy.policy}`);
  console.log(`✓ ルール数: ${policy.rules.length}件`);
  console.log(`✓ 最大反復: ${policy.stopping.max_iterations}回\n`);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ステップ2: 要求データの準備
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('【ステップ2】要求データの準備\n');

  // 実際のrequirements.jsonをロード
  const rawData = JSON.parse(fs.readFileSync('./data/requirements.json', 'utf-8'));
  const requirements: Record<ReqID, Requirement> = {};

  Object.entries(rawData).forEach(([id, req]: [string, any]) => {
    requirements[id] = req;
  });

  console.log(`✓ ロードされた要求: ${Object.keys(requirements).length}件\n`);

  // サンプルで3件だけ取り出して表示
  const sampleIds = Object.keys(requirements).slice(0, 3);
  console.log('サンプル要求:');
  sampleIds.forEach(id => {
    const req = requirements[id];
    console.log(`  ${id}: ${req.title}`);
    console.log(`    → ${req.description.substring(0, 50)}...`);
  });
  console.log('');

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ステップ3: 違反の検出（簡易版）
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('【ステップ3】違反の検出\n');

  const violations: any[] = [];

  Object.values(requirements).slice(0, 10).forEach(req => {
    // 単一性チェック（簡易）
    if (req.description.includes('、') && req.description.split('、').length > 2) {
      violations.push({
        code: 'atomicity.low',
        reqId: req.id,
        message: '単一性が低い：複数の関心事が含まれています',
        confidence: 0.8
      });
    }

    // 主語チェック（E3）
    if (!req.description.match(/^システムは|^.*は.*する|^.*が/)) {
      violations.push({
        code: 'E3',
        reqId: req.id,
        message: '主語が欠落しています',
        confidence: 0.9
      });
    }

    // 曖昧表現チェック（E1）
    if (req.description.match(/適切に|など|必要に応じて/)) {
      violations.push({
        code: 'E1',
        reqId: req.id,
        message: '曖昧な表現が含まれています',
        confidence: 0.85
      });
    }
  });

  console.log(`✓ 検出された違反: ${violations.length}件\n`);
  violations.forEach((v, idx) => {
    console.log(`  ${idx + 1}. [${v.code}] ${v.reqId}: ${v.message}`);
  });
  console.log('');

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ステップ4: 修正プランの生成
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('【ステップ4】修正プランの生成\n');

  const planner = new FixPlanner(policy);
  const plan = await planner.planFixes(violations, requirements);

  console.log(`✓ 生成されたChangeSet: ${plan.changeSets.length}件`);
  console.log(`✓ 変更総数: ${plan.totalChanges}件`);
  console.log(`✓ 影響要求数: ${plan.estimatedImpact.requirementsAffected}件`);
  console.log(`✓ 新規要求: ${plan.estimatedImpact.newRequirements}件`);
  console.log(`✓ 修正要求: ${plan.estimatedImpact.modifiedRequirements}件\n`);

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ステップ5: プレビューの表示
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('【ステップ5】プレビューの表示\n');

  const engine = new ChangeEngine();

  if (plan.changeSets.length > 0) {
    console.log('━━━ 最初の2件のプレビュー ━━━\n');
    plan.changeSets.slice(0, 2).forEach((cs, idx) => {
      console.log(`\n【ChangeSet ${idx + 1}: ${cs.id}】`);
      console.log(engine.preview(cs, requirements));
    });
  } else {
    console.log('ℹ️  生成された修正プランがありません\n');
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // ステップ6: 特定のChangeSetを適用（デモ）
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('\n【ステップ6】特定のChangeSetを適用（デモ）\n');

  if (plan.changeSets.length > 0) {
    const executor = new FixExecutor(policy);
    const firstChangeSet = plan.changeSets[0];

    console.log(`適用対象: ${firstChangeSet.id}`);
    console.log(`対応違反: ${firstChangeSet.violations.join(', ')}`);
    console.log(`変更数: ${firstChangeSet.changes.length}件\n`);

    console.log('⚠️  実際には適用しません（デモモード）\n');
    console.log('実際に適用する場合:');
    console.log('const result = await executor.applySelected(');
    console.log('  [firstChangeSet.id],');
    console.log('  requirements,');
    console.log('  plan.changeSets');
    console.log(');\n');
  }

  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // 使い方のまとめ
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  console.log('═══════════════════════════════════════════════════════');
  console.log('    使い方のまとめ');
  console.log('═══════════════════════════════════════════════════════\n');

  console.log('【基本フロー】');
  console.log('1. loadPolicy()          - ポリシーをロード');
  console.log('2. 要求データを準備       - JSONから読み込み');
  console.log('3. 違反を検出            - 検証エンジンで違反を取得');
  console.log('4. FixPlanner.planFixes() - 修正プランを生成');
  console.log('5. ChangeEngine.preview() - プレビューで確認');
  console.log('6. FixExecutor.applySelected() - 承認後に適用\n');

  console.log('【3つの適用モード】');
  console.log('• プレビューのみ: previewFixes(reqs, validate)');
  console.log('• 選択適用: applySelected([id1, id2], reqs, changeSets)');
  console.log('• 自動ループ: execute(reqs, validate) ※Strictのみ\n');

  console.log('【ロールバック】');
  console.log('• rollbackAll(changeSets, reqs) - 全て取り消し\n');

  console.log('【ポリシー設定】');
  console.log('• config/fix-policy.jsonc を編集してルールをカスタマイズ');
  console.log('• Strict（自動）とSuggest（承認必要）を区別');
  console.log('• 優先度・ガード条件・アクションを設定\n');

  console.log('═══════════════════════════════════════════════════════\n');
  console.log('詳細は FIX-ENGINE-README.md を参照してください。\n');
}

main().catch(console.error);
