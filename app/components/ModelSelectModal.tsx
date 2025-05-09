import React from 'react';
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
import { colors } from '../constants/colors';
import { MODELS, ModelType } from '../constants/models';

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
  
  const handleModelSelect = (model: ModelType) => {
    if (model.isLocal && localModelStatus !== 'ready') {
      onSelectModel(model.id);
    } else if (model.isPremium && plan === 'free') {
      onSelectModel(model.id);
    } else {
      onSelectModel(model.id);
    }
    
    onClose();
  };
  
  const getModelStatusBadge = (model: ModelType) => {
    if (!model.isLocal) return null;
    
    switch (localModelStatus) {
      case 'not_installed':
        return (
          <View style={[styles.badge, styles.notInstalledBadge]}>
            <Text style={styles.badgeText}>未DL</Text>
          </View>
        );
      case 'downloading':
        return (
          <View style={[styles.badge, styles.downloadingBadge]}>
            <Text style={styles.badgeText}>DL中</Text>
          </View>
        );
      case 'ready':
        return (
          <View style={[styles.badge, styles.readyBadge]}>
            <Text style={styles.badgeText}>使用可</Text>
          </View>
        );
      default:
        return null;
    }
  };
  
  const renderModelItem = ({ item }: { item: ModelType }) => {
    const isSelected = item.id === currentModelId;
    const isDisabled = item.isPremium && plan === 'free';
    
    return (
      <TouchableOpacity
        style={[
          styles.modelItem,
          isSelected && styles.selectedModelItem,
          isDisabled && styles.disabledModelItem
        ]}
        onPress={() => handleModelSelect(item)}
        disabled={false} // We handle restrictions in handleModelSelect
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
          {getModelStatusBadge(item)}
          
          {isSelected ? (
            <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
          ) : (
            <View style={styles.radioOuter}>
              {isSelected && <View style={styles.radioInner} />}
            </View>
          )}
          
          {item.isPremium && plan === 'free' && (
            <View style={styles.premiumBadge}>
              <Text style={styles.premiumBadgeText}>
                {item.tier === 'lite' ? 'Lite' : 'Heavy'}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };
  
  const filteredModels = MODELS.filter(model => {
    if (plan !== 'free') return true;
    
    return !model.isPremium || 
      (model.tier === 'lite' && MODELS.filter(m => m.tier === 'lite').indexOf(model) === 0) ||
      (model.tier === 'heavy' && MODELS.filter(m => m.tier === 'heavy').indexOf(model) === 0);
  });
  
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

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 4,
  },
  modelList: {
    padding: 16,
  },
  modelItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: colors.lightGray,
  },
  selectedModelItem: {
    backgroundColor: `${colors.primary}20`,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  disabledModelItem: {
    opacity: 0.7,
  },
  modelInfo: {
    flex: 1,
    marginRight: 12,
  },
  modelName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  selectedModelName: {
    color: colors.primary,
  },
  disabledModelName: {
    color: colors.gray,
  },
  modelDescription: {
    fontSize: 14,
    color: colors.darkGray,
  },
  selectedModelDescription: {
    color: colors.darkGray,
  },
  disabledModelDescription: {
    color: colors.gray,
  },
  modelRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  notInstalledBadge: {
    backgroundColor: colors.gray,
  },
  downloadingBadge: {
    backgroundColor: colors.warning,
  },
  readyBadge: {
    backgroundColor: colors.success,
  },
  badgeText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
  premiumBadge: {
    backgroundColor: colors.accentBlue,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  premiumBadgeText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
});
