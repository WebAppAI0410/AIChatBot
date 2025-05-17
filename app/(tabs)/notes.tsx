import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, Pressable, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { XStack, YStack, Text, Button } from 'tamagui';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
// @ts-ignore - react-i18nextの型定義がないため
import { useTranslation } from 'react-i18next';
import { useNoteStore } from '../store/noteStore';
import Header from '../components/Header';
import theme from '../ui/theme';

/**
 * ノート一覧画面
 * フォルダ階層構造で表示し、新規ノート/フォルダ作成FABを備える
 */
export default function NotesScreen() {
  const { t = (key: string) => key } = useTranslation ? useTranslation() : { t: (key: string) => key };
  const router = useRouter();
  const { 
    notes, folders, currentFolder, isLoading, error,
    initNoteModule, navigateToFolder, createFolder
  } = useNoteStore();
  
  const [isListView, setIsListView] = useState(true);
  const [showCreateOptions, setShowCreateOptions] = useState(false);
  
  // 初期化
  useEffect(() => {
    initNoteModule();
  }, [initNoteModule]);
  
  // 現在のフォルダ名を取得
  const currentFolderName = useCallback(() => {
    if (!currentFolder) return t('notes');
    const folder = folders.find(f => f.id === currentFolder);
    return folder ? folder.name : t('notes');
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
  
  // 新規作成FAB
  const handleCreatePress = useCallback(() => {
    setShowCreateOptions(true);
  }, []);
  
  // 新規ノート作成
  const handleCreateNote = useCallback(() => {
    setShowCreateOptions(false);
    router.push('/notes/new');
  }, [router]);
  
  // 新規フォルダ作成
  const handleCreateFolder = useCallback(() => {
    setShowCreateOptions(false);
    
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
  
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      
      <Header
        title={currentFolderName()}
        showBack={!!currentFolder}
        onBackPress={handleBack}
        rightComponent={
          <Button
            icon={isListView ? <MaterialIcons name="grid-view" size={24} /> : <MaterialIcons name="list" size={24} />}
            onPress={() => setIsListView(!isListView)}
            aria-label={isListView ? t('grid_view') : t('list_view')}
          />
        }
      />
      
      {isLoading && items().length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text color="$red10" fontSize="$4">{error}</Text>
          <Button 
            mt="$4" 
            onPress={initNoteModule}
          >
            {t('retry')}
          </Button>
        </View>
      ) : items().length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text fontSize="$4" fontWeight="600" color="$gray10">
            {currentFolder ? t('empty_folder') : t('no_notes')}
          </Text>
          <Text fontSize="$2" color="$gray9" textAlign="center" mt="$2">
            {t('create_note_prompt')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={items()}
          keyExtractor={item => `${item.type}-${item.id}`}
          renderItem={({ item }) => (
            <Pressable 
              style={styles.item} 
              onPress={() => handleItemPress(item)}
            >
              <XStack alignItems="center" space="$3">
                {item.type === 'folder' ? (
                  <MaterialIcons name="folder" size={24} color="#007AFF" />
                ) : (
                  <MaterialIcons name="description" size={24} color="#007AFF" />
                )}
                <YStack>
                  <Text fontSize="$4">
                    {item.type === 'folder' ? item.name : item.title}
                  </Text>
                  <Text 
                    fontSize="$2" 
                    color="$gray10"
                  >
                    {new Date(item.updated_at).toLocaleDateString()}
                  </Text>
                </YStack>
              </XStack>
            </Pressable>
          )}
        />
      )}
      
      {/* FAB - 右下に配置（タブと重ならないように調整） */}
      <Pressable 
        style={styles.fab}
        onPress={handleCreatePress}
      >
        <MaterialIcons name="add" color="#fff" size={24} />
      </Pressable>
      
      {/* 新規作成オプション */}
      {showCreateOptions && (
        <View style={styles.createOptions}>
          <Button 
            icon={<MaterialIcons name="description" size={24} />}
            onPress={handleCreateNote}
            size="$3"
          >
            {t('new_note')}
          </Button>
          <Button 
            icon={<MaterialIcons name="folder" size={24} />}
            onPress={handleCreateFolder}
            size="$3"
            mt="$2"
          >
            {t('new_folder')}
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
    borderBottomColor: '#E5E5E5',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 80,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  createOptions: {
    position: 'absolute',
    right: 24,
    bottom: 150,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
});
