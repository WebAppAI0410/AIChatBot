import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../ui/theme';
import useColors from '../constants/colors';

type ListItemProps = {
  title: string;
  subtitle?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap | 'chevron';
  onPress?: () => void;
  selected?: boolean;
  style?: ViewStyle;
  badge?: React.ReactNode;
};

const ListItem: React.FC<ListItemProps> = ({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  onPress,
  selected = false,
  style,
  badge,
}) => {
  const colors = useColors();
  
  const Container = onPress ? TouchableOpacity : View;
  
  return (
    <Container
      style={[
        styles.container,
        { borderBottomColor: colors.border },
        selected && { backgroundColor: colors.lightGray },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {leftIcon && (
        <View style={styles.leftIconContainer}>
          <Ionicons name={leftIcon} size={24} color={colors.primary} />
        </View>
      )}
      
      <View style={styles.contentContainer}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        
        {subtitle && (
          <Text style={[styles.subtitle, { color: colors.secondaryText }]} numberOfLines={2}>
            {subtitle}
          </Text>
        )}
      </View>
      
      {badge && (
        <View style={styles.badgeContainer}>
          {badge}
        </View>
      )}
      
      {rightIcon && (
        <View style={styles.rightIconContainer}>
          <Ionicons
            name={rightIcon === 'chevron' ? 'chevron-forward' : rightIcon}
            size={rightIcon === 'chevron' ? 20 : 24}
            color={colors.gray}
          />
        </View>
      )}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderBottomWidth: theme.borderWidth.thin,
  },
  leftIconContainer: {
    marginRight: theme.spacing.md,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: theme.fontSizes.md,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: theme.fontSizes.sm,
    marginTop: theme.spacing.xs,
  },
  badgeContainer: {
    marginRight: theme.spacing.sm,
  },
  rightIconContainer: {
    marginLeft: theme.spacing.sm,
  },
});

export default ListItem;
