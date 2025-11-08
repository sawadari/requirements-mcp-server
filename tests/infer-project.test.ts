import { describe, it, expect, beforeEach } from 'vitest';
import { inferProjectFromQuery } from '../src/project-inference.js';

describe('inferProjectFromQuery', () => {
  describe('完全一致', () => {
    it('プロジェクトIDと完全一致する場合', () => {
      const projects = [
        { projectId: 'aircon', projectName: 'エアコンシステム', isCurrent: false, filePath: '', createdAt: '', updatedAt: '', version: '', requirementCount: 0 },
        { projectId: 'heater', projectName: '暖房システム', isCurrent: false, filePath: '', createdAt: '', updatedAt: '', version: '', requirementCount: 0 },
      ];

      const result = inferProjectFromQuery('aircon', projects);

      expect(result.matched).toBe(true);
      expect(result.projectId).toBe('aircon');
      expect(result.confidence).toBe('exact');
    });

    it('プロジェクト名と完全一致する場合', () => {
      const projects = [
        { projectId: 'aircon', projectName: 'エアコンシステム', isCurrent: false, filePath: '', createdAt: '', updatedAt: '', version: '', requirementCount: 0 },
      ];

      const result = inferProjectFromQuery('エアコンシステム', projects);

      expect(result.matched).toBe(true);
      expect(result.projectId).toBe('aircon');
      expect(result.confidence).toBe('exact');
    });
  });

  describe('部分一致', () => {
    it('プロジェクト名の一部と一致する場合', () => {
      const projects = [
        { projectId: 'aircon', projectName: 'エアコンシステム', isCurrent: false, filePath: '', createdAt: '', updatedAt: '', version: '', requirementCount: 0 },
      ];

      const result = inferProjectFromQuery('エアコン', projects);

      expect(result.matched).toBe(true);
      expect(result.projectId).toBe('aircon');
      expect(result.confidence).toBe('partial');
    });

    it('プロジェクトIDの一部と一致する場合', () => {
      const projects = [
        { projectId: 'smart-watch', projectName: 'スマートウォッチ', isCurrent: false, filePath: '', createdAt: '', updatedAt: '', version: '', requirementCount: 0 },
      ];

      const result = inferProjectFromQuery('watch', projects);

      expect(result.matched).toBe(true);
      expect(result.projectId).toBe('smart-watch');
      expect(result.confidence).toBe('partial');
    });
  });

  describe('複数候補', () => {
    it('複数のプロジェクトが一致する場合は候補を返す', () => {
      const projects = [
        { projectId: 'smart-watch', projectName: 'スマートウォッチ', isCurrent: false, filePath: '', createdAt: '', updatedAt: '', version: '', requirementCount: 0 },
        { projectId: 'smart-scale', projectName: 'スマート体重計', isCurrent: false, filePath: '', createdAt: '', updatedAt: '', version: '', requirementCount: 0 },
      ];

      const result = inferProjectFromQuery('smart', projects);

      expect(result.matched).toBe(false);
      expect(result.candidates).toHaveLength(2);
      expect(result.candidates).toContainEqual(expect.objectContaining({ projectId: 'smart-watch' }));
      expect(result.candidates).toContainEqual(expect.objectContaining({ projectId: 'smart-scale' }));
    });
  });

  describe('該当なし', () => {
    it('一致するプロジェクトがない場合', () => {
      const projects = [
        { projectId: 'aircon', projectName: 'エアコンシステム', isCurrent: false, filePath: '', createdAt: '', updatedAt: '', version: '', requirementCount: 0 },
      ];

      const result = inferProjectFromQuery('存在しないプロジェクト', projects);

      expect(result.matched).toBe(false);
      expect(result.projectId).toBeUndefined();
      expect(result.candidates).toHaveLength(0);
    });
  });

  describe('空文字・null処理', () => {
    it('空文字の場合は該当なし', () => {
      const projects = [
        { projectId: 'aircon', projectName: 'エアコンシステム', isCurrent: false, filePath: '', createdAt: '', updatedAt: '', version: '', requirementCount: 0 },
      ];

      const result = inferProjectFromQuery('', projects);

      expect(result.matched).toBe(false);
    });

    it('プロジェクトリストが空の場合', () => {
      const result = inferProjectFromQuery('aircon', []);

      expect(result.matched).toBe(false);
      expect(result.candidates).toHaveLength(0);
    });
  });
});
