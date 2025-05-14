import * as FileSystem from 'expo-file-system';
import { showToast } from '../utils/toast';
import { Platform, NativeModules } from 'react-native';
import { QWEN3_TEMPLATE, QWEN3_SAMPLING, formatPrompt } from '../constants/promptTemplates';

// ネイティブモジュールが利用可能かチェック
let llamaRnModule: any = null;
let isNativeModuleAvailable = false;

try {
  // 動的にモジュールをインポート
  llamaRnModule = require('llama.rn');
  isNativeModuleAvailable = true;
  console.log('llama.rnモジュールを読み込みました');
} catch (error) {
  console.log('llama.rnモジュールを読み込めませんでした (Expo Goでは正常な挙動です)');
  isNativeModuleAvailable = false;
}

// 型定義
export type LlamaContext = {
  completion: (params: any) => Promise<any>;
} | null;

type LlamaContextParams = any;
type LlamaCompletionParams = any;

/**
 * Qwen3モデルをロードする関数
 * @returns LlamaContext | null
 */
export const loadQwenModel = async (): Promise<LlamaContext | null> => {
  // 開発モードの場合はダミー実装を返す
  if (!isNativeModuleAvailable) {
    console.log('開発モード: ダミーのLlamaContextを提供');
    return getMockLlamaContext();
  }

  try {
    const modelPath = `${FileSystem.documentDirectory}models/Qwen3-4B-Q4_K_M.gguf`;
    
    // ファイル存在確認
    const fileInfo = await FileSystem.getInfoAsync(modelPath);
    if (!fileInfo.exists) {
      throw new Error('モデルファイルが見つかりません。');
    }
    
    // デバイスに適したパラメータを取得
    const { nThreads, nBatch } = getOptimalModelParams();
    
    // モデルロード
    const { initLlama } = llamaRnModule;
    const ctx = await initLlama({
      path: 'file://' + modelPath,
      nCtx: 32768,     // コンテキストウィンドウサイズ（32Kトークン対応）
      nThreads,        // デバイスに最適化されたスレッド数
      nBatch,          // デバイスに最適化されたバッチサイズ
      ropeFreqBase: 10000,  // RoPE周波数ベース
      ropeFreqScale: 0.5,   // スケーリング係数
    } as LlamaContextParams);

    return ctx;
  } catch (error: unknown) {
    // エラー処理
    console.error('Qwenモデルロードエラー:', error);

    // メモリ不足エラーの場合はクラウドモデルへの切替えを推奨
    if (error instanceof Error && (error.message.includes('LLAMA_NOMEM') || error.message.includes('memory'))) {
      showToast('メモリ不足のためローカルモデルを読み込めません。クラウドモデルに切り替えます。');
    } else {
      showToast('ローカルモデルを読み込めません。クラウドモデルに切り替えます。');
    }

    return null;
  }
};

/**
 * ローカルモデルで推論を実行する関数
 * @param ctx LlamaContext
 * @param prompt プロンプト
 * @param options 生成オプション
 * @param onToken トークン生成コールバック
 * @param onComplete 完了コールバック
 */
export const generateWithLocalModel = async (
  ctx: LlamaContext,
  prompt: string,
  options: {
    maxTokens?: number;
    temperature?: number;
    topP?: number;
    topK?: number;
    repeatPenalty?: number;
  } = {},
  onToken?: (token: string) => void,
  onComplete?: (fullText: string) => void
): Promise<string> => {
  // 開発モードまたはcontextがnullの場合
  if (!isNativeModuleAvailable || !ctx) {
    return generateWithMockModel(prompt, options, onToken, onComplete);
  }

  try {
    // Qwen3の推奨パラメータをデフォルト値として使用し、必要に応じてオーバーライド
    const {
      maxTokens = QWEN3_SAMPLING.max_tokens,
      temperature = QWEN3_SAMPLING.temperature,
      topP = QWEN3_SAMPLING.top_p,
      topK = QWEN3_SAMPLING.top_k,
      repeatPenalty = QWEN3_SAMPLING.repeat_penalty
    } = options;

    // 推論実行
    let fullText = '';
    await ctx.completion({
      prompt,
      n_predict: maxTokens,
      temp: temperature,
      top_p: topP,
      top_k: topK,
      repeat_penalty: repeatPenalty,
      stream: true,
      onToken: (token: string) => {
        fullText += token;
        if (onToken) onToken(token);
      }
    } as LlamaCompletionParams);

    if (onComplete) onComplete(fullText);
    return fullText;
  } catch (error) {
    console.error('ローカルモデル推論エラー:', error);
    throw error;
  }
};

/**
 * モックLlamaContextを取得（開発環境用）
 * @returns モックLlamaContext
 */
