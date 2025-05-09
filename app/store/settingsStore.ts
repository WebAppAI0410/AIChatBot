import { StateCreator } from 'zustand';

export interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  language: 'ja' | 'en';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  setLanguage: (lang: 'ja' | 'en') => void;
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
  setTheme: (theme) => set({ theme }),
  setFontSize: (fontSize) => set({ fontSize }),
  setLanguage: (language) => set({ language }),
});

export default createSettingsSlice;
