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
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import useColors from '../constants/colors';
import { MODELS } from '../constants/models';
import ModelSelectModal from '../components/ModelSelectModal';
import LocalModelInstallModal from '../components/LocalModelInstallModal';
import Header from '../components/Header';
import theme from '../ui/theme';

const SUGGESTIONS = [
  'AIについて教えてください',
  '面白い話を聞かせて',
  'プログラミングの勉強方法は？',
  '今日のニュースを要約して',
  '英語の勉強のコツは？',
];

// Define styles outside component scope with factory function
const createStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 0,
  },
  suggestionsContainer: {
    flex: 1,
    padding: 16,
  },
  suggestionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: colors.text,
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
    color: colors.text,
  },
  localModelBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.accentBlue}20`,
    padding: 12,
    borderRadius: 8,
    margin: 16,
    marginTop: 0,
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
    backgroundColor: colors.background,
  },
  input: {
    flex: 1,
    backgroundColor: colors.lightGray,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    maxHeight: 120,
    fontSize: 16,
    color: colors.text,
  },
  sendButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: colors.lightGray,
  },
  modelSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.lg,
  },
  modelSelectButtonText: {
    marginRight: theme.spacing.xs,
    fontSize: theme.fontSizes.sm,
    fontWeight: '500',
    color: colors.textOnPrimary,
  },
});

export default function NewChatScreen() {
  const router = useRouter();
  const colors = useColors(); // 動的カラーを取得
  
  // Cache styles with useMemo
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  
  const [input, setInput] = useState('');
  const createChat = useStore(state => state.createChat);
  const addMessage = useStore(state => state.addMessage);
  const localModelStatus = useStore(state => state.localModelStatus);
  const plan = useStore(state => state.plan);
  
  const defaultModel = MODELS.find(model => !model.isPremium && !model.isLocal);
  const [selectedModelId, setSelectedModelId] = useState<string>(defaultModel?.id || 'openai/gpt-4o-mini');
  const [showModelSelect, setShowModelSelect] = useState(false);
  const [showLocalModelInstall, setShowLocalModelInstall] = useState(false);

  const selectedModel = MODELS.find(m => m.id === selectedModelId) || defaultModel;

  const handleSendMessage = (content: string) => {
    if (!content.trim()) return;
    
    const chatId = createChat(selectedModelId);
    
    addMessage(chatId, {
      role: 'user',
      content,
    });
    
    router.push(`/chat/${chatId}`);
  };

  const [keyboardHeight, setKeyboardHeight] = useState(0);
  
  // Create a ref for the ScrollView
  const scrollViewRef = React.useRef<ScrollView | null>(null);

  const scrollToBottom = () => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  };

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    
    const keyboardWillShowListener = Keyboard.addListener(showEvent, (e) => {
      setKeyboardHeight(e.endCoordinates.height);
      setTimeout(scrollToBottom, 200);
    });

    const keyboardWillHideListener = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
    });

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  const handleSelectModel = (modelId: string) => {
    const model = MODELS.find(m => m.id === modelId);
    if (!model) return;
    if (model.isLocal && localModelStatus !== 'ready') {
      setSelectedModelId(modelId);
      setShowLocalModelInstall(true);
      return;
    }
    if (model.isPremium && plan === 'free') {
      setSelectedModelId(modelId);
      return;
    }
    setSelectedModelId(modelId);
  };

  const ModelSelectButton = () => (
    <TouchableOpacity
      style={styles.modelSelectButton}
      onPress={() => setShowModelSelect(true)}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Text style={styles.modelSelectButtonText}>{selectedModel?.name}</Text>
      <Ionicons name="chevron-down" size={16} color={colors.textOnPrimary} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      
      <Header
        title="新規チャット"
        showBack={false}
        rightComponent={<ModelSelectButton />}
      />
      
      {localModelStatus !== 'ready' && (
        <View style={styles.localModelBanner}>
          <Ionicons name="information-circle-outline" size={20} color={colors.accentBlue} />
          <Text style={styles.localModelText}>
            ローカルモデル (Qwen3:4B) をインストールすると、オフラインでも使用できます
          </Text>
        </View>
      )}
      
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.suggestionsContainer}
          contentContainerStyle={{ 
            paddingBottom: keyboardHeight > 0 ? keyboardHeight + 80 : 20 
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
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
        </ScrollView>
        
        <View style={[styles.inputContainer, keyboardHeight > 0 && { paddingBottom: Platform.OS === 'ios' ? 8 : 0 }]}>
          <TextInput
            style={styles.input}
            placeholder="メッセージを入力..."
            value={input}
            onChangeText={setInput}
            multiline
            placeholderTextColor={colors.secondaryText}
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
      
      {/* モデル選択モーダル */}
      <ModelSelectModal
        visible={showModelSelect}
        onClose={() => setShowModelSelect(false)}
        onSelectModel={handleSelectModel}
        currentModelId={selectedModelId}
      />
      
      {/* ローカルモデルインストールモーダル */}
      <LocalModelInstallModal
        visible={showLocalModelInstall}
        onClose={() => setShowLocalModelInstall(false)}
      />
    </View>
  );
}
