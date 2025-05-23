import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, Alert, ActivityIndicator, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { XStack, YStack, Text, Button, ScrollView, Input } from 'tamagui';
import { ArrowLeft, Star, Undo, Redo, Search, MessageSquare, X, ChevronDown } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useNoteStore } from '../store/noteStore';
import TenTapEditor from '../components/note/TenTapEditor';
import AIAssistChat from '../components/note/AIAssistChat';
import DiffViewer, { DiffChange } from '../components/note/DiffViewer';
import { useColors } from '../constants/colors';
import { useTheme } from '../ui/ThemeProvider';
import { useColorScheme } from 'react-native';
import { aiAssistService, AIAssistResponse } from '../services/aiAssist';
import { MODELS } from '../constants/models';
import { useStore } from '../store';
import ModelSelectModal from '../components/ModelSelectModal';

export default function NoteScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNewNote = id === 'new';
  const colors = useColors();
  const { theme } = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { width } = useWindowDimensions();
  
  // Store からプランとローカルモデル状態を取得
  const plan = useStore(state => state.plan);
  const localModelStatus = useStore(state => state.localModelStatus);
  
  // TenTapエディタへの参照を作成
  const editorRef = useRef<any>(null);
  
  const { 
    getNoteById, createNote, updateNote, currentFolder
  } = useNoteStore();
  
  // ノートの状態
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedText, setSelectedText] = useState('');
  const [showAiAssist, setShowAiAssist] = useState(false);
  const [noteId, setNoteId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [lastProcessedResult, setLastProcessedResult] = useState('');
  
  // AI校正モード（チャット画面表示）の状態
  const [aiChatMode, setAiChatMode] = useState(false);
  
  // AIモデル選択の状態
  const [selectedModelId, setSelectedModelId] = useState<string>('openai/gpt-4o-mini');
  const [showModelSelect, setShowModelSelect] = useState(false);
  
  // 差分表示の状態
  const [diffChanges, setDiffChanges] = useState<DiffChange[]>([]);
  const [showDiffViewer, setShowDiffViewer] = useState(false);
  
  // レスポンシブデザイン: 画面幅に基づいてレイアウトを決定
  const isTablet = width >= 768;
  const chatWidth = isTablet ? width * 0.4 : width * 0.5; // タブレットなら40%、スマホなら50%
  const editorWidth = isTablet ? width * 0.6 : width * 0.5;

  // 初期データロード
  useEffect(() => {
    if (isNewNote) {
      // 新規ノートの場合、デフォルトでH1タイトルを設定
      setTitle('');
      setContent('<h1>新しいノート</h1><p></p>');
      createNewNote();
      return;
    }
    
    const note = getNoteById(id);
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    } else {
      // ノートが見つからない場合は一覧に戻る
      router.replace('/notes');
    }
  }, [id, isNewNote, getNoteById]);

  // 新規ノートの作成
  const createNewNote = useCallback(async () => {
    try {
      const newNoteId = await createNote({
        title: '新しいノート',
        content: '<h1>新しいノート</h1><p></p>',
        folder_id: currentFolder
      });
      setNoteId(newNoteId);
      
      // URLを新しいノートIDに更新
      if (typeof window !== 'undefined' && window.history) {
        window.history.replaceState(
          null, 
          '', 
          window.location.pathname.replace('/new', `/${newNoteId}`)
        );
      }
    } catch (error) {
      console.error('新規ノート作成エラー:', error);
    }
  }, [createNote, currentFolder]);

  // 内容の変更ハンドラ
  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);
    
    // タイトルをH1から抽出
    const h1Match = newContent.match(/<h1[^>]*>(.*?)<\/h1>/);
    if (h1Match && h1Match[1]) {
      const extractedTitle = h1Match[1].replace(/<[^>]*>/g, ''); // HTMLタグを除去
      setTitle(extractedTitle);
    }
    
    // 自動保存
    if (isNewNote && noteId) {
      updateNote(noteId, { 
        content: newContent,
        title: h1Match ? h1Match[1].replace(/<[^>]*>/g, '') : title
      });
    } else if (!isNewNote) {
      updateNote(id, { 
        content: newContent,
        title: h1Match ? h1Match[1].replace(/<[^>]*>/g, '') : title
      });
    }
  }, [id, isNewNote, noteId, updateNote, title]);

  // テキスト選択ハンドラ
  const handleTextSelection = useCallback((text: string) => {
    setSelectedText(text);
    if (text.trim()) {
      setShowAiAssist(true);
    }
  }, []);

  // AIアシストトグル（従来のドロワー形式）
  const toggleAiAssist = useCallback(() => {
    setShowAiAssist(prev => !prev);
    if (showAiAssist) {
      setSelectedText('');
      setCustomPrompt('');
      setLastProcessedResult('');
    }
  }, [showAiAssist]);

  // AI校正チャットモードトグル（新機能）
  const toggleAIChatMode = useCallback(() => {
    setAiChatMode(prev => !prev);
    // チャットモードを閉じる時は、従来のドロワーも閉じる
    if (aiChatMode) {
      setShowAiAssist(false);
      setShowDiffViewer(false);
    }
  }, [aiChatMode]);

  // モデル選択ハンドラ
  const handleSelectModel = useCallback((modelId: string) => {
    const model = MODELS.find(m => m.id === modelId);
    
    if (!model) return;
    
    if (model.isLocal && localModelStatus !== 'ready') {
      Alert.alert(
        'ローカルモデル未準備',
        'ローカルモデルが準備できていません。',
        [{ text: 'OK' }]
      );
      return;
    }
    
    if (model.isPremium && plan === 'free') {
      Alert.alert(
        'プレミアムモデル',
        `このモデルを使用するには、${model.tier === 1 ? 'Lite' : 'Premium'}プランへのアップグレードが必要です。`,
        [
          { text: 'キャンセル', style: 'cancel' },
          { text: 'アップグレード' } // 実際のアップグレード処理は省略
        ]
      );
      return;
    }
    
    setSelectedModelId(modelId);
    setShowModelSelect(false);
  }, [plan, localModelStatus]);

  // AIチャットからの変更提案処理
  const handleSuggestChanges = useCallback((suggestions: Array<{original: string, suggested: string}>) => {
    const changes: DiffChange[] = suggestions.map((suggestion, index) => ({
      id: `change_${Date.now()}_${index}`,
      original: suggestion.original,
      suggested: suggestion.suggested,
      type: 'modification' as const,
      startIndex: content.indexOf(suggestion.original),
      endIndex: content.indexOf(suggestion.original) + suggestion.original.length,
      status: 'pending' as const,
    }));
    
    setDiffChanges(changes);
    setShowDiffViewer(true);
  }, [content]);

  // 差分変更の承認
  const handleAcceptChange = useCallback((changeId: string) => {
    setDiffChanges(prev => prev.map(change => 
      change.id === changeId 
        ? { ...change, status: 'accepted' as const }
        : change
    ));
    
    // 実際のコンテンツに変更を適用
    const change = diffChanges.find(c => c.id === changeId);
    if (change) {
      const newContent = content.replace(change.original, change.suggested);
      handleContentChange(newContent);
    }
  }, [diffChanges, content, handleContentChange]);

  // 差分変更の拒否
  const handleRejectChange = useCallback((changeId: string) => {
    setDiffChanges(prev => prev.map(change => 
      change.id === changeId 
        ? { ...change, status: 'rejected' as const }
        : change
    ));
  }, []);

  // すべての変更を承認
  const handleAcceptAllChanges = useCallback(() => {
    const pendingChanges = diffChanges.filter(change => change.status === 'pending');
    let newContent = content;
    
    // 逆順でreplaceすることで、インデックスのずれを防ぐ
    const sortedChanges = [...pendingChanges].sort((a, b) => b.startIndex - a.startIndex);
    
    sortedChanges.forEach(change => {
      newContent = newContent.replace(change.original, change.suggested);
    });
    
    setDiffChanges(prev => prev.map(change => 
      change.status === 'pending' 
        ? { ...change, status: 'accepted' as const }
        : change
    ));
    
    handleContentChange(newContent);
  }, [diffChanges, content, handleContentChange]);

  // すべての変更を拒否
  const handleRejectAllChanges = useCallback(() => {
    setDiffChanges(prev => prev.map(change => 
      change.status === 'pending' 
        ? { ...change, status: 'rejected' as const }
        : change
    ));
  }, []);

  // AIアシスト処理（従来のドロワー形式）
  const handleAiAssist = useCallback(async (action: 'correct' | 'summarize' | 'translate' | 'improve' | 'expand' | 'custom') => {
    const targetText = selectedText.trim() || content;
    
    if (!targetText) {
      Alert.alert('エラー', 'テキストが選択されていません');
      return;
    }

    setIsProcessing(true);
    setLastProcessedResult('');

    try {
      let response: AIAssistResponse;

      if (action === 'custom' && customPrompt.trim()) {
        response = await aiAssistService.processWithCustomPrompt(targetText, customPrompt);
      } else {
        response = await aiAssistService.processText({
          text: targetText,
          action: action === 'custom' ? 'improve' : action,
          targetLanguage: action === 'translate' ? 'English' : undefined
        });
      }

      if (response.success && response.result) {
        setLastProcessedResult(response.result);
      } else {
        Alert.alert('エラー', response.error || 'AIアシスト処理に失敗しました');
      }
    } catch (error) {
      console.error('AIアシストエラー:', error);
      Alert.alert('エラー', 'AIアシスト処理中にエラーが発生しました');
    } finally {
      setIsProcessing(false);
    }
  }, [selectedText, content, customPrompt]);

  // テキスト編集適用（従来のドロワー形式）
  const handleApplyEdit = useCallback(() => {
    if (!lastProcessedResult) return;

    if (selectedText) {
      // 選択されたテキストを置換
      const newContent = content.replace(selectedText, lastProcessedResult);
      handleContentChange(newContent);
    } else {
      // 全体を置換
      handleContentChange(lastProcessedResult);
    }
    
    setSelectedText('');
    setLastProcessedResult('');
    setShowAiAssist(false);
  }, [content, selectedText, lastProcessedResult, handleContentChange]);

  // Undo処理の実行
  const handleUndo = useCallback(() => {
    if (editorRef.current?.undo) {
      editorRef.current.undo();
    }
  }, []);

  // Redo処理の実行
  const handleRedo = useCallback(() => {
    if (editorRef.current?.redo) {
      editorRef.current.redo();
    }
  }, []);

  // モデル選択ボタン
  const ModelSelectButton = () => {
    const currentModel = MODELS.find(model => model.id === selectedModelId) || MODELS[0];
    
    return (
      <TouchableOpacity
        style={styles.modelButton}
        onPress={() => setShowModelSelect(true)}
      >
        <Text style={[styles.modelButtonText, { color: colors.textOnPrimary }]} numberOfLines={1}>
          {currentModel.name}
        </Text>
        <ChevronDown size={16} color={colors.textOnPrimary} />
      </TouchableOpacity>
    );
  };

  // カスタムヘッダーの実装
  const renderCustomHeader = () => {
    return (
      <View style={[styles.headerContainer, { backgroundColor: colors.primary }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/notes')}
          accessibilityLabel="戻る"
        >
          <ArrowLeft size={22} color={colors.textOnPrimary} />
        </TouchableOpacity>
        
        <View style={styles.titleContainer}>
          <Text style={[styles.headerTitle, { color: colors.textOnPrimary }]} numberOfLines={1}>
            {title || '無題のノート'}
          </Text>
        </View>
        
        <View style={styles.editButtonsContainer}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleUndo}
            accessibilityLabel="操作を取り消す"
          >
            <Undo size={20} color={colors.textOnPrimary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleRedo}
            accessibilityLabel="操作をやり直す"
          >
            <Redo size={20} color={colors.textOnPrimary} />
          </TouchableOpacity>
          
          {/* AIチャットモード時のみモデル選択ボタンを表示 */}
          {aiChatMode && <ModelSelectButton />}
          
          <TouchableOpacity
            style={[
              styles.editButton,
              aiChatMode && { backgroundColor: 'rgba(33, 150, 243, 0.8)' }
            ]}
            onPress={toggleAIChatMode}
            accessibilityLabel="AI校正チャット"
          >
            <MessageSquare size={20} color={colors.textOnPrimary} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  // スタイルを動的に生成
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 50, // ステータスバー分の余白
      paddingBottom: 12,
      paddingHorizontal: 12,
      height: 96, // ヘッダーの高さを固定
    },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    titleContainer: {
      flex: 1,
      marginHorizontal: 12,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      textAlign: 'center',
    },
    editButtonsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    editButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modelButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      maxWidth: 100,
    },
    modelButtonText: {
      fontSize: 11,
      fontWeight: '500',
      marginRight: 4,
      flex: 1,
    },
    splitContainer: {
      flex: 1,
      flexDirection: 'row',
    },
    editorContainer: {
      flex: 1,
    },
    chatContainer: {
      width: chatWidth,
      borderLeftWidth: 1,
      borderLeftColor: colors.border,
    },
    diffViewerContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: aiChatMode ? editorWidth : '100%',
      backgroundColor: colors.background,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      shadowColor: isDark ? '#000' : '#333',
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: isDark ? 0.5 : 0.1,
      shadowRadius: 5,
      elevation: 10,
      maxHeight: '50%',
      padding: 16,
    },
    aiAssistContainer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: colors.background,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      shadowColor: isDark ? '#000' : '#333',
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: isDark ? 0.5 : 0.1,
      shadowRadius: 5,
      elevation: 10,
      maxHeight: '70%',
      padding: 16,
    },
    aiAssistContent: {
      gap: 12,
    },
    aiAssistHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    aiAssistTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    closeButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.lightGray,
      justifyContent: 'center',
      alignItems: 'center',
    },
    selectedTextContainer: {
      backgroundColor: isDark ? colors.gray + '20' : colors.gray + '10',
      padding: 12,
      borderRadius: 8,
    },
    selectedText: {
      fontSize: 14,
      color: colors.text,
      fontStyle: 'italic',
    },
    customPromptContainer: {
      gap: 8,
    },
    customPromptLabel: {
      fontSize: 14,
      color: colors.text,
      fontWeight: '500',
    },
    resultContainer: {
      backgroundColor: isDark ? colors.gray + '10' : colors.lightGray + '50',
      padding: 12,
      borderRadius: 8,
      maxHeight: 200,
    },
    resultText: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
    },
    aiButtonsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    processingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      gap: 12,
    },
    processingText: {
      fontSize: 16,
      color: colors.text,
    },
  });

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* カスタムヘッダー */}
      {renderCustomHeader()}
      
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* メインコンテンツエリア: チャットモード時は分割画面 */}
        <View style={aiChatMode ? styles.splitContainer : { flex: 1 }}>
          {/* エディタ部分 */}
          <View style={aiChatMode ? { width: editorWidth } : styles.editorContainer}>
            <TenTapEditor
              ref={editorRef}
              content={content}
              onContentChange={handleContentChange}
              onTextSelection={handleTextSelection}
              isDarkMode={isDark}
              themeColors={colors}
              autoFocus={isNewNote}
              placeholder="ここに内容を入力してください"
            />
          </View>
          
          {/* AI校正チャット画面 */}
          {aiChatMode && (
            <View style={styles.chatContainer}>
              <AIAssistChat
                visible={aiChatMode}
                noteContent={content}
                onSuggestChanges={handleSuggestChanges}
                selectedModelId={selectedModelId}
              />
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
      
      {/* 差分表示ビューア */}
      {showDiffViewer && (
        <View style={styles.diffViewerContainer}>
          <DiffViewer
            changes={diffChanges}
            onAcceptChange={handleAcceptChange}
            onRejectChange={handleRejectChange}
            onAcceptAll={handleAcceptAllChanges}
            onRejectAll={handleRejectAllChanges}
            visible={showDiffViewer}
          />
        </View>
      )}
      
      {/* AIアシストドロワー（従来の機能） - チャットモード時は非表示 */}
      {showAiAssist && !aiChatMode && (
        <View style={styles.aiAssistContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            <YStack style={styles.aiAssistContent}>
              <View style={styles.aiAssistHeader}>
                <Text style={styles.aiAssistTitle}>AIアシスト</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={toggleAiAssist}
                >
                  <X size={16} color={colors.text} />
                </TouchableOpacity>
              </View>
              
              {selectedText ? (
                <View style={styles.selectedTextContainer}>
                  <Text style={styles.selectedText}>選択されたテキスト:</Text>
                  <Text style={styles.selectedText} numberOfLines={3}>"{selectedText}"</Text>
                </View>
              ) : (
                <View style={styles.selectedTextContainer}>
                  <Text style={styles.selectedText}>ノート全体を対象にAIアシストを実行します</Text>
                </View>
              )}

              {/* カスタムプロンプト入力 */}
              <View style={styles.customPromptContainer}>
                <Text style={styles.customPromptLabel}>カスタムプロンプト（任意）:</Text>
                <Input
                  value={customPrompt}
                  onChangeText={setCustomPrompt}
                  placeholder="独自の指示を入力..."
                  multiline
                  numberOfLines={3}
                  size="$3"
                />
              </View>
              
              {/* AIアシストボタン */}
              {isProcessing ? (
                <View style={styles.processingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.processingText}>AI処理中...</Text>
                </View>
              ) : (
                <XStack style={styles.aiButtonsContainer}>
                  <Button 
                    flex={1} 
                    size="$3" 
                    onPress={() => handleAiAssist('correct')}
                    backgroundColor={colors.primary}
                  >
                    校正
                  </Button>
                  <Button 
                    flex={1} 
                    size="$3" 
                    variant="outlined" 
                    onPress={() => handleAiAssist('summarize')}
                  >
                    要約
                  </Button>
                  <Button 
                    flex={1} 
                    size="$3" 
                    variant="outlined" 
                    onPress={() => handleAiAssist('translate')}
                  >
                    翻訳
                  </Button>
                  <Button 
                    flex={1} 
                    size="$3" 
                    variant="outlined" 
                    onPress={() => handleAiAssist('improve')}
                  >
                    改善
                  </Button>
                  <Button 
                    flex={1} 
                    size="$3" 
                    variant="outlined" 
                    onPress={() => handleAiAssist('expand')}
                  >
                    拡張
                  </Button>
                  {customPrompt.trim() && (
                    <Button 
                      flex={1} 
                      size="$3" 
                      onPress={() => handleAiAssist('custom')}
                      backgroundColor={colors.primary}
                    >
                      実行
                    </Button>
                  )}
                </XStack>
              )}

              {/* 処理結果表示 */}
              {lastProcessedResult && (
                <>
                  <View style={styles.resultContainer}>
                    <ScrollView style={{ maxHeight: 200 }}>
                      <Text style={styles.resultText}>{lastProcessedResult}</Text>
                    </ScrollView>
                  </View>
                  
                  <XStack gap={8}>
                    <Button 
                      flex={1}
                      size="$3" 
                      onPress={handleApplyEdit}
                      backgroundColor={colors.primary}
                    >
                      適用
                    </Button>
                    <Button 
                      flex={1}
                      size="$3" 
                      variant="outlined" 
                      onPress={() => setLastProcessedResult('')}
                    >
                      破棄
                    </Button>
                  </XStack>
                </>
              )}
            </YStack>
          </ScrollView>
        </View>
      )}
      
      {/* モデル選択モーダル */}
      <ModelSelectModal
        visible={showModelSelect}
        onClose={() => setShowModelSelect(false)}
        onSelectModel={handleSelectModel}
        currentModelId={selectedModelId}
      />
    </View>
  );
} 