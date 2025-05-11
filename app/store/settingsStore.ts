import { StateCreator } from 'zustand';

export interface SettingsState {
  theme: 'light' | 'dark' | 'system';
  fontSize: 'small' | 'medium' | 'large';
  language: 'ja' | 'en';
  colorTheme: 'green' | 'blue' | 'orange' | 'purple';
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setFontSize: (size: 'small' | 'medium' | 'large') => void;
  setLanguage: (lang: 'ja' | 'en') => void;
  setColorTheme: (theme: 'green' | 'blue' | 'orange' | 'purple') => void;
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
  setTheme: (theme) => set({ theme }),
  setFontSize: (fontSize) => set({ fontSize }),
  setLanguage: (language) => set({ language }),
  setColorTheme: (colorTheme) => set({ colorTheme }),
});

export default createSettingsSlice;
