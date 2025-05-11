import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../ui/theme';
import useColors from '../constants/colors';
import Button from './Button';

type QuotaWarningBannerProps = {
  quotaType: 'tokens' | 'images' | 'aiAssist';
  percentRemaining: number;
  onUpgrade?: () => void;
  onDismiss?: () => void;
};

const QuotaWarningBanner: React.FC<QuotaWarningBannerProps> = ({
  quotaType,
  percentRemaining,
  onUpgrade,
  onDismiss,
}) => {
  const colors = useColors();
  
  const getQuotaTypeLabel = () => {
    switch (quotaType) {
      case 'tokens':
        return 'トークン';
      case 'images':
        return '画像生成';
      case 'aiAssist':
        return 'AIアシスト';
      default:
        return 'クォータ';
    }
  };
  
  const getMessage = () => {
    const quotaLabel = getQuotaTypeLabel();
    if (percentRemaining <= 0) {
      return `${quotaLabel}の月間クォータを使い切りました。プランをアップグレードするか、来月まで待ってください。`;
    } else {
      return `${quotaLabel}の月間クォータが残り${percentRemaining}%です。プランをアップグレードして制限を増やしましょう。`;
    }
  };
  
  return (
    <View style={[
      styles.container,
      theme.componentStyles.quotaWarning.container,
    ]}>
      <View style={styles.iconContainer}>
        <Ionicons
          name="warning-outline"
          size={24}
          color={colors.warning}
        />
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={[
          styles.message,
          theme.componentStyles.quotaWarning.text,
        ]}>
          {getMessage()}
        </Text>
        
        {onUpgrade && (
          <Button
            title="プランをアップグレード"
            variant="primary"
            size="small"
            iconName="arrow-up-circle-outline"
            onPress={onUpgrade}
            style={styles.upgradeButton}
          />
        )}
      </View>
      
      {onDismiss && (
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={onDismiss}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Ionicons
            name="close"
            size={20}
            color={colors.gray}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: theme.spacing.md,
  },
  iconContainer: {
    marginRight: theme.spacing.md,
  },
  contentContainer: {
    flex: 1,
  },
  message: {
    fontSize: theme.fontSizes.sm,
    marginBottom: theme.spacing.sm,
  },
  upgradeButton: {
    alignSelf: 'flex-start',
  },
  dismissButton: {
    padding: theme.spacing.xs,
  },
});

export default QuotaWarningBanner;
