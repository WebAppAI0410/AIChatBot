import { Platform } from 'react-native';

/**
 * トースト表示用のユーティリティ関数
 * @param message 表示メッセージ
 * @param duration 表示時間（ミリ秒）
 */
export const showToast = (message: string, duration: number = 3000): void => {
  // ネイティブのトースト機能が実装されるまではコンソールに出力
  console.log(`[Toast]: ${message}`);
  
  // 実際のトースト実装
  // Platform.OS === 'android'
  // ? ToastAndroid.show(message, ToastAndroid.SHORT)
  // : Alert.alert('通知', message);
}; 