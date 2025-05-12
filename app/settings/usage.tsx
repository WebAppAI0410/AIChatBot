import React from 'react';
import { StyleSheet, View, Text, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import useColors from '../constants/colors';
import Header from '../components/Header';

// 型定義を追加
type ProgressBarProps = {
  percentage: number;
  color: string;
  label: string;
};

type UsageCounterProps = {
  label: string;
  current: number;
  limit: number;
  isPremium?: boolean;
  isUnlimited?: boolean;
};

type UpgradeButtonProps = {
  label: string;
  style?: any;
  onPress: () => void;
};

const ProgressBar: React.FC<ProgressBarProps> = ({ percentage, color, label }) => (
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

const UsageCounter: React.FC<UsageCounterProps> = ({ label, current, limit, isPremium = false, isUnlimited = false }) => {
  const colors = useColors();
  
  return (
    <View style={styles.usageCounterContainer}>
      <View style={styles.usageCounterLeft}>
        <Text style={[styles.usageCounterLabel, { color: colors.text }]}>{label}</Text>
        {isPremium && (
          <View style={[styles.premiumBadge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.premiumBadgeText, { color: colors.background }]}>Premium</Text>
          </View>
        )}
      </View>
      <Text style={[styles.usageCounterValue, { color: colors.text }]}>
        {isUnlimited ? `${current}/${limit}` : `${current}/${limit}`}
      </Text>
    </View>
  );
};

const UpgradeButton: React.FC<UpgradeButtonProps> = ({ label, style, onPress }) => {
  const colors = useColors();
  
  return (
    <TouchableOpacity 
      style={[
        styles.upgradeButton, 
        { backgroundColor: colors.primary },
        style
      ]} 
      onPress={onPress}
    >
      <Text style={[styles.upgradeButtonText, { color: colors.background }]}>{label}</Text>
    </TouchableOpacity>
  );
};

export default function UsageScreen() {
  const router = useRouter();
  const colors = useColors();
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

  // スタイルをコンポーネント内で定義して動的に色を適用できるようにする
  const dynamicStyles = {
    container: {
      backgroundColor: colors.background,
    },
    title: {
      color: colors.text,
    },
    subtitle: {
      color: colors.secondaryText,
    },
    sectionTitle: {
      color: colors.text,
    },
    progressBarLabel: {
      color: colors.darkGray,
    },
    usageCounterContainer: {
      borderBottomColor: colors.lightGray,
    }
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      
      <Header 
        title="使用量" 
        showBack={true}
        onBackPress={() => router.replace('/(tabs)/settings')}
      />

      <ScrollView style={styles.scrollContainer}>
        <View style={styles.contentHeader}>
          <Ionicons name="analytics-outline" size={48} color={colors.primary} />
          <Text style={[styles.title, dynamicStyles.title]}>使用量</Text>
          <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
            現在のプラン使用状況
          </Text>
        </View>
        
        <View style={styles.content}>
          <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>トークン使用量</Text>
          <ProgressBar
            percentage={tokenPercentage}
            color={tokenWarning ? colors.warning : colors.primary}
            label={`${monthlyTokensUsed.toLocaleString()}/${monthlyTokensLimit.toLocaleString()}`}
          />

          <Text style={[styles.sectionTitle, styles.marginTop, dynamicStyles.sectionTitle]}>画像生成</Text>
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

          <Text style={[styles.sectionTitle, styles.marginTop, dynamicStyles.sectionTitle]}>AIアシスト</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  contentHeader: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
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
  },
  usageCounterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usageCounterLabel: {
    fontSize: 16,
  },
  usageCounterValue: {
    fontSize: 16,
  },
  premiumBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  premiumBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  upgradeButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  upgradeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
