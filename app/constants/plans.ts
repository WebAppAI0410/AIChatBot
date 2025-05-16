export type PlanType = {
  id: string;
  name: string;
  price: number;
  tokens: number;
  sdxlImages: number;
  dalleImages: number;
  modelTiers: number[];
  aiAssists: number;
  periods?: {
    MONTHLY?: { id: string; price: number };
    HALFYEAR?: { id: string; price: number };
    YEARLY?: { id: string; price: number };
  };
};

export const PLANS: Record<string, PlanType> = {
  FREE: {
    id: 'free',
    name: 'Free',
    price: 0,
    tokens: 10000,
    sdxlImages: 5,
    dalleImages: 0,
    modelTiers: [0, 2], // Tier 2は1回/日制限あり
    aiAssists: 3,
  },
  LITE: {
    id: 'lite',
    name: 'Lite',
    price: 980,
    tokens: 300000,
    sdxlImages: 15,
    dalleImages: 1,
    modelTiers: [0, 1, 2],
    aiAssists: 20,
    periods: {
      MONTHLY: { id: 'lite.monthly', price: 980 },
      HALFYEAR: { id: 'lite.halfyear', price: 5600 },
      YEARLY: { id: 'lite.yearly', price: 9800 },
    },
  },
  PREMIUM: {
    id: 'premium',
    name: 'Premium',
    price: 3980,
    tokens: 1500000,
    sdxlImages: 50,
    dalleImages: 5,
    modelTiers: [0, 1, 2],
    aiAssists: 100,
    periods: {
      MONTHLY: { id: 'premium.monthly', price: 3980 },
      HALFYEAR: { id: 'premium.halfyear', price: 23800 },
      YEARLY: { id: 'premium.yearly', price: 39800 },
    },
  },
};

export const MODEL_TIERS = {
  0: 'FREE',
  1: 'LOW_COST',
  2: 'PREMIUM',
};

export const DAILY_LIMITS = {
  FREE_TIER2_MODELS: 1, // Free プランのTier 2モデルは1回/日
};

export const QUOTA_WARNING_THRESHOLDS = {
  WARNING: 0.8, // 80%使用で警告
  EXCEEDED: 1.0, // 100%使用でクォータ超過
};
