// Follow this setup guide to integrate the Deno runtime with your application:
// https://deno.land/manual/examples/supabase-functions

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// 環境変数からAPIキーを取得（Supabase管理画面でセット）
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'

// デバッグログ追加
console.log('Edge Function starting...')
console.log('OPENROUTER_API_KEY present:', OPENROUTER_API_KEY ? 'Yes' : 'No')
console.log('OPENROUTER_API_KEY length:', OPENROUTER_API_KEY?.length || 0)

serve(async (req) => {
  try {
    // リクエストヘッダーの確認（デバッグ用）
    const authHeader = req.headers.get('Authorization')
    console.log('Auth header:', authHeader ? 'present' : 'missing')
    
    // CORSヘッダー設定
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
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
    })

    // レスポンスステータスの確認
    console.log('OpenRouter Response status:', openRouterResponse.status);
    
    // レスポンスを転送
    const responseData = await openRouterResponse.json()
    
    return new Response(JSON.stringify(responseData), {
      status: openRouterResponse.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Error in Edge Function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
}) 