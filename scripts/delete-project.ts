#!/usr/bin/env tsx
/**
 * プロジェクト削除スクリプト
 *
 * Usage:
 *   npm run delete-project <project-id>
 *   npm run delete-project  (対話モード)
 */

import { readFileSync, unlinkSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { createInterface } from 'readline';

const DATA_DIR = './data';
const DEFAULT_PROJECT = 'requirements';

interface ProjectMetadata {
  projectId: string;
  projectName: string;
  requirementCount: number;
}

// プロジェクト一覧を取得
function listProjects(): ProjectMetadata[] {
  const files = readdirSync(DATA_DIR).filter((f) => f.endsWith('.json') && f !== 'operation-logs.json' && f !== 'proposals.json');

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
          requirementCount: metadata.requirementCount || 0,
        });
      }
    } catch (err) {
      // スキップ
    }
  }

  return projects.sort((a, b) => a.projectId.localeCompare(b.projectId));
}

// プロジェクトを削除
function deleteProject(projectId: string): boolean {
  if (projectId === DEFAULT_PROJECT) {
    console.error(`❌ エラー: デフォルトプロジェクト「${DEFAULT_PROJECT}」は削除できません`);
    return false;
  }

  const filePath = join(DATA_DIR, `${projectId}.json`);

  if (!existsSync(filePath)) {
    console.error(`❌ エラー: プロジェクト「${projectId}」が見つかりません`);
    return false;
  }

  try {
    unlinkSync(filePath);
    console.log(`✅ プロジェクト「${projectId}」を削除しました`);
    return true;
  } catch (err) {
    console.error(`❌ エラー: 削除に失敗しました - ${err}`);
    return false;
  }
}

// 確認プロンプト
function confirm(question: string): Promise<boolean> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`${question} (y/N): `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
}

// 対話モード
async function interactiveMode() {
  const projects = listProjects();

  if (projects.length === 0) {
    console.log('プロジェクトが見つかりません');
    return;
  }

  console.log('\n📁 プロジェクト一覧:\n');
  projects.forEach((p, i) => {
    const isDefault = p.projectId === DEFAULT_PROJECT ? ' [デフォルト - 削除不可]' : '';
    console.log(`  ${i + 1}. ${p.projectId} - ${p.projectName} (${p.requirementCount}件)${isDefault}`);
  });

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('\n削除するプロジェクトの番号を入力してください (0: キャンセル): ', async (answer) => {
    rl.close();

    const num = parseInt(answer, 10);
    if (isNaN(num) || num === 0) {
      console.log('キャンセルしました');
      return;
    }

    if (num < 1 || num > projects.length) {
      console.error('❌ エラー: 無効な番号です');
      return;
    }

    const project = projects[num - 1];

    if (project.projectId === DEFAULT_PROJECT) {
      console.error(`❌ エラー: デフォルトプロジェクト「${DEFAULT_PROJECT}」は削除できません`);
      return;
    }

    console.log(`\n⚠️  削除対象: ${project.projectId} - ${project.projectName} (${project.requirementCount}件)`);
    const confirmed = await confirm('本当に削除しますか？');

    if (confirmed) {
      deleteProject(project.projectId);
    } else {
      console.log('キャンセルしました');
    }
  });
}

// メイン処理
async function main() {
  const args = process.argv.slice(2);

  console.log('========================================');
  console.log('🗑️  プロジェクト削除ツール');
  console.log('========================================\n');

  if (args.length === 0) {
    // 対話モード
    await interactiveMode();
  } else {
    // コマンドライン引数モード
    const projectId = args[0];

    if (projectId === DEFAULT_PROJECT) {
      console.error(`❌ エラー: デフォルトプロジェクト「${DEFAULT_PROJECT}」は削除できません`);
      process.exit(1);
    }

    console.log(`⚠️  削除対象: ${projectId}`);
    const confirmed = await confirm('本当に削除しますか？');

    if (confirmed) {
      const success = deleteProject(projectId);
      process.exit(success ? 0 : 1);
    } else {
      console.log('キャンセルしました');
      process.exit(0);
    }
  }
}

main().catch((err) => {
  console.error('❌ エラー:', err);
  process.exit(1);
});
