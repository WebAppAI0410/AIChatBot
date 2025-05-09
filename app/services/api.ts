import { MODELS } from '../constants/models';

const OPENROUTER_API_KEY = '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';
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

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
 * Fetches a completion from the OpenRouter API
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
    
    console.log(`API Request to OpenRouter - Original Model: ${modelId}, Normalized: ${actualModelId}`);
    console.log(`Messages count: ${messages.length}`);
    
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
    
    const body: ChatCompletionRequest = {
      messages: processedMessages,
      model: actualModelId,
      stream: false,
      max_tokens: 1000,
      temperature: 0.7,
    };

    console.log('Sending request to OpenRouter API...');
    console.log('Request URL:', `${OPENROUTER_BASE_URL}/chat/completions`);
    console.log('Request body:', JSON.stringify(body).substring(0, 200) + '...');
    
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'HTTP-Referer': 'https://aichatbot.app',
      'X-Title': 'AI ChatBot App',
    };
    
    console.log('API Request headers:', {
      'Content-Type': headers['Content-Type'],
      'Authorization': `Bearer ${OPENROUTER_API_KEY.substring(0, 10)}...`,
      'HTTP-Referer': headers['HTTP-Referer'],
      'X-Title': headers['X-Title'],
    });
    
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    
    console.log('API Response status:', response.status);
    
    // Handle error responses
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenRouter API error (${response.status}):`, errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.error('Parsed error:', errorJson);
        
        if (response.status === 401) {
          throw new Error(`認証エラー: APIキーが無効または期限切れです。(${errorJson.error?.message || 'No auth credentials found'})`);
        } else if (response.status === 400) {
          throw new Error(`リクエストエラー: ${errorJson.error?.message || errorText}`);
        } else if (response.status === 429) {
          throw new Error('レート制限に達しました。しばらく待ってから再試行してください。');
        }
      } catch (e) {
        console.error('Error parsing error response:', e);
      }
      
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as ChatCompletionResponse;
    
    if (!data || !data.choices || data.choices.length === 0) {
      console.error('Invalid API response format:', data);
      throw new Error('APIからの応答が無効です。');
    }
    
    const content = data.choices[0]?.message?.content || '';
    
    if (!content) {
      console.error('Empty content in API response:', data);
      throw new Error('APIからの応答が空です。');
    }
    
    console.log(`API Response received - Length: ${content.length}`);
    console.log(`Response preview: ${content.substring(0, 50)}...`);
    
    if (onChunk && content) {
      onChunk(content);
    }
    
    return content;
  } catch (error) {
    console.error('Error in fetchChatCompletion:', error);
    
    console.error('Request details:', {
      modelId,
      normalizedModelId: normalizeModelId(modelId),
      messageCount: messages.length,
      firstUserMessage: messages.find(m => m.role === 'user')?.content.substring(0, 50),
    });
    
    if (error instanceof Error) {
      if (error.message.includes('認証エラー') || 
          error.message.includes('リクエストエラー') || 
          error.message.includes('レート制限') ||
          error.message.includes('APIからの応答')) {
        return error.message;
      }
    }
    
    return 'エラーが発生しました。ネットワーク接続を確認して、もう一度お試しください。';
  }
};

export default { fetchChatCompletion };
