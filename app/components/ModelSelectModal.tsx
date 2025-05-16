import React, { useMemo } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList,
  Pressable
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
  
  const groupedModels = useMemo(() => {
    const groups: { [key: string]: ModelType[] } = {
      'auto': MODELS.filter(m => m.isAuto),
      'local': MODELS.filter(m => m.isLocal),
      'tier0': MODELS.filter(m => m.tier === 0 && !m.isAuto && !m.isLocal),
      'tier1': MODELS.filter(m => m.tier === 1),
      'tier2': MODELS.filter(m => m.tier === 2),
    };
    
    return groups;
  }, [MODELS]);
  
  const filteredModels = useMemo(() => {
    const autoModels = groupedModels.auto;
    
    const localModels = groupedModels.local;
    
    const freeModels = groupedModels.tier0;
    
    let availableModels: ModelType[] = [];
    
    const availableTiers = getAvailableTiers();
    
    if (availableTiers.includes(1)) {
      availableModels = [...availableModels, ...groupedModels.tier1];
    } else if (plan === 'free') {
      const tier1Models = groupedModels.tier1.filter(m => m.planTier === 'free' && m.dailyLimit);
      availableModels = [...availableModels, ...tier1Models];
    }
    
    if (availableTiers.includes(2)) {
      if (plan === 'premium') {
        availableModels = [...availableModels, ...groupedModels.tier2];
      } else {
        const tier2Models = groupedModels.tier2.filter(m => m.planTier === 'free' && m.dailyLimit);
        availableModels = [...availableModels, ...tier2Models];
      }
    }
    
    return [...autoModels, ...localModels, ...freeModels, ...availableModels];
  }, [groupedModels, plan]);
  
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
  });
  
  const renderModelItem = ({ item }: { item: ModelType }) => {
    const isSelected = item.id === currentModelId;
    const isDisabled = isModelDisabled(item);
    const hasReachedQuota = item.dailyLimit && (dailyModelQuotasCount[item.id] || 0) >= (item.dailyLimit || 0);
    
    return (
      <TouchableOpacity
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
          {item.provider && !item.isLocal && !item.isAuto && (
            <View style={styles.providerBadge}>
              <Text style={styles.providerText}>{item.provider}</Text>
            </View>
          )}
          
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
          
          <FlatList
            data={filteredModels}
            renderItem={renderModelItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.modelList}
          />
        </View>
      </View>
    </Modal>
  );
}
