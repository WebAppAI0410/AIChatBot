import React from 'react';
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
    { id: 'orange', label: 'オレンジ', color: '#F97316' },
    { id: 'purple', label: 'パープル', color: '#7C3AED' },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.primary,
      paddingTop: Platform.OS === 'ios' ? 12 : StatusBar.currentHeight || 0,
      paddingBottom: 12,
      paddingHorizontal: 16,
      height: Platform.OS === 'ios' ? 100 : (StatusBar.currentHeight || 0) + 60,
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      color: colors.background,
      fontSize: 18,
      fontWeight: '600',
      flex: 1,
      textAlign: 'center',
      marginHorizontal: 10,
    },
    headerRight: {
      width: 40,
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
      borderColor: colors.background,
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
      color: colors.background,
      fontWeight: '500',
    },
  });

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      
      <SafeAreaView style={styles.container}>
        {/* Custom Header with Safe Area for Notch */}
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => router.navigate('/(tabs)/settings')}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={24} color={colors.background} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>
            画面カスタマイズ
          </Text>
          
          <View style={styles.headerRight} />
        </View>
        
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
              {colorThemes.map((theme) => (
                <TouchableOpacity
                  key={theme.id}
                  style={[
                    styles.colorOption,
                    { backgroundColor: theme.color },
                    theme.id === colorTheme && styles.selectedColorOption,
                  ]}
                  onPress={() => setColorTheme(theme.id as 'green' | 'blue' | 'orange' | 'purple')}
                >
                  {theme.id === colorTheme && (
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
                  <Ionicons name="checkmark" size={24} color={colors.background} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
