export type ModelType = {
  id: string;
  name: string;
  description: string;
  contextLength: number;
  isPremium: boolean;
  tier: number;  // 0, 1, 2 (Backend tier for cost management)
  planTier: 'free' | 'lite' | 'premium';
  isLocal?: boolean;
  dailyLimit?: number;  // For models with daily usage limits
  provider?: string;
  isAuto?: boolean;
};

export const MODEL_TIERS = {
  0: 'FREE',
  1: 'LOW_COST',
  2: 'PREMIUM',
};

export const MODELS: ModelType[] = [
  {
    id: 'openrouter/auto',
    name: 'Auto(最適なモデル)',
    description: 'サーバー負荷と可用性に基づいて最適なモデルを選択',
    contextLength: 32000,
    isPremium: false,
    tier: 0,
    planTier: 'free',
    provider: 'openrouter',
    isAuto: true
  },
  
  {
    id: 'google/gemini-2.5-pro-exp',
    name: 'Gemini 2.5 Pro Exp',
    description: 'Google\'s experimental model with free access',
    contextLength: 1000000,
    isPremium: false,
    tier: 0,
    planTier: 'free',
    provider: 'google'
  },
  {
    id: 'google/gemini-2.0-flash-exp',
    name: 'Gemini 2.0 Flash Exp',
    description: 'Fast Google model with free access',
    contextLength: 32000,
    isPremium: false,
    tier: 0,
    planTier: 'free',
    provider: 'google'
  },
  {
    id: 'deepseek/deepseek-r1-zero',
    name: 'DeepSeek R1 Zero',
    description: 'Free version of DeepSeek R1',
    contextLength: 32000,
    isPremium: false,
    tier: 0,
    planTier: 'free',
    provider: 'deepseek'
  },
  {
    id: 'qwen3-4b-local',
    name: 'Qwen3:4B (ローカル)',
    description: 'Local model for offline use',
    contextLength: 32768,
    isPremium: false,
    tier: 0,
    planTier: 'free',
    isLocal: true,
    provider: 'local'
  },
  
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o mini',
    description: 'Fast and efficient model for everyday tasks',
    contextLength: 16000,
    isPremium: false,
    tier: 1,
    planTier: 'free',
    provider: 'openai',
    dailyLimit: 2
  },
  {
    id: 'openai/gpt-4.1-mini',
    name: 'GPT-4.1 mini',
    description: 'Balanced performance for general use',
    contextLength: 16000,
    isPremium: false,
    tier: 1,
    planTier: 'free',
    provider: 'openai',
    dailyLimit: 2
  },
  {
    id: 'openai/gpt-4.1-nano',
    name: 'GPT-4.1 nano',
    description: 'Lightweight model for quick responses',
    contextLength: 8192,
    isPremium: false,
    tier: 1,
    planTier: 'free',
    provider: 'openai',
    dailyLimit: 2
  },
  {
    id: 'deepseek/deepseek-v3',
    name: 'DeepSeek V3',
    description: 'Powerful model from DeepSeek',
    contextLength: 32000,
    isPremium: false,
    tier: 1,
    planTier: 'free',
    provider: 'deepseek'
  },
  {
    id: 'deepseek/deepseek-r1',
    name: 'DeepSeek R1',
    description: 'Advanced reasoning model',
    contextLength: 32000,
    isPremium: false,
    tier: 1,
    planTier: 'free',
    provider: 'deepseek'
  },
  {
    id: 'google/gemini-2.5-flash-preview',
    name: 'Gemini 2.5 Flash Preview',
    description: 'Fast Google model with preview access',
    contextLength: 32000,
    isPremium: false,
    tier: 1,
    planTier: 'free',
    provider: 'google'
  },
  {
    id: 'openai/gpt-4o-mini-high',
    name: '4o-mini-high',
    description: 'Enhanced version of 4o-mini',
    contextLength: 16000,
    isPremium: true,
    tier: 1,
    planTier: 'lite',
    provider: 'openai'
  },
  {
    id: 'google/gemini-2.5-pro-preview',
    name: 'Gemini 2.5 Pro Preview',
    description: 'Google\'s preview model with enhanced capabilities',
    contextLength: 1000000,
    isPremium: true,
    tier: 1,
    planTier: 'lite',
    provider: 'google'
  },
  
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    description: 'Advanced model with strong reasoning capabilities',
    contextLength: 128000,
    isPremium: true,
    tier: 2,
    planTier: 'free',
    provider: 'openai',
    dailyLimit: 1
  },
  {
    id: 'openai/gpt-4.1',
    name: 'GPT-4.1',
    description: 'Latest model with enhanced capabilities',
    contextLength: 128000,
    isPremium: true,
    tier: 2,
    planTier: 'free',
    provider: 'openai',
    dailyLimit: 1
  },
  {
    id: 'openai/gpt-4.5-preview',
    name: 'GPT-4.5 Preview',
    description: 'Most advanced OpenAI model',
    contextLength: 128000,
    isPremium: true,
    tier: 2,
    planTier: 'premium',
    provider: 'openai'
  },
  {
    id: 'anthropic/claude-3.7-sonnet',
    name: 'Claude 3.7 Sonnet',
    description: 'Advanced Claude model',
    contextLength: 200000,
    isPremium: true,
    tier: 2,
    planTier: 'premium',
    provider: 'anthropic'
  },
  {
    id: 'anthropic/claude-3.7-sonnet-thinking',
    name: 'Claude 3.7 Sonnet Thinking',
    description: 'Claude model with enhanced reasoning',
    contextLength: 200000,
    isPremium: true,
    tier: 2,
    planTier: 'premium',
    provider: 'anthropic'
  }
];

export const IMAGE_MODELS = {
  'sdxl': { tier: 0, name: 'SDXL', provider: 'cloudflare' },
  'dalle3': { tier: 2, name: 'DALL-E 3', provider: 'openai' },
};

export default MODELS;
