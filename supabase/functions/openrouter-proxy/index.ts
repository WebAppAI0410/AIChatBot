// Follow this setup guide to integrate the Deno runtime with your application:
// https://deno.land/manual/examples/supabase-functions

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// 環境変数からAPIキーを取得
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY');
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'

// デバッグログ追加
console.log('Edge Function starting with JWT Verification: Off')
console.log('OPENROUTER_API_KEY present:', OPENROUTER_API_KEY ? 'Yes' : 'No')

serve(async (req) => {
  try {
    // リクエストの詳細情報をログに出力
    console.log(`Request received: ${req.method}, URL: ${req.url}`);
    console.log('Authorization header present:', req.headers.has('Authorization') ? 'Yes' : 'No');
    
    // CORSヘッダー設定
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, Cache-Control, Pragma',
          'Access-Control-Max-Age': '86400', // 24時間キャッシュを許可
        },
      })
    }

    // POSTリクエストのみ許可
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    // APIキーが設定されていることを確認
    if (!OPENROUTER_API_KEY) {
      console.error('OPENROUTER_API_KEY is not set');
      return new Response(JSON.stringify({ error: 'Server configuration error: API key missing' }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      })
    }

    // リクエストボディを取得
    const body = await req.json()
    const { messages, model, stream, max_tokens, temperature } = body

    console.log(`Processing request for model: ${model}`);

    // OpenRouterにリクエスト
    try {
      console.log('Requesting OpenRouter API...');
      const openRouterResponse = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://aichatbot.app',
          'X-Title': 'AI ChatBot App',
        },
        body: JSON.stringify({
          messages,
          model,
          stream: stream || false,
          max_tokens: max_tokens || 1000,
          temperature: temperature || 0.7,
        }),
      });

      // ステータスコードとヘッダーの確認
      console.log('OpenRouter Response status:', openRouterResponse.status);
      console.log('OpenRouter Response headers:', JSON.stringify([...openRouterResponse.headers.entries()].reduce((obj, [key, val]) => ({ ...obj, [key]: val }), {})));
      
      if (!openRouterResponse.ok) {
        const errorText = await openRouterResponse.text();
        console.error(`OpenRouter API error (${openRouterResponse.status}):`, errorText);
        
        try {
          // JSONとしてパースできるか試みる
          const errorJson = JSON.parse(errorText);
          return new Response(JSON.stringify(errorJson), {
            status: openRouterResponse.status,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          });
        } catch (e) {
          // プレーンテキストのエラーとして返す
          return new Response(JSON.stringify({ error: errorText || 'Unknown error' }), {
            status: openRouterResponse.status,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          });
        }
      }
      
      // ストリーミングモードの場合はレスポンスをそのまま返す
      if (stream) {
        return new Response(openRouterResponse.body, {
          status: openRouterResponse.status,
          headers: {
            ...Object.fromEntries(openRouterResponse.headers.entries()),
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
      
      // 通常のレスポンスの場合はJSONとして処理
      const responseData = await openRouterResponse.json();
      
      return new Response(JSON.stringify(responseData), {
        status: openRouterResponse.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    } catch (fetchError) {
      console.error('OpenRouter API fetch error:', fetchError.message || fetchError);
      // より具体的なエラーメッセージ
      let errorMessage = 'OpenRouter APIとの通信に失敗しました';
      if (fetchError.message) {
        if (fetchError.message.includes('Network request failed')) {
          errorMessage = 'ネットワーク接続エラー: OpenRouter APIに接続できません';
        } else if (fetchError.message.includes('timeout')) {
          errorMessage = 'タイムアウト: OpenRouter APIからの応答が遅すぎます';
        } else {
          errorMessage = `OpenRouter APIエラー: ${fetchError.message}`;
        }
      }
      
      return new Response(JSON.stringify({ error: errorMessage }), {
        status: 502, // Bad Gateway
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }
  } catch (error) {
    console.error('Error in Edge Function:', error);
    // エラーの詳細情報を追加
    const errorDetails = {
      error: error.message || 'Unknown error',
      timestamp: new Date().toISOString(),
      requestInfo: {
        method: req.method,
        url: req.url,
        hasAuthHeader: req.headers.has('Authorization'),
      }
    };
    
    return new Response(JSON.stringify(errorDetails), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}) 