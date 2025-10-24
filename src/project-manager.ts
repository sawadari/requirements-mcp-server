/**
 * ProjectManager - 複数プロジェクトの管理
 */

import fs from 'fs/promises';
import path from 'path';
import { createLogger } from './common/logger.js';

const logger = createLogger('ProjectManager');

export interface ProjectMetadata {
  projectName: string;
  projectId: string;
  systemName?: string; // 対象システムの名称（例: 自動搬送車）
  description?: string;
  createdAt: string;
  updatedAt: string;
  version: string;
  requirementCount: number;
}

export interface ProjectInfo extends ProjectMetadata {
  filePath: string;
  isCurrent: boolean;
}

export interface ProjectConfig {
  projectId: string;
  projectName: string;
  systemName?: string; // 対象システムの名称
  description?: string;
  copyFrom?: string; // 既存プロジェクトからコピー
}

export interface ProjectFile {
  _metadata?: ProjectMetadata;
  [key: string]: any; // 要求データ
}

const DEFAULT_PROJECT_ID = 'requirements';

export class ProjectManager {
  private dataDir: string;
  private currentProjectId: string = DEFAULT_PROJECT_ID;
  private projectCache: Map<string, ProjectInfo> = new Map();

  constructor(dataDir: string = './data') {
    this.dataDir = dataDir;
    logger.info('ProjectManager initialized', { dataDir });
  }

  /**
   * プロジェクト一覧を取得
   */
  async listProjects(): Promise<ProjectInfo[]> {
    logger.info('Listing projects');

    try {
      // dataディレクトリ内の.jsonファイルを探す
      const files = await fs.readdir(this.dataDir);
      const jsonFiles = files.filter(f => f.endsWith('.json'));

      const projects: ProjectInfo[] = [];

      for (const file of jsonFiles) {
        const projectId = this.fileNameToProjectId(file);
        const filePath = path.join(this.dataDir, file);

        try {
          const info = await this.loadProjectInfo(projectId, filePath);
          projects.push({
            ...info,
            filePath,
            isCurrent: projectId === this.currentProjectId
          });
        } catch (error: any) {
          logger.warn('Failed to load project', { file, error: error.message });
        }
      }

      // デフォルトプロジェクトがない場合は作成
      if (projects.length === 0) {
        logger.info('No projects found, creating default project');
        await this.createDefaultProject();
        return this.listProjects();
      }

      logger.info('Projects listed', { count: projects.length });
      return projects.sort((a, b) => {
        // デフォルトプロジェクトを最初に
        if (a.projectId === DEFAULT_PROJECT_ID) return -1;
        if (b.projectId === DEFAULT_PROJECT_ID) return 1;
        return a.projectName.localeCompare(b.projectName);
      });
    } catch (error: any) {
      logger.error('Failed to list projects', error);
      throw new Error(`Failed to list projects: ${error.message}`);
    }
  }

  /**
   * 現在のプロジェクト情報を取得
   */
  async getCurrentProject(): Promise<ProjectInfo> {
    const filePath = this.getCurrentProjectFilePath();
    const info = await this.loadProjectInfo(this.currentProjectId, filePath);

    return {
      ...info,
      filePath,
      isCurrent: true
    };
  }

  /**
   * プロジェクトを切り替え
   */
  async switchProject(projectId: string): Promise<ProjectInfo> {
    logger.info('Switching project', { from: this.currentProjectId, to: projectId });

    // プロジェクトの存在確認
    const projects = await this.listProjects();
    const targetProject = projects.find(p => p.projectId === projectId);

    if (!targetProject) {
      const availableIds = projects.map(p => p.projectId);
      throw new Error(
        `Project '${projectId}' not found. Available projects: ${availableIds.join(', ')}`
      );
    }

    this.currentProjectId = projectId;
    logger.info('Project switched', { projectId, projectName: targetProject.projectName });

    return this.getCurrentProject();
  }

  /**
   * 新規プロジェクトを作成
   */
  async createProject(config: ProjectConfig): Promise<ProjectInfo> {
    logger.info('Creating project', config);

    // プロジェクトIDのバリデーション
    if (!this.isValidProjectId(config.projectId)) {
      throw new Error(
        `Invalid project ID: '${config.projectId}'. Must match [a-z0-9-]+`
      );
    }

    // 既存プロジェクトとの重複チェック
    const projects = await this.listProjects();
    if (projects.some(p => p.projectId === config.projectId)) {
      throw new Error(`Project '${config.projectId}' already exists`);
    }

    const filePath = this.getProjectFilePath(config.projectId);

    // コピー元がある場合
    let initialData: any = {};
    if (config.copyFrom) {
      const sourceFilePath = this.getProjectFilePath(config.copyFrom);
      try {
        const sourceData = await this.loadProjectFile(sourceFilePath);
        // メタデータを除いてコピー
        const { _metadata, ...requirements } = sourceData;
        initialData = requirements;
        logger.info('Copied requirements from source project', {
          from: config.copyFrom,
          count: Object.keys(requirements).length
        });
      } catch (error: any) {
        logger.warn('Failed to copy from source project', {
          copyFrom: config.copyFrom,
          error: error.message
        });
      }
    }

    // メタデータ作成
    const metadata: ProjectMetadata = {
      projectName: config.projectName,
      projectId: config.projectId,
      systemName: config.systemName,
      description: config.description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '1.0.0',
      requirementCount: Object.keys(initialData).length
    };

    // ファイル作成
    const projectFile: ProjectFile = {
      _metadata: metadata,
      ...initialData
    };

    await fs.writeFile(filePath, JSON.stringify(projectFile, null, 2), 'utf-8');

    logger.info('Project created', {
      projectId: config.projectId,
      filePath,
      requirementCount: metadata.requirementCount
    });

    return {
      ...metadata,
      filePath,
      isCurrent: false
    };
  }

