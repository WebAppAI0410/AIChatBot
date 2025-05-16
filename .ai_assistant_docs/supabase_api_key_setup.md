# Supabase Edge FunctionでのAPIキー設定手順

このドキュメントでは、Supabase Edge Functionで必要なAPIキーを設定する方法について説明します。

## 必要なAPIキー

以下のAPIキーをSupabase Edge Functionで設定する必要があります：

1. **OpenRouter API Key** - AIテキストモデルへのアクセス用
2. **OpenAI API Key** - DALL-E 3画像生成用
3. **Cloudflare API Key** - SDXL画像生成用

## 設定方法

### 方法1: Supabase CLIを使用する方法（推奨）

```bash
# ⚠️ 警告: 以下のように直接APIキーをコマンドラインに入力すると、シェル履歴やCIログに残り漏洩リスクがあります
# supabase secrets set OPENROUTER_API_KEY=sk-or-v1-your-key-here --project-ref alperyqhdtpnivxfnqdi

# 安全な方法1: 環境変数から読み込む（シェル履歴にはキー値が残りません）
supabase secrets set OPENROUTER_API_KEY="$OPENROUTER_API_KEY" --project-ref alperyqhdtpnivxfnqdi
supabase secrets set OPENAI_API_KEY="$OPENAI_API_KEY" --project-ref alperyqhdtpnivxfnqdi
supabase secrets set CLOUDFLARE_API_KEY="$CLOUDFLARE_API_KEY" --project-ref alperyqhdtpnivxfnqdi

# 安全な方法2: 標準入力から読み込む（コマンドラインにキー値が一切現れません）
printf %s "$OPENROUTER_API_KEY" | supabase secrets set OPENROUTER_API_KEY - --project-ref alperyqhdtpnivxfnqdi
printf %s "$OPENAI_API_KEY" | supabase secrets set OPENAI_API_KEY - --project-ref alperyqhdtpnivxfnqdi
printf %s "$CLOUDFLARE_API_KEY" | supabase secrets set CLOUDFLARE_API_KEY - --project-ref alperyqhdtpnivxfnqdi
```

### 方法2: Supabaseダッシュボードを使用する方法

1. [Supabase ダッシュボード](https://app.supabase.com)にログイン
2. プロジェクト「AI ChatBot App」を選択
3. 左メニューから「Functions」を選択
4. 設定したい関数（`openrouter-proxy`または`image-generator`）をクリック
5. 「Settings」タブをクリック
6. 「Environment variables」セクションで以下を設定：
   - `OPENROUTER_API_KEY`: OpenRouter APIキー
   - `OPENAI_API_KEY`: OpenAI APIキー
   - `CLOUDFLARE_API_KEY`: Cloudflare APIキー
7. 「Save」ボタンをクリック

## APIキーの取得方法

各サービスのAPIキーは以下の方法で取得できます：

### OpenRouter APIキー

1. [OpenRouter](https://openrouter.ai/)にアカウント登録/ログイン
2. ダッシュボードから「API Keys」セクションに移動
3. 「Create API Key」ボタンをクリック
4. キーに名前を付け、「Create」をクリック
5. 表示されたAPIキーをコピー（`sk-or-v1-...`で始まる文字列）

### OpenAI APIキー

1. [OpenAI Platform](https://platform.openai.com/)にアカウント登録/ログイン
2. 右上のプロファイルアイコンをクリック
3. 「View API Keys」を選択
4. 「Create new secret key」ボタンをクリック
5. キーに名前を付け（任意）、「Create secret key」をクリック
6. 表示されたAPIキーをコピー（`sk-...`で始まる文字列）

### Cloudflare APIキー

1. [Cloudflare Dashboard](https://dash.cloudflare.com/)にログイン
2. 右上のプロファイルアイコンをクリック
3. 「My Profile」を選択
4. 「API Tokens」タブをクリック
5. 「Create Token」ボタンをクリック
6. テンプレートを選択または必要な権限を設定
7. トークンを作成し、表示されたAPIキーをコピー

## APIキーのテスト

設定が正しいか確認するには、関数をデプロイ後に簡単なテストリクエストを送信し、ログを確認できます：

1. Edge Functionのログを確認する方法：
   - Supabaseダッシュボードの「Functions」セクションで対象の関数をクリック
   - 「Logs」タブを選択
   - ログ出力に「API Key present: Yes」のような表示があるか確認

2. クライアントアプリからテストリクエストを送信し、正常に応答があるか確認

### デバッグ方法

環境変数が正しく設定されたかどうかを確認するため、Edge Functionのコードに以下のデバッグ用コードが含まれています：

```typescript
// デバッグログ追加
console.log('Edge Function starting...');
console.log('OPENAI_API_KEY present:', OPENAI_API_KEY ? 'Yes' : 'No');
console.log('OPENAI_API_KEY length:', OPENAI_API_KEY?.length || 0);
console.log('CLOUDFLARE_API_KEY present:', CLOUDFLARE_API_KEY ? 'Yes' : 'No');
console.log('CLOUDFLARE_API_KEY length:', CLOUDFLARE_API_KEY?.length || 0);
```

これらのログメッセージは、Edge Functionが起動したときに環境変数が正しく読み込まれているかを確認します。「present: Yes」と表示され、長さが適切であればAPIキーが正しく設定されています。

また、以下の方法でAPIキーが設定されているかをコマンドラインから確認できます（Supabase CLIがインストールされている場合）：

```bash
# 設定されている環境変数の一覧を表示
supabase secrets list --project-ref alperyqhdtpnivxfnqdi
```

### モニタリング

Edge Functionの呼び出しとエラーを監視するには：

1. Supabaseダッシュボードの「Functions」セクションで対象の関数をクリック
2. 「Monitoring」タブを選択
3. リクエスト数、エラー率、レスポンスタイムなどのメトリクスを確認

## Edge Functionの再デプロイ

APIキーの設定後、変更を適用するためにEdge Functionを再デプロイすることを推奨します：

```bash
# Supabase CLI を使用して再デプロイ
cd supabase/functions
supabase functions deploy openrouter-proxy --no-verify-jwt
supabase functions deploy image-generator --no-verify-jwt
```

またはSupabaseダッシュボードの「Functions」セクションから再デプロイボタンをクリックします。

## 重要な注意事項

- APIキーは機密情報です。Gitリポジトリにコミットしないでください
- シェル履歴やCIログにAPIキーが残らないよう、上記の安全な方法で設定してください
- スクリプト内でAPIキーを扱う場合は、必ず環境変数経由で渡し、スクリプト内にハードコーディングしないでください
- 各APIキーには利用制限があります。使用状況を定期的に確認してください
- 不審なアクティビティに気付いた場合は、すぐにAPIキーを再生成してください
- Edge Functionの最大実行時間は10秒です。長時間実行されるリクエストの場合はタイムアウト処理を実装してください 