import React, { useEffect, createContext } from 'react';
import { Slot, Stack, Tabs } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { TamaguiProvider, Theme } from 'tamagui';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from './store';
import { useColors } from './constants/colors';
import config from '../tamagui.config';
import { useColorScheme } from 'react-native';

// ColorsType型を定義
import type { lightColors } from './constants/colors';
type ColorsType = typeof lightColors;

// 初期値をnullに変更し、型を明示
export const ColorsContext = createContext<ColorsType | null>(null);

export default function RootLayout() {
  const [loaded] = useFonts({
  });

  const theme = useStore(state => state.theme);
  const colors = useColors();
  const systemColorScheme = useColorScheme();

  // 実際に適用するテーマ名を決定
  let activeTheme: 'light' | 'dark';
  if (theme === 'system') {
    activeTheme = systemColorScheme === 'dark' ? 'dark' : 'light';
  } else {
    activeTheme = theme;
  }

  if (!loaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <TamaguiProvider config={config}>
          <Theme name={activeTheme}>
            <ColorsContext.Provider value={colors}>
              <StatusBar style={activeTheme === 'dark' ? 'light' : 'dark'} />
              <Slot />
            </ColorsContext.Provider>
          </Theme>
        </TamaguiProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export function TabsLayout() {
  const colors = useColors();
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.lightGray,
        },
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.textOnPrimary,
      }}
    >
      <Tabs.Screen
        name="chats"
        options={{
          title: 'チャット',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="new-chat"
        options={{
          title: '新規',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: 'ノート',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '設定',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
