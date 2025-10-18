/**
 * 特定要求の影響範囲を分析するスクリプト
 */

import { RequirementsStorage } from '../src/storage.js';
import { ImpactAnalyzer } from '../src/analyzer.js';

async function analyzeImpact(requirementId: string) {
  const storage = new RequirementsStorage('./data');
  await storage.initialize();

  const analyzer = new ImpactAnalyzer(storage);

  console.log('\n========================================');
  console.log(`影響範囲分析: ${requirementId}`);
  console.log('========================================\n');

  // 要求の基本情報を表示
  const requirement = await storage.getRequirement(requirementId);
  if (!requirement) {
    console.error(`❌ 要求 ${requirementId} が見つかりません`);
    return;
  }

  console.log('【対象要求】');
  console.log(`ID: ${requirement.id}`);
  console.log(`タイトル: ${requirement.title}`);
  console.log(`説明: ${requirement.description}`);
  console.log(`ステータス: ${requirement.status}`);
  console.log(`優先度: ${requirement.priority}`);
  console.log(`カテゴリ: ${requirement.category}\n`);

  // 影響範囲分析を実行
  const analysis = await analyzer.analyzeImpact(requirementId);

  console.log('========================================');
  console.log('影響を受ける要求');
  console.log('========================================\n');

  if (analysis.affectedRequirements.length === 0) {
    console.log('✓ この要求に依存する他の要求はありません\n');
  } else {
    // 直接依存
    const directDeps = analysis.affectedRequirements.filter(r => r.impactType === 'direct');
    if (directDeps.length > 0) {
      console.log(`【直接依存】 (${directDeps.length}件)`);
      for (const affected of directDeps) {
        console.log(`\n  ${affected.id}: ${affected.title}`);
        console.log(`  └─ ${affected.description}`);
      }
      console.log();
    }

    // 間接依存
    const indirectDeps = analysis.affectedRequirements.filter(r => r.impactType === 'indirect');
    if (indirectDeps.length > 0) {
      console.log(`【間接依存】 (${indirectDeps.length}件)`);
      for (const affected of indirectDeps) {
        console.log(`\n  ${affected.id}: ${affected.title}`);
        console.log(`  └─ ${affected.description}`);
      }
      console.log();
    }
  }

  console.log('========================================');
  console.log('分析結果');
  console.log('========================================\n');

  console.log(`推定工数: ${analysis.estimatedEffort}\n`);

  if (analysis.risks.length > 0) {
    console.log('【リスク】');
    for (const risk of analysis.risks) {
      console.log(`  ⚠️  ${risk}`);
    }
    console.log();
  }

  if (analysis.recommendations.length > 0) {
    console.log('【推奨事項】');
    for (const rec of analysis.recommendations) {
      console.log(`  💡 ${rec}`);
    }
    console.log();
  }

  // 依存関係グラフを取得
  console.log('========================================');
  console.log('依存関係グラフ');
  console.log('========================================\n');

  const graph = await analyzer.getDependencyGraph(requirementId);

  console.log(`ノード数: ${graph.nodes.length}件`);
  console.log(`エッジ数: ${graph.edges.length}件\n`);

  console.log('【ノード一覧】');
  for (const node of graph.nodes) {
    console.log(`  ${node.id}: ${node.title} [${node.status}]`);
  }

  console.log('\n【依存関係】');
  for (const edge of graph.edges) {
    console.log(`  ${edge.from} → ${edge.to}`);
  }

  console.log('\n');
}

// コマンドライン引数から要求IDを取得
const requirementId = process.argv[2] || 'STK-001';
analyzeImpact(requirementId).catch((error) => {
  console.error('エラーが発生しました:', error);
  process.exit(1);
});
