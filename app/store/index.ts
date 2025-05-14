import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createLocalModelSlice, { LocalModelState } from './localModelStore';
import { createChatSlice, ChatState } from './chatStore';
import { createUserSlice, UserState } from './userStore';
import { createSettingsSlice, SettingsState } from './settingsStore';

export interface StoreState {
  localModel: LocalModelState;
  chat: ChatState;
  user: UserState;
  settings: SettingsState;
}

export const useStore = create<StoreState>()(
  persist(
    (...a) => ({
      localModel: createLocalModelSlice(...a),
      chat: createChatSlice(...a),
      user: createUserSlice(...a),
      settings: createSettingsSlice(...a),
    }),
    {
      name: 'ai-chatbot-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useStore;
