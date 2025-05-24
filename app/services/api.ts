import { MODELS } from '../constants/models';
// import { storageClient } from './supabaseStorage'; // remove until actually needed
import Constants from 'expo-constants';

// Supabase Edge FunctionのURL
const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl!;
const SUPABASE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/openrouter-proxy`;
const SUPABASE_IMAGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/fal-image-generator`;
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.supabaseAnonKey!;

// 画像生成API用のエンドポイント
// ⚠️注: すべてのAPIキーはSupabase Edge Functionで管理するため
// クライアント側から削除しています

export type ChatMessage = {
  role: 'user' | 'assistant' | 'system';
  content: string;
};

export type ChatCompletionRequest = {
  messages: ChatMessage[];
  model: string;
  stream?: boolean;
  max_tokens?: number;
  temperature?: number;
};

export type ChatCompletionResponse = {
  id: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type ChatCompletionChunk = {
  id: string;
  choices: {
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }[];
  model: string;
};

export type ImageGenerationResponse = {
  url?: string;
  dataUrl?: string;
  contentType?: string;
  images?: Array<{
    url: string;
    width: number;
    height: number;
    content_type: string;
  }>;
  image?: {
    url: string;
    width: number;
    height: number;
    content_type: string;
  };
  stored?: boolean;
  expiry?: number;
  expiryDate?: string;
};

/**
 * Normalizes model ID to the format expected by OpenRouter
 * @param modelId Raw model ID
 * @returns Normalized model ID
 */
const normalizeModelId = (modelId: string): string => {
  if (modelId.includes('/')) {
    return modelId;
  }
  
  const modelInfo = MODELS.find(m => 
    m.id === modelId || 
    m.name.toLowerCase() === modelId.toLowerCase()
  );
  
  if (modelInfo && modelInfo.id.includes('/')) {
    return modelInfo.id;
  }
  
  if (modelId.startsWith('gpt-')) {
    return `openai/${modelId}`;
  }
  
  // ショートハンド表記のサポート
  if (modelId === '4o-mini' || modelId === 'gpt-4o-mini') {
    return 'openai/gpt-4o-mini';
  }
  
  if (modelId === '4.1-mini' || modelId === 'gpt-4.1-mini') {
    return 'openai/gpt-4.1-mini';
  }
  
  if (modelId === '4.1-nano' || modelId === 'gpt-4.1-nano') {
    return 'openai/gpt-4.1-nano';
  }
  
  return `openai/${modelId}`;
};

/**
 * ネットワークエラー時の再試行ロジック
 * リトライ間隔を指数バックオフで増加させる
 * @param fn 実行する関数
 * @param maxRetries 最大再試行回数
 */
const withNetworkRetry = async <T>(
  fn: () => Promise<T>, 
  maxRetries = 3
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // 最初の試行または再試行
      if (attempt > 0) {
        // 指数バックオフ（最初は500ms、次は1000ms、2000ms...）
        const delay = Math.min(500 * Math.pow(2, attempt - 1), 10000);
        console.log(`リトライ ${attempt}/${maxRetries}... ${delay}ms後`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
      
      return await fn();
    } catch (error: any) {
      console.error(`試行 ${attempt + 1}/${maxRetries + 1} 失敗:`, error.message || error);
      lastError = error;
      
      // Network request failedエラーを明示的に検知してログ出力
      if (error.message && error.message.includes('Network request failed')) {
        console.error('Network request failed検出: Supabase Edge Functionへの接続が一時的に失敗しました');
        // ネットワークエラーは再試行対象なので続行
      }
      // 永続的なエラーの場合は即時終了（再試行しない）
      else if (
        // 401/403はJWT認証の問題、402は支払い問題など、再試行しても解決しない
        error.status === 401 || 
        error.status === 402 ||
        error.status === 403 ||
        // 400はリクエスト形式の問題
        error.status === 400
      ) {
        console.error('永続的なエラー、再試行をスキップします:', error);
        break;
      }
    }
  }
  
  // すべての再試行が失敗した場合、最後のエラーをスロー
  throw lastError;
};

/**
 * Fetches a completion from the OpenRouter API via Supabase Edge Function
 * @param messages Array of chat messages
 * @param modelId Model ID to use
 * @param onChunk Optional callback for streaming responses
 * @returns Promise with the response text
 */
export const fetchChatCompletion = async (
  messages: ChatMessage[],
  modelId: string,
  onChunk?: (chunk: string) => void
): Promise<string> => {
  try {
    if (modelId === 'qwen3-4b-local') {
      return 'ローカルモデルの応答がここに表示されます。実際のモデルがインストールされると、リアルタイムで応答が生成されます。';
    }

    const actualModelId = normalizeModelId(modelId);
    
    console.log(`API Request via Supabase - Original Model: ${modelId}, Normalized: ${actualModelId}`);
    
    let processedMessages = JSON.parse(JSON.stringify(messages)) as ChatMessage[];
    
    const systemMessageIndex = processedMessages.findIndex(m => m.role === 'system');
    
    // モデル情報を取得
    const modelInfo = MODELS.find(m => m.id === modelId || m.id === actualModelId);
    
    // モデルの推奨用途を決定する関数
    const getRecommendedUseCase = (model: typeof modelInfo) => {
      if (!model) return '一般的な質問応答';
      
      if (model.isLocal) {
        return 'オフライン環境での利用、プライバシーを重視する質問';
      }
      
      if (model.contextLength >= 100000) {
        return '長文の分析、複雑な文脈を必要とする質問';
      } else if (model.contextLength >= 32000) {
        return '中程度の複雑さの質問、複数の文脈を含む会話';
      } else {
        return '一般的な質問応答、短い会話';
      }
    };
    
    // モデル情報を含むシステムプロンプトを作成
    const getEnhancedSystemPrompt = () => {
      let basePrompt = `あなたは丁寧で信頼性の高いAIアシスタントです。以下のガイドラインに従って応答してください：

1. 必ず日本語で回答してください。
2. 敬語を適切に使用し、丁寧な口調を維持してください。
3. 正確な情報を提供するよう努め、不確かな場合はその旨を明示してください。
4. 専門用語を使う場合は、わかりやすい説明を添えてください。
5. 質問の意図が不明確な場合は、丁寧に確認してください。
6. 複雑な質問には段階的に説明し、要点を明確にしてください。
7. ユーザーの問題解決に役立つ具体的な情報やアドバイスを提供してください。
8. 文化的背景や価値観に配慮した応答を心がけてください。

日本語のニュアンスについて:
- 「〜と思います」「〜かもしれません」などの表現を適切に使って、断定的すぎない表現を心がけてください。
- 質問の文脈に応じて、カジュアルさと丁寧さのバランスを調整してください。
- 説明が長くなる場合は、「まず〜」「次に〜」「最後に〜」など、構造化された説明を心がけてください。
- 専門的な説明には、できるだけ日常的な例えを用いて理解を助けてください。

よくある質問パターンへの対応:
- 「〜とは？」→定義と例を簡潔に説明してください。
- 「〜の違いは？」→比較表やポイントを箇条書きで示してください。
- 「〜のやり方」→具体的な手順を段階的に説明してください。
- 「おすすめは？」→複数の選択肢と各々の特徴を提示してください。
- 「〜について教えて」→基本情報から詳細へと段階的に説明してください。

自分自身について質問された場合:
あなたはAIアシスタントであり、感情や意識は持ちませんが、ユーザーの役に立つために設計されていることを丁寧に説明してください。自分の能力と限界について正直に伝えてください。`;
      
      if (modelInfo) {
        basePrompt += `\n\nあなたの技術情報:
- モデル名: ${modelInfo.name}
- 説明: ${modelInfo.description}
- コンテキスト長: ${modelInfo.contextLength.toLocaleString()}トークン
- プロバイダー: ${modelInfo.provider || 'OpenRouter'}
- 利用制限: ${modelInfo.dailyLimit ? `1日${modelInfo.dailyLimit}回まで` : '制限なし'}
- 実行環境: ${modelInfo.isLocal ? 'デバイス上（オフライン）' : 'クラウド上（オンライン）'}
- 推奨用途: ${getRecommendedUseCase(modelInfo)}`;
      }
      
      return basePrompt;
    };
    
    if (systemMessageIndex === -1) {
      processedMessages.unshift({
        role: 'system',
        content: getEnhancedSystemPrompt()
      });
      console.log('Added enhanced system message with model info');
    } 
    else if (systemMessageIndex > 0) {
      // 既存のシステムメッセージがある場合は先頭に移動
      const systemMessage = processedMessages.splice(systemMessageIndex, 1)[0];
      processedMessages.unshift(systemMessage);
      console.log('Moved system message to first position');
    }
    else {
      // 既存のシステムメッセージがある場合でも、モデル情報を付加する
      const existingSystemMsg = processedMessages[0];
      if (!existingSystemMsg.content.includes("あなたの情報:") && modelInfo) {
        existingSystemMsg.content = getEnhancedSystemPrompt();
        console.log('Updated system message with model info');
      }
    }
    
    if (__DEV__) {
      console.log('First message role:', processedMessages[0].role);
      console.log('Last message role:', processedMessages[processedMessages.length - 1].role);
      console.log('Last message content:', processedMessages[processedMessages.length - 1].content.substring(0, 30));
    }
    
    const body = {
      messages: processedMessages,
      model: actualModelId,
      stream: false,
      max_tokens: 1000,
      temperature: 0.7,
    };
    
    // ネットワークリトライロジックを適用
    return await withNetworkRetry(async () => {
      // タイムアウト処理を追加
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒タイムアウト
      
      try {
        console.log('Sending request to Supabase Edge Function...');
        
        // Edge Functionを使った方法（JWT認証用Authorization付き）
        const response = await fetch(SUPABASE_FUNCTION_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            // キャッシュ制御ヘッダーの追加
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
          body: JSON.stringify(body),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        console.log('API Response status:', response.status);
        
        // レスポンスが正常でない場合
        if (!response.ok) {
          let errorText = '';
          try {
            errorText = await response.text();
          } catch (e) {
            errorText = 'レスポンステキスト取得エラー';
          }
          
          console.error(`API error (${response.status}):`, errorText);
          
          // エラーオブジェクトを作成
          const error: any = new Error(`API error: ${response.status}`);
          error.status = response.status;
          error.body = errorText;
          
          try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.error) {
              error.message = `エラー: ${errorJson.error}`;
            }
          } catch (e) {
            // JSON解析エラー - テキストをそのまま使用
          }
          
          throw error;
        }

        // レスポンスデータを取得
        const data = await response.json();
        
        if (!data || !data.choices || data.choices.length === 0) {
          console.error('Invalid API response format:', data);
          return 'APIからの応答が無効です。';
        }
        
        const content = data.choices[0]?.message?.content || '';
        
        if (!content) {
          console.error('Empty content in API response:', data);
          return 'APIからの応答が空です。';
        }
        
        console.log(`API Response received - Length: ${content.length}`);
        
        if (__DEV__) {
          console.log(`Response preview: ${content.substring(0, 50)}...`);
        }
        
        if (onChunk && content) {
          onChunk(content);
        }
        
        return content;
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          const error: any = new Error('APIリクエストがタイムアウトしました。');
          error.status = 408; // Request Timeout
          throw error;
        }
        
        console.error('Error when calling Edge Function:', fetchError);
        throw fetchError;
      }
    }, 3);
  } catch (error) {
    console.error('Error in fetchChatCompletion:', error);
    
    if (error instanceof Error) {
      return `エラーが発生しました: ${error.message}`;
    }
    
    return 'エラーが発生しました。ネットワーク接続を確認して、もう一度お試しください。';
  }
};

