/**
 * Result型パターン
 *
 * 成功または失敗を型安全に表現するための型定義。
 * エラーハンドリングの一貫性を保ち、型安全性を向上させる。
 */

/**
 * Result型
 *
 * @template T - 成功時の値の型
 * @template E - 失敗時のエラーの型（デフォルト: Error）
 */
export type Result<T, E = Error> =
  | { success: true; value: T }
  | { success: false; error: E };

/**
 * 成功を表すResultを生成
 *
 * @param value - 成功時の値
 * @returns 成功Result
 */
export function Ok<T>(value: T): Result<T, never> {
  return { success: true, value };
}

/**
 * 失敗を表すResultを生成
 *
 * @param error - エラー
 * @returns 失敗Result
 */
export function Err<E>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Resultが成功かどうかを判定
 *
 * @param result - 判定するResult
 * @returns 成功ならtrue
 */
export function isOk<T, E>(result: Result<T, E>): result is { success: true; value: T } {
  return result.success;
}

/**
 * Resultが失敗かどうかを判定
 *
 * @param result - 判定するResult
 * @returns 失敗ならtrue
 */
export function isErr<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return !result.success;
}

/**
 * Resultの値を変換
 *
 * @param result - 変換元のResult
 * @param fn - 変換関数
 * @returns 変換後のResult
 */
export function map<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  if (result.success) {
    return Ok(fn(result.value));
  }
  return result;
}

/**
 * Resultをチェーン
 *
 * @param result - チェーン元のResult
 * @param fn - チェーン関数
 * @returns チェーン後のResult
 */
export function flatMap<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  if (result.success) {
    return fn(result.value);
  }
  return result;
}

/**
 * Resultのエラーを変換
 *
 * @param result - 変換元のResult
 * @param fn - 変換関数
 * @returns 変換後のResult
 */
export function mapError<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> {
  if (!result.success) {
    return Err(fn(result.error));
  }
  return result;
}

/**
 * Resultから値を取得（失敗時はデフォルト値）
 *
 * @param result - Result
 * @param defaultValue - デフォルト値
 * @returns 値またはデフォルト値
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (result.success) {
    return result.value;
  }
  return defaultValue;
}

/**
 * 複数のResultを集約（全て成功した場合のみ成功）
 *
 * @param results - Resultの配列
 * @returns 集約されたResult
 */
export function all<T, E>(results: Result<T, E>[]): Result<T[], E> {
  const values: T[] = [];

  for (const result of results) {
    if (!result.success) {
      return result;
    }
    values.push(result.value);
  }

  return Ok(values);
}

/**
 * 非同期関数をResultでラップ
 *
 * @param fn - 非同期関数
 * @returns Result を返す非同期関数
 */
export function wrapAsync<T, Args extends any[]>(
  fn: (...args: Args) => Promise<T>
): (...args: Args) => Promise<Result<T, Error>> {
  return async (...args: Args) => {
    try {
      const value = await fn(...args);
      return Ok(value);
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  };
}

/**
 * 同期関数をResultでラップ
 *
 * @param fn - 同期関数
 * @returns Result を返す関数
 */
export function wrap<T, Args extends any[]>(
  fn: (...args: Args) => T
): (...args: Args) => Result<T, Error> {
  return (...args: Args) => {
    try {
      const value = fn(...args);
      return Ok(value);
    } catch (error) {
      return Err(error instanceof Error ? error : new Error(String(error)));
    }
  };
}
