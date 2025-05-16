import React, { useState, forwardRef, useImperativeHandle, useCallback } from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  YStack, 
  Text, 
  XStack, 
  Button, 
  styled,
} from 'tamagui';
import useStore from '../store';
import useColors from '../constants/colors';

export type ImageSize = '512x512' | '768x768' | '1024x1024';
export type ImageQuality = 'standard' | 'hd';
export type ImageModel = 'sdxl' | 'dalle';

export type ImageGenerationPanelProps = {
  prompt: string;
  onImageGenerated: (imageUrl: string, prompt: string, model: ImageModel) => void;
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
    generateImage: generateImageFromStore,
    isGenerating: storeIsGenerating,
    generationError
  } = useStore();

  const colors = useColors();
  const [size, setSize] = useState<ImageSize>('768x768');
  const [quality, setQuality] = useState<ImageQuality>('standard');
  const [model, setModel] = useState<ImageModel>('sdxl');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // ユーザープランからDALL-E使用可能か判定（仮実装）
  const canUseDalle = dalleQuota.total > 0;
  
  // 選択中のモデルのクォータを取得
  const currentQuota = model === 'dalle' ? dalleQuota : sdxlQuota;

  // モデル切り替え - SDXLとDALL-Eのトグル
  const toggleModel = () => {
    // 常に切り替え可能にする。ただし実際に使用する時はクォータをチェック
    setModel(model === 'sdxl' ? 'dalle' : 'sdxl');
    
    // DALL-Eが使えない場合は警告を表示
    if (model === 'sdxl' && !canUseDalle) {
      console.warn('DALL-E 3はプレミアムプランでのみ利用可能です');
      // ここで警告表示を出すこともできます
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
  const handleGenerate = useCallback(async () => {
    if (!prompt || loading) return null;
    
    try {
      setLoading(true);
      setError(null);
      
      console.log(`画像生成リクエスト開始: ${prompt.substring(0, 30)}...`);
      const imageUrl = await generateImageFromStore({
        prompt,
        size,
        quality,
        // 実際の使用時はクォータをチェック
        model: canUseDalle && model === 'dalle' ? 'dalle' : 'sdxl',
      });
      
      console.log('画像生成成功:', imageUrl.substring(0, 50) + '...');
      setGeneratedImage(imageUrl);
      
      // 画像を保存
      await onImageGenerated(imageUrl, prompt, model);
      
      return imageUrl;
    } catch (err: any) {
      console.error('Image generation error:', err);
      
      // エラーメッセージの改善
      let errorMessage = '画像の生成に失敗しました。';
      
      if (err.message) {
        if (err.message.includes('Network request failed')) {
          errorMessage = 'ネットワークエラー: サーバーに接続できませんでした。インターネット接続を確認して再試行してください。';
        } else if (err.message.includes('timeout') || err.message.includes('timed out')) {
          errorMessage = 'タイムアウト: サーバーからの応答が遅すぎます。後でもう一度お試しください。';
        } else if (err.message.includes('quota') || err.message.includes('limit')) {
          errorMessage = '利用制限: 画像生成の利用上限に達しました。プレミアムプランへのアップグレードをご検討ください。';
        } else if (err.message.includes('content policy') || err.message.includes('safety')) {
          errorMessage = 'コンテンツポリシー違反: プロンプトが安全ポリシーに違反している可能性があります。別の表現を試してください。';
        } else {
          errorMessage = `エラー: ${err.message}`;
        }
      }
      
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [prompt, size, quality, model, canUseDalle, generateImageFromStore, onImageGenerated, loading]);

  // 親コンポーネントの送信ボタンが押されたときに呼び出される関数を公開
  useImperativeHandle(
    ref,
    () => ({
      generateImage: async () => {
        const imageUrl = await handleGenerate();
        if (imageUrl) {
          // 実際に使用されるモデルを渡す
          const usedModel = canUseDalle && model === 'dalle' ? 'dalle' : 'sdxl';
          onImageGenerated(imageUrl, prompt, usedModel);
          return true;
        }
        return false;
      },
      canGenerate: () => currentQuota.remaining > 0 && Boolean(prompt.trim())
    }),
    [handleGenerate, onImageGenerated, model, canUseDalle, currentQuota.remaining, prompt]
  );

  return (
    <Container style={{ backgroundColor: colors.background, borderTopColor: colors.border }}>
      {/* トグルボタン群と残り枚数を同じ行に配置 */}
      <OptionsContainer style={{ backgroundColor: colors.lightGray }}>
        {/* モデル選択トグル */}
        <ToggleButton 
          backgroundColor={model === 'sdxl' ? '$blue9' : '$purple9'}
          borderColor={!canUseDalle && model === 'dalle' ? '$red10' : undefined}
          borderWidth={!canUseDalle && model === 'dalle' ? 1 : 0}
          onPress={toggleModel}
          flex={1}
          disabled={storeIsGenerating}
        >
          <ToggleButtonContent>
            <Ionicons 
              name={model === 'sdxl' ? 'color-palette' : 'flask'} 
              size={20} 
              color="white" 
              style={{ marginRight: 4 }}
            />
            <ToggleButtonText>
              {model === 'sdxl' ? 'SDXL' : 'DALL-E'}
            </ToggleButtonText>
            <Ionicons name="chevron-forward" size={16} color="white" style={{ marginLeft: 2 }} />
          </ToggleButtonContent>
        </ToggleButton>

        {/* サイズ選択トグル */}
        <ToggleButton
          backgroundColor="$green9"
          onPress={toggleSize}
          flex={1}
          disabled={storeIsGenerating}
        >
          <ToggleButtonContent>
            <Ionicons name="resize-outline" size={20} color="white" style={{ marginRight: 4 }} />
            <ToggleButtonText>
              {size.split('x')[0]}
            </ToggleButtonText>
            <Ionicons name="chevron-forward" size={16} color="white" style={{ marginLeft: 2 }} />
          </ToggleButtonContent>
        </ToggleButton>

        {/* 品質選択トグル */}
        <ToggleButton
          backgroundColor={quality === 'standard' ? '$amber9' : '$orange9'}
          onPress={toggleQuality}
          flex={1}
          disabled={storeIsGenerating}
        >
          <ToggleButtonContent>
            <Ionicons 
              name={quality === 'standard' ? 'speedometer-outline' : 'diamond-outline'} 
              size={20} 
              color="white" 
              style={{ marginRight: 4 }}
            />
            <ToggleButtonText>
              {quality === 'standard' ? '標準' : '高品質'}
            </ToggleButtonText>
            <Ionicons name="swap-horizontal" size={16} color="white" style={{ marginLeft: 2 }} />
          </ToggleButtonContent>
        </ToggleButton>

        {/* 残り回数表示 */}
        <QuotaDisplay style={{ backgroundColor: colors.lightGray }}>
          {storeIsGenerating ? (
            <Text color="$blue10" fontSize="$2" fontWeight="500">
              生成中...
            </Text>
          ) : (
            <Text color={colors.text} fontSize="$2" fontWeight="500">
              残り: {currentQuota.remaining}/{currentQuota.total}
            </Text>
          )}
        </QuotaDisplay>
      </OptionsContainer>

      {/* エラー表示 */}
      {error && (
        <ErrorText>
          <Ionicons name="alert-circle" size={14} color="#e53935" style={{marginRight: 4}} />
          {error}
        </ErrorText>
      )}

      {/* DALL-E利用不可の警告 */}
      {model === 'dalle' && !canUseDalle && (
        <WarningText>
          <Ionicons name="warning" size={14} color="#f57c00" style={{marginRight: 4}} />
          DALL-E 3はプレミアムプランでのみ利用可能です
        </WarningText>
      )}
    </Container>
  );
});

const Container = styled(YStack, {
  padding: '$2',
  paddingVertical: '$2',
  borderTopWidth: 1,
  borderTopColor: '$borderColor',
  backgroundColor: '$background',
  shadowColor: '#000',
  shadowOffset: { width: 0, height: -2 },
  shadowOpacity: 0.05,
  shadowRadius: 3,
  elevation: 2,
});

const OptionsContainer = styled(XStack, {
  space: "$2",
  alignItems: "center",
  justifyContent: "space-between",
  borderRadius: '$4',
  backgroundColor: '$backgroundHover',
});

const QuotaDisplay = styled(View, {
  paddingHorizontal: '$2',
  backgroundColor: '$backgroundHover',
  borderRadius: '$2',
  paddingVertical: '$1',
});

const ToggleButton = styled(Button, {
  paddingHorizontal: '$3',
  paddingVertical: '$3',
  height: 50,
  minHeight: 50,
  borderRadius: '$4',
  fontSize: '$3',
  color: 'white',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.3,
  shadowRadius: 2,
  elevation: 3,
  pressStyle: {
    opacity: 0.8,
    scale: 0.98,
  },
});

const ToggleButtonContent = styled(XStack, {
  alignItems: 'center',
  justifyContent: 'center',
  space: '$2',
});

const ToggleButtonText = styled(Text, {
  color: 'white',
  fontSize: '$3',
  fontWeight: 'bold',
}); 

const ErrorText = styled(Text, {
  color: '$red10',
  fontSize: '$2',
  mt: '$2',
  flexDirection: 'row',
  alignItems: 'center',
  display: 'flex',
});

const WarningText = styled(Text, {
  color: '$orange10',
  fontSize: '$2',
  mt: '$2',
  flexDirection: 'row',
  alignItems: 'center',
  display: 'flex',
}); 