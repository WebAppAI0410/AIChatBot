import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import theme from '../ui/theme';
import useColors from '../constants/colors';
import Badge from './Badge';

type UsageCounterProps = {
  label: string;
  current: number;
  limit: number | string;
  isPremium?: boolean;
  isUnlimited?: boolean;
  style?: any;
};

const UsageCounter: React.FC<UsageCounterProps> = ({
  label,
  current,
  limit,
  isPremium = false,
  isUnlimited = false,
  style,
}) => {
  const colors = useColors();
  
  const percentage = isUnlimited ? 0 : typeof limit === 'number' ? (current / limit) * 100 : 0;
  const isWarning = percentage >= 80 && percentage < 100;
  const isExceeded = percentage >= 100;
  
  const getValueColor = () => {
    if (isExceeded) return colors.error;
    if (isWarning) return colors.warning;
    return colors.text;
  };
  
  return (
    <View style={[styles.container, style]}>
      <View style={styles.labelContainer}>
        <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
        {isPremium && (
          <Badge
            label="Premium"
            variant="primary"
            size="small"
            style={styles.badge}
          />
        )}
      </View>
      
      <Text style={[styles.value, { color: getValueColor() }]}>
        {isUnlimited 
          ? `${current} / ∞` 
          : `${current} / ${limit}`
        }
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.xs,
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontSize: theme.fontSizes.md,
  },
  badge: {
    marginLeft: theme.spacing.xs,
  },
  value: {
    fontSize: theme.fontSizes.md,
    fontWeight: '500',
  },
});

export default UsageCounter;
