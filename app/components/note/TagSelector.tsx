import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { XStack, Text, Button, Input } from 'tamagui';
import { X, Plus, Check, Tag as TagIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useNoteStore } from '../../store/noteStore';
import { Tag } from '../../services/sqlite';
import useColors from '../../constants/colors';

export type TagSelectorProps = {
  noteId: string;
  onTagsChanged?: () => void;
};

const TagSelector: React.FC<TagSelectorProps> = ({ noteId, onTagsChanged }) => {
  const { t } = useTranslation();
  const colors = useColors();
  const { getTagsForNote, loadTags, tags, addTagToNote, removeTagFromNote, createTag } = useNoteStore();
  
  const [noteTags, setNoteTags] = useState<Tag[]>([]);
  const [showInput, setShowInput] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [showTagList, setShowTagList] = useState(false);
  
  // 初期データロード
  useEffect(() => {
    loadNoteTags();
    loadTags();
  }, [noteId]);
  
  // ノートのタグを読み込む
  const loadNoteTags = useCallback(async () => {
    try {
      const tags = await getTagsForNote(noteId);
      setNoteTags(tags);
    } catch (error) {
      console.error('タグ読み込みエラー:', error);
    }
  }, [noteId, getTagsForNote]);
  
  // タグ追加
  const handleAddTag = useCallback(async () => {
    if (!newTagName.trim()) return;
    
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
        await loadTags();
      }
      
      // ノートにタグを追加
      await addTagToNote(noteId, tagId);
      
      // ノートのタグリストを更新
      await loadNoteTags();
      setNewTagName('');
      setShowInput(false);
      setShowTagList(false);
      
      if (onTagsChanged) {
        onTagsChanged();
      }
    } catch (error) {
      console.error('タグ追加エラー:', error);
    }
  }, [newTagName, noteId, tags, createTag, addTagToNote, loadNoteTags, loadTags, onTagsChanged]);
  
  // タグ削除
  const handleRemoveTag = useCallback(async (tagId: string) => {
    try {
      await removeTagFromNote(noteId, tagId);
      await loadNoteTags();
      
      if (onTagsChanged) {
        onTagsChanged();
      }
    } catch (error) {
      console.error('タグ削除エラー:', error);
    }
  }, [noteId, removeTagFromNote, loadNoteTags, onTagsChanged]);
  
  // 既存タグを選択
  const handleSelectExistingTag = useCallback(async (tag: Tag) => {
    // すでに追加されているタグは追加しない
    if (noteTags.some(t => t.id === tag.id)) {
      return;
    }
    
    try {
      await addTagToNote(noteId, tag.id);
      await loadNoteTags();
      setShowTagList(false);
      
      if (onTagsChanged) {
        onTagsChanged();
      }
    } catch (error) {
      console.error('既存タグ追加エラー:', error);
    }
  }, [noteId, noteTags, addTagToNote, loadNoteTags, onTagsChanged]);
  
  // 表示用フィルタリング - ノートにまだ追加されていないタグを取得
  const availableTags = tags.filter(tag => !noteTags.some(noteTag => noteTag.id === tag.id));
  
  return (
    <View style={styles.container}>
      <XStack flexWrap="wrap" gap={8} alignItems="center">
        {/* タグ一覧 */}
        {noteTags.map(tag => (
          <View key={tag.id} style={[styles.tagBadge, { backgroundColor: colors.primary }]}>
            <XStack alignItems="center" gap={4}>
              <Text color={colors.textOnPrimary}>{tag.name}</Text>
              <TouchableOpacity onPress={() => handleRemoveTag(tag.id)}>
                <X size={12} color={colors.textOnPrimary} />
              </TouchableOpacity>
            </XStack>
          </View>
        ))}
        
        {/* タグ追加ボタン */}
        {!showInput && !showTagList && (
          <TouchableOpacity 
            style={[styles.addButton, { borderColor: colors.primary }]}
            onPress={() => setShowTagList(true)}
          >
            <XStack alignItems="center" gap={4}>
              <Plus size={14} color={colors.primary} />
              <Text color={colors.primary}>{t('add_tag')}</Text>
            </XStack>
          </TouchableOpacity>
        )}
      </XStack>
      
      {/* 既存タグリスト */}
      {showTagList && (
        <View style={[styles.tagListContainer, { borderColor: colors.border, backgroundColor: colors.background }]}>
          <XStack justifyContent="space-between" alignItems="center" paddingBottom={8}>
            <Text fontWeight="bold">{t('select_tag')}</Text>
            <Button
              size="$2"
              onPress={() => setShowInput(true)}
              icon={<Plus size={14} />}
            >
              {t('new_tag')}
            </Button>
          </XStack>
          
          {availableTags.length > 0 ? (
            <ScrollView style={styles.tagList}>
              {availableTags.map(tag => (
                <TouchableOpacity
                  key={tag.id}
                  style={styles.tagItem}
                  onPress={() => handleSelectExistingTag(tag)}
                >
                  <XStack alignItems="center" gap={8}>
                    <TagIcon size={14} color={colors.primary} />
                    <Text>{tag.name}</Text>
                  </XStack>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <Text color={colors.gray} padding={12}>{t('no_more_tags')}</Text>
          )}
          
          <Button
            size="$2"
            variant="outlined"
            marginTop={8}
            onPress={() => setShowTagList(false)}
          >
            {t('cancel')}
          </Button>
        </View>
      )}
      
      {/* 新規タグ入力 */}
      {showInput && (
        <View style={[styles.inputContainer, { borderColor: colors.border, backgroundColor: colors.background }]}>
          <Text fontWeight="bold" marginBottom={8}>{t('new_tag')}</Text>
          <Input
            size="$3"
            placeholder={t('enter_tag_name')}
            value={newTagName}
            onChangeText={setNewTagName}
            autoFocus
          />
          <XStack gap={8} marginTop={8}>
            <Button
              size="$2"
              icon={<Check size={14} />}
              onPress={handleAddTag}
              disabled={!newTagName.trim()}
              flex={1}
            >
              {t('add')}
            </Button>
            <Button
              size="$2"
              variant="outlined"
              icon={<X size={14} />}
              onPress={() => {
                setShowInput(false);
                setNewTagName('');
                setShowTagList(true);
              }}
              flex={1}
            >
              {t('cancel')}
            </Button>
          </XStack>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    position: 'relative',
  },
  tagBadge: {
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  addButton: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagListContainer: {
    marginTop: 12,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    maxHeight: 200,
  },
  tagList: {
    maxHeight: 120,
  },
  tagItem: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  inputContainer: {
    marginTop: 12,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
});

export default TagSelector; 