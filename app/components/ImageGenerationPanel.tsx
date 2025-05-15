import React, { useState, forwardRef, useImperativeHandle } from 'react';
import { 
  YStack, 
  Text, 
  XStack, 
  Button, 
  styled,
} from 'tamagui';
import useStore from '../store';

export type ImageSize = '512x512' | '768x768' | '1024x1024';
export type ImageQuality = 'standard' | 'hd';
export type ImageModel = 'sdxl' | 'dalle';

export type ImageGenerationPanelProps = {
  prompt: string;
  onImageGenerated: (imageUrl: string, prompt: string) => void;
  onClose: () => void;
};

export type ImageGenerationPanelHandle = {
  generateImage: () => Promise<boolean>;
  canGenerate: () => boolean;
};

export const ImageGenerationPanel = forwardRef<ImageGenerationPanelHandle, ImageGenerationPanelProps>(({
  prompt,
  onImageGenerated,
  onClose,
}, ref) => {
  const {
    sdxlQuota,
    dalleQuota,
    generateImage,
    isGenerating: storeIsGenerating,
    generationError
  } = useStore();

  const [size, setSize] = useState<ImageSize>('768x768');
  const [quality, setQuality] = useState<ImageQuality>('standard');
  const [model, setModel] = useState<ImageModel>('sdxl');

  // ユーザープランからDALL-E使用可能か判定（仮実装）
  const canUseDalle = dalleQuota.total > 0;
  
  // 選択中のモデルのクォータを取得
  const currentQuota = model === 'dalle' ? dalleQuota : sdxlQuota;

  // モデル切り替え - SDXLとDALL-Eのトグル
  const toggleModel = () => {
    if (canUseDalle) {
      setModel(model === 'sdxl' ? 'dalle' : 'sdxl');
    }
  };

  // サイズ切り替え - 512 → 768 → 1024 → 512...
  const toggleSize = () => {
    const sizes: ImageSize[] = ['512x512', '768x768', '1024x1024'];
    const currentIndex = sizes.indexOf(size);
    const nextIndex = (currentIndex + 1) % sizes.length;
    setSize(sizes[nextIndex]);
  };

  // 品質切り替え - 標準 ↔ 高品質
  const toggleQuality = () => {
    setQuality(quality === 'standard' ? 'hd' : 'standard');
  };

  // 画像生成ハンドラ - 親コンポーネントから呼び出されるように変更
  const handleGenerate = async () => {
    if (!prompt.trim()) return null;
    
    try {      
      // 画像生成
      const imageUrl = await generateImage({
        prompt,
        size,
        quality,
        model: canUseDalle && model === 'dalle' ? 'dalle' : 'sdxl',
      });

      return imageUrl;
    } catch (err) {
      // エラーはstore内でハンドリング済み
      console.error('Image generation error:', err);
      return null;
    }
  };

  // 親コンポーネントの送信ボタンが押されたときに呼び出される関数を公開
  useImperativeHandle(
    ref,
    () => ({
      generateImage: async () => {
        const imageUrl = await handleGenerate();
        if (imageUrl) {
          onImageGenerated(imageUrl, prompt);
          return true;
        }
        return false;
      },
      canGenerate: () => currentQuota.remaining > 0 && Boolean(prompt.trim())
    }),
    [currentQuota.remaining, prompt, handleGenerate, onImageGenerated]
  );

  return (
    <Container>
      <XStack alignItems="center" justifyContent="space-between">
        {/* トグルボタン群 */}
        <XStack space="$2">
          {/* モデル選択トグル */}
          <ToggleButton 
            backgroundColor={model === 'sdxl' ? '$blue9' : '$purple9'}
            onPress={toggleModel}
            disabled={!canUseDalle}
          >
            {model === 'sdxl' ? 'SDXL' : 'DALL-E'}
          </ToggleButton>

          {/* サイズ選択トグル */}
          <ToggleButton
            backgroundColor="$green9"
            onPress={toggleSize}
          >
            {size.split('x')[0]}
          </ToggleButton>

          {/* 品質選択トグル */}
          <ToggleButton
            backgroundColor={quality === 'standard' ? '$amber9' : '$orange9'}
            onPress={toggleQuality}
          >
            {quality === 'standard' ? '標準' : '高'}
          </ToggleButton>
        </XStack>

        {/* 残り回数表示 */}
        <Text color="$gray11" fontSize="$2">
          残り: {currentQuota.remaining}/{currentQuota.total}
        </Text>
      </XStack>

      {/* エラー表示 */}
      {generationError && (
        <Text color="$red10" fontSize="$2" mt="$1">
          {generationError}
        </Text>
      )}
    </Container>
  );
});

const Container = styled(YStack, {
  padding: '$2',
  paddingVertical: '$1',
  borderTopWidth: 1,
  borderTopColor: '$borderColor',
});

const ToggleButton = styled(Button, {
  paddingHorizontal: '$3',
  paddingVertical: '$1',
  borderRadius: '$4',
  fontSize: '$2',
  color: 'white',
}); 