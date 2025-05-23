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
import { Send } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useColors } from '../../constants/colors';
import { useColorScheme } from 'react-native';
import { aiAssistService } from '../../services/aiAssist';
import ChatBubble from '../ChatBubble';

export interface AIAssistChatProps {
  visible: boolean;
  noteContent: string;
  onSuggestChanges: (changes: Array<{original: string, suggested: string}>) => void;
  selectedModelId: string;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

const AIAssistChat: React.FC<AIAssistChatProps> = ({
  visible,
  noteContent,
  onSuggestChanges,
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
  
  const flatListRef = useRef<FlatList>(null);
  
  // 初期システムメッセージを設定
  useEffect(() => {
    if (visible && messages.length === 0) {
      const systemMessage: ChatMessage = {
        id: 'system-welcome',
        role: 'system',
        content: 'ノートの内容について質問したり、修正提案を受けることができます。具体的な修正提案を行う場合は、「変更を提案」ボタンで差分形式で表示できます。',
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
    
    try {
      // ノートコンテンツをコンテキストとして含める
      const contextPrompt = noteContent 
        ? `以下はユーザーが編集中のノートの内容です：\n\n${noteContent}\n\n---\n\nユーザーからの質問: ${userMessage.content}`
        : userMessage.content;
      
      const response = await aiAssistService.processWithCustomPrompt(
        contextPrompt,
        'ノートの校正・改善アシスタントとして応答してください。具体的な修正提案を行う場合は、元のテキストと修正後のテキストを明確に示してください。'
      );
      
      if (response.success && response.result) {
        const assistantMessage: ChatMessage = {
          id: `msg_${Date.now() + 1}`,
          role: 'assistant',
          content: response.result,
          timestamp: Date.now(),
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        Alert.alert('エラー', response.error || 'AI応答の取得に失敗しました');
      }
    } catch (error) {
      console.error('AI Chat Error:', error);
      Alert.alert('エラー', 'AIとの通信中にエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  }, [inputText, isLoading, noteContent]);
  
  // 変更提案ハンドラ
  const handleSuggestChanges = useCallback((content: string) => {
    // AI応答から修正提案を抽出する簡易的なロジック
    // 実際にはより高度なテキスト解析が必要
    const suggestions = extractSuggestions(content, noteContent);
    if (suggestions.length > 0) {
      onSuggestChanges(suggestions);
    } else {
      Alert.alert('変更提案', 'このメッセージから具体的な変更提案を抽出できませんでした。');
    }
  }, [noteContent, onSuggestChanges]);

  // AI応答から変更提案を抽出する関数
  const extractSuggestions = (aiResponse: string, originalContent: string): Array<{original: string, suggested: string}> => {
    const suggestions: Array<{original: string, suggested: string}> = [];
    
    // 簡易的な抽出ロジック
    // "「...」を「...」に変更" のパターンを探す
    const changePattern = /「(.+?)」を「(.+?)」に/g;
    let match;
    
    while ((match = changePattern.exec(aiResponse)) !== null) {
      const original = match[1];
      const suggested = match[2];
      
      // 元のコンテンツに存在するかチェック
      if (originalContent.includes(original)) {
        suggestions.push({ original, suggested });
      }
    }
    
    // より高度な抽出ロジックを追加可能
    // 例: マークダウン形式での差分表示の解析など
    
    return suggestions;
  };
  
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
        <ChatBubble message={item} />
        {item.role === 'assistant' && (
          <TouchableOpacity
            style={[styles.suggestButton, { backgroundColor: colors.primary }]}
            onPress={() => handleSuggestChanges(item.content)}
          >
            <Text style={[styles.suggestButtonText, { color: colors.textOnPrimary }]}>
              変更を提案
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };
  
  if (!visible) return null;
  
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
              placeholder="AIアシスタントに質問..."
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
  suggestButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginTop: 8,
    marginLeft: 16,
  },
  suggestButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
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