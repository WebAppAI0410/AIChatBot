import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { colors } from '../constants/colors';

const ProgressBar = ({ percentage, color, label }) => (
  <View style={[styles.progressBarContainer]}>
    <View style={[styles.progressBarBackground]}>
      <View
        style={[
          styles.progressBarFill,
          {
            backgroundColor: color,
            width: `${percentage}%`,
          }
        ]}
      />
    </View>
    <Text style={styles.progressBarLabel}>{label}</Text>
  </View>
);

const UsageCounter = ({ label, current, limit, isPremium = false, isUnlimited = false }) => (
  <View style={styles.usageCounterContainer}>
    <View style={styles.usageCounterLeft}>
      <Text style={styles.usageCounterLabel}>{label}</Text>
      {isPremium && (
        <View style={styles.premiumBadge}>
          <Text style={styles.premiumBadgeText}>Premium</Text>
        </View>
      )}
    </View>
    <Text style={styles.usageCounterValue}>
      {isUnlimited ? `${current}/${limit}` : `${current}/${limit}`}
    </Text>
  </View>
);

const UpgradeButton = ({ label, style, onPress }) => (
  <TouchableOpacity 
    style={[styles.upgradeButton, style]} 
    onPress={onPress}
  >
    <Text style={styles.upgradeButtonText}>{label}</Text>
  </TouchableOpacity>
);

export default function UsageScreen() {
  const router = useRouter();
  const {
    plan,
    monthlyTokensUsed,
    monthlyTokensLimit,
    dailyImageGenCount,
    dailyImageGenLimit
  } = useStore(state => state);

  const tokenPercentage = Math.min(100, Math.round((monthlyTokensUsed / monthlyTokensLimit) * 100));
  const tokenWarning = tokenPercentage >= 80;

  const imageUsage = {
    dalle: Math.round(dailyImageGenCount * 0.7), // 70% of daily usage
    sdxl: Math.round(dailyImageGenCount * 0.3)   // 30% of daily usage
  };

  const imageLimit = {
    dalle: Math.round(dailyImageGenLimit * 0.7),
    sdxl: Math.round(dailyImageGenLimit * 0.3)
  };

  const aiAssistUsage = 15;
  const aiAssistLimit = plan === 'free' ? 30 : plan === 'lite' ? 100 : 300;

  const handleUpgrade = () => {
    router.push('/settings/subscription');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: '使用量',
          headerLeft: () => (
            <TouchableOpacity 
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons name="chevron-back" size={24} color={colors.background} />
            </TouchableOpacity>
          ),
          headerStyle: {
            backgroundColor: colors.primary,
          },
          headerTintColor: colors.background,
        }}
      />

      <ScrollView style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>トークン使用量</Text>
          <ProgressBar
            percentage={tokenPercentage}
            color={tokenWarning ? colors.warning : colors.primary}
            label={`${monthlyTokensUsed.toLocaleString()}/${monthlyTokensLimit.toLocaleString()}`}
          />

          <Text style={[styles.sectionTitle, styles.marginTop]}>画像生成</Text>
          <View style={styles.usageCountersContainer}>
            <UsageCounter
              label="DALL-E"
              current={imageUsage.dalle}
              limit={imageLimit.dalle}
              isPremium={true}
            />
            <UsageCounter
              label="SDXL"
              current={imageUsage.sdxl}
              limit={imageLimit.sdxl}
              isPremium={false}
              isUnlimited={false}
            />
          </View>

          <Text style={[styles.sectionTitle, styles.marginTop]}>AIアシスト</Text>
          <ProgressBar
            percentage={(aiAssistUsage / aiAssistLimit) * 100}
            color={colors.accentBlue}
            label={`${aiAssistUsage}/${aiAssistLimit}`}
          />

          {plan !== 'heavy' && (
            <UpgradeButton
              style={styles.marginTop}
              label={`${plan === 'free' ? 'Lite' : 'Heavy'}にアップグレード`}
              onPress={handleUpgrade}
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  marginTop: {
    marginTop: 24,
  },
  progressBarContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  progressBarBackground: {
    backgroundColor: '#E0E0E0',
    height: 24,
    borderRadius: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 12,
  },
  progressBarLabel: {
    fontSize: 14,
    color: colors.darkGray,
    marginTop: 4,
  },
  usageCountersContainer: {
    marginTop: 8,
  },
  usageCounterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  usageCounterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usageCounterLabel: {
    fontSize: 16,
    color: colors.text,
  },
  usageCounterValue: {
    fontSize: 16,
    color: colors.text,
  },
  premiumBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  premiumBadgeText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: '500',
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  upgradeButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
});
