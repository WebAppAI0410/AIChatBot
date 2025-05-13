import Constants from 'expo-constants';

// 環境変数またはビルド設定から開発モードかどうかを判定
export const isDevelopmentMode = () => {
  // Expoの場合
  if (Constants.expoConfig?.extra?.isDev) {
    return true;
  }

  // __DEV__グローバル変数（React Native）
  if (typeof __DEV__ !== 'undefined' && __DEV__) {
    return true;
  }

  // プロセス環境変数（Node.js）
  if (process.env.NODE_ENV === 'development') {
    return true;
  }

  return false;
};

export default { isDevelopmentMode }; 