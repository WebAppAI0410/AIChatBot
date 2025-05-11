import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import theme from '../ui/theme';
import useColors from '../constants/colors';

type BadgeProps = {
  label?: string;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'small' | 'medium' | 'large';
  showDot?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
};

const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'medium',
  showDot = false,
  style,
  textStyle,
}) => {
  const colors = useColors();
  
  const getBadgeColor = () => {
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'error':
        return colors.error;
      case 'info':
        return colors.accentBlue;
      default:
        return colors.primary;
    }
  };
  
  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: theme.spacing.xs / 2,
          paddingHorizontal: label ? theme.spacing.xs : theme.spacing.xs / 2,
          borderRadius: theme.radius.sm,
          dotSize: 6,
          fontSize: theme.fontSizes.xs,
        };
      case 'medium':
        return {
          paddingVertical: theme.spacing.xs,
          paddingHorizontal: label ? theme.spacing.sm : theme.spacing.xs,
          borderRadius: theme.radius.md,
          dotSize: 8,
          fontSize: theme.fontSizes.sm,
        };
      case 'large':
        return {
          paddingVertical: theme.spacing.sm,
          paddingHorizontal: label ? theme.spacing.md : theme.spacing.sm,
          borderRadius: theme.radius.lg,
          dotSize: 10,
          fontSize: theme.fontSizes.md,
        };
      default:
        return {
          paddingVertical: theme.spacing.xs,
          paddingHorizontal: label ? theme.spacing.sm : theme.spacing.xs,
          borderRadius: theme.radius.md,
          dotSize: 8,
          fontSize: theme.fontSizes.sm,
        };
    }
  };
  
  const sizeStyle = getSizeStyle();
  const badgeColor = getBadgeColor();
  
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: badgeColor,
          paddingVertical: sizeStyle.paddingVertical,
          paddingHorizontal: sizeStyle.paddingHorizontal,
          borderRadius: sizeStyle.borderRadius,
        },
        !label && { width: sizeStyle.dotSize * 2, height: sizeStyle.dotSize * 2 },
        style,
      ]}
    >
      {showDot && !label && (
        <View
          style={[
            styles.dot,
            {
              width: sizeStyle.dotSize,
              height: sizeStyle.dotSize,
              borderRadius: sizeStyle.dotSize / 2,
            },
          ]}
        />
      )}
      
      {label && (
        <Text
          style={[
            styles.text,
            { fontSize: sizeStyle.fontSize, color: theme.colors.text.inverse },
            textStyle,
          ]}
        >
          {label}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '500',
  },
  dot: {
    backgroundColor: '#FFFFFF',
  },
});

export default Badge;
