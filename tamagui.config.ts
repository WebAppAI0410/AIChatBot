import { createTamagui } from 'tamagui';
import { createInterFont } from '@tamagui/font-inter';
import { shorthands } from '@tamagui/shorthands';
import { themes, tokens } from '@tamagui/themes';
import { lightColors, darkColors } from './app/constants/colors';

const headingFont = createInterFont();
const bodyFont = createInterFont();

const appConfig = createTamagui({
  defaultTheme: 'light',
  shouldAddPrefersColorThemes: true,
  themeClassNameOnRoot: true,
  shorthands,
  fonts: {
    heading: headingFont,
    body: bodyFont,
  },
  themes: {
    light: {
      background: lightColors.background,
      color: lightColors.text,
      primary: lightColors.primary,
      secondary: lightColors.primaryLight,
      accent: lightColors.accentBlue,
      gray: lightColors.gray,
      error: lightColors.error,
    },
    dark: {
      background: darkColors.background,
      color: darkColors.text,
      primary: darkColors.primary,
      secondary: darkColors.primaryLight,
      accent: darkColors.accentBlue,
      gray: darkColors.gray,
      error: darkColors.error,
    },
  },
  tokens: {
    ...tokens,
    color: {
      ...tokens.color,
      primary: lightColors.primary,
      primaryLight: lightColors.primaryLight,
      accentBlue: lightColors.accentBlue,
    },
  },
});

export type AppConfig = typeof appConfig;

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default appConfig;
