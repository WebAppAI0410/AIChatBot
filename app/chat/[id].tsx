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
  StatusBar
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { colors } from '../constants/colors';
import { MODELS } from '../constants/models';
import { fetchChatCompletion, ChatMessage as ApiChatMessage } from '../services/api';
import { Message } from '../store/chatStore';
import ModelSelectModal from '../components/ModelSelectModal';
import LocalModelInstallModal from '../components/LocalModelInstallModal';

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
  
  const chats = useStore(state => state.chats);
  const addMessage = useStore(state => state.addMessage);
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
      
      const hasSystemMessage = apiMessages.some(msg => msg.role === 'system');
      if (!hasSystemMessage) {
        apiMessages.unshift({
          role: 'system',
          content: 'あなたは親切で役立つAIアシスタントです。ユーザーの質問に日本語で簡潔に答えてください。',
        });
      }
      
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
      
      const hasSystemMessage = apiMessages.some(msg => msg.role === 'system');
      if (!hasSystemMessage) {
        apiMessages.unshift({
          role: 'system',
          content: 'あなたは親切で役立つAIアシスタントです。ユーザーの質問に日本語で簡潔に答えてください。',
        });
      }
      
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
  
  const renderMessage = ({ item }: { item: Message }) => {
    const isUser = item.role === 'user';
    
    return (
      <View style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.assistantMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isUser ? styles.userMessageBubble : styles.assistantMessageBubble
        ]}>
          <Text style={[
            styles.messageText,
            isUser ? styles.userMessageText : styles.assistantMessageText
          ]}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };
  
  if (!chat) {
    return (
      <View style={styles.container}>
        <Text>Chat not found</Text>
      </View>
    );
  }
  
  const currentModel = MODELS.find(model => model.id === chat.modelId) || MODELS[0];
  
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
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="chevron-back" size={24} color={colors.background} />
          </TouchableOpacity>
          
          {isEditingTitle ? (
            <View style={styles.editTitleContainer}>
              <TextInput
                style={styles.editTitleInput}
                value={editTitle}
                onChangeText={setEditTitle}
                multiline
                numberOfLines={2}
                maxLength={50}
                autoFocus
                onSubmitEditing={() => {
                  if (editTitle.trim()) {
                    updateChatTitle(chat.id, editTitle.trim());
                    setIsEditingTitle(false);
                  }
                }}
                blurOnSubmit={true}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={styles.titleEditIcon}
                onPress={() => {
                  if (editTitle.trim()) {
                    updateChatTitle(chat.id, editTitle.trim());
                    setIsEditingTitle(false);
                  }
                }}
              >
                <Ionicons name="checkmark" size={22} color={colors.background} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.titleEditIcon}
                onPress={() => setIsEditingTitle(false)}
              >
                <Ionicons name="close" size={22} color={colors.background} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.titleTouchable}
              onPress={() => {
                setEditTitle(chat.title);
                setIsEditingTitle(true);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={styles.headerTitle}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {chat.title}
              </Text>
              <Ionicons name="pencil" size={18} color={colors.background} style={styles.titleEditIcon} />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            onPress={handleModelSelect} 
            style={styles.modelButton}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Text style={styles.modelButtonText}>{currentModel.name}</Text>
            <Ionicons name="chevron-down" size={16} color={colors.background} />
          </TouchableOpacity>
        </View>
        
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        >
          <FlatList
            ref={flatListRef}
            data={chat.messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageList}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            extraData={chat.messages.length}
            removeClippedSubviews={false}
            maxToRenderPerBatch={10}
            windowSize={10}
            initialNumToRender={15}
            scrollEventThrottle={16}
          />
          
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="メッセージを入力..."
              value={input}
              onChangeText={setInput}
              multiline
              editable={!isLoading}
            />
            {isLoading ? (
              <View style={styles.loadingButton}>
                <ActivityIndicator color={colors.background} />
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
                onPress={handleSend}
                disabled={!input.trim()}
              >
                <Ionicons name="send" size={24} color={input.trim() ? colors.background : colors.gray} />
              </TouchableOpacity>
            )}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
      
      {/* Modals */}
      <ModelSelectModal
        visible={showModelSelect}
        onClose={() => setShowModelSelect(false)}
        onSelectModel={handleSelectModel}
        currentModelId={chat.modelId}
      />
      
      <LocalModelInstallModal
        visible={showLocalModelInstall}
        onClose={() => {
          setShowLocalModelInstall(false);
          setSelectedModelId(null);
        }}
      />
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
    backgroundColor: colors.lightGray,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: colors.background,
  },
  assistantMessageText: {
    color: colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: colors.lightGray,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: colors.lightGray,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 120,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: colors.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: colors.lightGray,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  modelButtonText: {
    color: colors.background,
    marginRight: 4,
    fontSize: 14,
    fontWeight: '500',
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
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
  },
  editTitleInput: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    color: colors.background,
    fontSize: 18,
    fontWeight: '600',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginRight: 4,
    maxHeight: 48,
  },
});
