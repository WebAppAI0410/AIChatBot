import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import theme from '../ui/theme';
import useColors from '../constants/colors';

type CardProps = {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'small' | 'medium' | 'large';
  style?: StyleProp<ViewStyle>;
};

const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  padding = 'medium',
  style,
}) => {
  const colors = useColors();
  
  const getCardStyle = () => {
    const baseStyle: ViewStyle = {
      backgroundColor: colors.card,
      borderRadius: theme.radius.lg,
      ...paddingStyles[padding],
    };
    
    switch (variant) {
      case 'elevated':
        return {
          ...baseStyle,
          ...theme.shadows.medium,
        };
      case 'outlined':
        return {
          ...baseStyle,
          borderWidth: theme.borderWidth.thin,
          borderColor: colors.border,
        };
      default:
        return baseStyle;
    }
  };
  
  return (
    <View 
      style={[getCardStyle(), style]}
      accessibilityRole="none"
      accessible={false}
    >
      {children}
    </View>
  );
};

const paddingStyles = {
  none: {
    padding: 0,
  },
  small: {
    padding: theme.spacing.sm,
  },
  medium: {
    padding: theme.spacing.md,
  },
  large: {
    padding: theme.spacing.lg,
  },
};

export default Card;
