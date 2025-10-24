/**
 * 要求管理のストレージ層
 * シンプルなインメモリストレージとファイルベースの永続化
 */

import fs from 'fs/promises';
import path from 'path';
import { Requirement, ChangeProposal } from './types.js';
import { ValidationService } from './validation-service.js';
import { ProjectManager } from './project-manager.js';

export class RequirementsStorage {
  private requirements: Map<string, Requirement> = new Map();
  private proposals: Map<string, ChangeProposal> = new Map();
  private dataDir: string;
  private viewUpdateCallback?: () => Promise<void>;
  private validationService?: ValidationService;
  private projectManager: ProjectManager;

  constructor(dataDir: string = './data', projectId?: string) {
    this.dataDir = dataDir;
    this.projectManager = new ProjectManager(dataDir);

    // プロジェクトIDが指定されている場合は切り替え（非同期なのでinitializeで実行）
    if (projectId) {
      this.projectManager.switchProject(projectId).catch(error => {
        console.warn(`Failed to switch to project '${projectId}':`, error.message);
      });
    }
  }

  /**
   * ProjectManagerを取得
   */
  getProjectManager(): ProjectManager {
    return this.projectManager;
  }

  /**
   * ビュー自動更新のコールバックを設定
   */
  setViewUpdateCallback(callback: () => Promise<void>): void {
    this.viewUpdateCallback = callback;
  }