/**
 * 画像生成API - fal.ai FLUX経由
 * Text to Image、Image to Image、Upscalerの3つの機能を提供
 * 
 * すべてのAPIキー処理はSupabase Edge Function側で行い
 * クライアント側ではAPIキーを保持しない安全な実装
 */

// Text to Image generation using FLUX.1 [schnell]
export const generateTextToImage = async ({
  prompt,
  imageSize = 'landscape_4_3',
  numInferenceSteps = 4,
  seed,
  userId
}: {
  prompt: string;
  imageSize?: 'square_hd' | 'square' | 'portrait_4_3' | 'portrait_16_9' | 'landscape_4_3' | 'landscape_16_9';
  numInferenceSteps?: number;
  seed?: number;
  userId?: string;
}): Promise<string> => {
  try {
    console.log(`Text-to-Image generation request - Size: ${imageSize}, Steps: ${numInferenceSteps}`);

    return await withNetworkRetry(async () => {
      const response = await fetch(SUPABASE_IMAGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({
          operation: 'text-to-image',
          prompt,
          user_id: userId,
          image_size: imageSize,
          num_inference_steps: numInferenceSteps,
          seed
        }),
      });

      console.log(`Text-to-Image API response status: ${response.status}`);
      
      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = 'レスポンステキスト取得エラー';
        }
        
        console.error('Text-to-Image API Error:', errorText);
        
        const error: any = new Error(`Text-to-Image generation failed (${response.status})`);
        error.status = response.status;
        error.body = errorText;
        
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error) {
            error.message = errorJson.error;
          }
          if (errorJson.limit && response.status === 429) {
            error.message = `1日の制限枚数（${errorJson.limit}枚）に達しました。明日再度お試しください。`;
          }
        } catch (jsonError) {
          // JSON解析エラー - テキストをそのまま使用
        }
        
        throw error;
      }

      const data = await response.json() as ImageGenerationResponse;
      
      if (!data || !data.images || data.images.length === 0) {
        console.error('Invalid API response format:', data);
        throw new Error('APIからの応答が無効です');
      }
      
      const result = data.images[0].url;
      if (__DEV__) {
        console.log('Text-to-Image generation success:', (result.length > 80 ? result.slice(0, 80) + '...' : result));
      }
      return result;
    }, 3);
  } catch (error: unknown) {
    console.error('Text-to-Image generation final error:', error);
    if (error instanceof Error) {
      throw new Error(error.message || 'Text-to-Image generation failed');
    }
    throw new Error('Text-to-Image generation failed');
  }
};

