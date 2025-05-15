# データフロー概要

## ユーザー認証フロー
1. アプリ起動 → Supabase Auth状態確認
2. ログイン処理 → Supabase Auth → userStore更新
3. userStore → UI更新（プラン情報、ユーザー設定など）

## チャット機能フロー
1. ユーザー入力 → ChatInput → chatStore.sendMessage
2. chatStore → API呼び出し → OpenRouter/他プロバイダー
3. ストリーミングレスポンス → chatStore.updateCurrentMessage → UI更新
4. 完了時 → chatStore.finishCurrentMessage → メッセージ永続化

## 画像生成フロー
1. 画像生成リクエスト → ImageGenerationPanel → imageStore.generateImage
2. クォータチェック → imageStore内で残量確認
3. 生成処理 → 現在はモック実装、将来的にはAPI呼び出し
4. 画像URL取得 → chatStore.addImageMessage → チャットに画像表示
5. クォータ更新 → imageStore.incrementImageUsage → UI更新

## ローカルモデル管理フロー
1. モデルダウンロードリクエスト → localModelStore.downloadModel
2. ストレージチェック → ダウンロード進捗更新
3. ファイル検証 → モデルロード
4. チャットでのモデル使用 → localModelStore → localInference → UI更新

## 状態管理の依存関係
- userStore（プラン情報）→ 他のストア（機能制限、クォータ）
- settingsStore → 各機能の動作設定
- chatStore ⇄ localModelStore（モデル切り替え時）
- imageStore → chatStore（画像メッセージ追加時）

## データ永続化
1. チャット履歴 → Supabase
2. ユーザー設定 → SecureStore + Supabase
3. ローカルモデル → FileSystem
4. 生成画像 → 現在はURL参照のみ、将来的にはSupabase Storage 