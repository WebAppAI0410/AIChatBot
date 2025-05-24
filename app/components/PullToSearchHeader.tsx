import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Animated,
  TextInput,
  TouchableOpacity,
  Keyboard,
  Text
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useColors from '../constants/colors';

interface PullToSearchHeaderProps {
  onSearch: (query: string) => void;
  onCancel: () => void;
  placeholder?: string;
  isVisible: boolean;
  searchValue: string;
  onChangeText: (text: string) => void;
}

export default function PullToSearchHeader({
  onSearch,
  onCancel,
  placeholder = '検索...',
  isVisible,
  searchValue,
  onChangeText
}: PullToSearchHeaderProps) {
  const colors = useColors();
  const searchInputRef = useRef<TextInput>(null);
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const animatedOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isVisible) {
      Animated.parallel([
        Animated.timing(animatedHeight, {
          toValue: 60,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(animatedOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: false,
        })
      ]).start(() => {
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 100);
      });
    } else {
      Animated.parallel([
        Animated.timing(animatedHeight, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(animatedOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        })
      ]).start();
    }
  }, [isVisible]);

  const handleCancel = () => {
    Keyboard.dismiss();
    onCancel();
  };

  const handleSubmit = () => {
    onSearch(searchValue);
    Keyboard.dismiss();
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      overflow: 'hidden',
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    searchInput: {
      flex: 1,
      height: 40,
      backgroundColor: colors.background,
      borderRadius: 20,
      paddingHorizontal: 16,
      fontSize: 16,
      color: colors.text,
      marginRight: 12,
    },
    cancelButton: {
      paddingVertical: 8,
    },
    cancelText: {
      color: colors.primary,
      fontSize: 16,
      fontWeight: '500',
    },
  });

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          height: animatedHeight,
          opacity: animatedOpacity 
        }
      ]}
    >
      <View style={styles.searchContainer}>
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          placeholder={placeholder}
          placeholderTextColor={colors.gray}
          value={searchValue}
          onChangeText={onChangeText}
          onSubmitEditing={handleSubmit}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <Text style={styles.cancelText}>キャンセル</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
}