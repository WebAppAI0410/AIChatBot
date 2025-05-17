import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Easing, AccessibilityInfo } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useColors from '../constants/colors';

export type BalloonAction = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

interface BalloonActionMenuProps {
  visible: boolean;
  x: number; // バブルの基準x座標
  y: number; // バブルの基準y座標
  width: number; // バブルの幅
  height: number; // バブルの高さ
  actions: BalloonAction[];
  onRequestClose: () => void;
  isDarkMode?: boolean;
}

const ARROW_SIZE = 14;
const MENU_WIDTH = 320;
const MENU_HEIGHT = 64;

const BalloonActionMenu: React.FC<BalloonActionMenuProps> = ({
  visible,
  x,
  y,
  width,
  height,
  actions,
  onRequestClose,
  isDarkMode,
}) => {
  const colors = useColors();
  const { width: screenWidth } = Dimensions.get('window');

  // アニメーション
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
          easing: Easing.out(Easing.ease),
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.85);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  if (!visible) return null;

  // メニューの表示位置を計算（バブルの真上、画面端はみ出し防止）
  let menuLeft = x + width / 2 - MENU_WIDTH / 2;
  menuLeft = Math.max(8, Math.min(menuLeft, screenWidth - MENU_WIDTH - 8));
  let menuTop = y - MENU_HEIGHT - ARROW_SIZE;
  if (menuTop < 32) menuTop = y + height + ARROW_SIZE; // 上に出せない場合は下に出す
  const arrowDirection = menuTop < y ? 'down' : 'up';
  const arrowLeft = x + width / 2 - ARROW_SIZE / 2;

  // 吹き出し色
  const bgColor = isDarkMode ? '#23272F' : '#fff';
  const borderColor = isDarkMode ? '#444' : '#ddd';
  const shadowColor = isDarkMode ? '#000' : '#888';

  return (
    <>
      {/* 背景タップで閉じる */}
      <TouchableOpacity
        style={StyleSheet.absoluteFill}
        activeOpacity={1}
        onPress={onRequestClose}
        accessibilityLabel="アクションメニューを閉じる"
        accessibilityRole="button"
      />
      {/* 吹き出し本体 */}
      <Animated.View
        style={[
          styles.menu,
          {
            left: menuLeft,
            top: menuTop,
            backgroundColor: bgColor,
            borderColor,
            shadowColor,
            opacity: opacityAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
        accessibilityViewIsModal
        accessibilityLabel="メッセージアクションメニュー"
      >
        <View style={styles.actionRow}>
          {actions.map(action => (
            <TouchableOpacity
              key={action.key}
              style={styles.actionBtn}
              onPress={action.onPress}
              activeOpacity={0.7}
              accessibilityLabel={action.label}
              accessibilityRole="button"
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Ionicons name={action.icon} size={28} color={isDarkMode ? '#fff' : '#222'} />
              <Text style={[styles.actionLabel, { color: isDarkMode ? '#fff' : '#222' }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Animated.View>
      {/* しっぽ（三角形） */}
      <View
        style={[
          styles.arrow,
          {
            left: Math.max(8, Math.min(arrowLeft, screenWidth - ARROW_SIZE - 8)),
            top: arrowDirection === 'up' ? menuTop + MENU_HEIGHT : menuTop - ARROW_SIZE,
            borderTopColor: arrowDirection === 'up' ? bgColor : 'transparent',
            borderBottomColor: arrowDirection === 'down' ? bgColor : 'transparent',
            borderColor,
          },
        ]}
      />
    </>
  );
};

const styles = StyleSheet.create({
  menu: {
    position: 'absolute',
    width: MENU_WIDTH,
    height: MENU_HEIGHT,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 1000,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    flex: 1,
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    paddingVertical: 8,
    minWidth: 60,
  },
  actionLabel: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  arrow: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: ARROW_SIZE / 2,
    borderRightWidth: ARROW_SIZE / 2,
    borderTopWidth: ARROW_SIZE,
    borderBottomWidth: ARROW_SIZE,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    zIndex: 1001,
  },
});

export default BalloonActionMenu; 