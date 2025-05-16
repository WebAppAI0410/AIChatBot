import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Image } from 'expo-image';
import theme from '../ui/theme';
import useColors from '../constants/colors';
import { Message } from '../store/chatStore';
import { ImageBubble } from './ImageBubble';

type ChatBubbleProps = {
  message: Message;
  onImagePress?: (imageUrl: string) => void;
  onLongPress?: () => void;
};

const ChatBubble: React.FC<ChatBubbleProps> = ({ message, onImagePress, onLongPress }) => {
  const isUser = message.role === 'user';
  const colors = useColors();
  
  // 画像URLを含むかチェック
  const hasImage = message.imageUrl !== undefined;
  
  // タイムスタンプをフォーマット
  const formattedTime = new Date(message.timestamp).toLocaleTimeString();
  
  // 画像メッセージの場合
  if (hasImage && message.imageUrl) {
    return (
      <ImageBubble
        imageUrl={message.imageUrl}
        prompt={message.content}
        timestamp={formattedTime}
        isSent={isUser}
        onPress={() => onImagePress?.(message.imageUrl!)}
        onLongPress={onLongPress}
      />
    );
  }
  
  // テキストメッセージの場合
  return (
    <Pressable
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
        <Text style={[
          styles.messageText,
          isUser ? [styles.userMessageText, { color: colors.textOnPrimary }] : [styles.assistantMessageText, { color: colors.text }]
        ]}>
          {message.content}
        </Text>
      </View>
    </Pressable>
  );
};

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
});

export default ChatBubble;
