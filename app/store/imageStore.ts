import { StateCreator } from 'zustand';
import { StoreState } from './index';
import { generateImage as apiGenerateImage } from '../services/api';
import { UserPlan } from './userStore';

// モック用の画像URL（実装初期段階で使用）
const MOCK_IMAGES = [
  'https://images.unsplash.com/photo-1682687982502-1529b3b4951a',
  'https://images.unsplash.com/photo-1682685797769-481b48222608',
  'https://images.unsplash.com/photo-1686937871119-a9f2f2ecd610'
];

// プラン別クォータ設定
const QUOTA_LIMITS = {
  free: { sdxl: 5, dalle: 0 },
  lite: { sdxl: 15, dalle: 1 },
  premium: { sdxl: 50, dalle: 5 },
};

export interface ImageQuota {
  total: number;
  used: number;
  remaining: number;
  resetDate: string; // ISO日付文字列
}

export interface GeneratedImage {
  id: string;
  url: string;
  prompt: string;
  model: 'sdxl' | 'dalle';
  createdAt: string;
  chatId?: string;
}

export interface ImageState {
  // 画像生成クォータ
  sdxlQuota: ImageQuota;
  dalleQuota: ImageQuota;

  // 画像生成履歴
  generatedImages: GeneratedImage[];

  // UI状態
  isGenerating: boolean;
  generationError: string | null;

  // アクション
  generateImage: (params: {
    prompt: string;
    size: string;
    quality: string;
    model: 'sdxl' | 'dalle';
    chatId?: string;
  }) => Promise<string>;

  incrementImageUsage: (model: 'sdxl' | 'dalle') => void;
  resetDailyQuotas: () => void;
  addGeneratedImage: (image: {
    url: string;
    prompt: string;
    model: 'sdxl' | 'dalle';
    chatId?: string;
  }) => string;
  
  // 画像生成のモック版（開発用）
  generateImageMock: (params: {
    prompt: string;
    model: 'sdxl' | 'dalle';
    chatId?: string;
  }) => Promise<string>;
}

export const createImageSlice: StateCreator<
  StoreState,
  [],
  [],
  ImageState
> = (set, get) => ({
  // クォータ初期状態
  sdxlQuota: {
    total: 5, // Freeプランのデフォルト
    used: 0,
    remaining: 5,
    resetDate: new Date(new Date().setHours(0, 0, 0, 0) + 24 * 60 * 60 * 1000).toISOString(),
  },

  dalleQuota: {
    total: 0, // Freeプランのデフォルト
    used: 0,
    remaining: 0,
    resetDate: new Date(new Date().setHours(0, 0, 0, 0) + 24 * 60 * 60 * 1000).toISOString(),
  },

  // その他の初期状態
  generatedImages: [],
  isGenerating: false,
  generationError: null,

  // 画像生成（実装後のAPI版）
  generateImage: async ({ prompt, size, quality, model, chatId }) => {
    const { sdxlQuota, dalleQuota } = get();

    // クォータチェック
    if (model === 'dalle' && dalleQuota.remaining <= 0) {
      // DALL-Eクォータ超過時はSDXLにフォールバック
      model = 'sdxl';
    }

    if (model === 'sdxl' && sdxlQuota.remaining <= 0) {
      throw new Error('本日の画像生成回数上限に達しました');
    }

    try {
      set({ isGenerating: true, generationError: null });

      // 実際のAPIを呼び出し
      const imageUrl = await apiGenerateImage({
        prompt,
        size,
        quality,
        model
      });

      // 生成履歴に追加
      get().addGeneratedImage({
        url: imageUrl,
        prompt,
        model,
        chatId,
      });

      // 使用カウント増加
      get().incrementImageUsage(model);
      
      // ユーザーストアの画像生成カウントも増加
      get().incrementImageGenCount();

      return imageUrl;
    } catch (error: any) {
      set({ generationError: error.message });
      throw error;
    } finally {
      set({ isGenerating: false });
    }
  },

  // モック画像生成（開発用）
  generateImageMock: async ({ prompt, model, chatId }) => {
    // 生成中の演出のため少し待機
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // ランダムなモック画像を返す
    const randomIndex = Math.floor(Math.random() * MOCK_IMAGES.length);
    const imageUrl = MOCK_IMAGES[randomIndex];

    return imageUrl;
  },

  // 使用量カウンター更新
  incrementImageUsage: (model) => {
    if (model === 'dalle') {
      set(state => ({
        dalleQuota: {
          ...state.dalleQuota,
          used: state.dalleQuota.used + 1,
          remaining: Math.max(0, state.dalleQuota.remaining - 1),
        }
      }));
    } else {
      set(state => ({
        sdxlQuota: {
          ...state.sdxlQuota,
          used: state.sdxlQuota.used + 1,
          remaining: Math.max(0, state.sdxlQuota.remaining - 1),
        }
      }));
    }
  },

  // クォータリセット（日次）
  resetDailyQuotas: () => {
    // ユーザーストアからプランを取得
    const userPlan = get().plan || 'free';
    
    // プラン別クォータ設定から制限を取得
    const quotas = QUOTA_LIMITS;

    const resetDate = new Date(new Date().setHours(0, 0, 0, 0) + 24 * 60 * 60 * 1000).toISOString();

    set({
      sdxlQuota: {
        total: quotas[userPlan].sdxl,
        used: 0,
        remaining: quotas[userPlan].sdxl,
        resetDate,
      },
      dalleQuota: {
        total: quotas[userPlan].dalle,
        used: 0,
        remaining: quotas[userPlan].dalle,
        resetDate,
      },
    });
    
    // ユーザーストアの画像生成カウントもリセット
    get().resetImageGenCount();
  },

  // 生成履歴に追加
  addGeneratedImage: ({ url, prompt, model, chatId }) => {
    const id = `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    set((state) => ({
      generatedImages: [
        {
          id,
          url,
          prompt,
          model,
          chatId,
          createdAt: new Date().toISOString(),
        },
        ...state.generatedImages,
      ].slice(0, 100), // 最新100件のみ保持
    }));

    return id;
  },
}); 