import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, TextInput, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { XStack, YStack, Text, Button, ScrollView, Input } from 'tamagui';
import { ArrowLeft, Star, Tag, Plus, X, Undo, Redo } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useNoteStore } from '../store/noteStore';
import WebViewEditor from '../components/note/WebViewEditor';
import NoteAIAssist from '../components/note/NoteAIAssist';
import { Tag as TagType } from '../services/sqlite';
import { useColors } from '../constants/colors';
import { useColorScheme } from 'react-native';

export default function NoteScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNewNote = id === 'new';
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  // WebViewEditorへの参照を作成
  const editorRef = useRef<any>(null);
  
  const { 
    getNoteById, createNote, updateNote, currentFolder,
    getTagsForNote, addTagToNote, removeTagFromNote, loadTags, createTag, tags
  } = useNoteStore();
  
  // ノートの状態
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [showAiAssist, setShowAiAssist] = useState(false);
  const [noteTags, setNoteTags] = useState<TagType[]>([]);
  const [showTagInput, setShowTagInput] = useState(false);
  const [newTagName, setNewTagName] = useState('');
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
      loadNoteTags();
    } else {
      // ノートが見つからない場合は一覧に戻る
      router.replace('/notes');
    }
    
    // すべてのタグを読み込む
    loadAllTags();
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

  // ノートのタグを読み込む
  const loadNoteTags = useCallback(async () => {
    if (isNewNote) return;
    
    try {
      const tags = await getTagsForNote(id);
      setNoteTags(tags);
    } catch (error) {
      console.error('タグ読み込みエラー:', error);
    }
  }, [id, isNewNote, getTagsForNote]);

  // すべてのタグを読み込む
  const loadAllTags = useCallback(async () => {
    try {
      await loadTags();
    } catch (error) {
      console.error('全タグ読み込みエラー:', error);
    }
  }, [loadTags]);

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


  // AIアシストトグル
  const toggleAiAssist = useCallback(() => {
    setShowAiAssist(prev => !prev);
    if (showAiAssist) {
      setSelectedText('');
    }
  }, [showAiAssist]);

  // テキスト編集適用
  const handleApplyEdit = useCallback(
    (editedText: string) => {
      handleContentChange(editedText);
    },
    [handleContentChange]
  );

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

  // タグ追加
  const handleAddTag = useCallback(async () => {
    if (!newTagName.trim()) return;
    
    const targetId = isNewNote && noteId ? noteId : id;
    if (!targetId) return;
    
    try {
      // 既存タグをチェック
      let tagId = '';
      const existingTag = tags.find(tag => tag.name.toLowerCase() === newTagName.trim().toLowerCase());
      
      if (existingTag) {
        tagId = existingTag.id;
      } else {
        // 新しいタグを作成
        tagId = await createTag(newTagName.trim());
        // 全タグリストを更新
        loadAllTags();
      }
      
      // ノートにタグを追加
      await addTagToNote(targetId, tagId);
      
      // ノートのタグリストを更新
      loadNoteTags();
      setNewTagName('');
      setShowTagInput(false);
    } catch (error) {
      console.error('タグ追加エラー:', error);
    }
  }, [newTagName, isNewNote, noteId, id, tags, createTag, addTagToNote, loadNoteTags, loadAllTags]);

  // タグ削除
  const handleRemoveTag = useCallback(async (tagId: string) => {
    const targetId = isNewNote && noteId ? noteId : id;
    if (!targetId) return;
    
    try {
      await removeTagFromNote(targetId, tagId);
      loadNoteTags();
    } catch (error) {
      console.error('タグ削除エラー:', error);
    }
  }, [isNewNote, noteId, id, removeTagFromNote, loadNoteTags]);

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
        
        <View style={styles.editButtonsContainer}>
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleUndo}
            accessibilityLabel="操作を取り消す"
          >
            <Undo size={22} color={colors.textOnPrimary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleRedo}
            accessibilityLabel="操作をやり直す"
          >
            <Redo size={22} color={colors.textOnPrimary} />
          </TouchableOpacity>
        </View>
        
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
    tagsContainer: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.background,
    },
    tagItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    tagText: {
      color: colors.textOnPrimary,
      fontSize: 14,
      marginRight: 4,
    },
    tagRemoveButton: {
      width: 16,
      height: 16,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    addTagButton: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.primary,
      borderRadius: 16,
      paddingHorizontal: 12,
      paddingVertical: 6,
    },
    addTagText: {
      color: colors.primary,
      fontSize: 14,
      marginLeft: 4,
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
          <View style={styles.tagsContainer}>
            <XStack flexWrap="wrap" gap={8} alignItems="center">
              {noteTags.map(tag => (
                <View key={tag.id} style={styles.tagItem}>
                  <Text style={styles.tagText}>{tag.name}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveTag(tag.id)}
                    style={styles.tagRemoveButton}
                  >
                    <X size={12} color={colors.textOnPrimary} />
                  </TouchableOpacity>
                </View>
              ))}
              
              {!showTagInput ? (
                <TouchableOpacity
                  style={styles.addTagButton}
                  onPress={() => setShowTagInput(true)}
                >
                  <Plus size={16} color={colors.primary} />
                  <Text style={styles.addTagText}>{t('add_tag')}</Text>
                </TouchableOpacity>
              ) : (
                <XStack alignItems="center" gap={8} width="100%">
                  <Input
                    flex={1}
                    size="$3"
                    placeholder={t('enter_tag_name')}
                    value={newTagName}
                    onChangeText={setNewTagName}
                    autoFocus
                    onSubmitEditing={handleAddTag}
                  />
                  <Button size="$3" onPress={handleAddTag}>{t('add')}</Button>
                  <Button 
                    size="$3" 
                    variant="outlined" 
                    onPress={() => {
                      setShowTagInput(false);
                      setNewTagName('');
                    }}
                  >
                    {t('cancel')}
                  </Button>
                </XStack>
              )}
            </XStack>
          </View>
          
          <WebViewEditor
            ref={editorRef}
            content={content}
            onContentChange={handleContentChange}
            themeColors={colors}
          />
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* AIアシストドロワー */}
      {showAiAssist && (
        <View style={styles.aiAssistContainer}>
          <NoteAIAssist
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