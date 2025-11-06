/**
 * 構造化ロギングシステム
 *
 * ログレベル管理、構造化されたログエントリ、コンテキスト情報の記録を提供。
 * 本番環境での検索・分析を容易にする。
 */
/**
 * ログレベル
 */
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["DEBUG"] = 0] = "DEBUG";
    LogLevel[LogLevel["INFO"] = 1] = "INFO";
    LogLevel[LogLevel["WARN"] = 2] = "WARN";
    LogLevel[LogLevel["ERROR"] = 3] = "ERROR";
})(LogLevel || (LogLevel = {}));
/**
 * ログレベルの文字列表現
 */
export const LogLevelNames = {
    [LogLevel.DEBUG]: 'DEBUG',
    [LogLevel.INFO]: 'INFO',
    [LogLevel.WARN]: 'WARN',
    [LogLevel.ERROR]: 'ERROR',
};
/**
 * 構造化ロガー
 */
export class Logger {
    minLevel;
    defaultContext;
    json;
    includeTimestamp;
    constructor(config = {}) {
        this.minLevel = config.minLevel ?? LogLevel.INFO;
        this.defaultContext = config.defaultContext ?? {};
        this.json = config.json ?? true;
        this.includeTimestamp = config.timestamp ?? true;
    }
    /**
     * DEBUGレベルのログ
     */
    debug(message, context) {
        this.log(LogLevel.DEBUG, message, context);
    }
    /**
     * INFOレベルのログ
     */
    info(message, context) {
        this.log(LogLevel.INFO, message, context);
    }
    /**
     * WARNレベルのログ
     */
    warn(message, context) {
        this.log(LogLevel.WARN, message, context);
    }
    /**
     * ERRORレベルのログ
     */
    error(message, contextOrError) {
        if (contextOrError instanceof Error) {
            this.logError(message, contextOrError);
        }
        else {
            this.log(LogLevel.ERROR, message, contextOrError);
        }
    }
    /**
     * エラーオブジェクトを含むログ
     */
    logError(message, error, context) {
        const entry = this.createEntry(LogLevel.ERROR, message, context);
        entry.error = {
            name: error.name,
            message: error.message,
            stack: error.stack,
        };
        this.output(entry);
    }
    /**
     * ログ出力（内部）
     */
    log(level, message, context) {
        if (level < this.minLevel) {
            return;
        }
        const entry = this.createEntry(level, message, context);
        this.output(entry);
    }
    /**
     * ログエントリの作成
     */
    createEntry(level, message, context) {
        const entry = {
            timestamp: new Date().toISOString(),
            level,
            levelName: LogLevelNames[level],
            message,
        };
        // コンテキストをマージ
        const mergedContext = { ...this.defaultContext, ...context };
        if (Object.keys(mergedContext).length > 0) {
            entry.context = mergedContext;
        }
        return entry;
    }
    /**
     * ログの出力
     */
    output(entry) {
        if (this.json) {
            // JSON形式で出力
            console.error(JSON.stringify(entry));
        }
        else {
            // 人間が読みやすい形式で出力
            const parts = [];
            if (this.includeTimestamp) {
                parts.push(`[${entry.timestamp}]`);
            }
            parts.push(`[${entry.levelName}]`);
            parts.push(entry.message);
            if (entry.context) {
                parts.push(JSON.stringify(entry.context));
            }
            if (entry.error) {
                parts.push(`\nError: ${entry.error.name}: ${entry.error.message}`);
                if (entry.error.stack) {
                    parts.push(`\nStack: ${entry.error.stack}`);
                }
            }
            console.error(parts.join(' '));
        }
    }
    /**
     * 子ロガーを作成（デフォルトコンテキストを継承）
     */
    child(additionalContext) {
        return new Logger({
            minLevel: this.minLevel,
            defaultContext: { ...this.defaultContext, ...additionalContext },
            json: this.json,
            timestamp: this.includeTimestamp,
        });
    }
    /**
     * ログレベルを変更
     */
    setLevel(level) {
        this.minLevel = level;
    }
    /**
     * 現在のログレベルを取得
     */
    getLevel() {
        return this.minLevel;
    }
}
/**
 * デフォルトロガーインスタンス
 */
export const defaultLogger = new Logger({
    minLevel: process.env.LOG_LEVEL
        ? parseInt(process.env.LOG_LEVEL, 10)
        : LogLevel.INFO,
    json: process.env.LOG_FORMAT !== 'text',
});
/**
 * コンポーネント別ロガーを作成
 */
export function createLogger(component, additionalContext) {
    return defaultLogger.child({
        component,
        ...additionalContext,
    });
}
/**
 * 非同期関数の実行をログに記録
 */
export async function loggedAsync(logger, operation, fn, context) {
    const startTime = Date.now();
    logger.debug(`${operation} started`, context);
    try {
        const result = await fn();
        const duration = Date.now() - startTime;
        logger.debug(`${operation} completed`, { ...context, duration });
        return result;
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger.error(`${operation} failed`, error instanceof Error ? error : new Error(String(error)));
        throw error;
    }
}
/**
 * 同期関数の実行をログに記録
 */
export function logged(logger, operation, fn, context) {
    const startTime = Date.now();
    logger.debug(`${operation} started`, context);
    try {
        const result = fn();
        const duration = Date.now() - startTime;
        logger.debug(`${operation} completed`, { ...context, duration });
        return result;
    }
    catch (error) {
        const duration = Date.now() - startTime;
        logger.error(`${operation} failed`, error instanceof Error ? error : new Error(String(error)));
        throw error;
    }
}
