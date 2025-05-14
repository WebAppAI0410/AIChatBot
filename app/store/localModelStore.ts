import { StateCreator } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { downloadQwen3Model, checkModelInstallation, deleteLocalModel, cancelDownload } from '../services/localModel';

export type ModelStatus = 'not_downloaded' | 'downloading' | 'verifying' | 'ready' | 'error';

export interface LocalModelState {
  modelStatus: ModelStatus;
  downloadProgress: number;
  errorMessage: string | null;
  modelPath: string | null;
  installedDate: string | null;
  dailyUsageCount: number;
  dailyUsageLimit: number;
  usageResetDate: string;
  
  // アクション
  startDownload: () => Promise<void>;
  cancelDownload: () => void;
  deleteModel: () => Promise<void>;
  setModelStatus: (status: ModelStatus) => void;
  setDownloadProgress: (progress: number) => void;
  setErrorMessage: (message: string | null) => void;
  checkModelStatus: () => Promise<void>;
  incrementUsageCount: () => void;
  checkDailyUsageLimit: () => boolean;
  updateUsageLimitByPlan: (plan: string) => void;

  // 以前のインターフェースとの互換性のため
  localModelStatus: string; // ModelStatus型と互換
  localModelPath: string | null;
  setLocalModelStatus: (status: string) => void;
  setLocalModelPath: (path: string | null) => void;
}

const createLocalModelSlice: StateCreator<LocalModelState> = (set, get) => ({
  // 状態初期値
  modelStatus: 'not_downloaded',
  downloadProgress: 0,
  errorMessage: null,
  modelPath: null,
  installedDate: null,
  dailyUsageCount: 0,
  dailyUsageLimit: 50, // デフォルトはFreeプラン
  usageResetDate: new Date().toISOString().split('T')[0],

  // 互換性用
  localModelStatus: 'not_installed',
  localModelPath: null,

  // モデル状態チェック
  checkModelStatus: async () => {
    try {
      const { installed, path, installedDate } = await checkModelInstallation();
      const status = installed ? 'ready' as ModelStatus : 'not_downloaded' as ModelStatus;
      const legacyStatus = installed ? 'ready' : 'not_installed';
      
      set({
        modelStatus: status,
        modelPath: path,
        installedDate,
        localModelStatus: legacyStatus,
        localModelPath: path,
      });
      
      // 日次使用制限のリセット確認
      const today = new Date().toISOString().split('T')[0];
      const state = get();
      
      if (state.usageResetDate !== today) {
        set({
          dailyUsageCount: 0,
          usageResetDate: today,
        });
      }
    } catch (error) {
      console.error('モデル状態チェックエラー:', error);
      set({
        modelStatus: 'error',
        errorMessage: error instanceof Error ? error.message : '不明なエラー',
        localModelStatus: 'not_installed'
      });
    }
  },

  // モデルダウンロード開始
  startDownload: async () => {
    try {
      set({
        modelStatus: 'downloading',
        downloadProgress: 0,
        errorMessage: null,
        localModelStatus: 'downloading'
      });
      
      const success = await downloadQwen3Model((progress) => {
        // progressが1に近い値で、modelStatusがverifyingでなければ検証中に設定
        if (progress > 0.98 && get().modelStatus !== 'verifying') {
          set({
            modelStatus: 'verifying',
            downloadProgress: progress
          });
        } else {
          set({ downloadProgress: progress });
        }
      });

      if (success) {
        // モデル状態を再確認
        await get().checkModelStatus();
      } else {
        set({
          modelStatus: 'error',
          errorMessage: 'ダウンロードに失敗しました',
          localModelStatus: 'not_installed'
        });
      }
    } catch (error) {
      console.error('モデルダウンロードエラー:', error);
      set({
        modelStatus: 'error',
        errorMessage: error instanceof Error ? error.message : '不明なエラー',
        localModelStatus: 'not_installed'
      });
    }
  },
  
  // ダウンロードキャンセル
  cancelDownload: async () => {
    try {
      const success = await cancelDownload();
      if (success) {
        set({
          modelStatus: 'not_downloaded',
          downloadProgress: 0,
          errorMessage: null,
          localModelStatus: 'not_installed'
        });
      }
    } catch (error) {
      console.error('ダウンロードキャンセルエラー:', error);
    }
  },
  
  // モデル削除
  deleteModel: async () => {
    try {
      const success = await deleteLocalModel();
      if (success) {
        set({
          modelStatus: 'not_downloaded',
          modelPath: null,
          installedDate: null,
          errorMessage: null,
          localModelStatus: 'not_installed', // 互換性
          localModelPath: null // 互換性
        });
      }
    } catch (error) {
      console.error('モデル削除エラー:', error);
      set({
        errorMessage: error instanceof Error ? error.message : '削除中にエラーが発生しました'
      });
    }
  },
  
  // ステータス設定
  setModelStatus: (status) => {
    // 互換性用のマッピング
    const legacyStatus = status === 'not_downloaded' ? 'not_installed' : 
                         status === 'ready' ? 'ready' : 
                         status === 'downloading' ? 'downloading' : 'not_installed';
                         
    set({
      modelStatus: status,
      localModelStatus: legacyStatus // 互換性
    });
  },
  
  // 互換性のための関数
  setLocalModelStatus: (status) => {
    const mappedStatus = status === 'not_installed' ? 'not_downloaded' as ModelStatus : 
                         status === 'ready' ? 'ready' as ModelStatus : 
                         status === 'downloading' ? 'downloading' as ModelStatus : 'not_downloaded' as ModelStatus;
    set({
      modelStatus: mappedStatus,
      localModelStatus: status
    });
  },
  
  // ダウンロード進捗設定
  setDownloadProgress: (progress) => {
    set({
      downloadProgress: progress
    });
  },
  
  // エラーメッセージ設定
  setErrorMessage: (message) => {
    set({
      errorMessage: message
    });
  },
  
  // パス設定（互換性用）
  setLocalModelPath: (path) => {
    set({
      modelPath: path,
      localModelPath: path
    });
  },
  
  // 日次使用回数増加
  incrementUsageCount: () => {
    set(state => ({
      dailyUsageCount: state.dailyUsageCount + 1,
    }));
  },
  
  // 使用制限チェック
  checkDailyUsageLimit: () => {
    const state = get();
    const today = new Date().toISOString().split('T')[0];

    // 日付が変わっていたらリセット
    if (state.usageResetDate !== today) {
      set({
        dailyUsageCount: 0,
        usageResetDate: today,
      });
      return true; // 制限内
    }

    // プラン別の制限チェック
    // Premiumは無制限
    if (state.dailyUsageLimit === Number.MAX_SAFE_INTEGER) {
      return true;
    }

    // 制限チェック
    return state.dailyUsageCount < state.dailyUsageLimit;
  },
  
  // プラン別の使用制限更新
  updateUsageLimitByPlan: (plan) => {
    const limits: Record<string, number> = {
      free: 50,
      lite: 500,
      premium: Number.MAX_SAFE_INTEGER, // 実質無制限
    };

    set({
      dailyUsageLimit: limits[plan] || limits.free,
    });
  },
});

export default createLocalModelSlice;
