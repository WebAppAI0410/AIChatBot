import React from 'react';
import { Stack } from 'expo-router';
import useColors from '../constants/colors';

export default function ChatLayout() {
  const colors = useColors(); // 動的カラーを取得
  
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        presentation: 'card',
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        contentStyle: {
          backgroundColor: colors.background
        }
      }}
    />
  );
}
