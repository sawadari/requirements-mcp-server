/**
 * 要求管理データのビュー定義と出力機能
 */

import { Requirement } from './types.js';
import { RequirementsStorage } from './storage.js';

// ビュー定義の型
export interface ViewDefinition {
  name: string;
  description: string;
  type: 'list' | 'matrix' | 'tree' | 'gantt';
  filters?: {
    category?: string[];
    status?: string[];
    priority?: string[];
  };
  columns?: string[]; // 表示するカラム
  format?: 'csv' | 'markdown' | 'html' | 'json';
}

// 定義済みビュー
export const PREDEFINED_VIEWS: { [key: string]: ViewDefinition } = {
  'stakeholder-requirements': {
    name: 'ステークホルダ要求リスト',
    description: 'ステークホルダ要求の一覧',
    type: 'list',
    filters: { category: ['ステークホルダ要求'] },
    columns: ['id', 'title', 'description', 'priority', 'status', 'tags'],
    format: 'markdown',
  },
  'system-requirements': {
    name: 'システム要求リスト',
    description: 'システム要求の一覧',
    type: 'list',
    filters: { category: ['システム要求'] },
    columns: ['id', 'title', 'description', 'priority', 'status', 'dependencies'],
    format: 'markdown',
  },
  'functional-requirements': {
    name: 'システム機能要求リスト',
    description: 'システム機能要求の一覧',
    type: 'list',
    filters: { category: ['システム機能要求'] },
    columns: ['id', 'title', 'description', 'priority', 'status', 'assignee', 'dependencies'],
    format: 'markdown',
  },
  'all-requirements': {
    name: '全要求一覧',
    description: 'すべての要求の一覧',
    type: 'list',
    columns: ['id', 'title', 'category', 'priority', 'status', 'assignee'],
    format: 'markdown',
  },
  'stakeholder-system-matrix': {
    name: 'ステークホルダ要求-システム要求マトリックス',
    description: 'ステークホルダ要求とシステム要求のトレーサビリティマトリックス',
    type: 'matrix',
    format: 'markdown',
  },
  'system-functional-matrix': {
    name: 'システム要求-機能要求マトリックス',
    description: 'システム要求とシステム機能要求のトレーサビリティマトリックス',
    type: 'matrix',
    format: 'markdown',
  },
  'critical-requirements': {
    name: '重要度Critical要求',
    description: '優先度がCriticalの要求一覧',
    type: 'list',
    filters: { priority: ['critical'] },
    columns: ['id', 'title', 'category', 'status', 'assignee', 'dependencies'],
    format: 'markdown',
  },
  'in-progress-requirements': {
    name: '実装中要求',
    description: 'ステータスがin_progressの要求一覧',
    type: 'list',
    filters: { status: ['in_progress'] },
    columns: ['id', 'title', 'category', 'priority', 'assignee', 'updatedAt'],
    format: 'markdown',
  },
};

export class ViewExporter {
  constructor(private storage: RequirementsStorage) {}

  /**
   * ビュー定義に基づいてデータを出力
   */
  async exportView(viewKey: string): Promise<string> {
    const viewDef = PREDEFINED_VIEWS[viewKey];
    if (!viewDef) {
      throw new Error(`Unknown view: ${viewKey}`);
    }

    const requirements = await this.getFilteredRequirements(viewDef);

    switch (viewDef.type) {
      case 'list':
        return this.exportList(requirements, viewDef);
      case 'matrix':
        return this.exportMatrix(viewKey, viewDef);
      default:
        throw new Error(`Unsupported view type: ${viewDef.type}`);
    }
  }

  /**
   * フィルタを適用して要求を取得
   */
  private async getFilteredRequirements(viewDef: ViewDefinition): Promise<Requirement[]> {
    let requirements = await this.storage.getAllRequirements();

    if (viewDef.filters) {
      if (viewDef.filters.category) {
        requirements = requirements.filter((r) =>
          viewDef.filters!.category!.includes(r.category)
        );
      }
      if (viewDef.filters.status) {
        requirements = requirements.filter((r) =>
          viewDef.filters!.status!.includes(r.status)
        );
      }
      if (viewDef.filters.priority) {
        requirements = requirements.filter((r) =>
          viewDef.filters!.priority!.includes(r.priority)
        );
      }
    }

    return requirements.sort((a, b) => a.id.localeCompare(b.id));
  }

