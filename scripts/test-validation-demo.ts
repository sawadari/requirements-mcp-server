#!/usr/bin/env tsx

/**
 * 検証機能のデモンストレーション
 * 様々な違反パターンを持つテスト要求を作成し、検証を実行
 */

import { RequirementsStorage } from '../src/storage.js';
import { ValidationEngine } from '../src/validation/validation-engine.js';
import type { Requirement } from '../src/types.js';

async function main() {
  console.log('=== 検証機能デモンストレーション ===\n');

  // ストレージとエンジンの初期化
  const storage = new RequirementsStorage('./data');
  await storage.initialize();

  const engine = await ValidationEngine.create();
  console.log('✓ ValidationEngine initialized\n');

  // テストデータの作成
  console.log('📝 テストデータを作成中...\n');

  const testRequirements: Partial<Requirement>[] = [
    {
      title: 'ユーザー管理システム',
      description: 'ユーザーの登録、編集、削除を行う。また、権限管理も実装する。必要に応じて適切に処理する。',
      priority: 'high',
      category: 'system',
      type: 'stakeholder',
      tags: ['ユーザー', '管理'],
      dependencies: [],
    },
    {
      title: 'データ処理',
      description: 'データが処理される。適切に検証される。など',
      priority: 'medium',
      category: 'system',
      type: 'system',
      tags: [],
      dependencies: [],
    },
    {
      title: 'ユーザー登録API実装',
      description: 'POST /api/users エンドポイントを実装する。リクエストボディでユーザー情報を受け取り、データベースに保存し、HTTPステータスコード201を返す。',
      priority: 'high',
      category: 'system',
      type: 'system',
      tags: ['API', '実装'],
      dependencies: [],
    },
  ];

  // 要求を追加
  const addedRequirements: Requirement[] = [];
  for (const reqData of testRequirements) {
    const req: Requirement = {
      id: `REQ-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      title: reqData.title!,
      description: reqData.description!,
      status: 'draft',
      priority: reqData.priority as any,
      category: reqData.category!,
      type: reqData.type,
      tags: reqData.tags || [],
      dependencies: reqData.dependencies || [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    await storage.addRequirement(req);
    addedRequirements.push(req);
    console.log(`✓ 追加: ${req.id} - ${req.title}`);
  }

  console.log('\n📊 検証を実行中...\n');

  // すべての要求を取得
  const allRequirements = await storage.getAllRequirements();
  const requirementsMap = new Map(allRequirements.map(r => [r.id, r]));

  // 全要求を検証
  const results = await engine.validateAll(requirementsMap, {
    useLLM: false,
    updateMetrics: true,
  });

  console.log('✓ 検証完了\n');

  // サマリーの表示
  const totalRequirements = results.size;
  const passedRequirements = Array.from(results.values()).filter(r => r.passed).length;
  const totalViolations = Array.from(results.values()).reduce(
    (sum, r) => sum + r.violations.length,
    0
  );

  console.log('=== 検証サマリー ===\n');
  console.log(`総要求数: ${totalRequirements}`);
  console.log(`合格: ${passedRequirements} (${((passedRequirements / totalRequirements) * 100).toFixed(1)}%)`);
  console.log(`総違反数: ${totalViolations}\n`);

  // 違反の詳細表示
  console.log('=== 検出された違反 ===\n');

  for (const [reqId, result] of results) {
    const req = requirementsMap.get(reqId);
    if (!req || result.passed) continue;

    console.log(`\n📌 ${req.title} (${req.id})`);
    console.log(`   スコア: ${result.score}/100`);
    console.log(`   違反数: ${result.violations.length}件`);

    const errors = result.violations.filter(v => v.severity === 'error');
    const warnings = result.violations.filter(v => v.severity === 'warning');
    const infos = result.violations.filter(v => v.severity === 'info');

    if (errors.length > 0) {
      console.log(`\n   ❌ エラー (${errors.length}件):`);
      for (const v of errors) {
        console.log(`      [${v.ruleId}] ${v.message}`);
        if (v.suggestedFix) {
          console.log(`      💡 ${v.suggestedFix}`);
        }
      }
    }

    if (warnings.length > 0) {
      console.log(`\n   ⚠️  警告 (${warnings.length}件):`);
      for (const v of warnings) {
        console.log(`      [${v.ruleId}] ${v.message}`);
        if (v.suggestedFix) {
          console.log(`      💡 ${v.suggestedFix}`);
        }
      }
    }

    if (infos.length > 0) {
      console.log(`\n   ℹ️  情報 (${infos.length}件):`);
      for (const v of infos) {
        console.log(`      [${v.ruleId}] ${v.message}`);
      }
    }

    // NLP指標の表示
    if (req.length_tokens !== undefined) {
      console.log(`\n   📊 NLP指標:`);
      console.log(`      トークン数: ${req.length_tokens}`);
      console.log(`      抽象度スコア: ${req.abstraction_score?.toFixed(2) || 'N/A'}`);
      console.log(`      単一性スコア: ${req.atomicity_score?.toFixed(2) || 'N/A'}`);
    }
  }

  // レポート生成
  console.log('\n\n=== Markdownレポート ===\n');
  const report = engine.generateReport(results, requirementsMap);
  console.log(report);

  console.log('\n✅ デモンストレーション完了');
  console.log('\n詳細なテストガイドは test-validation.md を参照してください。');
}

main().catch(error => {
  console.error('エラーが発生しました:', error);
  process.exit(1);
});