  /**
   * プロジェクトを削除
   */
  async deleteProject(projectId: string): Promise<void> {
    logger.info('Deleting project', { projectId });

    // デフォルトプロジェクトは削除不可
    if (projectId === DEFAULT_PROJECT_ID) {
      throw new Error(`Cannot delete default project '${DEFAULT_PROJECT_ID}'`);
    }

    // プロジェクトの存在確認
    const projects = await this.listProjects();
    const targetProject = projects.find(p => p.projectId === projectId);

    if (!targetProject) {
      throw new Error(`Project '${projectId}' not found`);
    }

    // 現在のプロジェクトを削除しようとしている場合
    if (projectId === this.currentProjectId) {
      logger.info('Switching to default project before deletion');
      await this.switchProject(DEFAULT_PROJECT_ID);
    }

    // ファイル削除
    const filePath = this.getProjectFilePath(projectId);
    await fs.unlink(filePath);

    // キャッシュクリア
    this.projectCache.delete(projectId);

    logger.info('Project deleted', { projectId, filePath });
  }

  /**
   * 現在のプロジェクトのファイルパスを取得
   */
  getCurrentProjectFilePath(): string {
    return this.getProjectFilePath(this.currentProjectId);
  }

  /**
   * プロジェクトIDからファイルパスを取得
   */
  getProjectFilePath(projectId: string): string {
    const fileName = this.projectIdToFileName(projectId);
    return path.join(this.dataDir, fileName);
  }

  /**
   * プロジェクトIDの現在値を取得
   */
  getCurrentProjectId(): string {
    return this.currentProjectId;
  }

  // ========== Private Methods ==========

  /**
   * プロジェクト情報を読み込み
   */
  private async loadProjectInfo(projectId: string, filePath: string): Promise<ProjectMetadata> {
    const data = await this.loadProjectFile(filePath);

    // メタデータがある場合はそれを使用
    if (data._metadata) {
      return data._metadata;
    }

    // メタデータがない場合は自動生成（後方互換性）
    const requirements = Object.keys(data).filter(k => k !== '_metadata');
    const stats = await fs.stat(filePath);

    return {
      projectName: this.projectIdToName(projectId),
      projectId,
      createdAt: stats.birthtime.toISOString(),
      updatedAt: stats.mtime.toISOString(),
      version: '1.0.0',
      requirementCount: requirements.length
    };
  }

  /**
   * プロジェクトファイルを読み込み
   */
  private async loadProjectFile(filePath: string): Promise<ProjectFile> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        throw new Error(`Project file not found: ${filePath}`);
      }
      throw new Error(`Failed to load project file: ${error.message}`);
    }
  }

  /**
   * デフォルトプロジェクトを作成
   */
  private async createDefaultProject(): Promise<void> {
    const filePath = this.getProjectFilePath(DEFAULT_PROJECT_ID);

    const metadata: ProjectMetadata = {
      projectName: 'Default Project',
      projectId: DEFAULT_PROJECT_ID,
      systemName: '自動搬送車',
      description: 'デフォルトの要求管理プロジェクト',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '1.0.0',
      requirementCount: 0
    };

    const projectFile: ProjectFile = {
      _metadata: metadata
    };

    await fs.mkdir(this.dataDir, { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(projectFile, null, 2), 'utf-8');

    logger.info('Default project created', { filePath });
  }

  /**
   * プロジェクトIDのバリデーション
   */
  private isValidProjectId(projectId: string): boolean {
    return /^[a-z0-9-]+$/.test(projectId);
  }

  /**
   * プロジェクトIDをファイル名に変換
   */
  private projectIdToFileName(projectId: string): string {
    return `${projectId}.json`;
  }

  /**
   * ファイル名をプロジェクトIDに変換
   */
  private fileNameToProjectId(fileName: string): string {
    return fileName.replace(/\.json$/, '');
  }

  /**
   * プロジェクトIDをプロジェクト名に変換（デフォルト）
   */
  private projectIdToName(projectId: string): string {
    if (projectId === DEFAULT_PROJECT_ID) {
      return 'Default Project';
    }

    // ハイフンをスペースに、各単語の先頭を大文字に
    return projectId
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
