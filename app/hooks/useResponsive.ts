import { useWindowDimensions } from 'react-native';
import theme from '../ui/theme';

export const useResponsive = () => {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  
  const breakpoints = {
    sm: width < 375,
    md: width >= 375 && width < 768,
    lg: width >= 768,
    xl: width >= 1024,
  };
  
  const deviceType = {
    isPhone: breakpoints.sm || breakpoints.md,
    isTablet: breakpoints.lg && !breakpoints.xl,
    isDesktop: breakpoints.xl,
  };
  
  const spacing = {
    container: breakpoints.sm ? theme.spacing.sm : 
               breakpoints.md ? theme.spacing.md : 
               theme.spacing.lg,
    card: breakpoints.sm ? theme.spacing.sm : 
          breakpoints.md ? theme.spacing.md : 
          theme.spacing.lg,
    input: breakpoints.sm ? theme.spacing.xs : theme.spacing.sm,
    button: breakpoints.sm ? theme.spacing.xs : theme.spacing.sm,
    list: breakpoints.sm ? theme.spacing.xs : theme.spacing.sm,
    content: isLandscape ? theme.spacing.lg : theme.spacing.md,
  };
  
  const fontSizes = {
    heading1: breakpoints.sm ? theme.fontSizes.lg : 
              breakpoints.md ? theme.fontSizes.xl : 
              theme.fontSizes.xxl,
    heading2: breakpoints.sm ? theme.fontSizes.md : 
              breakpoints.md ? theme.fontSizes.lg : 
              theme.fontSizes.xl,
    body: breakpoints.sm ? theme.fontSizes.sm : theme.fontSizes.md,
    caption: breakpoints.sm ? theme.fontSizes.xs : theme.fontSizes.sm,
    button: breakpoints.sm ? theme.fontSizes.sm : theme.fontSizes.md,
  };
  
  const sizes = {
    button: {
      height: breakpoints.sm ? 40 : breakpoints.md ? 44 : 48,
      iconSize: breakpoints.sm ? 16 : breakpoints.md ? 20 : 24,
    },
    input: {
      height: breakpoints.sm ? 40 : breakpoints.md ? 44 : 48,
      fontSize: breakpoints.sm ? 14 : 16,
    },
    header: {
      height: breakpoints.sm ? 56 : breakpoints.md ? 64 : 72,
    },
    icon: {
      small: breakpoints.sm ? 16 : 20,
      medium: breakpoints.sm ? 24 : 28,
      large: breakpoints.sm ? 32 : 40,
    }
  };
  
  const layout = {
    singleColumn: breakpoints.sm || breakpoints.md || (breakpoints.lg && !isLandscape),
    twoColumn: (breakpoints.lg && isLandscape) || breakpoints.xl,
    maxContentWidth: breakpoints.lg ? 1024 : '100%',
    sidebarWidth: isLandscape ? (breakpoints.xl ? 320 : '30%') : (breakpoints.lg ? '40%' : '100%'),
    chatInputMaxHeight: breakpoints.sm ? 120 : 160,
    contentMaxWidth: breakpoints.sm ? '100%' : breakpoints.md ? '90%' : '80%',
    contentPadding: breakpoints.sm ? theme.spacing.sm : 
                    breakpoints.md ? theme.spacing.md : 
                    theme.spacing.lg,
  };
  
  return {
    width,
    height,
    isLandscape,
    breakpoints,
    deviceType,
    spacing,
    fontSizes,
    sizes,
    layout,
  };
};

export default useResponsive;
