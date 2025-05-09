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

## インストール

```bash
# リポジトリをクローン
git clone https://github.com/WebAppAI0410/AIChatBot.git
cd AIChatBot

# 依存関係をインストール
npm install

# アプリを起動
npx expo start
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

## ライセンス

MIT
