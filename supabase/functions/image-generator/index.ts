// Supabase Edge Function for unified image generation and storage
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Cloudflare Workers API URL - これを実際のSDXL Worker URLに置き換える
const CLOUDFLARE_WORKERS_API_URL = 'https://sdxl-worker.webapptest0410.workers.dev';
// OpenAI API URL
const OPENAI_API_URL = 'https://api.openai.com/v1';

// APIキー（環境変数から取得）
const CLOUDFLARE_API_KEY = Deno.env.get('CLOUDFLARE_API_KEY') || '';
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';

// Supabaseクライアント
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

Deno.serve(async (req) => {
  // CORSヘッダー
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    });
  }

  // POSTリクエストのみ許可
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }

  try {
    // リクエストボディを解析
    const { prompt, size = '768x768', quality = 'standard', model = 'sdxl' } = await req.json();

    // 必須パラメータの検証
    if (!prompt || typeof prompt !== 'string') {
      return new Response(JSON.stringify({ error: 'Valid prompt is required' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    console.log(`画像生成リクエスト - モデル: ${model}, サイズ: ${size}, 品質: ${quality}`);

    let imageUrl;

    if (model === 'dalle') {
      // DALL-E 3経由で画像を生成
      try {
        console.log('DALL-E 3で画像生成を実行');
        
        const response = await fetch(`${OPENAI_API_URL}/images/generations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'dall-e-3',
            prompt,
            n: 1,
            size,
            quality,
            response_format: 'url',
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('DALL-E API Error:', error);
          throw new Error(error.error?.message || 'DALL-E画像生成に失敗しました');
        }

        const data = await response.json();
        console.log('DALL-E画像生成成功');
        
        // DALL-Eの場合は直接URLを返す
        imageUrl = data.data[0].url;
      } catch (error) {
        console.error('DALL-E API Error:', error);
        return new Response(JSON.stringify({ error: `DALL-E画像生成に失敗しました: ${error.message}` }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    } else {
      // SDXL経由で画像を生成
      try {
        console.log('SDXLで画像生成を実行');
        
        const [width, height] = size.split('x').map(Number);

        const sdxlResponse = await fetch(`${CLOUDFLARE_WORKERS_API_URL}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CLOUDFLARE_API_KEY}`,
          },
          body: JSON.stringify({
            prompt,
            negative_prompt: 'blurry, bad quality, distorted, deformed',
            width,
            height,
            num_steps: quality === 'hd' ? 40 : 25,
            guidance: 7.5,
          }),
        });

        if (!sdxlResponse.ok) {
          const errorText = await sdxlResponse.text();
          console.error('SDXL API Error:', errorText);
          throw new Error('SDXL画像生成に失敗しました: ' + errorText);
        }

        console.log('SDXL画像生成成功、Supabaseストレージに保存中');
        
        // バイナリデータを取得
        const imageArrayBuffer = await sdxlResponse.arrayBuffer();
        
        // ファイル名を生成
        const fileName = `images/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.png`;
        
        // Supabaseストレージに画像を保存
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
          .from('user-content')
          .upload(fileName, imageArrayBuffer, {
            contentType: 'image/png',
            cacheControl: '3600',
          });

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw new Error(`ストレージアップロードに失敗しました: ${uploadError.message}`);
        }

        // 公開URLを取得
        const { data: urlData } = supabaseAdmin.storage
          .from('user-content')
          .getPublicUrl(fileName);

        imageUrl = urlData.publicUrl;
        console.log('画像保存成功:', imageUrl);
      } catch (error) {
        console.error('SDXL or Storage Error:', error);
        return new Response(JSON.stringify({ error: `画像生成または保存に失敗しました: ${error.message}` }), {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      }
    }

    // 生成された画像URLを返す
    return new Response(JSON.stringify({ url: imageUrl }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    console.error('Server error:', error);
    return new Response(JSON.stringify({ error: `サーバーエラー: ${error.message}` }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}); 