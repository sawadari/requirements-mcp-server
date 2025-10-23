/**
 * Miyabi Dashboard Integration
 *
 * requirements-mcp-serverの要求データをMiyabi Dashboardと連携させるモジュール
 */

import { Requirement, RequirementStatus, RequirementPriority } from './types.js';
import { promises as fs } from 'fs';
import { join } from 'path';

export interface DashboardMetrics {
  totalRequirements: number;
  byStatus: Record<RequirementStatus, number>;
  byPriority: Record<RequirementPriority, number>;
  byCategory: Record<string, number>;
  completionRate: number;
  criticalCount: number;
  blockedCount: number;
  recentlyUpdated: Requirement[];
  dependencyHealth: {
    total: number;
    circular: number;
    orphaned: number;
    maxDepth: number;
  };
}

export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'list' | 'graph';
  title: string;
  data: any;
  config?: Record<string, any>;
}

export class DashboardIntegration {
  private dataDir: string;
  private dashboardDir: string;

  constructor(dataDir: string = './data', dashboardDir: string = './dashboard') {
    this.dataDir = dataDir;
    this.dashboardDir = dashboardDir;
  }

  /**
   * 要求データからダッシュボードメトリクスを生成
   */
  async generateMetrics(requirements: Requirement[]): Promise<DashboardMetrics> {
    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    let completedCount = 0;
    let criticalCount = 0;
    const blockedDependencies = new Set<string>();

    // 各要求を集計
    for (const req of requirements) {
      // ステータス集計
      byStatus[req.status] = (byStatus[req.status] || 0) + 1;

      // 優先度集計
      byPriority[req.priority] = (byPriority[req.priority] || 0) + 1;

      // カテゴリ集計
      byCategory[req.category] = (byCategory[req.category] || 0) + 1;

      // 完了済みカウント
      if (req.status === 'completed') {
        completedCount++;
      }

      // クリティカルカウント
      if (req.priority === 'critical') {
        criticalCount++;
      }

      // ブロックされた依存関係チェック
      if (req.status === 'on_hold') {
        req.dependencies?.forEach(dep => blockedDependencies.add(dep));
      }
    }

    // 完了率計算
    const completionRate = requirements.length > 0
      ? (completedCount / requirements.length) * 100
      : 0;

    // 最近更新された要求（直近10件）
    const recentlyUpdated = requirements
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 10);

    // 依存関係の健全性チェック
    const dependencyHealth = this.analyzeDependencyHealth(requirements);

