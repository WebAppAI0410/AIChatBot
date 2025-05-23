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
- `app/(tabs)/notes.tsx`: ノート一覧（フォルダ階層、右下FAB、AIアシストドロワー）
- `app/notes/[id].tsx`: ノート編集（Apple純正ノート風UI/UX、タップ編集・自動保存、AIアシスト[質問/編集/部分モード切替]）
- `components/note/TenTapEditor.tsx`: **TenTap (@10play/tentap-editor)** のWYSIWYGエディタ（Markdownサポート、タップ編集・自動保存、テキスト選択アクションバブル、AI校正モード連携）
- `components/note/NoteAIAssist.tsx`: AIアシスト（質問/編集モード切替、チャットUI、**AI校正モード制御**）
- `components/note/PartialEditAIAssist.tsx`: 部分編集AIアシスト（選択テキスト編集特化）
- `components/note/TagSelector.tsx`: タグ管理・一括編集・タグ名変更
- `components/note/DiffViewer.tsx`: AI編集提案の差分表示
- `store/noteStore.ts`: ノート・フォルダ・タグ・AIアシストの状態管理（自動保存・一括編集対応）
- `services/api.ts`: AIアシストAPI呼び出し、ノート・タグ管理API
- `services/sqlite.ts`: expo-sqliteによるローカルDB管理
- `assets/editor/editor.html` & `assets/editor/*`: **TipTapエディタ用のWebView内HTML/CSS/JSリソース**

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