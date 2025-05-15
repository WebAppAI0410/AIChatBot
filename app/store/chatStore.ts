import { StateCreator } from 'zustand';

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
  addMessage: (chatId: string, message: Omit<Message, 'id' | 'timestamp'>) => void;
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
    const id = Date.now().toString();
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
    set((state) => {
      console.log(`Adding message - ChatID: ${chatId}, Role: ${message.role}`);
      
      const newMessage: Message = {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        ...message,
        timestamp: Date.now(),
      };
      
      const updatedChats = state.chats.map((chat) => {
        if (chat.id === chatId) {
          const updatedChat: Chat = {
            ...chat,
            messages: [...chat.messages, newMessage],
            updatedAt: Date.now(),
            unreadCount: message.role === 'assistant' ? chat.unreadCount + 1 : chat.unreadCount,
          };
          
          if (message.role === 'user' && chat.messages.filter(m => m.role === 'user').length === 0) {
            updatedChat.title = message.content.slice(0, 30) + (message.content.length > 30 ? '...' : '');
          }
          
          return updatedChat;
        }
        return chat;
      });
      
      console.log(`Message added - ChatID: ${chatId}, Total messages: ${
        updatedChats.find(c => c.id === chatId)?.messages.length || 0
      }`);
      
      return { chats: updatedChats };
    });
  },
  addImageMessage: (chatId, { content, imageUrl, role }) => {
    set((state) => {
      console.log(`Adding image message - ChatID: ${chatId}, Role: ${role}`);
      
      const newMessage: Message = {
        id: `img_${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        role,
        content,
        imageUrl,
        timestamp: Date.now(),
      };
      
      const updatedChats = state.chats.map((chat) => {
        if (chat.id === chatId) {
          return {
            ...chat,
            messages: [...chat.messages, newMessage],
            updatedAt: Date.now(),
            unreadCount: role === 'assistant' ? chat.unreadCount + 1 : chat.unreadCount,
          };
        }
        return chat;
      });
      
      return { chats: updatedChats };
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
      
      console.log(`Chat deleted - ChatID: ${chatId}`);
      
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
