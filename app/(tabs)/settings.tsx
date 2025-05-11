import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Link, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useColors from '../constants/colors';
import Header from '../components/Header';
import theme from '../ui/theme';

// アイコン名の型を定義
type IconName = React.ComponentProps<typeof Ionicons>['name'];

export default function SettingsScreen() {
  const router = useRouter();
  const colors = useColors();  // 動的カラーを取得

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollContainer: {
      flex: 1,
    },
    optionsContainer: {
      marginTop: 8,
    },
    optionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.lightGray,
      backgroundColor: colors.card,
    },
    optionIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: `${colors.primary}20`,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
    },
    optionTextContainer: {
      flex: 1,
    },
    optionTitle: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.text,
      marginBottom: 4,
    },
    optionDescription: {
      fontSize: 14,
      color: colors.secondaryText,
    },
    versionContainer: {
      padding: 16,
      alignItems: 'center',
      marginTop: 24,
    },
    versionText: {
      fontSize: 14,
      color: colors.gray,
    },
  });

  const settingsOptions = [
    {
      title: 'サブスクリプション',
      icon: 'card-outline' as IconName,
      route: 'settings/subscription',
      description: 'プランの管理と支払い情報',
    },
    {
      title: 'モデル設定',
      icon: 'server-outline' as IconName,
      route: 'settings/local-model',
      description: 'AIモデルの管理とダウンロード',
    },
    {
      title: 'ノート機能設定',
      icon: 'document-text-outline' as IconName,
      route: 'settings/notes',
      description: 'ノートの保存と同期の設定',
    },
    {
      title: '画面カスタマイズ',
      icon: 'color-palette-outline' as IconName,
      route: 'settings/appearance',
      description: 'テーマとカラーの設定',
    },
    {
      title: '使い方',
      icon: 'help-circle-outline' as IconName,
      route: 'settings/help',
      description: 'アプリの使い方とヒント',
    },
  ];

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      
      <SafeAreaView style={styles.container}>
        <Header
          title="設定"
          showBack={false}
          onTitleEdit={undefined}
        />
        
        <ScrollView style={styles.scrollContainer}>
          <View style={styles.optionsContainer}>
            {settingsOptions.map((option, index) => (
              <Link
                key={index}
                href={option.route}
                asChild
              >
                <TouchableOpacity
                  style={styles.optionItem}
                >
                  <View style={styles.optionIconContainer}>
                    <Ionicons name={option.icon} size={24} color={colors.primary} />
                  </View>
                  <View style={styles.optionTextContainer}>
                    <Text style={styles.optionTitle}>{option.title}</Text>
                    <Text style={styles.optionDescription}>{option.description}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color={colors.gray} />
                </TouchableOpacity>
              </Link>
            ))}
          </View>

          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>バージョン 1.0.0</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
