import { StateCreator } from 'zustand';

export type Message = {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  isRead?: boolean;
};

export type Chat = {
  id: string;
  title: string;
  messages: Message[];
  modelId: string;
  createdAt: number;
  updatedAt: number;
  unreadCount: number;
};

export interface ChatState {
  chats: Chat[];
  currentChatId: string | null;
  createChat: (modelId: string) => string;
  addMessage: (chatId: string, message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateChatTitle: (chatId: string, title: string) => void;
  deleteChat: (chatId: string) => void;
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
    };
    
    set((state) => ({
      chats: [newChat, ...state.chats],
      currentChatId: id,
    }));
    
    return id;
  },
  addMessage: (chatId, message) => {
    set((state) => {
      const chats = state.chats.map((chat) => {
        if (chat.id === chatId) {
          const newMessage: Message = {
            id: Date.now().toString(),
            ...message,
            timestamp: Date.now(),
          };
          
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
      
      return { chats };
    });
  },
  updateChatTitle: (chatId, title) => {
    set((state) => ({
      chats: state.chats.map((chat) =>
        chat.id === chatId ? { ...chat, title } : chat
      ),
    }));
  },
  deleteChat: (chatId) => {
    set((state) => {
      const filteredChats = state.chats.filter((chat) => chat.id !== chatId);
      const newCurrentChatId = state.currentChatId === chatId
        ? filteredChats.length > 0 ? filteredChats[0].id : null
        : state.currentChatId;
      
      return {
        chats: filteredChats,
        currentChatId: newCurrentChatId,
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
