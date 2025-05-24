import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, Pressable, ActivityIndicator, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { XStack, YStack, Text, Button } from 'tamagui';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
// @ts-ignore - react-i18nextの型定義がないため
import { useTranslation } from 'react-i18next';
import { useNoteStore } from '../store/noteStore';
import Header from '../components/Header';
import useColors from '../constants/colors';
import { useTheme } from '../ui/ThemeProvider';
import { Swipeable } from 'react-native-gesture-handler';
import SelectionHeader from '../components/SelectionHeader';
import PullToSearchContainer from '../components/PullToSearchContainer';
import ViewModeHeader from '../components/ViewModeHeader';
import NoteCard from '../components/NoteCard';
import FolderCard from '../components/FolderCard';
import BreadcrumbNavigation from '../components/BreadcrumbNavigation';
import { generateBreadcrumb } from '../utils/noteUtils';

// 動的スタイル生成関数
const createStyles = (colors: any) => StyleSheet.create({
  container: { flex: 1 },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 12,
    height: 96,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
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
    width: 140,
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
  selectedItem: {
    backgroundColor: `${colors.primary}15`,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  deleteAction: { justifyContent: 'center', alignItems: 'center', width: 80 },
  folderNameInput: { flex: 1, fontSize: 16, padding: 0 },
  listContent: { paddingBottom: 20 },
  gridContent: { padding: 16, paddingBottom: 20 },
  gridRow: { justifyContent: 'space-between', paddingHorizontal: 0 },
});

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
  
  // 動的スタイルを生成
  const styles = createStyles(colors);
  
  const [isListView, setIsListView] = useState(true);
  const [newFolderId, setNewFolderId] = useState<string | null>(null);
  const [editingFolderName, setEditingFolderName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const newFolderInputRef = useRef<TextInput>(null);
  const swipeableRefs = useRef<{[key: string]: Swipeable | null}>({});
  
  // 一括削除機能の状態
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set());
  
  // 初期化
  useEffect(() => {
    initNoteModule();
  }, [initNoteModule]);
  
  // 現在のフォルダ名を取得
  const currentFolderName = useCallback(() => {
    if (searchQuery.trim()) return '検索';
    if (!currentFolder) return t('notes_list', 'ノート一覧');
    const folder = folders.find(f => f.id === currentFolder);
    return folder ? folder.name : t('notes_list', 'ノート一覧');
  }, [currentFolder, folders, searchQuery, t]);
  
  // 検索フィルタリング
  const filteredData = useCallback(() => {
    if (!searchQuery.trim()) {
      return { folders, notes };
    }
    const query = searchQuery.toLowerCase();
    return {
      folders: folders.filter(folder => 
        folder.name.toLowerCase().includes(query)
      ),
      notes: notes.filter(note => 
        note.title.toLowerCase().includes(query) ||
        note.content.toLowerCase().includes(query)
      )
    };
  }, [folders, notes, searchQuery]);
  
  // 表示用のアイテムリスト
  const displayItems = useCallback(() => {
    const { folders: filteredFolders, notes: filteredNotes } = filteredData();
    
    // 検索時は階層を無視
    if (searchQuery.trim()) {
      const items = [
        ...filteredFolders.map(folder => ({ type: 'folder' as const, ...folder })),
        ...filteredNotes.map(note => ({ type: 'note' as const, ...note }))
      ];
      return items.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
        const aName = a.type === 'folder' ? a.name : a.title;
        const bName = b.type === 'folder' ? b.name : b.title;
        return aName.localeCompare(bName);
      });
    }
    
    // 通常時は現在のフォルダ内のアイテムのみ
    const folderItems = filteredFolders
      .filter(folder => folder.parent_id === currentFolder)
      .map(folder => ({ type: 'folder' as const, ...folder }));
    
    const noteItems = filteredNotes
      .filter(note => note.folder_id === currentFolder)
      .map(note => ({ type: 'note' as const, ...note }));
    
    // フォルダを先に、次に名前でソート
    return [...folderItems, ...noteItems].sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1;
      const aName = a.type === 'folder' ? a.name : a.title;
      const bName = b.type === 'folder' ? b.name : b.title;
      return aName.localeCompare(bName);
    });
  }, [folders, notes, currentFolder, searchQuery]);

  // 新しい検索ハンドラー
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCancelSearch = () => {
    setSearchQuery('');
  };

  
  // フォルダ名の編集確定
  const handleFolderNameSubmit = useCallback(() => {
    if (newFolderId && editingFolderName.trim()) {
      updateFolder(newFolderId, editingFolderName.trim());
    }
    setNewFolderId(null);
    setEditingFolderName('');
  }, [newFolderId, editingFolderName, updateFolder]);
  
  // アイテムタップ処理
  const handleItemPress = useCallback((item: { type: 'folder' | 'note', id: string, name?: string, title?: string }) => {
    if (isSelectionMode && item.type === 'note') {
      toggleNoteSelection(item.id);
      return;
    }
    
    if (item.type === 'folder') {
      if (newFolderId === item.id) {
        handleFolderNameSubmit();
        return;
      }
      if (searchQuery.trim()) {
        setSearchQuery('');
      }
      navigateToFolder(item.id);
    } else {
      router.push(`/notes/${item.id}`);
    }
  }, [navigateToFolder, router, newFolderId, searchQuery, isSelectionMode, handleFolderNameSubmit]);

  // フォルダ長押し処理（編集モード開始）
  const handleFolderLongPress = useCallback((folderId: string, folderName: string) => {
    setNewFolderId(folderId);
    setEditingFolderName(folderName);
    setTimeout(() => {
      if (newFolderInputRef.current) {
        newFolderInputRef.current.focus();
      }
    }, 100);
  }, []);
  
  // 選択モード切り替え
  const toggleSelectionMode = useCallback(() => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedNoteIds(new Set());
  }, [isSelectionMode]);
  
  // ノート選択切り替え
  const toggleNoteSelection = useCallback((noteId: string) => {
    setSelectedNoteIds(prevSelected => {
      const newSelection = new Set(prevSelected);
      if (newSelection.has(noteId)) {
        newSelection.delete(noteId);
      } else {
        newSelection.add(noteId);
      }
      return newSelection;
    });
  }, []);
  
  // 全選択/全解除
  const toggleSelectAllNotes = useCallback(() => {
    setSelectedNoteIds(prevSelected => {
      const visibleNotes = displayItems().filter(item => item.type === 'note');
      if (prevSelected.size === visibleNotes.length && visibleNotes.length > 0) {
        return new Set(); // 全解除
      } else {
        return new Set(visibleNotes.map(note => note.id)); // 全選択
      }
    });
  }, [displayItems]);
  
  // 選択したノートを一括削除
  const handleBulkDeleteNotes = useCallback(() => {
    if (selectedNoteIds.size === 0) return;
    
    Alert.alert(
      'ノートの一括削除',
      `選択した ${selectedNoteIds.size} 件のノートを削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: '削除', 
          style: 'destructive',
          onPress: () => {
            selectedNoteIds.forEach(noteId => {
              deleteNote(noteId);
            });
            setSelectedNoteIds(new Set());
            setIsSelectionMode(false);
          }
        }
      ]
    );
  }, [selectedNoteIds, deleteNote]);
  
  // 新規ノート作成
  const handleCreateNote = useCallback(() => {
    router.push('/notes/new');
  }, [router]);
  
  // 新規フォルダ作成
  const handleCreateFolder = useCallback(async () => {
    try {
      const newId = await createFolder(t('new_folder', '新しいフォルダ'), currentFolder);
      setNewFolderId(newId);
      setEditingFolderName(t('new_folder', '新しいフォルダ'));
      setTimeout(() => {
        if (newFolderInputRef.current) {
          newFolderInputRef.current.focus();
        }
      }, 100);
    } catch (error) {
      console.error('フォルダ作成エラー:', error);
    }
  }, [createFolder, currentFolder, t]);
  
  // アイテム削除処理
  const handleDelete = useCallback((item: { type: 'folder' | 'note', id: string, name?: string, title?: string }) => {
    const itemName = item.type === 'folder' ? item.name : item.title;
    const confirmMessage = item.type === 'folder' 
      ? t('delete_folder_confirm', `フォルダ「${itemName}」を削除しますか？\\nフォルダ内のすべてのノートも削除されます。`)
      : t('delete_note_confirm', `ノート「${itemName}」を削除しますか？`);
    
    Alert.alert(
      t('confirm_delete', '削除の確認'),
      confirmMessage,
      [
        { text: t('cancel', 'キャンセル'), style: 'cancel' },
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
            }
          }
        }
      ]
    );
  }, [deleteFolder, deleteNote, t]);
  
  // Swipeableの参照設定
  const setSwipeableRef = useCallback((ref: Swipeable | null, key: string) => {
    swipeableRefs.current[key] = ref;
  }, []);
  
  // パンくずリスト生成
  const getBreadcrumbItems = useCallback(() => {
    if (!currentFolder) {
      return [{ id: null, name: 'ホーム' }];
    }
    
    const breadcrumbNames = generateBreadcrumb(folders, currentFolder);
    const items = [{ id: null, name: 'ホーム' }];
    
    // Build full path with folder IDs
    let currentFolderId = currentFolder;
    const path = [];
    
    while (currentFolderId) {
      const folder = folders.find(f => f.id === currentFolderId);
      if (folder) {
        path.unshift(folder);
        currentFolderId = folder.parent_id;
      } else {
        break;
      }
    }
    
    return items.concat(path.map(folder => ({
      id: folder.id,
      name: folder.name
    })));
  }, [folders, currentFolder]);
  
  // 右スワイプアクション
  const renderRightActions = useCallback((item: { type: 'folder' | 'note', id: string, name?: string, title?: string }) => (
    <TouchableOpacity
      style={[styles.deleteAction, { backgroundColor: colors.error }]}
      onPress={() => handleDelete(item)}
    >
      <Feather name="trash-2" size={20} color={colors.background} />
    </TouchableOpacity>
  ), [styles.deleteAction, colors.error, colors.background, handleDelete]);
  
  // 戻るボタン処理
  const handleBack = useCallback(() => {
    if (searchQuery.trim()) {
      setSearchQuery('');
    } else if (currentFolder) {
      const parentFolder = folders.find(f => f.id === currentFolder)?.parent_id;
      navigateToFolder(parentFolder);
    }
  }, [currentFolder, folders, navigateToFolder, searchQuery]);
  
  // データのアイテム処理
  const items = useCallback(() => displayItems(), [displayItems]);

  // フォルダー内のノート数を取得
  const getFolderNoteCount = useCallback((folderId: string) => {
    return notes.filter(note => note.folder_id === folderId).length;
  }, [notes]);

  // フォルダーのパスを取得
  const getFolderPath = useCallback((folderId: string) => {
    const breadcrumbNames = generateBreadcrumb(folders, folderId);
    return breadcrumbNames.slice(0, -1); // Exclude current folder from path
  }, [folders]);

  // ギャラリー表示のレンダリング
  const renderGridItem = ({ item }: { item: any }) => {
    if (item.type === 'folder') {
      return (
        <TouchableOpacity
          onPress={() => handleItemPress(item)}
          onLongPress={() => handleFolderLongPress(item.id, item.name)}
          activeOpacity={0.7}
        >
          <FolderCard
            folder={item}
            isEditing={newFolderId === item.id}
            editingName={editingFolderName}
            onPress={() => {}} // FolderCard内では無効化
            onEdit={setEditingFolderName}
            onSubmitEdit={handleFolderNameSubmit}
            onBlurEdit={handleFolderNameSubmit}
            noteCount={getFolderNoteCount(item.id)}
            folderPath={getFolderPath(item.id)}
          />
        </TouchableOpacity>
      );
    } else {
      return (
        <NoteCard
          note={item}
          isSelected={selectedNoteIds.has(item.id)}
          isSelectionMode={isSelectionMode}
          onPress={() => handleItemPress(item)}
          onSelect={() => toggleNoteSelection(item.id)}
        />
      );
    }
  };

  // リスト表示のレンダリング
  const renderListItem = ({ item }: { item: any }) => {
    const itemKey = `${item.type}-${item.id}`;
    return (
      <Swipeable
        ref={(ref) => setSwipeableRef(ref, itemKey)}
        renderRightActions={() => renderRightActions(item)}
        overshootRight={false}
        onSwipeableOpen={() => {
          Object.entries(swipeableRefs.current).forEach(([key, ref]) => {
            if (key !== itemKey && ref) {
              ref.close();
            }
          });
        }}
      >
        <Pressable 
          style={[
            styles.item, 
            { borderBottomColor: colors.border },
            isSelectionMode && item.type === 'note' && selectedNoteIds.has(item.id) && styles.selectedItem
          ]} 
          onPress={() => handleItemPress(item)}
          onLongPress={item.type === 'folder' ? () => handleFolderLongPress(item.id, item.name) : undefined}
        >
          <XStack alignItems="center" space="$3" flex={1}>
            {/* 選択モード時のチェックボックス（ノートのみ） */}
            {isSelectionMode && item.type === 'note' && (
              <TouchableOpacity onPress={() => toggleNoteSelection(item.id)}>
                <Ionicons 
                  name={selectedNoteIds.has(item.id) ? "checkmark-circle" : "radio-button-off"} 
                  size={24} 
                  color={selectedNoteIds.has(item.id) ? colors.primary : colors.gray} 
                />
              </TouchableOpacity>
            )}
            
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
                <Text fontSize="$2" color={colors.secondaryText}>
                  {item.updated_at
                    ? new Date(item.updated_at).toLocaleDateString()
                    : ''}
                </Text>
                {searchQuery.trim() && item.type === 'note' && (
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
  };
  

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* 選択モードヘッダー */}
      {isSelectionMode && (
        <SelectionHeader
          selectedCount={selectedNoteIds.size}
          totalCount={displayItems().filter(item => item.type === 'note').length}
          onCancel={toggleSelectionMode}
          onSelectAll={toggleSelectAllNotes}
          onDelete={handleBulkDeleteNotes}
          itemType="ノート"
        />
      )}

      {/* 通常のヘッダー */}
      {!isSelectionMode && (
        <Header
          title={currentFolderName()}
          showBack={currentFolder !== null || !!searchQuery.trim()}
          onBackPress={handleBack}
        />
      )}

      {/* パンくずナビゲーション */}
      {!isSelectionMode && !searchQuery.trim() && (
        <BreadcrumbNavigation
          items={getBreadcrumbItems()}
          onNavigate={navigateToFolder}
        />
      )}

      {/* 表示切替とコントロールバー */}
      {!isSelectionMode && (
        <ViewModeHeader
          isListView={isListView}
          onToggleView={() => setIsListView(!isListView)}
          onToggleSelection={toggleSelectionMode}
          onCreateNote={handleCreateNote}
          onCreateFolder={handleCreateFolder}
          showCreateButtons={!searchQuery.trim()}
        />
      )}

      {/* プルツーサーチコンテナー */}
      <PullToSearchContainer
        onSearch={handleSearch}
        searchValue={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="ノートやフォルダを検索..."
      >
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ color: colors.text, marginTop: 16 }}>
            {t('loading', '読み込み中...')}
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={{ color: colors.error, marginBottom: 16 }}>
            {t('error_occurred', 'エラーが発生しました')}
          </Text>
          <Button 
            onPress={() => initNoteModule()}
            backgroundColor={colors.primary}
            color={colors.textOnPrimary}
          >
            {t('retry', '再試行')}
          </Button>
        </View>
      ) : items().length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text fontSize="$4" fontWeight="600" color={colors.darkGray}>
            {searchQuery.trim() 
              ? '検索結果が見つかりませんでした'
              : currentFolder 
                ? t('empty_folder', 'フォルダは空です') 
                : t('no_notes', 'ノートがありません')
            }
          </Text>
          {!searchQuery.trim() && (
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
          renderItem={isListView ? renderListItem : renderGridItem}
          numColumns={isListView ? 1 : 2}
          key={isListView ? 'list' : 'grid'}
          contentContainerStyle={isListView ? styles.listContent : styles.gridContent}
          columnWrapperStyle={!isListView ? styles.gridRow : undefined}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 10,
          }}
          removeClippedSubviews={false}
        />
      )}
      </PullToSearchContainer>
    </View>
  );
}