import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createLocalModelSlice, LocalModelState } from './localModelStore';
import { createChatSlice, ChatState } from './chatStore';
import { createUserSlice, UserState } from './userStore';
import { createSettingsSlice, SettingsState } from './settingsStore';
import { createImageSlice, ImageState } from './imageStore';

export type StoreState = 
  & LocalModelState
  & ChatState
  & UserState
  & SettingsState
  & ImageState;

export const useStore = create<StoreState>()(
  persist(
    (...a) => ({
      ...createLocalModelSlice(...a),
      ...createChatSlice(...a),
      ...createUserSlice(...a),
      ...createSettingsSlice(...a),
      ...createImageSlice(...a),
    }),
    {
      name: 'ai-chatbot-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useStore;
