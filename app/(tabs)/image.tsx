import React, { useState, useRef, useMemo } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  Modal, 
  TextInput, 
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ScrollView
} from 'react-native';
import { Image } from 'expo-image';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import useStore from '../../app/store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styled, YStack, XStack } from 'tamagui';
import { ImageGenerationPanel, ImageGenerationPanelHandle } from '../../app/components/ImageGenerationPanel';
import useColors from '../constants/colors';
import theme from '../ui/theme';
import { GeneratedImage } from '../../app/store/imageStore';
import { generateUuid } from '../../app/store/chatStore';
import Header from '../components/Header';

const SUGGESTIONS = [
  'リアルなキツネの写真',
  'カラフルな星空',
  '桜舞う日本の春',
  'サイバーパンクの都市',
  'ファンタジーの森',
];

// フィルタータイプの定義
type FilterType = 'all' | 'sdxl' | 'dalle';

export default function ImageScreen() {
  // ストアから必要な状態を取得
  const {
    generatedImages,
    sdxlQuota,
    dalleQuota,
    generateImage,
    isGenerating,
    incrementImageUsage,
    addGeneratedImage,
    theme: appTheme,
    colorTheme,
    createChat,
    addMessage,
    addImageMessage,
    updateChatTitle,
    getLastUsedModel,
    chats
  } = useStore();
  
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImagePanel, setShowImagePanel] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [showOptionsPanel, setShowOptionsPanel] = useState(false);
  const [isGridView, setIsGridView] = useState(true);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  
  // ImageGenerationPanelへの参照
  const imagePanelRef = useRef<ImageGenerationPanelHandle>(null);

  // フィルタリングされた画像リスト
  const filteredImages = useMemo(() => {
    if (!generatedImages || generatedImages.length === 0) return [];
    
    if (currentFilter === 'all') return generatedImages;
    
    return generatedImages.filter(img => img.model === currentFilter);
  }, [generatedImages, currentFilter]);

  // 画像詳細表示
  const handleImagePress = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };

  // 画像生成完了ハンドラ
  const handleImageGenerated = (
    imageUrl: string, 
    generatedPrompt: string,
    model: 'sdxl' | 'dalle' = 'sdxl' // デフォルト値を設定して後方互換性を保つ
  ) => {
    // 画像パネルで選択されているモデルを取得
    const panelModel = 
      imagePanelRef.current?.getSettings?.()?.model ?? 'sdxl';
    
    // 新しいチャットを作成
    const chatId = createChat(panelModel);

    // ユーザーのプロンプトをチャットに追加
    addMessage(chatId, {
      role: 'user',
      content: generatedPrompt || prompt,
    });

    // 生成された画像をアシスタントの返信として追加
    addImageMessage(chatId, {
      role: 'assistant',
      content: '生成された画像です',
      imageUrl,
    });

    // タイトルをプロンプトベースに更新
    const title = (generatedPrompt || prompt).slice(0, 30) + ((generatedPrompt || prompt).length > 30 ? '...' : '');
    updateChatTitle(chatId, title);

    // 注：addGeneratedImageは削除
    // すでにimageStore内のgenerateImage関数内で自動的に呼ばれているため重複

    // 入力をクリア
    setPrompt('');
    
    // モーダル表示の場合は閉じる
    if (showImagePanel) {
      setShowImagePanel(false);
    }

    // オプションパネルを閉じる
    setShowOptionsPanel(false);

    // 作成されたチャットルームに移動
    router.push(`/chat/${chatId}`);
  };
  
  // 送信ボタンハンドラ
  const handleSend = async () => {
    if (prompt.trim() === '') return;
    
    // オプションが非表示の場合は、まずパネルを表示する
    if (!showOptionsPanel) {
      setShowOptionsPanel(true);
      // パネルの表示が完了してからrefが確実にセットされるように遅延させる
      return;
    }
    
    // 画像パネルで選択されているモデルを取得
    const panelModel = 
      imagePanelRef.current?.getSettings?.()?.model ?? 'sdxl';
    
    // 先にチャットを作成
    const chatId = createChat(panelModel);
    
    // ユーザーのプロンプトをチャットに追加
    addMessage(chatId, {
      role: 'user',
      content: prompt,
    });
    
    // プロンプトに基づいてタイトルを設定
    const title = prompt.slice(0, 30) + (prompt.length > 30 ? '...' : '');
    updateChatTitle(chatId, title);
    
    // "生成中..."メッセージを追加
    const pendingId = generateUuid();
    addMessage(chatId, {
      id: pendingId,
      role: 'assistant',
      content: '画像を生成中...',
    });
    
    // 即座にチャットルームに移行（クエリパラメータで画像モードをオンに）
    router.push({
      pathname: `/chat/${chatId}`,
      params: { image_mode: 'true' }
    });

    // 画像生成処理はバックグラウンドで続行
    if (imagePanelRef.current) {
      try {
        // パネルの設定（サイズ/品質/モデル）を保持したまま画像生成を実行
        generateImage({
          prompt,
          size: imagePanelRef.current.getSettings?.()?.size || '768x768',
          quality: imagePanelRef.current.getSettings?.()?.quality || 'standard',
          model: imagePanelRef.current.getSettings?.()?.model || 'sdxl',
          chatId,
        }).then(imageUrl => {
          // 生成された画像で一時メッセージを置き換え
          // replaceMessage関数が存在しない場合は、新しいメッセージを追加
          console.log('Image generated successfully:', imageUrl);
        }).catch(err => {
          console.error('Image generation error:', err);
          // エラーメッセージを追加
          addMessage(chatId, {
            role: 'assistant',
            content: `画像生成に失敗しました: ${err.message || 'エラーが発生しました'}`,
          });
        });
      } catch (err) {
        console.error('Image generation error:', err);
      }
    } else {
      console.warn('ImageGenerationPanel reference is not available');
    }
    
    // 入力をクリア
    setPrompt('');
    // オプションパネルを閉じる
    setShowOptionsPanel(false);
  };
  
  // チップをタップしたときの処理
  const handleChipPress = (suggestion: string) => {
    setPrompt(suggestion);
  };

  // オプションパネルの表示を切り替え
  const toggleOptionsPanel = () => {
    setShowOptionsPanel(!showOptionsPanel);
  };

  // 表示モードの切り替え
  const toggleViewMode = () => {
    setIsGridView(!isGridView);
  };

  // フィルターの適用
  const applyFilter = (filter: FilterType) => {
    setCurrentFilter(filter);
    setShowFilterModal(false);
  };

  // リスト表示用のレンダリング関数
  const renderListItem = ({ item }: { item: GeneratedImage }) => (
    <TouchableOpacity
      style={[
        styles.listItem,
        { backgroundColor: colors.card, borderBottomColor: colors.border }
      ]}
      onPress={() => handleImagePress(item.url)}
    >
      <View style={styles.listItemContent}>
        <Image
          source={{ uri: item.url }}
          style={styles.listItemImage}
          contentFit="cover"
          transition={300}
        />
        <View style={styles.listItemDetails}>
          <Text style={[styles.listItemPrompt, { color: colors.text }]} numberOfLines={2}>
            {item.prompt}
          </Text>
          <View style={styles.listItemMeta}>
            <View style={[
              styles.modelBadge, 
              { 
                backgroundColor: item.model === 'dalle' ? '#a78bfa' : '#38bdf8'
              }
            ]}>
              <Text style={styles.modelBadgeText}>
                {item.model === 'dalle' ? 'DALL-E' : 'SDXL'}
              </Text>
            </View>
            {item.createdAt && (
              <Text style={[styles.dateText, { color: colors.secondaryText }]}>
                {new Date(item.createdAt).toLocaleDateString()}
              </Text>
            )}
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  // グリッド表示用のレンダリング関数
  const renderGridItem = ({ item }: { item: GeneratedImage }) => (
    <TouchableOpacity
      style={{ flex: 1, padding: 4 }}
      onPress={() => handleImagePress(item.url)}
    >
      <View style={{ 
        borderRadius: 12, 
        overflow: 'hidden',
        backgroundColor: colors.card,
        shadowColor: colors.text,
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
  );

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={{ 
        flex: 1, 
        paddingTop: insets.top,
        backgroundColor: colors.background
      }}>
        <Stack.Screen
          options={{
            headerShown: false,
          }}
        />
        
        {/* ヘッダー */}
        <Header
          title="画像ギャラリー"
          showBack={false}
          rightComponent={
          <View style={{ flexDirection: 'row' }}>
            {/* 表示切替ボタン */}
            <TouchableOpacity
                style={[styles.headerButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}
              onPress={toggleViewMode}
            >
              <Ionicons 
                name={isGridView ? "list-outline" : "grid-outline"} 
                size={20} 
                  color={colors.textOnPrimary} 
              />
            </TouchableOpacity>

            {/* フィルターボタン */}
            <TouchableOpacity
                style={[styles.headerButton, { backgroundColor: 'rgba(255, 255, 255, 0.2)', marginLeft: 8 }]}
              onPress={() => setShowFilterModal(true)}
            >
              <Ionicons 
                name="filter-outline" 
                size={20} 
                  color={currentFilter !== 'all' ? colors.textOnPrimary : colors.textOnPrimary} 
              />
              {currentFilter !== 'all' && (
                <View style={styles.filterActiveDot} />
              )}
            </TouchableOpacity>
          </View>
          }
        />
        
        {/* ヘッダー下のコンテンツ */}

        {/* クォータ表示 */}
        <View style={{ 
          flexDirection: 'row', 
          justifyContent: 'space-between', 
          padding: 16,
          backgroundColor: colors.card
        }}>
          <Text style={{ color: colors.text }}>
            SDXL: 残り {sdxlQuota.remaining}/{sdxlQuota.total}
          </Text>
          {dalleQuota.total > 0 && (
            <Text style={{ color: colors.text }}>
              DALL·E: 残り {dalleQuota.remaining}/{dalleQuota.total}
            </Text>
          )}
        </View>

        {/* サジェスチョンチップ */}
        <View style={[styles.chipContainer, { backgroundColor: colors.background }]}>
          {SUGGESTIONS.map((suggestion, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.chip, { backgroundColor: colors.lightGray }]}
              onPress={() => handleChipPress(suggestion)}
            >
              <Text style={[styles.chipText, { color: colors.text }]}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 画像ギャラリー */}
        {filteredImages && filteredImages.length > 0 ? (
          <FlatList
            data={filteredImages}
            numColumns={isGridView ? 2 : 1}
            key={isGridView ? 'grid' : 'list'} // キーを変更して再レンダリングを強制
            renderItem={isGridView ? renderGridItem : renderListItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 4 }}
            style={{ backgroundColor: colors.background }}
          />
        ) : (
          <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
            <Text style={{ textAlign: 'center', color: colors.text }}>
              {currentFilter !== 'all' 
                ? `${currentFilter === 'dalle' ? 'DALL-E' : 'SDXL'}で生成された画像はありません。` 
                : 'まだ画像がありません。下のチャット入力から生成してみましょう。'}
            </Text>
          </View>
        )}

        {/* 画像生成チャット入力 (非モーダル) */}
        <View style={[
          styles.inputContainer, 
          { 
            borderTopColor: colors.border,
            backgroundColor: colors.background 
          }
        ]}>
          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: colors.lightGray,
                color: colors.text
              }
            ]}
            value={prompt}
            onChangeText={setPrompt}
            placeholder="画像の説明を入力..."
            placeholderTextColor={colors.gray}
            multiline
          />
          <TouchableOpacity
            style={styles.optionsButton}
            onPress={toggleOptionsPanel}
          >
            <Ionicons name={showOptionsPanel ? "chevron-down" : "options-outline"} size={24} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.sendButton,
              !prompt.trim() ? styles.sendButtonDisabled : { backgroundColor: colors.primary },
            ]}
            onPress={handleSend}
            disabled={!prompt.trim() || isGenerating}
          >
            {isGenerating ? (
              <Ionicons name="sync" size={24} color={colors.textOnPrimary} />
            ) : (
              <Ionicons name="sparkles-outline" size={24} color={colors.textOnPrimary} />
            )}
          </TouchableOpacity>
        </View>

        {/* オプション選択パネル - チャットルームと同じUIを実装 */}
        {showOptionsPanel && (
          <View style={{ 
            backgroundColor: colors.background, 
            borderTopWidth: 1,
            borderTopColor: colors.border,
            shadowColor: colors.text,
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
            elevation: 2,
          }}>
            <ImageGenerationPanel
              ref={imagePanelRef}
              prompt={prompt}
              onImageGenerated={handleImageGenerated}
              onClose={() => {}}
            />
          </View>
        )}

        {/* 非表示のImageGenerationPanel (参照用) */}
        {!showOptionsPanel && (
          null
        )}

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
              backgroundColor: colors.background,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              maxHeight: '80%'
            }}>
              {/* ヘッダーとクローズボタン */}
              <View style={[
                styles.modalHeader, 
                { 
                  borderBottomColor: colors.border,
                  backgroundColor: colors.background
                }
              ]}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>詳細設定</Text>
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

        {/* フィルターモーダル */}
        <Modal
          visible={showFilterModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowFilterModal(false)}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              backgroundColor: 'rgba(0,0,0,0.4)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            activeOpacity={1}
            onPress={() => setShowFilterModal(false)}
          >
            <View 
              style={{
                width: '80%',
                backgroundColor: colors.background,
                borderRadius: 12,
                padding: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 4,
                elevation: 5,
              }}
            >
              <Text style={{ 
                fontSize: 18, 
                fontWeight: 'bold', 
                marginBottom: 16, 
                color: colors.text 
              }}>
                フィルター
              </Text>
              
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  currentFilter === 'all' && { backgroundColor: colors.lightGray }
                ]}
                onPress={() => applyFilter('all')}
              >
                <Text style={{ color: colors.text }}>すべて表示</Text>
                {currentFilter === 'all' && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  currentFilter === 'sdxl' && { backgroundColor: colors.lightGray }
                ]}
                onPress={() => applyFilter('sdxl')}
              >
                <Text style={{ color: colors.text }}>SDXLのみ</Text>
                {currentFilter === 'sdxl' && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  currentFilter === 'dalle' && { backgroundColor: colors.lightGray }
                ]}
                onPress={() => applyFilter('dalle')}
              >
                <Text style={{ color: colors.text }}>DALL-Eのみ</Text>
                {currentFilter === 'dalle' && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.closeFilterButton,
                  { backgroundColor: colors.primary }
                ]}
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={{ color: colors.textOnPrimary }}>閉じる</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
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
  optionsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
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
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterActiveDot: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 8,
  },
  closeFilterButton: {
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  listItem: {
    borderBottomWidth: 1,
    marginBottom: 2,
    padding: 12,
  },
  listItemContent: {
    flexDirection: 'row',
  },
  listItemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  listItemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  listItemPrompt: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  listItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  modelBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dateText: {
    fontSize: 12,
  },
}); 