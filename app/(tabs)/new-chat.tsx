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

const FEATURED_CATEGORIES = [
  {
    id: 'creative',
    title: '創作・クリエイティブ',
    icon: '🎨',
    color: '#FF6B6B',
    suggestions: [
      '小説のあらすじを考えて',
      'キャッチコピーを作って',
      'ロゴのアイデアを提案して',
      'プレゼン資料の構成を考えて'
    ]
  },
  {
    id: 'learning',
    title: '学習・勉強',
    icon: '📚',
    color: '#4ECDC4',
    suggestions: [
      'プログラミングの基礎を教えて',
      '英語の勉強法を教えて',
      '歴史の出来事を分かりやすく説明して',
      '数学の問題を解いて'
    ]
  },
  {
    id: 'business',
    title: 'ビジネス・仕事',
    icon: '💼',
    color: '#45B7D1',
    suggestions: [
      'ビジネスプランを考えて',
      'メールの下書きを作って',
      '会議の議事録をまとめて',
      'マーケティング戦略を提案して'
    ]
  },
  {
    id: 'daily',
    title: '日常・生活',
    icon: '🏠',
    color: '#96CEB4',
    suggestions: [
      '料理のレシピを教えて',
      '今日の天気について聞かせて',
      '健康的な生活習慣を教えて',
      '旅行の計画を立てて'
    ]
  },
  {
    id: 'tech',
    title: 'テクノロジー・IT',
    icon: '💻',
    color: '#FFEAA7',
    suggestions: [
      'AIの最新動向を教えて',
      'アプリ開発のアドバイスを',
      'セキュリティ対策について',
      'クラウドサービスを比較して'
    ]
  },
  {
    id: 'entertainment',
    title: 'エンタメ・趣味',
    icon: '🎮',
    color: '#DDA0DD',
    suggestions: [
      '面白い映画を推薦して',
      'ゲームの攻略法を教えて',
      '音楽の歴史について',
      '新しい趣味を提案して'
    ]
  }
];

// Define styles outside component scope with factory function
const createStyles = (colors: ReturnType<typeof useColors>) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 0,
  },
  contentContainer: {
    flex: 1,
    padding: 16,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 20,
  },
  welcomeEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: colors.secondaryText,
    textAlign: 'center',
    lineHeight: 22,
  },
  categoriesTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
    color: colors.text,
  },
  categoryCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  categoryExpand: {
    padding: 4,
  },
  suggestionsList: {
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: colors.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  suggestionText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
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
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
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

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const renderCategoryCard = (category: typeof FEATURED_CATEGORIES[0]) => {
    const isExpanded = expandedCategories.has(category.id);
    const visibleSuggestions = isExpanded ? category.suggestions : category.suggestions.slice(0, 2);

    return (
      <View key={category.id} style={styles.categoryCard}>
        <TouchableOpacity
          style={styles.categoryHeader}
          onPress={() => toggleCategory(category.id)}
          activeOpacity={0.7}
        >
          <Text style={styles.categoryIcon}>{category.icon}</Text>
          <Text style={styles.categoryTitle}>{category.title}</Text>
          <View style={styles.categoryExpand}>
            <Ionicons 
              name={isExpanded ? "chevron-up" : "chevron-down"} 
              size={20} 
              color={colors.secondaryText} 
            />
          </View>
        </TouchableOpacity>
        
        <View style={styles.suggestionsList}>
          {visibleSuggestions.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionChip}
              onPress={() => handleSendMessage(suggestion)}
              activeOpacity={0.7}
            >
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
          
          {!isExpanded && category.suggestions.length > 2 && (
            <TouchableOpacity
              style={[styles.suggestionChip, { backgroundColor: `${category.color}20` }]}
              onPress={() => toggleCategory(category.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.suggestionText, { color: category.color, fontWeight: '500' }]}>
                他 {category.suggestions.length - 2} 件を表示
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
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
          style={styles.contentContainer}
          contentContainerStyle={{ 
            paddingBottom: keyboardHeight > 0 ? keyboardHeight + 80 : 20 
          }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* ウェルカムセクション */}
          <View style={styles.welcomeSection}>
            <Text style={styles.welcomeEmoji}>🤖</Text>
            <Text style={styles.welcomeTitle}>AI チャットボットへようこそ</Text>
            <Text style={styles.welcomeSubtitle}>
              何でもお気軽にお聞きください。{'\n'}
              カテゴリから選ぶか、下のテキストボックスに直接入力してください。
            </Text>
          </View>

          {/* カテゴリセクション */}
          <Text style={styles.categoriesTitle}>💡 おすすめのカテゴリ</Text>
          {FEATURED_CATEGORIES.map(renderCategoryCard)}
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
