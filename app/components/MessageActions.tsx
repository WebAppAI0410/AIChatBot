import React, { useEffect, useRef, useState } from 'react';
import { ActionSheetIOS, Platform, ToastAndroid, Share, Animated, Text, StyleSheet, View } from 'react-native';
import { ActionSheetProvider, useActionSheet } from '@expo/react-native-action-sheet';
import * as Clipboard from 'expo-clipboard';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import useColors from '../constants/colors';
import useStore from '../store';

// グローバルトースト管理用の状態と関数
let globalShowToast: (message: string, withHaptic?: boolean) => void = () => {};

// トースト表示コンポーネント（独自実装）
export const Toast: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const colors = useColors();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // グローバル関数に自身の表示関数をセット
  useEffect(() => {
    globalShowToast = (msg: string, withHaptic = false) => {
      // すでに表示中のトーストがあれば消す
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // 振動フィードバック（オプショナル）
      if (withHaptic) {
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) {
          console.error('振動エラー:', e);
        }
      }

      // Androidはネイティブトーストを使用
      if (Platform.OS === 'android') {
        ToastAndroid.show(msg, ToastAndroid.SHORT);
        return;
      }

      // iOSはカスタムトーストを表示
      setMessage(msg);
      setVisible(true);

      // フェードインアニメーション
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();

      // 時間経過後に消す
      timeoutRef.current = setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          setVisible(false);
        });
      }, 2000);
    };

    // クリーンアップ
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [fadeAnim]);

  if (!visible && Platform.OS !== 'ios') return null;

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          opacity: fadeAnim,
          backgroundColor: colors.darkGray || '#333',
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );
};

// 成功時のトースト通知を表示
export const showToast = (message: string, withHaptic = false) => {
  // グローバル関数を呼び出し
  globalShowToast(message, withHaptic);
};

export type MessageActionProps = {
  messageId: string;
  messageType: 'text' | 'image';
  content: string;
  imageUri?: string;
  onDismiss: () => void;
};

