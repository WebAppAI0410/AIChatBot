import React, { forwardRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import theme from '../ui/theme';
import useColors from '../constants/colors';
import { Message } from '../store/chatStore';
import ImageBubble from './ImageBubble';

type ChatBubbleProps = {
  message: Message;
  onImagePress?: (imageUrl: string) => void;
  onLongPress?: () => void;
};

// 簡易マークダウンレンダリング関数
const renderMarkdownText = (text: string, isUser: boolean, colors: any) => {
  const lines = text.split('\n');
  const renderedLines: React.ReactNode[] = [];
  
  lines.forEach((line, lineIndex) => {
    if (line.trim() === '') {
      renderedLines.push(<View key={`empty-${lineIndex}`} style={{ height: 8 }} />);
      return;
    }
    
    // コードブロック
    if (line.startsWith('```')) {
      renderedLines.push(
        <View key={lineIndex} style={[styles.codeBlock, { backgroundColor: colors.lightGray }]}>
          <Text style={[styles.codeText, { color: colors.text }]}>
            {line.replace(/```/g, '')}
          </Text>
        </View>
      );
      return;
    }
    
    // 見出し
    if (line.startsWith('# ')) {
      renderedLines.push(
        <Text key={lineIndex} style={[styles.heading1, { color: isUser ? colors.textOnPrimary : colors.text }]}>
          {line.substring(2)}
        </Text>
      );
      return;
    }
    
    if (line.startsWith('## ')) {
      renderedLines.push(
        <Text key={lineIndex} style={[styles.heading2, { color: isUser ? colors.textOnPrimary : colors.text }]}>
          {line.substring(3)}
        </Text>
      );
      return;
    }
    
    if (line.startsWith('### ')) {
      renderedLines.push(
        <Text key={lineIndex} style={[styles.heading3, { color: isUser ? colors.textOnPrimary : colors.text }]}>
          {line.substring(4)}
        </Text>
      );
      return;
    }
    
    // リスト
    if (line.startsWith('- ') || line.match(/^\d+\. /)) {
      renderedLines.push(
        <View key={lineIndex} style={styles.listItem}>
          <Text style={[styles.listBullet, { color: isUser ? colors.textOnPrimary : colors.text }]}>
            {line.startsWith('- ') ? '•' : line.match(/^(\d+)\./)?.[1] + '.'}
          </Text>
          <Text style={[styles.messageText, { color: isUser ? colors.textOnPrimary : colors.text }]}>
            {line.replace(/^(- |\d+\. )/, '')}
          </Text>
        </View>
      );
      return;
    }
    
    // 通常のテキスト（太字、斜体処理）
    const renderTextWithFormatting = (text: string) => {
      const parts = [];
      let currentIndex = 0;
      
      // 太字 **text**
      text.replace(/\*\*(.*?)\*\*/g, (match, content, index) => {
        if (index > currentIndex) {
          parts.push(text.substring(currentIndex, index));
        }
        parts.push(<Text key={`bold-${index}`} style={styles.boldText}>{content}</Text>);
        currentIndex = index + match.length;
        return match;
      });
      
      // 残りのテキスト
      if (currentIndex < text.length) {
        parts.push(text.substring(currentIndex));
      }
      
      // 斜体 *text*
      const processedParts = parts.map((part, index) => {
        if (typeof part === 'string') {
          const italicParts = [];
          let currentItalicIndex = 0;
          
          part.replace(/\*(.*?)\*/g, (match, content, italicIndex) => {
            if (italicIndex > currentItalicIndex) {
              italicParts.push(part.substring(currentItalicIndex, italicIndex));
            }
            italicParts.push(<Text key={`italic-${index}-${italicIndex}`} style={styles.italicText}>{content}</Text>);
            currentItalicIndex = italicIndex + match.length;
            return match;
          });
          
          if (currentItalicIndex < part.length) {
            italicParts.push(part.substring(currentItalicIndex));
          }
          
          return italicParts.length > 1 ? italicParts : part;
        }
        return part;
      }).flat();
      
      return processedParts;
    };
    
    renderedLines.push(
      <Text key={lineIndex} style={[styles.messageText, { color: isUser ? colors.textOnPrimary : colors.text }]}>
        {renderTextWithFormatting(line)}
      </Text>
    );
  });
  
  return renderedLines;
};

const ChatBubble = forwardRef<any, ChatBubbleProps>(({ message, onImagePress, onLongPress }, ref) => {
  const isUser = message.role === 'user';
  const colors = useColors();
  
  // 画像URLを含むかチェック
  const hasImage = message.imageUrl !== undefined && message.imageUrl !== null;
  
  // タイムスタンプをフォーマット
  const formattedTime = new Date(message.timestamp).toLocaleTimeString();
  
  // 画像メッセージの場合
  if (hasImage && message.imageUrl) {
    return (
      <ImageBubble
        ref={ref}
        imageUrl={message.imageUrl}
        prompt={message.content}
        timestamp={formattedTime}
        isSent={isUser}
        onPress={() => onImagePress && message.imageUrl ? onImagePress(message.imageUrl) : undefined}
        onLongPress={onLongPress}
      />
    );
  }
  
  // テキストメッセージの場合
  return (
    <Pressable
      ref={ref}
      onLongPress={onLongPress}
      style={[
      styles.messageContainer,
      isUser ? styles.userMessageContainer : styles.assistantMessageContainer
      ]}
    >
      <View style={[
        styles.messageBubble,
        isUser ? [styles.userMessageBubble, { backgroundColor: colors.primary }] : [styles.assistantMessageBubble, { backgroundColor: colors.card }]
      ]}>
        <View style={styles.messageContent}>
          {isUser ? (
            <Text style={[
              styles.messageText,
              { color: colors.textOnPrimary }
            ]}>
              {message.content}
            </Text>
          ) : (
            renderMarkdownText(message.content, isUser, colors)
          )}
        </View>
        <Text style={[
          styles.timestampText,
          isUser ? { color: colors.textOnPrimary + '99' } : { color: colors.secondaryText }
        ]}>
          {formattedTime}
        </Text>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  messageContainer: {
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  assistantMessageContainer: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '80%',
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
  },
  userMessageBubble: {
    backgroundColor: theme.colors.primary,
    borderBottomRightRadius: theme.radius.xs,
  },
  assistantMessageBubble: {
    backgroundColor: theme.colors.background.light,
    borderBottomLeftRadius: theme.radius.xs,
  },
  messageText: {
    fontSize: theme.fontSizes.md,
    lineHeight: theme.typography.body.lineHeight,
  },
  userMessageText: {
    color: theme.colors.text.inverse,
  },
  assistantMessageText: {
    color: theme.colors.text.light,
  },
  timestampText: {
    fontSize: theme.fontSizes.xs,
    marginTop: theme.spacing.xs,
    alignSelf: 'flex-end',
  },
  messageContent: {
    flex: 1,
  },
  heading1: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 8,
    lineHeight: 24,
  },
  heading2: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 6,
    lineHeight: 22,
  },
  heading3: {
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 4,
    lineHeight: 20,
  },
  boldText: {
    fontWeight: 'bold',
  },
  italicText: {
    fontStyle: 'italic',
  },
  codeBlock: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginVertical: 4,
    fontFamily: 'monospace',
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 14,
  },
  listItem: {
    flexDirection: 'row',
    marginVertical: 2,
    paddingLeft: 8,
  },
  listBullet: {
    marginRight: 8,
    minWidth: 20,
  },
});

export default ChatBubble;
