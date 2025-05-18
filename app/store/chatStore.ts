import { StateCreator } from 'zustand';
// import { v4 as uuidv4 } from 'uuid';

// Hermesエンジン対応のUUID生成関数
export const generateUuid = (): string => {
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
  addMessage: (chatId: string, message: { content: string; role: 'user' | 'assistant' | 'system'; id?: string; imageUrl?: string }) => void;
  addImageMessage: (chatId: string, params: { content: string; imageUrl: string; role: 'user' | 'assistant' }) => void;
  replaceMessage: (chatId: string, messageId: string, newMessage: Omit<Message, 'id' | 'timestamp' | 'isRead'>) => void;
  updateChatTitle: (chatId: string, title: string) => void;
  updateChatModel: (chatId: string, modelId: string) => void;
  updateChatIcon: (chatId: string, icon: { iconType: 'default' | 'custom'; iconId?: string; iconUri?: string }) => void;
  deleteChat: (chatId: string) => void;
  confirmDeleteChat: (chatId: string) => void;
  cancelDeleteChat: () => void;
  setCurrentChat: (chatId: string | null) => void;
  markChatAsRead: (chatId: string) => void;
  getLastUsedModel: () => string;
  
  // メッセージアクション関連
  selectedMessageId: string | null;
  isActionSheetVisible: boolean;
  selectMessage: (messageId: string) => void;
  clearSelectedMessage: () => void;
  getSelectedMessage: () => Message | undefined;
}

// メッセージ追加の共通ロジック
const appendMessageToChat = (
  state: ChatState, 
  chatId: string, 
  messageContent: { content: string; role: 'user' | 'assistant' | 'system'; id?: string; imageUrl?: string }, 
  idPrefix: string = ''
): ChatState => {
  const messageId = messageContent.id || `${idPrefix}${generateUuid()}`;
  const { id, ...restContent } = messageContent; // idを抽出して除外

  const newMessage: Message = {
    id: messageId,
    ...restContent,
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
  replaceMessage: (chatId, messageId, newMessage) => {
    set((state) => {
      // 指定したチャットのメッセージを見つけて置き換える
      const updatedChats = state.chats.map((chat) => {
        if (chat.id === chatId) {
          const updatedMessages = chat.messages.map((msg) => {
            if (msg.id === messageId) {
              // 新しいメッセージで置き換え（IDとタイムスタンプは保持）
              return {
                ...newMessage,
                id: msg.id,
                timestamp: msg.timestamp,
                isRead: msg.isRead,
              };
            }
            return msg;
          });
          
          return {
            ...chat,
            messages: updatedMessages,
            updatedAt: Date.now(),
          };
        }
        return chat;
      });
      
      if (__DEV__) {
        console.log(`Message replaced - ChatID: ${chatId}, MessageID: ${messageId}`);
      }
      
      return { ...state, chats: updatedChats };
    });
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
  getLastUsedModel: () => {
    // 現在のチャットIDからモデルを取得
    const currentChatId = get().currentChatId;
    if (currentChatId) {
      const currentChatModel = get().chats.find(chat => chat.id === currentChatId)?.modelId;
      if (currentChatModel) return currentChatModel;
    }
    
    // 現在のチャットがない場合は、最も最近更新されたチャットからモデルを取得
    const chats = get().chats;
    if (chats.length > 0) {
      // 更新日時の降順でソート
      const sortedChats = [...chats].sort((a, b) => b.updatedAt - a.updatedAt);
      return sortedChats[0].modelId;
    }
    
    // デフォルトモデル
    return 'gpt-3.5-turbo';
  },
  selectedMessageId: null,
  isActionSheetVisible: false,
  selectMessage: (messageId) => {
    set({ selectedMessageId: messageId });
  },
  clearSelectedMessage: () => {
    set({ selectedMessageId: null });
  },
  getSelectedMessage: () => {
    const currentChatId = get().currentChatId;
    if (currentChatId) {
      const currentChat = get().chats.find(chat => chat.id === currentChatId);
      if (currentChat) {
        const selectedMessage = currentChat.messages.find(m => m.id === get().selectedMessageId);
        return selectedMessage;
      }
    }
    return undefined;
  },
});

export default createChatSlice;
