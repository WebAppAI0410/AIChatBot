# 機能とファイルの対応

## チャット機能
- `app/chat/[id].tsx`: チャット画面
- `components/ChatInput.tsx`: 入力コンポーネント
- `components/MessageBubble.tsx`: メッセージ表示
- `store/chatStore.ts`: チャット状態管理
- `services/api.ts`: API呼び出し

## 画像生成
- `app/store/imageStore.ts`: 画像生成状態管理
- `app/components/ImageGenerationPanel.tsx`: 画像生成UI
- `app/components/ImageBubble.tsx`: 画像表示コンポーネント
- `app/chat/[id].tsx`: チャット画面への統合
- `services/api.ts`: 画像生成API連携（モック実装済み）

## ユーザー管理・認証
- `app/login.tsx`: ログイン画面
- `app/signup.tsx`: 登録画面
- `store/userStore.ts`: ユーザー状態管理
- `services/supabase.ts`: Supabase認証連携

## プラン・クォータ管理
- `store/userStore.ts`: プラン情報管理
- `components/QuotaWarningBanner.tsx`: クォータ警告UI
- `services/api.ts`: 使用量トラッキング

## ローカルモデル管理
- `store/localModelStore.ts`: ローカルモデル状態管理
- `components/LocalModelStatusBadge.tsx`: モデル状態表示
- `services/localInference.ts`: ローカルモデル推論
- `services/api.ts`: モデルダウンロード

## メッセージアクション
- `components/MessageActions.tsx`: メッセージアクションUI
- `store/chatStore.ts`: メッセージ操作関数
- `services/sharing.ts`: 共有機能

## ノート機能
- `app/notes/[id].tsx`: ノート編集画面
- `app/notes/index.tsx`: ノート一覧
- `components/NoteEditor.tsx`: ノートエディタ
- `store/noteStore.ts`: ノート状態管理
- `services/api.ts`: AI アシスト機能

## 設定
- `app/settings/index.tsx`: 設定画面
- `app/settings/subscription.tsx`: サブスクリプション管理
- `store/settingsStore.ts`: 設定状態管理

## 共通コンポーネント
- `components/Header.tsx`: ヘッダーコンポーネント
- `components/Button.tsx`: ボタンコンポーネント
- `ui/theme.ts`: テーマ定義

## ナビゲーション
- `app/(tabs)/_layout.tsx`: タブレイアウト
- `app/_layout.tsx`: アプリレイアウト

## APIキー管理
- `supabase/functions/api-key-management/index.ts`: キー管理バックエンド
- `supabase/functions/shared-key-manager/index.ts`: 共有キー管理
- `services/api.ts`: クライアント側キー取得 