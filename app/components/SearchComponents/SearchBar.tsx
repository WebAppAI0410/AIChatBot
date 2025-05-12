import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Text,
  ViewStyle
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../ui/theme';
import useColors from '../../constants/colors';
import SearchInput, { SearchInputRef } from './SearchInput';

export type SearchBarRef = {
  focus: () => void;
  blur: () => void;
  clear: () => void;
  getValue: () => string;
};

type SearchBarProps = {
  placeholder?: string;
  onSearch: (text: string) => void;
  onCancel?: () => void;
  initialValue?: string;
  showCancelButton?: boolean;
  containerStyle?: ViewStyle;
  delayMs?: number;
};

const SearchBar = forwardRef<SearchBarRef, SearchBarProps>(({
  placeholder = '検索...',
  onSearch,
  onCancel,
  initialValue = '',
  showCancelButton = true,
  containerStyle,
  delayMs = 300
}, ref) => {
  const colors = useColors();
  const searchInputRef = useRef<SearchInputRef>(null);
  
  // 外部からアクセスできるメソッドを定義
  useImperativeHandle(ref, () => ({
    focus: () => {
      searchInputRef.current?.focus();
    },
    blur: () => {
      searchInputRef.current?.blur();
    },
    clear: () => {
      searchInputRef.current?.clear();
    },
    getValue: () => {
      return searchInputRef.current?.getValue() || '';
    }
  }));
  
  // キャンセルボタン処理
  const handleCancel = () => {
    searchInputRef.current?.clear();
    searchInputRef.current?.blur();
    onCancel?.();
  };
  
  return (
    <View style={[styles.container, containerStyle]}>
      <View style={[
        styles.searchContainer,
        { backgroundColor: colors.background }
      ]}>
        <SearchInput
          ref={searchInputRef}
          placeholder={placeholder}
          onSearch={onSearch}
          initialValue={initialValue}
          delayMs={delayMs}
          containerStyle={{
            flex: 1,
            borderRadius: theme.radius.lg,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.card,
            elevation: 2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 1,
          }}
        />
      </View>
      
      {showCancelButton && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          activeOpacity={0.7}
        >
          <Text style={[styles.cancelText, {color: colors.primary}]}>
            キャンセル
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.lg,
  },
  searchContainer: {
    flex: 1,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
  },
  cancelButton: {
    paddingLeft: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    height: '100%',
    justifyContent: 'center',
  },
  cancelText: {
    fontSize: theme.fontSizes.md,
    fontWeight: '500',
  }
});

export default SearchBar; 