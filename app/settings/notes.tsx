import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  Switch, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  SafeAreaView,
  Platform,
  StatusBar
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useColors from '../constants/colors';
import Header from '../components/Header';

export default function NotesSettingsScreen() {
  const router = useRouter();
  const colors = useColors();
  const [autoSave, setAutoSave] = useState(true);
  const [cloudSync, setCloudSync] = useState(false);
  const [categorizeNotes, setCategorizeNotes] = useState(true);
  const [showInChat, setShowInChat] = useState(true);

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
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderRadius: 8,
      marginBottom: 8,
      backgroundColor: colors.card,
    },
    actionButtonText: {
      fontSize: 16,
      fontWeight: '500',
      color: colors.primary,
      marginLeft: 12,
    },
    dangerButton: {
      borderWidth: 1,
      borderColor: colors.error,
    },
    dangerButtonText: {
      color: colors.error,
    },
  });

  const handleClearNotes = () => {
    Alert.alert(
      'ノートを削除',
      'すべてのノートを削除してもよろしいですか？この操作は元に戻せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: '削除', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('削除完了', 'すべてのノートが削除されました。');
          }
        }
      ]
    );
  };

  const handleExportNotes = () => {
    Alert.alert(
      'エクスポート完了',
      'ノートがエクスポートされました。',
      [{ text: 'OK' }]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      
      <SafeAreaView style={styles.container}>
        {/* Use Header component for consistent styling */}
        <Header
          title="ノート機能設定"
          showBack={true}
          onTitleEdit={undefined}
        />
        
        <ScrollView style={styles.scrollContainer}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>一般設定</Text>
          
            <View style={styles.optionItem}>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>自動保存</Text>
                <Text style={styles.optionDescription}>チャット中に自動的にノートを保存します</Text>
              </View>
              <Switch
                value={autoSave}
                onValueChange={setAutoSave}
                trackColor={{ false: colors.lightGray, true: colors.primaryLight }}
                thumbColor={autoSave ? colors.primary : '#f4f3f4'}
              />
            </View>
            
            <View style={styles.optionItem}>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>クラウド同期</Text>
                <Text style={styles.optionDescription}>ノートをクラウドに同期します（プレミアム機能）</Text>
              </View>
              <Switch
                value={cloudSync}
                onValueChange={setCloudSync}
                trackColor={{ false: colors.lightGray, true: colors.primaryLight }}
                thumbColor={cloudSync ? colors.primary : '#f4f3f4'}
                disabled={true}
              />
            </View>
            
            <View style={styles.optionItem}>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>ノートの分類</Text>
                <Text style={styles.optionDescription}>AIによるノートの自動分類</Text>
              </View>
              <Switch
                value={categorizeNotes}
                onValueChange={setCategorizeNotes}
                trackColor={{ false: colors.lightGray, true: colors.primaryLight }}
                thumbColor={categorizeNotes ? colors.primary : '#f4f3f4'}
              />
            </View>
            
            <View style={styles.optionItem}>
              <View style={styles.optionTextContainer}>
                <Text style={styles.optionTitle}>チャット内表示</Text>
                <Text style={styles.optionDescription}>チャット中にノートを表示します</Text>
              </View>
              <Switch
                value={showInChat}
                onValueChange={setShowInChat}
                trackColor={{ false: colors.lightGray, true: colors.primaryLight }}
                thumbColor={showInChat ? colors.primary : '#f4f3f4'}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>データ管理</Text>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleExportNotes}
            >
              <Ionicons name="download-outline" size={24} color={colors.primary} />
              <Text style={styles.actionButtonText}>ノートをエクスポート</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.dangerButton]}
              onPress={handleClearNotes}
            >
              <Ionicons name="trash-outline" size={24} color={colors.error} />
              <Text style={[styles.actionButtonText, styles.dangerButtonText]}>すべてのノートを削除</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}
