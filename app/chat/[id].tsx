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
  
  const chats = useStore(state => state.chats);
  const addMessage = useStore(state => state.addMessage);
  const markChatAsRead = useStore(state => state.markChatAsRead);
  const updateChatTitle = useStore(state => state.updateChatTitle);
  const localModelStatus = useStore(state => state.localModelStatus);
  const plan = useStore(state => state.plan);
  
  const chat = chats.find(c => c.id === id);
  const flatListRef = useRef<FlatList>(null);
  
  useEffect(() => {
    if (chat) {
      markChatAsRead(chat.id);
      
      const hasUserMessage = chat.messages.some(m => m.role === 'user');
      const hasAssistantResponse = chat.messages.some(m => m.role === 'assistant');
      
      if (hasUserMessage && !hasAssistantResponse && !isLoading) {
        console.log('New chat detected with user message but no assistant response. Sending API request...');
        
        const lastUserMessage = [...chat.messages]
          .filter(m => m.role === 'user')
          .pop();
          
        if (lastUserMessage) {
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
              console.log('Auto-sending API request for new chat with model:', chat.modelId);
              console.log('Messages count:', apiMessages.length);
              
              const responseContent = await fetchChatCompletion(
                apiMessages,
                chat.modelId
              );
              
              console.log('Received auto API response:', responseContent.substring(0, 50) + '...');
              
              if (responseContent.includes('認証エラー') || responseContent.includes('API error')) {
                console.error('API returned an error message:', responseContent);
                throw new Error(responseContent);
              }
              
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
      }
    }
  }, [chat?.id]);
  
  const handleSend = async () => {
    if (!input.trim() || !chat) return;
    
    const userMessage: Omit<Message, 'id' | 'timestamp'> = {
      role: 'user',
      content: input,
    };
    
    addMessage(chat.id, userMessage);
    setInput('');
    
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
    
    setIsLoading(true);
    
    try {
      console.log('Sending message to API with model:', chat.modelId);
      
      const apiMessages: ApiChatMessage[] = chat.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      }));
      
      apiMessages.push({
        role: 'user',
        content: input,
      });
      
      const hasSystemMessage = apiMessages.some(msg => msg.role === 'system');
      if (!hasSystemMessage) {
        apiMessages.unshift({
          role: 'system',
          content: 'あなたは親切で役立つAIアシスタントです。ユーザーの質問に日本語で簡潔に答えてください。',
        });
      }
      
      console.log('Prepared messages count:', apiMessages.length);
      console.log('First message role:', apiMessages[0].role);
      console.log('Last message:', apiMessages[apiMessages.length - 1].content.substring(0, 30));
      
      console.log('Sending API request with model:', chat.modelId);
      
      try {
        let responseContent = await fetchChatCompletion(
          apiMessages,
          chat.modelId
        );
        
        console.log('Received API response:', responseContent.substring(0, 50) + '...');
        
        if (responseContent.includes('認証エラー') || responseContent.includes('API error')) {
          console.error('API returned an error message:', responseContent);
          throw new Error(responseContent);
        }
        
        addMessage(chat.id, {
          role: 'assistant',
          content: responseContent,
        });
      } catch (innerError) {
        console.error('Error in API response handling:', innerError);
        throw innerError;
      }
      
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      
      if (chat.messages.filter(m => m.role === 'user').length === 1) {
        const title = input.slice(0, 30) + (input.length > 30 ? '...' : '');
        updateChatTitle(chat.id, title);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      addMessage(chat.id, {
        role: 'assistant',
        content: 'エラーが発生しました。もう一度お試しください。',
      });
    } finally {
      setIsLoading(false);
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
    
    if (chat) {
      const updatedChats = chats.map(c => 
        c.id === chat.id ? { ...c, modelId } : c
      );
      
      useStore.setState({ chats: updatedChats });
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
          >
            <Ionicons name="chevron-back" size={24} color={colors.background} />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle} numberOfLines={1}>
            {chat.title}
          </Text>
          
          <TouchableOpacity 
            onPress={handleModelSelect} 
            style={styles.modelButton}
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
});
