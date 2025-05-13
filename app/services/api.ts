import { MODELS } from '../constants/models';

// Supabase Edge FunctionのURL
const SUPABASE_FUNCTION_URL = 'https://alperyqhdtpnivxfnqdi.supabase.co/functions/v1/openrouter-proxy';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFscGVyeXFoZHRwbml2eGZucWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MDc5OTcsImV4cCI6MjA2MjM4Mzk5N30.0gTXgFtD2uIhGdSB4twConRJPF_0Ccz5zePqa0hD8B0';

// 直接APIキーを保持しない - すべてEdge Function経由で処理

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
    
    console.log('First message role:', processedMessages[0].role);
    console.log('Last message role:', processedMessages[processedMessages.length - 1].role);
    console.log('Last message content:', processedMessages[processedMessages.length - 1].content.substring(0, 30));
    
    const body = {
      messages: processedMessages,
      model: actualModelId,
      stream: false,
      max_tokens: 1000,
      temperature: 0.7,
    };

    // タイムアウト処理を追加
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30秒タイムアウト
    
    try {
      console.log('Sending request to Supabase Edge Function...');
      
      // Edge Functionを使った方法を試す（JWT認証なし）
      const response = await fetch(SUPABASE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      console.log('API Response status:', response.status);
      
      // Edge Functionからのエラーレスポンスを処理
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`API error (${response.status}):`, errorText);
        
        let errorMessage = `API error: ${response.status}`;
        
        try {
          const errorJson = JSON.parse(errorText);
          console.error('Parsed error:', errorJson);
          
          if (errorJson.error) {
            errorMessage = `エラー: ${errorJson.error}`;
          } else if (response.status === 401) {
            errorMessage = `認証エラー: APIキーが無効または期限切れです。`;
          } else if (response.status === 400) {
            errorMessage = `リクエストエラー: ${errorJson.error?.message || errorText}`;
          } else if (response.status === 429) {
            errorMessage = 'レート制限に達しました。しばらく待ってから再試行してください。';
          } else if (response.status === 500) {
            errorMessage = 'サーバーエラーが発生しました。しばらくしてからもう一度お試しください。';
          }
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        
        return errorMessage;
      }

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
      console.log(`Response preview: ${content.substring(0, 50)}...`);
      
      if (onChunk && content) {
        onChunk(content);
      }
      
      return content;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      if (fetchError.name === 'AbortError') {
        return 'APIリクエストがタイムアウトしました。ネットワーク接続を確認してください。';
      }
      
      console.error('Error when calling Edge Function:', fetchError);
      return 'サーバーとの通信に問題が発生しました。しばらくしてからもう一度お試しください。';
    }
  } catch (error) {
    console.error('Error in fetchChatCompletion:', error);
    
    if (error instanceof Error) {
      return `エラーが発生しました: ${error.message}`;
    }
    
    return 'エラーが発生しました。ネットワーク接続を確認して、もう一度お試しください。';
  }
};

export default { fetchChatCompletion };
