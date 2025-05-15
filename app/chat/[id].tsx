import React, { useState, useEffect, useRef } from 'react';
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
  Modal
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
import ModelSelectModal from '../components/ModelSelectModal';
import LocalModelInstallModal from '../components/LocalModelInstallModal';
import Header from '../components/Header';
import ChatBubble from '../components/ChatBubble';
import { ImageGenerationPanel } from '../components/ImageGenerationPanel';

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showModelSelect, setShowModelSelect] = useState(false);
  const [showLocalModelInstall, setShowLocalModelInstall] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [showImagePanel, setShowImagePanel] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImagePreview, setShowImagePreview] = useState(false);
  
  const colors = useColors();
  const chats = useStore(state => state.chats);
  const addMessage = useStore(state => state.addMessage);
  const addImageMessage = useStore(state => state.addImageMessage);
  const markChatAsRead = useStore(state => state.markChatAsRead);
  const updateChatTitle = useStore(state => state.updateChatTitle);
  const updateChatModel = useStore(state => state.updateChatModel);
  const localModelStatus = useStore(state => state.localModelStatus);
  const plan = useStore(state => state.plan);
  
  const chat = chats.find(c => c.id === id);
  const flatListRef = useRef<FlatList>(null);
  
  useEffect(() => {
    if (chat) {
      console.log('====== CHAT STATE ======');
      console.log('Chat ID:', chat.id);
      console.log('Messages:', chat.messages.length);
      if (chat.messages.length > 0) {
        const lastMsg = chat.messages[chat.messages.length - 1];
        console.log('Last message:', lastMsg.role, lastMsg.content.substring(0, 30));
      }
      console.log('=======================');
    }
  }, [chat?.messages.length]);
  
  useEffect(() => {
    if (chat) {
      markChatAsRead(chat.id);
    }
  }, [chat?.id, markChatAsRead]);
  
  useEffect(() => {
    if (isLoading || !chat) return;
      
    // 最新のユーザーメッセージと応答状態を確認
    const messages = chat.messages;
    const userMessages = messages.filter(m => m.role === 'user');
    
    if (userMessages.length === 0) return;
    
    // 最後のユーザーメッセージに対する応答があるか確認
    const lastUserMessageIndex = messages.lastIndexOf(userMessages[userMessages.length - 1]);
    const hasAssistantResponseAfterLastUser = messages
      .slice(lastUserMessageIndex + 1)
      .some(m => m.role === 'assistant');
    
    // 最後のユーザーメッセージに対する応答がない場合のみAPIリクエスト
    if (!hasAssistantResponseAfterLastUser) {
      console.log('新しいユーザーメッセージに対する応答を生成します');
      
      const lastUserMessage = userMessages[userMessages.length - 1];
          
      const apiMessages: ApiChatMessage[] = chat.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));
      
      (async () => {
        setIsLoading(true);
        try {
          const responseContent = await fetchChatCompletion(
            apiMessages,
            chat.modelId
          );
          
          addMessage(chat.id, {
            role: 'assistant',
            content: responseContent,
          });
          
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);
        } catch (error) {
          console.error('Error in auto API request:', error);
          
          addMessage(chat.id, {
            role: 'assistant',
            content: 'エラーが発生しました。もう一度お試しください。',
          });
        } finally {
          setIsLoading(false);
        }
      })();
    }
  }, [chat?.id, isLoading]);
  
  const handleSend = async () => {
    if (!input.trim() || !chat) return;
    
    const trimmedInput = input.trim();
    setInput('');
    
    addMessage(chat.id, {
      role: 'user',
      content: trimmedInput,
    });
    
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
    
    setIsLoading(true);
    
    try {
      console.log('Sending message to API with model:', chat.modelId);
      
      const apiMessages: ApiChatMessage[] = [
        ...chat.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
        })),
        {
        role: 'user',
          content: trimmedInput,
        }
      ];
      
      console.log('Sending API request with model:', chat.modelId);
      
      const responseContent = await fetchChatCompletion(
          apiMessages,
          chat.modelId
        );
        
        console.log('Received API response:', responseContent.substring(0, 50) + '...');
        
      // エラーメッセージまたは正常な応答をアシスタントメッセージとして追加
        addMessage(chat.id, {
          role: 'assistant',
          content: responseContent,
        });
      
      // 最初のメッセージならチャットタイトルを更新
      if (chat.messages.filter(m => m.role === 'user').length === 1) {
        const title = trimmedInput.slice(0, 30) + (trimmedInput.length > 30 ? '...' : '');
        updateChatTitle(chat.id, title);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      addMessage(chat.id, {
        role: 'assistant',
        content: '通信エラーが発生しました。ネットワーク接続を確認して、もう一度お試しください。',
      });
    } finally {
      setIsLoading(false);
      
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 300);
    }
  };

  // 画像生成パネルを表示
  const handleShowImagePanel = () => {
    setShowImagePanel(true);
  };

  // 画像生成完了時の処理
  const handleImageGenerated = (imageUrl: string) => {
    if (!chat) return;

    // 画像メッセージを追加
    addImageMessage(chat.id, {
      content: input.trim() || '画像を生成しました',
      imageUrl,
      role: 'user'
    });

    // 入力欄をクリア
    setInput('');
    
    // パネルを閉じる
    setShowImagePanel(false);

    // スクロール
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // 画像プレビュー表示
  const handleImagePress = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowImagePreview(true);
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
        `このモデルを使用するには、${model.tier === 'lite' ? 'Lite' : 'Heavy'}プランへのアップグレードが必要です。`,
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
      flexDirection: 'row',
      padding: 8,
      alignItems: 'flex-end',
      backgroundColor: colors.card,
      borderTopWidth: 1,
      borderTopColor: colors.lightGray,
    },
    input: {
      flex: 1,
      maxHeight: 120,
      minHeight: 40,
      padding: 12,
      backgroundColor: colors.card,
      borderRadius: 20,
      marginRight: 8,
      color: colors.text,
    },
    sendButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    imageButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 8,
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
  });
  
  const renderMessage = ({ item }: { item: Message }) => {
    return (
      <ChatBubble 
        message={item} 
        onImagePress={handleImagePress}
        onLongPress={() => {
          // TODO: メッセージアクションメニュー表示（修正05で実装予定）
        }}
      />
    );
  };
  
  if (!chat) {
    return (
      <View style={styles.container}>
        <Text style={{ color: colors.text }}>Chat not found</Text>
      </View>
    );
  }
  
  const currentModel = MODELS.find(model => model.id === chat.modelId) || MODELS[0];
  
  const ModelSelectButton = () => {
    return (
      <TouchableOpacity
        style={styles.modelButton}
        onPress={handleModelSelect}
      >
        <Text style={styles.modelButtonText} numberOfLines={1} ellipsizeMode="tail">
          {currentModel.name}
        </Text>
        <Ionicons name="chevron-down" size={16} color={colors.textOnPrimary} />
      </TouchableOpacity>
    );
  };
  
  return (
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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
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

            <FlatList
              ref={flatListRef}
              data={chat.messages}
              keyExtractor={(item, index) => `${item.role}-${index}`}
              renderItem={renderMessage}
              contentContainerStyle={styles.messagesContainer}
            />
          
            <View style={styles.inputContainer}>
              <TouchableOpacity 
                style={styles.imageButton}
                onPress={handleShowImagePanel}
              >
                <Ionicons name="image-outline" size={24} color="#fff" />
              </TouchableOpacity>

              <TextInput
                style={styles.input}
                placeholder="メッセージを入力"
                placeholderTextColor={colors.gray}
                value={input}
                onChangeText={setInput}
                multiline
              />
              <TouchableOpacity 
                style={styles.sendButton} 
                onPress={handleSend}
                disabled={isLoading || !input.trim()}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Ionicons name="send" size={20} color="#fff" />
                )}
              </TouchableOpacity>
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

      {/* 画像生成パネル */}
      <Modal
        visible={showImagePanel}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowImagePanel(false)}
      >
        <View style={styles.imagePanelModal}>
          <View style={{ 
            backgroundColor: colors.background,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            maxHeight: '80%',
          }}>
            <ImageGenerationPanel
              onImageGenerated={handleImageGenerated}
              onClose={() => setShowImagePanel(false)}
            />
          </View>
        </View>
      </Modal>

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
        </Pressable>
      </Modal>
    </View>
  );
}
