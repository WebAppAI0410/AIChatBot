import React, { useRef, useImperativeHandle, forwardRef, useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Text,
  ViewStyle,
  Keyboard
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../../ui/theme';
import useColors from '../../constants/colors';
import SearchInput, { SearchInputRef } from './SearchInput';
import { t } from '../../localization';

export interface SearchBarRef {
  focus: () => void;
  blur: () => void;
  clear: () => void;
  getValue: () => string;
}

interface SearchBarProps {
  placeholder?: string;
  onSearch: (text: string) => void;
  onCancel?: () => void;
  onCustomFocus?: () => void;
  onCustomBlur?: () => void;
  initialValue?: string;
  showCancelButton?: boolean;
  containerStyle?: ViewStyle;
  delayMs?: number;
}

// インラインスタイルを抽出
const getSearchInputStyle = (isFocused: boolean, colors: ReturnType<typeof useColors>): ViewStyle => ({
  flex: 1,
  borderRadius: theme.radius.md,
  borderWidth: 1,
  borderColor: isFocused ? colors.primary : 'transparent',
  backgroundColor: colors.card,
});

const SearchBar = forwardRef<SearchBarRef, SearchBarProps>(({
  placeholder = '検索...',
  onSearch,
  onCancel,
  onCustomFocus,
  onCustomBlur,
  initialValue = '',
  showCancelButton = true,
  containerStyle,
  delayMs = 300
}, ref) => {
  const colors = useColors();
  const searchInputRef = useRef<SearchInputRef>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState(initialValue);

  // キーボードの表示/非表示を監視（改善版）
  useEffect(() => {
    const subscriptions = [
      Keyboard.addListener('keyboardDidShow', () => {
        setIsFocused(true);
      }),
      Keyboard.addListener('keyboardDidHide', () => {
        if (!inputValue) {
          setIsFocused(false);
        }
      })
    ];

    return () => {
      subscriptions.forEach(subscription => subscription.remove());
    };
  }, [inputValue]);
  
  // 外部からアクセスできるメソッドを定義
  useImperativeHandle(ref, () => ({
    focus: () => {
      searchInputRef.current?.focus();
      setIsFocused(true);
    },
    blur: () => {
      searchInputRef.current?.blur();
      Keyboard.dismiss();
      if (!inputValue) {
        setIsFocused(false);
      }
    },
    clear: () => {
      searchInputRef.current?.clear();
      setInputValue('');
    },
    getValue: () => {
      return inputValue;
    }
  }));
  
  // 検索処理
  const handleSearch = (text: string) => {
    // テキスト入力を維持する
    setInputValue(text);
    // 親コンポーネントに通知（入力テキストは消さない）
    onSearch(text);
  };
  
  // フォーカスイベントハンドラ
  const handleInputFocus = () => {
    setIsFocused(true);
    onCustomFocus?.();
  };
  
  // ブラーイベントハンドラ
  const handleInputBlur = () => {
    // 入力値がなければフォーカス状態を解除、あればフォーカス状態を維持
    if (!inputValue) {
      setTimeout(() => {
        setIsFocused(false);
        onCustomBlur?.();
      }, 100);
    }
  };
  
  // キャンセルボタン処理
  const handleCancel = () => {
    searchInputRef.current?.clear();
    setInputValue('');
    onCancel?.();
    
    // キーボードは閉じず、フォーカスも保持
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
  };

  // バツボタン処理（最適化版）
  const handleClose = () => {
    // 現在の入力値を保持
    const currentInputValue = inputValue;
    
    // 入力をクリア
    searchInputRef.current?.clear();
    setInputValue('');

    // 空文字で検索を実行して初期状態に戻す
    onSearch('');
    
    // 元々入力値がなかった場合はフォーカスを解除し、キーボードを閉じる
    if (!currentInputValue) {
      searchInputRef.current?.blur();
      Keyboard.dismiss();
      setIsFocused(false);
      // 親コンポーネントにもブラー通知
      onCustomBlur?.();
    } else {
      // 入力値があった場合のみフォーカス維持
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  };
  
  return (
    <View style={[styles.container, containerStyle]}>
      <View style={[
        styles.searchContainer,
        { 
          backgroundColor: colors.card,
          borderRadius: theme.radius.md
        }
      ]}>
        <SearchInput
          ref={searchInputRef}
          placeholder={placeholder}
          onSearch={handleSearch}
          initialValue={initialValue}
          delayMs={delayMs}
          onCustomFocus={handleInputFocus}
          onCustomBlur={handleInputBlur}
          containerStyle={getSearchInputStyle(isFocused, colors)}
          showSearchIcon={true}
        />
      </View>

      {/* フォーカス時またはテキスト入力があればバツボタン表示 */}
      {(isFocused || inputValue) && (
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          activeOpacity={0.7}
          hitSlop={{ top: 12, right: 12, bottom: 12, left: 12 }}
          accessibilityLabel={t('search.clearInput', '検索をクリア')}
          accessibilityRole="button"
        >
          <Ionicons name="close-circle" size={22} color={colors.gray} />
        </TouchableOpacity>
      )}
      
      {/* 検索キーワードがある場合のみキャンセルボタン表示 */}
      {showCancelButton && inputValue && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          activeOpacity={0.7}
          accessibilityLabel={t('search.cancelSearch', '検索をキャンセル')}
          accessibilityRole="button"
        >
          <Text style={[styles.cancelText, {color: colors.primary}]}>
            {t('search.cancel', 'キャンセル')}
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
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    minHeight: theme.sizes.input.height.md,
    backgroundColor: 'transparent',
  },
  searchContainer: {
    flex: 1,
    overflow: 'hidden',
    borderRadius: theme.radius.md,
  },
  closeButton: {
    paddingHorizontal: theme.spacing.sm,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: theme.spacing.xs,
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