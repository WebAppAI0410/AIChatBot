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
        presentation: 'card',
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: '設定',
        }}
      />
      <Stack.Screen
        name="subscription"
        options={{
          title: 'サブスクリプション',
        }}
      />
      <Stack.Screen
        name="local-model"
        options={{
          title: 'ローカルモデル管理',
        }}
      />
      <Stack.Screen
        name="notes"
        options={{
          title: 'ノート機能設定',
        }}
      />
      <Stack.Screen
        name="appearance"
        options={{
          title: '画面カスタマイズ',
        }}
      />
      <Stack.Screen
        name="help"
        options={{
          title: '使い方',
        }}
      />
    </Stack>
  );
}