  /**
   * リスト形式でエクスポート
   */
  private exportList(requirements: Requirement[], viewDef: ViewDefinition): string {
    const format = viewDef.format || 'markdown';
    const columns = viewDef.columns || ['id', 'title', 'status'];

    switch (format) {
      case 'markdown':
        return this.exportListAsMarkdown(requirements, columns, viewDef);
      case 'csv':
        return this.exportListAsCSV(requirements, columns);
      case 'html':
        return this.exportListAsHTML(requirements, columns, viewDef);
      case 'json':
        return JSON.stringify(requirements, null, 2);
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  }

  /**
   * Markdown形式でリストをエクスポート
   */
  private exportListAsMarkdown(
    requirements: Requirement[],
    columns: string[],
    viewDef: ViewDefinition
  ): string {
    let output = `# ${viewDef.name}\n\n`;
    output += `${viewDef.description}\n\n`;
    output += `生成日時: ${new Date().toLocaleString('ja-JP')}\n\n`;
    output += `---\n\n`;

    // テーブルヘッダー
    const headers = columns.map(this.getColumnLabel);
    output += `| ${headers.join(' | ')} |\n`;
    output += `| ${columns.map(() => '---').join(' | ')} |\n`;

    // テーブルボディ
    for (const req of requirements) {
      const values = columns.map((col) => this.formatValue(req, col));
      output += `| ${values.join(' | ')} |\n`;
    }

    output += `\n**合計**: ${requirements.length}件\n`;

    return output;
  }

  /**
   * CSV形式でリストをエクスポート
   */
  private exportListAsCSV(requirements: Requirement[], columns: string[]): string {
    const headers = columns.map(this.getColumnLabel);
    let output = headers.join(',') + '\n';

    for (const req of requirements) {
      const values = columns.map((col) => {
        const value = this.formatValue(req, col);
        // CSV用にエスケープ
        return `"${value.replace(/"/g, '""')}"`;
      });
      output += values.join(',') + '\n';
    }

    return output;
  }

  /**
   * HTML形式でリストをエクスポート
   */
  private exportListAsHTML(
    requirements: Requirement[],
    columns: string[],
    viewDef: ViewDefinition
  ): string {
    let output = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${viewDef.name}</title>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 20px; }
    h1 { color: #333; }
    table { border-collapse: collapse; width: 100%; margin-top: 20px; }
    th { background-color: #4CAF50; color: white; padding: 12px; text-align: left; }
    td { border: 1px solid #ddd; padding: 8px; }
    tr:nth-child(even) { background-color: #f2f2f2; }
    tr:hover { background-color: #ddd; }
    .meta { color: #666; font-size: 0.9em; }
  </style>
</head>
<body>
  <h1>${viewDef.name}</h1>
  <p class="meta">${viewDef.description}</p>
  <p class="meta">生成日時: ${new Date().toLocaleString('ja-JP')}</p>
  <table>
    <thead>
      <tr>
${columns.map((col) => `        <th>${this.getColumnLabel(col)}</th>`).join('\n')}
      </tr>
    </thead>
    <tbody>
`;

    for (const req of requirements) {
      output += '      <tr>\n';
      for (const col of columns) {
        const value = this.formatValue(req, col);
        output += `        <td>${this.escapeHtml(value)}</td>\n`;
      }
      output += '      </tr>\n';
    }

    output += `    </tbody>
  </table>
  <p><strong>合計</strong>: ${requirements.length}件</p>
</body>
</html>
`;

    return output;
  }

  /**
   * マトリックス形式でエクスポート
   */
  private async exportMatrix(viewKey: string, viewDef: ViewDefinition): Promise<string> {
    if (viewKey === 'stakeholder-system-matrix') {
      return this.exportStakeholderSystemMatrix(viewDef);
    } else if (viewKey === 'system-functional-matrix') {
      return this.exportSystemFunctionalMatrix(viewDef);
    }
    throw new Error(`Unknown matrix view: ${viewKey}`);
  }

  /**
   * ステークホルダ要求-システム要求マトリックス
   */
  private async exportStakeholderSystemMatrix(viewDef: ViewDefinition): Promise<string> {
    const stakeholderReqs = (await this.storage.getAllRequirements()).filter(
      (r) => r.category === 'ステークホルダ要求'
    ).sort((a, b) => a.id.localeCompare(b.id));

    const systemReqs = (await this.storage.getAllRequirements()).filter(
      (r) => r.category === 'システム要求'
    ).sort((a, b) => a.id.localeCompare(b.id));

    let output = `# ${viewDef.name}\n\n`;
    output += `${viewDef.description}\n\n`;
    output += `生成日時: ${new Date().toLocaleString('ja-JP')}\n\n`;
    output += `---\n\n`;

    // ヘッダー行
    output += `| ステークホルダ要求 \\ システム要求 | ${systemReqs.map((r) => r.id).join(' | ')} |\n`;
    output += `| --- | ${systemReqs.map(() => ':---:').join(' | ')} |\n`;

    // データ行
    for (const stkReq of stakeholderReqs) {
      const row = [`**${stkReq.id}**<br>${stkReq.title}`];

      for (const sysReq of systemReqs) {
        // システム要求がステークホルダ要求に依存しているかチェック
        const hasDependency = sysReq.dependencies.includes(stkReq.id);
        row.push(hasDependency ? '●' : '');
      }

      output += `| ${row.join(' | ')} |\n`;
    }

    output += `\n**凡例**: ● = 依存関係あり\n`;

    return output;
  }

  /**
   * システム要求-機能要求マトリックス
   */
  private async exportSystemFunctionalMatrix(viewDef: ViewDefinition): Promise<string> {
    const systemReqs = (await this.storage.getAllRequirements()).filter(
      (r) => r.category === 'システム要求'
    ).sort((a, b) => a.id.localeCompare(b.id));

    const functionalReqs = (await this.storage.getAllRequirements()).filter(
      (r) => r.category === 'システム機能要求'
    ).sort((a, b) => a.id.localeCompare(b.id));

    let output = `# ${viewDef.name}\n\n`;
    output += `${viewDef.description}\n\n`;
    output += `生成日時: ${new Date().toLocaleString('ja-JP')}\n\n`;
    output += `---\n\n`;

    // ヘッダー行
    output += `| システム要求 \\ 機能要求 | ${functionalReqs.map((r) => r.id).join(' | ')} |\n`;
    output += `| --- | ${functionalReqs.map(() => ':---:').join(' | ')} |\n`;

    // データ行
    for (const sysReq of systemReqs) {
      const row = [`**${sysReq.id}**<br>${sysReq.title}`];

      for (const funcReq of functionalReqs) {
        // 機能要求がシステム要求に依存しているかチェック
        const hasDependency = funcReq.dependencies.includes(sysReq.id);
        row.push(hasDependency ? '●' : '');
      }

      output += `| ${row.join(' | ')} |\n`;
    }

    output += `\n**凡例**: ● = 依存関係あり\n`;

    return output;
  }

  /**
   * カラム名のラベルを取得
   */
  private getColumnLabel(column: string): string {
    const labels: { [key: string]: string } = {
      id: 'ID',
      title: 'タイトル',
      description: '説明',
      status: 'ステータス',
      priority: '優先度',
      category: 'カテゴリ',
      tags: 'タグ',
      dependencies: '依存関係',
      author: '作成者',
      assignee: '担当者',
      createdAt: '作成日',
      updatedAt: '更新日',
    };
    return labels[column] || column;
  }

  /**
   * 値をフォーマット
   */
  private formatValue(req: Requirement, column: string): string {
    const value = (req as any)[column];

    if (value === undefined || value === null) {
      return '';
    }

    if (Array.isArray(value)) {
      return value.join(', ');
    }

    if (value instanceof Date) {
      return value.toLocaleDateString('ja-JP');
    }

    return String(value);
  }

  /**
   * HTMLエスケープ
   */
  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  /**
   * すべての定義済みビューを一括生成してファイルに保存
   */
  async exportAllViews(outputDir: string = './views'): Promise<void> {
    const fs = await import('fs/promises');
    const path = await import('path');

    // 出力ディレクトリを作成
    await fs.mkdir(outputDir, { recursive: true });
    await fs.mkdir(path.join(outputDir, 'markdown'), { recursive: true });
    await fs.mkdir(path.join(outputDir, 'html'), { recursive: true });
    await fs.mkdir(path.join(outputDir, 'csv'), { recursive: true });

    const viewKeys = Object.keys(PREDEFINED_VIEWS);

    for (const viewKey of viewKeys) {
      const viewDef = PREDEFINED_VIEWS[viewKey];

      try {
        const content = await this.exportView(viewKey);
        const format = viewDef.format || 'markdown';
        const ext = format === 'markdown' ? 'md' : format;
        const filename = `${viewKey}.${ext}`;
        const subdir = format === 'html' ? 'html' : format === 'csv' ? 'csv' : 'markdown';
        const filepath = path.join(outputDir, subdir, filename);

        await fs.writeFile(filepath, content, 'utf-8');
      } catch (error: any) {
        console.error(`Failed to export view ${viewKey}:`, error.message);
      }
    }
  }
}
