import React from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Dimensions } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useColors } from '../constants/colors';
import { extractTitleFromContent, extractPreviewFromContent, getDetailedDateString, getRelativeTimeString } from '../utils/noteUtils';

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 16px margin + 16px gap

interface NoteCardProps {
  note: {
    id: string;
    title: string;
    content: string;
    updated_at: string;
  };
  isSelected?: boolean;
  isSelectionMode?: boolean;
  onPress: () => void;
  onSelect?: () => void;
}

export default function NoteCard({ 
  note, 
  isSelected = false, 
  isSelectionMode = false, 
  onPress, 
  onSelect 
}: NoteCardProps) {
  const colors = useColors();

  // タイトルとプレビューを抽出
  const title = extractTitleFromContent(note.content);
  const preview = extractPreviewFromContent(note.content);
  const relativeTime = getRelativeTimeString(note.updated_at);
  const detailedTime = getDetailedDateString(note.updated_at);

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
      borderWidth: isSelected ? 2 : 0,
      borderColor: isSelected ? colors.primary : 'transparent',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    iconContainer: {
      marginRight: 8,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      flex: 1,
      marginBottom: 8,
    },
    checkboxContainer: {
      marginLeft: 8,
    },
    content: {
      fontSize: 13,
      color: colors.secondaryText,
      lineHeight: 18,
      marginBottom: 12,
      minHeight: 36,
    },
    footer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
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
    selectedOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: `${colors.primary}10`,
      borderRadius: 12,
    },
  });

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={isSelectionMode ? onSelect : onPress}
      activeOpacity={0.7}
    >
      {isSelected && <View style={styles.selectedOverlay} />}
      
      <View style={styles.header}>
        <MaterialIcons name="description" size={20} color={colors.primary} style={styles.iconContainer} />
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {isSelectionMode && (
          <TouchableOpacity style={styles.checkboxContainer} onPress={onSelect}>
            <Ionicons 
              name={isSelected ? "checkmark-circle" : "radio-button-off"} 
              size={24} 
              color={isSelected ? colors.primary : colors.gray} 
            />
          </TouchableOpacity>
        )}
      </View>
      
      <Text style={styles.content} numberOfLines={2}>
        {preview}
      </Text>
      
      <View style={styles.footer}>
        <View style={styles.timeContainer}>
          <Text style={styles.relativeTime}>{relativeTime}</Text>
          <Text style={styles.detailedTime}>{detailedTime}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}