export const MessageActions: React.FC<MessageActionProps> = ({
  messageId,
  messageType,
  content,
  imageUri,
  onDismiss,
}) => {
  const { showActionSheetWithOptions } = useActionSheet();
  const colors = useColors();
  
  // アクションを表示
  useEffect(() => {
    showActionsSheet();
  }, []);

  // アクションシート表示ロジック
  const showActionsSheet = () => {
    // メッセージタイプに応じたオプションを設定
    const options = messageType === 'text'
      ? ['コピー', 'ノートに保存', '共有', 'キャンセル']
      : ['コピー', 'ノートに保存', '写真に保存', '共有', 'キャンセル'];

    const cancelButtonIndex = options.length - 1;

    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        // iOS専用オプション
        userInterfaceStyle: Platform.OS === 'ios' ? 'light' : undefined,
        // Androidカスタマイズ
        containerStyle: Platform.OS === 'android' ? { backgroundColor: colors.card } : undefined,
      },
      async (selectedIndex: number | undefined) => {
        if (selectedIndex === undefined || selectedIndex === cancelButtonIndex) {
          onDismiss();
          return;
        }

        // 選択されたアクションを実行
        switch (selectedIndex) {
          case 0: // コピー
            await handleCopy();
            break;
          case 1: // ノートに保存
            await handleSaveToNote();
            break;
          case 2: // 写真に保存 or 共有
            if (messageType === 'image') {
              await handleSaveImage();
            } else {
              await handleShare();
            }
            break;
          case 3: // 共有 (画像の場合のみ)
            if (messageType === 'image') {
              await handleShare();
            }
            break;
          default:
            break;
        }
        
        onDismiss();
      }
    );
  };

  // テキストコピー機能
  const handleCopy = async () => {
    try {
      await Clipboard.setStringAsync(content);
      showToast('コピーしました', true);
    } catch (error) {
      console.error('コピーエラー:', error);
      showToast('コピーに失敗しました');
    }
  };

  // ノート保存機能 (プレースホルダー - ノート機能実装後に完成させる)
  const handleSaveToNote = async () => {
    try {
      showToast('ノート保存機能は将来的に実装されます', true);
      // ノート機能実装後に以下のコードを有効化
      /*
      // ノートストアにメッセージを追加
      const noteId = addNoteFromMessage({
        title: content.slice(0, 30) + (content.length > 30 ? '...' : ''),
        content: messageType === 'text' ? content : `![画像](${imageUri})\n\n`,
        tags: ['チャット'],
        createdAt: new Date().toISOString(),
      });
      */
    } catch (error) {
      console.error('ノート保存エラー:', error);
      showToast('ノートへの保存に失敗しました');
    }
  };

  // 画像保存機能
  const handleSaveImage = async () => {
    try {
      // 権限リクエスト
      const { status } = await MediaLibrary.requestPermissionsAsync();

      if (status !== 'granted') {
        showToast('写真へのアクセス権限が必要です');
        return;
      }

      if (!imageUri) {
        showToast('画像が見つかりません');
        return;
      }

      // リモートURLの場合はローカルにダウンロード
      let localUri = imageUri;
      if (imageUri.startsWith('http')) {
        const filename = `temp_${Date.now()}.jpg`;
        localUri = `${FileSystem.cacheDirectory}${filename}`;
        const downloadResult = await FileSystem.downloadAsync(imageUri, localUri);
        if (downloadResult.status !== 200) {
          throw new Error('画像のダウンロードに失敗しました');
        }
      }

      // ローカルファイルからメディアライブラリに保存
      const asset = await MediaLibrary.createAssetAsync(localUri);
      await MediaLibrary.createAlbumAsync('AI Chat', asset, false);

      // 成功時の振動フィードバックと通知
      showToast('画像を保存しました', true);
    } catch (error) {
      console.error('画像保存エラー:', error);
      showToast('画像の保存に失敗しました');
    }
  };

  // 共有機能
  const handleShare = async () => {
    try {
      if (messageType === 'image' && imageUri) {
        // 画像共有
        if (await Sharing.isAvailableAsync()) {
          // リモートURLの場合はダウンロードが必要
          if (imageUri.startsWith('http')) {
            const localUri = FileSystem.cacheDirectory + 'temp_share_image.jpg';
            const downloadResult = await FileSystem.downloadAsync(imageUri, localUri);
            
            if (downloadResult.status === 200) {
              await Sharing.shareAsync(localUri, {
                mimeType: 'image/jpeg',
                dialogTitle: 'AIチャットの画像を共有',
              });
              showToast('共有しました', true);
            } else {
              throw new Error('画像のダウンロードに失敗しました');
            }
          } else {
            // ローカルURIの場合はそのまま共有
            await Sharing.shareAsync(imageUri, {
              mimeType: 'image/jpeg',
              dialogTitle: 'AIチャットの画像を共有',
            });
            showToast('共有しました', true);
          }
        } else {
          showToast('共有機能が利用できません');
        }
      } else {
        // テキスト共有
        await Share.share({
          message: content,
          title: 'AIチャットの会話',
        });
        showToast('共有しました', true);
      }
    } catch (error) {
      console.error('共有エラー:', error);
      showToast('共有に失敗しました');
    }
  };

  // このコンポーネントはアクションシートを表示して消えるだけなので、レンダリングは不要
  return null;
};

// 他のコンポーネントからの利用を簡単にするためのラッパー
export const MessageActionsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ActionSheetProvider>
      {children}
    </ActionSheetProvider>
  );
};

export default MessageActions;

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    bottom: 100,
    left: 30,
    right: 30,
    backgroundColor: 'rgba(60, 60, 60, 0.9)',
    padding: 12,
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    alignItems: 'center',
    zIndex: 9999,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  }
}); 