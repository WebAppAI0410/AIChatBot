import React, { useRef } from 'react';
import { Animated, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { RectButton, Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/colors';

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete: () => void;
}

const SwipeableRow: React.FC<SwipeableRowProps> = ({ children, onDelete }) => {
  const swipeableRef = useRef<Swipeable>(null);

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    _dragX: Animated.AnimatedInterpolation<number>
  ) => {
    const trans = progress.interpolate({
      inputRange: [0, 1],
      outputRange: [100, 0],
    });

    return (
      <View style={styles.rightActionsContainer}>
        <Animated.View style={[styles.rightAction, { transform: [{ translateX: trans }] }]}>
          <RectButton style={styles.deleteButton} onPress={() => {
            swipeableRef.current?.close();
            onDelete();
          }}>
            <Ionicons name="trash-outline" size={24} color="white" />
            <Text style={styles.actionText}>削除</Text>
          </RectButton>
        </Animated.View>
      </View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      friction={2}
      rightThreshold={40}
      renderRightActions={renderRightActions}
    >
      {children}
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  rightActionsContainer: {
    width: 100,
    flexDirection: 'row',
  },
  rightAction: {
    flex: 1,
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    color: 'white',
    fontSize: 14,
    marginTop: 4,
    fontWeight: 'bold',
  },
});

export default SwipeableRow; 