import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '../constants/colors';

export default function SettingsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.background,
        headerBackTitle: '戻る',
        headerBackVisible: true,
        animation: 'slide_from_right',
        presentation: 'modal',
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: '設定',
          headerShown: false, // Hide header on main settings screen as it's a tab
        }}
      />
      <Stack.Screen
        name="subscription"
        options={{
          title: 'サブスクリプション',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="local-model"
        options={{
          title: 'ローカルモデル管理',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="notes"
        options={{
          title: 'ノート機能設定',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="appearance"
        options={{
          title: '画面カスタマイズ',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="help"
        options={{
          title: '使い方',
          headerShown: true,
        }}
      />
    </Stack>
  );
}
