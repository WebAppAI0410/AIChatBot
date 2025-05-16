import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useStore } from '../store';
import { PLANS } from '../constants/plans';
import useColors from '../constants/colors';
import { useTheme } from '../ui/ThemeProvider';

// 明示的なPlanId型定義
type PlanId = 'free' | 'lite' | 'premium';

// スタイルをコンポーネント外に移動
const createStyles = (theme: any, colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: {
    marginVertical: theme.spacing.lg,
    marginHorizontal: theme.spacing.md,
    padding: theme.spacing.md,
    backgroundColor: colors.card,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  title: {
    fontSize: theme.fontSizes.lg,
    fontWeight: 'bold',
    marginBottom: theme.spacing.md,
    color: colors.text,
  },
  planContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  planButton: {
    flex: 1,
    padding: theme.spacing.md,
    marginHorizontal: theme.spacing.xs,
    marginVertical: theme.spacing.xs,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    backgroundColor: colors.lightGray,
    minWidth: 100,
  },
  activePlan: {
    backgroundColor: colors.primary,
  },
  planText: {
    fontSize: theme.fontSizes.md,
    fontWeight: '500',
    color: colors.text,
  },
  activePlanText: {
    color: colors.textOnPrimary,
    fontWeight: 'bold',
  },
  note: {
    marginTop: theme.spacing.md,
    fontSize: theme.fontSizes.sm,
    color: colors.secondaryText,
    fontStyle: 'italic',
    textAlign: 'center',
  },
});

/**
 * 開発モード専用のプラン切替コンポーネント
 * 本番ビルドでは表示されません
 */
const DevPlanSwitcher = () => {
  const { plan, setPlan } = useStore();
  const colors = useColors();
  const { theme } = useTheme();

  // スタイルをメモ化
  const styles = useMemo(() => createStyles(theme, colors), [theme, colors]);

  // 開発モードでのプラン切替処理
  const switchPlan = (newPlanId: PlanId) => {
    setPlan(newPlanId);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>開発モード: プラン切替</Text>

      <View style={styles.planContainer}>
        {Object.entries(PLANS).map(([planKey, planData]) => {
          const isPlanActive = plan === planData.id;
          return (
            <TouchableOpacity
              key={planKey}
              style={[
                styles.planButton,
                isPlanActive && styles.activePlan
              ]}
              onPress={() => switchPlan(planData.id as PlanId)}
              accessibilityRole="button"
              accessibilityLabel={`${planData.name}プランに切り替え`}
              accessibilityState={{ selected: isPlanActive }}
            >
              <Text style={[
                styles.planText,
                isPlanActive && styles.activePlanText
              ]}>
                {planData.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.note}>
        ※開発モードでは支払い処理をスキップします
      </Text>
    </View>
  );
};

export default DevPlanSwitcher; 