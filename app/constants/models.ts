export type ModelType = {
  id: string;
  name: string;
  description: string;
  contextLength: number;
  isPremium: boolean;
  tier: 'free' | 'lite' | 'heavy';
  isLocal?: boolean;
};

export const MODELS: ModelType[] = [
  {
    id: 'openai/gpt-4o-mini',
    name: '4o-mini',
    description: 'Fast and efficient model for everyday tasks',
    contextLength: 8192,
    isPremium: false,
    tier: 'free'
  },
  {
    id: 'openai/gpt-4.1-mini',
    name: '4.1-mini',
    description: 'Balanced performance for general use',
    contextLength: 8192,
    isPremium: false,
    tier: 'free'
  },
  {
    id: 'openai/gpt-4.1-nano',
    name: '4.1-nano',
    description: 'Lightweight model for quick responses',
    contextLength: 8192,
    isPremium: false,
    tier: 'free'
  },
  {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku',
    description: 'Fast and efficient assistant from Anthropic',
    contextLength: 200000,
    isPremium: false,
    tier: 'free'
  },
  {
    id: 'qwen3-4b-local',
    name: 'Qwen3:4B (ローカル)',
    description: 'Local model for offline use',
    contextLength: 8192,
    isPremium: false,
    tier: 'free',
    isLocal: true
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    description: 'Advanced model with strong reasoning capabilities',
    contextLength: 128000,
    isPremium: true,
    tier: 'lite'
  },
  {
    id: 'openai/gpt-4.1',
    name: 'GPT-4.1',
    description: 'Latest model with enhanced capabilities',
    contextLength: 128000,
    isPremium: true,
    tier: 'lite'
  },
  {
    id: 'openai/gpt-4.5',
    name: 'GPT-4.5',
    description: 'Most advanced OpenAI model',
    contextLength: 128000,
    isPremium: true,
    tier: 'heavy'
  },
  {
    id: 'anthropic/claude-3-opus',
    name: 'Claude 3 Opus',
    description: 'Most capable Claude model',
    contextLength: 200000,
    isPremium: true,
    tier: 'heavy'
  },
  {
    id: 'anthropic/claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    description: 'Balanced Claude model',
    contextLength: 200000,
    isPremium: true,
    tier: 'heavy'
  },
  {
    id: 'google/gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    description: 'Google\'s advanced multimodal model',
    contextLength: 1000000,
    isPremium: true,
    tier: 'heavy'
  }
];

export default MODELS;
