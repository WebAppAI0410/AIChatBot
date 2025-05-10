# 機能一覧

## 1. クライアント機能
| 区分 | 機能 | ライブラリ / メモ |
|------|------|------------------|
| ModelSelect | モデル RadioList + StatusBadge | Zustand + Tamagui |
| LocalModelInstall | DL / 進捗 / 検証 / 登録 | `expo-file-system`, `mlc_llm_mobile` |
| localModelStore | `status`, `progress`, `path` | Zustand Slice |
| Settings | ローカルモデル管理 (DL,削除,更新) | Storage 残量チェック |
| Chats | 未読バッジ Realtime | Supabase Subscriptions |
| Chats | スワイプ削除機能 | `react-native-gesture-handler` |
| Chats | タイトル編集（インライン） | FlatList, TextInput, Zustand |
| Chats | サムネ編集（デフォルト20種＋画像選択） | expo-image-picker, Zustand |
| Notes | MD/Text Editor | Remark plugins |
| NewChat | モデル名タップでモデル選択モーダル | ModelSelectModal, Zustand |
| ChatRoom | タイトル編集（ヘッダー部インライン・2行まで表示） | Stackヘッダー、TextInput、Zustand |

## 2. サーバー
- 追加なし（Qwen3 DL は CDN 直）

## 3. Edge Functions
| Endpoint | 追加 / 変更 |
|----------|------------|
| `/chat/stream` | ローカルモデル時は呼ばない |
| `/chat/read` | 既読更新 |
| `/chat/delete` | チャット削除（履歴含む） |

## 4. 状態管理 Slices
| Slice | 追加 |
|-------|------|
| `localModelStore` | status, progress, startDownload |
| `chatStore` | deleteChat, confirmDelete |

## 5. テスト項目
| ケース | 内容 |
|--------|------|
| LocalModel Install | DL 中断→再開、容量不足警告 |
| ModelSelect Badge | 状態遷移の色 |
