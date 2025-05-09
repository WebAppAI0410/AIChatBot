import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

export default function SettingsScreen() {
  const router = useRouter();

  const settingsOptions = [
    {
      title: 'サブスクリプション',
      icon: 'card-outline',
      route: '/settings/subscription',
      description: 'プランの管理と支払い情報',
    },
    {
      title: 'モデル設定',
      icon: 'server-outline',
      route: '/settings/local-model',
      description: 'AIモデルの管理とダウンロード',
    },
    {
      title: 'ノート機能設定',
      icon: 'document-text-outline',
      route: '/settings/notes',
      description: 'ノートの保存と同期の設定',
    },
    {
      title: '画面カスタマイズ',
      icon: 'color-palette-outline',
      route: '/settings/appearance',
      description: 'テーマとカラーの設定',
    },
    {
      title: '使い方',
      icon: 'help-circle-outline',
      route: '/settings/help',
      description: 'アプリの使い方とヒント',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>設定</Text>
        </View>

        <View style={styles.optionsContainer}>
          {settingsOptions.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={styles.optionItem}
              onPress={() => router.push(option.route)}
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
          ))}
        </View>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>バージョン 1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
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
    backgroundColor: '#FFFFFF',
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 194, 106, 0.1)',
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
    color: colors.darkGray,
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