// Image to Image generation using FLUX.1 [dev] Redux
export const generateImageToImage = async ({
  prompt,
  imageUrl,
  strength = 0.8,
  numInferenceSteps = 28,
  guidanceScale = 3.5,
  seed,
  userId
}: {
  prompt: string;
  imageUrl: string;
  strength?: number;
  numInferenceSteps?: number;
  guidanceScale?: number;
  seed?: number;
  userId?: string;
}): Promise<string> => {
  try {
    console.log(`Image-to-Image generation request - Strength: ${strength}, Steps: ${numInferenceSteps}`);

    return await withNetworkRetry(async () => {
      const response = await fetch(SUPABASE_IMAGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({
          operation: 'image-to-image',
          prompt,
          image_url: imageUrl,
          user_id: userId,
          strength,
          num_inference_steps: numInferenceSteps,
          guidance_scale: guidanceScale,
          seed
        }),
      });

      console.log(`Image-to-Image API response status: ${response.status}`);
      
      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = 'レスポンステキスト取得エラー';
        }
        
        console.error('Image-to-Image API Error:', errorText);
        
        const error: any = new Error(`Image-to-Image generation failed (${response.status})`);
        error.status = response.status;
        error.body = errorText;
        
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error) {
            error.message = errorJson.error;
          }
          if (errorJson.limit && response.status === 429) {
            error.message = `1日の制限枚数（${errorJson.limit}枚）に達しました。明日再度お試しください。`;
          }
        } catch (jsonError) {
          // JSON解析エラー - テキストをそのまま使用
        }
        
        throw error;
      }

      const data = await response.json() as ImageGenerationResponse;
      
      if (!data || !data.images || data.images.length === 0) {
        console.error('Invalid API response format:', data);
        throw new Error('APIからの応答が無効です');
      }
      
      const result = data.images[0].url;
      if (__DEV__) {
        console.log('Image-to-Image generation success:', (result.length > 80 ? result.slice(0, 80) + '...' : result));
      }
      return result;
    }, 3);
  } catch (error: unknown) {
    console.error('Image-to-Image generation final error:', error);
    if (error instanceof Error) {
      throw new Error(error.message || 'Image-to-Image generation failed');
    }
    throw new Error('Image-to-Image generation failed');
  }
};

