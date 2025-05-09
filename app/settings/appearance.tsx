import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';
import { useStore } from '../store';

export default function AppearanceScreen() {
  const theme = useStore(state => state.theme);
  const setTheme = useStore(state => state.setTheme);
  const fontSize = useStore(state => state.fontSize);
  const setFontSize = useStore(state => state.setFontSize);
  const language = useStore(state => state.language);
  const setLanguage = useStore(state => state.setLanguage);

  const themeOptions = [
    { id: 'light', label: 'ライトモード', icon: 'sunny-outline' },
    { id: 'dark', label: 'ダークモード', icon: 'moon-outline' },
    { id: 'system', label: 'システム設定に合わせる', icon: 'phone-portrait-outline' },
  ];

  const fontSizeOptions = [
    { id: 'small', label: '小' },
    { id: 'medium', label: '中' },
    { id: 'large', label: '大' },
  ];

  const languageOptions = [
    { id: 'ja', label: '日本語' },
    { id: 'en', label: 'English' },
  ];

  const colorThemes = [
    { id: 'green', label: 'グリーン', color: '#005E36' },
    { id: 'blue', label: 'ブルー', color: '#0066CC' },
    { id: 'purple', label: 'パープル', color: '#5856D6' },
    { id: 'red', label: 'レッド', color: '#FF3B30' },
  ];

  return (
    <>
      {/* Stack.Screen configuration is handled in _layout.tsx */}

      <ScrollView style={styles.container}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>テーマ</Text>
          {themeOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionItem,
                theme === option.id && styles.selectedOption,
              ]}
              onPress={() => setTheme(option.id as 'light' | 'dark' | 'system')}
            >
              <Ionicons
                name={option.icon as any}
                size={24}
                color={theme === option.id ? colors.background : colors.text}
              />
              <Text
                style={[
                  styles.optionText,
                  theme === option.id && styles.selectedOptionText,
                ]}
              >
                {option.label}
              </Text>
              {theme === option.id && (
                <Ionicons name="checkmark" size={24} color={colors.background} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>カラーテーマ</Text>
          <View style={styles.colorThemeContainer}>
            {colorThemes.map((colorTheme) => (
              <TouchableOpacity
                key={colorTheme.id}
                style={[
                  styles.colorOption,
                  { backgroundColor: colorTheme.color },
                  colorTheme.color === colors.primary && styles.selectedColorOption,
                ]}
              >
                {colorTheme.color === colors.primary && (
                  <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>文字サイズ</Text>
          <View style={styles.fontSizeContainer}>
            {fontSizeOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.fontSizeOption,
                  fontSize === option.id && styles.selectedFontSizeOption,
                ]}
                onPress={() => setFontSize(option.id as 'small' | 'medium' | 'large')}
              >
                <Text
                  style={[
                    styles.fontSizeText,
                    fontSize === option.id && styles.selectedFontSizeText,
                    option.id === 'small' && { fontSize: 14 },
                    option.id === 'medium' && { fontSize: 16 },
                    option.id === 'large' && { fontSize: 18 },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>言語</Text>
          {languageOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionItem,
                language === option.id && styles.selectedOption,
              ]}
              onPress={() => setLanguage(option.id as 'ja' | 'en')}
            >
              <Text
                style={[
                  styles.optionText,
                  language === option.id && styles.selectedOptionText,
                ]}
              >
                {option.label}
              </Text>
              {language === option.id && (
                <Ionicons name="checkmark" size={24} color={colors.background} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 16,
    color: colors.text,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
  },
  selectedOption: {
    backgroundColor: colors.primary,
  },
  optionText: {
    fontSize: 16,
    marginLeft: 12,
    flex: 1,
    color: colors.text,
  },
  selectedOptionText: {
    color: colors.background,
    fontWeight: '500',
  },
  colorThemeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  colorOption: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedColorOption: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  fontSizeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  fontSizeOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  selectedFontSizeOption: {
    backgroundColor: colors.primary,
  },
  fontSizeText: {
    color: colors.text,
  },
  selectedFontSizeText: {
    color: colors.background,
    fontWeight: '500',
  },
});
