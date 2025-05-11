import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  SafeAreaView, 
  Platform, 
  StatusBar 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import { useStore } from '../store';
import useColors from '../constants/colors';

type PlanOption = {
  id: 'free' | 'lite' | 'heavy';
  name: string;
  price: string;
  features: string[];
  modelAccess: string[];
};

const PLANS: PlanOption[] = [
  {
    id: 'free',
    name: 'フリープラン',
    price: '¥0 / 月',
    features: [
      '月間10,000トークン',
      '1日5回の画像生成',
      '基本AIモデルへのアクセス',
      'ローカルモデル対応',
    ],
    modelAccess: [
      'GPT-4o-mini',
      'GPT-4.1-mini',
      'GPT-4.1-nano',
      'Claude 3 Haiku',
      'Qwen3:4B (ローカル)',
    ],
  },
  {
    id: 'lite',
    name: 'Liteプラン',
    price: '¥780 / 月',
    features: [
      '月間150,000トークン',
      '1日20回の画像生成',
      '高性能AIモデルへのアクセス',
      'ローカルモデル対応',
    ],
    modelAccess: [
      'すべてのフリープランモデル',
      'GPT-4o',
      'GPT-4.1',
    ],
  },
  {
    id: 'heavy',
    name: 'Heavyプラン',
    price: '¥1,980 / 月',
    features: [
      '月間1,500,000トークン',
      '1日75回の画像生成',
      '最高性能AIモデルへのアクセス',
      'ローカルモデル対応',
    ],
    modelAccess: [
      'すべてのLiteプランモデル',
      'GPT-4.5',
      'Claude 3 Opus',
      'Claude 3 Sonnet',
      'Gemini 1.5 Pro',
    ],
  },
];

export default function SubscriptionScreen() {
  const router = useRouter();
  const colors = useColors();
  const isAuthenticated = useStore(state => state.isAuthenticated);
  const plan = useStore(state => state.plan);
  const setPlan = useStore(state => state.setPlan);
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.primary,
      paddingTop: Platform.OS === 'ios' ? 12 : StatusBar.currentHeight || 0,
      paddingBottom: 12,
      paddingHorizontal: 16,
      height: Platform.OS === 'ios' ? 100 : (StatusBar.currentHeight || 0) + 60,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      color: colors.background,
      fontSize: 18,
      fontWeight: '600',
      flex: 1,
      textAlign: 'center',
      marginHorizontal: 10,
    },
    headerRight: {
      width: 40,
    },
    scrollContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 16,
      paddingBottom: 40,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 8,
      textAlign: 'center',
      color: colors.text,
    },
    subtitle: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 24,
      color: colors.secondaryText,
    },
    planCard: {
      marginBottom: 20,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.lightGray,
      backgroundColor: colors.card,
      overflow: 'hidden',
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    currentPlanCard: {
      borderColor: colors.primary,
      borderWidth: 2,
    },
    planHeader: {
      padding: 16,
      backgroundColor: colors.lightGray,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    planName: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 4,
      color: colors.text,
    },
    planPrice: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.primary,
    },
    planFeatures: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    featureItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    featureText: {
      marginLeft: 8,
      fontSize: 16,
      color: colors.text,
    },
    modelAccess: {
      padding: 16,
      backgroundColor: `${colors.primary}10`,
    },
    modelAccessTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 8,
      color: colors.text,
    },
    modelAccessItem: {
      fontSize: 14,
      marginBottom: 4,
      color: colors.secondaryText,
      paddingLeft: 8,
    },
    selectButton: {
      margin: 16,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    selectPlanButton: {
      backgroundColor: colors.primary,
    },
    currentPlanButton: {
      backgroundColor: `${colors.primary}30`,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    selectButtonText: {
      fontSize: 16,
      fontWeight: 'bold',
      color: colors.background,
    },
    currentPlanButtonText: {
      color: colors.primary,
    },
    disclaimer: {
      fontSize: 12,
      textAlign: 'center',
      marginTop: 16,
      color: colors.secondaryText,
    },
  });
  
  const handleSelectPlan = (planId: 'free' | 'lite' | 'heavy') => {
    if (!isAuthenticated && planId !== 'free') {
      Alert.alert(
        'アカウントが必要です',
        'プレミアムプランを購入するには、アカウントを作成またはログインしてください。',
        [
          { text: 'キャンセル', style: 'cancel' },
          { 
            text: 'ログイン / 登録', 
            onPress: () => {
              alert('認証モーダルを表示');
            }
          }
        ]
      );
      return;
    }
    
    if (planId === plan) {
      return;
    }
    
    if (planId === 'free') {
      Alert.alert(
        'プランをダウングレード',
        'フリープランにダウングレードしますか？プレミアム機能へのアクセスが制限されます。',
        [
          { text: 'キャンセル', style: 'cancel' },
          { 
            text: 'ダウングレード', 
            onPress: () => {
              setPlan('free');
              Alert.alert('ダウングレードしました', 'フリープランに変更されました。');
            }
          }
        ]
      );
      return;
    }
    
    Alert.alert(
      'プランをアップグレード',
      `${planId === 'lite' ? 'Lite' : 'Heavy'}プランにアップグレードしますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: 'アップグレード', 
          onPress: () => {
            setPlan(planId);
            Alert.alert('アップグレードしました', `${planId === 'lite' ? 'Lite' : 'Heavy'}プランに変更されました。`);
          }
        }
      ]
    );
  };
  
  const renderPlanCard = (planOption: PlanOption) => {
    const isCurrentPlan = plan === planOption.id;
    
    return (
      <View 
        key={planOption.id}
        style={[
          styles.planCard,
          isCurrentPlan && styles.currentPlanCard
        ]}
      >
        <View style={styles.planHeader}>
          <Text style={styles.planName}>{planOption.name}</Text>
          <Text style={styles.planPrice}>{planOption.price}</Text>
        </View>
        
        <View style={styles.planFeatures}>
          {planOption.features.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.modelAccess}>
          <Text style={styles.modelAccessTitle}>利用可能なモデル:</Text>
          {planOption.modelAccess.map((model, index) => (
            <Text key={index} style={styles.modelAccessItem}>• {model}</Text>
          ))}
        </View>
        
        <TouchableOpacity
          style={[
            styles.selectButton,
            isCurrentPlan ? styles.currentPlanButton : styles.selectPlanButton
          ]}
          onPress={() => handleSelectPlan(planOption.id)}
          disabled={isCurrentPlan}
        >
          <Text style={[
            styles.selectButtonText,
            isCurrentPlan && styles.currentPlanButtonText
          ]}>
            {isCurrentPlan ? '現在のプラン' : '選択する'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };
  
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      
      <SafeAreaView style={styles.container}>
        {/* Custom Header with Safe Area for Notch */}
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.navigate('/(tabs)/settings')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={24} color={colors.background} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>
            サブスクリプション
          </Text>
          
          <View style={styles.headerRight} />
        </View>
        
        <ScrollView style={styles.scrollContainer} contentContainerStyle={styles.content}>
          <Text style={styles.title}>サブスクリプションプラン</Text>
          <Text style={styles.subtitle}>
            あなたのニーズに合ったプランを選択してください
          </Text>
          
          {PLANS.map(renderPlanCard)}
          
          <Text style={styles.disclaimer}>
            ※ トークン数は毎月1日にリセットされます。画像生成回数は毎日0時にリセットされます。
          </Text>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
