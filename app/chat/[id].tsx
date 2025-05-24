import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Alert,
  SafeAreaView,
  StatusBar,
  Modal,
  Appearance,
  Share,
  ScrollView,
  useWindowDimensions,
  Keyboard
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import useColors from '../constants/colors';
import { MODELS } from '../constants/models';
import { theme } from '../ui/theme';
import { fetchChatCompletion, ChatMessage as ApiChatMessage } from '../services/api';
import { Message } from '../store/chatStore';
import { generateUuid } from '../store/chatStore';
import ModelSelectModal from '../components/ModelSelectModal';
import LocalModelInstallModal from '../components/LocalModelInstallModal';
import Header from '../components/Header';
import ChatBubble from '../components/ChatBubble';
import { ImageGenerationPanel, ImageGenerationPanelHandle } from '../components/ImageGenerationPanel';
import MessageActions, { MessageActionsProvider, showToast } from '../components/MessageActions';
import * as Clipboard from 'expo-clipboard';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { showCentralToast } from '../components/CentralToast';
import BalloonActionMenu, { BalloonAction } from '../components/BalloonActionMenu';
import * as ImagePicker from 'expo-image-picker';

export default function ChatScreen() {
  const { id, image_mode } = useLocalSearchParams<{ id: string; image_mode?: string }>();
  const router = useRouter();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showModelSelect, setShowModelSelect] = useState(false);
  const [showLocalModelInstall, setShowLocalModelInstall] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [showImageOptions, setShowImageOptions] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [showMessageActions, setShowMessageActions] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [showLocalCentralToast, setShowLocalCentralToast] = useState(false);
  const [localCentralToastMsg, setLocalCentralToastMsg] = useState('');
  const localCentralToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [balloonMenuVisible, setBalloonMenuVisible] = useState(false);
  const [balloonMenuPos, setBalloonMenuPos] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [balloonMenuActions, setBalloonMenuActions] = useState<BalloonAction[]>([]);
  const [balloonMenuDark, setBalloonMenuDark] = useState(false);
  const balloonTargetRef = useRef<any>(null);
  const [balloonTargetMsg, setBalloonTargetMsg] = useState<Message | null>(null);
  const [showPartialCopyModal, setShowPartialCopyModal] = useState(false);
  const [selectedTextContent, setSelectedTextContent] = useState('');
  const [selectedText, setSelectedText] = useState('');
  
  // マルチモーダル機能の状態
  const [enabledFeatures, setEnabledFeatures] = useState<Set<string>>(new Set());
  const [showFeatureOptions, setShowFeatureOptions] = useState(false);
  
  const colors = useColors();
  const addMessage = useStore(state => state.addMessage);
  const addImageMessage = useStore(state => state.addImageMessage);
  const replaceMessage = useStore(state => state.replaceMessage);
  const markChatAsRead = useStore(state => state.markChatAsRead);
  const updateChatTitle = useStore(state => state.updateChatTitle);
  const updateChatModel = useStore(state => state.updateChatModel);
  const selectMessage = useStore(state => state.selectMessage);
  const clearSelectedMessage = useStore(state => state.clearSelectedMessage);
  const selectedMessageId = useStore(state => state.selectedMessageId);
  const localModelStatus = useStore(state => state.localModelStatus);
  const plan = useStore(state => state.plan);
  
  // Use a stable selector for the specific chat to avoid re-renders
  const chat = useStore(useCallback((state) => 
    state.chats.find(c => c.id === id), [id]
  ));
  
  // 設定値（settingsストアにないため、デフォルト値を使用）
  const currentModelId = chat?.modelId || 'openai/gpt-4o-mini'; // デフォルトモデル
  const currentModel = MODELS.find(m => m.id === currentModelId);
  const isVisionSupported = !!(currentModel?.features?.vision); // Vision対応チェック
  
  const flatListRef = useRef<FlatList>(null);
  const imageGenPanelRef = useRef<ImageGenerationPanelHandle>(null);
  
  useEffect(() => {
    if (chat && __DEV__) {
      console.log('====== CHAT STATE ======');
      console.log('Chat ID:', chat.id);
      console.log('Messages:', chat.messages.length);
      if (chat.messages.length > 0) {
        const lastMsg = chat.messages[chat.messages.length - 1];
        console.log('Last message:', lastMsg.role, lastMsg.content.substring(0, 30));
      }
      console.log('=======================');
    }
  }, [chat?.id]); // Only depend on chat ID, not messages
  
  useEffect(() => {
    if (chat) {
      markChatAsRead(chat.id);
    }
  }, [chat?.id, markChatAsRead]);
  
  // Auto-response logic is disabled to prevent infinite loops
  // This was causing the "Maximum update depth exceeded" error
  // TODO: Implement proper auto-response logic if needed
  
  // ギャラリーから移行した場合、画像生成モードを自動的に有効化
  useEffect(() => {
    if (id && image_mode === 'true') {
      setShowImageOptions(true);
    }
  }, [id, image_mode]);
  
  const currentChatSettings = {
    temperature: 0.7,
    maxTokens: 1000,
    maxHistoryLength: 10,
    openRouterProxyUrl: '/api/chat', // プロキシURL
  };

  const handleSend = async () => {
    if (!chat || !currentModelId) {
        showToast('チャット情報またはモデルIDが見つかりません。');
        return;
    }
    const trimmedInput = input.trim();
    const MAX_HISTORY_LENGTH = currentChatSettings.maxHistoryLength;

    // OpenRouter機能パラメータを構築
    const buildOpenRouterParams = () => {
      const params: any = {
        model: currentModelId,
        temperature: currentChatSettings.temperature,
        max_tokens: currentChatSettings.maxTokens,
        stream: true,
      };

      // 推論機能が有効な場合
      if (enabledFeatures.has('reasoning') && currentModel?.features?.reasoning) {
        params.reasoning = { effort: 'high' };
      }

      // Web検索機能が有効な場合
      if (enabledFeatures.has('search') && currentModel?.features?.search) {
        params.web_search = true;
      }

      return params;
    };

    if (selectedImage) {
      if (!isVisionSupported) {
        showToast('現在選択中のモデルは画像入力に対応していません。');
        setSelectedImage(null);
        return;
      }
      setIsLoading(true);

      const userMessageContentForApi = [
        { type: 'text', text: trimmedInput || ' ' },
        { type: 'image_url', image_url: { url: selectedImage } }
      ];

      const displayMessage = {
        id: generateUuid(),
        role: 'user' as const,
        content: trimmedInput || '画像を送信しました',
        imageUrl: selectedImage,
      };
      addMessage(chat.id, displayMessage);

      const history = chat.messages
        .filter((msg: Message) => msg.role === 'user' || msg.role === 'assistant')
        .slice(-MAX_HISTORY_LENGTH)
        .map((msg: Message) => {
          let contentForApi: string | object[];
          if (Array.isArray(msg.content)) {
            contentForApi = msg.content;
          } else if (msg.imageUrl && msg.role === 'user') {
            contentForApi = [
              { type: 'text', text: (typeof msg.content === 'string' && msg.content !== '画像を送信しました') ? msg.content : ' ' }, 
              { type: 'image_url', image_url: { url: msg.imageUrl } }
            ];
          } else if (typeof msg.content === 'string') {
            contentForApi = msg.content;
          } else {
            console.warn('Unknown message content format in history:', msg);
            contentForApi = ' ';
          }
          return { role: msg.role, content: contentForApi };
        });

      const messagesForApi = [...history, { role: 'user', content: userMessageContentForApi }];
      const requestParams = { ...buildOpenRouterParams(), messages: messagesForApi };

      try {
        const response = await fetch(currentChatSettings.openRouterProxyUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestParams),
        });

        if (!response.ok || !response.body) {
          const errorText = await response.text();
          addMessage(chat.id, {
            role: 'assistant',
            content: `APIエラー: ${response.status} ${errorText || '不明なエラー'}`,
          });
          setIsLoading(false);
          setSelectedImage(null);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantResponseId = generateUuid();
        let assistantContent = '';
        
        addMessage(chat.id, {
          id: assistantResponseId,
          role: 'assistant',
          content: '', 
        });

        let streamEndedByDone = false;
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            streamEndedByDone = true;
            break;
          }
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(line => line.trim() !== '');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.substring(6);
              if (jsonStr === '[DONE]') {
                streamEndedByDone = true;
                break; 
              }
              try {
                const parsed = JSON.parse(jsonStr);
                if (parsed.choices && parsed.choices[0]?.delta?.content) {
                  assistantContent += parsed.choices[0].delta.content;
                  replaceMessage(chat.id, assistantResponseId, {
                    role: 'assistant',
                    content: assistantContent,
                  });
                }
              } catch (e) {
                console.error('ストリームデータのパースエラー:', e, jsonStr);
              }
            }
          }
          if (streamEndedByDone) break;
        }
        
        if (assistantContent.trim() === '') {
          replaceMessage(chat.id, assistantResponseId, {
            role: 'assistant',
            content: streamEndedByDone ? 'AIからの応答がありませんでした。' : 'AIとの接続が途中で切れました。',
          });
        }

      } catch (error: any) {
        console.error('メッセージ送信エラー(画像付き):', error);
        addMessage(chat.id, {
          role: 'assistant',
          content: `エラーが発生しました: ${error.message || 'Unknown error'}`,
        });
      }

      setInput('');
      setSelectedImage(null);
      setIsLoading(false);

    } else if (trimmedInput) { // テキストのみの場合
      setIsLoading(true);
      const userMessage = {
        id: generateUuid(),
        role: 'user' as const,
        content: trimmedInput,
      };
      addMessage(chat.id, userMessage);

      const history = chat.messages
        .filter((msg: Message) => msg.role === 'user' || msg.role === 'assistant')
        .slice(-MAX_HISTORY_LENGTH)
        .map((msg: Message) => ({
          role: msg.role,
          content: msg.content
        }));
      
      const messagesForApi = [...history, { role: 'user', content: trimmedInput }];
      const requestParams = { ...buildOpenRouterParams(), messages: messagesForApi };

      try {
        const response = await fetch(currentChatSettings.openRouterProxyUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestParams),
        });

        if (!response.ok || !response.body) {
          const errorText = await response.text();
           addMessage(chat.id, {
            role: 'assistant',
            content: `APIエラー: ${response.status} ${errorText || '不明なエラー'}`,
          });
          setIsLoading(false);
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantResponseId = generateUuid();
        let assistantContent = '';
        
        addMessage(chat.id, {
          id: assistantResponseId,
          role: 'assistant',
          content: '', 
        });

        let streamEndedByDone = false;
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            streamEndedByDone = true;
            break;
          }
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(line => line.trim() !== '');
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.substring(6);
              if (jsonStr === '[DONE]') {
                streamEndedByDone = true;
                break;
              }
              try {
                const parsed = JSON.parse(jsonStr);
                if (parsed.choices && parsed.choices[0]?.delta?.content) {
                  assistantContent += parsed.choices[0].delta.content;
                  replaceMessage(chat.id, assistantResponseId, {
                    role: 'assistant',
                    content: assistantContent,
                  });
                }
              } catch (e) {
                console.error('ストリームデータのパースエラー:', e, jsonStr);
              }
            }
          }
          if (streamEndedByDone) break;
        }
        
        if (assistantContent.trim() === '') {
          replaceMessage(chat.id, assistantResponseId, {
            role: 'assistant',
            content: streamEndedByDone ? 'AIからの応答がありませんでした。' : 'AIとの接続が途中で切れました。',
          });
        }

      } catch (error: any) {
        console.error('メッセージ送信エラー:', error);
        addMessage(chat.id, {
          role: 'assistant',
          content: `エラー: ${error.message || 'Unknown error'}`,
        });
      }
      setIsLoading(false);
    }
  };

  // トグルで画像オプションの表示/非表示を切り替える
  const handleToggleImageOptions = () => {
    setShowImageOptions(!showImageOptions);
  };

  // 画像生成完了時の処理
  const handleImageGenerated = (imageUrl: string, promptText: string, operation: 'text-to-image' | 'image-to-image' | 'upscaler') => {
    if (!chat) return;

    // 操作タイプをログに出力
    if (__DEV__) console.log(`Image generated with operation: ${operation}`);

    // 操作タイプに応じたメッセージを作成
    const operationMessages = {
      'text-to-image': 'テキストから画像を生成しました',
      'image-to-image': '画像から画像を変換しました', 
      'upscaler': '画像をアップスケールしました'
    };

    // 画像をアシスタントからの返信として追加
    addImageMessage(chat.id, {
      content: operationMessages[operation],
      imageUrl,
      role: 'assistant'
    });

    // 生成完了ステータスを更新
    setIsGenerating(false);
    
    // 反転FlatListでは自動的に最新メッセージが表示されるのでスクロール不要
  };

  // 画像プレビュー表示
  const handleImagePress = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowImagePreview(true);
  };
  
  // メッセージ長押し時の処理
  const handleMessageLongPress = (message: Message) => {
    selectMessage(message.id);
    setShowMessageActions(true);
  };
  
  // メッセージアクション閉じる
  const handleMessageActionsDismiss = () => {
    setShowMessageActions(false);
    clearSelectedMessage();
  };

  const handleModelSelect = () => {
    setShowModelSelect(true);
  };
  
  const handleSelectModel = (modelId: string) => {
    const model = MODELS.find(m => m.id === modelId);
    
    if (!model) return;
    
    if (model.isLocal && localModelStatus !== 'ready') {
      setSelectedModelId(modelId);
      setShowLocalModelInstall(true);
      return;
    }
    
    if (model.isPremium && plan === 'free') {
      Alert.alert(
        'プレミアムモデル',
        `このモデルを使用するには、${model.tier === 1 ? 'Lite' : 'Premium'}プランへのアップグレードが必要です。`,
        [
          { text: 'キャンセル', style: 'cancel' },
          { 
            text: 'アップグレード', 
            onPress: () => {
              router.push('/settings/subscription');
            }
          }
        ]
      );
      return;
    }
    
    // 現在のモデルと同じ場合は更新しない（無駄なレンダリング防止）
    if (chat && chat.modelId !== modelId) {
      updateChatModel(chat.id, modelId);
    }
  };
  
  const handleToggleEditTitle = () => {
    if (chat) {
      setEditTitle(chat.title);
      setIsEditingTitle(!isEditingTitle);
    }
  };

  const handleSaveTitle = () => {
    if (chat && editTitle.trim()) {
      updateChatTitle(chat.id, editTitle);
      setIsEditingTitle(false);
    }
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.primary,
      paddingTop: theme.safeArea.top,
      paddingBottom: 12,
      paddingHorizontal: 16,
      height: 60 + theme.safeArea.top,
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
      paddingVertical: 2,
    },
    keyboardAvoidingContainer: {
      flex: 1,
    },
    messageList: {
      padding: 16,
      paddingBottom: 8,
    },
    messageContainer: {
      marginBottom: 16,
      flexDirection: 'row',
    },
    userMessageContainer: {
      justifyContent: 'flex-end',
    },
    assistantMessageContainer: {
      justifyContent: 'flex-start',
    },
    messageBubble: {
      maxWidth: '80%',
      padding: 12,
      borderRadius: 16,
    },
    userMessageBubble: {
      backgroundColor: colors.primary,
      borderBottomRightRadius: 4,
    },
    assistantMessageBubble: {
      backgroundColor: colors.card,
      borderBottomLeftRadius: 4,
    },
    messageText: {
      fontSize: 16,
      lineHeight: 22,
    },
    userMessageText: {
      color: colors.textOnPrimary,
    },
    assistantMessageText: {
      color: colors.text,
    },
    inputContainer: {
      padding: 12,
      paddingBottom: Platform.OS === 'ios' ? 8 : 12,
      backgroundColor: colors.background,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 8,
    },
    inputTopRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 8,
    },
    inputButtonsContainer: {
      flexDirection: 'column',
      gap: 6,
      marginRight: 8,
    },
    inputButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    input: {
      flex: 1,
      maxHeight: 120,
      minHeight: 44,
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: colors.lightGray,
      borderRadius: 22,
      color: colors.text,
      fontSize: 16,
      lineHeight: 20,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sendButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    loadingButton: {
      backgroundColor: colors.primary,
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 8,
    },
    modelButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 16,
      maxWidth: 120,
      width: 'auto',
    },
    modelButtonText: {
      color: colors.textOnPrimary,
      marginRight: 4,
      fontSize: 12,
      maxWidth: 80,
    },
    titleTouchable: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 40,
    },
    titleEditIcon: {
      marginLeft: 6,
      marginRight: 6,
    },
    editTitleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 8,
      backgroundColor: colors.card,
      borderBottomWidth: 1,
      borderBottomColor: colors.lightGray,
    },
    titleInput: {
      flex: 1,
      padding: 8,
      fontSize: 16,
      color: colors.text,
    },
    titleSaveButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      backgroundColor: colors.primary,
      borderRadius: 4,
      marginLeft: 8,
    },
    titleSaveText: {
      color: colors.textOnPrimary,
      fontWeight: '500',
    },
    messagesContainer: {
      padding: 16,
      paddingBottom: 32,
      flexGrow: 1,
      justifyContent: 'flex-end',
    },
    imagePanelModal: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    imagePreviewModal: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.9)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    imagePreview: {
      width: '90%',
      height: '70%',
      borderRadius: 8,
    },
    closeButton: {
      position: 'absolute',
      top: 40,
      right: 20,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    partialCopyModalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    partialCopyModalContent: {
      width: '90%',
      maxHeight: '80%',
      backgroundColor: colors.card,
      borderRadius: 16,
      padding: 16,
      elevation: 5,
      shadowColor: "#000",
      shadowOffset: {
        width: 0,
        height: 2
      },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
    },
    partialCopyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    partialCopyTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    partialCopyScrollView: {
      maxHeight: 300,
    },
    partialCopyInput: {
      backgroundColor: colors.background,
      padding: 16,
      borderRadius: 8,
      color: colors.text,
      minHeight: 150,
      textAlignVertical: 'top',
    },
    partialCopyButtonContainer: {
      marginTop: 16,
      alignItems: 'center',
    },
    partialCopyButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 24,
      alignItems: 'center',
      justifyContent: 'center',
    },
    partialCopyButtonDisabled: {
      opacity: 0.5,
    },
    partialCopyButtonText: {
      color: colors.textOnPrimary,
      fontSize: 16,
      fontWeight: '600',
    },
    featureOptionsContainer: {
      backgroundColor: colors.background,
      paddingHorizontal: 8,
      paddingVertical: 6,
      marginTop: 8,
    },
    featureOptionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    featureOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: colors.lightGray,
      borderWidth: 1,
      borderColor: colors.border,
    },
    featureOptionActive: {
      backgroundColor: colors.primary + '20',
      borderColor: colors.primary,
    },
    featureOptionText: {
      fontSize: 12,
      color: colors.text,
      marginLeft: 4,
      fontWeight: '500',
    },
    featureOptionTextActive: {
      color: colors.primary,
    },
    selectedImageContainer: {
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    selectedImagePreview: {
      flexDirection: 'row',
      alignItems: 'center',
      position: 'relative',
    },
    selectedImageThumbnail: {
      width: 60,
      height: 60,
      borderRadius: 8,
      marginRight: 12,
    },
    removeImageButton: {
      position: 'absolute',
      top: -8,
      right: -8,
      backgroundColor: colors.background,
      borderRadius: 10,
    },
    selectedImageText: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
    },
  }), [colors, theme.safeArea.top]);
  
  const renderMessage = ({ item }: { item: Message }) => {
    const isImage = !!item.imageUrl;
    const ref = React.createRef<any>();
    return (
      <ChatBubble 
        ref={ref}
        message={item} 
        onImagePress={handleImagePress}
        onLongPress={() => openBalloonMenu(ref.current, item, isImage)}
      />
    );
  };
  
  // スクロールの高さがコンテンツ高さより小さい場合は、自動スクロールを行わない
  const handleContentSizeChange = () => {
    if (!chat || chat.messages.length === 0) return;
    
    // 新規チャットや最初のメッセージが追加されたときは強制的にスクロール
    if (chat.messages.length <= 3) {
      flatListRef.current?.scrollToOffset({ offset: 0, animated: false });
    }
  };

  if (!chat) {
    return (
      <View style={styles.container}>
        <Text style={{ color: colors.text }}>Chat not found</Text>
      </View>
    );
  }
  
  const ModelSelectButton = () => {
    const modelToDisplay = currentModel || MODELS[0]; // undefinedチェック
    return (
      <TouchableOpacity
        style={styles.modelButton}
        onPress={handleModelSelect}
      >
        <Text style={styles.modelButtonText} numberOfLines={1} ellipsizeMode="tail">
          {modelToDisplay.name}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textOnPrimary} />
      </TouchableOpacity>
    );
  };
  
  // 画像プレビュー用アクションハンドラ
  const handleImageAction = async (action: 'copy' | 'note' | 'partial_copy' | 'save' | 'share', imageUrl: string, prompt: string) => {
    try {
      if (action === 'copy') {
        await Clipboard.setStringAsync(prompt + '\n' + imageUrl);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setLocalCentralToastMsg('コピーしました');
        setShowLocalCentralToast(true);
        if (localCentralToastTimer.current) clearTimeout(localCentralToastTimer.current);
        localCentralToastTimer.current = setTimeout(() => setShowLocalCentralToast(false), 1500);
      } else if (action === 'note') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast('ノート保存機能は将来的に実装されます', true);
      } else if (action === 'save') {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          showToast('写真へのアクセス権限が必要です');
          return;
        }
        
        let localUri = imageUrl;
        let tempFile = false;
        
        try {
        if (imageUrl.startsWith('http')) {
          const filename = `temp_${Date.now()}.jpg`;
          localUri = `${FileSystem.cacheDirectory}${filename}`;
            const { uri } = await FileSystem.downloadAsync(imageUrl, localUri);
            localUri = uri;
            tempFile = true;
          }
          
        const asset = await MediaLibrary.createAssetAsync(localUri);
          try {
        await MediaLibrary.createAlbumAsync('AI Chat', asset, false);
          } catch (error: any) {
            // アルバムがすでに存在する場合は無視
            if (!error.message?.includes('E_ALBUM_EXISTS')) {
              throw error;
            }
            // 既存のアルバムにアセットを追加
            const albums = await MediaLibrary.getAlbumsAsync();
            const aiChatAlbum = albums.find(a => a.title === 'AI Chat');
            if (aiChatAlbum) {
              await MediaLibrary.addAssetsToAlbumAsync([asset], aiChatAlbum, false);
            }
          }
          
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setLocalCentralToastMsg('保存しました');
        setShowLocalCentralToast(true);
        if (localCentralToastTimer.current) clearTimeout(localCentralToastTimer.current);
        localCentralToastTimer.current = setTimeout(() => setShowLocalCentralToast(false), 1500);
        } finally {
          // 一時ファイルのクリーンアップ
          if (tempFile && localUri) {
            try {
              await FileSystem.deleteAsync(localUri, { idempotent: true });
            } catch (e) {
              console.warn('一時ファイルの削除に失敗:', e);
            }
          }
        }
      } else if (action === 'share') {
        if (!(await Sharing.isAvailableAsync())) {
          showToast('共有機能が利用できません');
          return;
        }
        
          setIsSharing(true);
          let localUri = imageUrl;
        let tempFile = false;
        
        try {
          if (imageUrl.startsWith('http')) {
            const filename = `temp_share_${Date.now()}.jpg`;
            localUri = `${FileSystem.cacheDirectory}${filename}`;
            const { uri } = await FileSystem.downloadAsync(imageUrl, localUri);
            localUri = uri;
            tempFile = true;
            }
          
          await Sharing.shareAsync(localUri, {
            mimeType: 'image/jpeg',
            dialogTitle: 'AIチャットの画像を共有',
          });
          
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } finally {
          setIsSharing(false);
          // 一時ファイルのクリーンアップ
          if (tempFile && localUri) {
            try {
              await FileSystem.deleteAsync(localUri, { idempotent: true });
            } catch (e) {
              console.warn('一時ファイルの削除に失敗:', e);
            }
          }
        }
      }
    } catch (error) {
      showToast('処理に失敗しました');
      console.error('画像アクションエラー:', error);
    } finally {
      if (action === 'share') {
        setIsSharing(false);
      }
    }
  };

  // バルーンメニューを開く
  const openBalloonMenu = (ref: any, message: Message, isImage: boolean) => {
    if (!ref) return;
    ref.measureInWindow((x: number, y: number, width: number, height: number) => {
      setBalloonMenuPos({ x, y, width, height });
      setBalloonTargetMsg(message);
      // ダークモード判定
      const colorScheme = Appearance.getColorScheme();
      setBalloonMenuDark(colorScheme === 'dark');
      // アクションリスト生成
      const actions: BalloonAction[] = [
        {
          key: 'copy',
          label: 'コピー',
          icon: 'copy-outline' as const,
          onPress: () => handleBalloonAction('copy', message, isImage),
        },
        // テキストメッセージのみ部分コピーオプションを追加
        ...(isImage ? [] : [
          {
            key: 'partial_copy',
            label: '部分コピー',
            icon: 'text-outline' as const,
            onPress: () => handleBalloonAction('partial_copy', message, isImage),
          }
        ]),
        {
          key: 'note',
          label: 'ノート',
          icon: 'document-text-outline' as const,
          onPress: () => handleBalloonAction('note', message, isImage),
        },
        // 画像メッセージなら写真保存オプションを追加
        ...(isImage ? [
          {
            key: 'save',
            label: '写真に保存',
            icon: 'download-outline' as const,
            onPress: () => handleBalloonAction('save', message, isImage),
          },
        ] : []),
        // 共有オプションを追加（画像とテキスト両方）
        {
          key: 'share',
          label: '共有',
          icon: 'share-social-outline' as const,
          onPress: () => handleBalloonAction('share', message, isImage),
        },
      ];
      setBalloonMenuActions(actions);
      setBalloonMenuVisible(true);
    });
  };

  // バルーンアクション実行
  const handleBalloonAction = async (action: 'copy' | 'note' | 'partial_copy' | 'save' | 'share', message: Message, isImage: boolean) => {
    setBalloonMenuVisible(false);
    // 既存のMessageActions/handleImageActionのロジックを流用
    if (isImage && message.imageUrl) {
      await handleImageAction(action, message.imageUrl, message.content);
    } else {
      // テキストメッセージ
      if (action === 'copy') {
        await Clipboard.setStringAsync(message.content);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setLocalCentralToastMsg('コピーしました');
        setShowLocalCentralToast(true);
        if (localCentralToastTimer.current) clearTimeout(localCentralToastTimer.current);
        localCentralToastTimer.current = setTimeout(() => setShowLocalCentralToast(false), 1500);
      } else if (action === 'partial_copy') {
        // 部分コピーの処理
        setSelectedTextContent(message.content);
        setShowPartialCopyModal(true);
        Keyboard.dismiss(); // キーボードを閉じる
      } else if (action === 'note') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        showToast('ノート保存機能は将来的に実装されます', true);
      } else if (action === 'share') {
        // テキスト共有処理
        try {
          setIsSharing(true);
          await Share.share({
            message: message.content,
            title: 'AIチャットの会話',
          });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (error) {
          console.error('共有エラー:', error);
          showToast('共有に失敗しました');
        } finally {
          setIsSharing(false);
        }
      }
    }
  };

  // 部分コピー確定
  const handlePartialCopyConfirm = async () => {
    if (selectedText) {
      await Clipboard.setStringAsync(selectedText);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setLocalCentralToastMsg('選択部分をコピーしました');
      setShowLocalCentralToast(true);
      if (localCentralToastTimer.current) clearTimeout(localCentralToastTimer.current);
      localCentralToastTimer.current = setTimeout(() => setShowLocalCentralToast(false), 1500);
    }
    setShowPartialCopyModal(false);
    setSelectedText('');
  };

  // 部分コピーキャンセル
  const handlePartialCopyCancel = () => {
    setShowPartialCopyModal(false);
    setSelectedText('');
  };
  
  // マルチモーダル機能の切り替え
  const toggleFeature = (feature: string) => {
    const newFeatures = new Set(enabledFeatures);
    if (newFeatures.has(feature)) {
      newFeatures.delete(feature);
    } else {
      newFeatures.add(feature);
    }
    setEnabledFeatures(newFeatures);
  };
  
  // 現在のモデルの利用可能機能を取得
  const getAvailableFeatures = () => {
    if (!chat) return {};
    const currentModel = MODELS.find(model => model.id === chat.modelId);
    return currentModel?.features || {};
  };

  // マルチモーダル機能オプションのレンダリング
  const renderFeatureOptions = () => {
    const availableFeatures = getAvailableFeatures();
    const hasAnyFeatures = Object.values(availableFeatures).some(Boolean);
    
    // 画像認識機能も常に表示
    const showImageVision = !!(currentModel?.features?.vision);
    
    if (!hasAnyFeatures && !showImageVision) return null;

    // 型安全なfeatureIconsとfeatureLabels
    const featureIcons: Record<string, string> = {
      search: 'search',
      reasoning: 'bulb',
      vision: 'camera',
      audio: 'mic',
      documents: 'document-text'
    };

    const featureLabels: Record<string, string> = {
      search: 'Web検索',
      reasoning: '推論モード',
      vision: '画像認識',
      audio: '音声認識',
      documents: 'ドキュメント'
    };

    return (
      <View style={styles.featureOptionsContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.featureOptionsRow}>
            {/* 画像認識機能（Vision対応モデルの場合） */}
            {showImageVision && (
              <TouchableOpacity
                style={[styles.featureOption]}
                onPress={pickImage}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name="camera" 
                  size={14} 
                  color={colors.text} 
                />
                <Text style={styles.featureOptionText}>
                  画像認識
                </Text>
              </TouchableOpacity>
            )}
            
            {Object.entries(availableFeatures).map(([feature, isAvailable]) => {
              if (!isAvailable || feature === 'vision') return null; // visionは除外（画像認識は別途処理）
              
              const isActive = enabledFeatures.has(feature);
              
              return (
                <TouchableOpacity
                  key={feature}
                  style={[
                    styles.featureOption,
                    isActive && styles.featureOptionActive
                  ]}
                  onPress={() => toggleFeature(feature)}
                  activeOpacity={0.7}
                >
                  <Ionicons 
                    name={(featureIcons[feature as keyof typeof featureIcons] || 'help') as any} 
                    size={14} 
                    color={isActive ? colors.primary : colors.text} 
                  />
                  <Text style={[
                    styles.featureOptionText,
                    isActive && styles.featureOptionTextActive
                  ]}>
                    {featureLabels[feature as keyof typeof featureLabels] || feature}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>
    );
  };

  // 画像選択処理
  const pickImage = async () => {
    // chatとcurrentModelの存在を再確認
    if (!chat || !currentModel) {
      showToast('チャットまたはモデル情報が見つかりません。');
      return;
    }
    if (!currentModel.features?.vision) { // 安全なアクセスに変更
      showToast('このモデルは画像入力に対応していません。');
      return;
    }
    // No permissions request is necessary for launching the image library
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.7, // 品質を少し下げることでBase64文字列のサイズを抑える
      base64: true, // Base64で画像データを取得
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      if (result.assets[0].base64) {
        // Base64文字列が大きすぎる場合の警告（例: 5MB以上など）
        const fileSizeMB = result.assets[0].base64.length * 0.75 / (1024 * 1024); // 概算
        if (fileSizeMB > 4.5) { // OpenRouterの画像入力上限は5MB程度
          showToast('画像サイズが大きすぎます。5MB未満の画像を選択してください。');
          setSelectedImage(null);
          return;
        }
        setSelectedImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
        showToast('画像が選択されました。説明文を入力して送信してください。');
        setInput(''); // 画像選択後はテキスト入力をクリアする（UI/UXによる）
      } else {
        setSelectedImage(result.assets[0].uri); // Base64が取得できない場合はURIを保持（送信時の処理が必要）
         showToast('画像が選択されました。(Base64取得失敗)');
      }
    }
  };

  return (
    <MessageActionsProvider>
      <View style={styles.container}>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />
        
        <Header
          title={chat?.title || 'チャット'}
          showBack={true}
          onTitleEdit={handleToggleEditTitle}
          onBackPress={() => router.replace('/(tabs)/chats')}
          rightComponent={<ModelSelectButton />}
        />
        
        <KeyboardAvoidingView 
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          {chat && (
            <>
              {isEditingTitle && (
                <View style={styles.editTitleContainer}>
                  <TextInput
                    style={styles.titleInput}
                    value={editTitle}
                    onChangeText={setEditTitle}
                    placeholder="チャットのタイトルを入力"
                    placeholderTextColor={colors.gray}
                    autoFocus
                  />
                  <TouchableOpacity 
                    style={styles.titleSaveButton} 
                    onPress={handleSaveTitle}
                  >
                    <Text style={styles.titleSaveText}>保存</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* チャットメッセージリスト */}
              <FlatList
                ref={flatListRef}
                data={[...chat.messages].reverse()} // メッセージの順序を逆にする
                keyExtractor={(item) => item.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.messagesContainer}
                inverted={true} // FlatListを反転
                onContentSizeChange={handleContentSizeChange}
              />
            
              <View>
                <View style={styles.inputContainer}>
                  {/* 上段：入力欄・画像生成・送信ボタン */}
                  <View style={styles.inputTopRow}>
                    <TextInput
                      style={styles.input}
                      placeholder={
                        selectedImage ? "画像の説明を入力 (任意)" 
                        : showImageOptions ? "画像生成プロンプトを入力..." 
                        : "メッセージを入力"
                      }
                      placeholderTextColor={colors.gray}
                      value={input}
                      onChangeText={setInput}
                      multiline
                    />
                    
                    <TouchableOpacity 
                      style={[
                        styles.inputButton,
                        showImageOptions ? { backgroundColor: colors.accentBlue } : undefined
                      ]}
                      onPress={handleToggleImageOptions}
                    >
                      <Ionicons 
                        name="image-outline" 
                        size={20} 
                        color="#fff" 
                      />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[
                        styles.sendButton,
                        (showImageOptions && isGenerating && { opacity: 0.5 }) ||
                        (selectedImage && isLoading && {opacity: 0.5 }) // 画像送信中も非活性
                      ]} 
                      onPress={handleSend}
                      disabled={
                        (showImageOptions && isGenerating) || 
                        (!showImageOptions && !selectedImage && (!input.trim() || isLoading)) ||
                        (!!selectedImage && isLoading) // selectedImageの存在をbooleanにキャスト
                      }
                    >
                      {isLoading || isGenerating ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Ionicons 
                          name={showImageOptions ? "image" : (selectedImage ? "send-outline" : "send")}
                          size={20} 
                          color="#fff" 
                        />
                      )}
                    </TouchableOpacity>
                  </View>
                  
                  {/* 下段：マルチモーダル機能オプション */}
                  {renderFeatureOptions()}
                </View>
                
                {/* 選択された画像のプレビュー */}
                {selectedImage && (
                  <View style={styles.selectedImageContainer}>
                    <View style={styles.selectedImagePreview}>
                      <Image 
                        source={{ uri: selectedImage }} 
                        style={styles.selectedImageThumbnail}
                        contentFit="cover"
                      />
                      <TouchableOpacity 
                        style={styles.removeImageButton}
                        onPress={() => setSelectedImage(null)}
                      >
                        <Ionicons name="close-circle" size={20} color={colors.error} />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.selectedImageText}>画像が選択されました</Text>
                  </View>
                )}
                
                {/* 画像生成オプション - 入力欄の下に配置 */}
                {showImageOptions && (
                  <ImageGenerationPanel
                    ref={imageGenPanelRef}
                    prompt={input}
                    onImageGenerated={handleImageGenerated}
                    onClose={() => setShowImageOptions(false)}
                  />
                )}
              </View>
            </>
          )}
        </KeyboardAvoidingView>
        
        <ModelSelectModal
          visible={showModelSelect}
          onClose={() => setShowModelSelect(false)}
          onSelectModel={handleSelectModel}
          currentModelId={chat?.modelId || 'gpt-3.5-turbo'}
        />
        
        <LocalModelInstallModal
          visible={showLocalModelInstall}
          onClose={() => setShowLocalModelInstall(false)}
        />

        {/* 画像プレビュー */}
        <Modal
          visible={showImagePreview}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowImagePreview(false)}
        >
          <Pressable 
            style={styles.imagePreviewModal}
            onPress={() => setShowImagePreview(false)}
          >
            {selectedImage && (
              <Image
                source={{ uri: selectedImage }}
                style={styles.imagePreview}
                contentFit="contain"
              />
            )}
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowImagePreview(false)}
            >
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            {/* アクションバー */}
            {selectedImage && (
              <View style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: 'rgba(0,0,0,0.7)',
                flexDirection: 'row',
                justifyContent: 'space-around',
                alignItems: 'center',
                paddingVertical: 16,
                paddingHorizontal: 8,
              }}>
                <TouchableOpacity onPress={() => handleImageAction('copy', selectedImage, chat?.messages.find(m => m.imageUrl === selectedImage)?.content || '')}>
                  <Ionicons name="copy-outline" size={28} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 12, textAlign: 'center' }}>コピー</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleImageAction('note', selectedImage, chat?.messages.find(m => m.imageUrl === selectedImage)?.content || '')}>
                  <Ionicons name="document-text-outline" size={28} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 12, textAlign: 'center' }}>ノート</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleImageAction('save', selectedImage, chat?.messages.find(m => m.imageUrl === selectedImage)?.content || '')}>
                  <Ionicons name="download-outline" size={28} color="#fff" />
                  <Text style={{ color: '#fff', fontSize: 12, textAlign: 'center' }}>写真に保存</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => handleImageAction('share', selectedImage, chat?.messages.find(m => m.imageUrl === selectedImage)?.content || '')}
                  disabled={isSharing}
                >
                  {isSharing ? (
                    <ActivityIndicator size="small" color="#fff" style={{width: 28, height: 28}} />
                  ) : (
                    <Ionicons name="share-social-outline" size={28} color="#fff" />
                  )}
                  <Text style={{ color: '#fff', fontSize: 12, textAlign: 'center' }}>共有</Text>
                </TouchableOpacity>
              </View>
            )}
            {/* 画像プレビューモーダル専用のローカル中央トースト */}
            {showLocalCentralToast && (
              <View style={{
                position: 'absolute', // Modal内で中央に配置するため
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
                // zIndex は Modal 内部での重なりなので、大きな値は不要な場合が多い
                // ただし、他のモーダル内要素との兼ね合いで調整が必要な場合がある
              }}>
                <View style={{
                  padding: 24,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: 180,
                  maxWidth: '80%',
                  backgroundColor: 'rgba(0,0,0,0.8)',
                }}>
                  <Ionicons name="checkmark-circle-outline" size={64} color="#4CAF50" />
                  <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', marginTop: 16, textAlign: 'center' }}>{localCentralToastMsg}</Text>
                </View>
              </View>
            )}
          </Pressable>
        </Modal>

        {/* メッセージアクション */}
        {showMessageActions && selectedMessageId && chat && (
          <MessageActions
            messageId={selectedMessageId}
            messageType={chat.messages.find(m => m.id === selectedMessageId)?.imageUrl ? 'image' : 'text'}
            content={chat.messages.find(m => m.id === selectedMessageId)?.content || ''}
            imageUri={chat.messages.find(m => m.id === selectedMessageId)?.imageUrl}
            onDismiss={handleMessageActionsDismiss}
          />
        )}

        {/* BalloonActionMenu */}
        <BalloonActionMenu
          visible={balloonMenuVisible}
          x={balloonMenuPos.x}
          y={balloonMenuPos.y}
          width={balloonMenuPos.width}
          height={balloonMenuPos.height}
          actions={balloonMenuActions}
          onRequestClose={() => setBalloonMenuVisible(false)}
          isDarkMode={balloonMenuDark}
        />
        
        {/* 画面全体に表示するローカル中央トースト */}
        {showLocalCentralToast && !showImagePreview && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000, // 他の要素よりも上に表示
            pointerEvents: 'none', // タッチイベントを下層に通過させる
          }}>
            <View style={{
              padding: 24,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: 180,
              maxWidth: '80%',
              backgroundColor: 'rgba(0,0,0,0.8)',
            }}>
              <Ionicons name="checkmark-circle-outline" size={64} color="#4CAF50" />
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', marginTop: 16, textAlign: 'center' }}>{localCentralToastMsg}</Text>
            </View>
          </View>
        )}

        {/* 部分コピー用モーダル */}
        <Modal
          visible={showPartialCopyModal}
          animationType="fade"
          transparent={true}
          onRequestClose={handlePartialCopyCancel}
        >
          <View style={styles.partialCopyModalContainer}>
            <View style={styles.partialCopyModalContent}>
              <View style={styles.partialCopyHeader}>
                <Text style={styles.partialCopyTitle}>テキスト選択</Text>
                <TouchableOpacity onPress={handlePartialCopyCancel}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.partialCopyScrollView}>
                <TextInput
                  style={styles.partialCopyInput}
                  multiline
                  value={selectedTextContent}
                  onSelectionChange={(event) => {
                    const { selection } = event.nativeEvent;
                    if (selection.start !== selection.end) {
                      setSelectedText(
                        selectedTextContent.substring(selection.start, selection.end)
                      );
                    } else {
                      setSelectedText('');
                    }
                  }}
                  autoFocus
                  keyboardType="default"
                  autoCorrect={false}
                />
              </ScrollView>

              <View style={styles.partialCopyButtonContainer}>
                <TouchableOpacity 
                  style={[
                    styles.partialCopyButton, 
                    !selectedText && styles.partialCopyButtonDisabled
                  ]}
                  onPress={handlePartialCopyConfirm}
                  disabled={!selectedText}
                >
                  <Text style={styles.partialCopyButtonText}>
                    選択部分をコピー
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </MessageActionsProvider>
  );
}
