import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export interface ProjectMetadata {
  projectName: string;
  projectId: string;
  systemName?: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  version: string;
  requirementCount: number;
}

export interface ProjectInfo {
  fileName: string;
  filePath: string;
  metadata: ProjectMetadata;
}

export class ProjectManager {
  private dataDir: string;

  constructor(dataDir?: string) {
    this.dataDir = dataDir || path.join(__dirname, '../../data');
  }

  /**
   * 利用可能なプロジェクト一覧を取得
   */
  listProjects(): ProjectInfo[] {
    const files = fs.readdirSync(this.dataDir)
      .filter(f => f.endsWith('.json'))
      .filter(f => !f.startsWith('.'));  // 隠しファイル除外

    const projects: ProjectInfo[] = [];

    for (const file of files) {
      try {
        const filePath = path.join(this.dataDir, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

        if (data._metadata) {
          projects.push({
            fileName: file,
            filePath,
            metadata: data._metadata
          });
        }
      } catch (error) {
        // パースエラーは無視
        console.warn(`Warning: Failed to parse ${file}`);
      }
    }

    // 更新日時でソート（新しい順）
    return projects.sort((a, b) =>
      new Date(b.metadata.updatedAt).getTime() - new Date(a.metadata.updatedAt).getTime()
    );
  }

  /**
   * プロジェクトIDからファイル名を取得
   */
  getProjectFileName(projectId: string): string | null {
    const projects = this.listProjects();
    const project = projects.find(p => p.metadata.projectId === projectId);
    return project ? project.fileName : null;
  }

  /**
   * プロジェクトの詳細情報を取得
   */
  getProjectInfo(projectId: string): ProjectInfo | null {
    const projects = this.listProjects();
    return projects.find(p => p.metadata.projectId === projectId) || null;
  }

  /**
   * プロジェクトの要求サマリーを取得
   */
  getProjectSummary(projectId: string): {
    totalCount: number;
    byType: Record<string, number>;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
  } | null {
    const fileName = this.getProjectFileName(projectId);
    if (!fileName) return null;

    const filePath = path.join(this.dataDir, fileName);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const requirements = Object.entries(data).filter(([k]) => k !== '_metadata');

    const summary = {
      totalCount: requirements.length,
      byType: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
      byPriority: {} as Record<string, number>
    };

    requirements.forEach(([_, req]: [string, any]) => {
      // タイプ別
      const type = req.type || 'unknown';
      summary.byType[type] = (summary.byType[type] || 0) + 1;

      // ステータス別
      const status = req.status || 'unknown';
      summary.byStatus[status] = (summary.byStatus[status] || 0) + 1;

      // 優先度別
      const priority = req.priority || 'unknown';
      summary.byPriority[priority] = (summary.byPriority[priority] || 0) + 1;
    });

    return summary;
  }

  /**
   * プロジェクトの既存IDリストを取得
   */
  getExistingIds(projectId: string): string[] {
    const fileName = this.getProjectFileName(projectId);
    if (!fileName) return [];

    const filePath = path.join(this.dataDir, fileName);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return Object.keys(data).filter(k => k !== '_metadata');
  }
}
