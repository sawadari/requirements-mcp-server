#!/usr/bin/env tsx
/**
 * MCPサーバーとWebビューアーを同時起動するスクリプト
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('========================================');
console.log('🚀 Requirements MCP Server + Web Viewer');
console.log('========================================\n');

// Webビューアーを起動
console.log('📊 Starting Web Viewer...');
const viewerProcess = spawn('npm', ['run', 'view-server'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
});

// Webビューアーの起動を少し待つ（2秒）
await new Promise((resolve) => setTimeout(resolve, 2000));

// MCPサーバーを起動
console.log('\n🔧 Starting MCP Server...');
const mcpProcess = spawn('tsx', ['src/index.ts'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: true,
});

// エラーハンドリング
viewerProcess.on('error', (err) => {
  console.error('❌ Web Viewer error:', err);
  process.exit(1);
});

mcpProcess.on('error', (err) => {
  console.error('❌ MCP Server error:', err);
  viewerProcess.kill();
  process.exit(1);
});

// 終了処理
process.on('SIGINT', () => {
  console.log('\n\n🛑 Shutting down...');
  viewerProcess.kill();
  mcpProcess.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n🛑 Shutting down...');
  viewerProcess.kill();
  mcpProcess.kill();
  process.exit(0);
});

// プロセスが終了した場合
viewerProcess.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`❌ Web Viewer exited with code ${code}`);
    mcpProcess.kill();
    process.exit(code);
  }
});

mcpProcess.on('exit', (code) => {
  if (code !== 0 && code !== null) {
    console.error(`❌ MCP Server exited with code ${code}`);
    viewerProcess.kill();
    process.exit(code);
  }
});
