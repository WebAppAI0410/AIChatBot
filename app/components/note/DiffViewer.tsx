import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { Text, YStack, XStack } from 'tamagui';
import { Check, X, RotateCcw, Clock } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import { useColors } from '../../constants/colors';
import { useColorScheme } from 'react-native';

export interface DiffChange {
  id: string;
  original: string;
  suggested: string;
  type: 'addition' | 'deletion' | 'modification';
  startIndex: number;
  endIndex: number;
  status: 'pending' | 'accepted' | 'rejected' | 'processing';
}

export interface DiffViewerProps {
  changes: DiffChange[];
  onAcceptChange: (changeId: string) => void;
  onRejectChange: (changeId: string) => void;
  onAcceptAll: () => void;
  onRejectAll: () => void;
  visible: boolean;
  isProcessing?: boolean;
}

const DiffViewer: React.FC<DiffViewerProps> = ({
  changes,
  onAcceptChange,
  onRejectChange,
  onAcceptAll,
  onRejectAll,
  visible,
  isProcessing = false,
}) => {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  if (!visible || changes.length === 0) {
    return null;
  }

  // HTMLをプレビュー用に変換
  const createPreviewHTML = (htmlContent: string, isDeletion: boolean = false) => {
    const baseStyle = `
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        line-height: 1.6;
        margin: 8px;
        background-color: ${isDark ? '#0d1117' : '#ffffff'};
        color: ${isDark ? '#c9d1d9' : '#24292f'};
        font-size: 14px;
        ${isDeletion ? 'text-decoration: line-through; opacity: 0.7;' : ''}
      }
      h1, h2, h3, h4, h5, h6 {
        margin: 8px 0;
        font-weight: 600;
        color: ${isDark ? '#f0f6fc' : '#24292f'};
      }
      h1 { font-size: 1.5em; }
      h2 { font-size: 1.3em; }
      h3 { font-size: 1.1em; }
      p { margin: 4px 0; }
      strong, b { font-weight: 600; }
      em, i { font-style: italic; }
      u { text-decoration: underline; }
      ul, ol { margin: 4px 0; padding-left: 20px; }
      blockquote {
        border-left: 3px solid ${isDark ? '#30363d' : '#d0d7de'};
        padding-left: 12px;
        margin: 4px 0;
        color: ${isDark ? '#8b949e' : '#656d76'};
      }
      code {
        background-color: ${isDark ? '#262c36' : '#f6f8fa'};
        padding: 2px 4px;
        border-radius: 3px;
        font-family: 'Monaco', 'Consolas', monospace;
        font-size: 0.9em;
      }
      pre {
        background-color: ${isDark ? '#161b22' : '#f6f8fa'};
        padding: 8px;
        border-radius: 6px;
        overflow-x: auto;
      }
    `;
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>${baseStyle}</style>
        </head>
        <body>${htmlContent}</body>
      </html>
    `;
  };

  // HTMLプレビューコンポーネント
  const HTMLPreview = ({ content, isDeletion = false }: { content: string; isDeletion?: boolean }) => (
    <View style={[styles.previewContainer, isDeletion && styles.deletionPreview]}>
      <WebView
        source={{ html: createPreviewHTML(content, isDeletion) }}
        style={styles.webViewPreview}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        originWhitelist={['*']}
        javaScriptEnabled={false}
      />
    </View>
  );

  const pendingChanges = changes.filter(change => change.status === 'pending');
  const hasPendingChanges = pendingChanges.length > 0;
  const processingChanges = changes.filter(change => change.status === 'processing');

  // 差分の種類に応じた色とアイコンを取得
  const getChangeStyle = (change: DiffChange) => {
    const baseStyles = {
      addition: {
        backgroundColor: isDark ? '#0d4427' : '#dcfce7',
        borderColor: isDark ? '#22c55e' : '#16a34a',
        iconColor: isDark ? '#4ade80' : '#16a34a',
        prefix: '+',
      },
      deletion: {
        backgroundColor: isDark ? '#4c1d1d' : '#fef2f2',
        borderColor: isDark ? '#ef4444' : '#dc2626',
        iconColor: isDark ? '#f87171' : '#dc2626',
        prefix: '-',
      },
      modification: {
        backgroundColor: isDark ? '#172554' : '#dbeafe',
        borderColor: isDark ? '#3b82f6' : '#2563eb',
        iconColor: isDark ? '#60a5fa' : '#2563eb',
        prefix: '~',
      },
    };

    return baseStyles[change.type] || {
      backgroundColor: colors.card,
      borderColor: colors.border,
      iconColor: colors.text,
      prefix: '?',
    };
  };

  const renderChange = (change: DiffChange) => {
    const style = getChangeStyle(change);
    const isAccepted = change.status === 'accepted';
    const isRejected = change.status === 'rejected';
    const isPending = change.status === 'pending';
    const isProcessingThis = change.status === 'processing';

    return (
      <Animated.View 
        key={change.id} 
        style={[
          styles.changeContainer, 
          { 
            borderColor: style.borderColor,
            opacity: isProcessingThis ? 0.7 : 1.0,
          }
        ]}
      >
        {/* 変更タイプの表示 */}
        <View style={[styles.changeHeader, { backgroundColor: style.backgroundColor }]}>
          <View style={styles.changeTypeContainer}>
            <Text style={[styles.changePrefix, { color: style.iconColor }]}>
              {style.prefix}
            </Text>
            <Text style={[styles.changeType, { color: style.iconColor }]}>
              {change.type === 'addition' && '追加'}
              {change.type === 'deletion' && '削除'}
              {change.type === 'modification' && '修正'}
            </Text>
          </View>
          
          {isPending && !isProcessing && (
            <XStack space="$2">
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => onRejectChange(change.id)}
              >
                <X size={14} color="#dc2626" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={() => onAcceptChange(change.id)}
              >
                <Check size={14} color="#16a34a" />
              </TouchableOpacity>
            </XStack>
          )}

          {isProcessingThis && (
            <View style={[styles.statusBadge, styles.processingBadge]}>
              <Clock size={12} color="#ffffff" />
              <Text style={styles.statusText}>処理中</Text>
            </View>
          )}
          
          {isAccepted && (
            <View style={[styles.statusBadge, styles.acceptedBadge]}>
              <Check size={12} color="#ffffff" />
              <Text style={styles.statusText}>適用済み</Text>
            </View>
          )}
          
          {isRejected && (
            <View style={[styles.statusBadge, styles.rejectedBadge]}>
              <X size={12} color="#ffffff" />
              <Text style={styles.statusText}>拒否済み</Text>
            </View>
          )}
        </View>

        {/* 変更内容の表示 */}
        <View style={styles.changeContent}>
          {change.type !== 'addition' && (
            <View style={styles.originalContent}>
              <Text style={[styles.contentLabel, { color: colors.secondaryText }]}>
                元の内容
              </Text>
              <HTMLPreview content={change.original} isDeletion={true} />
            </View>
          )}
          
          {change.type !== 'deletion' && (
            <View style={styles.suggestedContent}>
              <Text style={[styles.contentLabel, { color: colors.secondaryText }]}>
                {change.type === 'addition' ? '追加内容' : '修正後'}
              </Text>
              <HTMLPreview content={change.suggested} isDeletion={false} />
            </View>
          )}
        </View>
      </Animated.View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* ヘッダー */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            変更提案
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.secondaryText }]}>
            {changes.length}件の変更
            {processingChanges.length > 0 && ` (${processingChanges.length}件処理中)`}
          </Text>
        </View>
        
        {hasPendingChanges && !isProcessing && (
          <XStack space="$2">
            <TouchableOpacity
              style={[styles.bulkActionButton, styles.rejectAllButton]}
              onPress={onRejectAll}
            >
              <X size={14} color="#dc2626" />
              <Text style={[styles.bulkActionText, { color: '#dc2626' }]}>すべて拒否</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.bulkActionButton, styles.acceptAllButton]}
              onPress={onAcceptAll}
            >
              <Check size={14} color="#16a34a" />
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
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  bulkActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
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
    fontSize: 11,
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
    marginBottom: 8,
  },
  changeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  changeTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changePrefix: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
    fontFamily: 'monospace',
  },
  changeType: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  actionButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
  processingBadge: {
    backgroundColor: '#f59e0b',
  },
  statusText: {
    fontSize: 10,
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
  suggestedContent: {
    marginTop: 4,
  },
  contentLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  codeBlock: {
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderLeftWidth: 3,
  },
  deletionBlock: {
    backgroundColor: 'rgba(220, 38, 38, 0.05)',
    borderLeftColor: '#dc2626',
  },
  additionBlock: {
    backgroundColor: 'rgba(22, 163, 74, 0.05)',
    borderLeftColor: '#16a34a',
  },
  codeText: {
    fontSize: 13,
    fontFamily: 'monospace',
    lineHeight: 18,
  },
  previewContainer: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
    minHeight: 60,
    maxHeight: 200,
  },
  deletionPreview: {
    backgroundColor: '#fff5f5',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  webViewPreview: {
    backgroundColor: 'transparent',
    flex: 1,
  },
});

export default DiffViewer; 