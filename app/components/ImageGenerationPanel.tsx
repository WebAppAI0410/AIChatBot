import React, { useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { 
  YStack, 
  Text, 
  XStack, 
  Button, 
  TextArea, 
  styled,
} from 'tamagui';
import useStore from '../store';

export type ImageSize = '512x512' | '768x768' | '1024x1024';
export type ImageQuality = 'standard' | 'hd';
export type ImageModel = 'sdxl' | 'dalle';

export type ImageGenerationPanelProps = {
  onImageGenerated: (imageUrl: string) => void;
  onClose: () => void;
};

export const ImageGenerationPanel: React.FC<ImageGenerationPanelProps> = ({
  onImageGenerated,
  onClose,
}) => {
  const {
    sdxlQuota,
    dalleQuota,
    generateImage,
    isGenerating,
    generationError
  } = useStore();

  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<ImageSize>('768x768');
  const [quality, setQuality] = useState<ImageQuality>('standard');
  const [model, setModel] = useState<ImageModel>('sdxl');

  // ユーザープランからDALL-E使用可能か判定（仮実装）
  const canUseDalle = dalleQuota.total > 0;

  // 画像生成ハンドラ
  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    try {
      // 画像生成
      const imageUrl = await generateImage({
        prompt: prompt.trim(),
        size,
        quality,
        model: canUseDalle && model === 'dalle' ? 'dalle' : 'sdxl',
      });

      // 親コンポーネントに通知
      onImageGenerated(imageUrl);
    } catch (err) {
      // エラーはstore内でハンドリング済み
      console.error('Image generation error:', err);
    }
  };

  return (
    <Container>
      <Text fontSize="$6" fontWeight="bold" mb="$3">画像生成</Text>

      {/* クォータ表示 */}
      <XStack justifyContent="space-between" mb="$4">
        <Text>
          SDXL: 残り {sdxlQuota.remaining}/{sdxlQuota.total}
        </Text>
        {canUseDalle && (
          <Text>
            DALL·E: 残り {dalleQuota.remaining}/{dalleQuota.total}
          </Text>
        )}
      </XStack>

      {/* プロンプト入力 */}
      <TextArea
        placeholder="画像の説明を入力..."
        value={prompt}
        onChangeText={setPrompt}
        minHeight={100}
        mb="$4"
      />

      {/* モデル選択 */}
      <Text mb="$2">モデル:</Text>
      <XStack mb="$4" space="$2">
        <ModelButton 
          flex={1}
          backgroundColor={model === 'sdxl' ? '$blue10' : undefined}
          color={model === 'sdxl' ? 'white' : undefined}
          onPress={() => setModel('sdxl')}
        >
          SDXL
        </ModelButton>

        <ModelButton
          flex={1}
          backgroundColor={model === 'dalle' && canUseDalle ? '$blue10' : undefined}
          color={model === 'dalle' && canUseDalle ? 'white' : undefined}
          onPress={() => canUseDalle && setModel('dalle')}
          disabled={!canUseDalle}
          opacity={canUseDalle ? 1 : 0.5}
        >
          DALL·E 3
        </ModelButton>
      </XStack>

      {/* サイズ選択 */}
      <Text mb="$2">サイズ:</Text>
      <XStack mb="$4" flexWrap="wrap" space="$2">
        {(['512x512', '768x768', '1024x1024'] as ImageSize[]).map((imageSize) => (
          <ModelButton
            key={imageSize}
            backgroundColor={size === imageSize ? '$blue10' : undefined}
            color={size === imageSize ? 'white' : undefined}
            onPress={() => setSize(imageSize)}
            mb="$2"
          >
            {imageSize}
          </ModelButton>
        ))}
      </XStack>

      {/* 品質選択 */}
      <Text mb="$2">品質:</Text>
      <XStack mb="$4" space="$2">
        <ModelButton
          flex={1}
          backgroundColor={quality === 'standard' ? '$blue10' : undefined}
          color={quality === 'standard' ? 'white' : undefined}
          onPress={() => setQuality('standard')}
        >
          標準
        </ModelButton>

        <ModelButton
          flex={1}
          backgroundColor={quality === 'hd' ? '$blue10' : undefined}
          color={quality === 'hd' ? 'white' : undefined}
          onPress={() => setQuality('hd')}
        >
          高品質
        </ModelButton>
      </XStack>

      {/* エラー表示 */}
      {generationError && (
        <Text color="$red10" mb="$4">
          {generationError}
        </Text>
      )}

      {/* ボタン */}
      <XStack space="$3">
        <Button
          flex={1}
          backgroundColor="$gray5"
          onPress={onClose}
          disabled={isGenerating}
        >
          キャンセル
        </Button>

        <Button
          flex={2}
          backgroundColor="$blue10"
          onPress={handleGenerate}
          disabled={isGenerating || !prompt.trim() || (sdxlQuota.remaining <= 0 && dalleQuota.remaining <= 0)}
        >
          {isGenerating ? (
            <ActivityIndicator color="white" />
          ) : (
            '画像を生成'
          )}
        </Button>
      </XStack>
    </Container>
  );
};

const Container = styled(YStack, {
  padding: '$5',
});

const ModelButton = styled(Button, {
  borderWidth: 1,
  borderColor: '$borderColor',
}); 