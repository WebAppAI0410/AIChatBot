import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, KeyboardAvoidingView, ScrollView, Alert } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { RichText, Toolbar, useEditorBridge, TenTapStartKit, PlaceholderBridge } from '@10play/tentap-editor';
// import Placeholder from '@tiptap/extension-placeholder';
import { useNoteStore } from '../store/noteStore';
import { useTranslation } from 'react-i18next';
import { useColors, lightColors } from '../constants/colors';
import { Button, Text } from 'tamagui';
import { Ionicons } from '@expo/vector-icons';

// typeof を使って colors の型を定義
type AppColors = typeof lightColors;

const makeStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editorWrapper: {
    flex: 1,
    backgroundColor: colors.card,
  },
  editorScrollView: {
    flex: 1,
  },
  editorContent: {
    flex: 1,
    padding: 16,
    backgroundColor: colors.card,
    minHeight: 300,
  },
});

export default function NoteEditorScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const colors = useColors();
  const styles = makeStyles(colors);
  const { getNoteById, createNote, updateNote } = useNoteStore();

  const noteId = params.id === 'new' ? null : params.id as string;
  const [title, setTitle] = useState('');

  const editor = useEditorBridge({
    initialContent: '',
    bridgeExtensions: [
      ...TenTapStartKit,
      PlaceholderBridge.configureExtension({
        placeholder: t('editor_placeholder', 'ここにノート内容を入力...'),
        showOnlyCurrent: false,
      }),
    ],
  });

  const [initialContentLoaded, setInitialContentLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadNote = async () => {
      setIsLoading(true);
      if (noteId) {
        const note = getNoteById(noteId);
        if (note) {
          setTitle(note.title);
          editor.setContent(note.content);
        } else {
          Alert.alert(t('error', 'エラー'), t('note_not_found', 'ノートが見つかりませんでした。'));
          router.back();
        }
      } else {
        setTitle(t('new_note_title', '新規ノート'));
        editor.setContent('');
      }
      setInitialContentLoaded(true);
      setIsLoading(false);
    };
    if (editor) {
      loadNote();
    }
  }, [noteId, editor]);

  const handleSave = async () => {
    if (!editor) return;
    const content = await editor.getHTML();

    try {
      if (noteId) {
        await updateNote(noteId, { title, content });
      } else {
        const newNoteData = await createNote({ title, content });
        const newCreatedNoteId = typeof newNoteData === 'string' ? newNoteData : (newNoteData as any)?.id;
        if (newCreatedNoteId) {
          router.replace(`/notes/${newCreatedNoteId}`);
        } else {
          console.error('Failed to get new note ID after creation');
          router.back();
        }
      }
      Alert.alert(t('saved', '保存しました'));
    } catch (error) {
      console.error('Failed to save note:', error);
      Alert.alert(t('error', 'エラー'), t('save_failed', '保存に失敗しました。'));
    }
  };

  const handleBack = () => {
    router.push('/notes');
  };

  if (!editor || isLoading || !initialContentLoaded) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>{t('loading', '読み込み中...')}</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={[styles.container, { backgroundColor: colors.background }]}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen
        options={{
          title: noteId ? t('edit_note', 'ノート編集') : t('create_note', '新規ノート作成'),
          headerLeft: () => (
            <Button
              onPress={handleBack}
              size="$3"
              backgroundColor="transparent"
              paddingHorizontal="$2"
            >
              <Ionicons name="arrow-back" size={24} color={colors.primary} />
            </Button>
          ),
          headerRight: () => (
            <Button onPress={handleSave} size="$3" backgroundColor={colors.primary} color={colors.textOnPrimary}>
              {t('save', '保存')}
            </Button>
          ),
        }}
      />
      <View style={styles.editorWrapper}>
        <Toolbar editor={editor} />
        <ScrollView style={styles.editorScrollView}>
          <RichText
            editor={editor}
            style={styles.editorContent}
          />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
} 