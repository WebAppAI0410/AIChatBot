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
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSearchRef = useRef<string | null>(null);
  const lastTextRef = useRef<string>(initialValue);
  const keyboardDidHideListener = useRef<any>(null);
  const isComposingRef = useRef<boolean>(false); // IME入力状態を追跡
  const lastTypedTimeRef = useRef<number>(0); // 前回の入力時間を追跡
  
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
        // アンマウント時にタイマーをクリア
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
          searchTimeoutRef.current = null;
        }
      };
    }
    
    // web環境でのクリーンアップ
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = null;
      }
    };
  }, [onSearch]);
  
  // テキスト変更時の処理
  const handleChangeText = (text: string) => {
    setLocalValue(text);
    lastTextRef.current = text;

    // モバイル環境でのIME入力検出 - 様々な言語に対応
    if (text && Platform.OS !== 'web' && !isComposingRef.current) {
      // CJK (中国語、日本語、韓国語) および他のIME言語の文字範囲を含む拡張検出
      // より包括的なアプローチ
      const containsIMELanguage = 
        // 中国語 (簡体字・繁体字)、日本語漢字
        /[\u4E00-\u9FFF\u3400-\u4DBF]/.test(text) || 
        // 日本語ひらがな・カタカナ
        /[\u3040-\u309F\u30A0-\u30FF]/.test(text) || 
        // 韓国語ハングル
        /[\uAC00-\uD7AF\u1100-\u11FF]/.test(text) || 
        // その他のアジア文字（タイ語、ベトナム語など）
        /[\u0E00-\u0E7F\u1780-\u17FF\u1000-\u109F]/.test(text);
      
      if (containsIMELanguage) {
        if (__DEV__) console.log('IME言語検出');
        isComposingRef.current = true;
        return; // IME入力検出時は検索を実行しない
      }
      
      // より確実なIME検出のために、テキスト変化の早さも考慮
      // テキストが急速に変化する場合（IME候補選択中など）は検索を控える
      const now = Date.now();
      if (now - lastTypedTimeRef.current < 100) { // 100ms以内に変更が続く場合
        isComposingRef.current = true;
        if (__DEV__) console.log('急速なテキスト変化を検出、IMEの可能性あり');
        return;
      }
      lastTypedTimeRef.current = now;
    }

    debouncedSearch(text);
  };

  // 検索ロジックをdebounce処理
  const debouncedSearch = useCallback((text: string) => {
    // IMEモードが中断しないよう、検索は特定のタイミングでのみ実行
    pendingSearchRef.current = text;
    
    // IME入力中は検索を実行しない（厳格なチェック）
    if (isComposingRef.current && Platform.OS !== 'web') {
      if (__DEV__) console.log('IME入力中のため検索を延期:', text);
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
        if (__DEV__) console.log('検索実行:', text);
        onSearch(text);
        pendingSearchRef.current = null;
      } else {
        if (__DEV__) console.log('IME入力中のため検索をスキップ');
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
    if (__DEV__) console.log('IME composition started');
    isComposingRef.current = true;
  };
  
  // IME入力終了時のイベント処理
  const handleCompositionEnd = () => {
    if (__DEV__) console.log('IME composition ended');
    const currentText = localValue; // 現在の入力値を保存
    
    // IMEモードをリセット
    isComposingRef.current = false;
    
    // IME入力確定時に保留中の検索を実行
    if (currentText) {
      // 即時検索を実行（遅延なし）
      if (__DEV__) console.log('IME確定後に検索実行:', currentText);
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