  /**
   * ValidationServiceを設定
   */
  setValidationService(service: ValidationService): void {
    this.validationService = service;
  }

  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.dataDir, { recursive: true });
      await this.load();

      // ValidationServiceを初期化
      if (!this.validationService) {
        this.validationService = new ValidationService();
        await this.validationService.initialize();
      }
    } catch (error) {
      console.error('Failed to initialize storage:', error);
      throw error;
    }
  }

  private async load(): Promise<void> {
    try {
      // 現在のプロジェクトのファイルパスを使用
      const reqPath = this.projectManager.getCurrentProjectFilePath();
      const propPath = path.join(this.dataDir, 'proposals.json');

      // Load requirements
      try {
        const reqData = await fs.readFile(reqPath, 'utf-8');
        const data = JSON.parse(reqData, (key, value) => {
          if (key === 'createdAt' || key === 'updatedAt') {
            return new Date(value);
          }
          return value;
        });

        // メタデータを除外して要求のみを読み込み
        const { _metadata, ...requirements } = data;
        this.requirements = new Map(Object.entries(requirements));
      } catch (error: any) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
        // File doesn't exist yet, that's fine
      }

      // Load proposals
      try {
        const propData = await fs.readFile(propPath, 'utf-8');
        const proposals = JSON.parse(propData, (key, value) => {
          if (key === 'createdAt') {
            return new Date(value);
          }
          return value;
        });
        this.proposals = new Map(Object.entries(proposals));
      } catch (error: any) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      throw error;
    }
  }

  private async save(): Promise<void> {
    try {
      // 現在のプロジェクトのファイルパスを使用
      const reqPath = this.projectManager.getCurrentProjectFilePath();
      const propPath = path.join(this.dataDir, 'proposals.json');

      const requirements = Object.fromEntries(this.requirements);
      const proposals = Object.fromEntries(this.proposals);

      // プロジェクトメタデータを読み込み & 更新
      let existingData: any = {};
      try {
        const existing = await fs.readFile(reqPath, 'utf-8');
        existingData = JSON.parse(existing);
      } catch (error: any) {
        // ファイルが存在しない場合は新規作成
      }

      // メタデータを更新
      const metadata = existingData._metadata || {};
      metadata.updatedAt = new Date().toISOString();
      metadata.requirementCount = this.requirements.size;

      // メタデータと要求データを結合
      const dataToSave = {
        _metadata: metadata,
        ...requirements
      };

      await fs.writeFile(reqPath, JSON.stringify(dataToSave, null, 2));
      await fs.writeFile(propPath, JSON.stringify(proposals, null, 2));

      // ビュー自動更新コールバックを呼び出し
      if (this.viewUpdateCallback) {
        try {
          await this.viewUpdateCallback();
        } catch (error) {
          console.error('Failed to update views:', error);
          // ビュー更新の失敗はデータ保存の失敗ではないので、エラーを throw しない
        }
      }
    } catch (error) {
      console.error('Failed to save data:', error);
      throw error;
    }
  }

  // Requirements CRUD operations
  async addRequirement(req: Requirement): Promise<Requirement> {
    this.requirements.set(req.id, req);

    // 自動検証・修正を実行
    if (this.validationService) {
      const result = await this.validationService.validateAndFix(
        req,
        this.requirements
      );

      // 修正が適用された場合、修正後の要求を使用
      if (result.fixResult?.applied) {
        this.requirements = result.modifiedRequirements;
        console.error(
          `[Storage] Auto-fix applied ${result.fixResult.changesApplied} changes for ${req.id}`
        );
      }
    }

    await this.save();
    return this.requirements.get(req.id) || req;
  }

  async getRequirement(id: string): Promise<Requirement | undefined> {
    return this.requirements.get(id);
  }

  async getAllRequirements(): Promise<Requirement[]> {
    return Array.from(this.requirements.values());
  }

  async updateRequirement(id: string, updates: Partial<Requirement>): Promise<Requirement | undefined> {
    const existing = this.requirements.get(id);
    if (!existing) {
      return undefined;
    }

    const updated = {
      ...existing,
      ...updates,
      id: existing.id, // ID should not be changed
      updatedAt: new Date(),
    };

    this.requirements.set(id, updated);

    // 自動検証・修正を実行
    if (this.validationService) {
      const result = await this.validationService.validateAndFix(
        updated,
        this.requirements
      );

      // 修正が適用された場合、修正後の要求を使用
      if (result.fixResult?.applied) {
        this.requirements = result.modifiedRequirements;
        console.error(
          `[Storage] Auto-fix applied ${result.fixResult.changesApplied} changes for ${id}`
        );
      }
    }

    await this.save();
    return this.requirements.get(id);
  }

  async deleteRequirement(id: string): Promise<boolean> {
    const deleted = this.requirements.delete(id);
    if (deleted) {
      await this.save();
    }
    return deleted;
  }

  async searchRequirements(query: {
    status?: string;
    priority?: string;
    category?: string;
    tags?: string[];
    searchText?: string;
  }): Promise<Requirement[]> {
    let results = Array.from(this.requirements.values());

    if (query.status) {
      results = results.filter((r) => r.status === query.status);
    }

    if (query.priority) {
      results = results.filter((r) => r.priority === query.priority);
    }

    if (query.category) {
      results = results.filter((r) => r.category === query.category);
    }

    if (query.tags && query.tags.length > 0) {
      results = results.filter((r) =>
        query.tags!.some((tag) => r.tags.includes(tag))
      );
    }

    if (query.searchText) {
      const searchLower = query.searchText.toLowerCase();
      results = results.filter(
        (r) =>
          r.title.toLowerCase().includes(searchLower) ||
          r.description.toLowerCase().includes(searchLower)
      );
    }

    return results;
  }

  // Dependency management
  async getDependencies(id: string): Promise<Requirement[]> {
    const req = this.requirements.get(id);
    if (!req) {
      return [];
    }

    return req.dependencies
      .map((depId) => this.requirements.get(depId))
      .filter((r): r is Requirement => r !== undefined);
  }

  async getDependents(id: string): Promise<Requirement[]> {
    return Array.from(this.requirements.values()).filter((r) =>
      r.dependencies.includes(id)
    );
  }

  // Change Proposals
  async addProposal(proposal: ChangeProposal): Promise<ChangeProposal> {
    this.proposals.set(proposal.id, proposal);
    await this.save();
    return proposal;
  }

  async getProposal(id: string): Promise<ChangeProposal | undefined> {
    return this.proposals.get(id);
  }

  async getProposalsForRequirement(reqId: string): Promise<ChangeProposal[]> {
    return Array.from(this.proposals.values()).filter(
      (p) => p.targetRequirementId === reqId
    );
  }

  async updateProposal(id: string, updates: Partial<ChangeProposal>): Promise<ChangeProposal | undefined> {
    const existing = this.proposals.get(id);
    if (!existing) {
      return undefined;
    }

    const updated = {
      ...existing,
      ...updates,
      id: existing.id,
    };

    this.proposals.set(id, updated);
    await this.save();
    return updated;
  }
}
