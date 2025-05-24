import React, { useEffect, useState, useRef } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View, Image, TextInput, Keyboard, Alert } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import useColors from '../constants/colors';
import theme from '../ui/theme';
import SwipeableRow from '../components/SwipeableRow';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';
import { Chat } from '../store/chatStore';
import IconSelectModal from '../components/IconSelectModal';
import Header from '../components/Header';
import SharedLayout from '../components/SharedLayout';
import useResponsive from '../hooks/useResponsive';
import SelectionHeader from '../components/SelectionHeader';
import PullToSearchContainer from '../components/PullToSearchContainer';

export default function ChatsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { layout } = useResponsive();
  
  const chats = useStore(state => state.chats);
  const createChat = useStore(state => state.createChat);
  const deleteChat = useStore(state => state.deleteChat);
  const updateChatIcon = useStore(state => state.updateChatIcon);
  const updateChatTitle = useStore(state => state.updateChatTitle);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [showIconSelect, setShowIconSelect] = useState(false);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [iconEditChatId, setIconEditChatId] = useState<string | null>(null);
  
  // 編集状態
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  
  
  // 一括削除機能の状態
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedChatIds, setSelectedChatIds] = useState<Set<string>>(new Set());
  
  // 検索結果に基づいたチャットリスト
  const filteredChats = searchQuery 
    ? chats.filter(chat => 
        chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.messages.some(msg => 
          msg.content.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : chats;
  
  const sortedChats = [...filteredChats].sort((a, b) => {
    // 未読優先、次に更新日時の降順
    if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
    if (a.unreadCount === 0 && b.unreadCount > 0) return 1;
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  });
  
  const handleOpenChat = (chatId: string) => {
    if (layout.twoColumn) {
      // タブレット/デスクトップでは選択状態を更新して右側に表示
      setSelectedChatId(chatId);
    } else {
      // スマートフォンでは画面遷移
      router.push(`/chat/${chatId}`);
    }
  };
  
  const handleCreateNewChat = () => {
    // モデルIDを指定（デフォルトモデルを使用）
    const defaultModelId = 'openai/gpt-3.5-turbo';
    const newChatId = createChat(defaultModelId);
    
    if (layout.twoColumn) {
      // タブレット/デスクトップでは選択状態を更新
      setSelectedChatId(newChatId);
    } else {
      // スマートフォンでは画面遷移
      router.push(`/chat/${newChatId}`);
    }
  };
  
  const handleDeleteConfirm = () => {
    if (chatToDelete) {
      deleteChat(chatToDelete);
      setShowDeleteDialog(false);
      setChatToDelete(null);
      
      // 削除したチャットが選択中だった場合、選択を解除
      if (selectedChatId === chatToDelete) {
        setSelectedChatId(null);
      }
    }
  };
  
  const handleIconSelect = (icon: { iconType: 'default' | 'custom'; iconId?: string; iconUri?: string }) => {
    if (iconEditChatId) {
      updateChatIcon(iconEditChatId, icon);
      setShowIconSelect(false);
      setIconEditChatId(null);
    }
  };
  
  // アイコン編集を開始
  const openIconEditor = (chatId: string) => {
    setIconEditChatId(chatId);
    setShowIconSelect(true);
  };
  
  // タイトル編集開始
  const startEditing = (chatId: string, title: string) => {
    setEditingChatId(chatId);
    setEditTitle(title);
  };
  
  // タイトル編集保存
  const saveEditing = () => {
    if (editingChatId && editTitle.trim()) {
      updateChatTitle(editingChatId, editTitle.trim());
      setEditingChatId(null);
      setEditTitle('');
    }
  };
  
  // 選択されたチャット
  const selectedChat = chats.find(chat => chat.id === selectedChatId);
  const iconEditChat = chats.find(chat => chat.id === iconEditChatId);
  
  // 新しい検索ハンドラー
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleCancelSearch = () => {
    setSearchQuery('');
  };
  
  // チャットを開く処理
  const handleSelectChat = (chatId: string) => {
    handleOpenChat(chatId);
  };
  
  
  // 選択モード切り替え
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedChatIds(new Set());
  };
  
  // チャット選択切り替え
  const toggleChatSelection = (chatId: string) => {
    const newSelection = new Set(selectedChatIds);
    if (newSelection.has(chatId)) {
      newSelection.delete(chatId);
    } else {
      newSelection.add(chatId);
    }
    setSelectedChatIds(newSelection);
  };
  
  // 全選択/全解除
  const toggleSelectAll = () => {
    if (selectedChatIds.size === sortedChats.length) {
      setSelectedChatIds(new Set());
    } else {
      setSelectedChatIds(new Set(sortedChats.map(chat => chat.id)));
    }
  };
  
  // 選択したチャットを一括削除
  const handleBulkDelete = () => {
    if (selectedChatIds.size === 0) return;
    
    Alert.alert(
      '一括削除の確認',
      `選択した ${selectedChatIds.size} 件のチャットを削除しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: '削除', 
          style: 'destructive',
          onPress: () => {
            selectedChatIds.forEach(chatId => {
              deleteChat(chatId);
            });
            setSelectedChatIds(new Set());
            setIsSelectionMode(false);
            if (selectedChatIds.has(selectedChatId || '')) {
              setSelectedChatId(null);
            }
          }
        }
      ]
    );
  };
  
  // チャットリスト表示用コンポーネント
  const ChatsList = () => (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 選択モードヘッダー */}
      {isSelectionMode && (
        <SelectionHeader
          selectedCount={selectedChatIds.size}
          totalCount={sortedChats.length}
          onCancel={toggleSelectionMode}
          onSelectAll={toggleSelectAll}
          onDelete={handleBulkDelete}
          itemType="チャット"
        />
      )}

      {/* 通常のヘッダー */}
      {!isSelectionMode && (
        <Header
          title="Home"
          showBack={false}
          rightComponent={
            <TouchableOpacity onPress={toggleSelectionMode}>
              <Ionicons name="checkmark-circle-outline" size={24} color={colors.textOnPrimary} />
            </TouchableOpacity>
          }
        />
      )}

      {/* プルツーサーチコンテナー */}
      <PullToSearchContainer
        onSearch={handleSearch}
        searchValue={searchQuery}
        onChangeText={setSearchQuery}
        placeholder="チャットを検索..."
      >
      
      {/* チャットリスト */}
      <View style={styles.listWrapper}>
        {sortedChats.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
              {searchQuery ? 'チャットが見つかりませんでした' : 'チャットがありません'}
            </Text>
            <TouchableOpacity 
              style={[styles.newChatButton, { backgroundColor: colors.primary }]}
              onPress={handleCreateNewChat}
            >
              <Ionicons name="add" size={24} color={colors.background} />
              <Text style={[styles.newChatButtonText, { color: colors.background }]}>
                新しいチャットを作成
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={sortedChats}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContent}
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
              autoscrollToTopThreshold: 10,
            }}
            removeClippedSubviews={false}
            renderItem={({ item }) => (
              <SwipeableRow
                onDelete={() => {
                  setChatToDelete(item.id);
                  setShowDeleteDialog(true);
                }}
              >
                <TouchableOpacity
                  style={[
                    styles.chatItem, 
                    { backgroundColor: colors.card },
                    selectedChatId === item.id && styles.selectedChatItem,
                    selectedChatIds.has(item.id) && styles.bulkSelectedChatItem
                  ]}
                  onPress={() => isSelectionMode ? toggleChatSelection(item.id) : handleOpenChat(item.id)}
                  activeOpacity={0.7}
                >
                  {/* 選択モード時のチェックボックス */}
                  {isSelectionMode && (
                    <View style={styles.checkboxContainer}>
                      <Ionicons 
                        name={selectedChatIds.has(item.id) ? "checkmark-circle" : "radio-button-off"} 
                        size={24} 
                        color={selectedChatIds.has(item.id) ? colors.primary : colors.gray} 
                      />
                    </View>
                  )}
                  <TouchableOpacity 
                    style={styles.chatIconContainer}
                    onPress={() => openIconEditor(item.id)}
                  >
                    {item.iconType === 'custom' && item.iconUri ? (
                      <Image 
                        source={{ uri: item.iconUri }} 
                        style={{ width: 28, height: 28, borderRadius: 14 }} 
                      />
                    ) : (
                      <Ionicons 
                        name={(item.iconId as keyof typeof Ionicons.glyphMap) ?? 'chatbubbles-outline'} 
                        size={24} 
                        color={colors.primary} 
                      />
                    )}
                  </TouchableOpacity>
                  <View style={styles.chatInfo}>
                    <View style={styles.chatTitleRow}>
                      {editingChatId === item.id ? (
                        <View style={styles.editTitleContainer}>
                          <TextInput
                            style={[styles.editTitleInput, { color: colors.text, backgroundColor: `${colors.card}80` }]}
                            value={editTitle}
                            onChangeText={setEditTitle}
                            onSubmitEditing={saveEditing}
                            onBlur={() => setEditingChatId(null)}
                            autoFocus
                            selectTextOnFocus
                          />
                          <TouchableOpacity onPress={saveEditing}>
                            <Ionicons name="checkmark" size={20} color={colors.primary} />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <>
                          <Text 
                            style={[
                              styles.chatTitle, 
                              { color: colors.text },
                              item.unreadCount > 0 && styles.unreadText
                            ]}
                            numberOfLines={1}
                          >
                            {item.title}
                          </Text>
                          <TouchableOpacity 
                            style={styles.editButton}
                            onPress={() => startEditing(item.id, item.title)}
                          >
                            <Ionicons name="pencil-outline" size={18} color={colors.gray} />
                          </TouchableOpacity>
                          {item.unreadCount > 0 && (
                            <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                              <Text style={[styles.unreadBadgeText, { color: colors.background }]}>新着</Text>
                            </View>
                          )}
                        </>
                      )}
                    </View>
                    <Text 
                      style={[styles.chatPreview, { color: colors.secondaryText }]}
                      numberOfLines={2}
                    >
                      {item.messages.length > 0 
                        ? item.messages[item.messages.length - 1].content.substring(0, 60) 
                        : '新しいチャット'}
                    </Text>
                  </View>
                  <Text style={[styles.chatTime, { color: colors.gray }]}>
                    {new Date(item.updatedAt).toLocaleDateString('ja-JP')}
                  </Text>
                </TouchableOpacity>
              </SwipeableRow>
            )}
          />
        )}
      </View>
      </PullToSearchContainer>
    </View>
  );
  
  // チャット詳細表示用コンポーネント
  const ChatPreview = () => {
    if (!selectedChat) {
      return (
        <View style={styles.noChatSelected}>
          <Ionicons name="chatbubbles-outline" size={64} color={colors.lightGray} />
          <Text style={[styles.noChatSelectedText, { color: colors.secondaryText }]}>
            チャットを選択してください
          </Text>
          <Text style={[styles.noChatSelectedSubtext, { color: colors.gray }]}>
            左側のリストからチャットを選んで開始
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <Header
          title={selectedChat.title}
          showBack={false}
          rightComponent={
            <TouchableOpacity
              style={styles.openChatButton}
              onPress={() => router.push(`/chat/${selectedChat.id}`)}
            >
              <Text style={{ color: colors.textOnPrimary }}>チャット開始</Text>
              <Ionicons name="chatbubble-ellipses" size={16} color={colors.textOnPrimary} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          }
        />
        
        <View style={styles.chatPreviewContent}>
          {selectedChat.messages.length > 0 ? (
            <FlatList
              data={selectedChat.messages}
              keyExtractor={(_, index) => `preview-${index}`}
              renderItem={({ item }) => (
                <View style={[
                  styles.previewMessageContainer,
                  { justifyContent: item.role === 'user' ? 'flex-end' : 'flex-start' }
                ]}>
                  <View style={[
                    styles.previewMessage,
                    { 
                      backgroundColor: item.role === 'user' ? colors.primary : colors.card,
                      maxWidth: '85%',
                      alignSelf: item.role === 'user' ? 'flex-end' : 'flex-start'
                    }
                  ]}>
                    <Text style={{ 
                      color: item.role === 'user' ? colors.textOnPrimary : colors.text,
                      fontSize: 15,
                      lineHeight: 22
                    }}>
                      {item.content}
                    </Text>
                  </View>
                </View>
              )}
              contentContainerStyle={styles.previewMessageList}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyPreviewContainer}>
              <View style={styles.emptyPreviewContent}>
                <View style={styles.chatIconLarge}>
                  {selectedChat.iconType === 'custom' && selectedChat.iconUri ? (
                    <Image 
                      source={{ uri: selectedChat.iconUri }} 
                      style={{ width: 48, height: 48, borderRadius: 24 }} 
                    />
                  ) : (
                    <Ionicons 
                      name={(selectedChat.iconId as keyof typeof Ionicons.glyphMap) ?? 'chatbubbles-outline'} 
                      size={40} 
                      color={colors.primary} 
                    />
                  )}
                </View>
                <Text style={[styles.emptyPreviewTitle, { color: colors.text }]}>
                  {selectedChat.title}
                </Text>
                <Text style={[styles.emptyPreviewSubtitle, { color: colors.secondaryText }]}>
                  このチャットではまだ会話が始まっていません
                </Text>
                <TouchableOpacity
                  style={[styles.startChatButton, { backgroundColor: colors.primary }]}
                  onPress={() => router.push(`/chat/${selectedChat.id}`)}
                >
                  <Text style={{ color: colors.textOnPrimary, fontWeight: '600' }}>
                    会話を開始
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  };
  
  // 動的スタイルを定義
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    listWrapper: {
      flex: 1,
    },
    listContent: {
      paddingBottom: 20,
    },
    chatItem: {
      flexDirection: 'row',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.lightGray,
    },
    selectedChatItem: {
      backgroundColor: `${colors.primary}10`,
    },
    bulkSelectedChatItem: {
      backgroundColor: `${colors.primary}15`,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    checkboxContainer: {
      paddingRight: 12,
      justifyContent: 'center',
    },
    chatIconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: `${colors.primary}20`,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    defaultIcon: {
      width: 24,
      height: 24,
      tintColor: colors.primary,
    },
    chatInfo: {
      flex: 1,
      marginRight: 8,
    },
    chatTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
    },
    chatTitle: {
      fontSize: 16,
      fontWeight: '500',
      flex: 1,
    },
    editButton: {
      padding: 4,
      marginLeft: 4,
    },
    editTitleContainer: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    editTitleInput: {
      flex: 1,
      padding: 4,
      borderRadius: 4,
      marginRight: 4,
      fontSize: 16,
    },
    unreadText: {
      fontWeight: 'bold',
    },
    unreadBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 10,
      marginLeft: 8,
    },
    unreadBadgeText: {
      fontSize: 11,
      fontWeight: 'bold',
    },
    chatPreview: {
      fontSize: 14,
    },
    chatTime: {
      fontSize: 12,
      marginTop: 4,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
      backgroundColor: colors.background,
    },
    emptyText: {
      fontSize: 16,
      marginBottom: 24,
    },
    newChatButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 8,
    },
    newChatButtonText: {
      marginLeft: 8,
      fontSize: 16,
      fontWeight: '500',
    },
    // 選択モード用スタイル
    checkboxContainer: {
      paddingRight: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    bulkSelectedChatItem: {
      backgroundColor: `${colors.primary}15`,
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
    },
    selectedChatItem: {
      backgroundColor: `${colors.primary}10`,
    },
    // 2カラムレイアウト用のスタイル
    noChatSelected: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
      padding: 32,
    },
    noChatSelectedText: {
      marginTop: 16,
      fontSize: 18,
      fontWeight: '600',
      textAlign: 'center',
    },
    noChatSelectedSubtext: {
      marginTop: 8,
      fontSize: 14,
      textAlign: 'center',
    },
    chatPreviewContent: {
      flex: 1,
      backgroundColor: colors.background,
    },
    chatPreviewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 24,
      padding: 16,
      backgroundColor: colors.card,
      borderRadius: 12,
    },
    chatIconLarge: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: `${colors.primary}20`,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    previewTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    chatPreviewTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    chatPreviewInfo: {
      fontSize: 14,
    },
    previewMessageList: {
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    previewMessageContainer: {
      flexDirection: 'row',
      marginBottom: 12,
    },
    previewMessage: {
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 18,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    emptyPreviewContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 32,
    },
    emptyPreviewContent: {
      alignItems: 'center',
      maxWidth: 300,
    },
    emptyPreviewTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 8,
    },
    emptyPreviewSubtitle: {
      fontSize: 16,
      textAlign: 'center',
      marginBottom: 24,
      lineHeight: 22,
    },
    startChatButton: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 24,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
    openChatButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
    },
  });

  return (
    <>
      <SharedLayout
        sidebarContent={<ChatsList />}
        mainContent={
          layout.twoColumn ? (
            <ChatPreview />
          ) : (
            <>
              <Stack.Screen options={{ headerShown: false }} />
              <ChatsList />
            </>
          )
        }
      />
      
      {/* 確認ダイアログと選択モーダル */}
      <DeleteConfirmDialog
        visible={showDeleteDialog}
        onDismiss={() => setShowDeleteDialog(false)}
        onConfirm={handleDeleteConfirm}
      />
      
      <IconSelectModal
        visible={showIconSelect}
        onClose={() => {
          setShowIconSelect(false);
          setIconEditChatId(null);
        }}
        onSelectIcon={handleIconSelect}
        currentIconType={iconEditChat?.iconType || 'default'}
        currentIconId={iconEditChat?.iconId}
        currentIconUri={iconEditChat?.iconUri}
      />
    </>
  );
}
