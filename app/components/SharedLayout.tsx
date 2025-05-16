import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import useResponsive from '../hooks/useResponsive';
import useColors from '../constants/colors';

type SharedLayoutProps = {
  sidebarContent: React.ReactNode;
  mainContent: React.ReactNode;
  showSidebar?: boolean;
};

/**
 * サイドバースタイルを計算するヘルパー関数
 */
const getSidebarStyles = (
  sidebarWidth: number | string,
  colors: ReturnType<typeof useColors>
): ViewStyle => ({
  width: typeof sidebarWidth === 'number' ? sidebarWidth : undefined,
  flex: typeof sidebarWidth !== 'number' ? 1 : undefined,
  backgroundColor: colors.background,
  borderRightColor: colors.lightGray
});

/**
 * 共通レイアウトコンポーネント
 * 画面サイズに応じて、1カラム/2カラムレイアウトを切り替える
 */
const SharedLayout: React.FC<SharedLayoutProps> = ({ 
  sidebarContent, 
  mainContent,
  showSidebar = true
}) => {
  const { layout, isLandscape } = useResponsive();
  const colors = useColors();
  const useTwoColumnLayout = layout.twoColumn && showSidebar;
  
  return (
    <View 
      style={[styles.container, { backgroundColor: colors.background }]}
      accessibilityLabel="メインレイアウトコンテナ"
    >
      {useTwoColumnLayout ? (
        // タブレット/デスクトップ/横向きのレイアウト
        <View style={styles.twoColumnContainer}>
          <View 
            style={[styles.sidebar, getSidebarStyles(layout.sidebarWidth, colors)]}
            accessibilityLabel="サイドバーナビゲーション"
          >
            {sidebarContent}
          </View>
          <View 
            style={[styles.mainContent, { backgroundColor: colors.background }]}
          >
            {mainContent}
          </View>
        </View>
      ) : (
        // スマートフォン向けの単一カラムレイアウト
        <>{mainContent}</>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  twoColumnContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    borderRightWidth: 1,
  },
  mainContent: {
    flex: 1,
  },
});

export default SharedLayout; 