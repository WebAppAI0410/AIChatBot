import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, Pressable, ActivityIndicator, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { XStack, YStack, Text, Button } from 'tamagui';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
// @ts-ignore - react-i18nextの型定義がないため
import { useTranslation } from 'react-i18next';
import { useNoteStore } from '../store/noteStore';
import Header from '../components/Header';
import { useColors } from '../constants/colors';
import { useTheme } from '../ui/ThemeProvider';
import { Swipeable } from 'react-native-gesture-handler';

/**
 * ノート一覧画面
 * フォルダ階層構造で表示、ヘッダーに新規作成ボタンを配置
 */
export default function NotesScreen() {
  const { t = (key: string) => key } = useTranslation ? useTranslation() : { t: (key: string) => key };
  const router = useRouter();
  const { 
    notes, folders, currentFolder, isLoading, error,
    initNoteModule, navigateToFolder, createFolder, deleteFolder, deleteNote, updateFolder
  } = useNoteStore();
  const colors = useColors();
  const { theme } = useTheme();
  
  const [isListView, setIsListView] = useState(true);
  const [newFolderId, setNewFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const newFolderInputRef = useRef<TextInput>(null);
  const searchInputRef = useRef<TextInput>(null);
  const swipeableRefs = useRef<{[key: string]: Swipeable | null}>({});
  
  // 初期化
  useEffect(() => {
    initNoteModule();
  }, [initNoteModule]);
  
  // 現在のフォルダ名を取得
  const currentFolderName = useCallback(() => {
    if (showSearch) return '検索';
    if (!currentFolder) return t('notes_list', 'ノート一覧');
    const folder = folders.find(f => f.id === currentFolder);
    return folder ? folder.name : t('notes_list', 'ノート一覧');
  }, [currentFolder, folders, showSearch, t]);
  
  // 検索フィルタリング
  const filterItems = useCallback((items: any[]) => {
    if (!searchQuery.trim()) return items;
    
    const query = searchQuery.toLowerCase();
    return items.filter(item => {
      if (item.type === 'folder') {
        return item.name.toLowerCase().includes(query);
      } else {
        // ノートの場合は、タイトルと内容両方を検索
        const titleMatch = item.title.toLowerCase().includes(query);
        const contentMatch = item.content.toLowerCase().includes(query);
        return titleMatch || contentMatch;
      }
    });
  }, [searchQuery]);
  
  // 現在のフォルダのアイテム（フォルダとノート）を取得
  const items = useCallback(() => {
    let folderItems = [];
    let noteItems = [];
    
    if (showSearch && searchQuery.trim()) {
      // 検索モードの場合、全階層から検索
      folderItems = folders
        .filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .map(f => ({ ...f, type: 'folder' as const }));
        
      noteItems = notes
        .filter(n => {
          const titleMatch = n.title.toLowerCase().includes(searchQuery.toLowerCase());
          const contentMatch = n.content.toLowerCase().includes(searchQuery.toLowerCase());
          return titleMatch || contentMatch;
        })
        .map(n => ({ ...n, type: 'note' as const }));
    } else {
      // 通常モードの場合、現在のフォルダのみ表示
      folderItems = folders
        .filter(f => f.parent_id === currentFolder)
        .map(f => ({ ...f, type: 'folder' as const }));
        
      noteItems = notes
        .filter(n => n.folder_id === currentFolder)
        .map(n => ({ ...n, type: 'note' as const }));
    }
    
    // フォルダを先に、次に名前でソート
    return [...folderItems, ...noteItems].sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      // フォルダはname、ノートはtitleで比較
      const aName = a.type === 'folder' ? a.name : a.title;
      const bName = b.type === 'folder' ? b.name : b.title;
      return aName.localeCompare(bName);
    });
  }, [folders, notes, currentFolder, showSearch, searchQuery]);

  // 検索モードの切り替え
  const toggleSearch = useCallback(() => {
    if (showSearch) {
      setShowSearch(false);
      setSearchQuery('');
    } else {
      setShowSearch(true);
      setTimeout(() => {
        if (searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    }
  }, [showSearch]);
  
  // アイテムタップ処理
  const handleItemPress = useCallback((item: { type: 'folder' | 'note', id: string, name?: string, title?: string }) => {
    if (item.type === 'folder') {
      // 編集中のフォルダの場合は、編集モードを終了してから移動
      if (newFolderId === item.id) {
        handleFolderNameSubmit();
      }
      // 検索モードの場合は検索を終了してからフォルダに移動
      if (showSearch) {
        setShowSearch(false);
        setSearchQuery('');
      }
      navigateToFolder(item.id);
    } else {
      router.push(`/notes/${item.id}`);
    }
  }, [navigateToFolder, router, newFolderId, showSearch]);
  
  // 新規ノート作成
  const handleCreateNote = useCallback(() => {
    router.push('/notes/new');
  }, [router]);
  
  // 新規フォルダ作成
  const handleCreateFolder = useCallback(async () => {
    try {
      const folder = await createFolder(t('untitled_folder', '無題のフォルダ'));
      setNewFolderId(folder.id);
      setEditingFolderName(folder.name);
    
      // フォーカスを当てるためにタイマーを使用（レンダリング完了後）
      setTimeout(() => {
        if (newFolderInputRef.current) {
          newFolderInputRef.current.focus();
        }
      }, 100);
    } catch (error) {
      console.error('フォルダ作成エラー:', error);
    }
  }, [createFolder, t]);
  
  // フォルダ名の編集確定
  const handleFolderNameSubmit = useCallback(() => {
    if (newFolderId && editingFolderName.trim()) {
      updateFolder(newFolderId, editingFolderName.trim());
    }
    setNewFolderId(null);
    setEditingFolderName('');
  }, [newFolderId, editingFolderName, updateFolder]);
  
  // アイテム削除処理
  const handleDelete = useCallback((item: { type: 'folder' | 'note', id: string, name?: string, title?: string }) => {
    const itemName = item.type === 'folder' ? item.name : item.title;
    const confirmMessage = item.type === 'folder' 
      ? t('delete_folder_confirm', `フォルダ「${itemName}」を削除しますか？\nフォルダ内のすべてのノートも削除されます。`)
      : t('delete_note_confirm', `ノート「${itemName}」を削除しますか？`);
    
    Alert.alert(
      t('confirm_delete', '削除の確認'),
      confirmMessage,
      [
        {
          text: t('cancel', 'キャンセル'),
          style: 'cancel'
        },
        {
          text: t('delete', '削除'),
          style: 'destructive',
          onPress: async () => {
            try {
              if (item.type === 'folder') {
                await deleteFolder(item.id);
              } else {
                await deleteNote(item.id);
              }
            } catch (error) {
              console.error('削除エラー:', error);
              Alert.alert(t('error', 'エラー'), t('delete_failed', '削除に失敗しました'));
            }
          }
        }
      ]
    );
  }, [deleteFolder, deleteNote, t]);
  
  // 親フォルダへ戻る
  const handleBack = useCallback(() => {
    if (showSearch) {
      setShowSearch(false);
      setSearchQuery('');
      return;
    }
    
    if (!currentFolder) return;
    
    const parentFolder = folders.find(f => f.id === currentFolder)?.parent_id || null;
    navigateToFolder(parentFolder);
  }, [currentFolder, folders, navigateToFolder, showSearch]);
  
  // 削除スワイプアクションのレンダリング
  const renderRightActions = useCallback((item: { type: 'folder' | 'note', id: string }) => {
    return (
      <TouchableOpacity
        style={[styles.deleteAction, { backgroundColor: colors.error }]}
        onPress={() => handleDelete(item)}
      >
        <Feather name="trash-2" size={24} color="#fff" />
      </TouchableOpacity>
    );
  }, [handleDelete, colors]);
  
  // Swipeableのrefを設定する関数
  const setSwipeableRef = useCallback((ref: Swipeable | null, key: string) => {
    swipeableRefs.current[key] = ref;
  }, []);
  
  // ヘッダーの右側に表示するコンポーネント
  const headerRightComponent = (
    <View style={styles.headerRightContainer}>
      {!showSearch && (
        <>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleCreateNote}
            accessibilityLabel={t('new_note', '新規ノート')}
          >
            <Feather name="edit-3" size={22} color={colors.textOnPrimary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.headerButton}
            onPress={handleCreateFolder}
            accessibilityLabel={t('new_folder', '新規フォルダ')}
          >
            <View>
              <MaterialIcons name="folder" size={22} color={colors.textOnPrimary} />
              <View style={styles.folderPlusIcon}>
                <Feather name="plus" size={12} color={colors.textOnPrimary} />
              </View>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => setIsListView(!isListView)}
            accessibilityLabel={isListView ? t('grid_view', 'グリッド表示') : t('list_view', 'リスト表示')}
          >
            {isListView 
              ? <MaterialIcons name="grid-view" size={22} color={colors.textOnPrimary} />
              : <MaterialIcons name="list" size={22} color={colors.textOnPrimary} />
            }
          </TouchableOpacity>
        </>
      )}
      
      <TouchableOpacity
        style={styles.headerButton}
        onPress={toggleSearch}
        accessibilityLabel={showSearch ? '検索を閉じる' : '検索'}
      >
        <Feather name="search" size={22} color={colors.textOnPrimary} />
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
          {(!!currentFolder || showSearch) && (
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
          {showSearch ? (
            <TextInput
              ref={searchInputRef}
              style={[styles.searchInput, { color: colors.textOnPrimary }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="ノートを検索..."
              placeholderTextColor={colors.textOnPrimary + '80'}
              autoFocus
            />
          ) : (
            <Text style={styles.headerTitle} color={colors.textOnPrimary}>
              {currentFolderName()}
            </Text>
          )}
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
            {t('retry', '再試行')}
          </Button>
        </View>
      ) : items().length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text fontSize="$4" fontWeight="600" color={colors.darkGray}>
            {showSearch && searchQuery.trim() 
              ? '検索結果が見つかりませんでした'
              : currentFolder 
                ? t('empty_folder', 'フォルダは空です') 
                : t('no_notes', 'ノートがありません')
            }
          </Text>
          {!showSearch && (
            <Button 
              mt="$4" 
              onPress={handleCreateNote}
              backgroundColor={colors.primary}
              color={colors.textOnPrimary}
            >
              <XStack space="$2" alignItems="center">
                <Feather name="edit-3" size={18} color={colors.textOnPrimary} />
                <Text color={colors.textOnPrimary}>{t('create_new', '新規作成')}</Text>
              </XStack>
            </Button>
          )}
        </View>
      ) : (
        <FlatList
          data={items()}
          keyExtractor={item => `${item.type}-${item.id}`}
          renderItem={({ item }) => {
            const itemKey = `${item.type}-${item.id}`;
            return (
              <Swipeable
                ref={(ref) => setSwipeableRef(ref, itemKey)}
                renderRightActions={() => renderRightActions(item)}
                overshootRight={false}
                onSwipeableOpen={() => {
                  // 他のスワイプ可能なアイテムを閉じる
                  Object.entries(swipeableRefs.current).forEach(([key, ref]) => {
                    if (key !== itemKey && ref) {
                      ref.close();
                    }
                  });
                }}
              >
            <Pressable 
                  style={[styles.item, { borderBottomColor: colors.border }]} 
              onPress={() => handleItemPress(item)}
            >
                  <XStack alignItems="center" space="$3" flex={1}>
                {item.type === 'folder' ? (
                      <MaterialIcons name="folder" size={24} color={colors.primary} />
                ) : (
                      <MaterialIcons name="description" size={24} color={colors.primary} />
                    )}
                    
                    {item.type === 'folder' && newFolderId === item.id ? (
                      <TextInput
                        ref={newFolderInputRef}
                        style={[styles.folderNameInput, { color: colors.text }]}
                        value={editingFolderName}
                        onChangeText={setEditingFolderName}
                        onBlur={handleFolderNameSubmit}
                        onSubmitEditing={handleFolderNameSubmit}
                        selectTextOnFocus
                        autoFocus
                      />
                    ) : (
                      <YStack flex={1}>
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
                        {showSearch && searchQuery.trim() && item.type === 'note' && (
                          <Text 
                            fontSize="$2" 
                            color={colors.secondaryText}
                            numberOfLines={1}
                          >
                            {item.content.replace(/<[^>]*>/g, '').substring(0, 100)}...
                          </Text>
                        )}
                </YStack>
                    )}
              </XStack>
            </Pressable>
              </Swipeable>
            );
          }}
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
  searchInput: {
    width: '90%',
    fontSize: 16,
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.5)',
    textAlign: 'center',
  },
  headerRightContainer: {
    width: 140, // 3つのボタンを収める幅
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingRight: 12,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  folderPlusIcon: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 8,
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  item: {
    padding: 16,
    borderBottomWidth: 1,
    backgroundColor: 'transparent',
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
  deleteAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
  },
  folderNameInput: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
});
