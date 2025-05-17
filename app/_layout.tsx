import React, { createContext } from 'react';
import { Slot, Stack, Tabs } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { TamaguiProvider, Theme } from 'tamagui';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from './store';
import { useColors, lightColors } from './constants/colors';
import config from '../tamagui.config';
import { useColorScheme } from 'react-native';
import { ThemeProvider, useTheme } from './ui/ThemeProvider';
import { OrientationProvider } from './providers/OrientationProvider';
import { ResetDailyQuotaProvider } from './providers/ResetDailyQuotaProvider';
import { Toast } from './components/MessageActions';
import { CentralToast } from './components/CentralToast';
import { View } from 'react-native';

// ColorsType型を定義
type ColorsType = typeof lightColors;

// 初期値をlightColorsに設定し、型安全性を向上
export const ColorsContext = createContext<ColorsType>(lightColors);

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
              <ThemeProvider>
                <OrientationProvider>
                  <ResetDailyQuotaProvider>
                    <StatusBar style={activeTheme === 'dark' ? 'light' : 'dark'} />
                    <CentralToast />
                    <View style={{ flex: 1 }}>
                      <Slot />
                      {/* グローバルトースト表示 */}
                      <Toast />
                    </View>
                  </ResetDailyQuotaProvider>
                </OrientationProvider>
              </ThemeProvider>
            </ColorsContext.Provider>
          </Theme>
        </TamaguiProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export function TabsLayout() {
  const colors = useColors();
  const { theme } = useTheme();
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.gray,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.lightGray,
          height: 60 + theme.safeArea.bottom,
          paddingBottom: theme.safeArea.bottom,
          paddingTop: theme.spacing.xs,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
        },
        tabBarItemStyle: {
          paddingVertical: theme.spacing.xs,
        },
        tabBarLabelStyle: {
          fontSize: theme.fontSizes.xs,
          fontWeight: '500',
          marginBottom: theme.spacing.xs,
        },
        headerStyle: {
          backgroundColor: colors.primary,
          height: 60 + theme.safeArea.top,
        },
        headerShown: false,
        headerTintColor: colors.textOnPrimary,
        headerTitleStyle: {
          fontSize: theme.fontSizes.lg,
          fontWeight: 'bold',
        },
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
        name="image"
        options={{
          title: '画像',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="image-outline" size={size} color={color} />
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
