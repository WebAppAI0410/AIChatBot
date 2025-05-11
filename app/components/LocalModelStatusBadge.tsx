import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../ui/theme';
import useColors from '../constants/colors';

export type ModelStatus = 'not_installed' | 'downloading' | 'ready' | 'error';

type LocalModelStatusBadgeProps = {
  status: ModelStatus;
  progress?: number;
  compact?: boolean;
};

const LocalModelStatusBadge: React.FC<LocalModelStatusBadgeProps> = ({
  status,
  progress = 0,
  compact = false,
}) => {
  const colors = useColors();
  
  const getStatusConfig = () => {
    switch (status) {
      case 'not_installed':
        return {
          label: compact ? '未' : '未インストール',
          icon: 'cloud-download-outline',
          color: theme.componentStyles.badge.notInstalled.backgroundColor,
        };
      case 'downloading':
        return {
          label: compact ? `${Math.round(progress * 100)}%` : `ダウンロード中 ${Math.round(progress * 100)}%`,
          icon: 'arrow-down-outline',
          color: theme.componentStyles.badge.downloading.backgroundColor,
        };
      case 'ready':
        return {
          label: compact ? '済' : 'インストール済み',
          icon: 'checkmark-outline',
          color: theme.componentStyles.badge.ready.backgroundColor,
        };
      case 'error':
        return {
          label: compact ? 'エラー' : 'インストールエラー',
          icon: 'alert-circle-outline',
          color: theme.componentStyles.badge.error.backgroundColor,
        };
      default:
        return {
          label: compact ? '未' : '未インストール',
          icon: 'cloud-download-outline',
          color: theme.componentStyles.badge.notInstalled.backgroundColor,
        };
    }
  };
  
  const statusConfig = getStatusConfig();
  
  return (
    <View style={[
      styles.container,
      { backgroundColor: statusConfig.color },
      compact && styles.compactContainer,
    ]}>
      <Ionicons
        name={statusConfig.icon as any}
        size={compact ? 12 : 14}
        color="#FFFFFF"
        style={styles.icon}
      />
      <Text style={[
        styles.label,
        compact && styles.compactLabel,
      ]}>
        {statusConfig.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.md,
  },
  compactContainer: {
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    borderRadius: theme.radius.sm,
  },
  icon: {
    marginRight: theme.spacing.xs,
  },
  label: {
    color: '#FFFFFF',
    fontSize: theme.fontSizes.sm,
    fontWeight: '500',
  },
  compactLabel: {
    fontSize: theme.fontSizes.xs,
  },
});

export default LocalModelStatusBadge;
