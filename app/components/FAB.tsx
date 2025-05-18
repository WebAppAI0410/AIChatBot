import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { LucideIcon } from '@tamagui/lucide-icons';
import { theme } from '../ui/theme';
import { Text } from 'tamagui';

type FABProps = {
  icon?: React.ReactNode;
  onPress: () => void;
  label?: string;
  color?: string;
  position?: 'bottomRight' | 'bottomLeft' | 'topRight' | 'topLeft';
  style?: object;
};

export const FAB: React.FC<FABProps> = ({
  icon,
  onPress,
  label,
  color = theme.colors.primary,
  position = 'bottomRight',
  style,
}) => {
  // FABの位置を決定
  const getPositionStyle = () => {
    switch (position) {
      case 'bottomLeft':
        return { bottom: 16, left: 16 };
      case 'topRight':
        return { top: 16, right: 16 };
      case 'topLeft':
        return { top: 16, left: 16 };
      case 'bottomRight':
      default:
        return { bottom: 16, right: 16 };
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.fab,
        { backgroundColor: color },
        getPositionStyle(),
        style,
      ]}
      activeOpacity={0.8}
    >
      {icon}
      {label && (
        <Text color="white" fontSize={14} marginLeft={icon ? 8 : 0}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    flexDirection: 'row',
    paddingHorizontal: 16,
  },
}); 