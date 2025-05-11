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
import { MODELS, ModelType, MODEL_TIERS } from '../constants/models';
import { PLANS } from '../constants/plans';
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
  const colors = useColors();
  const { theme } = useTheme();
  
  const handleModelSelect = (model: ModelType) => {
    if (model.isLocal && localModelStatus !== 'ready') {
      onSelectModel(model.id);
    } else {
      onSelectModel(model.id);
    }
    
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
      return (
        <Badge
          label={`${model.dailyLimit}/日`}
          variant="warning"
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
      const tier1Models = groupedModels.tier1.filter(m => m.dailyLimit);
      if (tier1Models.length > 0) {
        availableModels = [...availableModels, tier1Models[0]];
      }
    }
    
    if (availableTiers.includes(2)) {
      if (plan === 'premium') {
        availableModels = [...availableModels, ...groupedModels.tier2];
      } else {
        const tier2Models = groupedModels.tier2.filter(m => m.dailyLimit);
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
  });
  
  const renderModelItem = ({ item }: { item: ModelType }) => {
    const isSelected = item.id === currentModelId;
    const isDisabled = !isModelAvailableForPlan(item) && !item.dailyLimit;
    
    return (
      <TouchableOpacity
        style={[
          styles.modelItem,
          isSelected && styles.selectedModelItem,
          isDisabled && styles.disabledModelItem
        ]}
        onPress={() => handleModelSelect(item)}
        disabled={false} // 制限はhandleModelSelectで処理
      >
        <View style={styles.modelInfo}>
          <Text style={[
            styles.modelName,
            isSelected && styles.selectedModelName,
            isDisabled && styles.disabledModelName
          ]}>
            {item.name}
          </Text>
          <Text style={[
            styles.modelDescription,
            isSelected && styles.selectedModelDescription,
            isDisabled && styles.disabledModelDescription
          ]}>
            {item.description}
          </Text>
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
              {isSelected && <View style={styles.radioInner} />}
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };
  
  return (
    <Modal
      visible={visible}
      transparent
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
