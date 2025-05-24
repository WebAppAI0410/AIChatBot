import React, { useState, useMemo } from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps, ViewStyle, NativeSyntheticEvent, TextInputFocusEventData, AccessibilityRole } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import theme from '../ui/theme';
import useColors from '../constants/colors';

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
};

const Input: React.FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  ...textInputProps
}) => {
  const colors = useColors();
  const [isFocused, setIsFocused] = useState(false);
  
  const handleFocus = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(true);
    if (textInputProps.onFocus) {
      textInputProps.onFocus(e);
    }
  };
  
  const handleBlur = (e: NativeSyntheticEvent<TextInputFocusEventData>) => {
    setIsFocused(false);
    if (textInputProps.onBlur) {
      textInputProps.onBlur(e);
    }
  };
  
  // アクセシビリティ状態の設定
  const accessibilityState = useMemo(() => ({
    disabled: textInputProps.editable === false,
    error: !!error,
  }), [textInputProps.editable, error]);
  
  // エラーメッセージがある場合のアクセシビリティヒント
  const accessibilityHintWithError = useMemo(() => {
    if (error) {
      return textInputProps.accessibilityHint 
        ? `${textInputProps.accessibilityHint}。エラー: ${error}` 
        : `エラー: ${error}`;
    }
    return textInputProps.accessibilityHint;
  }, [error, textInputProps.accessibilityHint]);
  
  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>
          {label}
        </Text>
      )}
      
      <View style={[
        styles.inputContainer,
        { 
          borderColor: error 
            ? colors.error 
            : isFocused 
              ? colors.primary 
              : colors.border 
        },
      ]}>
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={colors.gray}
            style={styles.leftIcon}
            accessibilityElementsHidden={true}
            importantForAccessibility="no"
          />
        )}
        
        <TextInput
          style={[
            styles.input,
            { color: colors.text },
            leftIcon && styles.inputWithLeftIcon,
            rightIcon && styles.inputWithRightIcon,
          ]}
          placeholderTextColor={colors.gray}
          onFocus={handleFocus}
          onBlur={handleBlur}
          accessibilityLabel={textInputProps.accessibilityLabel || label}
          accessibilityHint={accessibilityHintWithError}
          accessibilityState={accessibilityState}
          accessibilityRole="text"
          {...textInputProps}
        />
        
        {rightIcon && (
          <Ionicons
            name={rightIcon}
            size={20}
            color={colors.gray}
            style={styles.rightIcon}
            onPress={onRightIconPress}
            accessibilityLabel={onRightIconPress ? `${rightIcon}ボタン` : undefined}
            accessibilityRole={onRightIconPress ? "button" : undefined}
          />
        )}
      </View>
      
      {error && (
        <Text style={[styles.error, { color: colors.error }]}
          accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.md,
  },
  label: {
    fontSize: theme.fontSizes.sm,
    marginBottom: theme.spacing.xs,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: theme.borderWidth.thin,
    borderRadius: theme.radius.md,
    backgroundColor: 'transparent',
  },
  input: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
    fontSize: theme.fontSizes.md,
  },
  inputWithLeftIcon: {
    paddingLeft: theme.spacing.xs,
  },
  inputWithRightIcon: {
    paddingRight: theme.spacing.xs,
  },
  leftIcon: {
    marginLeft: theme.spacing.md,
  },
  rightIcon: {
    marginRight: theme.spacing.md,
  },
  error: {
    fontSize: theme.fontSizes.sm,
    marginTop: theme.spacing.xs,
  },
});

export default Input;
