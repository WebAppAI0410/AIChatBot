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
