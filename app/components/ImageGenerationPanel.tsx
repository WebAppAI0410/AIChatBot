import React, { useState, forwardRef, useImperativeHandle, useCallback, useEffect } from 'react';
import { View, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  YStack, 
  Text, 
  XStack, 
  Button, 
  styled,
  ScrollView,
} from 'tamagui';
import useStore from '../store';
import useColors from '../constants/colors';
import { generateTextToImage, generateImageToImage, upscaleImage } from '../services/api';

export type FalImageSize = 'square_hd' | 'square' | 'portrait_4_3' | 'portrait_16_9' | 'landscape_4_3' | 'landscape_16_9';
export type FalOperationType = 'text-to-image' | 'image-to-image' | 'upscaler';
export type UpscaleModel = 'RealESRGAN_x4plus' | 'RealESRGAN_x2plus' | 'RealESRGAN_x4plus_anime_6B' | 'RealESRGAN_x4_v3';

export type ImageGenerationPanelProps = {
  prompt: string;
  sourceImageUrl?: string; // For image-to-image and upscaler
  onImageGenerated: (imageUrl: string, prompt: string, operation: FalOperationType) => void;
  onClose: () => void;
  chatId?: string | null;
};

export type ImageGenerationPanelHandle = {
  generateImage: () => Promise<boolean>;
  canGenerate: () => boolean;
  getSettings: () => {
    size: FalImageSize;
    operation: FalOperationType;
    model: UpscaleModel;
  };
};

// Daily limits for free usage
const DAILY_LIMITS = {
  'text-to-image': 10,
  'image-to-image': 5,
  'upscaler': 5
};