// Image upscaling using Real-ESRGAN
export const upscaleImage = async ({
  imageUrl,
  scale = 2,
  model = 'RealESRGAN_x4plus',
  face = false,
  userId
}: {
  imageUrl: string;
  scale?: number;
  model?: 'RealESRGAN_x4plus' | 'RealESRGAN_x2plus' | 'RealESRGAN_x4plus_anime_6B' | 'RealESRGAN_x4_v3' | 'RealESRGAN_x4_wdn_v3' | 'RealESRGAN_x4_anime_v3';
  face?: boolean;
  userId?: string;
}): Promise<string> => {
  try {
    console.log(`Image upscaling request - Scale: ${scale}, Model: ${model}, Face: ${face}`);

    return await withNetworkRetry(async () => {
      const response = await fetch(SUPABASE_IMAGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({
          operation: 'upscaler',
          image_url: imageUrl,
          user_id: userId,
          scale,
          model,
          face
        }),
      });

      console.log(`Upscaler API response status: ${response.status}`);
      
      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
        } catch (e) {
          errorText = 'レスポンステキスト取得エラー';
        }
        
        console.error('Upscaler API Error:', errorText);
        
        const error: any = new Error(`Image upscaling failed (${response.status})`);
        error.status = response.status;
        error.body = errorText;
        
        try {
          const errorJson = JSON.parse(errorText);
          if (errorJson.error) {
            error.message = errorJson.error;
          }
          if (errorJson.limit && response.status === 429) {
            error.message = `1日の制限枚数（${errorJson.limit}枚）に達しました。明日再度お試しください。`;
          }
        } catch (jsonError) {
          // JSON解析エラー - テキストをそのまま使用
        }
        
        throw error;
      }

      const data = await response.json() as ImageGenerationResponse;
      
      if (!data || !data.image) {
        console.error('Invalid API response format:', data);
        throw new Error('APIからの応答が無効です');
      }
      
      const result = data.image.url;
      if (__DEV__) {
        console.log('Image upscaling success:', (result.length > 80 ? result.slice(0, 80) + '...' : result));
      }
      return result;
    }, 3);
  } catch (error: unknown) {
    console.error('Image upscaling final error:', error);
    if (error instanceof Error) {
      throw new Error(error.message || 'Image upscaling failed');
    }
    throw new Error('Image upscaling failed');
  }
};

