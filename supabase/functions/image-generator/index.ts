// Supabase Edge Function for unified image generation and storage
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Cloudflare Workers API URL - これを実際のSDXL Worker URLに置き換える
const CLOUDFLARE_WORKERS_API_URL = 'https://sdxl-worker.webapptest0410.workers.dev';
// OpenAI API URL
const OPENAI_API_URL = 'https://api.openai.com/v1';

// APIキー（環境変数またはSecrets経由で設定）
const CLOUDFLARE_API_KEY = Deno.env.get('CLOUDFLARE_API_KEY') || '';
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || '';

// ストレージ設定
const STORAGE_BUCKET = 'user-content';
const IMAGE_EXPIRY_DAYS = 7; // 画像の有効期限（日数）

// Supabaseクライアント
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL') || '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
);

// デバッグログ追加
console.log('Edge Function starting...');
console.log('OPENAI_API_KEY present:', OPENAI_API_KEY ? 'Yes' : 'No');
console.log('CLOUDFLARE_API_KEY present:', CLOUDFLARE_API_KEY ? 'Yes' : 'No');

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
    const { 
      prompt, 
      size = '768x768', 
      quality = 'standard', 
      model = 'sdxl',
      returnType = 'url' // 'url'または'base64'
    } = await req.json();

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

    console.log(`画像生成リクエスト - モデル: ${model}, サイズ: ${size}, 品質: ${quality}, 返却形式: ${returnType}`);

    let imageResult;
    let forceBase64 = returnType === 'base64';

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
            response_format: forceBase64 ? 'b64_json' : 'url',
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          console.error('DALL-E API Error:', error);
          throw new Error(error.error?.message || 'DALL-E画像生成に失敗しました');
        }

        const data = await response.json();
        console.log('DALL-E画像生成成功');
        
        if (forceBase64) {
          // Base64形式で返す
          imageResult = {
            dataUrl: `data:image/png;base64,${data.data[0].b64_json}`,
            contentType: 'image/png'
          };
        } else {
          // URLで返す
          imageResult = {
            url: data.data[0].url,
            contentType: 'image/png'
          };
        }
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

        console.log('SDXL画像生成成功');
        
        // バイナリデータを取得
        const imageArrayBuffer = await sdxlResponse.arrayBuffer();
        const contentType = sdxlResponse.headers.get('content-type') || 'image/png';
        
        // 常にBase64データを準備（ストレージ保存に失敗した場合のフォールバック用）
        const base64 = btoa(
          new Uint8Array(imageArrayBuffer).reduce(
            (data, byte) => data + String.fromCharCode(byte),
            ''
          )
        );
        
        if (forceBase64) {
          // Base64形式で返す
          imageResult = {
            dataUrl: `data:${contentType};base64,${base64}`,
            contentType
          };
          
          console.log('画像をBase64データURLとして返します');
        } else {
          try {
            // 有効期限を計算
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + IMAGE_EXPIRY_DAYS);
            const expiryTimestamp = expiry.getTime();
            
            // 有効期限を含むファイル名を生成
            const fileName = `images/${Date.now()}_exp${expiryTimestamp}_${Math.random().toString(36).substring(2, 9)}.png`;
            
            console.log(`Supabaseストレージに画像を保存中: ${fileName}`);
            
            // Supabaseストレージに画像を保存
            const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
              .from(STORAGE_BUCKET)
              .upload(fileName, imageArrayBuffer, {
                contentType,
                cacheControl: '3600',
                upsert: true,
                metadata: {
                  expiry: String(expiryTimestamp)
                }
              });

            if (uploadError) {
              console.error('Storage upload error:', uploadError);
              // ストレージ保存に失敗した場合、Base64データにフォールバック
              console.log('ストレージ保存に失敗したため、Base64データにフォールバック');
              imageResult = {
                dataUrl: `data:${contentType};base64,${base64}`,
                contentType,
                fallback: true,
                error: uploadError.message
              };
            } else {
              // 公開URLを取得
              const { data: urlData } = supabaseAdmin.storage
                .from(STORAGE_BUCKET)
                .getPublicUrl(fileName);

              imageResult = {
                url: urlData.publicUrl,
                contentType,
                expiry: expiryTimestamp,
                expiryDate: expiry.toISOString()
              };
              console.log('画像をURLとして返します');
            }
          } catch (storageError) {
            console.error('Storage operation error:', storageError);
            // ストレージ操作に失敗した場合、Base64データにフォールバック
            imageResult = {
              dataUrl: `data:${contentType};base64,${base64}`,
              contentType,
              fallback: true,
              error: storageError.message
            };
          }
        }
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

    // 生成された画像の結果を返す
    return new Response(JSON.stringify(imageResult), {
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