export const ImageGenerationPanel = forwardRef<ImageGenerationPanelHandle, ImageGenerationPanelProps>(({
  prompt,
  sourceImageUrl,
  onImageGenerated,
  onClose,
  chatId,
}, ref) => {
  const colors = useColors();
  
  // Settings state
  const [operation, setOperation] = useState<FalOperationType>('text-to-image');
  const [size, setSize] = useState<FalImageSize>('landscape_4_3');
  const [upscaleModel, setUpscaleModel] = useState<UpscaleModel>('RealESRGAN_x4plus');
  const [scale, setScale] = useState(2);
  const [strength, setStrength] = useState(0.8);
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [usageCount, setUsageCount] = useState({
    'text-to-image': 0,
    'image-to-image': 0,
    'upscaler': 0
  });

  // Check if we can use the current operation
  const canUseOperation = usageCount[operation] < DAILY_LIMITS[operation];

  // Auto-select operation based on available inputs
  useEffect(() => {
    if (sourceImageUrl && !prompt.trim()) {
      setOperation('upscaler');
    } else if (sourceImageUrl && prompt.trim()) {
      setOperation('image-to-image');
    } else {
      setOperation('text-to-image');
    }
  }, [sourceImageUrl, prompt]);

  // Operation toggle
  const toggleOperation = () => {
    const operations: FalOperationType[] = ['text-to-image', 'image-to-image', 'upscaler'];
    const currentIndex = operations.indexOf(operation);
    const nextIndex = (currentIndex + 1) % operations.length;
    setOperation(operations[nextIndex]);
  };

  // Size toggle
  const toggleSize = () => {
    const sizes: FalImageSize[] = ['landscape_4_3', 'portrait_4_3', 'square', 'square_hd', 'landscape_16_9', 'portrait_16_9'];
    const currentIndex = sizes.indexOf(size);
    const nextIndex = (currentIndex + 1) % sizes.length;
    setSize(sizes[nextIndex]);
  };

  // Upscale model toggle
  const toggleUpscaleModel = () => {
    const models: UpscaleModel[] = ['RealESRGAN_x4plus', 'RealESRGAN_x2plus', 'RealESRGAN_x4plus_anime_6B', 'RealESRGAN_x4_v3'];
    const currentIndex = models.indexOf(upscaleModel);
    const nextIndex = (currentIndex + 1) % models.length;
    setUpscaleModel(models[nextIndex]);
  };

  // Scale toggle
  const toggleScale = () => {
    const scales = [2, 3, 4];
    const currentIndex = scales.indexOf(scale);
    const nextIndex = (currentIndex + 1) % scales.length;
    setScale(scales[nextIndex]);
  };

  // Strength toggle
  const toggleStrength = () => {
    const strengths = [0.5, 0.6, 0.7, 0.8, 0.9];
    const currentIndex = strengths.indexOf(strength);
    const nextIndex = (currentIndex + 1) % strengths.length;
    setStrength(strengths[nextIndex]);
  };

  // Get operation display info
  const getOperationInfo = () => {
    switch (operation) {
      case 'text-to-image':
        return {
          icon: 'create-outline',
          label: 'テキスト→画像',
          color: '$blue9',
          description: 'FLUX Schnell（高速）'
        };
      case 'image-to-image':
        return {
          icon: 'swap-horizontal-outline',
          label: '画像→画像',
          color: '$purple9',
          description: 'FLUX Redux（高品質）'
        };
      case 'upscaler':
        return {
          icon: 'expand-outline',
          label: 'アップスケール',
          color: '$green9',
          description: 'Real-ESRGAN（高解像度化）'
        };
    }
  };

  // Get size display
  const getSizeDisplay = () => {
    switch (size) {
      case 'landscape_4_3': return '横長4:3';
      case 'portrait_4_3': return '縦長4:3';
      case 'landscape_16_9': return '横長16:9';
      case 'portrait_16_9': return '縦長16:9';
      case 'square': return '正方形';
      case 'square_hd': return '正方形HD';
      default: return size;
    }
  };

  // Get upscale model display
  const getUpscaleModelDisplay = () => {
    switch (upscaleModel) {
      case 'RealESRGAN_x4plus': return '汎用4x';
      case 'RealESRGAN_x2plus': return '汎用2x';
      case 'RealESRGAN_x4plus_anime_6B': return 'アニメ4x';
      case 'RealESRGAN_x4_v3': return '改良4x';
      default: return upscaleModel;
    }
  };

  // Main generation handler
  const handleGenerate = useCallback(async () => {
    if (loading) return null;
    
    // Validation
    if (operation === 'text-to-image' && !prompt.trim()) {
      setError('プロンプトを入力してください');
      return null;
    }
    
    if ((operation === 'image-to-image' || operation === 'upscaler') && !sourceImageUrl) {
      setError('ソース画像が必要です');
      return null;
    }
    
    if (operation === 'image-to-image' && !prompt.trim()) {
      setError('画像変換にはプロンプトが必要です');
      return null;
    }

    if (!canUseOperation) {
      setError(`本日の${getOperationInfo().label}制限（${DAILY_LIMITS[operation]}回）に達しました`);
      return null;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log(`${operation} generation request:`, { prompt: prompt.substring(0, 30), operation });
      
      let imageUrl: string;
      const userId = 'anonymous'; // Replace with actual user ID if available

      switch (operation) {
        case 'text-to-image':
          imageUrl = await generateTextToImage({
            prompt,
            imageSize: size,
            numInferenceSteps: 4,
            userId
          });
          break;
          
        case 'image-to-image':
          imageUrl = await generateImageToImage({
            prompt,
            imageUrl: sourceImageUrl!,
            strength,
            userId
          });
          break;
          
        case 'upscaler':
          imageUrl = await upscaleImage({
            imageUrl: sourceImageUrl!,
            scale,
            model: upscaleModel,
            userId
          });
          break;
          
        default:
          throw new Error('Invalid operation type');
      }
      
      console.log('Image generation success:', imageUrl.substring(0, 50) + '...');
      setGeneratedImage(imageUrl);
      
      // Update usage count
      setUsageCount(prev => ({
        ...prev,
        [operation]: prev[operation] + 1
      }));
      
      return imageUrl;
    } catch (err: any) {
      console.error('Image generation error:', err);
      
      let errorMessage = '画像の生成に失敗しました。';
      
      if (err.message) {
        if (err.message.includes('Network request failed')) {
          errorMessage = 'ネットワークエラー: サーバーに接続できませんでした。';
        } else if (err.message.includes('timeout')) {
          errorMessage = 'タイムアウト: サーバーからの応答が遅すぎます。';
        } else if (err.message.includes('limit') || err.message.includes('quota')) {
          errorMessage = err.message;
        } else if (err.message.includes('safety')) {
          errorMessage = 'コンテンツポリシー違反: プロンプトを変更してください。';
        } else {
          errorMessage = `エラー: ${err.message}`;
        }
      }
      
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, [operation, prompt, sourceImageUrl, size, scale, upscaleModel, strength, loading, canUseOperation]);

  // Expose methods to parent component
  useImperativeHandle(
    ref,
    () => ({
      generateImage: async () => {
        const imageUrl = await handleGenerate();
        if (imageUrl) {
          onImageGenerated(imageUrl, prompt, operation);
          return true;
        }
        return false;
      },
      canGenerate: () => canUseOperation && (operation === 'upscaler' || Boolean(prompt.trim())),
      getSettings: () => ({
        size,
        operation,
        model: upscaleModel,
      })
    }),
    [handleGenerate, onImageGenerated, operation, prompt, canUseOperation, size, upscaleModel]
  );

  const operationInfo = getOperationInfo();

  return (
    <Container style={{ backgroundColor: colors.background, borderTopColor: colors.border }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <OptionsContainer style={{ backgroundColor: colors.lightGray }}>
          {/* Operation toggle */}
          <ToggleButton 
            backgroundColor={operationInfo.color}
            onPress={toggleOperation}
            disabled={loading}
          >
            <ToggleButtonContent>
              <Ionicons 
                name={operationInfo.icon as any} 
                size={20} 
                color="white" 
                style={{ marginRight: 4 }}
              />
              <ToggleButtonText>
                {operationInfo.label}
              </ToggleButtonText>
              <Ionicons name="chevron-forward" size={16} color="white" style={{ marginLeft: 2 }} />
            </ToggleButtonContent>
          </ToggleButton>

          {/* Size toggle (only for text-to-image and image-to-image) */}
          {(operation === 'text-to-image' || operation === 'image-to-image') && (
            <ToggleButton
              backgroundColor="$orange9"
              onPress={toggleSize}
              disabled={loading}
            >
              <ToggleButtonContent>
                <Ionicons name="resize-outline" size={20} color="white" style={{ marginRight: 4 }} />
                <ToggleButtonText>
                  {getSizeDisplay()}
                </ToggleButtonText>
                <Ionicons name="chevron-forward" size={16} color="white" style={{ marginLeft: 2 }} />
              </ToggleButtonContent>
            </ToggleButton>
          )}

          {/* Upscale-specific controls */}
          {operation === 'upscaler' && (
            <>
              <ToggleButton
                backgroundColor="$green10"
                onPress={toggleScale}
                disabled={loading}
              >
                <ToggleButtonContent>
                  <Ionicons name="expand-outline" size={20} color="white" style={{ marginRight: 4 }} />
                  <ToggleButtonText>
                    {scale}x
                  </ToggleButtonText>
                  <Ionicons name="chevron-forward" size={16} color="white" style={{ marginLeft: 2 }} />
                </ToggleButtonContent>
              </ToggleButton>

              <ToggleButton
                backgroundColor="$teal9"
                onPress={toggleUpscaleModel}
                disabled={loading}
              >
                <ToggleButtonContent>
                  <Ionicons name="settings-outline" size={20} color="white" style={{ marginRight: 4 }} />
                  <ToggleButtonText>
                    {getUpscaleModelDisplay()}
                  </ToggleButtonText>
                  <Ionicons name="chevron-forward" size={16} color="white" style={{ marginLeft: 2 }} />
                </ToggleButtonContent>
              </ToggleButton>
            </>
          )}

          {/* Strength control (only for image-to-image) */}
          {operation === 'image-to-image' && (
            <ToggleButton
              backgroundColor="$indigo9"
              onPress={toggleStrength}
              disabled={loading}
            >
              <ToggleButtonContent>
                <Ionicons name="options-outline" size={20} color="white" style={{ marginRight: 4 }} />
                <ToggleButtonText>
                  強度 {Math.round(strength * 100)}%
                </ToggleButtonText>
                <Ionicons name="swap-horizontal" size={16} color="white" style={{ marginLeft: 2 }} />
              </ToggleButtonContent>
            </ToggleButton>
          )}

          {/* Usage count display */}
          <QuotaDisplay style={{ backgroundColor: colors.lightGray }}>
            {loading ? (
              <Text color="$blue10" fontSize="$2" fontWeight="500">
                生成中...
              </Text>
            ) : (
              <Text color={colors.text} fontSize="$2" fontWeight="500">
                残り: {DAILY_LIMITS[operation] - usageCount[operation]}/{DAILY_LIMITS[operation]}
              </Text>
            )}
          </QuotaDisplay>
        </OptionsContainer>
      </ScrollView>

      {/* Description */}
      <DescriptionText>
        <Ionicons name="information-circle" size={14} color="#2196f3" style={{marginRight: 4}} />
        {operationInfo.description}
      </DescriptionText>

      {/* Source image preview (for image-to-image and upscaler) */}
      {sourceImageUrl && (operation === 'image-to-image' || operation === 'upscaler') && (
        <SourceImageContainer>
          <Text fontSize="$2" color={colors.text} marginBottom="$2">ソース画像:</Text>
          <SourceImage source={{ uri: sourceImageUrl }} />
        </SourceImageContainer>
      )}

      {/* Error display */}
      {error && (
        <ErrorText>
          <Ionicons name="alert-circle" size={14} color="#e53935" style={{marginRight: 4}} />
          {error}
        </ErrorText>
      )}

      {/* Limit warning */}
      {!canUseOperation && (
        <WarningText>
          <Ionicons name="warning" size={14} color="#f57c00" style={{marginRight: 4}} />
          本日の{operationInfo.label}制限に達しました（{DAILY_LIMITS[operation]}回/日）
        </WarningText>
      )}
    </Container>
  );
});

const Container = styled(YStack, {
  padding: '$3',
  paddingVertical: '$3',
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
  paddingHorizontal: '$2',
  paddingVertical: '$2',
  borderRadius: '$4',
  backgroundColor: '$backgroundHover',
});

const QuotaDisplay = styled(View, {
  paddingHorizontal: '$3',
  backgroundColor: '$backgroundHover',
  borderRadius: '$3',
  paddingVertical: '$2',
  minWidth: 80,
  alignItems: 'center',
});

const ToggleButton = styled(Button, {
  paddingHorizontal: '$3',
  paddingVertical: '$2',
  height: 48,
  minHeight: 48,
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
  space: '$1',
});

const ToggleButtonText = styled(Text, {
  color: 'white',
  fontSize: '$2',
  fontWeight: 'bold',
}); 

const DescriptionText = styled(Text, {
  color: '$blue10',
  fontSize: '$2',
  marginTop: '$2',
  flexDirection: 'row',
  alignItems: 'center',
  display: 'flex',
});

const ErrorText = styled(Text, {
  color: '$red10',
  fontSize: '$2',
  marginTop: '$2',
  flexDirection: 'row',
  alignItems: 'center',
  display: 'flex',
});

const WarningText = styled(Text, {
  color: '$orange10',
  fontSize: '$2',
  marginTop: '$2',
  flexDirection: 'row',
  alignItems: 'center',
  display: 'flex',
});

const SourceImageContainer = styled(YStack, {
  marginTop: '$3',
  padding: '$2',
  backgroundColor: '$gray2',
  borderRadius: '$3',
});

const SourceImage = styled(Image, {
  width: 100,
  height: 100,
  borderRadius: '$2',
  backgroundColor: '$gray5',
}); 