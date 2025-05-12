import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Platform, 
  ViewStyle 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import theme from '../../ui/theme';
import useColors from '../../constants/colors';
import SearchBar, { SearchBarRef } from './SearchBar';

export type SearchHeaderRef = {
  focus: () => void;
  blur: () => void;
  clear: () => void;
  getValue: () => string;
};

type SearchHeaderProps = {
  onSearch: (text: string) => void;
  onCancel?: () => void;
  placeholder?: string;
  initialValue?: string;
  containerStyle?: ViewStyle;
  showBackButton?: boolean;
  customBackRoute?: string;
  onBackPress?: () => void;
  delayMs?: number;
};

const SearchHeader = forwardRef<SearchHeaderRef, SearchHeaderProps>(({
  onSearch,
  onCancel,
  placeholder = '検索...',
  initialValue = '',
  containerStyle,
  showBackButton = true,
  customBackRoute,
  onBackPress,
  delayMs = 300
}, ref) => {
  const colors = useColors();
  const router = useRouter();
  const searchBarRef = useRef<SearchBarRef>(null);
  
  // 外部からアクセスできるメソッドを定義
  useImperativeHandle(ref, () => ({
    focus: () => {
      searchBarRef.current?.focus();
    },
    blur: () => {
      searchBarRef.current?.blur();
    },
    clear: () => {
      searchBarRef.current?.clear();
    },
    getValue: () => {
      return searchBarRef.current?.getValue() || '';
    }
  }));
  
  // 戻るボタン処理
  const handleBackPress = () => {
    if (onBackPress) {
      onBackPress();
    } else if (customBackRoute) {
      router.push(customBackRoute);
    } else {
      router.back();
    }
  };
  
  return (
    <View style={[
      styles.container,
      { backgroundColor: colors.primary },
      containerStyle
    ]}>
      {showBackButton && (
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textOnPrimary} />
        </TouchableOpacity>
      )}
      
      <View style={styles.searchBarContainer}>
        <SearchBar
          ref={searchBarRef}
          placeholder={placeholder}
          onSearch={onSearch}
          onCancel={onCancel}
          initialValue={initialValue}
          delayMs={delayMs}
          containerStyle={styles.searchBar}
        />
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: theme.safeArea.top,
    paddingBottom: 0,
    paddingHorizontal: theme.spacing.sm,
    height: 44 + theme.safeArea.top,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.round,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.spacing.sm,
  },
  searchBarContainer: {
    flex: 1,
  },
  searchBar: {
    paddingHorizontal: 0,
  },
});

export default SearchHeader; 