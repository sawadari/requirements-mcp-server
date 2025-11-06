/**
 * Operation Logger - MCP操作のログ記録とデバッグ機能
 */
import fs from 'fs/promises';
import path from 'path';
export class OperationLogger {
    logs = [];
    logFilePath;
    maxLogs = 1000; // 最大保存ログ数
    constructor(dataDir = './data') {
        this.logFilePath = path.join(dataDir, 'operation-logs.json');
    }
    /**
     * 初期化 - 既存のログを読み込み
     */
    async initialize() {
        try {
            const data = await fs.readFile(this.logFilePath, 'utf-8');
            const parsed = JSON.parse(data);
            this.logs = parsed.map((log) => ({
                ...log,
                timestamp: new Date(log.timestamp),
            }));
            console.error(`✓ Loaded ${this.logs.length} operation logs`);
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                this.logs = [];
                console.error('✓ Created new operation log file');
            }
            else {
                throw error;
            }
        }
    }
    /**
     * 操作を記録
     */
    async logOperation(toolName, parameters, result, error, duration, beforeState, afterState) {
        const logId = `LOG-${Date.now()}`;
        const log = {
            id: logId,
            timestamp: new Date(),
            operation: this.getOperationDescription(toolName, parameters),
            toolName,
            parameters,
            result,
            error,
            duration,
            beforeState,
            afterState,
        };
        this.logs.push(log);
        // 最大ログ数を超えたら古いログを削除
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }
        await this.save();
        return logId;
    }
    /**
     * 操作の説明を生成
     */
    getOperationDescription(toolName, parameters) {
        switch (toolName) {
            case 'add_requirement':
                return `要求を追加: ${parameters.title}`;
            case 'update_requirement':
                return `要求を更新: ${parameters.id}`;
            case 'delete_requirement':
                return `要求を削除: ${parameters.id}`;
            case 'get_requirement':
                return `要求を取得: ${parameters.id}`;
            case 'list_requirements':
                return '全要求を取得';
            case 'search_requirements':
                return `要求を検索: ${JSON.stringify(parameters)}`;
            case 'analyze_impact':
                return `影響範囲を分析: ${parameters.id}`;
            case 'get_dependency_graph':
                return `依存関係グラフを取得: ${parameters.id}`;
            case 'propose_change':
                return `変更提案を作成: ${parameters.targetRequirementId}`;
            default:
                return `${toolName}を実行`;
        }
    }
    /**
     * すべてのログを取得
     */
    getAllLogs() {
        return [...this.logs].reverse(); // 新しい順
    }
    /**
     * 特定のログを取得
     */
    getLog(logId) {
        return this.logs.find((log) => log.id === logId);
    }
    /**
     * フィルタリングしてログを取得
     */
    filterLogs(options) {
        let filtered = [...this.logs];
        if (options.toolName) {
            filtered = filtered.filter((log) => log.toolName === options.toolName);
        }
        if (options.startDate) {
            filtered = filtered.filter((log) => log.timestamp >= options.startDate);
        }
        if (options.endDate) {
            filtered = filtered.filter((log) => log.timestamp <= options.endDate);
        }
        if (options.hasError !== undefined) {
            filtered = filtered.filter((log) => options.hasError ? log.error : !log.error);
        }
        return filtered.reverse(); // 新しい順
    }
    /**
     * 統計情報を取得
     */
    getStatistics() {
        const totalOperations = this.logs.length;
        const successCount = this.logs.filter((log) => !log.error).length;
        const errorCount = this.logs.filter((log) => log.error).length;
        const operationCounts = {};
        this.logs.forEach((log) => {
            operationCounts[log.toolName] = (operationCounts[log.toolName] || 0) + 1;
        });
        const durationsWithValues = this.logs
            .map((log) => log.duration)
            .filter((d) => d !== undefined);
        const averageDuration = durationsWithValues.length > 0
            ? durationsWithValues.reduce((a, b) => a + b, 0) / durationsWithValues.length
            : 0;
        return {
            totalOperations,
            successCount,
            errorCount,
            operationCounts,
            averageDuration,
        };
    }
    /**
     * ログをクリア
     */
    async clearLogs() {
        this.logs = [];
        await this.save();
    }
    /**
     * ログをファイルに保存
     */
    async save() {
        const dir = path.dirname(this.logFilePath);
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(this.logFilePath, JSON.stringify(this.logs, null, 2), 'utf-8');
    }
}
