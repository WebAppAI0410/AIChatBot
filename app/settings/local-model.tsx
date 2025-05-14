import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  Alert, 
  ScrollView, 
  SafeAreaView, 
  Platform, 
  StatusBar,
  Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import { useStore } from '../store';
import useColors from '../constants/colors';
import LocalModelInstallModal from '../components/LocalModelInstallModal';
import Header from '../components/Header';
import LicenseAttributionSection from '../components/LicenseAttributionSection';

export default function LocalModelScreen() {
  const router = useRouter();
  const colors = useColors();
  const [showInstallModal, setShowInstallModal] = useState(false);
  
  const modelStatus = useStore(state => state.localModel.modelStatus);
  const modelPath = useStore(state => state.localModel.modelPath);
  const downloadProgress = useStore(state => state.localModel.downloadProgress);
  const setModelStatus = useStore(state => state.localModel.setModelStatus);
  const setModelPath = useStore(state => state.localModel.setLocalModelPath);
  
  const handleInstall = () => {
    setShowInstallModal(true);
  };
  
  const handleUninstall = () => {
    Alert.alert(
      'モデルをアンインストール',
      'Qwen3:4Bモデルをアンインストールしますか？ローカルでのAI機能が使用できなくなります。',
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: 'アンインストール', 
          style: 'destructive',
          onPress: async () => {
            try {
              if (modelPath) {
                console.log(`Would delete files at: ${modelPath}`);
              }
              
              setModelStatus('not_downloaded');
              setModelPath(null);
              
              Alert.alert(
                'アンインストール完了',
                'Qwen3:4Bモデルがアンインストールされました。'
              );
            } catch (error) {
              console.error('Error uninstalling model:', error);
              Alert.alert(
                'エラー',
                'モデルのアンインストール中にエラーが発生しました。'
              );
            }
          }
        }
      ]
    );
  };
  
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
      paddingHorizontal: 16,
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
    contentHeader: {
      padding: 24,
      alignItems: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginTop: 16,
      color: colors.text,
    },
    subtitle: {
      fontSize: 16,
      textAlign: 'center',
      color: colors.secondaryText,
      marginTop: 8,
      lineHeight: 22,
    },
    modelCard: {
      backgroundColor: colors.card,
      borderRadius: 12,
      padding: 16,
      margin: 16,
      marginTop: 0,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    modelInfo: {
      marginBottom: 16,
    },
    modelName: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 8,
      color: colors.text,
    },
    modelDescription: {
      fontSize: 14,
      color: colors.secondaryText,
      marginBottom: 16,
      lineHeight: 20,
    },
    modelDetails: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 16,
    },
    detailItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    detailLabel: {
      fontSize: 14,
      color: colors.secondaryText,
    },
    detailValue: {
      fontSize: 14,
      fontWeight: '500',
      color: colors.text,
    },
    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 16,
      alignSelf: 'flex-start',
    },
    readyBadge: {
      backgroundColor: `${colors.success}20`,
    },
    downloadingBadge: {
      backgroundColor: `${colors.warning}20`,
    },
    notInstalledBadge: {
      backgroundColor: `${colors.lightGray}`,
    },
    statusText: {
      fontSize: 12,
      fontWeight: '500',
    },
    progressContainer: {
      marginVertical: 16,
    },
    progressBarContainer: {
      height: 8,
      backgroundColor: colors.lightGray,
      borderRadius: 4,
      overflow: 'hidden',
      marginBottom: 8,
    },
    progressBar: {
      height: '100%',
      backgroundColor: colors.primary,
    },
    progressText: {
      fontSize: 14,
      fontWeight: '500',
      textAlign: 'right',
      color: colors.text,
    },
    actionContainer: {
      marginTop: 8,
    },
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      borderRadius: 8,
    },
    installButton: {
      backgroundColor: colors.primary,
    },
    cancelButton: {
      backgroundColor: colors.warning,
    },
    uninstallButton: {
      backgroundColor: colors.error,
    },
    buttonText: {
      color: colors.textOnPrimary,
      fontSize: 16,
      fontWeight: '500',
      marginLeft: 8,
    },
    infoSection: {
      padding: 16,
      margin: 16,
      marginTop: 0,
      backgroundColor: colors.card,
      borderRadius: 12,
    },
    infoTitle: {
      fontSize: 18,
      fontWeight: '600',
      marginBottom: 8,
      color: colors.text,
    },
    infoText: {
      fontSize: 14,
      color: colors.secondaryText,
      lineHeight: 20,
      marginBottom: 16,
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
        title="ローカルモデル"
        showBack={true}
        onBackPress={() => router.replace('/(tabs)/settings')}
      />
      
      <ScrollView style={styles.scrollContainer}>
        <View style={styles.contentHeader}>
          <Ionicons name="server-outline" size={48} color={colors.primary} />
          <Text style={styles.title}>ローカルモデル</Text>
          <Text style={styles.subtitle}>
            Qwen3:4Bモデルをデバイスに保存して、オフラインでも利用できます
          </Text>
        </View>
        
        <View style={styles.modelCard}>
          <View style={styles.modelInfo}>
            <Text style={styles.modelName}>Qwen3:4B</Text>
            <Text style={styles.modelDescription}>
              Alibaba Cloudが開発した軽量で高性能な多言語モデル。日本語にも対応しています。
            </Text>
            
            <View style={styles.modelDetails}>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>サイズ:</Text>
                <Text style={styles.detailValue}>10GB</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>コンテキスト長:</Text>
                <Text style={styles.detailValue}>8,192トークン</Text>
              </View>
              <View style={styles.detailItem}>
                <Text style={styles.detailLabel}>ステータス:</Text>
                <View style={[
                  styles.statusBadge,
                  modelStatus === 'ready' ? styles.readyBadge :
                  modelStatus === 'downloading' ? styles.downloadingBadge :
                  styles.notInstalledBadge
                ]}>
                  <Text style={styles.statusText}>
                    {modelStatus === 'ready' ? 'インストール済み' :
                     modelStatus === 'downloading' ? 'ダウンロード中' :
                     '未インストール'}
                  </Text>
                </View>
              </View>
            </View>
          </View>
          
          {modelStatus === 'downloading' && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBarContainer}>
                <View 
                  style={[
                    styles.progressBar, 
                    { width: `${downloadProgress * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round(downloadProgress * 100)}%
              </Text>
            </View>
          )}
          
          <View style={styles.actionContainer}>
            {modelStatus === 'not_downloaded' && (
              <TouchableOpacity
                style={[styles.button, styles.installButton]}
                onPress={handleInstall}
              >
                <Ionicons name="cloud-download-outline" size={20} color={colors.background} />
                <Text style={styles.buttonText}>インストール</Text>
              </TouchableOpacity>
            )}
            
            {modelStatus === 'downloading' && (
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  useStore.getState().localModel.cancelDownload();
                }}
              >
                <Ionicons name="close-circle-outline" size={20} color={colors.background} />
                <Text style={styles.buttonText}>キャンセル</Text>
              </TouchableOpacity>
            )}
            
            {modelStatus === 'ready' && (
              <TouchableOpacity
                style={[styles.button, styles.uninstallButton]}
                onPress={handleUninstall}
              >
                <Ionicons name="trash-outline" size={20} color={colors.background} />
                <Text style={styles.buttonText}>アンインストール</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>ローカルモデルについて</Text>
          <Text style={styles.infoText}>
            ローカルモデルは、デバイス上で直接実行されるAIモデルです。インターネット接続がなくても使用でき、プライバシーを保護します。ただし、クラウドモデルと比較すると、性能が若干劣る場合があります。
          </Text>
          
          <Text style={styles.infoTitle}>使用上の注意</Text>
          <Text style={styles.infoText}>
            • ローカルモデルのダウンロードには、Wi-Fi接続を推奨します。{'\n'}
            • モデルのインストールには約10GBの空き容量が必要です。{'\n'}
            • バッテリー消費を抑えるため、充電中の使用を推奨します。
          </Text>
        </View>
        
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>ライセンス情報</Text>
          <LicenseAttributionSection />
        </View>
        
        <LocalModelInstallModal
          visible={showInstallModal}
          onClose={() => setShowInstallModal(false)}
        />
      </ScrollView>
    </View>
  );
}
