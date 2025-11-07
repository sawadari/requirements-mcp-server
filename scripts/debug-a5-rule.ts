#!/usr/bin/env tsx
/**
 * A5ルールのデバッグスクリプト
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function debugA5Rule() {
  console.log('=== A5ルール（子要求存在チェック）のデバッグ ===\n');

  // 1. オントロジースキーマを確認
  const ontologyPath = path.join(__dirname, '../config/ontology-schema.json');
  const ontology = JSON.parse(await fs.readFile(ontologyPath, 'utf-8'));

  console.log('1. オントロジースキーマ - stages:');
  ontology.stages.forEach((stage: any) => {
    console.log(`   ${stage.id}:`);
    console.log(`      canHaveChildren: ${stage.canHaveChildren}`);
    console.log(`      requiresChildren: ${stage.requiresChildren}`);
    console.log(`      childStages: ${JSON.stringify(stage.childStages)}`);
  });

  // 2. watch-projectを確認
  const watchPath = path.join(__dirname, '../data/watch-project.json');
  const watchData = JSON.parse(await fs.readFile(watchPath, 'utf-8'));
  const { _metadata, ...requirements } = watchData;

  console.log('\n2. watch-project - system要求とその子要求:');

  const systemReqs = Object.values(requirements).filter((r: any) => r.type === 'system');
  for (const req of systemReqs as any[]) {
    const children = Object.values(requirements).filter((r: any) =>
      r.refines && r.refines.includes(req.id)
    );
    console.log(`   ${req.id} (${req.title}):`);
    console.log(`      子要求数: ${children.length}`);
    if (children.length > 0) {
      children.forEach((child: any) => {
        console.log(`         - ${child.id} (${child.title})`);
      });
    } else {
      console.log(`         ⚠️  子要求なし - A5ルール違反のはず！`);
    }
  }

  console.log('\n3. A5ルールが検出すべき違反:');
  console.log('   - SYS-002 (GPS位置情報機能) → 子要求なし');
  console.log('   - SYS-003 (カレンダー表示機能) → 子要求なし');
}

debugA5Rule().catch(console.error);
