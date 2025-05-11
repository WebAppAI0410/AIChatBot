import React, { useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, TouchableOpacity, View, Image, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store';
import useColors from '../constants/colors';
import SwipeableRow from '../components/SwipeableRow';
import DeleteConfirmDialog from '../components/DeleteConfirmDialog';
import { Chat } from '../store/chatStore';
import IconSelectModal from '../components/IconSelectModal';

// Ioniconsのデフォルトアイコン名リスト（20種）
const DEFAULT_ICON_NAMES = [
  'chatbubble', 'person', 'bulb', 'book', 'rocket',
  'flame', 'star', 'heart', 'leaf', 'cloud',
  'planet', 'paw', 'cafe', 'musical-notes', 'camera',
  'game-controller', 'medal', 'umbrella', 'gift', 'bicycle',
];

export default function ChatsScreen() {
  const router = useRouter();
  const colors = useColors(); // 動的カラーを取得
  
  const chats = useStore(state => state.chats);
  const updateChatTitle = useStore(state => state.updateChatTitle);
  const confirmDeleteChat = useStore(state => state.confirmDeleteChat);
  const cancelDeleteChat = useStore(state => state.cancelDeleteChat);
  const deleteChat = useStore(state => state.deleteChat);
  const chatToDelete = useStore(state => state.chatToDelete);
  const isDeleteDialogVisible = useStore(state => state.isDeleteDialogVisible);
  const updateChatIcon = useStore(state => state.updateChatIcon);
  
  // 編集状態管理
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  
  // アイコン選択モーダル状態
  const [iconModalVisible, setIconModalVisible] = useState(false);
  const [iconEditTargetId, setIconEditTargetId] = useState<string | null>(null);
  
  const navigateToChat = (chatId: string) => {
    router.push(`/chat/${chatId}`);
  };

  const handleDelete = (chatId: string) => {
    confirmDeleteChat(chatId);
  };

  const confirmDelete = () => {
    if (chatToDelete) {
      deleteChat(chatToDelete);
    }
  };

  const startEdit = (chat: Chat) => {
    setEditingId(chat.id);
    setEditTitle(chat.title);
  };
  const saveEdit = (chat: Chat) => {
    if (editTitle.trim() && editTitle !== chat.title) {
      updateChatTitle(chat.id, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  const openIconModal = (chatId: string) => {
    setIconEditTargetId(chatId);
    setIconModalVisible(true);
  };
  const closeIconModal = () => {
    setIconModalVisible(false);
    setIconEditTargetId(null);
  };
  const handleSelectIcon = (icon: { iconType: 'default' | 'custom'; iconId?: string; iconUri?: string }) => {
    if (iconEditTargetId) {
      updateChatIcon(iconEditTargetId, icon);
    }
  };

  // 動的スタイルを定義
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    listContent: {
      padding: 16,
    },
    chatItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.lightGray,
      backgroundColor: colors.background,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.lightGray,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    chatInfo: {
      flex: 1,
    },
    chatTitle: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 4,
      color: colors.text,
    },
    chatPreview: {
      fontSize: 14,
      color: colors.secondaryText,
    },
    unreadBadge: {
      backgroundColor: colors.primary,
      borderRadius: 12,
      minWidth: 24,
      height: 24,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 6,
    },
    unreadText: {
      color: colors.background,
      fontSize: 12,
      fontWeight: 'bold',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    emptyText: {
      fontSize: 18,
      fontWeight: 'bold',
      marginTop: 16,
      marginBottom: 8,
      color: colors.text,
    },
    emptySubtext: {
      fontSize: 14,
      textAlign: 'center',
      color: colors.secondaryText,
    },
  });

  const renderChatItem = ({ item }: { item: Chat }) => (
    <SwipeableRow onDelete={() => handleDelete(item.id)}>
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => navigateToChat(item.id)}
        activeOpacity={0.8}
      >
        <TouchableOpacity style={styles.avatar} onPress={() => openIconModal(item.id)} activeOpacity={0.7}>
          {item.iconType === 'custom' && item.iconUri ? (
            <Image source={{ uri: item.iconUri }} style={{ width: 40, height: 40, borderRadius: 20 }} />
          ) : (
            <Ionicons name={item.iconId as any || 'chatbubble'} size={24} color={colors.primary} />
          )}
        </TouchableOpacity>
        <View style={styles.chatInfo}>
          {editingId === item.id ? (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TextInput
                value={editTitle}
                onChangeText={setEditTitle}
                style={[styles.chatTitle, { flex: 1, backgroundColor: colors.lightGray, borderRadius: 6, paddingHorizontal: 6 }]}
                autoFocus
                onSubmitEditing={() => saveEdit(item)}
                returnKeyType="done"
                maxLength={50}
              />
              <TouchableOpacity
                onPress={() => saveEdit(item)}
                style={{ marginLeft: 8, padding: 8 }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="checkmark" size={22} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={{ flex: 1 }}>
                <Text
                  style={styles.chatTitle}
                  numberOfLines={2}
                  ellipsizeMode="tail"
                >
                  {item.title}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => startEdit(item)}
                style={{ marginLeft: 6, padding: 8 }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="pencil-outline" size={18} color={colors.gray} />
              </TouchableOpacity>
              {item.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{item.unreadCount}</Text>
                </View>
              )}
            </View>
          )}
          <Text style={styles.chatPreview} numberOfLines={1}>
            {item.messages.length > 0 
              ? item.messages[item.messages.length - 1].content.slice(0, 50) 
              : 'New conversation'}
          </Text>
        </View>
      </TouchableOpacity>
    </SwipeableRow>
  );

  return (
    <View style={styles.container}>
      {chats.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="chatbubbles-outline" size={64} color={colors.gray} />
          <Text style={styles.emptyText}>No chats yet</Text>
          <Text style={styles.emptySubtext}>
            Start a new conversation from the New Chat tab
          </Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          keyExtractor={(item) => item.id}
          renderItem={renderChatItem}
          contentContainerStyle={styles.listContent}
        />
      )}
      
      <DeleteConfirmDialog
        visible={isDeleteDialogVisible}
        onDismiss={cancelDeleteChat}
        onConfirm={confirmDelete}
      />
      <IconSelectModal
        visible={iconModalVisible}
        onClose={closeIconModal}
        onSelectIcon={handleSelectIcon}
        currentIconType={(() => {
          const chat = chats.find(c => c.id === iconEditTargetId);
          return chat?.iconType || 'default';
        })()}
        currentIconId={(() => {
          const chat = chats.find(c => c.id === iconEditTargetId);
          return chat?.iconId;
        })()}
        currentIconUri={(() => {
          const chat = chats.find(c => c.id === iconEditTargetId);
          return chat?.iconUri;
        })()}
      />
    </View>
  );
}
