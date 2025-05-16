# SDXL画像生成 Cloudflare Worker

このWorkerは、Cloudflare Workers AIを使用してStable Diffusion XL（SDXL）による画像生成を行います。

## デプロイ方法

### 前提条件

- Cloudflareアカウント
- Node.js (v16以上)
- Wrangler CLIツール

### セットアップ

1. Wrangler CLIをインストール

```bash
npm install -g wrangler
```

2. Cloudflareにログイン

```bash
wrangler login
```

3. アプリケーションディレクトリに移動

```bash
cd supabase/functions/sdxl-worker
```

4. デプロイ

```bash
wrangler deploy
```

5. デプロイ後に表示されるURLをメモ

デプロイが完了すると、以下のようなURLが表示されます：
```
https://sdxl-worker.<YOUR-ACCOUNT>.workers.dev
```

6. このURLを `app/services/api.ts` ファイル内の `CLOUDFLARE_WORKERS_API_URL` 変数に設定します。

### 使用方法

ワーカーは以下のようなJSONリクエストを受け付けます：

```json
{
  "prompt": "画像の説明",
  "negative_prompt": "避けたい要素",
  "width": 768,
  "height": 768,
  "num_steps": 25,
  "guidance": 7.5
}
```

レスポンスはPNG形式の画像データになります。

## 注意事項

- Cloudflare Workers AIはリクエスト数に制限があります。
- 商用利用の場合は、Cloudflareの料金プランを確認してください。
- 生成される画像の著作権や使用条件については、Cloudflareの利用規約を参照してください。 