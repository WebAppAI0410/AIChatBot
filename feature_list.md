# 機能一覧

## 1. クライアント機能
| 区分 | 機能 | ライブラリ / メモ |
|------|------|------------------|
| ModelSelect | モデル RadioList + StatusBadge | Zustand + Tamagui |
| LocalModelInstall | DL / 進捗 / 検証 / 登録 | `expo-file-system`, `mlc_llm_mobile` |
| localModelStore | `status`, `progress`, `path` | Zustand Slice |
| Settings | ローカルモデル管理 (DL,削除,更新) | Storage 残量チェック |
| Settings > Usage | トークン/画像/AIアシスト使用量表示 | ProgressRing, Zustand |
| Chats | 未読バッジ Realtime | Supabase Subscriptions |
| Chats | スワイプ削除機能 | `react-native-gesture-handler` |
| Chats | タイトル編集（インライン） | FlatList, TextInput, Zustand |
| Chats | サムネ編集（デフォルト20種＋画像選択） | expo-image-picker, Zustand |
| Notes | MD WYSIWYG Editor | react-native-markdown-editor |
| Notes | AIアシスト機能 | プラン別クォータ、チャットドロワー |
| Notes | タグ管理 (Lite+) | タグ一覧、編集、フィルタリング |
| NewChat | モデル名タップでモデル選択モーダル | ModelSelectModal, Zustand |
| ChatRoom | タイトル編集（ヘッダー部インライン・2行まで表示） | Stackヘッダー、TextInput、Zustand |
| ChatRoom | 画像モードトグル | 左側アイコン、imageStore連携 |
| ChatRoom | メッセージアクション | 長押しでActionSheet、コピー/共有/保存 |
| Image | 画像ギャラリー | Masonry Layout, 無限スクロール |
| Image | 画像生成UI | プロンプト、サイズ、品質、モデル選択 |
| QuotaWarning | クォータ警告バナー | 残り20%で表示、アップグレードCTA |
| UI統一 | 統一パディング、集中スタイル | `ui/theme.ts`, Tailwind風ユーティリティ |

## 2. サーバー
- **APIキー管理**: ユーザーごとのAPIキー発行と自動ローテーション
- **使用量ロギング**: `usage_logs`テーブルへの記録
- **クォータバケツ**: 月次`llm_tokens_month`、日次`img:tier0`/`img:tier2`
- **プラン適用**: カスケードフォールバック、HTTP 429 + アップグレードCTA
- **ローカルモデルインストーラー**: Qwen-3-4B-GGUFダウンロードワーカー

## 3. Edge Functions
| Endpoint | 追加 / 変更 |
|----------|------------|
| `/chat/stream` | ローカルモデル時は呼ばない、Tier別フォールバック |
| `/chat/read` | 既読更新 |
| `/chat/delete` | チャット削除（履歴含む） |
| `/image/generate` | 画像生成（SDXL/DALL-E）、プラン別クォータ適用 |
| `/note/ai-assist` | ノートAIアシスト、プラン別クォータ適用 |
| `/api-keys/provision` | ユーザーごとのAPIキー発行 |
| `/api-keys/rotate` | APIキー自動ローテーション |
| `/usage/log` | 使用量ログ記録 |
| `/usage/get` | 使用量取得 |

## 4. 状態管理 Slices
| Slice | 追加 |
|-------|------|
| `localModelStore` | status, progress, startDownload, verifyChecksum |
| `chatStore` | deleteChat, confirmDelete, copyMessageToClipboard, shareMessage, saveMessageToNote, saveImageToGallery |
| `imageStore` | imageMode, currentModel, currentSize, currentQuality, generateImage, generatedImages |
| `noteStore` | notes, createNote, updateNote, deleteNote, aiAssist, aiAssistQuota |
| `userStore` | plan, tokenQuota, imageQuota, aiAssistQuota, updateQuota |
| `settingsStore` | theme, language, notifications, usageStats |

## 5. テスト項目
| ケース | 内容 |
|--------|------|
| LocalModel Install | DL 中断→再開、容量不足警告、チェックサム検証 |
| ModelSelect Badge | 状態遷移の色、エラー表示 |
| クォータ管理 | プラン別制限、フォールバック、警告表示 |
| 画像生成 | SDXL/DALL-E生成、プラン制限、エラー処理 |
| メッセージアクション | コピー、共有、ノート保存、画像保存 |
| ノートAIアシスト | プラン別クォータ、AIレスポンス |
| APIキー管理 | 発行、ローテーション、エラー処理 |
| UI一貫性 | パディング統一、スタイル集中化 |
| プラン購入 | 月額/半年/年間プラン、レシート検証 |
