import React, { useState, useRef, useImperativeHandle, forwardRef, useCallback, memo, useEffect } from 'react';
import { 
  TextInput, 
  View, 
  StyleSheet, 
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
  Platform,
  NativeSyntheticEvent,
  TextInputEndEditingEventData,
  TextInputSubmitEditingEventData,
  Keyboard
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
  const pendingSearchRef = useRef<string | null>(null);
  const lastTextRef = useRef<string>(initialValue);
  const keyboardDidHideListener = useRef<any>(null);
  
  // キーボードイベントのリスナー設定
  useEffect(() => {
    if (Platform.OS !== 'web') {
      // キーボードが閉じた時に保留中の検索を実行する
      keyboardDidHideListener.current = Keyboard.addListener('keyboardDidHide', () => {
        if (pendingSearchRef.current) {
          onSearch(pendingSearchRef.current);
          pendingSearchRef.current = null;
        }
      });
      
      return () => {
        keyboardDidHideListener.current?.remove();
      };
    }
  }, [onSearch]);
  
  // 検索ロジックをdebounce処理
  const debouncedSearch = useCallback((text: string) => {
    // IMEモードが中断しないよう、検索は特定のタイミングでのみ実行
    // テキスト変更のみでは実行せず、pendingSearchRefに保存するだけ
    pendingSearchRef.current = text;
    
    // 既存のタイマーをクリア
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Android/iOSでは検索実行を遅らせる（IME入力完了の余裕を持たせる）
    // Webでは通常通り実行
    if (Platform.OS === 'web') {
      searchTimeoutRef.current = setTimeout(() => {
        onSearch(text);
        searchTimeoutRef.current = null;
      }, delayMs);
    }
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
      pendingSearchRef.current = null;
      lastTextRef.current = '';
    },
    getValue: () => localValue
  }));

  // テキスト変更時の処理
  const handleChangeText = (text: string) => {
    setLocalValue(text);
    lastTextRef.current = text;
    
    // テキスト変更時は保留状態にするだけで検索は実行しない
    debouncedSearch(text);
  };

  // 入力確定時の処理（Enterキー押下時など）
  const handleSubmitEditing = (e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
    // 入力確定時のみ確実に検索を実行
    const text = e.nativeEvent.text;
    setLocalValue(text);
    lastTextRef.current = text;
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // 確定時は即時検索
    onSearch(text);
    pendingSearchRef.current = null;
    
    if (textInputProps.onSubmitEditing) {
      textInputProps.onSubmitEditing(e);
    }
  };

  // 入力終了時の処理
  const handleEndEditing = (e: NativeSyntheticEvent<TextInputEndEditingEventData>) => {
    const text = e.nativeEvent.text;
    
    // 値の更新
    if (text !== localValue) {
      setLocalValue(text);
      lastTextRef.current = text;
    }
    
    // IME確定時のみ検索を実行（Android/iOSのみ）
    if (Platform.OS !== 'web') {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
      
      // すぐに検索を実行せず、少し遅延させる
      // (IME確定処理が完了する時間を確保)
      setTimeout(() => {
        if (pendingSearchRef.current) {
          onSearch(pendingSearchRef.current);
          pendingSearchRef.current = null;
        }
      }, 100);
    }
    
    if (textInputProps.onEndEditing) {
      textInputProps.onEndEditing(e);
    }
  };

  // テキストクリア処理
  const handleClear = () => {
    setLocalValue('');
    lastTextRef.current = '';
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    onSearch('');
    onClear?.();
    pendingSearchRef.current = null;
    
    // クリア後にフォーカスを維持
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };
  
  // フォーカス状態管理
  const handleFocus = (e: any) => {
    setIsFocused(true);
    if (textInputProps.onFocus) {
      textInputProps.onFocus(e);
    }
  };
  
  const handleBlur = (e: any) => {
    // モバイルではブラーイベントを特別に処理
    if (Platform.OS !== 'web') {
      // フォーカスが失われても即座に状態を変更しない
      // (モバイルではIME操作中にもブラーイベントが発生することがあるため)
      setTimeout(() => {
        setIsFocused(false);
      }, 150);
    } else {
      setIsFocused(false);
    }
    
    if (textInputProps.onBlur) {
      textInputProps.onBlur(e);
    }
  };
  
  return (
    <View style={[
      styles.container,
      containerStyle,
      { 
        borderColor: isFocused ? colors.primary : 'transparent',
        backgroundColor: colors.card
      }
    ]}>
      <Ionicons
        name="search"
        size={24}
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
        onSubmitEditing={handleSubmitEditing}
        onEndEditing={handleEndEditing}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholderTextColor={colors.gray}
        returnKeyType="search"
        clearButtonMode="never" // iOSのネイティブクリアボタンを無効化
        // IME関連のプロパティ
        autoCapitalize="none"
        autoCorrect={false}
        // 検索機能に関連するプロパティ
        blurOnSubmit={false}
        {...textInputProps}
      />
      
      {localValue.length > 0 && (
        <TouchableOpacity
          onPress={handleClear}
          style={styles.clearButton}
          activeOpacity={0.7}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <Ionicons
            name="close-circle"
            size={24}
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
    paddingVertical: Platform.OS === 'ios' ? theme.spacing.md : theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  input: {
    flex: 1,
    height: 44,  // テキスト入力の高さを増やす
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    fontSize: theme.fontSizes.md * 1.1,  // フォントサイズも少し大きく
    fontWeight: '400',
  },
  searchIcon: {
    marginRight: theme.spacing.md,
    opacity: 0.8,
  },
  clearButton: {
    paddingHorizontal: theme.spacing.sm,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SearchInput; 