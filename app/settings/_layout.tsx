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
    </Stack>
  );
}
