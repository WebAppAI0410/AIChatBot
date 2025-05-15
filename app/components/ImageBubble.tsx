import React from 'react';
import { View, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { styled, Text, YStack } from 'tamagui';

export type ImageBubbleProps = {
  imageUrl: string;
  prompt: string;
  timestamp: string;
  isSent: boolean;
  onLongPress?: () => void;
  onPress?: () => void;
};

export const ImageBubble: React.FC<ImageBubbleProps> = ({
  imageUrl,
  prompt,
  timestamp,
  isSent,
  onLongPress,
  onPress,
}) => {
  return (
    <Container 
      onLongPress={onLongPress}
      onPress={onPress}
      alignSelf={isSent ? 'flex-end' : 'flex-start'}
      backgroundColor={isSent ? '$primary' : '$backgroundHover'}
    >
      <Image
        source={{ uri: imageUrl }}
        style={{ width: '100%', aspectRatio: 1 }}
        contentFit="cover"
        transition={300}
      />

      <ContentContainer>
        <Text
          color={isSent ? 'white' : '$color'}
          numberOfLines={2}
        >
          {prompt}
        </Text>

        <Text
          color={isSent ? 'rgba(255, 255, 255, 0.7)' : '$colorFocus'}
          fontSize="$1"
          marginTop="$1"
        >
          {timestamp}
        </Text>
      </ContentContainer>
    </Container>
  );
};

const Container = styled(YStack, {
  marginVertical: '$3',
  maxWidth: '80%',
  borderRadius: '$4',
  overflow: 'hidden',
});

const ContentContainer = styled(YStack, {
  padding: '$3',
}); 