const getMockLlamaContext = (): LlamaContext => {
  return {
    completion: async (params: any) => {
      console.log('モックモデル: completion関数が呼び出されました');
      
      if (params.onToken && typeof params.onToken === 'function') {
        // トークン送信をシミュレート
        const mockResponse = 'これはモック応答です。実際のローカルモデルはEAS開発ビルドでのみ動作します。アプリケーションフローをテストするための応答メッセージです。';
        const tokens = mockResponse.split(' ');
        
        for (const token of tokens) {
          await new Promise(resolve => setTimeout(resolve, 100)); // 遅延
          params.onToken(token + ' ');
        }
      }
      
      return {
        text: '開発モード: ローカルモデルはビルドされたアプリでのみ動作します。'
      };
    }
  };
};

/**
 * モックモデルで推論を実行する関数（開発環境用）
 */
const generateWithMockModel = async (
  prompt: string,
  options: any = {},
  onToken?: (token: string) => void,
  onComplete?: (fullText: string) => void
): Promise<string> => {
  console.log('モック推論を実行:', prompt.substring(0, 50) + '...');
  
  const mockResponse = '[開発モード] これはモック応答です。実際のローカルモデル推論はEASビルドでのみ利用可能です。\n\n' +
    'あなたの入力: "' + prompt.substring(0, 30) + '..."';
  
  if (onToken) {
    // トークン生成をシミュレート
    const words = mockResponse.split(' ');
    for (const word of words) {
      await new Promise(r => setTimeout(r, 100));
      onToken(word + ' ');
    }
  }
  
  if (onComplete) onComplete(mockResponse);
  return mockResponse;
};

/**
 * ローカルモデルにQwen3プロンプトテンプレートを適用する関数
 * @param systemMessage システムメッセージ
 * @param chatHistory チャット履歴
 * @param userPrompt ユーザープロンプト
 * @returns フォーマット済みプロンプト
 */
export const formatQwen3Prompt = (
  systemMessage: string,
  chatHistory: { role: 'user' | 'assistant', content: string }[],
  userPrompt: string
): string => {
  // 共通のフォーマット関数を使用
  return formatPrompt(QWEN3_TEMPLATE, systemMessage, chatHistory, userPrompt);
};

/**
 * デバイスのメモリに基づいて最適なモデルパラメータを取得
 * @returns モデルパラメータ
 */
export const getOptimalModelParams = (): { nThreads: number, nBatch: number } => {
  // デフォルト値
  let nThreads = 4;
  let nBatch = 512;

  // プラットフォーム固有の最適化
  if (Platform.OS === 'ios') {
    // iOSデバイスの場合
    // 注：iOSでは直接メモリ情報を取得できないため、デバイスモデルに基づいて推定
    // 実際の実装では、ネイティブモジュールを通じて取得か、デバイスモデルから推定
    
    try {
      // 簡易的な推定（実際にはもっと正確な方法が必要）
      const deviceId = Platform.Version;
      
      // iPhoneのバージョンから推定（大雑把な例）
      if (parseInt(String(deviceId), 10) >= 15) {
        // iPhone 13/14シリーズ以降と仮定
        nThreads = 6;
        nBatch = 768;
      } else if (parseInt(String(deviceId), 10) >= 13) {
        // iPhone 11/12シリーズと仮定
        nThreads = 4;
        nBatch = 512;
      } else {
        // それ以前の機種
        nThreads = 2;
        nBatch = 256;
      }
    } catch (error) {
      console.warn('iOS デバイス検出エラー', error);
    }
  } else if (Platform.OS === 'android') {
    // Androidデバイスの場合
    try {
      // Androidの場合、ActivityManagerから取得を試みる（モックアップ）
      // 実際の実装では、ネイティブモジュールを通じて正確に取得する
      
      // 仮の実装として、デバイス性能に基づく推定
      const { maxMemory } = NativeModules.Llama || { maxMemory: 0 };
      const memoryGB = maxMemory > 0 ? maxMemory / (1024 * 1024 * 1024) : 0;
      
      if (memoryGB >= 6) {
        nThreads = 6;
        nBatch = 768;
      } else if (memoryGB >= 4) {
        nThreads = 4;
        nBatch = 512;
      } else if (memoryGB >= 3) {
        nThreads = 2;
        nBatch = 256;
      } else {
        nThreads = 1;
        nBatch = 128;
      }
    } catch (error) {
      console.warn('デバイスメモリ取得エラー、デフォルト値を使用します', error);
    }
  }

  // CPU論理コア数に基づいてスレッド数を調整（オプション）
  // const cpuCount = navigator?.hardwareConcurrency || 2;
  // nThreads = Math.min(nThreads, cpuCount - 1);

  console.log(`デバイス最適化パラメータ: nThreads=${nThreads}, nBatch=${nBatch}`);
  return { nThreads, nBatch };
};

/**
 * ネイティブモジュールが利用可能かどうかを返す
 * @returns 利用可能かどうか
 */
export const isLocalModelAvailable = (): boolean => {
  return isNativeModuleAvailable;
}; 