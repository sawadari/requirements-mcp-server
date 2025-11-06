#!/usr/bin/env tsx
/**
 * Cleanup Script - プロジェクトの一時ファイルと未使用ファイルを削除
 *
 * 使い方:
 *   npm run clean        - 安全なクリーンアップ（確認あり）
 *   npm run clean:force  - 強制クリーンアップ（確認なし）
 */

import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);

// ESモジュールで __dirname の代替
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CleanupTarget {
  pattern: string;
  description: string;
  safe: boolean; // true = 常に削除, false = 確認が必要
}

const CLEANUP_TARGETS: CleanupTarget[] = [
  // 一時ファイル
  { pattern: 'test-*.js', description: 'テストスクリプト（ルート）', safe: true },
  { pattern: 'test-*.json', description: 'テストJSON（ルート）', safe: true },
  { pattern: 'test-*.sh', description: 'テストシェルスクリプト（ルート）', safe: true },
  { pattern: 'server.log', description: 'サーバーログ', safe: true },
  { pattern: 'response.json', description: 'APIレスポンス（デバッグ用）', safe: true },
  { pattern: '*.tmp', description: '一時ファイル', safe: true },
  { pattern: '*.bak', description: 'バックアップファイル', safe: true },
  { pattern: '*~', description: 'エディタバックアップ', safe: true },
  { pattern: '.DS_Store', description: 'macOSシステムファイル', safe: true },
  { pattern: 'Thumbs.db', description: 'Windowsサムネイル', safe: true },

  // ビルド成果物（必要に応じて）
  { pattern: 'dist', description: 'ビルド出力（npm run buildで再生成）', safe: false },
  { pattern: 'build', description: 'ビルドシンボリックリンク', safe: false },
  { pattern: '*.tsbuildinfo', description: 'TypeScriptキャッシュ', safe: true },

  // ログファイル
  { pattern: 'data/logs/*.jsonl', description: '操作ログ', safe: false },
  { pattern: '*.log', description: 'ログファイル', safe: true },

  // キャッシュ
  { pattern: '.cache', description: 'キャッシュディレクトリ', safe: true },
  { pattern: 'node_modules/.cache', description: 'node_modulesキャッシュ', safe: true },
];

const ROOT_DIR = path.resolve(__dirname, '..');

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function findFiles(pattern: string): Promise<string[]> {
  const files: string[] = [];

  // ディレクトリの場合
  if (!pattern.includes('*') && !pattern.includes('.')) {
    const fullPath = path.join(ROOT_DIR, pattern);
    if (await fileExists(fullPath)) {
      files.push(fullPath);
    }
    return files;
  }

  // ファイルパターンの場合
  const dir = path.dirname(pattern);
  const filePattern = path.basename(pattern);
  const searchDir = dir === '.' ? ROOT_DIR : path.join(ROOT_DIR, dir);

  try {
    const entries = await fs.readdir(searchDir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(searchDir, entry.name);
      const relativePath = path.relative(ROOT_DIR, fullPath);

      // パターンマッチング
      const regex = new RegExp('^' + filePattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
      if (regex.test(entry.name)) {
        files.push(fullPath);
      }
    }
  } catch (error) {
    // ディレクトリが存在しない場合はスキップ
  }

  return files;
}

async function deleteFile(filePath: string): Promise<void> {
  const stats = await fs.stat(filePath);
  if (stats.isDirectory()) {
    await fs.rm(filePath, { recursive: true, force: true });
  } else {
    await fs.unlink(filePath);
  }
}

async function promptUser(message: string): Promise<boolean> {
  // Node.jsの標準入力（CI環境では自動的にfalseを返す）
  if (process.env.CI || !process.stdin.isTTY) {
    return false;
  }

  process.stdout.write(`${message} (y/N): `);

  return new Promise((resolve) => {
    process.stdin.once('data', (data) => {
      const answer = data.toString().trim().toLowerCase();
      resolve(answer === 'y' || answer === 'yes');
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes('--force') || args.includes('-f');
  const dryRun = args.includes('--dry-run') || args.includes('-d');

  console.log('🧹 プロジェクトクリーンアップ');
  console.log('================================\n');

  if (dryRun) {
    console.log('📋 ドライランモード: ファイルは削除されません\n');
  }

  const filesToDelete: { file: string; target: CleanupTarget }[] = [];

  // ファイルを収集
  for (const target of CLEANUP_TARGETS) {
    const files = await findFiles(target.pattern);
    for (const file of files) {
      filesToDelete.push({ file, target });
    }
  }

  if (filesToDelete.length === 0) {
    console.log('✨ クリーンアップ不要: 削除対象ファイルがありません\n');
    return;
  }

  console.log(`🔍 削除対象: ${filesToDelete.length}件のファイル/ディレクトリ\n`);

  // カテゴリ別に表示
  const safeFiles = filesToDelete.filter(f => f.target.safe);
  const unsafeFiles = filesToDelete.filter(f => !f.target.safe);

  if (safeFiles.length > 0) {
    console.log('✅ 安全に削除可能:');
    for (const { file, target } of safeFiles) {
      const relativePath = path.relative(ROOT_DIR, file);
      console.log(`  - ${relativePath} (${target.description})`);
    }
    console.log('');
  }

  if (unsafeFiles.length > 0) {
    console.log('⚠️  確認が必要:');
    for (const { file, target } of unsafeFiles) {
      const relativePath = path.relative(ROOT_DIR, file);
      console.log(`  - ${relativePath} (${target.description})`);
    }
    console.log('');
  }

  // 削除実行
  if (!dryRun) {
    let deleteCount = 0;

    // 安全なファイルは自動削除
    if (safeFiles.length > 0) {
      for (const { file } of safeFiles) {
        try {
          await deleteFile(file);
          deleteCount++;
        } catch (error) {
          const relativePath = path.relative(ROOT_DIR, file);
          console.error(`❌ 削除失敗: ${relativePath}`);
        }
      }
    }

    // 確認が必要なファイル
    if (unsafeFiles.length > 0) {
      if (force) {
        for (const { file } of unsafeFiles) {
          try {
            await deleteFile(file);
            deleteCount++;
          } catch (error) {
            const relativePath = path.relative(ROOT_DIR, file);
            console.error(`❌ 削除失敗: ${relativePath}`);
          }
        }
      } else {
        const shouldDelete = await promptUser('確認が必要なファイルも削除しますか？');
        if (shouldDelete) {
          for (const { file } of unsafeFiles) {
            try {
              await deleteFile(file);
              deleteCount++;
            } catch (error) {
              const relativePath = path.relative(ROOT_DIR, file);
              console.error(`❌ 削除失敗: ${relativePath}`);
            }
          }
        }
      }
    }

    console.log(`\n✨ クリーンアップ完了: ${deleteCount}件のファイル/ディレクトリを削除しました\n`);
  }

  // 追加のクリーンアップ提案
  console.log('💡 追加のクリーンアップコマンド:');
  console.log('  npm run clean:modules  - node_modulesを削除して再インストール');
  console.log('  npm run clean:cache    - npmキャッシュをクリア');
  console.log('  npm run clean:all      - 完全クリーンアップ\n');

  process.exit(0);
}

// エラーハンドリング
process.on('unhandledRejection', (error) => {
  console.error('❌ エラー:', error);
  process.exit(1);
});

main();
