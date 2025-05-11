import { useWindowDimensions } from 'react-native';
import theme from '../ui/theme';

export const useResponsive = () => {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  
  const breakpoints = {
    sm: width < 375,
    md: width >= 375 && width < 768,
    lg: width >= 768,
  };
  
  const spacing = {
    container: breakpoints.sm ? theme.spacing.sm : breakpoints.md ? theme.spacing.md : theme.spacing.lg,
    card: breakpoints.sm ? theme.spacing.sm : breakpoints.md ? theme.spacing.md : theme.spacing.lg,
    input: breakpoints.sm ? theme.spacing.xs : theme.spacing.sm,
    button: breakpoints.sm ? theme.spacing.xs : theme.spacing.sm,
    list: breakpoints.sm ? theme.spacing.xs : theme.spacing.sm,
  };
  
  const fontSizes = {
    heading1: breakpoints.sm ? theme.fontSizes.lg : breakpoints.md ? theme.fontSizes.xl : theme.fontSizes.xxl,
    heading2: breakpoints.sm ? theme.fontSizes.md : breakpoints.md ? theme.fontSizes.lg : theme.fontSizes.xl,
    body: breakpoints.sm ? theme.fontSizes.sm : theme.fontSizes.md,
    caption: breakpoints.sm ? theme.fontSizes.xs : theme.fontSizes.sm,
  };
  
  const layout = {
    singleColumn: breakpoints.sm || breakpoints.md,
    twoColumn: breakpoints.lg,
    maxContentWidth: breakpoints.lg ? 1024 : '100%',
    sidebarWidth: breakpoints.lg ? 320 : '100%',
  };
  
  return {
    width,
    height,
    isLandscape,
    breakpoints,
    spacing,
    fontSizes,
    layout,
  };
};

export default useResponsive;
