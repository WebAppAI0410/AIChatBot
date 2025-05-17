import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { Image } from 'expo-image';
import theme from '../ui/theme';
import useColors from '../constants/colors';

interface ImageBubbleProps {
  imageUrl: string;
  prompt: string;
  timestamp: string;
  isSent?: boolean;
  onPress?: () => void;
  onLongPress?: () => void;
}

export const ImageBubble: React.FC<ImageBubbleProps> = ({ 
  imageUrl, 
  prompt, 
  timestamp, 
  isSent = false,
  onPress,
  onLongPress
}) => {
  const colors = useColors();
  
  return (
    <Pressable 
      style={[
        styles.container,
        isSent ? styles.sentContainer : styles.receivedContainer
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
    >
      <View style={[
        styles.imageBubble,
        isSent 
          ? [styles.sentImageBubble, { backgroundColor: colors.card }] 
          : [styles.receivedImageBubble, { backgroundColor: colors.card }]
      ]}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          contentFit="cover"
        />
        <Text style={[
          styles.promptText,
          { color: colors.text }
        ]}>
          {prompt}
        </Text>
        <Text style={[
          styles.timestampText,
          { color: colors.secondaryText }
        ]}>
          {timestamp}
        </Text>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    maxWidth: '80%',
  },
  imageBubble: {
    padding: 12,
    borderRadius: theme.radius.lg,
    overflow: 'hidden',
  },
  sentContainer: {
    alignSelf: 'flex-end',
  },
  receivedContainer: {
    alignSelf: 'flex-start',
  },
  sentImageBubble: {
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
  },
  receivedImageBubble: {
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: theme.radius.md,
  },
  promptText: {
    fontSize: theme.fontSizes.sm,
    marginTop: 8,
  },
  timestampText: {
    fontSize: theme.fontSizes.xs,
    marginTop: 4,
  },
}); 