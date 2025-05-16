import { useStore } from '../store';
import { useColorScheme } from 'react-native';
import { useMemo } from 'react';

// カラーテーマの型定義
export type ColorTheme = 'green' | 'blue' | 'orange' | 'purple';

// カラーテーマの色定義
const themeColors = {
  green: {
    // 視認性の高い緑
    lightPrimary: '#047857',     // 深めの緑
    lightSecondary: '#10B981',   // 明るい緑
    darkPrimary: '#10B981',      // 明るい緑（ダークモードプライマリ）
    darkSecondary: '#047857',    // 深めの緑（ダークモードセカンダリ）
    textOnPrimary: '#FFFFFF',    // プライマリーカラー上のテキスト色
  },
  blue: {
    // 視認性の高い青
    lightPrimary: '#0066CC',     // 深めの青
    lightSecondary: '#38BDF8',   // 明るい青
    darkPrimary: '#38BDF8',      // 明るい青（ダークモードプライマリ）
    darkSecondary: '#0066CC',    // 深めの青（ダークモードセカンダリ）
    textOnPrimary: '#FFFFFF',    // プライマリーカラー上のテキスト色
  },
  orange: {
    // 視認性の高い暗めのオレンジ
    lightPrimary: '#C2410C',     // 深めのオレンジ
    lightSecondary: '#F97316',   // 明るいオレンジ
    darkPrimary: '#F97316',      // 明るいオレンジ（ダークモードプライマリ）
    darkSecondary: '#C2410C',    // 深めのオレンジ（ダークモードセカンダリ）
    textOnPrimary: '#FFFFFF',    // 白テキスト（他のテーマと統一）
  },
  purple: {
    // 視認性の高い紫
    lightPrimary: '#7C3AED',     // 深めの紫
    lightSecondary: '#A78BFA',   // 明るい紫
    darkPrimary: '#A78BFA',      // 明るい紫（ダークモードプライマリ）
    darkSecondary: '#7C3AED',    // 深めの紫（ダークモードセカンダリ）
    textOnPrimary: '#FFFFFF',    // プライマリーカラー上のテキスト色
  }
};

// ライトモードの基本カラー（共通）
const baseLightColors = {
  background: '#FFFFFF',
  text: '#111827',
  lightGray: '#E5E5E5',
  gray: '#9CA3AF',
  darkGray: '#4B5563',
  error: '#DC2626',
  success: '#059669',
  warning: '#F59E0B',
  secondaryText: '#6B7280',
  card: '#F9FAFB',
  border: '#E2E8F0',
  accentBlue: '#0284C7',
};

// ダークモードの基本カラー（共通）
const baseDarkColors = {
  background: '#111827',
  text: '#F9FAFB',
  lightGray: '#1F2937',
  gray: '#6B7280',
  darkGray: '#D1D5DB',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  secondaryText: '#9CA3AF',
  card: '#1F2937',
  border: '#374151',
  accentBlue: '#38BDF8',
};

// ライトモード用のテーマごとのカラー生成
export const createLightColors = (theme: ColorTheme) => {
  return {
    ...baseLightColors,
    primary: themeColors[theme].lightPrimary,
    primaryLight: themeColors[theme].lightSecondary,
    textOnPrimary: themeColors[theme].textOnPrimary,
  };
};

// ダークモード用のテーマごとのカラー生成
export const createDarkColors = (theme: ColorTheme) => {
  return {
    ...baseDarkColors,
    primary: themeColors[theme].darkPrimary,
    primaryLight: themeColors[theme].darkSecondary,
    textOnPrimary: themeColors[theme].textOnPrimary,
  };
};

// デフォルトエクスポート用
export const lightColors = createLightColors('green');
export const darkColors = createDarkColors('green');

// 静的値（非推奨）
export const colors = lightColors;

export function useColors() {
  const theme = useStore(state => state.theme);
  const colorTheme = useStore(state => state.colorTheme) || 'green';
  const systemScheme = useColorScheme();
  
  const isDark = theme === 'dark' || (theme === 'system' && systemScheme === 'dark');
  
  return useMemo(
    () => 
      isDark
        ? createDarkColors(colorTheme as ColorTheme)
        : createLightColors(colorTheme as ColorTheme),
    [isDark, colorTheme]
  );
}

export default useColors;
