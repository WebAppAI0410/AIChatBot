import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  Keyboard,
  Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import { colors } from '../constants/colors';
import { MODELS } from '../constants/models';

const SUGGESTIONS = [
  'AIについて教えてください',
  '面白い話を聞かせて',
  'プログラミングの勉強方法は？',
  '今日のニュースを要約して',
  '英語の勉強のコツは？',
];

export default function NewChatScreen() {
  const router = useRouter();
  const [input, setInput] = useState('');
  const createChat = useStore(state => state.createChat);
  const addMessage = useStore(state => state.addMessage);
  const localModelStatus = useStore(state => state.localModelStatus);
  
  const defaultModel = MODELS.find(model => !model.isPremium && !model.isLocal);

  const handleSendMessage = (content: string) => {
    if (!content.trim()) return;
    
    const chatId = createChat(defaultModel?.id || 'openai/gpt-4o-mini');
    
    addMessage(chatId, {
      role: 'user',
      content,
    });
    
    router.push(`/chat/${chatId}`);
  };

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <ScrollView 
        style={[
          styles.suggestionsContainer,
          keyboardHeight > 0 && { marginBottom: keyboardHeight * 0.5 }
        ]}
        contentContainerStyle={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight * 0.5 : 0 }}
      >
        <Text style={styles.suggestionsTitle}>おすすめの質問</Text>
        <View style={styles.chipContainer}>
          {SUGGESTIONS.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={styles.chip}
              onPress={() => handleSendMessage(suggestion)}
            >
              <Text style={styles.chipText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.modelInfoContainer}>
          <Text style={styles.modelInfoTitle}>現在のモデル: {defaultModel?.name}</Text>
          <Text style={styles.modelInfoDescription}>
            チャットルームでモデルを変更できます
          </Text>
          
          {localModelStatus !== 'ready' && (
            <View style={styles.localModelBanner}>
              <Ionicons name="information-circle-outline" size={20} color={colors.accentBlue} />
              <Text style={styles.localModelText}>
                ローカルモデル (Qwen3:4B) をインストールすると、オフラインでも使用できます
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      
      <View style={[styles.inputContainer, keyboardHeight > 0 && { paddingBottom: Platform.OS === 'ios' ? 8 : 0 }]}>
        <TextInput
          style={styles.input}
          placeholder="メッセージを入力..."
          value={input}
          onChangeText={setInput}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, !input.trim() && styles.sendButtonDisabled]}
          disabled={!input.trim()}
          onPress={() => handleSendMessage(input)}
        >
          <Ionicons name="send" size={24} color={input.trim() ? colors.background : colors.gray} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  suggestionsContainer: {
    flex: 1,
    padding: 16,
  },
  suggestionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
  },
  chip: {
    backgroundColor: colors.lightGray,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 4,
  },
  chipText: {
    fontSize: 14,
  },
  modelInfoContainer: {
    padding: 16,
    backgroundColor: colors.lightGray,
    borderRadius: 8,
    marginBottom: 16,
  },
  modelInfoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  modelInfoDescription: {
    fontSize: 14,
    color: colors.darkGray,
    marginBottom: 12,
  },
  localModelBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    padding: 12,
    borderRadius: 8,
  },
  localModelText: {
    fontSize: 14,
    color: colors.accentBlue,
    marginLeft: 8,
    flex: 1,
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
});
