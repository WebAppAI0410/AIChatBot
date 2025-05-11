import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, FlatList, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import useColors from '../constants/colors';

const DEFAULT_ICON_NAMES = [
  'chatbubble', 'person', 'bulb', 'book', 'rocket',
  'flame', 'star', 'heart', 'leaf', 'cloud',
  'planet', 'paw', 'cafe', 'musical-notes', 'camera',
  'game-controller', 'medal', 'umbrella', 'gift', 'bicycle',
];

export type IconSelectModalProps = {
  visible: boolean;
  onClose: () => void;
  onSelectIcon: (icon: { iconType: 'default' | 'custom'; iconId?: string; iconUri?: string }) => void;
  currentIconType: 'default' | 'custom';
  currentIconId?: string;
  currentIconUri?: string;
};

export default function IconSelectModal({
  visible,
  onClose,
  onSelectIcon,
  currentIconType,
  currentIconId,
  currentIconUri,
}: IconSelectModalProps) {
  const colors = useColors();
  
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
      maxHeight: '60%',
      paddingBottom: 24,
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
      color: colors.text,
    },
    closeButton: {
      padding: 4,
    },
    iconList: {
      padding: 16,
      alignItems: 'center',
    },
    iconItem: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
      margin: 6,
      backgroundColor: colors.card,
    },
    selectedIconItem: {
      borderWidth: 2,
      borderColor: colors.primary,
      backgroundColor: `${colors.primary}20`,
    },
    checkIcon: {
      position: 'absolute',
      bottom: 2,
      right: 2,
    },
    imageButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
      padding: 12,
      borderRadius: 12,
      backgroundColor: colors.card,
      marginHorizontal: 16,
    },
    imageButtonText: {
      marginLeft: 8,
      color: colors.primary,
      fontWeight: 'bold',
      fontSize: 16,
    },
  });
  
  // 画像選択
  const handlePickImage = async () => {
    // パーミッション確認
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('画像ライブラリへのアクセス許可が必要です');
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      onSelectIcon({ iconType: 'custom', iconUri: result.assets[0].uri });
      onClose();
    }
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
            <Text style={styles.title}>アイコンを選択</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={DEFAULT_ICON_NAMES}
            numColumns={5}
            keyExtractor={(name) => name}
            renderItem={({ item }) => {
              const isSelected = currentIconType === 'default' && currentIconId === item;
              return (
                <TouchableOpacity
                  style={[styles.iconItem, isSelected && styles.selectedIconItem]}
                  onPress={() => {
                    onSelectIcon({ iconType: 'default', iconId: item });
                    onClose();
                  }}
                >
                  <Ionicons name={item as any} size={32} color={isSelected ? colors.primary : colors.gray} />
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={18} color={colors.primary} style={styles.checkIcon} />
                  )}
                </TouchableOpacity>
              );
            }}
            contentContainerStyle={styles.iconList}
          />
          <TouchableOpacity style={styles.imageButton} onPress={handlePickImage}>
            <Ionicons name="image-outline" size={24} color={colors.primary} />
            <Text style={styles.imageButtonText}>画像を選択</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
} 