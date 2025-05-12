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
  onCustomFocus?: () => void;
  onCustomBlur?: () => void;
  containerStyle?: ViewStyle;
  delayMs?: number;
  showSearchIcon?: boolean;
  isFocused?: boolean;
};

const SearchInputBase = forwardRef<SearchInputRef, SearchInputProps>(({
  initialValue = '',
  onSearch,
  onClear,
  onCustomFocus,
  onCustomBlur,
  containerStyle,
  delayMs = 300,
  showSearchIcon = true,
  isFocused: externalFocused,
  ...textInputProps
}, ref) => {
  const colors = useColors();
  const [internalFocused, setInternalFocused] = useState(false);
  // 外部から制御される場合はそちらを優先
  const isFocused = externalFocused !== undefined ? externalFocused : internalFocused;
  
  const [localValue, setLocalValue] = useState(initialValue);
  const inputRef = useRef<TextInput>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pendingSearchRef = useRef<string | null>(null);
  const lastTextRef = useRef<string>(initialValue);
  const keyboardDidHideListener = useRef<any>(null);
  const isComposingRef = useRef<boolean>(false); // IME入力状態を追跡
  
  // キーボードイベントのリスナー設定
  useEffect(() => {
    if (Platform.OS !== 'web') {
      // キーボードが閉じた時に保留中の検索を実行する
      keyboardDidHideListener.current = Keyboard.addListener('keyboardDidHide', () => {
        if (pendingSearchRef.current) {
          onSearch(pendingSearchRef.current);
          pendingSearchRef.current = null;
        }
        isComposingRef.current = false; // キーボードが閉じたらIME入力状態をリセット
      });
      
      return () => {
        keyboardDidHideListener.current?.remove();
      };
    }
  }, [onSearch]);
  
  // テキスト変更時の処理
  const handleChangeText = (text: string) => {
    setLocalValue(text);
    lastTextRef.current = text;

    // IME入力中は必ずフラグを立てる（日本語入力検出用）
    if (text && Platform.OS !== 'web' && !isComposingRef.current) {
      const containsJapanese = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(text);
      if (containsJapanese) {
        isComposingRef.current = true;
        return; // 日本語入力検出時は検索を実行しない
      }
    }

    debouncedSearch(text);
  };

  // 検索ロジックをdebounce処理
  const debouncedSearch = useCallback((text: string) => {
    // IMEモードが中断しないよう、検索は特定のタイミングでのみ実行
    pendingSearchRef.current = text;
    
    // IME入力中は検索を実行しない（厳格なチェック）
    if (isComposingRef.current && Platform.OS !== 'web') {
      console.log('IME入力中のため検索を延期:', text);
      return;
    }
    
    // 既存のタイマーをクリア
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // デバウンス検索を設定
    searchTimeoutRef.current = setTimeout(() => {
      // IME入力中でなければ検索を実行
      if (!isComposingRef.current || Platform.OS === 'web') {
        console.log('検索実行:', text);
        onSearch(text);
        pendingSearchRef.current = null;
      } else {
        console.log('IME入力中のため検索をスキップ');
      }
      searchTimeoutRef.current = null;
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
      pendingSearchRef.current = null;
      lastTextRef.current = '';
      isComposingRef.current = false;
    },
    getValue: () => localValue
  }));

  // IME入力開始時のイベント処理
  const handleCompositionStart = () => {
    console.log('IME composition started');
    isComposingRef.current = true;
  };
  
  // IME入力終了時のイベント処理
  const handleCompositionEnd = () => {
    console.log('IME composition ended');
    const currentText = localValue; // 現在の入力値を保存
    
    // IMEモードをリセット
    isComposingRef.current = false;
    
    // IME入力確定時に保留中の検索を実行
    if (currentText) {
      // 即時検索を実行（遅延なし）
      console.log('IME確定後に検索実行:', currentText);
      onSearch(currentText);
      pendingSearchRef.current = null;
    }
  };

  // 入力確定時の処理（Enterキー押下時など）
  const handleSubmitEditing = (e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => {
    // 入力確定時のみ確実に検索を実行
    const text = e.nativeEvent.text;
    setLocalValue(text);
    lastTextRef.current = text;
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    
    // IME入力状態にかかわらず、確定時は必ず検索を実行
    onSearch(text);
    pendingSearchRef.current = null;
    isComposingRef.current = false;
    
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
    
    // 入力終了時に検索を確実に実行
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }
    
    // IME入力状態をリセットして検索実行
    isComposingRef.current = false;
    
    // 確実に検索を実行（テキストがある場合のみ）
    if (pendingSearchRef.current) {
      onSearch(pendingSearchRef.current);
      pendingSearchRef.current = null;
    } else if (text) {
      onSearch(text);
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
    isComposingRef.current = false;
    
    // クリア後にフォーカスを維持
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };
  
  // フォーカス状態管理
  const handleFocus = (e: any) => {
    setInternalFocused(true);
    if (onCustomFocus) {
      onCustomFocus();
    }
    if (textInputProps.onFocus) {
      textInputProps.onFocus(e);
    }
  };
  
  const handleBlur = (e: any) => {
    // モバイルではブラーイベントを特別に処理
    if (Platform.OS !== 'web') {
      // フォーカスが失われても即座に状態を変更しない
      setTimeout(() => {
        setInternalFocused(false);
        if (onCustomBlur) {
          onCustomBlur();
        }
      }, 150);
    } else {
      setInternalFocused(false);
      if (onCustomBlur) {
        onCustomBlur();
      }
    }
    
    if (textInputProps.onBlur) {
      textInputProps.onBlur(e);
    }
  };
  
  return (
    <View style={[
      styles.container,
      containerStyle,
      { backgroundColor: colors.card }
    ]}>
      {showSearchIcon && (
        <View style={styles.searchIconContainer}>
          <Ionicons
            name="search"
            size={18}
            color={colors.gray}
            style={{ opacity: 0.8 }}
          />
        </View>
      )}
      
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
        autoCapitalize="none"
        autoCorrect={false}
        blurOnSubmit={false}
        // IMEイベントリスナーを追加
        onStartShouldSetResponder={() => true}
        onResponderGrant={() => {}}
        {...Platform.OS === 'ios' || Platform.OS === 'android' ? {
          onKeyPress: (e: any) => {
            // Android/iOSでIMEの状態を検知
            if (e.nativeEvent.key === 'Process') {
              isComposingRef.current = true;
            }
          }
        } : {}}
        {...Platform.OS === 'web' ? {
          // WebではonCompositionStartとonCompositionEndを使用
          onCompositionStart: handleCompositionStart,
          onCompositionEnd: handleCompositionEnd,
        } : {}}
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
            size={18}
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
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 44,
  },
  searchIconContainer: {
    paddingRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 36,
    paddingVertical: 0,
    fontSize: theme.fontSizes.md,
    fontWeight: '400',
  },
  clearButton: {
    paddingLeft: 8,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SearchInput; 