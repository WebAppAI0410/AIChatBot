import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Pressable, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { XStack, YStack, Text, Button } from 'tamagui';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
// @ts-ignore - react-i18nextの型定義がないため
import { useTranslation } from 'react-i18next';
import { useNoteStore } from '../store/noteStore';
import Header from '../components/Header';
import { useColors } from '../constants/colors';
import { useTheme } from '../ui/ThemeProvider';

/**
 * ノート一覧画面
 * フォルダ階層構造で表示、ヘッダーに新規作成ボタンを配置
 */
export default function NotesScreen() {
  const { t = (key: string) => key } = useTranslation ? useTranslation() : { t: (key: string) => key };
  const router = useRouter();
  const { 
    notes, folders, currentFolder, isLoading, error,
    initNoteModule, navigateToFolder, createFolder
  } = useNoteStore();
  const colors = useColors();
  const { theme } = useTheme();
  
  const [isListView, setIsListView] = useState(true);
  
  // 初期化
  useEffect(() => {
    initNoteModule();
  }, [initNoteModule]);
  
  // 現在のフォルダ名を取得
  const currentFolderName = useCallback(() => {
    if (!currentFolder) return t('notes_list', 'ノート一覧');
    const folder = folders.find(f => f.id === currentFolder);
    return folder ? folder.name : t('notes_list', 'ノート一覧');
  }, [currentFolder, folders, t]);
  
  // 現在のフォルダのアイテム（フォルダとノート）を取得
  const items = useCallback(() => {
    const folderItems = folders
      .filter(f => f.parent_id === currentFolder)
      .map(f => ({ ...f, type: 'folder' as const }));
      
    const noteItems = notes
      .filter(n => n.folder_id === currentFolder)
      .map(n => ({ ...n, type: 'note' as const }));
    
    // フォルダを先に、次に名前でソート
    return [...folderItems, ...noteItems].sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      // フォルダはname、ノートはtitleで比較
      const aName = a.type === 'folder' ? a.name : a.title;
      const bName = b.type === 'folder' ? b.name : b.title;
      return aName.localeCompare(bName);
    });
  }, [folders, notes, currentFolder]);
  
  // アイテムタップ処理
  const handleItemPress = useCallback((item: { type: 'folder' | 'note', id: string, name?: string, title?: string }) => {
    if (item.type === 'folder') {
      navigateToFolder(item.id);
    } else {
      router.push(`/notes/${item.id}`);
    }
  }, [navigateToFolder, router]);
  
  // 新規ノート作成
  const handleCreateNote = useCallback(() => {
    router.push('/notes/new');
  }, [router]);
  
  // 新規フォルダ作成
  const handleCreateFolder = useCallback(() => {
    // 現在のフォルダ内のフォルダ数を数える
    const folderCount = folders.filter(f => f.parent_id === currentFolder).length;
    
    createFolder(`${t('new_folder')} ${folderCount + 1}`);
  }, [createFolder, folders, currentFolder, t]);
  
  // 親フォルダへ戻る
  const handleBack = useCallback(() => {
    if (!currentFolder) return;
    
    const parentFolder = folders.find(f => f.id === currentFolder)?.parent_id || null;
    navigateToFolder(parentFolder);
  }, [currentFolder, folders, navigateToFolder]);
  
  // ヘッダーの右側に表示するコンポーネント
  const headerRightComponent = (
    <View style={styles.headerRightContainer}>
      <TouchableOpacity
        style={styles.headerButton}
        onPress={handleCreateNote}
        accessibilityLabel={t('new_note')}
      >
        <Feather name="edit-3" size={22} color={colors.textOnPrimary} />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.headerButton}
        onPress={() => setIsListView(!isListView)}
        accessibilityLabel={isListView ? t('grid_view') : t('list_view')}
      >
        {isListView 
          ? <MaterialIcons name="grid-view" size={22} color={colors.textOnPrimary} />
          : <MaterialIcons name="list" size={22} color={colors.textOnPrimary} />
        }
      </TouchableOpacity>
    </View>
  );
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      
      {/* カスタムスタイルでヘッダーを中央配置 */}
      <View style={[styles.headerContainer, { backgroundColor: colors.primary }]}>
        <View style={styles.headerLeftPlaceholder}>
          {!!currentFolder && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              accessibilityLabel={t('header.backButton', '戻る')}
            >
              <Ionicons name="chevron-back" size={24} color={colors.textOnPrimary} />
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} color={colors.textOnPrimary}>
            {currentFolderName()}
          </Text>
        </View>
        
        {headerRightComponent}
      </View>
      
      {isLoading && items().length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text color={colors.error} fontSize="$4">{error}</Text>
          <Button 
            mt="$4" 
            onPress={initNoteModule}
            backgroundColor={colors.primary}
          >
            {t('retry')}
          </Button>
        </View>
      ) : items().length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text fontSize="$4" fontWeight="600" color={colors.darkGray}>
            {currentFolder ? t('empty_folder', 'フォルダは空です') : 'ノートがありません'}
          </Text>
          <Button 
            mt="$4" 
            onPress={handleCreateNote}
            backgroundColor={colors.primary}
            color={colors.textOnPrimary}
          >
            <XStack space="$2" alignItems="center">
              <Feather name="edit-3" size={18} color={colors.textOnPrimary} />
              <Text color={colors.textOnPrimary}>新規作成</Text>
            </XStack>
          </Button>
        </View>
      ) : (
        <FlatList
          data={items()}
          keyExtractor={item => `${item.type}-${item.id}`}
          renderItem={({ item }) => (
            <Pressable 
              style={[styles.item, { borderBottomColor: colors.border }]} 
              onPress={() => handleItemPress(item)}
            >
              <XStack alignItems="center" space="$3">
                {item.type === 'folder' ? (
                  <MaterialIcons name="folder" size={24} color={colors.primary} />
                ) : (
                  <MaterialIcons name="description" size={24} color={colors.primary} />
                )}
                <YStack>
                  <Text fontSize="$4" color={colors.text}>
                    {item.type === 'folder' ? item.name : item.title}
                  </Text>
                  <Text 
                    fontSize="$2" 
                    color={colors.secondaryText}
                  >
                    {item.updated_at
                      ? new Date(item.updated_at).toLocaleDateString()
                      : ''}
                  </Text>
                </YStack>
              </XStack>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50, // ステータスバー分の余白
    paddingBottom: 12,
    height: 96, // ヘッダーの高さを固定
  },
  headerLeftPlaceholder: {
    width: 80,
    alignItems: 'flex-start',
    paddingLeft: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerRightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 80,
    justifyContent: 'flex-end',
    paddingRight: 12,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  item: {
    padding: 16,
    borderBottomWidth: 1,
  },
});
