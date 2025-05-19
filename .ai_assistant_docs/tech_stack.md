# 技術スタック

## フロントエンド
- **フレームワーク**: Expo React Native
- **状態管理**: Zustand
- **UI**: Tamagui
- **ナビゲーション**: Expo Router
- **ストレージ**:
  - SecureStore: 安全な小規模データ保存
  - AsyncStorage: 一般的な永続化
  - FileSystem: ファイル操作、モデル保存
- **リッチテキストエディタ (ノート機能)**: TipTap (ProseMirrorベース、WebView経由)

## バックエンド
- **Supabase**:
  - Authentication: ユーザー認証
  - Database: PostgreSQL
  - Storage: ファイル保存
  - Edge Functions: サーバーレスAPI

## AI統合
- **主要プロバイダー**:
  - OpenRouter: テキスト生成
  - Cloudflare Workers AI: 経済的な推論
  - OpenAI: 画像生成
- **ローカル推論**:
  - llama.rn: ネイティブ推論
  - Qwen3-4B (GGUF): 軽量モデル

## ビルド・デプロイ
- **開発**: Expo Go
- **本番ビルド**: EAS Build
- **配布**: EAS Submit
- **OTA更新**: EAS Update

## その他ツール
- **暗号化**: expo-crypto
- **ネットワーク**: axios
- **画像処理**: expo-image
- **シェア機能**: expo-sharing
- **ファイル選択**: expo-document-picker
- **コンパイル**: Metro 