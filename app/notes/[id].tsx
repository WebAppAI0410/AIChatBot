import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, TextInput, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { XStack, YStack, Text, Button, ScrollView, Input } from 'tamagui';
import { ArrowLeft, Star } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useNoteStore } from '../store/noteStore';
import WebViewEditor from '../components/note/WebViewEditor';
import NoteAIAssist from '../components/note/NoteAIAssist';
import TagSelector from '../components/note/TagSelector';
import { useColors } from '../constants/colors';
import { useTheme } from '../ui/ThemeProvider';
import { useColorScheme } from 'react-native';

export default function NoteScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNewNote = id === 'new';
  const colors = useColors();
  const { theme } = useTheme();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // WebViewEditorへの参照を作成
  const editorRef = useRef<any>(null);
  
  const {
    getNoteById,
    createNote,
    updateNote,
    currentFolder,
  } = useNoteStore();
  
  // ノートの状態
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showAiAssist, setShowAiAssist] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [noteId, setNoteId] = useState<string | null>(null);

  // 初期データロード
  useEffect(() => {
    if (isNewNote) {
      setTitle('');
      setContent('');
      
      // 新規ノートを自動的に作成して保存
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
        title: '',
        content: '',
        folder_id: currentFolder
      });
      setNoteId(newNoteId);
      
      // URLを新しいノートIDに更新するが、画面は再レンダリングしない
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
    
    // 自動保存
    if (isNewNote && noteId) {
      updateNote(noteId, { content: newContent });
    } else if (!isNewNote) {
      updateNote(id, { content: newContent });
    }
  }, [id, isNewNote, noteId, updateNote]);

  // タイトル変更ハンドラ
  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle);
    
    // 自動保存
    if (isNewNote && noteId) {
      updateNote(noteId, { title: newTitle });
    } else if (!isNewNote) {
      updateNote(id, { title: newTitle });
    }
  }, [id, isNewNote, noteId, updateNote]);

  // テキスト選択ハンドラ
  const handleTextSelection = useCallback((text: string) => {
    setSelectedText(text);
    setShowAiAssist(true);
  }, []);

  // AIアシストトグル
  const toggleAiAssist = useCallback(() => {
    setShowAiAssist(prev => !prev);
    if (showAiAssist) {
      setSelectedText('');
    }
  }, [showAiAssist]);

  // テキスト編集適用
  const handleApplyEdit = useCallback((editedText: string) => {
    // 実際のWebViewエディタへの編集適用は、より複雑な実装が必要
    console.log('テキスト編集を適用:', editedText);
    // この例では簡易的な実装
    const newContent = content.replace(selectedText, editedText);
    handleContentChange(newContent);
    setSelectedText('');
  }, [content, selectedText, handleContentChange]);



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
        
        <View style={styles.editButtonsContainer} />
        
        <TouchableOpacity
          style={styles.headerActionButton}
          onPress={toggleAiAssist}
          accessibilityLabel="AIアシスト"
        >
          <Star size={22} color={colors.textOnPrimary} />
        </TouchableOpacity>
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
    editButtonsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
    },
    editButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerActionButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    titleInput: {
      fontSize: 24,
      fontWeight: 'bold',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
      color: colors.text,
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
      maxHeight: '60%',
    }
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
        <ScrollView>
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={handleTitleChange}
            placeholder="タイトル"
            placeholderTextColor={colors.gray}
          />
          
          {/* タグ一覧 */}
          <TagSelector noteId={isNewNote && noteId ? noteId : id} />
          
          <WebViewEditor
            ref={editorRef}
            content={content}
            onContentChange={handleContentChange}
            onTextSelection={handleTextSelection}
            isDarkMode={isDark}
            themeColors={colors}
            autoFocus={isNewNote}
            placeholder="ここに内容を入力してください"
          />
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* AIアシストドロワー */}
      {showAiAssist && (
        <View style={styles.aiAssistContainer}>
          <NoteAIAssist
            selectedText={selectedText}
            onClose={toggleAiAssist}
            onApplyEdit={handleApplyEdit}
            noteId={isNewNote && noteId ? noteId : id}
            noteContent={content}
            themeColors={colors}
            isDarkMode={isDark}
          />
        </View>
      )}
    </View>
  );
} 