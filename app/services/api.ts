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

export const fetchChatCompletion = async (
  messages: ChatMessage[],
  modelId: string,
  onChunk?: (chunk: string) => void
): Promise<string> => {
  try {
    if (modelId === 'qwen3-4b-local') {
      return 'Local model response would be generated here';
    }

    const actualModelId = modelId.includes('/') ? modelId : `openai/${modelId}`;
    
    console.log(`API Request - Model: ${actualModelId}, Messages: ${messages.length}`);
    console.log(`First few messages:`, JSON.stringify(messages.slice(0, 2)));
    
    const body: ChatCompletionRequest = {
      messages,
      model: actualModelId,
      stream: false, // Disable streaming for now to simplify response handling
      max_tokens: 1000,
      temperature: 0.7,
    };

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
      console.error(`API error response: ${errorText}`);
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
