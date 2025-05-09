import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '../constants/colors';

export default function ChatLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        presentation: 'card',
        gestureEnabled: true,
        gestureDirection: 'horizontal',
      }}
    />
  );
}
