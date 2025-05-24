import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, TextInput, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useColors } from '../constants/colors';
import { getFolderLevel, getDetailedDateString, getRelativeTimeString } from '../utils/noteUtils';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2;

interface FolderCardProps {
  folder: {
    id: string;
    name: string;
    updated_at: string;
    parent_id?: string | null;
  };
  isEditing?: boolean;
  editingName?: string;
  onPress: () => void;
  onEdit?: (name: string) => void;
  onSubmitEdit?: () => void;
  onBlurEdit?: () => void;
  noteCount?: number;
  folderPath?: string[];
}

export default function FolderCard({ 
  folder, 
  isEditing = false,
  editingName = '',
  onPress, 
  onEdit, 
  onSubmitEdit,
  onBlurEdit,
  noteCount = 0,
  folderPath = []
}: FolderCardProps) {
  const colors = useColors();
  
  const level = folder.parent_id ? 1 : 0; // Simple level calculation for now
  const relativeTime = getRelativeTimeString(folder.updated_at);
  const detailedTime = getDetailedDateString(folder.updated_at);

  const styles = StyleSheet.create({
    container: {
      width: cardWidth,
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 12,
    },
    iconContainer: {
      marginRight: 12,
    },
    nameContainer: {
      flex: 1,
    },
    name: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    editInput: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      padding: 0,
      borderBottomWidth: 1,
      borderBottomColor: colors.primary,
    },
    content: {
      marginBottom: 12,
    },
    noteCount: {
      fontSize: 14,
      color: colors.secondaryText,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    hierarchyContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    levelIndicator: {
      width: 3,
      height: 20,
      backgroundColor: colors.primary,
      borderRadius: 1.5,
      marginRight: 8,
      opacity: 0.6,
    },
    breadcrumb: {
      fontSize: 11,
      color: colors.secondaryText,
      opacity: 0.8,
    },
    timeContainer: {
      flex: 1,
    },
    relativeTime: {
      fontSize: 12,
      color: colors.gray,
      fontWeight: '500',
    },
    detailedTime: {
      fontSize: 10,
      color: colors.gray,
      marginTop: 2,
      opacity: 0.8,
    },
  });

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      {level > 0 && (
        <View style={styles.hierarchyContainer}>
          <View style={[styles.levelIndicator, { marginLeft: level * 12 }]} />
          {folderPath.length > 0 && (
            <Text style={styles.breadcrumb} numberOfLines={1}>
              {folderPath.join(' / ')}
            </Text>
          )}
        </View>
      )}
      
      <View style={styles.header}>
        <MaterialIcons name="folder" size={24} color={colors.primary} style={styles.iconContainer} />
        <View style={styles.nameContainer}>
          {isEditing ? (
            <TextInput
              style={styles.editInput}
              value={editingName}
              onChangeText={onEdit}
              onSubmitEditing={onSubmitEdit}
              onBlur={onBlurEdit}
              autoFocus
              selectTextOnFocus
            />
          ) : (
            <Text style={styles.name} numberOfLines={2}>
              {folder.name}
            </Text>
          )}
        </View>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.noteCount}>
          {noteCount} 個のアイテム
        </Text>
      </View>
      
      <View style={styles.footer}>
        <View style={styles.timeContainer}>
          <Text style={styles.relativeTime}>{relativeTime}</Text>
          <Text style={styles.detailedTime}>{detailedTime}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}