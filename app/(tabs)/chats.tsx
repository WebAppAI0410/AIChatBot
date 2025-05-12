import React, { useEffect, useState, useRef } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View, Image, TextInput } from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import useColors from '../constants/colors';
import { theme } from '../ui/theme';
import SwipeableRow from '../components/SwipeableRow';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';
import { Chat } from '../store/chatStore';
import IconSelectModal from '../components/IconSelectModal';
import Header from '../components/Header';
import SharedLayout from '../components/SharedLayout';
import useResponsive from '../hooks/useResponsive';
import { useTheme } from '../ui/ThemeProvider';
import { SearchBar, SearchBarRef } from '../components/SearchComponents';

// Ioniconsのデフォルトアイコン名リスト（20種）
const DEFAULT_ICON_NAMES = [
  'chatbubble', 'person', 'bulb', 'book', 'rocket',
  'flame', 'star', 'heart', 'leaf', 'cloud',
  'planet', 'paw', 'cafe', 'musical-notes', 'camera',
  'game-controller', 'medal', 'umbrella', 'gift', 'bicycle',
];

export default function ChatsScreen() {
  const router = useRouter();
  const colors = useColors();
  const { layout } = useResponsive();
  const { theme: appTheme } = useTheme();
  
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
  
  const searchInputRef = useRef<TextInput>(null);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  // 検索結果に基づいたチャットリスト
  const filteredChats = searchQuery 
    ? chats.filter(chat => 
        chat.title.toLowerCase().includes(searchQuery.toLowerCase())
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
      // 大画面では選択状態を更新
      setSelectedChatId(chatId);
    } else {
      // 小画面では画面遷移
      router.push(`/chat/${chatId}`);
    }
  };
  
  const handleCreateNewChat = () => {
    // モデルIDを指定（デフォルトモデルを使用）
    const defaultModelId = 'openai/gpt-3.5-turbo';
    const newChatId = createChat(defaultModelId);
    router.push(`/chat/${newChatId}`);
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
  
  // 検索用コールバック
  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };
  
  // チャットを開く処理
  const handleSelectChat = (chatId: string) => {
    handleOpenChat(chatId);
  };
  
  // チャットリスト表示用コンポーネント
  const ChatsList = () => (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.searchContainer}>
        <SearchBar 
          placeholder="チャットを検索..."
          onSearch={handleSearch}
        />
      </View>
        
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
                  selectedChatId === item.id && styles.selectedChatItem
                ]}
                onPress={() => handleOpenChat(item.id)}
                activeOpacity={0.7}
              >
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
                      name={(item.iconId || "chatbubbles-outline") as any} 
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
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
  
  // チャット詳細表示用コンポーネント
  const ChatPreview = () => {
    if (!selectedChat) {
      return (
        <View style={styles.noChatSelected}>
          <Ionicons name="chatbubbles-outline" size={48} color={colors.lightGray} />
          <Text style={[styles.noChatSelectedText, { color: colors.secondaryText }]}>
            チャットを選択してください
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
              <Text style={{ color: colors.textOnPrimary }}>開く</Text>
              <Ionicons name="arrow-forward" size={16} color={colors.textOnPrimary} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          }
        />
        
        <View style={styles.chatPreviewContent}>
          <View style={styles.chatPreviewHeader}>
            <TouchableOpacity 
              style={styles.chatIconLarge}
              onPress={() => openIconEditor(selectedChat.id)}
            >
              {selectedChat.iconType === 'custom' && selectedChat.iconUri ? (
                <Image 
                  source={{ uri: selectedChat.iconUri }} 
                  style={{ width: 40, height: 40, borderRadius: 20 }} 
                />
              ) : (
                <Ionicons 
                  name={(selectedChat.iconId || "chatbubbles-outline") as any} 
                  size={32} 
                  color={colors.primary} 
                />
              )}
            </TouchableOpacity>
            <View>
              <View style={styles.previewTitleRow}>
                <Text style={[styles.chatPreviewTitle, { color: colors.text }]}>
                  {selectedChat.title}
                </Text>
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => startEditing(selectedChat.id, selectedChat.title)}
                >
                  <Ionicons name="pencil-outline" size={20} color={colors.gray} />
                </TouchableOpacity>
              </View>
              <Text style={[styles.chatPreviewInfo, { color: colors.secondaryText }]}>
                {selectedChat.messages.length}メッセージ · 
                {new Date(selectedChat.updatedAt).toLocaleDateString('ja-JP')}
              </Text>
            </View>
          </View>
          
          {selectedChat.messages.length > 0 ? (
            <FlatList
              data={selectedChat.messages.slice(-5)}
              keyExtractor={(_, index) => `preview-${index}`}
              renderItem={({ item }) => (
                <View style={[
                  styles.previewMessage,
                  { 
                    backgroundColor: item.role === 'user' ? `${colors.primary}20` : colors.card,
                    alignSelf: item.role === 'user' ? 'flex-end' : 'flex-start'
                  }
                ]}>
                  <Text style={{ color: colors.text }}>
                    {item.content.length > 150 
                      ? item.content.substring(0, 150) + '...' 
                      : item.content}
                  </Text>
                </View>
              )}
              contentContainerStyle={styles.previewMessageList}
            />
          ) : (
            <View style={styles.emptyPreviewContainer}>
              <Text style={{ color: colors.secondaryText }}>
                まだメッセージがありません
              </Text>
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
    listContent: {
      paddingBottom: 20,
    },
    searchContainer: {
      padding: 16,
      paddingBottom: 8,
      backgroundColor: colors.background,
    },
    searchInputWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 8,
      padding: 8,
      paddingHorizontal: 12,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      height: 36,
      color: colors.text,
      fontSize: 16,
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
    // 2カラムレイアウト用のスタイル
    noChatSelected: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    noChatSelectedText: {
      marginTop: 12,
      fontSize: 16,
    },
    chatPreviewContent: {
      flex: 1,
      padding: 16,
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
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: `${colors.primary}20`,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 16,
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
      padding: 16,
    },
    previewMessage: {
      padding: 12,
      borderRadius: 12,
      maxWidth: '80%',
      marginBottom: 12,
    },
    emptyPreviewContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
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
              <Header title="Home" showBack={false} />
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
