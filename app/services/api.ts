import { MODELS } from '../constants/models';

// Supabase Edge FunctionのURL
const SUPABASE_FUNCTION_URL = 'https://alperyqhdtpnivxfnqdi.supabase.co/functions/v1/openrouter-proxy';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFscGVyeXFoZHRwbml2eGZucWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MDc5OTcsImV4cCI6MjA2MjM4Mzk5N30.0gTXgFtD2uIhGdSB4twConRJPF_0Ccz5zePqa0hD8B0';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// テスト用の一時的なAPIキー - 本番環境では使用しないでください！
// 警告: こちらは一時的な対処法であり、本来はサーバーサイドで管理すべきです
const TEMP_OPENROUTER_API_KEY = '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';

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
  
  if (modelId === '4o-mini' || modelId === 'gpt-4o-mini') {
    return 'openai/gpt-4o-mini';
  }
  
  if (modelId === '4.1-mini' || modelId === 'gpt-4.1-mini') {
    return 'openai/gpt-4.1-mini';
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
    
    if (systemMessageIndex === -1) {
      processedMessages.unshift({
        role: 'system',
        content: 'あなたは親切で役立つAIアシスタントです。ユーザーの質問に日本語で簡潔に答えてください。'
      });
      console.log('Added default system message');
    } 
    else if (systemMessageIndex > 0) {
      const systemMessage = processedMessages.splice(systemMessageIndex, 1)[0];
      processedMessages.unshift(systemMessage);
      console.log('Moved system message to first position');
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
      console.log('Authorization header being sent:', `Bearer ${SUPABASE_ANON_KEY.substring(0, 10)}...`);
      
      // Edge Functionを使った方法を試す
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
        
        // 認証エラー（401）の場合、直接OpenRouterにリクエストを試みる
        if (response.status === 401) {
          console.log('Authentication error. Trying direct OpenRouter API as fallback...');
          return await tryDirectOpenRouterAPI(processedMessages, actualModelId);
        }
        
        let errorMessage = `API error: ${response.status}`;
        
        try {
          const errorJson = JSON.parse(errorText);
          console.error('Parsed error:', errorJson);
          
          if (response.status === 401) {
            errorMessage = `認証エラー: APIキーが無効または期限切れです。`;
          } else if (response.status === 400) {
            errorMessage = `リクエストエラー: ${errorJson.error?.message || errorText}`;
          } else if (response.status === 429) {
            errorMessage = 'レート制限に達しました。しばらく待ってから再試行してください。';
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
      
      // フォールバック: 直接OpenRouterを呼び出す
      console.log('Error when calling Edge Function. Trying direct OpenRouter API as fallback...');
      return await tryDirectOpenRouterAPI(processedMessages, actualModelId);
    }
  } catch (error) {
    console.error('Error in fetchChatCompletion:', error);
    
    if (error instanceof Error) {
      return `エラーが発生しました: ${error.message}`;
    }
    
    return 'エラーが発生しました。ネットワーク接続を確認して、もう一度お試しください。';
  }
};

/**
 * Edge Functionの代わりに直接OpenRouterのAPIを呼び出す（フォールバックとして利用）
 * 警告: これは一時的な解決策です。本来ならサーバーサイドでAPIキーを管理すべきです。
 */
const tryDirectOpenRouterAPI = async (messages: ChatMessage[], model: string): Promise<string> => {
  try {
    console.log('Attempting direct OpenRouter API call as fallback...');
    console.log('Using API key (first 10 chars):', TEMP_OPENROUTER_API_KEY.substring(0, 10));
    
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEMP_OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://aichatbot.app',
        'X-Title': 'AI ChatBot App',
      },
      body: JSON.stringify({
        messages,
        model,
        stream: false,
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });
    
    console.log('Direct OpenRouter API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Direct OpenRouter API error (${response.status}):`, errorText);
      return `OpenRouterへの直接リクエストがエラーを返しました: ${response.status}`;
    }
    
    const data = await response.json() as ChatCompletionResponse;
    
    if (!data || !data.choices || data.choices.length === 0) {
      console.error('Invalid direct API response format:', data);
      return 'OpenRouterからの応答が無効です。';
    }
    
    const content = data.choices[0]?.message?.content || '';
    
    if (!content) {
      console.error('Empty content in direct API response:', data);
      return 'OpenRouterからの応答が空です。';
    }
    
    console.log(`Direct API Response received - Length: ${content.length}`);
    
    return content;
  } catch (error) {
    console.error('Error in direct OpenRouter API call:', error);
    return 'OpenRouterへの直接アクセス中にエラーが発生しました。';
  }
};

export default { fetchChatCompletion };
