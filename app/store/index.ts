import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createLocalModelSlice, LocalModelState } from './localModelStore';
import { createChatSlice, ChatState } from './chatStore';
import { createUserSlice, UserState } from './userStore';
import { createSettingsSlice, SettingsState } from './settingsStore';

export type StoreState = 
  & LocalModelState
  & ChatState
  & UserState
  & SettingsState;

export const useStore = create<StoreState>()(
  persist(
    (...a) => ({
      ...createLocalModelSlice(...a),
      ...createChatSlice(...a),
      ...createUserSlice(...a),
      ...createSettingsSlice(...a),
    }),
    {
      name: 'ai-chatbot-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
