import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../ui/theme';
import useColors from '../constants/colors';

type AccessibleButtonProps = {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'text';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  label,
  onPress,
  icon,
  iconPosition = 'left',
  variant = 'primary',
  disabled = false,
  style,
  textStyle,
}) => {
  const colors = useColors();
  
  const getButtonStyles = () => {
    const baseStyle: ViewStyle = {
      opacity: disabled ? 0.6 : 1,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.md,
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
      fontSize: theme.fontSizes.md,
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
  
  const buttonStyles = getButtonStyles();
  const textStyles = getTextStyles();
  
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      style={({ pressed }) => [
        buttonStyles,
        pressed && styles.buttonPressed,
        style,
      ]}
      disabled={disabled}
    >
      <Text style={[styles.contentContainer]}>
        {icon && iconPosition === 'left' && (
          <Ionicons
            name={icon}
            size={20}
            color={textStyles.color as string}
            style={styles.leftIcon}
          />
        )}
        
        <Text style={[textStyles, textStyle]}>
          {label}
        </Text>
        
        {icon && iconPosition === 'right' && (
          <Ionicons
            name={icon}
            size={20}
            color={textStyles.color as string}
            style={styles.rightIcon}
          />
        )}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  buttonPressed: {
    opacity: 0.8,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leftIcon: {
    marginRight: theme.spacing.xs,
  },
  rightIcon: {
    marginLeft: theme.spacing.xs,
  },
});

export default AccessibleButton;
