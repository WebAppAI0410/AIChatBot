import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import theme from '../ui/theme';
import useColors from '../constants/colors';

type ProgressBarProps = {
  percentage: number;
  color?: string;
  label?: string;
  height?: number;
  showLabel?: boolean;
  style?: any;
};

const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  color,
  label,
  height = 12,
  showLabel = true,
  style,
}) => {
  const colors = useColors();
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
  const progressColor = color || colors.primary;
  
  return (
    <View style={[styles.container, style]}>
      <View style={[styles.track, { height, backgroundColor: colors.lightGray }]}>
        <View
          style={[
            styles.progress,
            {
              width: `${clampedPercentage}%`,
              height: '100%',
              backgroundColor: progressColor,
            },
          ]}
        />
      </View>
      
      {showLabel && label && (
        <Text style={[styles.label, { color: colors.secondaryText }]}>
          {label}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: theme.spacing.sm,
  },
  track: {
    width: '100%',
    borderRadius: theme.radius.round,
    overflow: 'hidden',
  },
  progress: {
    borderRadius: theme.radius.round,
  },
  label: {
    fontSize: theme.fontSizes.sm,
    marginTop: theme.spacing.xs,
    textAlign: 'right',
  },
});

export default ProgressBar;
