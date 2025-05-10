# 画面設計書（LINE風 + ローカルモデル 導線版）

## カラーパレット & テーマ
(primary `#005E36`, primary-light `#00C26A`, accent-blue `#007AFF`, delete-red `#FF3B30`)

---

## 1. 画面一覧
| ID | 画面 | コンポーネント・要点 |
|----|------|--------------------|
| Splash | ロゴ＋Lottie | 2 s |
| Chats | トーク一覧 FlatList / 未読バッジ / ギア設定 | 長押し編集 + 左スワイプ削除 |
| Chats | トーク一覧 FlatList / 未読バッジ / ギア設定\n**サムネ編集・タイトル編集（インライン）** | サムネタップでアイコン選択モーダル、タイトル右にえんぴつアイコン |
| NewChat | Suggestion Chips + Input | `/imagine` ボタン |
| NewChat | Suggestion Chips + Input\n**モデル名タップでモデル選択モーダル** | `/imagine` ボタン |
| Notes | NoteList / Editor | MD/Text切替 |
| ChatRoom | Header: Model▼ + Avatar<br>MessageList + Input | Header tap → ModelSelect |
| ChatRoom | Header: タイトル部分タップでインライン編集（2行まで表示） | 編集モード時はTextInput＋確定/キャンセル |
| ModelSelect (Modal) | モデル RadioList + **Qwen3 StateBadge** | タップで選択／未DLなら InstallModal |
| InstallLocalModel (Modal) | Qwen3 DL 確認 → ProgressBar | 完了バナー |
| ImageGen (Modal) | Prompt / Size / Generate | |
| Settings | Profile / Theme / Plan / **Local Model 管理** | DL・削除 |
| Subscription | プランカード・購入 | |
| PayWall | 上限→課金誘導 | |
| AuthModal | Apple/Google/Email OTP | |
| DeleteConfirm (Modal) | 削除確認ダイアログ | 「このチャットを削除しますか？」 |

---

## 2. ModelSelect 詳細 UI
```
Qwen3:4B (ローカル)   [⚪️ 未DL]  ▸
```
- バッジ: ⚪️未DL / 🔄DL中 / 🟢使用可  
- 未DLタップ → InstallLocalModel

---

## 3. InstallLocalModel フロー
```
┌────────────────────────────┐
│ Qwen 3‑4B をインストール？  │
│ サイズ: 10GB / Wi‑Fi 推奨 │
│ [キャンセル] [ダウンロード] │
│ ▓▓▓░░ 45 %                 │
└────────────────────────────┘
```

---

## 4. ナビゲーション
```mermaid
flowchart TD
  Chats --tap--> ChatRoom
  ChatRoom --header--> ModelSelect
  ModelSelect --Qwen未DL--> InstallLocalModel
  Settings --Local Model--> InstallLocalModel
```

## チャット編集UI例
```
┌────────────────────────────┐
│ 🟢 [AI相談]   ✏️           │ ← タイトル右に編集アイコン
│ こんにちは！                │
│                            │
│ 🖼️ サムネタップで変更       │
└────────────────────────────┘
```
サムネタップ → アイコン選択モーダル（デフォルト20種＋画像選択）

+チャットルーム画面：
+```
+┌────────────────────────────┐
+│ ←  [タイトル（2行まで）] ✏️ │  ← タップで編集モード
+└────────────────────────────┘
+
+編集モード時：
+┌────────────────────────────┐
+│ ←  [TextInput(2行)] ✔️ ✖️   │
+└────────────────────────────┘
+```

## 新規チャット作成画面 UI例
```
────────────────────────────
現在のモデル: 4o-mini ▼   ← タップでモデル選択モーダル
────────────────────────────
```
