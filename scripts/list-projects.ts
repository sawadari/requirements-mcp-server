#!/usr/bin/env tsx
/**
 * プロジェクト一覧表示スクリプト
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const DATA_DIR = './data';

interface ProjectMetadata {
  projectId: string;
  projectName: string;
  systemName?: string;
  description?: string;
  requirementCount: number;
  createdAt: string;
  updatedAt: string;
  version: string;
}

// プロジェクト一覧を取得
function listProjects(): ProjectMetadata[] {
  const files = readdirSync(DATA_DIR).filter(
    (f) => f.endsWith('.json') && f !== 'operation-logs.json' && f !== 'proposals.json'
  );

  const projects: ProjectMetadata[] = [];

  for (const file of files) {
    const filePath = join(DATA_DIR, file);
    try {
      const content = JSON.parse(readFileSync(filePath, 'utf-8'));
      const metadata = content._metadata;

      if (metadata && metadata.projectId) {
        projects.push({
          projectId: metadata.projectId,
          projectName: metadata.projectName || metadata.projectId,
          systemName: metadata.systemName,
          description: metadata.description,
          requirementCount: metadata.requirementCount || 0,
          createdAt: metadata.createdAt,
          updatedAt: metadata.updatedAt,
          version: metadata.version || '1.0.0',
        });
      }
    } catch (err) {
      // スキップ
    }
  }

  return projects.sort((a, b) => a.projectId.localeCompare(b.projectId));
}

// メイン処理
function main() {
  console.log('========================================');
  console.log('📁 プロジェクト一覧');
  console.log('========================================\n');

  const projects = listProjects();

  if (projects.length === 0) {
    console.log('プロジェクトが見つかりません');
    return;
  }

  console.log(`全 ${projects.length} プロジェクト\n`);

  projects.forEach((p, i) => {
    console.log(`${i + 1}. ${p.projectId}`);
    console.log(`   名前: ${p.projectName}`);
    if (p.systemName) {
      console.log(`   システム: ${p.systemName}`);
    }
    if (p.description) {
      console.log(`   説明: ${p.description}`);
    }
    console.log(`   要求数: ${p.requirementCount}件`);
    console.log(`   作成日: ${new Date(p.createdAt).toLocaleString('ja-JP')}`);
    console.log(`   更新日: ${new Date(p.updatedAt).toLocaleString('ja-JP')}`);
    console.log(`   バージョン: ${p.version}`);
    console.log('');
  });
}

main();
