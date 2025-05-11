import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import { useStore } from '../store';
import useColors from '../constants/colors';

type LocalModelInstallModalProps = {
  visible: boolean;
  onClose: () => void;
};

const MODEL_URL = 'https://example.com/qwen3-4b-model.bin';
const MODEL_SIZE_MB = 10 * 1024; // 10GB in MB
const MODEL_SIZE_FORMATTED = '10GB';

export default function LocalModelInstallModal({
  visible,
  onClose,
}: LocalModelInstallModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const colors = useColors();
  const localModelStatus = useStore(state => state.localModelStatus);
  const startDownload = useStore(state => state.startDownload);
  const cancelDownload = useStore(state => state.cancelDownload);
  const setLocalModelStatus = useStore(state => state.setLocalModelStatus);
  const setDownloadProgress = useStore(state => state.setDownloadProgress);
  const setLocalModelPath = useStore(state => state.setLocalModelPath);
  
  useEffect(() => {
    if (visible && localModelStatus === 'not_installed') {
      setIsDownloading(false);
      setDownloadProgress(0);
    } else if (visible && localModelStatus === 'downloading') {
      setIsDownloading(true);
      setDownloadProgress(useStore.getState().downloadProgress);
    }
  }, [visible, localModelStatus]);
  
  const styles = StyleSheet.create({
    modalContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      padding: 24,
    },
    modalContent: {
      backgroundColor: colors.background,
      borderRadius: 16,
      width: '100%',
      maxWidth: 400,
      overflow: 'hidden',
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.lightGray,
    },
    title: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
    },
    closeButton: {
      padding: 4,
    },
    content: {
      padding: 24,
      alignItems: 'center',
    },
    modelName: {
      fontSize: 20,
      fontWeight: 'bold',
      marginTop: 16,
      marginBottom: 8,
      color: colors.text,
    },
    modelInfo: {
      fontSize: 16,
      color: colors.secondaryText,
      marginBottom: 16,
    },
    description: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 22,
      color: colors.text,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      width: '100%',
    },
    button: {
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      minWidth: 120,
      alignItems: 'center',
    },
    primaryButton: {
      backgroundColor: colors.primary,
    },
    primaryButtonText: {
      color: colors.textOnPrimary,
      fontWeight: 'bold',
      fontSize: 16,
    },
    secondaryButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.primary,
    },
    secondaryButtonText: {
      color: colors.primary,
      fontWeight: 'bold',
      fontSize: 16,
    },
    cancelButton: {
      backgroundColor: colors.error,
      marginTop: 24,
    },
    cancelButtonText: {
      color: colors.textOnPrimary,
      fontWeight: 'bold',
      fontSize: 16,
    },
    progressContainer: {
      width: '100%',
      height: 8,
      backgroundColor: colors.lightGray,
      borderRadius: 4,
      marginVertical: 24,
      overflow: 'hidden',
    },
    progressBar: {
      height: '100%',
      backgroundColor: colors.primary,
    },
    progressText: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 8,
      color: colors.text,
    },
    downloadingText: {
      fontSize: 16,
      color: colors.secondaryText,
      marginBottom: 24,
    },
  });
  
  const checkStorageSpace = async () => {
    try {
      const freeSpaceGB = 20; // Simulated free space
      
      if (freeSpaceGB < 15) {
        Alert.alert(
          'ストレージ容量不足',
          `モデルのインストールには少なくとも15GBの空き容量が必要です。現在の空き容量: ${freeSpaceGB}GB`,
          [{ text: 'OK' }]
        );
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error checking storage space:', error);
      return false;
    }
  };
  
  const handleStartDownload = async () => {
    const hasEnoughSpace = await checkStorageSpace();
    if (!hasEnoughSpace) return;
    
    setIsDownloading(true);
    startDownload();
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += 0.01;
      if (progress >= 1) {
        clearInterval(interval);
        handleDownloadComplete();
      } else {
        setDownloadProgress(progress);
        useStore.getState().setDownloadProgress(progress);
      }
    }, 300);
  };
  
  const handleCancelDownload = () => {
    setIsDownloading(false);
    cancelDownload();
    onClose();
  };
  
  const handleDownloadComplete = () => {
    const modelPath = FileSystem.documentDirectory + 'models/qwen3-4b/';
    
    setLocalModelStatus('ready');
    setLocalModelPath(modelPath);
    
    Alert.alert(
      'ダウンロード完了',
      'Qwen3:4Bモデルのインストールが完了しました。',
      [{ text: 'OK', onPress: onClose }]
    );
  };
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Qwen3:4B モデルインストール</Text>
            {!isDownloading && (
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.content}>
            <Ionicons name="cloud-download-outline" size={48} color={colors.primary} />
            
            <Text style={styles.modelName}>Qwen3:4B (ローカル)</Text>
            <Text style={styles.modelInfo}>
              サイズ: {MODEL_SIZE_FORMATTED} • コンテキスト長: 8,192トークン
            </Text>
            
            {!isDownloading ? (
              <>
                <Text style={styles.description}>
                  このモデルをダウンロードすると、インターネット接続なしでAIチャットを使用できます。ダウンロードには約10GBの空き容量とWi-Fi接続が必要です。
                </Text>
                
                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[styles.button, styles.secondaryButton]}
                    onPress={onClose}
                  >
                    <Text style={styles.secondaryButtonText}>キャンセル</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.button, styles.primaryButton]}
                    onPress={handleStartDownload}
                  >
                    <Text style={styles.primaryButtonText}>ダウンロード</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.progressText}>
                  {Math.round(progress * 100)}%
                </Text>
                
                <View style={styles.progressContainer}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${progress * 100}%` }
                    ]}
                  />
                </View>
                
                <Text style={styles.downloadingText}>
                  ダウンロード中... このまましばらくお待ちください
                </Text>
                
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleCancelDownload}
                >
                  <Text style={styles.cancelButtonText}>キャンセル</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}
