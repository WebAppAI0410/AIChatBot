import React, { useRef } from 'react';
import { Animated, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { RectButton, Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import useColors from '../constants/colors';

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete: () => void;
  onLongPress?: () => void;
}

const SwipeableRow: React.FC<SwipeableRowProps> = ({ children, onDelete, onLongPress }) => {
  const swipeableRef = useRef<Swipeable>(null);
  const colors = useColors(); // 動的カラーを取得

  // 子要素にlongPressイベントを伝播させるためのラッパー
  const childrenWithLongPress = onLongPress
    ? React.Children.map(children, child => 
        React.isValidElement(child) 
          ? React.cloneElement(child as React.ReactElement<any>, { 
              onLongPress 
            })
          : child
      )
    : children;

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
      backgroundColor: colors.error,
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
      {childrenWithLongPress}
    </Swipeable>
  );
};

export default SwipeableRow; 