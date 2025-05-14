import React from 'react';
import { View, TouchableOpacity, Linking } from 'react-native';
import { Text, Card, XStack, YStack, Separator } from 'tamagui';
import { useTheme } from '../ui/ThemeProvider';

/**
 * ライセンスアトリビューション（帰属表示）セクションコンポーネント
 * Qwen3 License Agreementなどの法的要件に基づく表示
 * @returns コンポーネント
 */
export const LicenseAttributionSection = () => {
  const theme = useTheme();
  
  return (
    <YStack space="$4" padding="$4">
      <Text fontSize="$5" fontWeight="bold" color="$gray12">
        ライセンス情報
      </Text>
      
      {/* Qwen3必須アトリビューション */}
      <Card bordered elevate padding="$4" borderRadius="$4">
        <YStack space="$2">
          <Text fontSize="$4" fontWeight="bold" color="$gray12">
            Qwen3-4B
          </Text>
          
          <Text fontSize="$3" color="$gray11">
            このアプリはAlibabaが開発したQwen3モデルを使用しています。
          </Text>
          
          <Text fontSize="$2" fontStyle="italic" color="$gray10">
            ライセンス: Qwen3 License Agreement
          </Text>
          
          <Separator marginVertical="$2" />
          
          <TouchableOpacity
            onPress={() => Linking.openURL('https://huggingface.co/Qwen/Qwen3-4B-GGUF')}
          >
            <XStack space="$2" alignItems="center">
              <Text fontSize="$2" color="$blue9">
                https://huggingface.co/Qwen/Qwen3-4B-GGUF
              </Text>
              <Text fontSize="$1" color="$blue9">→</Text>
            </XStack>
          </TouchableOpacity>
        </YStack>
      </Card>
      
      {/* 他のモデルやライブラリのライセンス情報 */}
      <Card bordered elevate padding="$4" borderRadius="$4">
        <YStack space="$2">
          <Text fontSize="$4" fontWeight="bold" color="$gray12">
            llama.cpp
          </Text>
          
          <Text fontSize="$3" color="$gray11">
            このアプリはllama.cppライブラリを使用してローカルモデルを実行しています。
          </Text>
          
          <Text fontSize="$2" fontStyle="italic" color="$gray10">
            ライセンス: MIT License
          </Text>
          
          <Separator marginVertical="$2" />
          
          <TouchableOpacity
            onPress={() => Linking.openURL('https://github.com/ggerganov/llama.cpp')}
          >
            <XStack space="$2" alignItems="center">
              <Text fontSize="$2" color="$blue9">
                https://github.com/ggerganov/llama.cpp
              </Text>
              <Text fontSize="$1" color="$blue9">→</Text>
            </XStack>
          </TouchableOpacity>
        </YStack>
      </Card>
    </YStack>
  );
};

export default LicenseAttributionSection; 