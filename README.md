# AI ChatBot

LINE風のAIチャットボットアプリケーション。Expo React Nativeで構築され、OpenRouterを使用したクラウドAIモデルとローカルAIモデル（Qwen3:4B）の両方をサポートしています。

## 機能

- 複数のAIモデルとの会話
- ローカルモデルのダウンロードとオフライン使用
- チャット履歴の保存と管理
- ノート機能
- ダークモード対応
- 複数の言語サポート（日本語・英語）

## 技術スタック

- Expo React Native
- Expo Router
- Zustand (状態管理)
- Tamagui (UIコンポーネント)
- OpenRouter API (AIモデル)
- Supabase (Edge Functions)

## インストール

```bash
# リポジトリをクローン
git clone https://github.com/WebAppAI0410/AIChatBot.git
cd AIChatBot

# 依存関係をインストール
npm install

# 環境変数をセットアップ
cp .env.example .env.local
# .env.localを編集してAPIキーを設定

# アプリを起動
npx expo start
```

## 開発環境のセットアップ

### OpenRouter APIキーの設定

1. [OpenRouter](https://openrouter.ai/)でアカウントを作成し、APIキーを取得
2. **方法1**: Supabase Edge Functionに環境変数として設定（推奨）
   ```bash
   supabase login
   supabase secrets set OPENROUTER_API_KEY=your_api_key_here
   ```

3. **方法2**: 一時的な方法として、`supabase/functions/openrouter-proxy/index.ts`のフォールバック値として設定
   > ⚠️ 注意: この方法は開発時のみ使用し、プロダクション環境では必ずSupabase Secretsを使用してください。

### Supabase Edge Functionのデプロイ

```bash
cd supabase/functions
supabase functions deploy openrouter-proxy --no-verify-jwt
```

## 使用方法

1. アプリを起動
2. 「New Chat」タブから新しい会話を開始
3. モデルを選択して会話を開始
4. 設定画面からテーマやサブスクリプションを管理

## サブスクリプションプラン

- **フリープラン**: 基本的なAIモデルへのアクセス
- **Liteプラン** (¥780/月): 高性能AIモデルへのアクセス
- **Heavyプラン** (¥1,980/月): 最高性能AIモデルへのアクセス

## トラブルシューティング

- **APIキー認証エラー**: OpenRouter APIキーが無効または期限切れの場合、新しいキーを取得して再設定してください
- **Edge Function接続エラー**: Supabase Edge Functionが正しくデプロイされているか確認してください

## セキュリティ上の注意

- APIキーなどの機密情報はGitリポジトリにコミットしないでください
- 常にSupabase Secretsや環境変数を使用してAPIキーを管理してください
- OpenRouterはGitHubリポジトリを監視しており、コミットされたAPIキーは自動的に無効化される場合があります

## ライセンス

MIT
