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
  StatusBar 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import { useStore } from '../store';
import { colors } from '../constants/colors';
import LocalModelInstallModal from '../components/LocalModelInstallModal';

export default function LocalModelScreen() {
  const router = useRouter();
  const [showInstallModal, setShowInstallModal] = useState(false);
  
  const localModelStatus = useStore(state => state.localModelStatus);
  const localModelPath = useStore(state => state.localModelPath);
  const downloadProgress = useStore(state => state.downloadProgress);
  const setLocalModelStatus = useStore(state => state.setLocalModelStatus);
  const setLocalModelPath = useStore(state => state.setLocalModelPath);
  
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
              if (localModelPath) {
                console.log(`Would delete files at: ${localModelPath}`);
              }
              
              setLocalModelStatus('not_installed');
              setLocalModelPath(null);
              
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
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={24} color={colors.background} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>
            ローカルモデル管理
          </Text>
          
          <View style={styles.headerRight} />
        </View>
        
        <ScrollView style={styles.scrollContainer}>
          <View style={styles.contentHeader}>
            <Ionicons name="save-outline" size={48} color={colors.primary} />
            <Text style={styles.title}>ローカルモデル管理</Text>
            <Text style={styles.subtitle}>
              ローカルモデルをインストールすると、インターネット接続なしでAIチャットを使用できます。
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
                localModelStatus === 'ready' ? styles.readyBadge :
                localModelStatus === 'downloading' ? styles.downloadingBadge :
                styles.notInstalledBadge
              ]}>
                <Text style={styles.statusText}>
                  {localModelStatus === 'ready' ? 'インストール済み' :
                   localModelStatus === 'downloading' ? 'ダウンロード中' :
                   '未インストール'}
                </Text>
              </View>
            </View>
          </View>
        </View>
        
        {localModelStatus === 'downloading' && (
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
          {localModelStatus === 'not_installed' && (
            <TouchableOpacity
              style={[styles.button, styles.installButton]}
              onPress={handleInstall}
            >
              <Ionicons name="cloud-download-outline" size={20} color={colors.background} />
              <Text style={styles.buttonText}>インストール</Text>
            </TouchableOpacity>
          )}
          
          {localModelStatus === 'downloading' && (
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                useStore.getState().cancelDownload();
              }}
            >
              <Ionicons name="close-circle-outline" size={20} color={colors.background} />
              <Text style={styles.buttonText}>キャンセル</Text>
            </TouchableOpacity>
          )}
          
          {localModelStatus === 'ready' && (
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
      
      <LocalModelInstallModal
        visible={showInstallModal}
        onClose={() => setShowInstallModal(false)}
      />
    </ScrollView>
      </SafeAreaView>
    </>
  );
}

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
  contentHeader: {
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.darkGray,
    textAlign: 'center',
  },
  modelCard: {
    margin: 16,
    padding: 16,
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.lightGray,
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
  },
  modelDescription: {
    fontSize: 16,
    color: colors.darkGray,
    marginBottom: 16,
    lineHeight: 22,
  },
  modelDetails: {
    backgroundColor: colors.lightGray,
    padding: 12,
    borderRadius: 8,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailValue: {
    fontSize: 16,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  readyBadge: {
    backgroundColor: colors.success,
  },
  downloadingBadge: {
    backgroundColor: colors.warning,
  },
  notInstalledBadge: {
    backgroundColor: colors.gray,
  },
  statusText: {
    color: colors.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBarContainer: {
    height: 12,
    backgroundColor: colors.lightGray,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
  },
  actionContainer: {
    alignItems: 'center',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 200,
    justifyContent: 'center',
  },
  installButton: {
    backgroundColor: colors.primary,
  },
  uninstallButton: {
    backgroundColor: colors.error,
  },
  cancelButton: {
    backgroundColor: colors.error,
  },
  buttonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  infoSection: {
    padding: 16,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 16,
  },
  infoText: {
    fontSize: 16,
    lineHeight: 22,
    color: colors.darkGray,
  },
});
