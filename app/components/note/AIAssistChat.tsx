import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput, 
  Platform,
  Alert,
  KeyboardAvoidingView,
  ActivityIndicator
} from 'react-native';
import { Text, XStack, YStack, Button } from 'tamagui';
import { Send, Undo, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import useColors from '../../constants/colors';
import { useColorScheme } from 'react-native';
import { aiAssistService } from '../../services/aiAssist';
import ChatBubble from '../ChatBubble';
import { Message } from '../../store/chatStore';

export interface AIAssistChatProps {
  visible: boolean;
  noteContent: string;
  onSuggestChanges: (changes: Array<{original: string, suggested: string}>) => void;
  onApplyChanges?: (newContent: string) => void;
  onUndoLastChange?: () => void;
  onAutoEdit?: (newContent: string, explanation: string) => void;
  selectedModelId: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isProcessing?: boolean;
  hasChanges?: boolean;
  originalContent?: string;
  suggestedContent?: string;
  isEditMode?: boolean;
  editExplanation?: string;
  isApplied?: boolean;
}

const AIAssistChat: React.FC<AIAssistChatProps> = ({
  visible,
  noteContent,
  onSuggestChanges,
  onApplyChanges,
  onUndoLastChange,
  onAutoEdit,
  selectedModelId,
}) => {
  const { t } = useTranslation();
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // チャット状態
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastAppliedContent, setLastAppliedContent] = useState<string | null>(null);
  const [chatMode, setChatMode] = useState<'question' | 'edit'>('question'); // モード管理
  
  const flatListRef = useRef<FlatList>(null);
  
  // 初期システムメッセージを設定
  useEffect(() => {
    if (visible && messages.length === 0) {
      const systemMessage: ChatMessage = {
        id: 'system-welcome',
        role: 'system',
        content: '【質問モード】: ノートについて質問できます\n【編集モード】: AIがノートを自動編集し、差分で表示します',
        timestamp: Date.now(),
      };
      setMessages([systemMessage]);
    }
  }, [visible, messages.length]);

  // メッセージ送信
  const handleSendMessage = useCallback(async () => {
    if (!inputText.trim() || isLoading) return;
    
    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: inputText.trim(),
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);
    
    // 処理中メッセージを表示
    const processingMessage: ChatMessage = {
      id: `processing_${Date.now()}`,
      role: 'assistant',
      content: '処理中...',
      timestamp: Date.now(),
      isProcessing: true,
    };
    
    setMessages(prev => [...prev, processingMessage]);
    
    try {
      if (chatMode === 'question') {
        // 質問モード: 質問に答えるだけ
        const contextPrompt = noteContent 
          ? `以下はユーザーが編集中のノートの内容です：\n\n${noteContent}\n\n---\n\nユーザーからの質問: ${userMessage.content}`
          : userMessage.content;
        
        const response = await aiAssistService.processWithCustomPrompt(
          contextPrompt,
          'ノートの内容について質問に答えてください。ノートの編集は行わず、質問にのみ回答してください。',
          selectedModelId
        );
        
        // 処理中メッセージを削除
        setMessages(prev => prev.filter(msg => msg.id !== processingMessage.id));
        
        if (response.success && response.result) {
          const assistantMessage: ChatMessage = {
            id: `msg_${Date.now() + 1}`,
            role: 'assistant',
            content: response.result,
            timestamp: Date.now(),
            isEditMode: false,
          };
          
          setMessages(prev => [...prev, assistantMessage]);
        } else {
          Alert.alert('エラー', response.error || 'AI応答の取得に失敗しました');
        }
      } else {
        // 編集モード: ノートを自動編集
        const editPrompt = noteContent 
          ? `以下のノート内容を、ユーザーの要求に基づいて編集してください：\n\n現在のノート内容：\n${noteContent}\n\n編集要求：${userMessage.content}\n\n編集されたノート内容のみを返してください。説明や前置きは不要です。`
          : `以下の要求に基づいてノートを作成してください：\n\n${userMessage.content}`;
        
        const editResponse = await aiAssistService.processWithCustomPrompt(
          editPrompt,
          '指示に従ってノートを編集し、編集後の完全なノート内容のみを返してください。',
          selectedModelId
        );
        
        if (editResponse.success && editResponse.result) {
          // 編集内容の説明を取得
          const explanationResponse = await aiAssistService.processWithCustomPrompt(
            `元のノート：\n${noteContent}\n\n編集後のノート：\n${editResponse.result}`,
            'ノートにどのような変更を加えたかを簡潔に説明してください。',
            selectedModelId
          );
          
          const explanation = explanationResponse.success && explanationResponse.result 
            ? explanationResponse.result 
            : '編集を行いました';
          
          // 自動編集を実行
          if (onAutoEdit) {
            onAutoEdit(editResponse.result.trim(), explanation);
          }
          
          // 処理中メッセージを削除
          setMessages(prev => prev.filter(msg => msg.id !== processingMessage.id));
          
          const assistantMessage: ChatMessage = {
            id: `msg_${Date.now() + 1}`,
            role: 'assistant',
            content: explanation,
            timestamp: Date.now(),
            isEditMode: true,
            editExplanation: explanation,
            suggestedContent: editResponse.result.trim(),
            originalContent: noteContent,
            isApplied: false,
          };
          
          setMessages(prev => [...prev, assistantMessage]);
        } else {
          Alert.alert('エラー', editResponse.error || '編集に失敗しました');
        }
      }
    } catch (error) {
      console.error('AI Chat Error:', error);
      Alert.alert('エラー', 'AIとの通信中にエラーが発生しました');
      // 処理中メッセージを削除
      setMessages(prev => prev.filter(msg => msg.id !== processingMessage.id));
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading, noteContent, chatMode, selectedModelId, onAutoEdit]);
  
  // 編集の適用（編集モード用）
  const handleApplyEdit = useCallback((message: ChatMessage) => {
    if (message.suggestedContent && onApplyChanges) {
      onApplyChanges(message.suggestedContent);
      
      // 適用済みのメッセージを更新
      setMessages(prev => prev.map(msg => 
        msg.id === message.id 
          ? { ...msg, isApplied: true }
          : msg
      ));
    }
  }, [onApplyChanges]);

  // 編集の取り消し（編集モード用）
  const handleUndoEdit = useCallback((message: ChatMessage) => {
    if (message.originalContent && onApplyChanges) {
      onApplyChanges(message.originalContent);
      
      // 取り消し済みのメッセージを更新
      setMessages(prev => prev.map(msg => 
        msg.id === message.id 
          ? { ...msg, isApplied: false }
          : msg
      ));
    }
  }, [onApplyChanges]);

  
  // メッセージをレンダリング
  const renderMessage = ({ item }: { item: ChatMessage }) => {
    if (item.role === 'system') {
      return (
        <View style={[styles.systemMessage, { backgroundColor: colors.card }]}>
          <Text style={[styles.systemMessageText, { color: colors.secondaryText }]}>
            {item.content}
          </Text>
        </View>
      );
    }
    
    return (
      <View style={styles.messageContainer}>
        <ChatBubble 
          message={{
            id: item.id,
            role: item.role as 'user' | 'assistant',
            content: item.content,
            timestamp: item.timestamp,
          } as Message}
        />
        
        {/* 編集モードでのアクションボタン */}
        {item.role === 'assistant' && item.isEditMode && !item.isProcessing && (
          <View style={styles.messageActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.undoButton]}
              onPress={() => handleUndoEdit(item)}
              disabled={item.isApplied === false}
            >
              <Undo size={16} color="#dc2626" />
              <Text style={[styles.actionButtonText, { color: '#dc2626' }]}>
                取り消し
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.applyButton]}
              onPress={() => handleApplyEdit(item)}
              disabled={item.isApplied === true}
            >
              <Check size={16} color="#16a34a" />
              <Text style={[styles.actionButtonText, { color: '#16a34a' }]}>
                {item.isApplied ? '適用済み' : '適用'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };
  
  if (!visible) return null;
  
  console.log('[AIAssistChat] レンダリング中 - 現在のモード:', chatMode);
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* チャットメッセージ */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        style={styles.messagesList}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }}
        onLayout={() => {
          flatListRef.current?.scrollToEnd({ animated: false });
        }}
      />
      
      {/* 入力エリア */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.inputContainer, { backgroundColor: colors.card }]}
      >
        <View style={styles.modeButtonContainer}>
          <TouchableOpacity
            style={[
              styles.modeButton,
              { 
                borderColor: chatMode === 'question' ? colors.primary : colors.border,
                backgroundColor: chatMode === 'question' ? colors.primary : colors.card,
                borderWidth: 2,
              }
            ]}
            onPress={() => {
              console.log('[AIAssistChat] 質問モードに切り替え');
              setChatMode('question');
            }}
          >
            <Text style={[
              styles.modeButtonText,
              { color: chatMode === 'question' ? colors.textOnPrimary : colors.text }
            ]}>
              質問
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.modeButton,
              { 
                borderColor: chatMode === 'edit' ? colors.primary : colors.border,
                backgroundColor: chatMode === 'edit' ? colors.primary : colors.card,
                borderWidth: 2,
              }
            ]}
            onPress={() => {
              console.log('[AIAssistChat] 編集モードに切り替え');
              setChatMode('edit');
            }}
          >
            <Text style={[
              styles.modeButtonText,
              { color: chatMode === 'edit' ? colors.textOnPrimary : colors.text }
            ]}>
              編集
            </Text>
          </TouchableOpacity>
        </View>
        
        <XStack space="$2" alignItems="flex-end" padding="$3">
          <View style={styles.inputWrapper}>
            <TextInput
              style={[styles.textInput, { 
                color: colors.text,
                backgroundColor: colors.background,
                borderColor: colors.border
              }]}
              value={inputText}
              onChangeText={setInputText}
              placeholder={chatMode === 'question' ? "ノートについて質問..." : "編集指示を入力..."}
              placeholderTextColor={colors.secondaryText}
              multiline
              maxLength={2000}
              editable={!isLoading}
            />
          </View>
          
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: inputText.trim() && !isLoading ? colors.primary : colors.gray }
            ]}
            onPress={handleSendMessage}
            disabled={!inputText.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.textOnPrimary} />
            ) : (
              <Send size={20} color={colors.textOnPrimary} />
            )}
          </TouchableOpacity>
        </XStack>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    padding: 16,
  },
  messageContainer: {
    marginBottom: 12,
  },
  systemMessage: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    alignItems: 'center',
  },
  systemMessageText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  messageActions: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 8,
    marginLeft: 16,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  applyButton: {
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    borderColor: '#16a34a',
  },
  undoButton: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderColor: '#dc2626',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  modeButtonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  modeButtonActive: {
    // アクティブ時のスタイルは動的に適用
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputWrapper: {
    flex: 1,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 100,
    minHeight: 44,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AIAssistChat; 