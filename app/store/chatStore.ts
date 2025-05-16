import { StateCreator } from 'zustand';
// import { v4 as uuidv4 } from 'uuid';

// Hermesエンジン対応のUUID生成関数
const generateUuid = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isRead?: boolean;
  imageUrl?: string;  // 画像メッセージの場合のURL
};

export type Chat = {
  id: string;
  title: string;
  messages: Message[];
  modelId: string;
  createdAt: number;
  updatedAt: number;
  unreadCount: number;
  iconType: 'default' | 'custom';
  iconId?: string;
  iconUri?: string;
};

export interface ChatState {
  chats: Chat[];
  currentChatId: string | null;
  chatToDelete: string | null;
  isDeleteDialogVisible: boolean;
  createChat: (modelId: string) => string;
  addMessage: (chatId: string, message: Omit<Message, 'id' | 'timestamp' | 'isRead'>) => void;
  addImageMessage: (chatId: string, params: { content: string; imageUrl: string; role: 'user' | 'assistant' }) => void;
  updateChatTitle: (chatId: string, title: string) => void;
  updateChatModel: (chatId: string, modelId: string) => void;
  updateChatIcon: (chatId: string, icon: { iconType: 'default' | 'custom'; iconId?: string; iconUri?: string }) => void;
  deleteChat: (chatId: string) => void;
  confirmDeleteChat: (chatId: string) => void;
  cancelDeleteChat: () => void;
  setCurrentChat: (chatId: string | null) => void;
  markChatAsRead: (chatId: string) => void;
}

// メッセージ追加の共通ロジック
const appendMessageToChat = (state: ChatState, chatId: string, messageContent: Omit<Message, 'id' | 'timestamp' | 'isRead'>, idPrefix: string = ''): ChatState => {
  const newMessage: Message = {
    id: `${idPrefix}${generateUuid()}`,
    ...messageContent,
    timestamp: Date.now(),
    isRead: false, // デフォルトで未読に設定
  };

  const updatedChats = state.chats.map((chat) => {
    if (chat.id === chatId) {
      const updatedChat: Chat = {
        ...chat,
        messages: [...chat.messages, newMessage],
        updatedAt: Date.now(),
        unreadCount: newMessage.role === 'assistant' ? chat.unreadCount + 1 : chat.unreadCount,
      };

      // ユーザーの最初のメッセージでタイトルを自動生成
      if (newMessage.role === 'user' && chat.messages.filter(m => m.role === 'user').length === 0) {
        const cleanContent = newMessage.content.trim().replace(/\s+/g, ' ');
        updatedChat.title = cleanContent.length > 30 ? `${cleanContent.slice(0, 30)}…` : cleanContent;
      }
      return updatedChat;
    }
    return chat;
  });

  if (__DEV__) {
    console.log(`Message added - ChatID: ${chatId}, Role: ${newMessage.role}, MessageID: ${newMessage.id}`);
    console.log(`Total messages: ${updatedChats.find(c => c.id === chatId)?.messages.length || 0}`);
  }

  return { ...state, chats: updatedChats };
};

export const createChatSlice: StateCreator<
  ChatState,
  [],
  [],
  ChatState
> = (set, get) => ({
  chats: [],
  currentChatId: null,
  chatToDelete: null,
  isDeleteDialogVisible: false,
  createChat: (modelId) => {
    const id = generateUuid(); // チャットIDもuuidに変更
    const newChat: Chat = {
      id,
      title: 'New Chat',
      messages: [],
      modelId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      unreadCount: 0,
      iconType: 'default',
      iconId: 'chatbubble',
    };
    
    set((state) => ({
      chats: [newChat, ...state.chats],
      currentChatId: id,
    }));
    
    return id;
  },
  addMessage: (chatId, message) => {
    set((state) => appendMessageToChat(state, chatId, message));
  },
  addImageMessage: (chatId, { content, imageUrl, role }) => {
    set((state) => appendMessageToChat(state, chatId, { content, imageUrl, role }, 'img_'));
  },
  updateChatTitle: (chatId, title) => {
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat.id === chatId ? { ...chat, title } : chat
      ),
    }));
  },
  updateChatModel: (chatId, modelId) => {
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat.id === chatId ? { ...chat, modelId } : chat
      ),
    }));
  },
  updateChatIcon: (chatId, icon) => {
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat.id === chatId ? { ...chat, ...icon } : chat
      ),
    }));
  },
  confirmDeleteChat: (chatId) => {
    set({ chatToDelete: chatId, isDeleteDialogVisible: true });
  },
  cancelDeleteChat: () => {
    set({ chatToDelete: null, isDeleteDialogVisible: false });
  },
  deleteChat: (chatId) => {
    set((state) => {
      const filteredChats = state.chats.filter((chat) => chat.id !== chatId);
      const newCurrentChatId = state.currentChatId === chatId
        ? filteredChats.length > 0 ? filteredChats[0].id : null
        : state.currentChatId;
      
      if (__DEV__) {
        console.log(`Chat deleted - ChatID: ${chatId}`);
      }
      
      return {
        chats: filteredChats,
        currentChatId: newCurrentChatId,
        chatToDelete: null,
        isDeleteDialogVisible: false,
      };
    });
  },
  setCurrentChat: (chatId) => {
    set({ currentChatId: chatId });
  },
  markChatAsRead: (chatId) => {
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat.id === chatId ? { ...chat, unreadCount: 0, messages: chat.messages.map(m => ({ ...m, isRead: true })) } : chat
      ),
    }));
  },
});

export default createChatSlice;
