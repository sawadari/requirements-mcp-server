/**
 * 構造化ロギングシステム
 *
 * ログレベル管理、構造化されたログエントリ、コンテキスト情報の記録を提供。
 * 本番環境での検索・分析を容易にする。
 */

/**
 * ログレベル
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

/**
 * ログレベルの文字列表現
 */
export const LogLevelNames: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: 'DEBUG',
  [LogLevel.INFO]: 'INFO',
  [LogLevel.WARN]: 'WARN',
  [LogLevel.ERROR]: 'ERROR',
};

/**
 * ログエントリの構造
 */
export interface LogEntry {
  /** タイムスタンプ (ISO 8601) */
  timestamp: string;
  /** ログレベル */
  level: LogLevel;
  /** ログレベル名 */
  levelName: string;
  /** メッセージ */
  message: string;
  /** コンテキスト情報 */
  context?: Record<string, any>;
  /** エラー情報 */
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * ロガー設定
 */
export interface LoggerConfig {
  /** 最小ログレベル */
  minLevel?: LogLevel;
  /** デフォルトコンテキスト */
  defaultContext?: Record<string, any>;
  /** JSON形式で出力するか */
  json?: boolean;
  /** タイムスタンプを含めるか */
  timestamp?: boolean;
}

/**
 * 構造化ロガー
 */
export class Logger {
  private minLevel: LogLevel;
  private defaultContext: Record<string, any>;
  private json: boolean;
  private includeTimestamp: boolean;

  constructor(config: LoggerConfig = {}) {
    this.minLevel = config.minLevel ?? LogLevel.INFO;
    this.defaultContext = config.defaultContext ?? {};
    this.json = config.json ?? true;
    this.includeTimestamp = config.timestamp ?? true;
  }

  /**
   * DEBUGレベルのログ
   */
  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * INFOレベルのログ
   */
  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * WARNレベルのログ
   */
  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * ERRORレベルのログ
   */
  error(message: string, contextOrError?: Record<string, any> | Error): void {
    if (contextOrError instanceof Error) {
      this.logError(message, contextOrError);
    } else {
      this.log(LogLevel.ERROR, message, contextOrError);
    }
  }

  /**
   * エラーオブジェクトを含むログ
   */
  private logError(message: string, error: Error, context?: Record<string, any>): void {
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
  private log(level: LogLevel, message: string, context?: Record<string, any>): void {
    if (level < this.minLevel) {
      return;
    }

    const entry = this.createEntry(level, message, context);
    this.output(entry);
  }

  /**
   * ログエントリの作成
   */
  private createEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>
  ): LogEntry {
    const entry: LogEntry = {
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
  private output(entry: LogEntry): void {
    if (this.json) {
      // JSON形式で出力
      console.error(JSON.stringify(entry));
    } else {
      // 人間が読みやすい形式で出力
      const parts: string[] = [];

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
  child(additionalContext: Record<string, any>): Logger {
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
  setLevel(level: LogLevel): void {
    this.minLevel = level;
  }

  /**
   * 現在のログレベルを取得
   */
  getLevel(): LogLevel {
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
export function createLogger(component: string, additionalContext?: Record<string, any>): Logger {
  return defaultLogger.child({
    component,
    ...additionalContext,
  });
}

/**
 * 非同期関数の実行をログに記録
 */
export async function loggedAsync<T>(
  logger: Logger,
  operation: string,
  fn: () => Promise<T>,
  context?: Record<string, any>
): Promise<T> {
  const startTime = Date.now();
  logger.debug(`${operation} started`, context);

  try {
    const result = await fn();
    const duration = Date.now() - startTime;
    logger.debug(`${operation} completed`, { ...context, duration });
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`${operation} failed`, error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * 同期関数の実行をログに記録
 */
export function logged<T>(
  logger: Logger,
  operation: string,
  fn: () => T,
  context?: Record<string, any>
): T {
  const startTime = Date.now();
  logger.debug(`${operation} started`, context);

  try {
    const result = fn();
    const duration = Date.now() - startTime;
    logger.debug(`${operation} completed`, { ...context, duration });
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`${operation} failed`, error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}
