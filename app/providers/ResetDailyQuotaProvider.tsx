import React, { useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '../store';

// 前日のリセット日を確認し、日付が変わっていたらクォータをリセットする
const checkAndResetDailyQuotas = async (resetImageGenCount: () => void, resetDailyQuotas?: () => void) => {
  try {
    // 現在の日付（YYYY-MM-DD形式）
    const today = new Date().toISOString().split('T')[0];

    // AsyncStorageから最終リセット日を取得
    const lastResetDate = await AsyncStorage.getItem('lastQuotaResetDate');

    if (!lastResetDate || lastResetDate !== today) {
      // 日付が変わっていたらリセット
      resetImageGenCount();
      
      // resetDailyQuotasが存在する場合のみ実行
      if (typeof resetDailyQuotas === 'function') {
        resetDailyQuotas();
      }
      
      // 最終リセット日を更新
      await AsyncStorage.setItem('lastQuotaResetDate', today);
      console.log('日次クォータをリセットしました', today);
    }
  } catch (error) {
    console.error('クォータリセットエラー:', error);
  }
};

interface ResetDailyQuotaProviderProps {
  children: React.ReactNode;
}

export const ResetDailyQuotaProvider = ({ children }: ResetDailyQuotaProviderProps) => {
  const resetImageGenCount = useStore((state) => state.resetImageGenCount);
  // resetDailyQuotasはundefinedの可能性があるため、型を適切に対応
  const resetDailyQuotas = useStore((state: any) => state.resetDailyQuotas);

  // アプリ起動時に確認
  useEffect(() => {
    checkAndResetDailyQuotas(resetImageGenCount, resetDailyQuotas);
  }, [resetImageGenCount, resetDailyQuotas]);

  // アプリがバックグラウンドから復帰したときに確認
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        checkAndResetDailyQuotas(resetImageGenCount, resetDailyQuotas);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [resetImageGenCount, resetDailyQuotas]);

  return <>{children}</>;
};

export default ResetDailyQuotaProvider; 