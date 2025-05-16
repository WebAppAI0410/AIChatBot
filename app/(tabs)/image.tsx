import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  KeyboardAvoidingView,
  Platform,
  StyleSheet
} from 'react-native';
import { Image } from 'expo-image';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useStore from '../../app/store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styled } from 'tamagui';
import { ImageGenerationPanel, ImageGenerationPanelHandle } from '../../app/components/ImageGenerationPanel';
import useColors from '../constants/colors';
import theme from '../ui/theme';

const SUGGESTIONS = [
  'リアルなキツネの写真',
  'カラフルな星空',
  '桜舞う日本の春',
  'サイバーパンクの都市',
  'ファンタジーの森',
];

export default function ImageScreen() {
  // ストアから必要な状態を取得
  const {
    generatedImages,
    sdxlQuota,
    dalleQuota,
    generateImage,
    isGenerating,
    incrementImageUsage,
    addGeneratedImage
  } = useStore();
  
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImagePanel, setShowImagePanel] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [fullScreenMode, setFullScreenMode] = useState(false);
  
  // ImageGenerationPanelへの参照
  const imagePanelRef = useRef<ImageGenerationPanelHandle>(null);

  // 画像詳細表示
  const handleImagePress = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  // 画像生成完了ハンドラ
  const handleImageGenerated = (imageUrl: string, generatedPrompt: string) => {
    // 生成が成功した場合
    addGeneratedImage({
      url: imageUrl,
      prompt: generatedPrompt || prompt,
      model: 'sdxl'
    });
    
    // 入力をクリア
    setPrompt('');
    
    // モーダル表示の場合は閉じる
    if (showImagePanel) {
      setShowImagePanel(false);
    }
  };
  
  // 送信ボタンハンドラ
  const handleSend = async () => {
    if (prompt.trim() === '') return;
    
    // 選択した手法で画像を生成
    if (fullScreenMode) {
      setShowImagePanel(true);
    } else if (imagePanelRef.current) {
      const success = await imagePanelRef.current.generateImage();
      if (success) {
        // handleImageGeneratedが呼ばれるので、ここでは何もしない
      }
    }
  };
  
  // チップをタップしたときの処理
  const handleChipPress = (suggestion: string) => {
    setPrompt(suggestion);
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={{ flex: 1, paddingTop: insets.top }}>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />
        
        {/* ヘッダー */}
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#e0e0e0'
        }}>
          <Text style={{ fontSize: 20, fontWeight: 'bold' }}>画像ギャラリー</Text>

          <TouchableOpacity
            style={{
              backgroundColor: colors.primary,
              paddingVertical: 8,
              paddingHorizontal: 16,
              borderRadius: 8
            }}
            onPress={() => {
              setFullScreenMode(true);
              setShowImagePanel(true);
            }}
          >
            <Text style={{ color: 'white' }}>詳細設定</Text>
          </TouchableOpacity>
        </View>

        {/* クォータ表示 */}
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          padding: 16,
          backgroundColor: '#f5f5f5'
        }}>
          <Text>
            SDXL: 残り {sdxlQuota.remaining}/{sdxlQuota.total}
          </Text>
          {dalleQuota.total > 0 && (
            <Text>
              DALL·E: 残り {dalleQuota.remaining}/{dalleQuota.total}
            </Text>
          )}
        </View>

        {/* サジェスチョンチップ */}
        <View style={styles.chipContainer}>
          {SUGGESTIONS.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={styles.chip}
              onPress={() => handleChipPress(suggestion)}
            >
              <Text style={styles.chipText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 画像ギャラリー */}
        {generatedImages && generatedImages.length > 0 ? (
          <FlatList
            data={generatedImages}
            numColumns={2}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={{ flex: 1, padding: 4 }}
                onPress={() => handleImagePress(item.url)}
              >
                <View style={{ 
                  borderRadius: 12, 
                  overflow: 'hidden',
                  backgroundColor: '#ffffff',
                  shadowColor: "#000",
                  shadowOffset: {
                    width: 0,
                    height: 2,
                  },
                  shadowOpacity: 0.1,
                  shadowRadius: 3,
                  elevation: 2,
                }}>
                  <Image
                    source={{ uri: item.url }}
                    style={{ aspectRatio: 1 }}
                    contentFit="cover"
                    transition={300}
                  />
                  <View style={{ 
                    padding: 8,
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0
                  }}>
                    <Text
                      style={{ 
                        color: 'white',
                        fontSize: 12 
                      }}
                      numberOfLines={1}
                    >
                      {item.prompt}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 4 }}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={{ textAlign: 'center' }}>
              まだ画像がありません。下のチャット入力から生成してみましょう。
            </Text>
          </View>
        )}

        {/* 画像生成チャット入力 (非モーダル) */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={prompt}
            onChangeText={setPrompt}
            placeholder="画像の説明を入力..."
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !prompt.trim() ? styles.sendButtonDisabled : null
            ]}
            onPress={handleSend}
            disabled={!prompt.trim() || isGenerating}
          >
            {isGenerating ? (
              <Ionicons name="sync" size={24} color="white" />
            ) : (
              <Ionicons name="sparkles-outline" size={24} color="white" />
            )}
          </TouchableOpacity>
        </View>

        {/* 非表示のImageGenerationPanel (参照用) */}
        <View style={{ height: 0, overflow: 'hidden' }}>
          <ImageGenerationPanel
            ref={imagePanelRef}
            prompt={prompt}
            onImageGenerated={handleImageGenerated}
            onClose={() => {}}
          />
        </View>

        {/* 画像詳細モーダル */}
        <Modal
          visible={!!selectedImage}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedImage(null)}
        >
          <View style={{ 
            flex: 1, 
            backgroundColor: 'rgba(0,0,0,0.8)', 
            justifyContent: 'center', 
            alignItems: 'center',
            padding: 16 
          }}>
            <TouchableOpacity
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
              onPress={() => setSelectedImage(null)}
            />

            <Image
              source={{ uri: selectedImage || '' }}
              style={{
                width: '100%',
                aspectRatio: 1,
                borderRadius: 12
              }}
              contentFit="contain"
            />
          </View>
        </Modal>

        {/* 画像生成詳細パネル（モーダル） */}
        <Modal
          visible={showImagePanel}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowImagePanel(false)}
        >
          <View style={{
            flex: 1,
            justifyContent: 'flex-end',
            backgroundColor: 'rgba(0,0,0,0.4)'
          }}>
            <View style={{
              backgroundColor: 'white',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              maxHeight: '80%'
            }}>
              {/* ヘッダーとクローズボタン */}
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>詳細設定</Text>
                <TouchableOpacity onPress={() => setShowImagePanel(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              
              <ImageGenerationPanel
                prompt={prompt}
                onImageGenerated={handleImageGenerated}
                onClose={() => setShowImagePanel(false)}
              />
            </View>
          </View>
        </Modal>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    paddingBottom: 0,
  },
  chip: {
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    margin: 4,
  },
  chipText: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#ffffff',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    maxHeight: 120,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#6366f1',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 