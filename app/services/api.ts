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

    const body: ChatCompletionRequest = {
      messages,
      model: modelId,
      stream: !!onChunk,
      max_tokens: 1000,
      temperature: 0.7,
    };

    if (onChunk) {
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
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let result = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk
          .split('\n')
          .filter(line => line.trim() !== '' && line.trim() !== 'data: [DONE]');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6);
              const json = JSON.parse(jsonStr) as ChatCompletionChunk;
              const content = json.choices[0]?.delta?.content || '';
              
              if (content) {
                result += content;
                onChunk(content);
              }
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
      }

      return result;
    } else {
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
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json() as ChatCompletionResponse;
      return data.choices[0]?.message?.content || '';
    }
  } catch (error) {
    console.error('Error in fetchChatCompletion:', error);
    throw error;
  }
};

export default { fetchChatCompletion };
