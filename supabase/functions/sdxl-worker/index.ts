// Cloudflare Worker for SDXL image generation
export interface Env {
  AI: any;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // CORSヘッダーを設定
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    // POSTリクエストのみ許可
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      // リクエストボディを解析
      const requestData = await request.json();
      const { 
        prompt, 
        negative_prompt = 'blurry, bad quality, distorted, deformed', 
        width = 768, 
        height = 768,
        num_steps = 25, 
        guidance = 7.5 
      } = requestData;

      // プロンプトの検証
      if (!prompt || typeof prompt !== 'string') {
        return new Response(
          JSON.stringify({ error: 'プロンプトは必須で文字列である必要があります' }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
          }
        );
      }

      console.log(`SDXL画像生成リクエスト: "${prompt.substring(0, 50)}..." (${width}x${height}, steps=${num_steps})`);

      // Cloudflare AI SDXLモデルを使用して画像を生成
      const result = await env.AI.run('@cf/stabilityai/stable-diffusion-xl-base-1.0', {
        prompt,
        negative_prompt,
        width,
        height,
        num_inference_steps: num_steps,
        guidance_scale: guidance,
      });

      // 画像をPNG形式として返す
      return new Response(result, {
        headers: {
          'Content-Type': 'image/png',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (error) {
      console.error('SDXL生成エラー:', error);
      
      return new Response(
        JSON.stringify({ error: `画像生成に失敗しました: ${error.message}` }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      );
    }
  },
}; 