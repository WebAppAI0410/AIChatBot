import React, { useMemo } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Switch,
  SafeAreaView,
  Platform,
  StatusBar
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useColors from '../constants/colors';
import { useStore } from '../store';
import Header from '../components/Header';

export default function AppearanceScreen() {
  const router = useRouter();
  const colors = useColors();
  const theme = useStore(state => state.theme);
  const setTheme = useStore(state => state.setTheme);
  const fontSize = useStore(state => state.fontSize);
  const setFontSize = useStore(state => state.setFontSize);
  const language = useStore(state => state.language);
  const setLanguage = useStore(state => state.setLanguage);
  const colorTheme = useStore(state => state.colorTheme);
  const setColorTheme = useStore(state => state.setColorTheme);

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
    { id: 'green', label: 'グリーン', color: '#047857' },
    { id: 'blue', label: 'ブルー', color: '#0066CC' },
    { id: 'orange', label: 'オレンジ', color: '#C2410C' },
    { id: 'purple', label: 'パープル', color: '#7C3AED' },
  ];

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContainer: {
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
      backgroundColor: colors.card,
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
      color: colors.textOnPrimary,
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
      borderColor: colors.textOnPrimary,
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
      backgroundColor: colors.card,
      alignItems: 'center',
    },
    selectedFontSizeOption: {
      backgroundColor: colors.primary,
    },
    fontSizeText: {
      color: colors.text,
    },
    selectedFontSizeText: {
      color: colors.textOnPrimary,
      fontWeight: '500',
    },
  }), [colors]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      
      <Header
        title="画面カスタマイズ"
        showBack={true}
        onBackPress={() => router.replace('/(tabs)/settings')}
      />
      
      <ScrollView style={styles.scrollContainer}>
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
                color={theme === option.id ? colors.textOnPrimary : colors.text}
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
                <Ionicons name="checkmark" size={24} color={colors.textOnPrimary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>カラーテーマ</Text>
          <View style={styles.colorThemeContainer}>
            {colorThemes.map((colorOpt) => (
              <TouchableOpacity
                key={colorOpt.id}
                style={[
                  styles.colorOption,
                  { backgroundColor: colorOpt.color },
                  colorOpt.id === colorTheme && styles.selectedColorOption,
                ]}
                onPress={() => setColorTheme(colorOpt.id as 'green' | 'blue' | 'orange' | 'purple')}
              >
                {colorOpt.id === colorTheme && (
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
                    { fontSize: option.id === 'small' ? 14 : option.id === 'medium' ? 16 : 18 }
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
                <Ionicons name="checkmark" size={24} color={colors.textOnPrimary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
