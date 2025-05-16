import { StateCreator } from 'zustand';

export type UserPlan = 'free' | 'lite' | 'premium';

export interface UserState {
  isAuthenticated: boolean;
  userId: string | null;
  email: string | null;
  plan: UserPlan;
  monthlyTokensUsed: number;
  monthlyTokensLimit: number;
  dailyImageGenCount: number;
  dailyImageGenLimit: number;
  dailyModelQuotasCount: { [modelId: string]: number };
  setAuthenticated: (value: boolean) => void;
  setUserId: (id: string | null) => void;
  setEmail: (email: string | null) => void;
  setPlan: (plan: UserPlan) => void;
  incrementTokensUsed: (amount: number) => void;
  incrementImageGenCount: () => void;
  incrementModelUsageCount: (modelId: string) => void;
  resetImageGenCount: () => void;
}

const TOKEN_LIMITS = {
  free: 10000,
  lite: 300000,
  premium: 1500000,
};

const IMAGE_GEN_LIMITS = {
  free: 5,
  lite: 15,
  premium: 50,
};

export const createUserSlice: StateCreator<
  UserState,
  [],
  [],
  UserState
> = (set) => ({
  isAuthenticated: false,
  userId: null,
  email: null,
  plan: 'free',
  monthlyTokensUsed: 0,
  monthlyTokensLimit: TOKEN_LIMITS.free,
  dailyImageGenCount: 0,
  dailyImageGenLimit: IMAGE_GEN_LIMITS.free,
  dailyModelQuotasCount: {},
  setAuthenticated: (value) => set({ isAuthenticated: value }),
  setUserId: (id) => set({ userId: id }),
  setEmail: (email) => set({ email }),
  setPlan: (plan) => set({
    plan,
    monthlyTokensLimit: TOKEN_LIMITS[plan],
    dailyImageGenLimit: IMAGE_GEN_LIMITS[plan],
  }),
  incrementTokensUsed: (amount) => set((state) => ({
    monthlyTokensUsed: state.monthlyTokensUsed + amount,
  })),
  incrementImageGenCount: () => set((state) => ({
    dailyImageGenCount: state.dailyImageGenCount + 1,
  })),
  incrementModelUsageCount: (modelId) => set((state) => ({
    dailyModelQuotasCount: {
      ...state.dailyModelQuotasCount,
      [modelId]: (state.dailyModelQuotasCount[modelId] || 0) + 1
    }
  })),
  resetImageGenCount: () => set({
    dailyImageGenCount: 0,
    dailyModelQuotasCount: {}
  }),
});

export default createUserSlice;