// Legacy function for backward compatibility - now uses Text-to-Image
export const generateImage = async ({
  prompt,
  size = '768x768',
  quality = 'standard',
  model = 'flux', // Changed default to 'flux'
  returnType = 'url',
  userId
}: {
  prompt: string;
  size?: string;
  quality?: string;
  model?: 'flux' | 'dalle';
  returnType?: 'url' | 'base64';
  userId?: string;
}): Promise<string> => {
  // Map legacy size format to new format
  const sizeMapping: Record<string, any> = {
    '768x768': 'square',
    '1024x1024': 'square_hd',
    '512x512': 'square',
    '1024x1792': 'portrait_16_9',
    '1792x1024': 'landscape_16_9'
  };

  const imageSize = sizeMapping[size] || 'landscape_4_3';
  
  if (model === 'flux') {
    return await generateTextToImage({
      prompt,
      imageSize,
      userId
    });
  } else {
    // For DALL-E, fall back to the old implementation temporarily
    console.warn('DALL-E support is deprecated. Please migrate to FLUX.');
    throw new Error('DALL-E support has been discontinued. Please use FLUX models.');
  }
};

export default { 
  fetchChatCompletion, 
  generateImage, 
  generateTextToImage, 
  generateImageToImage, 
  upscaleImage 
};
