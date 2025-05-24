import React, { useMemo, useState } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  Pressable,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import useColors from '../constants/colors';
import { MODELS, ModelType } from '../constants/models';
import { PLANS, DAILY_LIMITS } from '../constants/plans';
import { useTheme } from '../ui/ThemeProvider';
import Badge from './Badge';
import LocalModelStatusBadge from './LocalModelStatusBadge';

type ModelSelectModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelectModel: (modelId: string) => void;
  currentModelId: string;
};

export default function ModelSelectModal({
  visible,
  onClose,
  onSelectModel,
  currentModelId
}: ModelSelectModalProps) {
  const localModelStatus = useStore(state => state.localModelStatus);
  const plan = useStore(state => state.plan);
  const dailyImageGenCount = useStore(state => state.dailyImageGenCount);
  const dailyModelQuotasCount = useStore(state => state.dailyModelQuotasCount || {});
  const incrementModelUsageCount = useStore(state => state.incrementModelUsageCount);
  const colors = useColors();
  const { theme } = useTheme();
  
  // プロバイダー展開状態を管理
  const [expandedProviders, setExpandedProviders] = useState<Set<string>>(new Set(['auto', 'openai'])); // デフォルトでOpenAIを展開
  
  // プロバイダー情報の定義（実際のロゴを使用）
  const PROVIDER_INFO = {
    'auto': { name: 'Auto', icon: '🤖', color: colors.primary },
    'openai': { name: 'OpenAI', logoText: 'OAI', color: '#10A37F' },
    'google': { name: 'Google', logoText: 'G', color: '#4285F4' },
    'anthropic': { name: 'Anthropic', logoText: 'A', color: '#D2691E' },
    'deepseek': { name: 'DeepSeek', logoText: 'DS', color: '#6B46C1' },
    'local': { name: 'ローカル', icon: '💻', color: colors.accentBlue },
  };
  
  // プロバイダーの展開/格納を切り替え
  const toggleProvider = (provider: string) => {
    const newExpanded = new Set(expandedProviders);
    if (newExpanded.has(provider)) {
      newExpanded.delete(provider);
    } else {
      newExpanded.add(provider);
    }
    setExpandedProviders(newExpanded);
  };
  
  // モデルのクォータが残っているかチェック
  const isModelQuotaAvailable = (model: ModelType) => {
    // dailyLimitがないモデルは常に利用可能（プラン制限は別途チェック）
    if (!model.dailyLimit) return true;
    
    // モデルIDベースの使用回数カウンターがなければ利用可能
    if (!dailyModelQuotasCount[model.id]) return true;
    
    // 使用回数が制限未満かチェック
    return dailyModelQuotasCount[model.id] < model.dailyLimit;
  };
  
  const handleModelSelect = (model: ModelType) => {
    // ローカルモデルが準備できていない場合は選択不可
    if (model.isLocal && localModelStatus !== 'ready') {
      return;
    }

    // プラン制限に引っかかり、かつ日次制限のないモデルは選択不可
    if (!isModelAvailableForPlan(model) && !model.dailyLimit) {
      return;
    }
    
    // 日次制限があり、その制限に達したモデルは選択不可
    if (model.dailyLimit && !isModelQuotaAvailable(model)) {
      return;
    }
    
    // モデル選択時に使用回数をインクリメント（dailyLimitがあるモデルのみ）
    if (model.dailyLimit) {
      incrementModelUsageCount(model.id);
    }
    
    onSelectModel(model.id);
    onClose();
  };
  
  const getAvailableTiers = () => {
    switch (plan) {
      case 'premium':
        return PLANS.PREMIUM.modelTiers;
      case 'lite':
        return PLANS.LITE.modelTiers;
      case 'free':
      default:
        return PLANS.FREE.modelTiers;
    }
  };
  
  const isModelAvailableForPlan = (model: ModelType) => {
    const availableTiers = getAvailableTiers();
    return availableTiers.includes(model.tier);
  };
  
  // モデルが無効かどうかを判定する関数
  const isModelDisabled = (model: ModelType) => {
    // ローカルモデルの場合は準備状態をチェック
    if (model.isLocal) {
      return localModelStatus !== 'ready';
    }
    
    // プランでの利用資格チェック
    const planRestricted = !isModelAvailableForPlan(model) && !model.dailyLimit;
    
    // 日次制限のあるモデルは使用回数をチェック
    const quotaRestricted = model.dailyLimit && !isModelQuotaAvailable(model);
    
    return planRestricted || quotaRestricted;
  };
  
  const getModelTierBadge = (model: ModelType) => {
    if (model.isAuto) {
      return (
        <Badge
          label="Auto"
          variant="primary"
          size="small"
          style={styles.tierBadge}
        />
      );
    }
    
    if (model.isLocal) {
      return (
        <LocalModelStatusBadge
          status={localModelStatus}
          compact={true}
        />
      );
    }
    
    if (model.dailyLimit) {
      // 使用回数を表示（残り回数ではなく使用済み/総数）
      const usedCount = dailyModelQuotasCount[model.id] || 0;
      const isQuotaExceeded = usedCount >= model.dailyLimit;
      
      return (
        <Badge
          label={`${usedCount}/${model.dailyLimit}/日`}
          variant={isQuotaExceeded ? "error" : "warning"}
          size="small"
          style={styles.tierBadge}
        />
      );
    }
    
    if (!isModelAvailableForPlan(model)) {
      const tierName = model.tier === 1 ? 'Lite' : 'Premium';
      return (
        <Badge
          label={tierName}
          variant="info"
          size="small"
          style={styles.tierBadge}
        />
      );
    }
    
    return null;
  };
  
  const groupedModelsByProvider = useMemo(() => {
    const groups: { [key: string]: ModelType[] } = {};
    
    // プロバイダー別にグループ化
    MODELS.forEach(model => {
      const provider = model.isAuto ? 'auto' : model.isLocal ? 'local' : model.provider || 'other';
      if (!groups[provider]) {
        groups[provider] = [];
      }
      groups[provider].push(model);
    });
    
    // 各プロバイダー内でtier順にソート
    Object.keys(groups).forEach(provider => {
      groups[provider].sort((a, b) => {
        if (a.tier !== b.tier) return a.tier - b.tier;
        return a.name.localeCompare(b.name);
      });
    });
    
    return groups;
  }, [MODELS]);
  
  // プロバイダー別にフィルタリング（利用可能性チェック）
  const getFilteredProviderModels = (provider: string): ModelType[] => {
    const models = groupedModelsByProvider[provider] || [];
    return models.filter(model => {
      const availableTiers = getAvailableTiers();
      
      // ローカルモデルは常に表示
      if (model.isLocal) return true;
      
      // Autoモデルは常に表示
      if (model.isAuto) return true;
      
      // プラン制限をチェック
      if (model.isPremium && !availableTiers.includes(model.tier) && !model.dailyLimit) {
        return false;
      }
      
      return true;
    });
  };
  
  const styles = StyleSheet.create({
    modalContainer: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
      backgroundColor: colors.background,
      borderTopLeftRadius: theme.radius.lg,
      borderTopRightRadius: theme.radius.lg,
      maxHeight: '80%',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing.md,
      borderBottomWidth: theme.borderWidth.thin,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: theme.fontSizes.lg,
      fontWeight: 'bold',
      color: colors.text,
    },
    closeButton: {
      padding: theme.spacing.xs,
    },
    modelList: {
      padding: theme.spacing.md,
    },
    modelItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.radius.md,
      marginBottom: theme.spacing.sm,
      backgroundColor: colors.card,
    },
    selectedModelItem: {
      backgroundColor: `${colors.primary}20`,
      borderWidth: theme.borderWidth.thin,
      borderColor: colors.primary,
    },
    disabledModelItem: {
      opacity: 0.7,
    },
    modelInfo: {
      flex: 1,
      marginRight: theme.spacing.sm,
    },
    modelName: {
      fontSize: theme.fontSizes.md,
      fontWeight: 'bold',
      marginBottom: theme.spacing.xs,
      color: colors.text,
    },
    selectedModelName: {
      color: colors.primary,
    },
    disabledModelName: {
      color: colors.secondaryText,
    },
    modelDescription: {
      fontSize: theme.fontSizes.sm,
      color: colors.secondaryText,
    },
    selectedModelDescription: {
      color: colors.secondaryText,
    },
    disabledModelDescription: {
      color: colors.secondaryText,
    },
    modelRight: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    radioOuter: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: theme.borderWidth.thin,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
    },
    radioInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: colors.primary,
    },
    tierBadge: {
      marginRight: theme.spacing.sm,
    },
    sectionHeader: {
      fontSize: theme.fontSizes.md,
      fontWeight: '600',
      color: colors.text,
      marginTop: theme.spacing.md,
      marginBottom: theme.spacing.sm,
      paddingHorizontal: theme.spacing.xs,
    },
    providerBadge: {
      marginRight: theme.spacing.sm,
      backgroundColor: colors.lightGray,
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: 2,
      borderRadius: theme.radius.sm,
    },
    providerText: {
      fontSize: theme.fontSizes.xs,
      color: colors.secondaryText,
    },
    quotaExceededText: {
      fontSize: theme.fontSizes.xs, 
      color: colors.error,
      marginTop: 2,
    },
    providerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      backgroundColor: colors.lightGray + '40',
      marginBottom: theme.spacing.xs,
      borderRadius: theme.radius.md,
    },
    providerInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    providerIcon: {
      fontSize: 20,
      marginRight: theme.spacing.sm,
    },
    providerLogo: {
      width: 24,
      height: 24,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.sm,
    },
    providerLogoText: {
      fontSize: 12,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },
    providerName: {
      fontSize: theme.fontSizes.md,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
    },
    providerCount: {
      fontSize: theme.fontSizes.sm,
      color: colors.secondaryText,
      marginRight: theme.spacing.sm,
    },
    expandIcon: {
      padding: theme.spacing.xs,
    },
    providerModels: {
      paddingLeft: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
  });
  
  // プロバイダーヘッダーのレンダリング
  const renderProviderHeader = (provider: string, models: ModelType[]) => {
    const isExpanded = expandedProviders.has(provider);
    const providerInfo = PROVIDER_INFO[provider] || { name: provider, icon: '📁', color: colors.text };
    
    return (
      <TouchableOpacity
        style={styles.providerHeader}
        onPress={() => toggleProvider(provider)}
        activeOpacity={0.7}
      >
        <View style={styles.providerInfo}>
          {providerInfo.logoText ? (
            <View style={[styles.providerLogo, { backgroundColor: providerInfo.color }]}>
              <Text style={styles.providerLogoText}>{providerInfo.logoText}</Text>
            </View>
          ) : (
            <Text style={styles.providerIcon}>{providerInfo.icon}</Text>
          )}
          <Text style={styles.providerName}>{providerInfo.name}</Text>
          <Text style={styles.providerCount}>({models.length})</Text>
        </View>
        <View style={styles.expandIcon}>
          <Ionicons 
            name={isExpanded ? "chevron-down" : "chevron-forward"} 
            size={20} 
            color={colors.secondaryText} 
          />
        </View>
      </TouchableOpacity>
    );
  };

  // モデルアイテムのレンダリング
  const renderModelItem = (item: ModelType) => {
    const isSelected = item.id === currentModelId;
    const isDisabled = isModelDisabled(item);
    const hasReachedQuota = item.dailyLimit && (dailyModelQuotasCount[item.id] || 0) >= (item.dailyLimit || 0);
    
    return (
      <TouchableOpacity
        key={item.id}
        style={[
          styles.modelItem,
          isSelected ? styles.selectedModelItem : undefined,
          isDisabled ? styles.disabledModelItem : undefined
        ]}
        onPress={() => handleModelSelect(item)}
        disabled={!!isDisabled}
      >
        <View style={styles.modelInfo}>
          <Text style={[
            styles.modelName,
            isSelected ? styles.selectedModelName : undefined,
            isDisabled ? styles.disabledModelName : undefined
          ]}>
            {item.name}
          </Text>
          <Text style={[
            styles.modelDescription,
            isSelected ? styles.selectedModelDescription : undefined,
            isDisabled ? styles.disabledModelDescription : undefined
          ]}>
            {item.description}
          </Text>
          {hasReachedQuota && (
            <Text style={styles.quotaExceededText}>
              本日の利用上限に達しました
            </Text>
          )}
        </View>
        
        <View style={styles.modelRight}>
          {getModelTierBadge(item)}
          
          {isSelected ? (
            <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
          ) : (
            <View style={styles.radioOuter}>
              {isSelected ? <View style={styles.radioInner} /> : null}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };
  
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>モデルを選択</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modelList} showsVerticalScrollIndicator={false}>
            {Object.entries(groupedModelsByProvider)
              .sort(([a], [b]) => {
                // 順序を定義: auto, local, openai, google, anthropic, deepseek, その他
                const order = ['auto', 'local', 'openai', 'google', 'anthropic', 'deepseek'];
                const aIndex = order.indexOf(a);
                const bIndex = order.indexOf(b);
                
                if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
                if (aIndex !== -1) return -1;
                if (bIndex !== -1) return 1;
                return a.localeCompare(b);
              })
              .map(([provider, models]) => {
                const filteredModels = getFilteredProviderModels(provider);
                if (filteredModels.length === 0) return null;
                
                const isExpanded = expandedProviders.has(provider);
                
                return (
                  <View key={provider}>
                    {renderProviderHeader(provider, filteredModels)}
                    {isExpanded && (
                      <View style={styles.providerModels}>
                        {filteredModels.map(renderModelItem)}
                      </View>
                    )}
                  </View>
                );
              })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
