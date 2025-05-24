import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '../constants/colors';

interface SelectionHeaderProps {
  selectedCount: number;
  totalCount: number;
  onCancel: () => void;
  onSelectAll: () => void;
  onDelete: () => void;
  onAction?: () => void;
  actionIcon?: keyof typeof Ionicons.glyphMap;
  actionLabel?: string;
  itemType?: 'チャット' | 'ノート';
}

export default function SelectionHeader({
  selectedCount,
  totalCount,
  onCancel,
  onSelectAll,
  onDelete,
  onAction,
  actionIcon,
  actionLabel,
  itemType = 'アイテム'
}: SelectionHeaderProps) {
  const colors = useColors();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 50,
      paddingBottom: 12,
      paddingHorizontal: 16,
      height: 96,
      backgroundColor: colors.primary,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 3,
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.textOnPrimary,
    },
    rightSection: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    actionButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      marginLeft: 12,
    },
    actionText: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.textOnPrimary,
    },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 12,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <TouchableOpacity style={styles.backButton} onPress={onCancel}>
          <Ionicons name="arrow-back" size={24} color={colors.textOnPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {selectedCount} 件選択中
        </Text>
      </View>
      
      <View style={styles.rightSection}>
        <TouchableOpacity style={styles.actionButton} onPress={onSelectAll}>
          <Text style={styles.actionText}>
            {selectedCount === totalCount ? '全解除' : '全選択'}
          </Text>
        </TouchableOpacity>
        
        {onAction && actionIcon && (
          <TouchableOpacity style={styles.iconButton} onPress={onAction}>
            <Ionicons name={actionIcon} size={20} color={colors.textOnPrimary} />
          </TouchableOpacity>
        )}
        
        {selectedCount > 0 && (
          <TouchableOpacity style={styles.iconButton} onPress={onDelete}>
            <Ionicons name="trash" size={20} color={colors.textOnPrimary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}