    return {
      totalRequirements: requirements.length,
      byStatus: byStatus as Record<RequirementStatus, number>,
      byPriority: byPriority as Record<RequirementPriority, number>,
      byCategory,
      completionRate: Math.round(completionRate * 10) / 10,
      criticalCount,
      blockedCount: blockedDependencies.size,
      recentlyUpdated,
      dependencyHealth,
    };
  }

  /**
   * 依存関係の健全性を分析
   */
  private analyzeDependencyHealth(requirements: Requirement[]): DashboardMetrics['dependencyHealth'] {
    const reqMap = new Map(requirements.map(r => [r.id, r]));
    const visited = new Set<string>();
    const recStack = new Set<string>();
    let circularCount = 0;
    let orphanedCount = 0;
    let maxDepth = 0;

    // 循環参照検出（DFS）
    const hasCycle = (id: string, depth: number = 0): boolean => {
      if (!visited.has(id)) {
        visited.add(id);
        recStack.add(id);
        maxDepth = Math.max(maxDepth, depth);

        const req = reqMap.get(id);
        if (req) {
          for (const depId of req.dependencies || []) {
            if (!visited.has(depId) && hasCycle(depId, depth + 1)) {
              return true;
            } else if (recStack.has(depId)) {
              circularCount++;
              return true;
            }
          }
        }
      }

      recStack.delete(id);
      return false;
    };

    // 各要求をチェック
    for (const req of requirements) {
      visited.clear();
      recStack.clear();
      hasCycle(req.id);

      // 孤立した要求（依存先が存在しない）
      for (const depId of req.dependencies || []) {
        if (!reqMap.has(depId)) {
          orphanedCount++;
        }
      }
    }

    return {
      total: requirements.reduce((sum, r) => sum + (r.dependencies?.length || 0), 0),
      circular: circularCount,
      orphaned: orphanedCount,
      maxDepth,
    };
  }

  /**
   * ダッシュボードウィジェットを生成
   */
  async generateWidgets(metrics: DashboardMetrics): Promise<DashboardWidget[]> {
    const widgets: DashboardWidget[] = [];

    // 1. 要求統計
    widgets.push({
      id: 'requirements-stats',
      type: 'metric',
      title: '要求統計',
      data: {
        total: metrics.totalRequirements,
        completed: metrics.byStatus.completed || 0,
        inProgress: metrics.byStatus.in_progress || 0,
        pending: metrics.byStatus.draft + metrics.byStatus.proposed || 0,
      },
    });

    // 2. 完了率
    widgets.push({
      id: 'completion-rate',
      type: 'metric',
      title: '完了率',
      data: {
        percentage: metrics.completionRate,
        total: metrics.totalRequirements,
        completed: metrics.byStatus.completed || 0,
      },
    });

    // 3. 優先度分布
    widgets.push({
      id: 'priority-distribution',
      type: 'chart',
      title: '優先度分布',
      data: Object.entries(metrics.byPriority).map(([priority, count]) => ({
        label: priority,
        value: count,
      })),
      config: {
        chartType: 'pie',
      },
    });

    // 4. ステータス分布
    widgets.push({
      id: 'status-distribution',
      type: 'chart',
      title: 'ステータス分布',
      data: Object.entries(metrics.byStatus).map(([status, count]) => ({
        label: status,
        value: count,
      })),
      config: {
        chartType: 'bar',
      },
    });

    // 5. カテゴリ分布
    widgets.push({
      id: 'category-distribution',
      type: 'chart',
      title: 'カテゴリ分布',
      data: Object.entries(metrics.byCategory).map(([category, count]) => ({
        label: category,
        value: count,
      })),
      config: {
        chartType: 'horizontal-bar',
      },
    });

    // 6. クリティカル要求
    widgets.push({
      id: 'critical-requirements',
      type: 'metric',
      title: 'クリティカル要求',
      data: {
        count: metrics.criticalCount,
        percentage: (metrics.criticalCount / metrics.totalRequirements) * 100,
      },
      config: {
        alert: metrics.criticalCount > 0,
      },
    });

    // 7. 最近更新された要求
    widgets.push({
      id: 'recently-updated',
      type: 'list',
      title: '最近更新された要求',
      data: metrics.recentlyUpdated.map(req => ({
        id: req.id,
        title: req.title,
        status: req.status,
        priority: req.priority,
        updatedAt: req.updatedAt,
      })),
    });

    // 8. 依存関係の健全性
    widgets.push({
      id: 'dependency-health',
      type: 'metric',
      title: '依存関係の健全性',
      data: {
        total: metrics.dependencyHealth.total,
        circular: metrics.dependencyHealth.circular,
        orphaned: metrics.dependencyHealth.orphaned,
        maxDepth: metrics.dependencyHealth.maxDepth,
      },
      config: {
        alert: metrics.dependencyHealth.circular > 0 || metrics.dependencyHealth.orphaned > 0,
      },
    });

    return widgets;
  }

  /**
   * ダッシュボードデータをファイルに保存
   */
  async saveDashboardData(
    metrics: DashboardMetrics,
    widgets: DashboardWidget[]
  ): Promise<void> {
    // ダッシュボードディレクトリが存在しない場合は作成
    await fs.mkdir(this.dashboardDir, { recursive: true });

    // メトリクスを保存
    await fs.writeFile(
      join(this.dashboardDir, 'metrics.json'),
      JSON.stringify(metrics, null, 2),
      'utf-8'
    );

    // ウィジェットを保存
    await fs.writeFile(
      join(this.dashboardDir, 'widgets.json'),
      JSON.stringify(widgets, null, 2),
      'utf-8'
    );

    // タイムスタンプを保存
    await fs.writeFile(
      join(this.dashboardDir, 'last-updated.json'),
      JSON.stringify({ timestamp: new Date().toISOString() }, null, 2),
      'utf-8'
    );

    console.log(`📊 Dashboard data saved to ${this.dashboardDir}`);
  }

  /**
   * 完全なダッシュボードデータを生成・保存
   */
  async generateAndSaveDashboard(requirements: Requirement[]): Promise<void> {
    console.log('📊 Generating dashboard data...');

    const metrics = await this.generateMetrics(requirements);
    const widgets = await this.generateWidgets(metrics);

    await this.saveDashboardData(metrics, widgets);

    console.log('✅ Dashboard data generated successfully');
  }

  /**
   * 差分更新: 変更があった要求のみ更新
   */
  async updateDashboardIncremental(
    changedRequirements: Requirement[],
    allRequirements: Requirement[]
  ): Promise<void> {
    console.log(`📊 Updating dashboard (${changedRequirements.length} changed requirements)...`);

    // 完全再生成（将来的には差分更新に最適化可能）
    await this.generateAndSaveDashboard(allRequirements);
  }
}

/**
 * Dashboard integration factory
 */
export function createDashboardIntegration(
  dataDir?: string,
  dashboardDir?: string
): DashboardIntegration {
  return new DashboardIntegration(dataDir, dashboardDir);
}
