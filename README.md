# AI ChatBot

LINE風のAIチャットボットアプリケーション。Expo React Nativeで構築され、OpenRouterを使用したクラウドAIモデルとローカルAIモデル（Qwen3:4B）の両方をサポートしています。

## 機能

- 複数のAIモデルとの会話
- ローカルモデルのダウンロードとオフライン使用
- チャット履歴の保存と管理
- ノート機能
- ダークモード対応
- 複数の言語サポート（日本語・英語）
- 画像生成機能（DALL-E 3およびSDXL対応）

## 技術スタック

- Expo React Native
- Expo Router
- Zustand (状態管理)
- Tamagui (UIコンポーネント)
- OpenRouter API (AIモデル)
- Supabase (Edge Functions)
- OpenAI API (DALL-E 3)
- Cloudflare Workers (SDXL)

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

### APIキーの管理（セキュリティ強化版）

このプロジェクトでは、セキュリティを向上させるためにすべてのAPIキーをSupabaseのEdge Functionで管理しています。クライアント側のコードにAPIキーを保持しない実装に変更されています。

以下のAPIキーがSupabase Edge Functionで管理されています：

- **OpenRouter**: AIモデルへのアクセス
- **OpenAI**: DALL-E 3画像生成
- **Cloudflare**: SDXL画像生成

**重要**: 詳細なAPIキー設定手順については `.ai_assistant_docs/supabase_api_key_setup.md` を参照してください。ここでは各サービスのAPIキーの取得方法と、Supabase Edge FunctionのSecretsとして設定する手順が説明されています。

### APIキーのセットアップ

1. [OpenRouter](https://openrouter.ai/)、[OpenAI](https://platform.openai.com/)、[Cloudflare](https://developers.cloudflare.com/)で各APIキーを取得
2. Supabase Edge Functionに環境変数として設定（推奨）
   ```bash
   supabase login
   supabase secrets set OPENROUTER_API_KEY=your_api_key_here
   supabase secrets set OPENAI_API_KEY=your_api_key_here
   supabase secrets set CLOUDFLARE_API_KEY=your_api_key_here
   ```

### Supabase Edge Functionのデプロイ

```bash
cd supabase/functions
# OpenRouter APIプロキシ
supabase functions deploy openrouter-proxy --no-verify-jwt
# 画像生成API統合
supabase functions deploy image-generator --no-verify-jwt
```

#### Dockerがない環境でのデプロイ方法

Dockerがインストールされていない環境では、Supabaseダッシュボードから直接デプロイできます：

1. Supabaseダッシュボードにログイン
2. 「Functions」セクションに移動
3. 「Create a new function」ボタンをクリック
4. 関数名を入力（`openrouter-proxy`や`image-generator`）
5. 各関数のソースコードをアップロード
6. 「Environment variables」で必要なAPIキーを設定
7. 「Deploy Function」をクリック

## アーキテクチャ

このアプリケーションでは、以下のSupabase Edge Functionを使用してAPIキーを安全に管理しています：

1. `openrouter-proxy`: OpenRouter APIの呼び出しを仲介
2. `image-generator`: 画像生成APIの呼び出しを仲介（DALL-E、SDXL両対応）

クライアントアプリは直接APIキーを保持せず、すべてのAPI呼び出しをこれらのEdge Function経由で行います。

## 使用方法

1. アプリを起動
2. 「New Chat」タブから新しい会話を開始
3. モデルを選択して会話を開始
4. 設定画面からテーマやサブスクリプションを管理
5. 画像生成は会話中に「/image」コマンドで利用可能

## サブスクリプションプラン

- **フリープラン**: 基本的なAIモデルへのアクセス
- **Liteプラン** (¥780/月): 高性能AIモデルへのアクセス
- **Heavyプラン** (¥1,980/月): 最高性能AIモデルへのアクセス

## トラブルシューティング

- **APIキー認証エラー**: APIキーが無効または期限切れの場合、新しいキーを取得してSupabase Secretsを更新
- **Edge Function接続エラー**: Supabase Edge Functionが正しくデプロイされているか確認
- **画像生成エラー**: DALL-EとSDXLどちらも失敗する場合は、両方のAPIキーが正しく設定されているか確認

## セキュリティ上の注意

- APIキーなどの機密情報はGitリポジトリにコミットしないでください
- 常にSupabase Secretsや環境変数を使用してAPIキーを管理してください
- OpenRouterはGitHubリポジトリを監視しており、コミットされたAPIキーは自動的に無効化される場合があります
- クライアント側のコードにAPIキーを埋め込まないでください

## ライセンス

MIT
