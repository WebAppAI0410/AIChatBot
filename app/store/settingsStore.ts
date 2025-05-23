import { StateCreator } from 'zustand';

export interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  language: 'ja' | 'en';
  colorTheme: 'green' | 'blue' | 'orange' | 'purple';
  aiChatSplitRatio: number; // AI校正チャットの画面分割比率（0.3-0.7）
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  setLanguage: (lang: 'ja' | 'en') => void;
  setColorTheme: (theme: 'green' | 'blue' | 'orange' | 'purple') => void;
  setAiChatSplitRatio: (ratio: number) => void;
}

export const createSettingsSlice: StateCreator<
  SettingsState,
  [],
  [],
  SettingsState
> = (set) => ({
  theme: 'light',
  fontSize: 'medium',
  language: 'ja',
  colorTheme: 'green',
  aiChatSplitRatio: 0.4, // デフォルト40%
  setTheme: (theme) => set({ theme }),
  setFontSize: (fontSize) => set({ fontSize }),
  setLanguage: (language) => set({ language }),
  setColorTheme: (colorTheme) => set({ colorTheme }),
  setAiChatSplitRatio: (aiChatSplitRatio) => set({ aiChatSplitRatio }),
});

export default createSettingsSlice;
