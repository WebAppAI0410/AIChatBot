/**
 * 安全なロギングユーティリティ
 * 
 * 開発環境でのみコンソール出力を行い、本番環境では出力しません。
 * これにより機密情報の漏洩リスクを低減し、パフォーマンスも向上します。
 */

/**
 * 開発環境でのみ情報ログを出力
 * @param message ログメッセージ
 * @param args その他の引数
 */
export const logInfo = (message: string, ...args: any[]): void => {
  if (__DEV__) {
    console.log(message, ...args);
  }
};

/**
 * 開発環境でのみ警告ログを出力
 * @param message 警告メッセージ
 * @param args その他の引数
 */
export const logWarning = (message: string, ...args: any[]): void => {
  if (__DEV__) {
    console.warn(message, ...args);
  }
};

/**
 * 開発環境でのみエラーログを出力
 * 重大なエラーは本番環境でも記録したい場合は別途エラー追跡サービスの使用を検討
 * @param message エラーメッセージ
 * @param args その他の引数
 */
export const logError = (message: string, ...args: any[]): void => {
  if (__DEV__) {
    console.error(message, ...args);
  }
  // 本番環境でのエラー追跡はここに追加
  // 例: errorTrackingService.captureError(message, ...args);
};

/**
 * 開発環境でのみデバッグログを出力
 * @param message デバッグメッセージ
 * @param args その他の引数
 */
export const logDebug = (message: string, ...args: any[]): void => {
  if (__DEV__) {
    console.debug(message, ...args);
  }
};

export default {
  logInfo,
  logWarning,
  logError,
  logDebug
}; 