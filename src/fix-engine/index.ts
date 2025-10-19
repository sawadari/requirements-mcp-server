/**
 * 修正エンジン - エクスポートインデックス
 */

export * from './types.js';
export { ChangeEngine } from './change-engine.js';
export { FixPlanner } from './fix-planner.js';
export { FixExecutor } from './fix-executor.js';

// ポリシーローダー
import * as fs from 'fs';
import * as path from 'path';
import type { FixPolicy } from './types.js';

/**
 * fix-policy.jsoncをロード
 */
export function loadPolicy(policyPath?: string): FixPolicy {
  const defaultPath = path.join(process.cwd(), 'fix-policy.jsonc');
  const filePath = policyPath || defaultPath;

  if (!fs.existsSync(filePath)) {
    throw new Error(`ポリシーファイルが見つかりません: ${filePath}`);
  }

  // JSONCをパース（コメント除去）
  const content = fs.readFileSync(filePath, 'utf-8');
  const jsonContent = content.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

  return JSON.parse(jsonContent) as FixPolicy;
}
