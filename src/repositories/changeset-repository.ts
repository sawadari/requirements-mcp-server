/**
 * ChangeSetRepository - ChangeSetの永続化とライフサイクル管理
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import type { ChangeSet } from '../fix-engine/types.js';
import { createLogger } from '../common/logger.js';

const logger = createLogger('ChangeSetRepository');

export type ChangeSetStatus = 'proposed' | 'approved' | 'applied' | 'rolled_back';

export class ChangeSetRepository {
  private dataDir: string;
  private changesetsDir: string;

  constructor(dataDir: string = './data') {
    this.dataDir = dataDir;
    this.changesetsDir = path.join(dataDir, 'changesets');
  }

  /**
   * 初期化: ディレクトリを作成
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.changesetsDir, { recursive: true });
      logger.info('ChangeSetRepository initialized', { dir: this.changesetsDir });
    } catch (error: any) {
      logger.error('Failed to initialize ChangeSetRepository', { error: error.message });
      throw error;
    }
  }

  /**
   * ChangeSetを保存
   */
  async save(changeSet: ChangeSet): Promise<void> {
    try {
      const filePath = this.getFilePath(changeSet.id);
      await fs.writeFile(filePath, JSON.stringify(changeSet, null, 2), 'utf-8');
      logger.info('ChangeSet saved', { id: changeSet.id, status: changeSet.status });
    } catch (error: any) {
      logger.error('Failed to save ChangeSet', { id: changeSet.id, error: error.message });
      throw new Error(`Failed to save ChangeSet ${changeSet.id}: ${error.message}`);
    }
  }

  /**
   * ChangeSetをIDで取得
   */
  async findById(id: string): Promise<ChangeSet | null> {
    try {
      const filePath = this.getFilePath(id);
      const content = await fs.readFile(filePath, 'utf-8');
      const changeSet = JSON.parse(content) as ChangeSet;
      logger.debug('ChangeSet found', { id });
      return changeSet;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        logger.debug('ChangeSet not found', { id });
        return null;
      }
      logger.error('Failed to read ChangeSet', { id, error: error.message });
      throw new Error(`Failed to read ChangeSet ${id}: ${error.message}`);
    }
  }

  /**
   * すべてのChangeSetを取得
   */
  async findAll(): Promise<ChangeSet[]> {
    try {
      const files = await fs.readdir(this.changesetsDir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));

      const changeSets = await Promise.all(
        jsonFiles.map(async (file) => {
          const id = path.basename(file, '.json');
          return await this.findById(id);
        })
      );

      const validChangeSets = changeSets.filter((cs): cs is ChangeSet => cs !== null);
      logger.info('All ChangeSets retrieved', { count: validChangeSets.length });
      return validChangeSets;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        logger.debug('Changesets directory not found, returning empty array');
        return [];
      }
      logger.error('Failed to list ChangeSets', { error: error.message });
      throw new Error(`Failed to list ChangeSets: ${error.message}`);
    }
  }

  /**
   * ステータスでChangeSetを取得
   */
  async findByStatus(status: ChangeSetStatus): Promise<ChangeSet[]> {
    try {
      const allChangeSets = await this.findAll();
      const filtered = allChangeSets.filter(cs => cs.status === status);
      logger.info('ChangeSets filtered by status', { status, count: filtered.length });
      return filtered;
    } catch (error: any) {
      logger.error('Failed to filter ChangeSets by status', { status, error: error.message });
      throw new Error(`Failed to filter ChangeSets by status ${status}: ${error.message}`);
    }
  }

  /**
   * ChangeSetを削除
   */
  async delete(id: string): Promise<void> {
    try {
      const filePath = this.getFilePath(id);
      await fs.unlink(filePath);
      logger.info('ChangeSet deleted', { id });
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        logger.warn('ChangeSet not found for deletion', { id });
        return;
      }
      logger.error('Failed to delete ChangeSet', { id, error: error.message });
      throw new Error(`Failed to delete ChangeSet ${id}: ${error.message}`);
    }
  }

  /**
   * ChangeSetを更新
   */
  async update(id: string, updates: Partial<ChangeSet>): Promise<ChangeSet | null> {
    try {
      const existing = await this.findById(id);
      if (!existing) {
        logger.warn('ChangeSet not found for update', { id });
        return null;
      }

      const updated: ChangeSet = {
        ...existing,
        ...updates,
        id: existing.id, // IDは変更不可
      };

      await this.save(updated);
      logger.info('ChangeSet updated', { id, updates: Object.keys(updates) });
      return updated;
    } catch (error: any) {
      logger.error('Failed to update ChangeSet', { id, error: error.message });
      throw new Error(`Failed to update ChangeSet ${id}: ${error.message}`);
    }
  }

  /**
   * ファイルパスを取得
   */
  private getFilePath(id: string): string {
    return path.join(this.changesetsDir, `${id}.json`);
  }

  /**
   * 統計情報を取得
   */
  async getStatistics(): Promise<{
    total: number;
    byStatus: Record<ChangeSetStatus, number>;
  }> {
    try {
      const all = await this.findAll();
      const byStatus: Record<ChangeSetStatus, number> = {
        proposed: 0,
        approved: 0,
        applied: 0,
        rolled_back: 0,
      };

      all.forEach(cs => {
        if (cs.status in byStatus) {
          byStatus[cs.status as ChangeSetStatus]++;
        }
      });

      return {
        total: all.length,
        byStatus,
      };
    } catch (error: any) {
      logger.error('Failed to get statistics', { error: error.message });
      throw new Error(`Failed to get statistics: ${error.message}`);
    }
  }
}
