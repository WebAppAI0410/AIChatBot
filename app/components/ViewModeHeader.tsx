import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useColors } from '../constants/colors';

interface ViewModeHeaderProps {
  isListView: boolean;
  onToggleView: () => void;
  onToggleSelection: () => void;
  onCreateNote?: () => void;
  onCreateFolder?: () => void;
  showCreateButtons?: boolean;
}

export default function ViewModeHeader({
  isListView,
  onToggleView,
  onToggleSelection,
  onCreateNote,
  onCreateFolder,
  showCreateButtons = true
}: ViewModeHeaderProps) {
  const colors = useColors();

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    rightSection: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    button: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.background,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    createButton: {
      backgroundColor: colors.primary,
    },
    folderContainer: {
      position: 'relative',
    },
    folderPlusIcon: {
      position: 'absolute',
      right: -2,
      bottom: -2,
      backgroundColor: colors.background,
      borderRadius: 8,
      width: 14,
      height: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        <TouchableOpacity 
          style={[styles.button, isListView ? {} : { backgroundColor: colors.primary }]} 
          onPress={onToggleView}
        >
          <MaterialIcons 
            name="view-list" 
            size={20} 
            color={isListView ? colors.text : colors.textOnPrimary} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, !isListView ? {} : { backgroundColor: colors.primary }]} 
          onPress={onToggleView}
        >
          <MaterialIcons 
            name="grid-view" 
            size={20} 
            color={!isListView ? colors.text : colors.textOnPrimary} 
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.rightSection}>
        {showCreateButtons && onCreateNote && (
          <TouchableOpacity style={[styles.button, styles.createButton]} onPress={onCreateNote}>
            <Ionicons name="add" size={20} color={colors.textOnPrimary} />
          </TouchableOpacity>
        )}
        
        {showCreateButtons && onCreateFolder && (
          <TouchableOpacity style={[styles.button, styles.createButton]} onPress={onCreateFolder}>
            <View style={styles.folderContainer}>
              <MaterialIcons name="folder" size={18} color={colors.textOnPrimary} />
              <View style={styles.folderPlusIcon}>
                <Ionicons name="add" size={10} color={colors.primary} />
              </View>
            </View>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity style={styles.button} onPress={onToggleSelection}>
          <Ionicons name="checkmark-circle-outline" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}