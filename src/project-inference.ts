/**
 * プロジェクト推論ユーティリティ
 * 自然言語クエリからプロジェクトを推論する
 *
 * @see docs/GLOSSARY.md - プロジェクト (Project)
 */

import type { ProjectInfo } from './project-manager.js';

export interface ProjectInferenceResult {
  /** マッチしたか */
  matched: boolean;
  /** 推論されたプロジェクトID */
  projectId?: string;
  /** 信頼度 */
  confidence?: 'exact' | 'partial' | 'fuzzy';
  /** 候補 (複数マッチ時) */
  candidates: ProjectInfo[];
  /** エラーメッセージ */
  error?: string;
}

/**
 * 自然言語クエリからプロジェクトを推論する
 *
 * @param query - ユーザーの入力 (例: "エアコン", "aircon", "air")
 * @param projects - プロジェクト一覧
 * @returns 推論結果
 *
 * @example
 * ```typescript
 * const result = inferProjectFromQuery('エアコン', projects);
 * if (result.matched) {
 *   console.log(`Matched project: ${result.projectId}`);
 * }
 * ```
 */
export function inferProjectFromQuery(
  query: string,
  projects: ProjectInfo[]
): ProjectInferenceResult {
  // 空文字チェック
  if (!query || query.trim() === '') {
    return {
      matched: false,
      candidates: [],
      error: 'Query is empty',
    };
  }

  // プロジェクトリストが空
  if (projects.length === 0) {
    return {
      matched: false,
      candidates: [],
      error: 'No projects available',
    };
  }

  const normalizedQuery = query.trim().toLowerCase();

  // 1. 完全一致 (プロジェクトID)
  const exactIdMatch = projects.find(
    (p) => p.projectId.toLowerCase() === normalizedQuery
  );
  if (exactIdMatch) {
    return {
      matched: true,
      projectId: exactIdMatch.projectId,
      confidence: 'exact',
      candidates: [],
    };
  }

  // 2. 完全一致 (プロジェクト名)
  const exactNameMatch = projects.find(
    (p) => p.projectName.toLowerCase() === normalizedQuery
  );
  if (exactNameMatch) {
    return {
      matched: true,
      projectId: exactNameMatch.projectId,
      confidence: 'exact',
      candidates: [],
    };
  }

  // 3. 部分一致
  const partialMatches = projects.filter(
    (p) =>
      p.projectName.toLowerCase().includes(normalizedQuery) ||
      p.projectId.toLowerCase().includes(normalizedQuery)
  );

  if (partialMatches.length === 1) {
    return {
      matched: true,
      projectId: partialMatches[0].projectId,
      confidence: 'partial',
      candidates: [],
    };
  }

  if (partialMatches.length > 1) {
    return {
      matched: false,
      candidates: partialMatches,
      error: 'Multiple projects matched',
    };
  }

  // 4. 該当なし
  return {
    matched: false,
    candidates: [],
    error: 'No matching project found',
  };
}
