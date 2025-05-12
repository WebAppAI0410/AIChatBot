import React, { useState, useRef, useImperativeHandle, forwardRef, useCallback, memo } from 'react';
import { 
  TextInput, 
  View, 
  StyleSheet, 
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
  Platform,
  NativeSyntheticEvent,
  TextInputEndEditingEventData
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../ui/theme';
import useColors from '../../constants/colors';

export type SearchInputRef = {
  focus: () => void;
  blur: () => void;
  clear: () => void;
  getValue: () => string;
};

type SearchInputProps = Omit<TextInputProps, 'value' | 'onChangeText'> & {
  initialValue?: string;
  onSearch: (text: string) => void;
  onClear?: () => void;
  containerStyle?: ViewStyle;
  delayMs?: number;
};

const SearchInputBase = forwardRef<SearchInputRef, SearchInputProps>(({
  initialValue = '',
  onSearch,
  onClear,
  containerStyle,
  delayMs = 300,
  ...textInputProps
}, ref) => {
  const colors = useColors();
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState(initialValue);
  const inputRef = useRef<TextInput>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // 検索ロジックをdebounce処理
  const debouncedSearch = useCallback((text: string) => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      onSearch(text);
    }, delayMs);
  }, [onSearch, delayMs]);

  // 外部からアクセスできるメソッドを定義
  useImperativeHandle(ref, () => ({
    focus: () => {
      inputRef.current?.focus();
    },
    blur: () => {
      inputRef.current?.blur();
    },
    clear: () => {
      setLocalValue('');
      onClear?.();
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      onSearch('');
    },
    getValue: () => localValue
  }));

  // テキスト変更時の処理（未確定文字含む）
  const handleChangeText = (text: string) => {
    setLocalValue(text);
    debouncedSearch(text);
  };

  // 入力終了時の処理（確定時にもonSearchを呼ぶ）
  const handleEndEditing = (e: NativeSyntheticEvent<TextInputEndEditingEventData>) => {
    onSearch(e.nativeEvent.text);
    if (textInputProps.onEndEditing) {
      textInputProps.onEndEditing(e);
    }
  };

  // テキストクリア処理
  const handleClear = () => {
    setLocalValue('');
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    onSearch('');
    onClear?.();
    inputRef.current?.focus();
  };
  
  // フォーカス状態管理
  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (textInputProps.onFocus) {
      textInputProps.onFocus(e);
    }
  };
  
  const handleBlur = (e: any) => {
    setIsFocused(false);
    if (textInputProps.onBlur) {
      textInputProps.onBlur(e);
    }
  };
  
  return (
    <View style={[
      styles.container,
      containerStyle,
      { borderColor: isFocused ? colors.primary : colors.border }
    ]}>
      <Ionicons
        name="search"
        size={20}
        color={colors.gray}
        style={styles.searchIcon}
      />
      
      <TextInput
        ref={inputRef}
        style={[
          styles.input,
          { color: colors.text }
        ]}
        value={localValue}
        onChangeText={handleChangeText}
        onEndEditing={handleEndEditing}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholderTextColor={colors.gray}
        returnKeyType="search"
        clearButtonMode="never" // iOSのネイティブクリアボタンを無効化
        {...textInputProps}
      />
      
      {localValue.length > 0 && (
        <TouchableOpacity
          onPress={handleClear}
          style={styles.clearButton}
          activeOpacity={0.7}
        >
          <Ionicons
            name="close-circle"
            size={20}
            color={colors.gray}
          />
        </TouchableOpacity>
      )}
    </View>
  );
});

SearchInputBase.displayName = 'SearchInputBase';
const SearchInput = memo(SearchInputBase);
SearchInput.displayName = 'SearchInput';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: theme.borderWidth.thin,
    borderRadius: theme.radius.md,
    backgroundColor: 'transparent',
    paddingVertical: Platform.OS === 'ios' ? 0 : theme.spacing.xs,
  },
  input: {
    flex: 1,
    height: 40,
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: 0,
    fontSize: theme.fontSizes.md,
  },
  searchIcon: {
    marginHorizontal: theme.spacing.md,
  },
  clearButton: {
    paddingHorizontal: theme.spacing.sm,
    height: '100%',
    justifyContent: 'center',
  },
});

export default SearchInput; 