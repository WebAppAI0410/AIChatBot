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

    let actualModelId = modelId;
    if (!modelId.includes('/')) {
      const modelInfo = MODELS.find(m => m.id === modelId || m.name.toLowerCase() === modelId.toLowerCase());
      if (modelInfo) {
        actualModelId = modelInfo.id;
      } else {
        actualModelId = `openai/${modelId}`;
      }
    }
    
    console.log(`API Request to OpenRouter - Model: ${actualModelId}`);
    console.log(`Messages count: ${messages.length}`);
    
    let processedMessages = [...messages];
    const systemMessageIndex = processedMessages.findIndex(m => m.role === 'system');
    
    if (systemMessageIndex === -1) {
      processedMessages.unshift({
        role: 'system',
        content: 'あなたは親切で役立つAIアシスタントです。ユーザーの質問に日本語で簡潔に答えてください。'
      });
    } 
    else if (systemMessageIndex > 0) {
      const systemMessage = processedMessages.splice(systemMessageIndex, 1)[0];
      processedMessages.unshift(systemMessage);
    }
    
    console.log('First few messages:', JSON.stringify(processedMessages.slice(0, 2)));
    
    const body: ChatCompletionRequest = {
      messages: processedMessages,
      model: actualModelId,
      stream: false,
      max_tokens: 1000,
      temperature: 0.7,
    };

    console.log('Sending request to OpenRouter API...');
    
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://aichatbot.app',
        'X-Title': 'AI ChatBot App',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`OpenRouter API error (${response.status}):`, errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.error('Parsed error:', errorJson);
      } catch (e) {
      }
      
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json() as ChatCompletionResponse;
    const content = data.choices[0]?.message?.content || '';
    
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
      messageCount: messages.length,
      firstUserMessage: messages.find(m => m.role === 'user')?.content.substring(0, 50),
    });
    
    return 'エラーが発生しました。ネットワーク接続を確認して、もう一度お試しください。';
  }
};

export default { fetchChatCompletion };
