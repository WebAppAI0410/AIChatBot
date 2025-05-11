import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import theme from '../ui/theme';
import useColors from '../constants/colors';
import { Message } from '../store/chatStore';

type ChatBubbleProps = {
  message: Message;
};

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const colors = useColors();
  
  return (
    <View style={[
      styles.messageContainer,
      isUser ? styles.userMessageContainer : styles.assistantMessageContainer
    ]}>
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
    </View>
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
