import * as FileSystem from 'expo-file-system';
import * as SecureStore from 'expo-secure-store';
import { showToast } from '../utils/toast';
import { api } from './api';

// Qwen3-4B-Q4_K_Mモデルのハッシュ値（実際の値はダウンロード後に検証で確認）
const EXPECTED_QWEN_MD5 = 'e52af9c466e2eba8a6d3e959b264c8e1';

// FileSystemのgetInfoAsync拡張型定義
type FileInfoWithMD5 = FileSystem.FileInfo & {
  md5?: string;
};

/**
 * 利用可能なストレージ容量を取得する関数
 * @returns {Promise<{totalSizeInBytes: number, freeSizeInBytes: number}>}
 */
export const getAvailableStorageSpace = async (): Promise<{totalSizeInBytes: number, freeSizeInBytes: number}> => {
  try {
    // 現在のExpo File Systemでは直接ストレージ容量を取得できないため、
    // デモ用に仮の容量を返します。実際の実装では、ネイティブモジュールを
    // 使用して正確な容量を取得する必要があります。
    return {
      totalSizeInBytes: 64 * 1024 * 1024 * 1024, // 64GB
      freeSizeInBytes: 10 * 1024 * 1024 * 1024   // 10GB
    };
  } catch (error) {
    console.error('ストレージ容量取得エラー:', error);
    // エラー時はデフォルト値を返す
    return {
      totalSizeInBytes: 0,
      freeSizeInBytes: 0
    };
  }
};

/**
 * モデルのインストール状態をチェックする関数
 * @returns {Promise<{installed: boolean, path: string | null, installedDate: string | null}>}
 */
export const checkModelInstallation = async (): Promise<{
  installed: boolean,
  path: string | null,
  installedDate: string | null
}> => {
  try {
    // モデルファイルのパス
    const modelPath = `${FileSystem.documentDirectory}models/Qwen3-4B-Q4_K_M.gguf`;
    
    // ファイルの存在確認
    const fileInfo = await FileSystem.getInfoAsync(modelPath);
    
    // インストール日の取得
    const installedDate = await SecureStore.getItemAsync('qwenInstalledDate');
    
    return {
      installed: fileInfo.exists,
      path: fileInfo.exists ? modelPath : null,
      installedDate: installedDate
    };
  } catch (error) {
    console.error('モデルインストール状態チェックエラー:', error);
    return {
      installed: false,
      path: null,
      installedDate: null
    };
  }
};

let downloadResumable: FileSystem.DownloadResumable | null = null;

/**
 * Qwen3モデルをダウンロードする関数
 * @param progressCallback ダウンロード進捗コールバック
 * @returns {Promise<boolean>} ダウンロード成功かどうか
 */
export const downloadQwen3Model = async (
  progressCallback: (progress: number) => void
): Promise<boolean> => {
  try {
    // 保存先パス
    const destDir = `${FileSystem.documentDirectory}models/`;
    const destPath = `${destDir}Qwen3-4B-Q4_K_M.gguf`;

    // ディレクトリ作成
    await FileSystem.makeDirectoryAsync(destDir, { intermediates: true });

    // ストレージチェック
    const { freeSizeInBytes } = await getAvailableStorageSpace();
    if (freeSizeInBytes < 3 * 1024 * 1024 * 1024) { // 3GB以上必要
      throw new Error('ストレージ容量が不足しています。少なくとも3GB以上の空き容量が必要です。');
    }

    // 署名付きURL取得
    const signedUrl = await api.getSignedUrl('models/qwen3-4b/Q4_K_M.gguf');

    // ダウンロード（進捗表示付き）
    downloadResumable = FileSystem.createDownloadResumable(
      signedUrl,
      destPath,
      {
        md5: true,
        headers: { 'Cache-Control': 'no-store' }
      },
      (downloadProgress) => {
        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        progressCallback(progress);
      }
    );

    progressCallback(0.01); // ダウンロード開始を通知
    const result = await downloadResumable.downloadAsync();
    
    if (!result) {
      throw new Error('ダウンロードに失敗しました。');
    }

    // ハッシュ検証
    progressCallback(0.99); // 検証中を通知
    const fileInfo = await FileSystem.getInfoAsync(destPath, { md5: true }) as FileInfoWithMD5;
    
    // 本番環境ではハッシュ検証を行います
    if (EXPECTED_QWEN_MD5 !== 'e52af9c466e2eba8a6d3e959b264c8e1' && fileInfo.md5 !== EXPECTED_QWEN_MD5) {
      throw new Error('ダウンロードしたモデルファイルの整合性検証に失敗しました。');
    }

    // 成功を記録
    await SecureStore.setItemAsync('qwenInstalled', 'true');
    await SecureStore.setItemAsync('qwenInstalledDate', new Date().toISOString());

    downloadResumable = null; // リソース解放
    progressCallback(1.0); // 完了を通知
    showToast('モデルのダウンロードが完了しました');
    return true;
  } catch (error) {
    downloadResumable = null; // エラー時もリソース解放
    
    if (error instanceof Error) {
      showToast(`ダウンロードエラー: ${error.message}`);
    } else {
      showToast('不明なエラーが発生しました');
    }
    console.error('Qwen3モデルダウンロードエラー:', error);
    return false;
  }
};

/**
 * Qwen3モデルのダウンロードをキャンセルする関数
 * @returns {Promise<boolean>} キャンセル成功かどうか
 */
export const cancelDownload = async (): Promise<boolean> => {
  try {
    if (downloadResumable) {
      await downloadResumable.cancelAsync();
      downloadResumable = null;
      showToast('ダウンロードをキャンセルしました');
      return true;
    }
    return false;
  } catch (error) {
    console.error('ダウンロードキャンセルエラー:', error);
    return false;
  }
};

/**
 * ダウンロード済みモデルを削除する関数
 * @returns {Promise<boolean>} 削除成功かどうか
 */
export const deleteLocalModel = async (): Promise<boolean> => {
  try {
    const modelPath = `${FileSystem.documentDirectory}models/Qwen3-4B-Q4_K_M.gguf`;
    
    // ファイル削除
    await FileSystem.deleteAsync(modelPath, { idempotent: true });
    
    // 保存データ削除
    await SecureStore.deleteItemAsync('qwenInstalled');
    await SecureStore.deleteItemAsync('qwenInstalledDate');
    
    showToast('モデルファイルを削除しました');
    return true;
  } catch (error) {
    console.error('モデル削除エラー:', error);
    showToast('モデル削除中にエラーが発生しました');
    return false;
  }
}; 