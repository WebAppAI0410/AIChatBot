import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Text, YStack, XStack } from 'tamagui';
import { Check, X, RotateCcw } from 'lucide-react-native';
import { useColors } from '../../constants/colors';
import { useColorScheme } from 'react-native';

export interface DiffChange {
  id: string;
  original: string;
  suggested: string;
  type: 'addition' | 'deletion' | 'modification';
  startIndex: number;
  endIndex: number;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface DiffViewerProps {
  changes: DiffChange[];
  onAcceptChange: (changeId: string) => void;
  onRejectChange: (changeId: string) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  visible: boolean;
}

const DiffViewer: React.FC<DiffViewerProps> = ({
  changes,
  onAcceptChange,
  onRejectChange,
  onAcceptAll,
  onRejectAll,
  visible,
}) => {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  if (!visible || changes.length === 0) {
    return null;
  }

  const pendingChanges = changes.filter(change => change.status === 'pending');
  const hasPendingChanges = pendingChanges.length > 0;

  // 差分の種類に応じた色とアイコンを取得
  const getChangeStyle = (change: DiffChange) => {
    switch (change.type) {
      case 'addition':
        return {
          backgroundColor: isDark ? '#1a472a' : '#dcfce7',
          borderColor: isDark ? '#22c55e' : '#16a34a',
          iconColor: isDark ? '#4ade80' : '#16a34a',
        };
      case 'deletion':
        return {
          backgroundColor: isDark ? '#4c1d1d' : '#fef2f2',
          borderColor: isDark ? '#ef4444' : '#dc2626',
          iconColor: isDark ? '#f87171' : '#dc2626',
        };
      case 'modification':
        return {
          backgroundColor: isDark ? '#1e3a8a' : '#dbeafe',
          borderColor: isDark ? '#3b82f6' : '#2563eb',
          iconColor: isDark ? '#60a5fa' : '#2563eb',
        };
      default:
        return {
          backgroundColor: colors.card,
          borderColor: colors.border,
          iconColor: colors.text,
        };
    }
  };

  const renderChange = (change: DiffChange) => {
    const style = getChangeStyle(change);
    const isAccepted = change.status === 'accepted';
    const isRejected = change.status === 'rejected';
    const isPending = change.status === 'pending';

    return (
      <View key={change.id} style={[styles.changeContainer, { borderColor: style.borderColor }]}>
        {/* 変更タイプの表示 */}
        <View style={[styles.changeHeader, { backgroundColor: style.backgroundColor }]}>
          <Text style={[styles.changeType, { color: style.iconColor }]}>
            {change.type === 'addition' && '追加'}
            {change.type === 'deletion' && '削除'}
            {change.type === 'modification' && '修正'}
          </Text>
          
          {isPending && (
            <XStack space="$2">
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => onRejectChange(change.id)}
              >
                <X size={16} color="#dc2626" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={() => onAcceptChange(change.id)}
              >
                <Check size={16} color="#16a34a" />
              </TouchableOpacity>
            </XStack>
          )}
          
          {isAccepted && (
            <View style={[styles.statusBadge, styles.acceptedBadge]}>
              <Check size={14} color="#ffffff" />
              <Text style={styles.statusText}>適用済み</Text>
            </View>
          )}
          
          {isRejected && (
            <View style={[styles.statusBadge, styles.rejectedBadge]}>
              <X size={14} color="#ffffff" />
              <Text style={styles.statusText}>拒否済み</Text>
            </View>
          )}
        </View>

        {/* 変更内容の表示 */}
        <View style={styles.changeContent}>
          {change.type !== 'addition' && (
            <View style={styles.originalContent}>
              <Text style={[styles.originalLabel, { color: colors.secondaryText }]}>元の内容:</Text>
              <Text style={[styles.originalText, { color: colors.text }]}>
                {change.original}
              </Text>
            </View>
          )}
          
          {change.type !== 'deletion' && (
            <View style={styles.suggestedContent}>
              <Text style={[styles.suggestedLabel, { color: colors.secondaryText }]}>
                {change.type === 'addition' ? '追加内容:' : '修正後:'}
              </Text>
              <Text style={[styles.suggestedText, { color: colors.text }]}>
                {change.suggested}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ヘッダー */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          変更提案 ({changes.length}件)
        </Text>
        
        {hasPendingChanges && (
          <XStack space="$2">
            <TouchableOpacity
              style={[styles.bulkActionButton, styles.rejectAllButton]}
              onPress={onRejectAll}
            >
              <X size={16} color="#dc2626" />
              <Text style={[styles.bulkActionText, { color: '#dc2626' }]}>すべて拒否</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bulkActionButton, styles.acceptAllButton]}
              onPress={onAcceptAll}
            >
              <Check size={16} color="#16a34a" />
              <Text style={[styles.bulkActionText, { color: '#16a34a' }]}>すべて適用</Text>
            </TouchableOpacity>
          </XStack>
        )}
      </View>

      {/* 変更リスト */}
      <ScrollView style={styles.changesList} showsVerticalScrollIndicator={false}>
        <YStack space="$2" padding="$3">
          {changes.map(renderChange)}
        </YStack>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxHeight: 400,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  bulkActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  acceptAllButton: {
    borderColor: '#16a34a',
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
  },
  rejectAllButton: {
    borderColor: '#dc2626',
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
  },
  bulkActionText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  changesList: {
    flex: 1,
  },
  changeContainer: {
    borderRadius: 6,
    borderWidth: 1,
    overflow: 'hidden',
  },
  changeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  changeType: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  acceptButton: {
    backgroundColor: 'rgba(22, 163, 74, 0.1)',
    borderColor: '#16a34a',
  },
  rejectButton: {
    backgroundColor: 'rgba(220, 38, 38, 0.1)',
    borderColor: '#dc2626',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  acceptedBadge: {
    backgroundColor: '#16a34a',
  },
  rejectedBadge: {
    backgroundColor: '#dc2626',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#ffffff',
    marginLeft: 4,
  },
  changeContent: {
    padding: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  originalContent: {
    marginBottom: 8,
  },
  originalLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  originalText: {
    fontSize: 14,
    lineHeight: 20,
    textDecorationLine: 'line-through',
    opacity: 0.7,
  },
  suggestedContent: {
    marginTop: 4,
  },
  suggestedLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  suggestedText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
});

export default DiffViewer; 