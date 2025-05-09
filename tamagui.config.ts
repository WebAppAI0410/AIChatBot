import { createTamagui } from 'tamagui';
import { createInterFont } from '@tamagui/font-inter';
import { shorthands } from '@tamagui/shorthands';
import { themes, tokens } from '@tamagui/themes';
import { colors } from './app/constants/colors';

const headingFont = createInterFont();
const bodyFont = createInterFont();

const appConfig = createTamagui({
  defaultTheme: 'light',
  shouldAddPrefersColorThemes: false,
  themeClassNameOnRoot: false,
  shorthands,
  fonts: {
    heading: headingFont,
    body: bodyFont,
  },
  themes: {
    light: {
      background: colors.background,
      color: colors.text,
      primary: colors.primary,
      secondary: colors.primaryLight,
      accent: colors.accentBlue,
      gray: colors.gray,
      error: colors.error,
    },
    dark: {
      background: '#121212',
      color: '#FFFFFF',
      primary: colors.primaryLight,
      secondary: colors.primary,
      accent: colors.accentBlue,
      gray: colors.darkGray,
      error: colors.error,
    },
  },
  tokens: {
    ...tokens,
    color: {
      ...tokens.color,
      primary: colors.primary,
      primaryLight: colors.primaryLight,
      accentBlue: colors.accentBlue,
    },
  },
});

export type AppConfig = typeof appConfig;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default appConfig;
