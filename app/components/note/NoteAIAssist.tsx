import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TextInput, Pressable, FlatList } from 'react-native';
import { Text, Button, XStack, YStack, Separator } from 'tamagui';
import { Edit, X, ChevronDown, Send, HelpCircle, MessageSquare } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';

// AIアシストモード
type AssistMode = 'question' | 'edit' | 'partial';

export type AIAssistMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
};

export type NoteAIAssistProps = {
  selectedText?: string;
  onClose: () => void;
  onApplyEdit?: (text: string) => void;
  noteId: string;
  noteContent: string;
  themeColors?: any;
  isDarkMode?: boolean;
};

const NoteAIAssist: React.FC<NoteAIAssistProps> = ({
  selectedText,
  onClose,
  onApplyEdit,
  noteId,
  noteContent,
  themeColors,
  isDarkMode = false
}) => {
  const { t } = useTranslation();
  const [mode, setMode] = useState<AssistMode>(selectedText ? 'partial' : 'question');
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<AIAssistMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // テーマカラーのデフォルト値
  const colors = themeColors || {
    text: isDarkMode ? '#ffffff' : '#333333',
    background: isDarkMode ? '#1a1a1a' : '#ffffff',
    primary: '#007aff',
    border: isDarkMode ? '#444444' : '#eeeeee',
    lightGray: isDarkMode ? '#444444' : '#f5f5f5',
    gray: isDarkMode ? '#888888' : '#cccccc'
  };

  // メッセージを送信
  const sendMessage = useCallback(async () => {
    if (!prompt.trim() || isProcessing) return;
    
    const newUserMessage: AIAssistMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: prompt,
      timestamp: Date.now()
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    setPrompt('');
    setIsProcessing(true);
    
    try {
      // 実際の実装ではAPIに送信
      // const response = await aiService.sendNotePrompt(noteId, noteContent, prompt, mode, selectedText);
      
      // モック応答（実際はAPIレスポンス）
      setTimeout(() => {
        const mockResponse: AIAssistMessage = {
          id: `assistant_${Date.now()}`,
          role: 'assistant',
          content: mode === 'question' 
            ? `あなたのノートについてお答えします: ${prompt}`
            : mode === 'partial'
              ? `テキスト「${selectedText}」を以下のように編集しました:\n\n改善されたテキストがここに表示されます。`
              : 'ノート全体を編集する提案はこちらです:\n\n編集提案の内容がここに表示されます。',
          timestamp: Date.now()
        };
        
        setMessages(prev => [...prev, mockResponse]);
        setIsProcessing(false);
      }, 1000);
    } catch (error) {
      console.error('AIアシスト処理エラー:', error);
      setIsProcessing(false);
      
      // エラーメッセージを表示
      setMessages(prev => [...prev, {
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: 'エラーが発生しました。再度お試しください。',
        timestamp: Date.now()
      }]);
    }
  }, [prompt, isProcessing, mode, noteId, noteContent, selectedText]);

  // モード切り替え
  const toggleMode = useCallback((newMode: AssistMode) => {
    if (selectedText && newMode !== 'partial') {
      // テキスト選択がある場合は部分編集モード固定
      return;
    }
    setMode(newMode);
  }, [selectedText]);

  // 編集適用
  const applyEdit = useCallback((text: string) => {
    if (onApplyEdit) {
      onApplyEdit(text);
      onClose();
    }
  }, [onApplyEdit, onClose]);

  // メッセージアイテム表示
  const renderMessage = ({ item }: { item: AIAssistMessage }) => (
    <View style={[
      styles.messageContainer,
      item.role === 'user' 
        ? { ...styles.userMessage, backgroundColor: isDarkMode ? '#2c5282' : '#e1f5fe' } 
        : { ...styles.assistantMessage, backgroundColor: isDarkMode ? '#262626' : '#f5f5f5' }
    ]}>
      <Text 
        style={[
          styles.messageText, 
          { color: colors.text }
        ]}
      >
        {item.content}
      </Text>
      
      {item.role === 'assistant' && mode !== 'question' && (
        <Button 
          my={8} 
          icon={<Edit size={16} />}
          onPress={() => applyEdit(item.content)}
        >
          {t('apply_edit')}
        </Button>
      )}
    </View>
  );
  
  // スタイルを動的に生成
  const containerStyle = {
    ...styles.container,
    backgroundColor: colors.background
  };
  
  const selectedTextBoxStyle = {
    ...styles.selectedTextBox,
    backgroundColor: isDarkMode ? '#262626' : '#f5f5f5',
    borderLeftColor: colors.primary
  };
  
  const inputContainerStyle = {
    ...styles.inputContainer,
    borderTopColor: colors.border
  };
  
  const inputStyle = {
    ...styles.input,
    borderColor: colors.border,
    backgroundColor: colors.background,
    color: colors.text
  };

  return (
    <View style={containerStyle}>
      {/* ヘッダー */}
      <XStack 
        alignItems="center" 
        justifyContent="space-between" 
        paddingHorizontal={16} 
        paddingVertical={12}
      >
        <XStack alignItems="center" gap={8}>
          <Text fontSize={18} fontWeight="bold" color={colors.text}>{t('ai_assist')}</Text>
          
          {/* モードセレクタ（テキスト選択時は固定） */}
          {!selectedText && (
            <Button
              size="$2"
              icon={<ChevronDown size={16} />}
              variant="outlined"
              onPress={() => null}
            >
              {mode === 'question' ? t('question_mode') : t('edit_mode')}
            </Button>
          )}
        </XStack>
        
        <Button
          size="$3"
          icon={<X size={20} />}
          circular
          variant="outlined"
          onPress={onClose}
        />
      </XStack>
      
      <Separator backgroundColor={colors.border} />
      
      {/* テキスト選択表示 */}
      {selectedText && (
        <YStack padding={12} gap={4}>
          <Text fontWeight="600" color={colors.text}>{t('selected_text')}:</Text>
          <View style={selectedTextBoxStyle}>
            <Text color={colors.text}>{selectedText}</Text>
          </View>
        </YStack>
      )}
      
      {/* モード切替（テキスト選択時は表示しない） */}
      {!selectedText && (
        <XStack padding={12} gap={8}>
          <Button
            flex={1}
            icon={<HelpCircle size={16} />}
            variant="outlined"
            backgroundColor={mode === 'question' ? colors.primary : 'transparent'}
            color={mode === 'question' ? colors.background : colors.primary}
            onPress={() => toggleMode('question')}
          >
            {t('question')}
          </Button>
          <Button
            flex={1}
            icon={<Edit size={16} />}
            variant="outlined"
            backgroundColor={mode === 'edit' ? colors.primary : 'transparent'}
            color={mode === 'edit' ? colors.background : colors.primary}
            onPress={() => toggleMode('edit')}
          >
            {t('edit')}
          </Button>
        </XStack>
      )}
      
      {/* メッセージリスト */}
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        style={{ flex: 1 }}
      />
      
      {/* 入力部分 */}
      <View style={inputContainerStyle}>
        <TextInput
          style={inputStyle}
          value={prompt}
          onChangeText={setPrompt}
          placeholder={
            mode === 'question' 
              ? t('ask_about_note')
              : mode === 'partial'
                ? t('how_improve_text')
                : t('how_edit_note')
          }
          placeholderTextColor={colors.gray}
          multiline
          maxLength={1000}
        />
        <Pressable 
          style={[
            styles.sendButton,
            (!prompt.trim() || isProcessing) && styles.sendButtonDisabled
          ]} 
          onPress={sendMessage}
          disabled={!prompt.trim() || isProcessing}
        >
          <Send size={20} color={!prompt.trim() || isProcessing ? colors.gray : colors.primary} />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  selectedTextBox: {
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  messagesList: {
    padding: 12,
  },
  messageContainer: {
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    maxWidth: '85%',
  },
  userMessage: {
    alignSelf: 'flex-end',
  },
  assistantMessage: {
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    padding: 12,
    fontSize: 16,
    maxHeight: 120,
    minHeight: 40,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default NoteAIAssist; 