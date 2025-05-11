import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  Easing 
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import theme from '../ui/theme';
import useColors from '../constants/colors';

type AnimatedButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'text';
  size?: 'small' | 'medium' | 'large';
  iconName?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  iconName,
  iconPosition = 'left',
  disabled = false,
  style,
  textStyle,
}) => {
  const colors = useColors();
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const handlePressIn = () => {
    scale.value = withTiming(0.95, { 
      duration: theme.animation.fast,
      easing: Easing.inOut(Easing.ease),
    });
  };
  
  const handlePressOut = () => {
    scale.value = withTiming(1, { 
      duration: theme.animation.fast,
      easing: Easing.inOut(Easing.ease),
    });
  };
  
  const getButtonStyles = () => {
    const baseStyle: ViewStyle = {
      ...getSizeStyles().container,
      opacity: disabled ? 0.6 : 1,
    };
    
    switch (variant) {
      case 'primary':
        return {
          ...baseStyle,
          backgroundColor: colors.primary,
        };
      case 'secondary':
        return {
          ...baseStyle,
          backgroundColor: colors.accentBlue,
        };
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
          borderWidth: theme.borderWidth.thin,
          borderColor: colors.primary,
        };
      case 'danger':
        return {
          ...baseStyle,
          backgroundColor: colors.error,
        };
      case 'text':
        return {
          ...baseStyle,
          backgroundColor: 'transparent',
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: colors.primary,
        };
    }
  };
  
  const getTextStyles = () => {
    const baseStyle: TextStyle = {
      ...getSizeStyles().text,
      fontWeight: '500',
    };
    
    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'danger':
        return {
          ...baseStyle,
          color: colors.textOnPrimary,
        };
      case 'outline':
        return {
          ...baseStyle,
          color: colors.primary,
        };
      case 'text':
        return {
          ...baseStyle,
          color: colors.primary,
        };
      default:
        return {
          ...baseStyle,
          color: colors.textOnPrimary,
        };
    }
  };
  
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          container: {
            paddingVertical: theme.spacing.xs,
            paddingHorizontal: theme.spacing.sm,
            borderRadius: theme.radius.sm,
          },
          text: {
            fontSize: theme.fontSizes.sm,
          },
          icon: {
            size: 16,
            marginHorizontal: theme.spacing.xs,
          },
        };
      case 'large':
        return {
          container: {
            paddingVertical: theme.spacing.md,
            paddingHorizontal: theme.spacing.lg,
            borderRadius: theme.radius.lg,
          },
          text: {
            fontSize: theme.fontSizes.lg,
          },
          icon: {
            size: 24,
            marginHorizontal: theme.spacing.sm,
          },
        };
      default: // medium
        return {
          container: {
            paddingVertical: theme.spacing.sm,
            paddingHorizontal: theme.spacing.md,
            borderRadius: theme.radius.md,
          },
          text: {
            fontSize: theme.fontSizes.md,
          },
          icon: {
            size: 20,
            marginHorizontal: theme.spacing.xs,
          },
        };
    }
  };
  
  const buttonStyles = getButtonStyles();
  const textStyles = getTextStyles();
  const sizeStyles = getSizeStyles();
  
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      onPressIn={disabled ? undefined : handlePressIn}
      onPressOut={disabled ? undefined : handlePressOut}
      style={styles.pressable}
      disabled={disabled}
    >
      <Animated.View style={[buttonStyles, animatedStyle, style]}>
        <Animated.View style={styles.contentContainer}>
          {iconName && iconPosition === 'left' && (
            <Ionicons
              name={iconName}
              size={sizeStyles.icon.size}
              color={textStyles.color as string}
              style={{ marginRight: sizeStyles.icon.marginHorizontal }}
            />
          )}
          
          <Text style={[textStyles, textStyle]}>
            {title}
          </Text>
          
          {iconName && iconPosition === 'right' && (
            <Ionicons
              name={iconName}
              size={sizeStyles.icon.size}
              color={textStyles.color as string}
              style={{ marginLeft: sizeStyles.icon.marginHorizontal }}
            />
          )}
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: {
    alignSelf: 'flex-start',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default AnimatedButton;
