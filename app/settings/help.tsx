import React from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  SafeAreaView,
  Platform,
  StatusBar
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useColors from '../constants/colors';
import Header from '../components/Header';

export default function HelpScreen() {
  const router = useRouter();
  const colors = useColors();
  
  const helpSections = [
    {
      title: 'チャットの始め方',
      icon: 'chatbubbles-outline',
      content: 'ホーム画面の「新規」タブをタップするか、チャット一覧画面の右下にある「+」ボタンをタップして新しいチャットを開始できます。',
    },
    {
      title: 'モデルの選択',
      icon: 'server-outline',
      content: 'チャット画面の右上にあるモデル名をタップすると、利用可能なAIモデルの一覧が表示されます。無料プランでは一部のモデルのみ利用可能です。',
    },
    {
      title: 'ローカルモデルの使用',
      icon: 'download-outline',
      content: '設定画面から「モデル設定」を選択し、ローカルモデルをダウンロードすることでオフラインでもAIを利用できます。ダウンロードには十分な空き容量が必要です。',
    },
    {
      title: 'ノートの作成と管理',
      icon: 'document-text-outline',
      content: 'チャット中に重要な情報を「ノート」タブに保存できます。チャット画面で文章を長押しして「ノートに追加」を選択するか、ノート画面から直接作成できます。',
    },
    {
      title: '画面のカスタマイズ',
      icon: 'color-palette-outline',
      content: '設定画面から「画面カスタマイズ」を選択すると、ダークモードやカラーテーマ、文字サイズなどを変更できます。',
    },
    {
      title: 'サブスクリプションプラン',
      icon: 'card-outline',
      content: '無料プランでは基本的な機能が利用可能です。より高度なモデルや機能を利用するには、Liteプラン（月額780円）またはHeavyプラン（月額1,980円）へのアップグレードが必要です。',
    },
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
      color: colors.textOnPrimary,
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
    header: {
      padding: 20,
      paddingBottom: 16,
    },
    contentTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 8,
    },
    headerSubtitle: {
      fontSize: 16,
      color: colors.secondaryText,
    },
    section: {
      marginBottom: 20,
      paddingHorizontal: 16,
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: `${colors.primary}20`,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    sectionContent: {
      fontSize: 16,
      lineHeight: 24,
      color: colors.secondaryText,
      paddingLeft: 52,
    },
    supportSection: {
      marginTop: 20,
      marginBottom: 20,
      paddingHorizontal: 16,
      alignItems: 'center',
    },
    supportTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 16,
    },
    supportButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
    },
    supportButtonText: {
      color: colors.background,
      fontSize: 16,
      fontWeight: '500',
      marginLeft: 8,
    },
    versionContainer: {
      padding: 16,
      alignItems: 'center',
      marginTop: 24,
      marginBottom: 40,
    },
    versionText: {
      fontSize: 14,
      color: colors.gray,
    },
  });

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      
      <Header
        title="使い方"
        showBack={true}
        onBackPress={() => router.replace('/(tabs)/settings')}
      />
      
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.header}>
          <Text style={styles.contentTitle}>AI ChatBotの使い方</Text>
          <Text style={styles.headerSubtitle}>基本的な機能と操作方法</Text>
        </View>

        {helpSections.map((section, index) => (
          <View key={index} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.iconContainer}>
                <Ionicons name={section.icon as any} size={24} color={colors.primary} />
              </View>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}

        <View style={styles.supportSection}>
          <Text style={styles.supportTitle}>サポートが必要ですか？</Text>
          <TouchableOpacity style={styles.supportButton}>
            <Ionicons name="mail-outline" size={20} color={colors.background} />
            <Text style={styles.supportButtonText}>サポートに問い合わせる</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>バージョン 1.0.0</Text>
        </View>
      </ScrollView>
    </View>
  );
}
