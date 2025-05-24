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
  features?: {
    search?: boolean;       // Web検索機能
    reasoning?: boolean;    // 推論モード
    vision?: boolean;       // 画像認識
    audio?: boolean;        // 音声認識
    documents?: boolean;    // ドキュメント処理
  };
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
    isAuto: true,
    features: {
      vision: true,
      search: true,
      reasoning: true,
      documents: true
    }
  },
  
  // Tier 0 (無料) モデル
  {
    id: 'google/gemini-2.5-pro-exp-03-25',
    name: 'Gemini 2.5 Pro Exp',
    description: 'Google\'s experimental model with free access',
    contextLength: 1000000,
    isPremium: false,
    tier: 0,
    planTier: 'free',
    provider: 'google',
    features: {
      search: true,
      reasoning: true,
      vision: true,
      documents: true
    }
  },
  {
    id: 'google/gemini-2.0-flash-exp:free',
    name: 'Gemini 2.0 Flash Exp',
    description: 'Fast Google model with free access',
    contextLength: 32000,
    isPremium: false,
    tier: 0,
    planTier: 'free',
    provider: 'google',
    features: {
      vision: true
    }
  },
  {
    id: 'deepseek/deepseek-r1-zero:free',
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
  
  // Tier 1 (一般的なモデル)
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o mini',
    description: 'Fast and efficient model for everyday tasks',
    contextLength: 16000,
    isPremium: false,
    tier: 1,
    planTier: 'free',
    provider: 'openai',
    dailyLimit: 2,
    features: {
      vision: true
    }
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
    id: 'deepseek/deepseek-v3-base:free',
    name: 'DeepSeek V3',
    description: 'Powerful model from DeepSeek',
    contextLength: 32000,
    isPremium: false,
    tier: 1,
    planTier: 'free',
    provider: 'deepseek'
  },
    {    id: 'deepseek/deepseek-r1',    name: 'DeepSeek R1',    description: 'Advanced reasoning model',    contextLength: 32000,    isPremium: false,    tier: 1,    planTier: 'free',    provider: 'deepseek',    features: {      reasoning: true    }  },
  {
    id: 'google/gemini-2.5-flash-preview',
    name: 'Gemini 2.5 Flash Preview',
    description: 'Fast Google model with preview access',
    contextLength: 1000000,
    isPremium: false,
    tier: 1,
    planTier: 'free',
    provider: 'google',
    features: {
      vision: true
    }
  },
  
  // Tier 1 (Liteプラン以上)
    {    id: 'openai/o4-mini',    name: 'o4-mini',    description: 'Compact reasoning model optimized for fast, cost-efficient performance',    contextLength: 200000,    isPremium: true,    tier: 1,    planTier: 'lite',    provider: 'openai',    features: {      vision: true,      reasoning: true    }  },  {    id: 'openai/o4-mini-high',    name: 'o4-mini-high',    description: 'o4-mini with reasoning_effort set to high',    contextLength: 200000,    isPremium: true,    tier: 1,    planTier: 'lite',    provider: 'openai',    features: {      vision: true,      reasoning: true    }  },  {    id: 'openai/o3',    name: 'o3',    description: 'Well-rounded model for math, science, coding, and visual reasoning',    contextLength: 200000,    isPremium: true,    tier: 1,    planTier: 'lite',    provider: 'openai',    features: {      vision: true,      reasoning: true    }  },
  {
    id: 'google/gemini-2.5-pro-preview',
    name: 'Gemini 2.5 Pro Preview',
    description: 'Google\'s preview model with enhanced capabilities',
    contextLength: 1000000,
    isPremium: true,
    tier: 1,
    planTier: 'lite',
    provider: 'google',
    features: {
      vision: true,
      search: true,
      reasoning: true,
      documents: true
    }
  },
  
  // Tier 2 (Premium)
  {
    id: 'openai/gpt-4o-2024-11-20',
    name: 'GPT-4o',
    description: 'Advanced model with strong reasoning capabilities',
    contextLength: 128000,
    isPremium: true,
    tier: 2,
    planTier: 'free',
    provider: 'openai',
    dailyLimit: 1,
    features: {
      search: true,
      reasoning: true,
      vision: true,
      audio: true,
      documents: true
    }
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
    dailyLimit: 1,
    features: {
      vision: true
    }
  },
  {
    id: 'openai/gpt-4.5-preview',
    name: 'GPT-4.5 Preview',
    description: 'Most advanced OpenAI model',
    contextLength: 128000,
    isPremium: true,
    tier: 2,
    planTier: 'premium',
    provider: 'openai',
    features: {
      vision: true
    }
  },
  {
    id: 'anthropic/claude-3.7-sonnet',
    name: 'Claude 3.7 Sonnet',
    description: 'Advanced Claude model',
    contextLength: 200000,
    isPremium: true,
    tier: 2,
    planTier: 'premium',
    provider: 'anthropic',
    features: {
      vision: true
    }
  },
    {    id: 'anthropic/claude-3.7-sonnet:thinking',    name: 'Claude 3.7 Sonnet Thinking',    description: 'Claude model with extended step-by-step reasoning',    contextLength: 200000,    isPremium: true,    tier: 2,    planTier: 'premium',    provider: 'anthropic',    features: {      reasoning: true,      vision: true    }  }
];

export const IMAGE_MODELS = {
  'sdxl': { tier: 0, name: 'SDXL', provider: 'cloudflare' },
  'dalle3': { tier: 2, name: 'DALL-E 3', provider: 'openai' },
};

export default MODELS;
