import React from 'react';
import { View, Text, Pressable, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { useStore } from '../store';
import useColors from '../constants/colors';

type BadgeContent = {
  icon: string;
  label: string;
  color: string;
};

/**
 * ローカルモデルの状態を表示するバッジコンポーネント
 * @returns コンポーネント
 */
const LocalModelStatusBadge = () => {
  const colors = useColors();
  
  // Storeから状態を取得（localModelスライスから正しく取得）
  const modelStatus = useStore(state => state.localModel?.modelStatus || 'not_downloaded');
  const downloadProgress = useStore(state => state.localModel?.downloadProgress || 0);
  const errorMessage = useStore(state => state.localModel?.errorMessage);

  // ステータスに応じたバッジコンテンツを取得
  const getBadgeContent = (): BadgeContent => {
    switch (modelStatus) {
      case 'not_downloaded':
        return { icon: '⚪️', label: '未DL', color: colors.lightGray };
      case 'downloading':
        return {
          icon: '🔄',
          label: `${Math.round(downloadProgress * 100)}%`,
          color: colors.primary
        };
      case 'verifying':
        return { icon: '🔍', label: '検証中', color: colors.warning };
      case 'ready':
        return { icon: '🟢', label: '使用可', color: colors.success };
      case 'error':
        return { icon: '🔴', label: 'エラー', color: colors.error };
      default:
        return { icon: '⚪️', label: '未DL', color: colors.lightGray };
    }
  };

  const badge = getBadgeContent();

  // エラー詳細表示ハンドラ
  const handlePress = () => {
    if (modelStatus === 'error' && errorMessage) {
      Alert.alert('エラー詳細', errorMessage);
    }
  };

  // 進捗表示の最適化（検証中の場合は99%で固定）
  const displayProgress = modelStatus === 'verifying' ? 99 : Math.round(downloadProgress * 100);

  return (
    <Pressable onPress={handlePress}>
      <View style={[styles.badge, { backgroundColor: badge.color }]}>
        <View style={styles.badgeContent}>
          <Text style={styles.icon}>{badge.icon}</Text>
          <Text style={styles.label}>
            {badge.label}
          </Text>
          {(modelStatus === 'downloading' || modelStatus === 'verifying') && (
            <ActivityIndicator size="small" color="white" style={styles.spinner} />
          )}
        </View>
      </View>
      
      {(modelStatus === 'downloading' || modelStatus === 'verifying') && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressIndicator, 
                { 
                  width: `${displayProgress}%`,
                  backgroundColor: modelStatus === 'verifying' ? colors.warning : colors.primary
                }
              ]} 
            />
          </View>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  badgeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 4,
    fontSize: 12,
  },
  label: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  spinner: {
    marginLeft: 4,
    width: 12,
    height: 12,
  },
  progressContainer: {
    marginTop: 2,
    width: 60,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressIndicator: {
    height: '100%',
    borderRadius: 2,
  },
});

export default LocalModelStatusBadge;
