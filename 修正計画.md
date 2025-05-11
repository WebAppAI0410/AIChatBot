# AI チャットボットアプリ 修正計画

**実装方針**: 各機能を実装するごとに順次コミットを行い、すべての実装が完了した後に最終的なプルリクエストを作成します。

## 概要

本計画は、AI チャットボットアプリの機能強化と UI/UX 改善を目的とした包括的な修正内容をまとめたものです。主な変更点は以下の通りです。

1. **価格設定とクォータ制限の更新**
2. **APIキー管理のバックエンドサービス実装**
3. **UI一貫性のためのリファクタリング**
4. **ローカルモデル管理機能**
5. **画像生成機能の強化**
6. **チャットのコピー/共有機能**
7. **AIアシスト付きノート機能**

## 1. 価格設定とクォータ制限

### 1.1 プラン構成

| プラン | 月額 | 半年/年間 | チャット／月 | 画像／日 | モデル | 備考 |
|--------|------|-----------|-------------|----------|--------|------|
| **Free** | ¥0 | - | **10k tokens** ≈ 20 msg | SDXL-25step ×5 | GPT-4o, 4o-mini, 4.1-mini & nano, DeepSeek V3, R1, **R1 Zero**, Gemini 2.5 Flash/Pro Exp, **Qwen3:4B (ローカル)** | GPT-4o & 4.1シリーズは合計で1 msg/日の制限あり |
| **Lite** | **¥980** | ¥5,600/6ヶ月<br>¥9,800/12ヶ月 | **300k tokens** ≈ 600 msg | SDXL-25step ×10 | Free プランのモデル **+** o3, o4-mini, o4-mini-high, Gemini 2.5 Pro Preview | クォータ超過時は下位モデルへフォールバック |
| **Premium** | **¥3,980** | ¥23,800/6ヶ月<br>¥39,800/12ヶ月 | **1.5M tokens** ≈ 3,000 msg | **DALL·E 3 ×5** + SDXL-25step ×50 | Lite プランのモデル **+** GPT-4.5 Preview, Claude 3.7 Sonnet & Sonnet-thinking | クォータ超過時は段階的にフォールバック |

#### 実装ファイル
- `constants/plans.ts` - プラン定義（価格、期間、機能制限）
  ```typescript
  export const PLANS = {
    FREE: {
      id: 'free',
      name: 'Free',
      price: 0,
      tokens: 10000,
      sdxlImages: 5,
      dalleImages: 0,
      modelTiers: [0, 2], // Tier 2は1回/日制限あり
      aiAssists: 3,
    },
    LITE: {
      id: 'lite',
      name: 'Lite',
      price: 980,
      tokens: 300000,
      sdxlImages: 15,
      dalleImages: 1,
      modelTiers: [0, 1, 2],
      aiAssists: 20,
      periods: {
        MONTHLY: { id: 'lite.monthly', price: 980 },
        HALFYEAR: { id: 'lite.halfyear', price: 5600 },
        YEARLY: { id: 'lite.yearly', price: 9800 },
      },
    },
    PREMIUM: {
      id: 'premium',
      name: 'Premium',
      price: 3980,
      tokens: 1500000,
      sdxlImages: 50,
      dalleImages: 5,
      modelTiers: [0, 1, 2],
      aiAssists: 100,
      periods: {
        MONTHLY: { id: 'premium.monthly', price: 3980 },
        HALFYEAR: { id: 'premium.halfyear', price: 23800 },
        YEARLY: { id: 'premium.yearly', price: 39800 },
      },
    },
  };
  ```

### 1.2 Tierシステム（バックエンド）

#### LLM Tier

| **Tier** | 代表モデル | 単価（概算） | 主要レート制限 | 備考 |
|----------|------------|------------|--------------|------|
| **0** (Free) | Gemini 2.5 Pro Exp, Gemini 2.0 Flash Exp, DeepSeek R1 Zero | $0.000 | 25 req/日・5 rpm | 超過 → HTTP 429 |
| **1** (Low-cost) | GPT-4o-mini, GPT-4.1-mini/nano, DeepSeek V3, DeepSeek R1, Gemini 2.5 Flash Preview | $0.0005 – 0.002 | 60 rpm | Lite / fallback用 |
| **2** (Premium) | GPT-4o, GPT-4.1, Gemini 2.5 Pro Preview | $0.010 – 0.0125 | 60 rpm | Premium枠・Freeは 1 msg/日 |

#### 画像生成 Tier

| Tier | 対象 | 制限 | コスト |
|------|------|------|--------|
| **0** | Workers AI SDXL-25step / img2img | 10,000 neurons / day | ¥0 |
| **2** | OpenAI DALL·E 3 | 60 req / min | ¥0.04 / image |

#### 実装ファイル
- `constants/models.ts` - モデル定義とTier分類
  ```typescript
  export const MODEL_TIERS = {
    0: 'FREE',
    1: 'LOW_COST',
    2: 'PREMIUM',
  };

  export const MODELS = {
    // Tier 0 (Free)
    'gemini-2.5-pro-exp': { tier: 0, name: 'Gemini 2.5 Pro Exp', provider: 'google' },
    'deepseek-r1-zero': { tier: 0, name: 'DeepSeek R1 Zero', provider: 'deepseek' },
    // Tier 1 (Low-cost)
    'gpt-4o-mini': { tier: 1, name: 'GPT-4o mini', provider: 'openai' },
    'gpt-4.1-mini': { tier: 1, name: 'GPT-4.1 mini', provider: 'openai' },
    // Tier 2 (Premium)
    'gpt-4o': { tier: 2, name: 'GPT-4o', provider: 'openai' },
    'claude-3.7-sonnet': { tier: 2, name: 'Claude 3.7 Sonnet', provider: 'anthropic' },
    // ローカルモデル
    'qwen3-4b-local': { tier: 0, name: 'Qwen3:4B (ローカル)', provider: 'local' },
  };

  export const IMAGE_MODELS = {
    'sdxl': { tier: 0, name: 'SDXL', provider: 'cloudflare' },
    'dalle3': { tier: 2, name: 'DALL-E 3', provider: 'openai' },
  };
  ```

### 1.3 クォータ管理

#### 実装詳細

- **月次トークンバケツ**: プランごとの月間トークン使用量制限
  - `store/userStore.ts` に実装
  ```typescript
  type TokenQuota = {
    used: number;
    limit: number;
    resetDate: string; // ISO形式の日付文字列
  };

  type UserState = {
    // 他のユーザー状態...
    plan: 'free' | 'lite' | 'premium';
    subscription: {
      id: string;
      startDate: string;
      endDate: string;
      autoRenew: boolean;
    } | null;
    quota: {
      tokens: TokenQuota;
      images: {
        sdxl: { used: number; limit: number; resetDate: string; };
        dalle: { used: number; limit: number; resetDate: string; };
      };
      aiAssists: { used: number; limit: number; resetDate: string; };
    };
    // クォータ関連アクション
    incrementTokenUsage: (amount: number) => void;
    incrementImageUsage: (type: 'sdxl' | 'dalle') => void;
    incrementAiAssistUsage: () => void;
    checkQuotaStatus: (type: 'tokens' | 'sdxl' | 'dalle' | 'aiAssists') => 'ok' | 'warning' | 'exceeded';
    resetDailyQuotas: () => void; // 日次クォータのリセット
  };
  ```

- **日次画像バケツ**: `img:tier0:{uid}` & `img:tier2:{uid}`（毎日0時にリセット）
  - アプリ起動時に日付チェックを行い、必要に応じてリセット
  ```typescript
  // store/userStore.ts
  const resetDailyQuotas = () => {
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD形式
    
    // 画像クォータのリセット日をチェック
    const sdxlResetDate = new Date(state.quota.images.sdxl.resetDate);
    if (sdxlResetDate.toISOString().split('T')[0] !== today) {
      set((state) => ({
        quota: {
          ...state.quota,
          images: {
            ...state.quota.images,
            sdxl: {
              used: 0,
              limit: PLANS[state.plan.toUpperCase()].sdxlImages,
              resetDate: today,
            },
            dalle: {
              used: 0,
              limit: PLANS[state.plan.toUpperCase()].dalleImages,
              resetDate: today,
            },
          },
          aiAssists: {
            used: 0,
            limit: PLANS[state.plan.toUpperCase()].aiAssists,
            resetDate: today,
          },
        },
      }));
    }
  };
  ```

- **クォータ警告**: 残り20%で警告バナー表示
  - `components/QuotaWarningBanner.tsx` に実装
  ```typescript
  // components/QuotaWarningBanner.tsx
  export const QuotaWarningBanner = () => {
    const quotaStatus = useStore((state) => state.checkQuotaStatus('tokens'));
    const plan = useStore((state) => state.plan);
    
    if (quotaStatus !== 'warning') return null;
    
    return (
      <View style={styles.warningBanner}>
        <Text style={styles.warningText}>⚠️ トークン残りわずか (20%)</Text>
        <View style={styles.buttonContainer}>
          <Button title="詳細" onPress={() => router.push('/settings/usage')} />
          <Button title="閉じる" onPress={() => {/* バナーを一時的に非表示 */}} />
        </View>
      </View>
    );
  };
  ```

- **フォールバックロジック**: クォータ超過時に下位Tierモデルへ自動切替
  - `services/api.ts` に実装
  ```typescript
  // services/api.ts
  export const getChatCompletion = async (messages: Message[], modelId: string) => {
    const userState = useStore.getState();
    const selectedModel = MODELS[modelId];
    
    // クォータチェック
    const quotaStatus = userState.checkQuotaStatus('tokens');
    
    // モデル選択ロジック
    let effectiveModel = modelId;
    
    if (quotaStatus === 'exceeded') {
      // クォータ超過時のフォールバックロジック
      const userPlan = userState.plan;
      const availableTiers = PLANS[userPlan.toUpperCase()].modelTiers;
      
      // 現在のモデルTierより低いTierを探す
      const lowerTiers = availableTiers.filter(tier => tier < selectedModel.tier);
      
      if (lowerTiers.length > 0) {
        // 最も高いTierのモデルを選択
        const fallbackTier = Math.max(...lowerTiers);
        // 該当Tierのモデルから一つ選択
        const fallbackModels = Object.entries(MODELS)
          .filter(([_, model]) => model.tier === fallbackTier)
          .map(([id, _]) => id);
          
        if (fallbackModels.length > 0) {
          effectiveModel = fallbackModels[0]; // 最初のモデルを使用
          // フォールバック通知
          showToast(`クォータ超過のため ${MODELS[effectiveModel].name} にフォールバックしました`);
        }
      } else {
        // フォールバック不可の場合
        throw new Error('月間クォータを超過しました。プランをアップグレードするか、翌月まで待ってください。');
      }
    }
    
    // APIリクエスト実行
    // ...
  };
  ```

#### サブスクリプション管理
- `services/subscription.ts` - サブスクリプション検証ロジック
  ```typescript
  // services/subscription.ts
  import * as StoreKit from 'expo-store-kit';
  import * as SecureStore from 'expo-secure-store';
  import { supabase } from './supabase';
  import { PLANS } from '../constants/plans';
  import useStore from '../store';

  // レシート検証
  export const verifyReceipt = async (receipt: string, platform: 'ios' | 'android') => {
    try {
      // Supabase Edge Functionでレシート検証
      const { data, error } = await supabase.functions.invoke('verify-receipt', {
        body: { receipt, platform },
      });
      
      if (error) throw error;
      
      if (data.valid) {
        // 有効なレシート
        const { productId, purchaseDate, expiryDate } = data;
        
        // プラン情報の更新
        let planId = 'free';
        
        // productIdからプランを特定
        Object.entries(PLANS).forEach(([key, plan]) => {
          if (plan.periods) {
            Object.values(plan.periods).forEach(period => {
              if (period.id === productId) {
                planId = plan.id;
              }
            });
          }
        });
        
        // ストアの更新
        useStore.getState().updateSubscription({
          id: productId,
          startDate: purchaseDate,
          endDate: expiryDate,
          autoRenew: true,
        });
        
        useStore.getState().setPlan(planId);
        
        // クォータの更新
        useStore.getState().updateQuotaLimits();
        
        return { success: true, plan: planId };
      }
      
      return { success: false, message: 'Invalid receipt' };
    } catch (error) {
      console.error('Receipt verification failed:', error);
      return { success: false, message: error.message };
    }
  };
  ```

## 2. APIキー管理バックエンド

### 2.1 Per-User APIキープロビジョニング

| Provider | プロビジョニング方法 | レート/コスト制限 | ローテーションAPI | 備考 |
|----------|----------------------|------------------|------------------|------|
| **OpenRouter** | `POST /api/v1/auth/keys` | `limit` (USD) or `req_per_min` | `DELETE /api/v1/auth/keys/{id}` | 組織クレジット継承 |
| **Cloudflare Workers AI** | 少数の共有キー管理 | ロードバランシング | 90日ごとの手動更新 | 複数キー間でのリクエスト分散 |
| **OpenAI** (画像) | 組織単位の少数キー | 使用量追跡 | 60-90日ごとの手動更新 | ユーザーIDとリクエスト紐付け |

### 2.2 実装アーキテクチャ

#### 2.2.1 OpenRouter Provisioning API実装

```typescript
// supabase/functions/api-key-management/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1'
const MASTER_KEYS = Deno.env.get('OPENROUTER_MASTER_KEYS')?.split(',') || []

serve(async (req) => {
  // Supabase クライアント初期化
  const supabaseClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )
  
  const { user_id, action } = await req.json()
  
  // ユーザー検証
  const { data: user, error: userError } = await supabaseClient
    .from('users')
    .select('id, plan')
    .eq('id', user_id)
    .single()
  
  if (userError || !user) {
    return new Response(JSON.stringify({ error: 'User not found' }), { status: 404 })
  }
  
  // マスターキー選択（ラウンドロビン）
  const masterKeyIndex = Math.floor(Math.random() * MASTER_KEYS.length)
  const masterKey = MASTER_KEYS[masterKeyIndex]
  
  if (action === 'provision') {
    try {
      // 既存キーの確認
      const { data: existingKey } = await supabaseClient
        .from('api_keys')
        .select('or_key, or_key_id, or_expires')
        .eq('user_id', user_id)
        .single()
      
      // 有効期限内のキーが存在する場合は再利用
      if (existingKey && new Date(existingKey.or_expires) > new Date()) {
        return new Response(JSON.stringify({ 
          key: existingKey.or_key,
          expires: existingKey.or_expires
        }))
      }
      
      // 新規キー発行
      const response = await fetch(`${OPENROUTER_API_URL}/auth/keys`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${masterKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: `user-${user_id.substring(0, 8)}`,
          limit: getPlanLimit(user.plan),
          req_per_min: getPlanRateLimit(user.plan),
          expires_after_days: 30
        })
      })
      
      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.status}`)
      }
      
      const keyData = await response.json()
      
      // キー情報をDBに保存
      const expiryDate = new Date()
      expiryDate.setDate(expiryDate.getDate() + 30)
      
      await supabaseClient
        .from('api_keys')
        .upsert({
          user_id,
          or_key: keyData.key,
          or_key_id: keyData.id,
          or_expires: expiryDate.toISOString()
        })
      
      return new Response(JSON.stringify({ 
        key: keyData.key,
        expires: expiryDate.toISOString()
      }))
    } catch (error) {
      console.error('Key provisioning error:', error)
      
      // フォールバック: 共有キーを返す
      return new Response(JSON.stringify({ 
        key: masterKey,
        is_fallback: true,
        error: error.message
      }))
    }
  } else if (action === 'rotate') {
    // キーローテーションロジック
    // ...同様の実装
  }
  
  return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 })
})

// プラン別の制限設定
function getPlanLimit(plan) {
  switch (plan) {
    case 'premium': return 50 // $50相当
    case 'lite': return 20    // $20相当
    case 'free': return 5     // $5相当
    default: return 2
  }
}

function getPlanRateLimit(plan) {
  switch (plan) {
    case 'premium': return 60 // 1分あたり60リクエスト
    case 'lite': return 30    // 1分あたり30リクエスト
    case 'free': return 10    // 1分あたり10リクエスト
    default: return 5
  }
}
```

#### 2.2.2 Cloudflare/OpenAI共有キー管理

```typescript
// supabase/functions/shared-key-manager/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

// 共有キープール
const CF_KEYS = Deno.env.get('CLOUDFLARE_API_KEYS')?.split(',') || []
const OA_KEYS = Deno.env.get('OPENAI_API_KEYS')?.split(',') || []

// キー使用状況追跡（メモリ内、実運用ではRedisなどを使用）
const keyUsage = {
  cf: CF_KEYS.map(() => ({ count: 0, lastError: null })),
  oa: OA_KEYS.map(() => ({ count: 0, lastError: null }))
}

serve(async (req) => {
  const { service, user_id } = await req.json()
  
  if (service === 'cloudflare') {
    // 最も使用回数の少ないキーを選択
    const minIndex = keyUsage.cf
      .map((usage, index) => ({ index, count: usage.count }))
      .sort((a, b) => a.count - b.count)[0].index
    
    // 使用回数をインクリメント
    keyUsage.cf[minIndex].count++
    
    return new Response(JSON.stringify({ 
      key: CF_KEYS[minIndex],
      key_index: minIndex
    }))
  } else if (service === 'openai') {
    // OpenAIキー選択ロジック（同様）
    const minIndex = keyUsage.oa
      .map((usage, index) => ({ index, count: usage.count }))
      .sort((a, b) => a.count - b.count)[0].index
    
    keyUsage.oa[minIndex].count++
    
    return new Response(JSON.stringify({ 
      key: OA_KEYS[minIndex],
      key_index: minIndex
    }))
  }
  
  return new Response(JSON.stringify({ error: 'Invalid service' }), { status: 400 })
})
```

#### 2.2.3 クライアント側実装

```typescript
// services/api.ts
import { supabase } from './supabase'

// APIキー取得関数
export const getApiKey = async (service: 'openrouter' | 'cloudflare' | 'openai') => {
  try {
    let endpoint = ''
    let payload = {}
    
    switch (service) {
      case 'openrouter':
        endpoint = 'api-key-management'
        payload = { action: 'provision' }
        break
      case 'cloudflare':
      case 'openai':
        endpoint = 'shared-key-manager'
        payload = { service }
        break
    }
    
    const { data, error } = await supabase.functions.invoke(endpoint, {
      body: {
        user_id: supabase.auth.user()?.id,
        ...payload
      }
    })
    
    if (error) throw error
    
    return data.key
  } catch (error) {
    console.error(`Failed to get ${service} API key:`, error)
    throw new Error(`APIキーの取得に失敗しました: ${error.message}`)
  }
}

// APIリクエスト関数
export const makeApiRequest = async (service, endpoint, options) => {
  try {
    const apiKey = await getApiKey(service)
    
    // APIリクエスト実行
    const response = await fetch(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${apiKey}`
      }
    })
    
    // レート制限エラー処理
    if (response.status === 429) {
      // エラー報告
      await reportKeyError(service, apiKey, '429')
      
      // 再試行（別のキーで）
      return makeApiRequest(service, endpoint, options)
    }
    
    return response
  } catch (error) {
    // エラーハンドリング
    console.error('API request failed:', error)
    throw error
  }
}

// キーエラー報告
const reportKeyError = async (service, key, errorType) => {
  try {
    await supabase.functions.invoke('key-error-reporter', {
      body: { service, key, errorType }
    })
  } catch (e) {
    console.error('Failed to report key error:', e)
  }
}
```

### 2.3 データモデル

```sql
-- api_keys テーブル
CREATE TABLE api_keys (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  or_key TEXT,
  or_key_id TEXT,
  or_expires TIMESTAMP WITH TIME ZONE,
  last_used TIMESTAMP WITH TIME ZONE DEFAULT now(),
  error_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- key_usage_logs テーブル
CREATE TABLE key_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  service TEXT NOT NULL,
  key_index INTEGER,
  request_type TEXT NOT NULL,
  tokens_used INTEGER,
  status_code INTEGER,
  error TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLSポリシー
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own API keys"
  ON api_keys FOR ALL
  USING (auth.uid() = user_id);

ALTER TABLE key_usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can only access their own usage logs"
  ON key_usage_logs FOR ALL
  USING (auth.uid() = user_id);
```

### 2.4 キーローテーション戦略

#### 2.4.1 OpenRouter

- **自動ローテーション**: 有効期限の5日前に新キー発行
- **実装**: Supabase Cronジョブで毎日実行
  ```sql
  -- 期限切れ間近のキーを検出するクエリ
  SELECT user_id, or_key_id
  FROM api_keys
  WHERE or_expires < (now() + interval '5 days')
  ```

#### 2.4.2 Cloudflare & OpenAI

- **手動ローテーション**: 管理者が90日ごとに新キーを追加
- **実装**: 環境変数更新 + Edge Function再デプロイ
- **移行戦略**: 古いキーを2週間保持し、徐々に新キーへ移行

### 2.5 エラーハンドリングとフォールバック

| シナリオ | アクション | 実装詳細 |
|----------|-----------|----------|
| **キー作成失敗** | 指数バックオフ再試行 | 最大3回、間隔を2倍ずつ増加（1s→2s→4s） |
| | 共有キーへフォールバック | マスターキーを一時的に使用、エラーログ記録 |
| **Provider 429** | キー切り替え | 別のキーインデックスを選択し再試行 |
| | Tierダウングレード | 低Tierモデルへ自動切替（`userStore.checkQuotaStatus`と連携） |
| **ローテーション失敗** | アラート通知 | 管理者へSlack通知、手動介入要求 |
| | 有効期限延長 | 一時的に期限を7日延長し、サービス継続を確保 |
| **認証エラー** | プラットフォーム固有フォールバック | iOS: Keychain、Android: EncryptedSharedPreferences |
| | オフラインモード | ローカルモデルへの自動切替 |

### 2.6 セキュリティ対策

- **キー保護**: すべてのキーはEdge Functionでのみ使用し、クライアントには公開しない
- **アクセス制限**: RLSポリシーによるデータ保護
- **監査ログ**: すべてのキー使用をログに記録し、異常検知
- **暗号化**: キーはSupabase内で暗号化して保存
- **レート制限**: ユーザーごとのリクエスト制限を実装

### 2.7 実装スケジュール

| フェーズ | タスク | 期間 |
|---------|-------|------|
| 1 | データモデル作成 | 1日 |
| 2 | OpenRouter Provisioning API実装 | 2日 |
| 3 | 共有キー管理システム実装 | 2日 |
| 4 | クライアント統合 | 1日 |
| 5 | エラーハンドリングとフォールバック | 2日 |
| 6 | テストとデバッグ | 2日 |

## 3. UI/UXリファクタリング

### 3.1 UI一貫性の実装

#### 3.1.1 テーマシステム

```typescript
// app/ui/theme.ts
export const theme = {
  // カラーパレット
  colors: {
    primary: '#005E36',
    primaryLight: '#00C26A',
    accentBlue: '#007AFF',
    deleteRed: '#FF3B30',
    warningYellow: '#FFCC00',
    background: {
      light: '#FFFFFF',
      dark: '#121212',
    },
    text: {
      primary: {
        light: '#000000',
        dark: '#FFFFFF',
      },
      secondary: {
        light: '#666666',
        dark: '#AAAAAA',
      },
    },
    // 他のカラー定義
  },
  
  // スペーシング
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  
  // セーフエリア
  safeArea: {
    top: 'env(safe-area-inset-top, 0px)',
    bottom: 'env(safe-area-inset-bottom, 0px)',
    left: 'env(safe-area-inset-left, 0px)',
    right: 'env(safe-area-inset-right, 0px)',
  },
  
  // タイポグラフィ
  typography: {
    heading1: {
      fontSize: 24,
      fontWeight: 'bold',
      lineHeight: 32,
    },
    heading2: {
      fontSize: 20,
      fontWeight: 'bold',
      lineHeight: 28,
    },
    // 他のテキストスタイル
  },
  
  // ボーダーラディウス
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 16,
    xl: 24,
    pill: 9999,
  },
  
  // シャドウ
  shadows: {
    sm: {
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
      elevation: 1,
    },
    // 他のシャドウ定義
  },
  
  // アニメーション
  animation: {
    duration: {
      fast: 150,
      normal: 300,
      slow: 500,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    },
  },
};

// ユーティリティ関数
export const getColor = (colorPath: string, isDark: boolean = false) => {
  // カラーパスからテーマカラーを取得する実装
};

export const getSpacing = (size: keyof typeof theme.spacing) => {
  return theme.spacing[size];
};

// Tailwind風ユーティリティ
export const tw = {
  p: (size: keyof typeof theme.spacing) => ({ padding: theme.spacing[size] }),
  px: (size: keyof typeof theme.spacing) => ({ 
    paddingLeft: theme.spacing[size], 
    paddingRight: theme.spacing[size] 
  }),
  py: (size: keyof typeof theme.spacing) => ({ 
    paddingTop: theme.spacing[size], 
    paddingBottom: theme.spacing[size] 
  }),
  // 他のユーティリティ
};
```

#### 3.1.2 コンポーネントリファクタリング優先順位

| コンポーネント | 現状の問題 | リファクタリング方針 | 優先度 |
|--------------|-----------|-------------------|-------|
| **ChatBubble** | インラインスタイル多用、パディング不一致 | テーマ適用、Tailwind風クラス化 | 最高 |
| **Header** | 画面ごとに異なるパディング | `theme.safeArea.top`統一 | 最高 |
| **BottomTabs** | ハードコードされた色/サイズ | テーマカラー参照 | 高 |
| **Buttons** | 複数の実装バリエーション | 統一Button + variant | 高 |
| **Modals** | スタイル不一致 | 共通Modal + content pattern | 中 |
| **Lists** | 不統一なセパレータ/パディング | ListItem抽象化 | 中 |
| **Forms** | 重複コード | FormField抽象化 | 低 |

#### 3.1.3 実装アプローチ

```typescript
// 例: ChatBubble リファクタリング
// Before:
<View style={{ 
  backgroundColor: isUser ? '#DCF8C6' : '#FFFFFF',
  borderRadius: 10,
  padding: 12,
  marginVertical: 4,
  marginHorizontal: 8,
  // ... その他インラインスタイル
}}>
  <Text style={{ fontSize: 16, color: '#000000' }}>{message.text}</Text>
</View>

// After:
import { theme, tw } from '../../ui/theme';

<ChatBubble 
  variant={isUser ? 'user' : 'ai'}
  style={[tw.my('xs'), tw.mx('sm')]}
>
  <Text style={tw.text('body')}>{message.text}</Text>
</ChatBubble>

// components/ChatBubble.tsx
const variants = {
  user: {
    backgroundColor: theme.colors.userBubble,
    alignSelf: 'flex-end',
  },
  ai: {
    backgroundColor: theme.colors.aiBubble,
    alignSelf: 'flex-start',
  },
};

export const ChatBubble = ({ variant, style, children }) => (
  <View 
    style={[
      tw.p('md'),
      tw.rounded('lg'),
      variants[variant],
      style,
    ]}
  >
    {children}
  </View>
);
```

### 3.2 使用量表示UI

#### 3.2.1 Settings › Usage ペイン

```typescript
// components/UsagePanel.tsx
export const UsagePanel = () => {
  const { 
    tokenUsage, 
    tokenLimit,
    imageUsage,
    imageLimit,
    aiAssistUsage,
    aiAssistLimit,
    plan 
  } = useStore(state => state.user);
  
  const tokenPercentage = Math.min(100, Math.round((tokenUsage / tokenLimit) * 100));
  const tokenWarning = tokenPercentage >= 80;
  
  return (
    <View style={tw.p('lg')}>
      <Text style={tw.text('heading2')}>トークン使用量</Text>
      <ProgressBar 
        percentage={tokenPercentage}
        color={tokenWarning ? theme.colors.warningYellow : theme.colors.primary}
        label={`${tokenUsage.toLocaleString()}/${tokenLimit.toLocaleString()}`}
      />
      
      <Text style={[tw.text('heading2'), tw.mt('lg')]}>画像生成</Text>
      <View style={tw.mt('sm')}>
        <UsageCounter 
          label="DALL-E"
          current={imageUsage.dalle}
          limit={imageLimit.dalle}
          isPremium
        />
        <UsageCounter 
          label="SDXL"
          current={imageUsage.sdxl}
          limit={imageLimit.sdxl}
        />
        <UsageCounter 
          label="Lightning"
          current={imageUsage.lightning}
          limit="∞"
          isUnlimited
        />
      </View>
      
      <Text style={[tw.text('heading2'), tw.mt('lg')]}>AIアシスト</Text>
      <ProgressBar 
        percentage={(aiAssistUsage / aiAssistLimit) * 100}
        color={theme.colors.accentBlue}
        label={`${aiAssistUsage}/${aiAssistLimit}`}
      />
      
      {plan !== 'premium' && (
        <UpgradeButton 
          style={tw.mt('xl')}
          label={`${plan === 'free' ? 'Lite' : 'Premium'}にアップグレード`}
        />
      )}
    </View>
  );
};

// components/ProgressBar.tsx
export const ProgressBar = ({ percentage, color, label }) => (
  <View style={[tw.mt('sm'), { height: 24 }]}>
    <View style={[tw.rounded('pill'), { backgroundColor: '#E0E0E0', height: '100%' }]}>
      <View 
        style={[
          tw.rounded('pill'),
          { 
            backgroundColor: color,
            width: `${percentage}%`,
            height: '100%',
          }
        ]}
      />
    </View>
    <Text style={[tw.text('caption'), tw.mt('xs')]}>{label}</Text>
  </View>
);

// components/UsageCounter.tsx
export const UsageCounter = ({ label, current, limit, isPremium, isUnlimited }) => (
  <View style={[tw.flexRow, tw.itemsCenter, tw.justifyBetween, tw.py('xs')]}>
    <View style={tw.flexRow}>
      <Text style={tw.text('body')}>{label}</Text>
      {isPremium && (
        <Badge 
          label="Premium" 
          style={tw.ml('xs')}
          variant="premium"
        />
      )}
    </View>
    <Text style={tw.text('body')}>
      {isUnlimited ? `${current}/${limit}` : `${current}/${limit}`}
    </Text>
  </View>
);
```

#### 3.2.2 ランタイム警告システム

```typescript
// components/QuotaWarningBanner.tsx
export const QuotaWarningBanner = () => {
  const { checkQuotaStatus, dismissWarning } = useStore(state => state.user);
  const [isVisible, setIsVisible] = useState(false);
  const quotaStatus = checkQuotaStatus();
  
  useEffect(() => {
    setIsVisible(quotaStatus.warning || quotaStatus.exceeded);
  }, [quotaStatus]);
  
  if (!isVisible) return null;
  
  return (
    <Animated.View 
      style={[
        tw.px('md'),
        tw.py('sm'),
        tw.flexRow,
        tw.itemsCenter,
        tw.justifyBetween,
        {
          backgroundColor: quotaStatus.exceeded 
            ? theme.colors.deleteRed 
            : theme.colors.warningYellow,
        }
      ]}
      entering={SlideInDown}
      exiting={SlideOutUp}
    >
      <View style={tw.flexRow}>
        <Icon 
          name={quotaStatus.exceeded ? 'alert-circle' : 'alert-triangle'} 
          color="#FFFFFF"
          size={20}
        />
        <Text style={[tw.text('body'), tw.ml('sm'), { color: '#FFFFFF' }]}>
          {quotaStatus.exceeded 
            ? 'クォータ超過: 低Tierモデルへ自動切替' 
            : `トークン残りわずか (${quotaStatus.percentage}%)`}
        </Text>
      </View>
      
      <View style={tw.flexRow}>
        {quotaStatus.exceeded && (
          <Button 
            label="アップグレード"
            variant="white"
            onPress={() => {
              dismissWarning();
              // ナビゲーション: サブスクリプション画面へ
            }}
            style={tw.mr('sm')}
          />
        )}
        <Button 
          label="詳細"
          variant="outline"
          onPress={() => {
            dismissWarning();
            // ナビゲーション: 使用量画面へ
          }}
          style={tw.mr('sm')}
        />
        <Button 
          label="閉じる"
          variant="outline"
          onPress={dismissWarning}
        />
      </View>
    </Animated.View>
  );
};
```

### 3.3 アニメーションとトランジション

#### 3.3.1 標準アニメーション

| 要素 | アニメーション | 実装 |
|------|--------------|------|
| **モーダル** | フェード + スケール | Reanimated `FadeIn` + `ScaleIn` |
| **リスト項目** | スライドイン | Reanimated `SlideInRight` |
| **タブ切替** | クロスフェード | Reanimated `FadeIn` + `FadeOut` |
| **ボタン** | スケール + ハイライト | Pressable + Animated.Value |
| **バナー** | スライドダウン | Reanimated `SlideInDown` |

```typescript
// 例: ボタンプレスアニメーション
export const AnimatedButton = ({ onPress, label, ...props }) => {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const handlePressIn = () => {
    scale.value = withTiming(0.95, { 
      duration: theme.animation.duration.fast,
      easing: Easing.inOut(Easing.ease),
    });
  };
  
  const handlePressOut = () => {
    scale.value = withTiming(1, { 
      duration: theme.animation.duration.fast,
      easing: Easing.inOut(Easing.ease),
    });
  };
  
  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      {...props}
    >
      <Animated.View style={[styles.button, animatedStyle]}>
        <Text style={styles.label}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
};
```

#### 3.3.2 スクリーントランジション

```typescript
// app/_layout.tsx
export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        animation: 'fade_from_bottom',
        headerShown: false,
        contentStyle: {
          backgroundColor: theme.colors.background.light,
        },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      <Stack.Screen 
        name="chat/[id]" 
        options={{ 
          animation: 'slide_from_right',
          gestureEnabled: true,
          gestureDirection: 'horizontal',
        }} 
      />
      <Stack.Screen 
        name="settings/usage" 
        options={{ 
          animation: 'slide_from_bottom',
          presentation: 'modal',
        }} 
      />
      {/* 他の画面定義 */}
    </Stack>
  );
}
```

### 3.4 アクセシビリティ強化

- **セマンティックラベル**: すべてのインタラクティブ要素に `accessibilityLabel` 追加
- **コントラスト**: WCAG AA基準（4.5:1）を満たすカラー調整
- **フォーカス状態**: キーボード/スクリーンリーダー操作のサポート
- **タッチターゲット**: 最小44×44 pxのタッチエリア確保

```typescript
// 例: アクセシブルボタン
export const AccessibleButton = ({ label, onPress, icon }) => (
  <Pressable
    onPress={onPress}
    accessibilityLabel={label}
    accessibilityRole="button"
    accessibilityState={{ disabled: false }}
    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    style={({ pressed }) => [
      styles.button,
      pressed && styles.buttonPressed,
    ]}
  >
    {icon && <Icon name={icon} style={styles.icon} />}
    <Text style={styles.label}>{label}</Text>
  </Pressable>
);
```

### 3.5 レスポンシブデザイン

- **Flexbox**: 柔軟なレイアウト構造の採用
- **相対単位**: パーセンテージとFlexベースのサイズ設定
- **デバイス適応**: `useWindowDimensions` によるサイズ検出
- **向き対応**: 縦横両方の向きをサポート

```typescript
// hooks/useResponsive.ts
export const useResponsive = () => {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  
  const breakpoints = {
    sm: width < 375,
    md: width >= 375 && width < 768,
    lg: width >= 768,
  };
  
  const spacing = {
    container: breakpoints.sm ? 12 : breakpoints.md ? 16 : 24,
    // 他のレスポンシブ値
  };
  
  return {
    width,
    height,
    isLandscape,
    breakpoints,
    spacing,
  };
};

// 使用例
const MyComponent = () => {
  const { breakpoints, spacing } = useResponsive();
  
  return (
    <View style={{ padding: spacing.container }}>
      {breakpoints.lg ? (
        <TwoColumnLayout />
      ) : (
        <SingleColumnLayout />
      )}
    </View>
  );
};
```

### 3.6 実装スケジュール

| フェーズ | タスク | 期間 |
|---------|-------|------|
| 1 | テーマシステム構築 (`ui/theme.ts`) | 1日 |
| 2 | 共通コンポーネントリファクタリング (Button, Header, ChatBubble) | 2日 |
| 3 | 使用量表示UI実装 | 1日 |
| 4 | クォータ警告システム | 1日 |
| 5 | アニメーション統合 | 2日 |
| 6 | アクセシビリティ対応 | 1日 |
| 7 | テスト・調整 | 2日 |

## 4. ローカルモデル管理（Unsloth版Qwen3-4B）

### 4.1 モデル選定と準備

- **選定モデル**: Unsloth版Qwen3-4B (Q4_K_M) 4bit GGUF
  - **サイズ**: 約2.5GB（4bit量子化済み）
  - **ソース**: Hugging Faceの`unsloth/Qwen3-4B-GGUF`リポジトリ
  - **特徴**: 品質と速度のバランスが良い4bit量子化モデル、コンテキスト長32,768トークン
  - **ライセンス**: Apache-2.0（暗号化不要）

- **ホスティング**:
  - Supabase Storageのプライベートバケット`models/qwen3-4b/`に配置
  - ファイルのSHA-256ハッシュを保存（整合性チェック用）
  - Edge Functionで署名付きURLを生成（有効期間1時間）

### 4.2 ダウンロードワーカー実装

```typescript
// services/localModel.ts
export const downloadQwen3Model = async (
  progressCallback: (progress: number) => void
): Promise<boolean> => {
  try {
    // 保存先パス
    const destDir = `${FileSystem.documentDirectory}models/`;
    const destPath = `${destDir}Qwen3-4B-Q4_K_M.gguf`;
    
    // ディレクトリ作成
    await FileSystem.makeDirectoryAsync(destDir, { intermediates: true });
    
    // ストレージチェック
    const { freeSizeInBytes } = await getAvailableStorageSpace();
    if (freeSizeInBytes < 3 * 1024 * 1024 * 1024) { // 3GB以上必要
      throw new Error('ストレージ容量が不足しています。少なくとも3GB以上の空き容量が必要です。');
    }
    
    // 署名付きURL取得
    const signedUrl = await api.getSignedUrl('models/qwen3-4b/Q4_K_M.gguf');
    
    // ダウンロード（進捗表示付き）
    await FileSystem.downloadAsync(signedUrl, destPath, {
      md5: true,
      headers: { 'Cache-Control': 'no-store' },
      callback: (downloadProgress) => {
        const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
        progressCallback(progress);
      }
    });
    
    // ハッシュ検証
    const fileInfo = await FileSystem.getInfoAsync(destPath, { md5: true });
    const isValid = fileInfo.md5 === EXPECTED_QWEN_MD5;
    
    if (!isValid) {
      throw new Error('ダウンロードしたモデルファイルの整合性検証に失敗しました。');
    }
    
    // 成功を記録
    await SecureStore.setItemAsync('qwenInstalled', 'true');
    await SecureStore.setItemAsync('qwenInstalledDate', new Date().toISOString());
    
    return true;
  } catch (error) {
    console.error('Qwen3モデルダウンロードエラー:', error);
    throw error;
  }
};
```

### 4.3 llama.rnによるモデルロード

```typescript
// services/localInference.ts
import { initLlama, LlamaContext } from 'llama.rn';

export const loadQwenModel = async (): Promise<LlamaContext | null> => {
  try {
    const modelPath = `${FileSystem.documentDirectory}models/Qwen3-4B-Q4_K_M.gguf`;
    
    // ファイル存在確認
    const fileInfo = await FileSystem.getInfoAsync(modelPath);
    if (!fileInfo.exists) {
      throw new Error('モデルファイルが見つかりません。');
    }
    
    // モデルロード
    const ctx = await initLlama({
      modelPath: 'file://' + modelPath,
      nCtx: 32768,     // コンテキストウィンドウサイズ（32Kトークン対応）
      nThreads: 4,     // 使用スレッド数
      nBatch: 512,     // バッチサイズ
    });
    
    return ctx;
  } catch (error) {
    // エラー処理
    console.error('Qwenモデルロードエラー:', error);
    
    // メモリ不足エラーの場合はクラウドモデルへの切替えを推奨
    if (error.message.includes('LLAMA_NOMEM') || error.message.includes('memory')) {
      showToast('メモリ不足のためローカルモデルを読み込めません。クラウドモデルに切り替えます。');
    } else {
      showToast('ローカルモデルを読み込めません。クラウドモデルに切り替えます。');
    }
    
    return null;
  }
};
```

### 4.4 ステータスバッジとUI

```typescript
// components/LocalModelStatusBadge.tsx
export const LocalModelStatusBadge = () => {
  const { 
    modelStatus, 
    downloadProgress,
    errorMessage 
  } = useStore(state => state.localModel);
  
  // ステータスに応じたバッジ表示
  const getBadgeContent = () => {
    switch (modelStatus) {
      case 'not_downloaded':
        return { icon: '⚪️', label: '未DL', color: '#AAAAAA' };
      case 'downloading':
        return { 
          icon: '🔄', 
          label: `${Math.round(downloadProgress * 100)}%`, 
          color: '#007AFF' 
        };
      case 'verifying':
        return { icon: '🔍', label: '検証中', color: '#FFCC00' };
      case 'ready':
        return { icon: '🟢', label: '使用可', color: '#34C759' };
      case 'error':
        return { icon: '🔴', label: 'エラー', color: '#FF3B30' };
      default:
        return { icon: '⚪️', label: '未DL', color: '#AAAAAA' };
    }
  };
  
  const badge = getBadgeContent();
  
  return (
    <Pressable 
      onPress={() => {
        // エラー状態の場合、詳細を表示
        if (modelStatus === 'error' && errorMessage) {
          Alert.alert('エラー詳細', errorMessage);
        }
      }}
      style={[styles.badge, { backgroundColor: badge.color }]}
    >
      <Text style={styles.icon}>{badge.icon}</Text>
      <Text style={styles.label}>{badge.label}</Text>
    </Pressable>
  );
};
```

### 4.5 プラン別クォータ管理

| プラン | ローカルLLM呼び出し上限／日 | 超過時の挙動 |
|--------|--------------------------|------------|
| Free | 50 回 | Cloud版 GPT-4o-mini に自動フォールバック |
| Lite | 500 回 | 同上 |
| Premium | 無制限 | — |

```typescript
// store/localModelStore.ts
export const createLocalModelSlice = (set, get) => ({
  // 状態
  modelStatus: 'not_downloaded',
  downloadProgress: 0,
  errorMessage: null,
  dailyUsageCount: 0,
  dailyUsageLimit: 50, // デフォルトはFreeプラン
  usageResetDate: new Date().toISOString().split('T')[0],
  
  // アクション
  checkDailyUsageLimit: () => {
    const state = get();
    const today = new Date().toISOString().split('T')[0];
    
    // 日付が変わっていたらリセット
    if (state.usageResetDate !== today) {
      set({
        dailyUsageCount: 0,
        usageResetDate: today,
      });
      return true; // 制限内
    }
    
    // プラン別の制限チェック
    const { plan } = get().user;
    const isPremium = plan === 'premium';
    
    // Premiumは無制限
    if (isPremium) return true;
    
    // 制限チェック
    return state.dailyUsageCount < state.dailyUsageLimit;
  },
  
  incrementUsageCount: () => {
    set(state => ({
      dailyUsageCount: state.dailyUsageCount + 1,
    }));
  },
  
  updateUsageLimitByPlan: (plan) => {
    const limits = {
      free: 50,
      lite: 500,
      premium: Number.MAX_SAFE_INTEGER, // 実質無制限
    };
    
    set({
      dailyUsageLimit: limits[plan] || limits.free,
    });
  },
  
  // その他のアクション（ダウンロード、ステータス更新など）
  // ...
});
```

### 4.6 ネイティブ連携

- **iOS**: `pod install`でllama.cppをリンク
  ```ruby
  # ios/Podfile
  pod 'llama-cpp', :path => '../node_modules/llama.rn/ios'
  ```

- **Android**: Gradleでネイティブライブラリをリンク
  ```gradle
  // android/app/build.gradle
  android {
    // ...
    packagingOptions {
      pickFirst 'lib/x86/libllama.so'
      pickFirst 'lib/x86_64/libllama.so'
      pickFirst 'lib/arm64-v8a/libllama.so'
      pickFirst 'lib/armeabi-v7a/libllama.so'
    }
  }
  ```

### 4.7 セキュリティと保存場所

- **保存場所**: `FileSystem.documentDirectory`配下（アプリ削除で自動消去）
- **ライセンス**: Apache-2.0ライセンスのため暗号化不要
- **iOS Files.app連携**: 必要に応じて`com.apple.security.files.user-selected.read-write`エンティトルメントを追加

### 4.8 Thinkingモードと拡張コンテキスト

- **Thinkingモード**: `/think`と`/no_think`コマンドをサポート
  - `/think`: 推論過程を表示するモード（より詳細な思考過程）
  - `/no_think`: 直接回答を生成するモード（デフォルト）
  - UIでの切り替え: 設定画面に「Thinking モード」トグルを追加

- **サンプリングパラメータ**:
  | モード | Temperature | TopP | TopK | MinP |
  |-------|-------------|------|------|------|
  | Thinking | 0.6 | 0.95 | 20 | 0 |
  | Non-thinking | 0.7 | 0.8 | 20 | 0 |

- **拡張コンテキスト**:
  - ネイティブコンテキスト長: 32,768トークン
  - YaRN方式による拡張: 最大131,072トークン（高性能端末のみ）
  - メモリ使用量に応じた動的調整

## 5. 画像生成機能強化

### 5.1 機能概要

#### 5.1.1 チャットトグル
- 左側アイコンで**画像モード**切替
- アクティブ時、ユーザープロンプトは画像パイプラインを呼び出し、AI応答に `<ImageBubble>` を含む
- トグル状態はチャットごとに保存され、次回起動時に復元

#### 5.1.2 画像タブ
- **ヘッダー**: 過去画像のMasonryギャラリー（無限スクロール）
- **フッター**: 解像度ピッカー、高解像度トグルを備えたチャットバー
- **ボトムナビ**: 順序: *New* · **Image** · *Note* · *Settings*

#### 5.1.3 プラン別画像制限

| プラン | DALL·E 3 | SDXL-25step |
|--------|---------|-------------|
| Free | 0 | 5 / day |
| Lite | 1 / day | 15 / day |
| Premium | 5 / day | 50 / day |

制限超過後: フォールバックチェーン → SDXL-25 → 429エラー表示

### 5.2 コンポーネント設計

#### 5.2.1 ImageGenerationPanel.tsx
```typescript
// components/ImageGenerationPanel.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { useStore } from '../store';
import { tw, theme } from '../ui/theme';
import { ImageSize, ImageQuality, ImageModel } from '../constants/imageModels';

export type ImageGenerationPanelProps = {
  onImageGenerated: (imageUrl: string) => void;
  onClose: () => void;
};

export const ImageGenerationPanel: React.FC<ImageGenerationPanelProps> = ({
  onImageGenerated,
  onClose,
}) => {
  const { 
    userPlan, 
    sdxlQuota, 
    dalleQuota,
    generateImage,
    incrementImageUsage
  } = useStore();
  
  const [prompt, setPrompt] = useState('');
  const [size, setSize] = useState<ImageSize>('768x768');
  const [quality, setQuality] = useState<ImageQuality>('standard');
  const [model, setModel] = useState<ImageModel>('sdxl');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // プラン別の利用可能モデル判定
  const canUseDalle = userPlan === 'premium' || userPlan === 'lite';
  const remainingSdxl = sdxlQuota.remaining;
  const remainingDalle = dalleQuota.remaining;
  
  // 画像生成ハンドラ
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('プロンプトを入力してください');
      return;
    }
    
    setIsGenerating(true);
    setError(null);
    
    try {
      // 選択されたモデルで画像生成
      const imageUrl = await generateImage({
        prompt,
        size,
        quality,
        model: canUseDalle && model === 'dalle' ? 'dalle' : 'sdxl',
      });
      
      // 使用量カウンター更新
      incrementImageUsage(model === 'dalle' ? 'dalle' : 'sdxl');
      
      // 親コンポーネントに通知
      onImageGenerated(imageUrl);
      onClose();
    } catch (err: any) {
      setError(err.message || '画像生成に失敗しました');
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <View style={tw.p('lg')}>
      <Text style={tw.text('title')}>画像生成</Text>
      
      {/* クォータ表示 */}
      <View style={[tw.flexRow, tw.justifyBetween, tw.mb('md')]}>
        <Text style={tw.text('body')}>
          SDXL: 残り {remainingSdxl}/{sdxlQuota.total}
        </Text>
        {canUseDalle && (
          <Text style={tw.text('body')}>
            DALL·E: 残り {remainingDalle}/{dalleQuota.total}
          </Text>
        )}
      </View>
      
      {/* プロンプト入力 */}
      <TextInput
        style={[tw.input, tw.mb('md')]}
        placeholder="画像の説明を入力..."
        value={prompt}
        onChangeText={setPrompt}
        multiline
        numberOfLines={3}
      />
      
      {/* モデル選択 */}
      <Text style={[tw.text('label'), tw.mb('sm')]}>モデル:</Text>
      <View style={[tw.flexRow, tw.mb('md')]}>
        <TouchableOpacity
          style={[
            tw.btn,
            tw.mr('sm'),
            model === 'sdxl' ? tw.btnPrimary : tw.btnOutline
          ]}
          onPress={() => setModel('sdxl')}
        >
          <Text style={model === 'sdxl' ? tw.textWhite : tw.textPrimary}>
            SDXL
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            tw.btn,
            canUseDalle ? null : tw.btnDisabled,
            model === 'dalle' ? tw.btnPrimary : tw.btnOutline
          ]}
          onPress={() => canUseDalle && setModel('dalle')}
          disabled={!canUseDalle}
        >
          <Text 
            style={[
              model === 'dalle' ? tw.textWhite : tw.textPrimary,
              !canUseDalle && tw.textDisabled
            ]}
          >
            DALL·E 3
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* サイズ選択 */}
      <Text style={[tw.text('label'), tw.mb('sm')]}>サイズ:</Text>
      <View style={[tw.flexRow, tw.flexWrap, tw.mb('md')]}>
        {['512x512', '768x768', '1024x1024'].map((imageSize) => (
          <TouchableOpacity
            key={imageSize}
            style={[
              tw.btn,
              tw.mr('sm'),
              tw.mb('sm'),
              size === imageSize ? tw.btnPrimary : tw.btnOutline
            ]}
            onPress={() => setSize(imageSize as ImageSize)}
          >
            <Text style={size === imageSize ? tw.textWhite : tw.textPrimary}>
              {imageSize}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* 品質選択 */}
      <Text style={[tw.text('label'), tw.mb('sm')]}>品質:</Text>
      <View style={[tw.flexRow, tw.mb('lg')]}>
        <TouchableOpacity
          style={[
            tw.btn,
            tw.mr('sm'),
            quality === 'standard' ? tw.btnPrimary : tw.btnOutline
          ]}
          onPress={() => setQuality('standard')}
        >
          <Text style={quality === 'standard' ? tw.textWhite : tw.textPrimary}>
            標準
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            tw.btn,
            quality === 'hd' ? tw.btnPrimary : tw.btnOutline
          ]}
          onPress={() => setQuality('hd')}
        >
          <Text style={quality === 'hd' ? tw.textWhite : tw.textPrimary}>
            高品質
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* エラー表示 */}
      {error && (
        <Text style={[tw.text('error'), tw.mb('md')]}>
          {error}
        </Text>
      )}
      
      {/* 生成ボタン */}
      <TouchableOpacity
        style={[
          tw.btn,
          tw.btnLg,
          isGenerating || (!remainingSdxl && !remainingDalle) ? tw.btnDisabled : tw.btnPrimary
        ]}
        onPress={handleGenerate}
        disabled={isGenerating || (!remainingSdxl && !remainingDalle)}
      >
        {isGenerating ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={tw.textWhite}>生成</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};
```

#### 5.2.2 ImageBubble.tsx
```typescript
// components/ImageBubble.tsx
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { tw, theme } from '../ui/theme';

export type ImageBubbleProps = {
  imageUrl: string;
  prompt: string;
  timestamp: string;
  isSent: boolean;
  onLongPress?: () => void;
  onPress?: () => void;
};

export const ImageBubble: React.FC<ImageBubbleProps> = ({
  imageUrl,
  prompt,
  timestamp,
  isSent,
  onLongPress,
  onPress,
}) => {
  return (
    <Pressable
      onLongPress={onLongPress}
      onPress={onPress}
      style={[
        tw.mb('md'),
        tw.maxW('80%'),
        isSent ? tw.selfEnd : tw.selfStart,
      ]}
    >
      <View
        style={[
          tw.rounded('lg'),
          tw.overflow('hidden'),
          isSent 
            ? { backgroundColor: theme.colors.primary } 
            : { backgroundColor: theme.colors.cardBg },
        ]}
      >
        <Image
          source={{ uri: imageUrl }}
          style={{ width: '100%', aspectRatio: 1 }}
          contentFit="cover"
          transition={300}
        />
        
        <View style={tw.p('sm')}>
          <Text 
            style={[
              tw.text('body'),
              { color: isSent ? '#FFFFFF' : theme.colors.text },
            ]}
            numberOfLines={2}
          >
            {prompt}
          </Text>
          
          <Text 
            style={[
              tw.text('caption'),
              tw.mt('xs'),
              { color: isSent ? 'rgba(255,255,255,0.7)' : theme.colors.textSecondary },
            ]}
          >
            {timestamp}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};
```

### 5.3 状態管理（imageStore.ts）

```typescript
// store/imageStore.ts
import { StateCreator } from 'zustand';
import { StoreState } from './index';
import { generateImage as apiGenerateImage } from '../services/api';

export interface ImageQuota {
  total: number;
  used: number;
  remaining: number;
  resetDate: string; // ISO日付文字列
}

export interface ImageState {
  // 画像生成クォータ
  sdxlQuota: ImageQuota;
  dalleQuota: ImageQuota;
  
  // 画像生成履歴
  generatedImages: {
    id: string;
    url: string;
    prompt: string;
    model: 'sdxl' | 'dalle';
    createdAt: string;
    chatId?: string;
  }[];
  
  // アクション
  generateImage: (params: {
    prompt: string;
    size: string;
    quality: string;
    model: 'sdxl' | 'dalle';
  }) => Promise<string>;
  
  incrementImageUsage: (model: 'sdxl' | 'dalle') => void;
  resetImageQuotas: () => void;
  addGeneratedImage: (image: {
    url: string;
    prompt: string;
    model: 'sdxl' | 'dalle';
    chatId?: string;
  }) => string;
}

export const createImageSlice: StateCreator<
  StoreState,
  [],
  [],
  ImageState
> = (set, get) => ({
  // 初期状態
  sdxlQuota: {
    total: 5, // Freeプランのデフォルト
    used: 0,
    remaining: 5,
    resetDate: new Date(new Date().setHours(0, 0, 0, 0) + 24 * 60 * 60 * 1000).toISOString(),
  },
  
  dalleQuota: {
    total: 0, // Freeプランのデフォルト
    used: 0,
    remaining: 0,
    resetDate: new Date(new Date().setHours(0, 0, 0, 0) + 24 * 60 * 60 * 1000).toISOString(),
  },
  
  generatedImages: [],
  
  // 画像生成
  generateImage: async ({ prompt, size, quality, model }) => {
    const { sdxlQuota, dalleQuota } = get();
    
    // クォータチェック
    if (model === 'dalle' && dalleQuota.remaining <= 0) {
      // DALL-Eクォータ超過時はSDXLにフォールバック
      model = 'sdxl';
    }
    
    if (model === 'sdxl' && sdxlQuota.remaining <= 0) {
      throw new Error('本日の画像生成回数上限に達しました');
    }
    
    try {
      // API呼び出し
      const imageUrl = await apiGenerateImage({
        prompt,
        size,
        quality,
        model,
      });
      
      // 生成履歴に追加
      const imageId = get().addGeneratedImage({
        url: imageUrl,
        prompt,
        model,
        chatId: get().activeChat,
      });
      
      return imageUrl;
    } catch (error: any) {
      console.error('Image generation error:', error);
      throw new Error(error.message || '画像生成に失敗しました');
    }
  },
  
  // 使用量カウンター更新
  incrementImageUsage: (model) => {
    if (model === 'dalle') {
      const { dalleQuota } = get();
      set({
        dalleQuota: {
          ...dalleQuota,
          used: dalleQuota.used + 1,
          remaining: Math.max(0, dalleQuota.remaining - 1),
        },
      });
    } else {
      const { sdxlQuota } = get();
      set({
        sdxlQuota: {
          ...sdxlQuota,
          used: sdxlQuota.used + 1,
          remaining: Math.max(0, sdxlQuota.remaining - 1),
        },
      });
    }
  },
  
  // クォータリセット（日次）
  resetImageQuotas: () => {
    const { userPlan } = get();
    
    // プラン別クォータ設定
    const quotas = {
      free: { sdxl: 5, dalle: 0 },
      lite: { sdxl: 15, dalle: 1 },
      premium: { sdxl: 50, dalle: 5 },
    };
    
    const plan = userPlan || 'free';
    const resetDate = new Date(new Date().setHours(0, 0, 0, 0) + 24 * 60 * 60 * 1000).toISOString();
    
    set({
      sdxlQuota: {
        total: quotas[plan].sdxl,
        used: 0,
        remaining: quotas[plan].sdxl,
        resetDate,
      },
      dalleQuota: {
        total: quotas[plan].dalle,
        used: 0,
        remaining: quotas[plan].dalle,
        resetDate,
      },
    });
  },
  
  // 生成履歴に追加
  addGeneratedImage: ({ url, prompt, model, chatId }) => {
    const id = `img_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    set((state) => ({
      generatedImages: [
        {
          id,
          url,
          prompt,
          model,
          chatId,
          createdAt: new Date().toISOString(),
        },
        ...state.generatedImages,
      ].slice(0, 100), // 最新100件のみ保持
    }));
    
    return id;
  },
});
```

### 5.4 API統合（api.ts）

```typescript
// services/api.ts に追加
export const generateImage = async ({
  prompt,
  size = '768x768',
  quality = 'standard',
  model = 'sdxl',
}: {
  prompt: string;
  size?: string;
  quality?: string;
  model?: 'sdxl' | 'dalle';
}): Promise<string> => {
  try {
    if (model === 'dalle') {
      // OpenAI DALL-E 3 API
      const response = await fetch(`${API_BASE_URL}/images/generations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getApiKey('openai')}`,
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
        throw new Error(error.error?.message || 'DALL-E画像生成に失敗しました');
      }
      
      const data = await response.json();
      return data.data[0].url;
    } else {
      // Cloudflare Workers AI SDXL API
      const [width, height] = size.split('x').map(Number);
      
      const response = await fetch(`${WORKERS_API_URL}/sdxl`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getApiKey('cloudflare')}`,
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
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'SDXL画像生成に失敗しました');
      }
      
      // レスポンスはバイナリ画像データ
      const blob = await response.blob();
      
      // Supabaseストレージにアップロード
      const fileName = `images/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.png`;
      const { data, error } = await supabase.storage
        .from('user-content')
        .upload(fileName, blob, {
          contentType: 'image/png',
          upsert: false,
        });
      
      if (error) {
        throw new Error('画像の保存に失敗しました');
      }
      
      // 公開URLを取得
      const { data: urlData } = supabase.storage
        .from('user-content')
        .getPublicUrl(fileName);
      
      return urlData.publicUrl;
    }
  } catch (error: any) {
    console.error('Image generation API error:', error);
    throw new Error(error.message || '画像生成に失敗しました');
  }
};
```

### 5.5 UI統合

#### 5.5.1 チャットルームへの統合
```typescript
// app/chat/[id].tsx に追加
import { ImageGenerationPanel } from '../../components/ImageGenerationPanel';
import { ImageBubble } from '../../components/ImageBubble';

// チャットルーム内
const ChatRoom = () => {
  // 既存のステート
  const [isImageMode, setIsImageMode] = useState(false);
  const [showImagePanel, setShowImagePanel] = useState(false);
  
  // 画像モードトグル
  const toggleImageMode = () => {
    setIsImageMode(!isImageMode);
    // 状態をストアに保存
    updateChatSettings(chatId, { isImageMode: !isImageMode });
  };
  
  // 画像生成パネル表示
  const openImagePanel = () => {
    setShowImagePanel(true);
  };
  
  // 画像生成完了ハンドラ
  const handleImageGenerated = (imageUrl: string) => {
    // メッセージリストに画像を追加
    addMessage({
      id: `msg_${Date.now()}`,
      type: 'image',
      content: userInput,
      imageUrl,
      sender: 'ai',
      timestamp: new Date().toISOString(),
    });
    
    // 入力フィールドをクリア
    setUserInput('');
  };
  
  // メッセージ送信ハンドラ
  const handleSendMessage = () => {
    if (!userInput.trim()) return;
    
    if (isImageMode) {
      // 画像モードの場合は画像生成パネルを表示
      openImagePanel();
    } else {
      // テキストモードの場合は通常のメッセージ送信
      sendTextMessage(userInput);
    }
  };
  
  // メッセージレンダリング
  const renderMessage = ({ item: message }) => {
    if (message.type === 'image') {
      return (
        <ImageBubble
          imageUrl={message.imageUrl}
          prompt={message.content}
          timestamp={formatTimestamp(message.timestamp)}
          isSent={message.sender === 'user'}
          onLongPress={() => handleMessageLongPress(message)}
          onPress={() => handleImagePress(message.imageUrl)}
        />
      );
    }
    
    return (
      <MessageBubble
        content={message.content}
        timestamp={formatTimestamp(message.timestamp)}
        isSent={message.sender === 'user'}
        onLongPress={() => handleMessageLongPress(message)}
      />
    );
  };
  
  return (
    <View style={tw.flex1}>
      {/* チャットメッセージリスト */}
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={tw.p('md')}
      />
      
      {/* 入力エリア */}
      <View style={[tw.flexRow, tw.p('sm'), tw.itemsCenter]}>
        <TouchableOpacity
          style={[
            tw.p('sm'),
            tw.rounded('full'),
            isImageMode ? { backgroundColor: theme.colors.primary } : null,
          ]}
          onPress={toggleImageMode}
        >
          <Icon
            name="image"
            size={24}
            color={isImageMode ? '#FFFFFF' : theme.colors.text}
          />
        </TouchableOpacity>
        
        <TextInput
          style={[tw.flex1, tw.input, tw.mx('sm')]}
          placeholder={isImageMode ? "画像の説明を入力..." : "メッセージを入力..."}
          value={userInput}
          onChangeText={setUserInput}
          multiline
        />
        
        <TouchableOpacity
          style={[
            tw.p('sm'),
            tw.rounded('full'),
            { backgroundColor: theme.colors.primary },
          ]}
          onPress={handleSendMessage}
        >
          <Icon name="send" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      {/* 画像生成パネル */}
      <Modal
        visible={showImagePanel}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowImagePanel(false)}
      >
        <View style={[tw.flex1, tw.justifyEnd]}>
          <View style={[tw.bg('white'), tw.rounded('t-lg')]}>
            <ImageGenerationPanel
              onImageGenerated={handleImageGenerated}
              onClose={() => setShowImagePanel(false)}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};
```

#### 5.5.2 画像タブの実装
```typescript
// app/(tabs)/image.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Modal } from 'react-native';
import { Image } from 'expo-image';
import { useStore } from '../../store';
import { tw, theme } from '../../ui/theme';
import { ImageGenerationPanel } from '../../components/ImageGenerationPanel';

export default function ImageScreen() {
  const { generatedImages, sdxlQuota, dalleQuota } = useStore();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImagePanel, setShowImagePanel] = useState(false);
  
  // 画像詳細表示
  const handleImagePress = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };
  
  // 画像生成完了ハンドラ
  const handleImageGenerated = (imageUrl: string) => {
    setShowImagePanel(false);
  };
  
  return (
    <View style={tw.flex1}>
      {/* ヘッダー */}
      <View style={[tw.flexRow, tw.justifyBetween, tw.p('md'), tw.borderB]}>
        <Text style={tw.text('title')}>画像ギャラリー</Text>
        
        <TouchableOpacity
          style={[tw.btn, tw.btnPrimary]}
          onPress={() => setShowImagePanel(true)}
        >
          <Text style={tw.textWhite}>新規作成</Text>
        </TouchableOpacity>
      </View>
      
      {/* クォータ表示 */}
      <View style={[tw.flexRow, tw.justifyBetween, tw.p('md')]}>
        <Text style={tw.text('body')}>
          SDXL: 残り {sdxlQuota.remaining}/{sdxlQuota.total}
        </Text>
        {dalleQuota.total > 0 && (
          <Text style={tw.text('body')}>
            DALL·E: 残り {dalleQuota.remaining}/{dalleQuota.total}
          </Text>
        )}
      </View>
      
      {/* 画像ギャラリー */}
      {generatedImages.length > 0 ? (
        <FlatList
          data={generatedImages}
          numColumns={2}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[tw.flex1, tw.p('xs')]}
              onPress={() => handleImagePress(item.url)}
            >
              <View style={[tw.rounded('lg'), tw.overflow('hidden')]}>
                <Image
                  source={{ uri: item.url }}
                  style={{ aspectRatio: 1 }}
                  contentFit="cover"
                  transition={300}
                />
                <View style={[tw.p('xs'), tw.bgBlack50]}>
                  <Text 
                    style={[tw.text('caption'), tw.textWhite]}
                    numberOfLines={1}
                  >
                    {item.prompt}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id}
          contentContainerStyle={tw.p('xs')}
        />
      ) : (
        <View style={[tw.flex1, tw.center, tw.p('lg')]}>
          <Text style={tw.text('body')}>
            まだ画像がありません。「新規作成」から画像を生成してみましょう。
          </Text>
        </View>
      )}
      
      {/* 画像詳細モーダル */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <View style={[tw.flex1, tw.bgBlack80, tw.center, tw.p('md')]}>
          <TouchableOpacity
            style={tw.absolute}
            onPress={() => setSelectedImage(null)}
          >
            <View style={tw.flex1} />
          </TouchableOpacity>
          
          <Image
            source={{ uri: selectedImage || '' }}
            style={[tw.w('100%'), tw.aspectSquare, tw.rounded('lg')]}
            contentFit="contain"
          />
        </View>
      </Modal>
      
      {/* 画像生成パネル */}
      <Modal
        visible={showImagePanel}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowImagePanel(false)}
      >
        <View style={[tw.flex1, tw.justifyEnd]}>
          <View style={[tw.bg('white'), tw.rounded('t-lg')]}>
            <ImageGenerationPanel
              onImageGenerated={handleImageGenerated}
              onClose={() => setShowImagePanel(false)}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
```

### 5.6 エラー処理とフォールバック

#### 5.6.1 エラーハンドリング戦略
- **クォータ超過**: プラン別制限に達した場合、適切なエラーメッセージを表示
- **API障害**: サービス障害時は代替プロバイダーにフォールバック
- **ネットワークエラー**: オフライン時は適切なメッセージを表示し、再試行オプションを提供
- **コンテンツフィルタリング**: 不適切なコンテンツリクエストは拒否し、理由を説明

#### 5.6.2 フォールバックメカニズム
```typescript
// 画像生成フォールバックロジック
const generateWithFallback = async (params) => {
  try {
    // 第一選択: ユーザー選択モデル
    return await generateImage(params);
  } catch (error) {
    // エラーがクォータ超過またはAPI障害の場合
    if (error.message.includes('quota') || error.message.includes('rate limit')) {
      // プランに応じたフォールバック
      if (params.model === 'dalle') {
        // DALL-E → SDXL
        return await generateImage({ ...params, model: 'sdxl' });
      } else {
        // フォールバックなし、エラーを表示
        throw new Error('本日の画像生成回数上限に達しました');
      }
    }
    
    // その他のエラーは再スロー
    throw error;
  }
};
```

### 5.7 テスト項目

- **UI検証**: 各画面での画像生成UIの表示と操作性
- **プラン別制限**: Free/Lite/Premiumプランでの画像生成制限の正確な適用
- **モデル切替**: SDXL/DALL-E間の切替とフォールバック動作
- **エラー処理**: クォータ超過、API障害、ネットワークエラー時の適切な処理
- **画像保存**: 生成画像のストレージへの保存と取得
- **パフォーマンス**: 画像生成と表示の応答性
- **アクセシビリティ**: スクリーンリーダー対応と多言語サポート

## 6. チャットコピー/共有

### 6.1 アクション一覧

| コンテンツ | アクションスロット |
|------------|-------------------|
| **テキストバブル** | コピー · ノートにコピー（モーダル） · 共有（ネイティブシート） |
| **画像バブル** | 長押し → コピー · ノートにコピー · 写真に保存 · 共有 |

### 6.2 コンポーネント設計

#### MessageActions.tsx
```typescript
// components/MessageActions.tsx
import { ActionSheetProvider, useActionSheet } from '@expo/react-native-action-sheet';
import * as Clipboard from 'expo-clipboard';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { useStore } from '../store';

export type MessageActionProps = {
  messageId: string;
  messageType: 'text' | 'image';
  content: string;
  imageUri?: string;
  onDismiss: () => void;
};

export const MessageActions: React.FC<MessageActionProps> = ({
  messageId,
  messageType,
  content,
  imageUri,
  onDismiss,
}) => {
  const { showActionSheetWithOptions } = useActionSheet();
  const { addNoteFromMessage, saveImageToGallery } = useStore();
  
  // アクションシート表示ロジック
  const showActions = () => {
    const options = messageType === 'text' 
      ? ['コピー', 'ノートに保存', '共有', 'キャンセル']
      : ['コピー', 'ノートに保存', '写真に保存', '共有', 'キャンセル'];
    
    const cancelButtonIndex = options.length - 1;
    
    showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
        // iOS専用オプション
        userInterfaceStyle: 'light',
        // Androidカスタマイズ
        containerStyle: { backgroundColor: '#f5f5f5' },
      },
      async (selectedIndex) => {
        // 選択されたアクションを実行
        switch (selectedIndex) {
          case 0: // コピー
            await handleCopy();
            break;
          case 1: // ノートに保存
            handleSaveToNote();
            break;
          case 2: // 写真に保存 or 共有
            if (messageType === 'image') {
              await handleSaveImage();
            } else {
              await handleShare();
            }
            break;
          case 3: // 共有 (画像の場合のみ)
            if (messageType === 'image') {
              await handleShare();
            }
            break;
          default:
            break;
        }
        onDismiss();
      }
    );
  };
  
  // 各アクション実装
  // ...
};
```

### 6.3 機能実装詳細

#### 6.3.1 テキストコピー機能
```typescript
// テキストコピー機能
const handleCopy = async () => {
  try {
    await Clipboard.setStringAsync(content);
    showToast('コピーしました');
  } catch (error) {
    console.error('コピーエラー:', error);
    showToast('コピーに失敗しました');
  }
};
```

#### 6.3.2 ノート保存機能
```typescript
// ノート保存機能
const handleSaveToNote = async () => {
  try {
    let noteContent = '';
    
    if (messageType === 'text') {
      // テキストメッセージの場合はそのまま保存
      noteContent = content;
    } else if (imageUri) {
      // 画像メッセージの場合はBase64エンコードで永続的に保存
      
      if (imageUri.startsWith('data:')) {
        // すでにBase64の場合はそのまま使用
        noteContent = `![画像](${imageUri})\n\n`;
      } else {
        try {
          // 画像をフェッチしてBase64に変換
          const response = await fetch(imageUri);
          const blob = await response.blob();
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          
          noteContent = `![画像](${base64})\n\n`;
        } catch (fetchError) {
          // フェッチに失敗した場合はエラーメッセージを表示
          console.error('画像のBase64変換に失敗:', fetchError);
          showToast('画像の取得に失敗しました');
          
          // 代替テキストとして元のURLを保存
          noteContent = `[画像リンク](${imageUri})\n\n`;
        }
      }
    }
    
    // ノートストアにメッセージを追加
    const noteId = addNoteFromMessage({
      title: content.slice(0, 30) + (content.length > 30 ? '...' : ''),
      content: noteContent,
      tags: ['チャット'],
      createdAt: new Date().toISOString(),
    });
    
    showToast('ノートに保存しました');
    
    // オプション: ノートエディタに遷移
    // navigation.navigate('Note', { id: noteId });
  } catch (error) {
    console.error('ノート保存エラー:', error);
    showToast('ノートへの保存に失敗しました');
  }
};
```

#### 6.3.3 画像保存機能
```typescript
// 画像保存機能
const handleSaveImage = async () => {
  try {
    // 権限リクエスト
    const { status } = await MediaLibrary.requestPermissionsAsync();
    
    if (status !== 'granted') {
      showToast('写真へのアクセス権限が必要です');
      return;
    }
    
    if (!imageUri) {
      showToast('画像が見つかりません');
      return;
    }
    
    // 画像をダウンロードしてメディアライブラリに保存
    const asset = await MediaLibrary.createAssetAsync(imageUri);
    await MediaLibrary.createAlbumAsync('AI Chat', asset, false);
    
    showToast('画像を保存しました');
  } catch (error) {
    console.error('画像保存エラー:', error);
    showToast('画像の保存に失敗しました');
  }
};
```

#### 6.3.4 共有機能
```typescript
// 共有機能
const handleShare = async () => {
  try {
    if (messageType === 'image' && imageUri) {
      // 画像共有
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(imageUri, {
          mimeType: 'image/jpeg',
          dialogTitle: 'AIチャットの画像を共有',
        });
      } else {
        showToast('共有機能が利用できません');
      }
    } else {
      // テキスト共有
      await Share.share({
        message: content,
        title: 'AIチャットの会話',
      });
    }
  } catch (error) {
    console.error('共有エラー:', error);
    showToast('共有に失敗しました');
  }
};
```

### 6.4 chatStore.tsへの統合

```typescript
// store/chatStore.ts に追加
export interface ChatState {
  // 既存の状態...
  
  // メッセージアクション関連
  selectedMessageId: string | null;
  isActionSheetVisible: boolean;
  
  // アクション
  selectMessage: (messageId: string) => void;
  clearSelectedMessage: () => void;
  copyMessageToClipboard: (content: string) => Promise<void>;
  saveMessageToNote: (messageId: string) => void;
  saveImageToGallery: (imageUri: string) => Promise<void>;
  shareMessage: (content: string, imageUri?: string) => Promise<void>;
}

export const createChatSlice: StateCreator<
  StoreState,
  [],
  [],
  ChatState
> = (set, get) => ({
  // 既存の状態と関数...
  
  // メッセージアクション関連の状態
  selectedMessageId: null,
  isActionSheetVisible: false,
  
  // メッセージ選択
  selectMessage: (messageId) => set({ selectedMessageId: messageId, isActionSheetVisible: true }),
  clearSelectedMessage: () => set({ selectedMessageId: null, isActionSheetVisible: false }),
  
  // 各アクション実装
  copyMessageToClipboard: async (content) => {
    try {
      await Clipboard.setStringAsync(content);
      // 成功通知
    } catch (error) {
      console.error('コピーエラー:', error);
    }
  },
  
  saveMessageToNote: (messageId) => {
    const { chats, activeChat } = get();
    const chat = chats.find(c => c.id === activeChat);
    if (!chat) return;
    
    const message = chat.messages.find(m => m.id === messageId);
    if (!message) return;
    
    // noteStoreのaddNote関数を呼び出し
    const { addNote } = get();
    addNote({
      title: message.content.slice(0, 30) + (message.content.length > 30 ? '...' : ''),
      content: message.type === 'text' ? message.content : `![画像](${message.imageUrl})\n\n`,
      tags: ['チャット'],
      createdAt: new Date().toISOString(),
    });
  },
  
  saveImageToGallery: async (imageUri) => {
    // MediaLibraryを使用した画像保存実装
  },
  
  shareMessage: async (content, imageUri) => {
    // Share APIを使用した共有実装
  },
});
```

### 6.5 UI統合

#### チャットルーム画面への統合
```typescript
// app/chat/[id].tsx に追加
import { MessageActions } from '../../components/MessageActions';

// メッセージレンダリング部分
const renderMessage = ({ item: message }) => (
  <Pressable
    onLongPress={() => handleMessageLongPress(message)}
    delayLongPress={300}
  >
    <MessageBubble
      content={message.content}
      type={message.type}
      sender={message.sender}
      timestamp={message.timestamp}
    />
  </Pressable>
);

// 長押しハンドラ
const handleMessageLongPress = (message) => {
  selectMessage(message.id);
};

// ActionSheet表示
{isActionSheetVisible && selectedMessageId && (
  <MessageActions
    messageId={selectedMessageId}
    messageType={getSelectedMessageType()}
    content={getSelectedMessageContent()}
    imageUri={getSelectedMessageImageUri()}
    onDismiss={clearSelectedMessage}
  />
)}
```

### 6.6 アクセシビリティと多言語対応

- スクリーンリーダー対応: 各アクションボタンに適切な`accessibilityLabel`と`accessibilityHint`を設定
- 多言語対応: アクションシートのテキストをi18nシステムと連携
- ハプティックフィードバック: 長押し時と各アクション実行時に触覚フィードバックを提供

### 6.7 テスト項目

- 各種メッセージタイプ（テキスト/画像）での長押し動作確認
- コピー機能の動作検証（クリップボードへの正確な保存）
- ノート保存機能とノートモジュールの連携確認
- 画像保存時の権限リクエストフロー
- 共有機能のプラットフォーム別動作確認（iOS/Android）
- エラー状態のハンドリングとユーザーへのフィードバック

## 7. ノートモジュール

### 7.1 機能詳細

- **タブ**: *Note* リストページ（ギャラリー/リスト切替）、新規ノートFAB
- **エディタ**: Markdown WYSIWYG（react-native-markdown-editorフォーク）
- **AIアシスト**: 右上「スパークル」ボタン → 編集/Q&A用チャットドロワー（プランクォータ適用）
- **タグオーガナイザー**: Lite+のみ: メニュー → 「タグを整理」
- **ストレージ**: ローカルSQLiteにノート保存（v1ではクラウド同期なし）

### 7.2 プラン別AIモデルとクォータ

| プラン | AIモデル | 制限 | トークン上限 |
|--------|---------|------|------------|
| Free | GPT-4o-mini | 5回/日 | 1,000トークン/回 |
| Lite | GPT-4o | 20回/日 | 2,000トークン/回 |
| Premium | Claude 3.7 Sonnet | 50回/日 | 4,000トークン/回 |

### 7.3 コンポーネント設計

#### 7.3.1 NoteEditor.tsx

```typescript
// components/NoteEditor.tsx
import React, { useState, useRef, useCallback } from 'react';
import { View, TextInput, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, YStack, XStack, Button, ScrollView } from 'tamagui';
import { Sparkles, Save, Tag, ArrowLeft } from '@tamagui/lucide-icons';
import { useTranslation } from 'react-i18next';
import { MarkdownEditor } from 'react-native-markdown-editor';
import { useNoteStore } from '../store/noteStore';
import { useUserStore } from '../store/userStore';
import { NoteAIAssist } from './NoteAIAssist';
import { TagSelector } from './TagSelector';
import { theme } from '../ui/theme';

export const NoteEditor = ({ noteId }: { noteId?: string }) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { currentPlan } = useUserStore();
  const { notes, saveNote, getNote, aiAssistQuotaRemaining } = useNoteStore();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [showAIAssist, setShowAIAssist] = useState(false);
  const [showTagSelector, setShowTagSelector] = useState(false);
  
  const editorRef = useRef(null);
  
  // 既存ノートの読み込み
  React.useEffect(() => {
    if (noteId) {
      const note = getNote(noteId);
      if (note) {
        setTitle(note.title);
        setContent(note.content);
        setTags(note.tags || []);
      }
    }
  }, [noteId, getNote]);
  
  // 保存処理
  const handleSave = useCallback(() => {
    const newNote = {
      id: noteId || `note_${Date.now()}`,
      title: title || t('untitled_note'),
      content,
      tags,
      updatedAt: new Date().toISOString(),
      createdAt: noteId ? getNote(noteId)?.createdAt : new Date().toISOString(),
    };
    
    saveNote(newNote);
    router.back();
  }, [noteId, title, content, tags, saveNote, router, t, getNote]);
  
  // AIアシスト表示
  const toggleAIAssist = useCallback(() => {
    if (!showAIAssist && aiAssistQuotaRemaining <= 0) {
      // クォータ超過時の処理
      return;
    }
    setShowAIAssist(prev => !prev);
  }, [showAIAssist, aiAssistQuotaRemaining]);
  
  // AIアシストからの提案を適用
  const applyAISuggestion = useCallback((suggestion: string) => {
    setContent(prev => prev + suggestion);
  }, []);
  
  return (
    <View style={styles.container}>
      <XStack py="$2" px="$3" alignItems="center" space="$2">
        <Button icon={ArrowLeft} variant="ghost" onPress={() => router.back()} />
        <Text fontSize="$5" fontWeight="bold" flex={1}>{t('edit_note')}</Text>
        <Button 
          icon={Sparkles} 
          variant="ghost" 
          onPress={toggleAIAssist}
          opacity={aiAssistQuotaRemaining > 0 ? 1 : 0.5}
        />
        <Button icon={Save} variant="ghost" onPress={handleSave} />
      </XStack>
      
      <ScrollView style={styles.scrollView}>
        <YStack px="$3" space="$3">
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder={t('note_title')}
            placeholderTextColor={theme.colors.textSecondary}
          />
          
          <MarkdownEditor
            ref={editorRef}
            value={content}
            onChangeText={setContent}
            placeholder={t('start_writing')}
          />
          
          <XStack flexWrap="wrap" gap="$1" mt="$2">
            {tags.map(tag => (
              <Pressable 
                key={tag} 
                style={styles.tagChip}
                onPress={() => currentPlan !== 'FREE' && setShowTagSelector(true)}
              >
                <Text fontSize="$2" color={theme.colors.primary}>#{tag}</Text>
              </Pressable>
            ))}
            
            {currentPlan !== 'FREE' && (
              <Button 
                icon={Tag} 
                size="$2" 
                variant="ghost" 
                onPress={() => setShowTagSelector(true)}
              >
                {t('manage_tags')}
              </Button>
            )}
          </XStack>
        </YStack>
      </ScrollView>
      
      {showAIAssist && (
        <NoteAIAssist
          noteContent={content}
          onClose={() => setShowAIAssist(false)}
          onApplySuggestion={applyAISuggestion}
        />
      )}
      
      {showTagSelector && (
        <TagSelector
          selectedTags={tags}
          onTagsChange={setTags}
          onClose={() => setShowTagSelector(false)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    padding: 0,
    marginVertical: 8,
  },
  tagChip: {
    backgroundColor: theme.colors.primaryLight + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
});
```

#### 7.3.2 NoteAIAssist.tsx

```typescript
// components/NoteAIAssist.tsx
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Text, YStack, XStack, Button, ScrollView } from 'tamagui';
import { X, Send } from '@tamagui/lucide-icons';
import { useTranslation } from 'react-i18next';
import { useNoteStore } from '../store/noteStore';
import { useUserStore } from '../store/userStore';
import { theme } from '../ui/theme';
import { generateAIAssist } from '../services/api';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export const NoteAIAssist = ({
  noteContent,
  onClose,
  onApplySuggestion,
}: {
  noteContent: string;
  onClose: () => void;
  onApplySuggestion: (suggestion: string) => void;
}) => {
  const { t } = useTranslation();
  const { currentPlan, userQuota } = useUserStore();
  const { decrementAIAssistQuota, aiAssistQuotaRemaining } = useNoteStore();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // AIモデル選択（プラン別）
  const getAIModel = useCallback(() => {
    switch (currentPlan) {
      case 'PREMIUM':
        return 'claude-3-7-sonnet';
      case 'LITE':
        return 'gpt-4o';
      default:
        return 'gpt-4o-mini';
    }
  }, [currentPlan]);
  
  // メッセージ送信処理
  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading || aiAssistQuotaRemaining <= 0) return;
    
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: input,
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    try {
      // コンテキスト付きでAIに問い合わせ
      const context = noteContent ? `以下はノートの内容です:\n${noteContent}\n\n` : '';
      const response = await generateAIAssist({
        messages: [...messages, userMessage].map(m => ({ role: m.role, content: m.content })),
        context,
        model: getAIModel(),
      });
      
      const assistantMessage: Message = {
        id: `msg_${Date.now() + 1}`,
        role: 'assistant',
        content: response,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      decrementAIAssistQuota();
    } catch (error) {
      // エラー処理
      console.error('AI Assist error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, messages, noteContent, getAIModel, decrementAIAssistQuota, aiAssistQuotaRemaining]);
  
  // 提案を適用
  const handleApplySuggestion = useCallback((content: string) => {
    onApplySuggestion(content);
  }, [onApplySuggestion]);
  
  // トークン上限（プラン別）
  const getTokenLimit = useCallback(() => {
    switch (currentPlan) {
      case 'PREMIUM':
        return 4000;
      case 'LITE':
        return 2000;
      default:
        return 1000;
    }
  }, [currentPlan]);
  
  return (
    <View style={styles.container}>
      <XStack py="$2" px="$3" alignItems="center" justifyContent="space-between">
        <Text fontSize="$4" fontWeight="bold">
          {t('ai_assist')} ({aiAssistQuotaRemaining}/{userQuota.aiAssists})
        </Text>
        <Button icon={X} variant="ghost" circular onPress={onClose} />
      </XStack>
      
      <ScrollView style={styles.messagesContainer}>
        {messages.length === 0 ? (
          <YStack p="$4" alignItems="center" space="$2">
            <Text fontSize="$3" textAlign="center" color={theme.colors.textSecondary}>
              {t('ai_assist_prompt')}
            </Text>
          </YStack>
        ) : (
          <YStack space="$3" p="$3">
            {messages.map(message => (
              <View 
                key={message.id} 
                style={[
                  styles.messageBubble,
                  message.role === 'user' ? styles.userBubble : styles.assistantBubble
                ]}
              >
                <Text>{message.content}</Text>
                {message.role === 'assistant' && (
                  <Button 
                    size="$2" 
                    mt="$2" 
                    variant="outlined"
                    onPress={() => handleApplySuggestion(message.content)}
                  >
                    {t('apply_to_note')}
                  </Button>
                )}
              </View>
            ))}
            {isLoading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={theme.colors.primary} />
              </View>
            )}
          </YStack>
        )}
      </ScrollView>
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={80}
      >
        <XStack p="$3" alignItems="center" space="$2" backgroundColor={theme.colors.card}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={t('ask_ai_assistant')}
            placeholderTextColor={theme.colors.textSecondary}
            multiline
            maxLength={getTokenLimit()}
            editable={aiAssistQuotaRemaining > 0}
          />
          <Button
            icon={Send}
            circular
            variant="primary"
            onPress={sendMessage}
            disabled={!input.trim() || isLoading || aiAssistQuotaRemaining <= 0}
            opacity={!input.trim() || aiAssistQuotaRemaining <= 0 ? 0.5 : 1}
          />
        </XStack>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  messagesContainer: {
    flex: 1,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    maxWidth: '85%',
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: theme.colors.primaryLight + '30',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.card,
    borderBottomLeftRadius: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 12,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.inputBackground,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    color: theme.colors.text,
  },
});
```

#### 7.3.3 TagSelector.tsx

```typescript
// components/TagSelector.tsx
import React, { useState, useCallback } from 'react';
import { View, StyleSheet, TextInput, FlatList } from 'react-native';
import { Text, YStack, XStack, Button, Checkbox } from 'tamagui';
import { X, Plus, Trash } from '@tamagui/lucide-icons';
import { useTranslation } from 'react-i18next';
import { useNoteStore } from '../store/noteStore';
import { theme } from '../ui/theme';

export const TagSelector = ({
  selectedTags,
  onTagsChange,
  onClose,
}: {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const { allTags, addTag, removeTag } = useNoteStore();
  
  const [newTag, setNewTag] = useState('');
  
  // タグ選択処理
  const toggleTag = useCallback((tag: string) => {
    if (selectedTags.includes(tag)) {
      onTagsChange(selectedTags.filter(t => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  }, [selectedTags, onTagsChange]);
  
  // 新規タグ追加
  const handleAddTag = useCallback(() => {
    if (!newTag.trim() || allTags.includes(newTag.trim())) return;
    
    addTag(newTag.trim());
    onTagsChange([...selectedTags, newTag.trim()]);
    setNewTag('');
  }, [newTag, allTags, addTag, selectedTags, onTagsChange]);
  
  // タグ削除
  const handleRemoveTag = useCallback((tag: string) => {
    removeTag(tag);
    onTagsChange(selectedTags.filter(t => t !== tag));
  }, [removeTag, selectedTags, onTagsChange]);
  
  return (
    <View style={styles.container}>
      <XStack py="$2" px="$3" alignItems="center" justifyContent="space-between">
        <Text fontSize="$4" fontWeight="bold">{t('manage_tags')}</Text>
        <Button icon={X} variant="ghost" circular onPress={onClose} />
      </XStack>
      
      <XStack px="$3" py="$2" space="$2">
        <TextInput
          style={styles.input}
          value={newTag}
          onChangeText={setNewTag}
          placeholder={t('new_tag')}
          placeholderTextColor={theme.colors.textSecondary}
        />
        <Button
          icon={Plus}
          variant="primary"
          onPress={handleAddTag}
          disabled={!newTag.trim() || allTags.includes(newTag.trim())}
        />
      </XStack>
      
      <FlatList
        data={allTags}
        keyExtractor={item => item}
        renderItem={({ item }) => (
          <XStack px="$3" py="$2" alignItems="center" justifyContent="space-between">
            <XStack space="$2" alignItems="center" flex={1}>
              <Checkbox
                checked={selectedTags.includes(item)}
                onCheckedChange={() => toggleTag(item)}
              />
              <Text fontSize="$3">#{item}</Text>
            </XStack>
            <Button
              icon={Trash}
              variant="ghost"
              size="$2"
              onPress={() => handleRemoveTag(item)}
            />
          </XStack>
        )}
        ListEmptyComponent={
          <YStack p="$4" alignItems="center">
            <Text color={theme.colors.textSecondary}>{t('no_tags')}</Text>
          </YStack>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.background,
    zIndex: 100,
  },
  input: {
    flex: 1,
    backgroundColor: theme.colors.inputBackground,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: theme.colors.text,
  },
});
```

### 7.4 状態管理（noteStore.ts）

```typescript
// store/noteStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUserStore } from './userStore';

export type Note = {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
};

type NoteStore = {
  notes: Note[];
  allTags: string[];
  aiAssistUsage: {
    date: string;
    count: number;
  };
  
  // ノート操作
  saveNote: (note: Note) => void;
  getNote: (id: string) => Note | undefined;
  deleteNote: (id: string) => void;
  
  // タグ操作
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;
  
  // AIアシスト使用量
  aiAssistQuotaRemaining: number;
  decrementAIAssistQuota: () => void;
  resetDailyAIAssistQuota: () => void;
};

export const useNoteStore = create<NoteStore>()(
  persist(
    (set, get) => {
      // 日付チェック（日次クォータリセット用）
      const checkAndResetDailyQuota = () => {
        const today = new Date().toISOString().split('T')[0];
        const { aiAssistUsage } = get();
        
        if (aiAssistUsage.date !== today) {
          set({
            aiAssistUsage: {
              date: today,
              count: 0,
            },
          });
        }
      };
      
      return {
        notes: [],
        allTags: [],
        aiAssistUsage: {
          date: new Date().toISOString().split('T')[0],
          count: 0,
        },
        
        // ノート操作
        saveNote: (note) => {
          set((state) => {
            const existingIndex = state.notes.findIndex(n => n.id === note.id);
            
            if (existingIndex >= 0) {
              // 既存ノート更新
              const updatedNotes = [...state.notes];
              updatedNotes[existingIndex] = note;
              return { notes: updatedNotes };
            } else {
              // 新規ノート追加
              return { notes: [note, ...state.notes] };
            }
          });
        },
        
        getNote: (id) => {
          return get().notes.find(note => note.id === id);
        },
        
        deleteNote: (id) => {
          set((state) => ({
            notes: state.notes.filter(note => note.id !== id),
          }));
        },
        
        // タグ操作
        addTag: (tag) => {
          set((state) => {
            if (state.allTags.includes(tag)) return state;
            return { allTags: [...state.allTags, tag] };
          });
        },
        
        removeTag: (tag) => {
          set((state) => ({
            allTags: state.allTags.filter(t => t !== tag),
            notes: state.notes.map(note => ({
              ...note,
              tags: note.tags?.filter(t => t !== tag) || [],
            })),
          }));
        },
        
        // AIアシスト使用量
        get aiAssistQuotaRemaining() {
          checkAndResetDailyQuota();
          
          const { currentPlan } = useUserStore.getState();
          const { aiAssistUsage } = get();
          
          // プラン別クォータ
          const quotaLimits = {
            FREE: 5,
            LITE: 20,
            PREMIUM: 50,
          };
          
          const limit = quotaLimits[currentPlan] || quotaLimits.FREE;
          return Math.max(0, limit - aiAssistUsage.count);
        },
        
        decrementAIAssistQuota: () => {
          checkAndResetDailyQuota();
          
          set((state) => ({
            aiAssistUsage: {
              ...state.aiAssistUsage,
              count: state.aiAssistUsage.count + 1,
            },
          }));
        },
        
        resetDailyAIAssistQuota: () => {
          const today = new Date().toISOString().split('T')[0];
          
          set({
            aiAssistUsage: {
              date: today,
              count: 0,
            },
          });
        },
      };
    },
    {
      name: 'note-storage',
      getStorage: () => AsyncStorage,
    }
  )
);
```

### 7.5 API統合（api.ts）

```typescript
// services/api.ts に追加
export const generateAIAssist = async ({
  messages,
  context,
  model,
}: {
  messages: { role: string; content: string }[];
  context?: string;
  model: string;
}): Promise<string> => {
  try {
    // システムプロンプト（コンテキスト付き）
    const systemPrompt = context
      ? `あなたはノート編集のアシスタントです。以下のノート内容を参考に、ユーザーの質問に答えたり、編集の提案をしたりしてください。\n\n${context}`
      : 'あなたはノート編集のアシスタントです。ユーザーの質問に答えたり、編集の提案をしたりしてください。';
    
    // APIリクエスト
    const response = await fetch(`${API_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await getApiKey(model.includes('claude') ? 'anthropic' : 'openai')}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
        max_tokens: model.includes('claude') ? 4000 : (model.includes('gpt-4o-mini') ? 1000 : 2000),
        temperature: 0.7,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'AIアシストの生成に失敗しました');
    }
    
    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error: any) {
    console.error('AI Assist error:', error);
    throw new Error(error.message || 'AIアシストの生成に失敗しました');
  }
};
```

### 7.6 UI/UX設計

#### 7.6.1 インタラクションデザイン

- **スワイプジェスチャー**:
  - 左スワイプ: アクションメニュー表示（共有・削除・タグ編集）
  - 右スワイプ: タグフィルター表示
  - ピンチズーム: 画像の拡大/縮小（エディタ内）

- **タップ操作**:
  - シングルタップ: 項目選択、編集モード切替
  - ダブルタップ: 段落選択（エディタ内）
  - 長押し: コンテキストメニュー表示（コピー・切り取り・書式設定）

- **ハプティックフィードバック**:
  - 保存完了時: 軽い振動
  - エラー発生時: 強い振動パターン
  - AIアシスト提案適用時: 成功パターン振動

#### 7.6.2 視覚的階層

- **カラーコード化**:
  - タグ別カラーチップ（最大8色）
  - 重要度マーカー（任意設定可能）
  - 最終編集日時による色の濃淡表現（新しいほど濃く）

- **カード表示**:
  - 優先度によるカードサイズ変更（重要=大きく）
  - 内容プレビュー量の調整（設定可能）
  - 画像サムネイル表示（最大3枚）

- **タイポグラフィ**:
  - 見出しレベルによる明確な視覚的区別
  - 引用・コードブロックの特別スタイリング
  - 読みやすさ重視のフォントサイズ自動調整

#### 7.6.3 アニメーションとトランジション

- **AIアシスト呼び出し**:
  - スパークルエフェクトからドロワー展開
  - 思考中インジケーター（波形アニメーション）
  - 回答生成時のタイピングエフェクト

- **状態変化**:
  - 保存完了時のチェックマークアニメーション
  - エラー時の警告シェイク
  - ドラッグ&ドロップ時の物理的な動きの模倣

- **画面遷移**:
  - リスト→エディタへの自然なズームイン
  - タグフィルター適用時のスムーズな並べ替え
  - モード切替時の適切なクロスフェード

#### 7.6.4 アクセシビリティと多言語対応

- **スクリーンリーダー最適化**:
  - すべての操作要素に適切なラベル付け
  - 画像の代替テキスト自動提案
  - 階層構造の明確なナビゲーション

- **カラーコントラスト**:
  - WCAG AAA基準準拠（4.5:1以上）
  - ダークモード最適化コントラスト
  - カラーブラインドモード（色覚特性対応）

- **入力支援**:
  - 音声入力対応（ノート作成・編集）
  - 音声読み上げ（ノート内容）
  - 自動補完と予測入力

#### 7.6.5 ノートリスト画面

- **表示モード**: ギャラリー（グリッド）/ リスト切替
- **ソート**: 更新日時 / 作成日時 / タイトル
- **フィルタ**: タグ選択（Lite+のみ）
- **検索**: タイトル・内容全文検索
- **新規作成**: 右下FAB（長押しでテンプレート選択）

#### 7.6.6 ノートエディタ画面

- **ヘッダー**: 戻る / タイトル / AIアシスト / 保存
- **エディタ**: Markdown WYSIWYG（太字・斜体・リスト・見出し・リンク・画像）
- **画像挿入**: ドラッグ&ドロップ / ギャラリー選択 / カメラ直接撮影
- **タグ**: 下部にタグチップ表示、タグ管理ボタン（Lite+のみ）
- **フォーマットバー**: 書式設定ツールバー（スクロールで追加オプション）

#### 7.6.7 AIアシストドロワー

- **ヘッダー**: タイトル / 残りクォータ表示 / 閉じるボタン
- **チャットUI**: ユーザー・AIメッセージバブル（長押しでアクション）
- **適用ボタン**: AIレスポンスに「ノートに適用」ボタン（部分適用オプション）
- **入力欄**: マルチラインテキスト入力 / 送信ボタン / プロンプトテンプレート
- **モデル表示**: 現在使用中のAIモデル名とプラン表示

### 7.7 テスト項目

- **ノート作成・編集**: タイトル・内容保存、Markdown変換
- **AIアシスト**: プラン別モデル動作、クォータ制限、レスポンス適用
- **タグ管理**: 追加・削除・選択、フィルタリング（Lite+）
- **UI/UX**: レスポンシブレイアウト、ダークモード対応
- **パフォーマンス**: 大量ノート時のリスト表示、検索速度
- **エラー処理**: API障害時のフォールバック、オフライン動作

## 8. 実装タイムライン

| タスク | 担当 | 期限 |
|--------|------|------|
| UIパディング & テーマリファクタ | FE | **T+3d** |
| クォータHUD & 警告バナー | FE | **T+5d** |
| ローカルモデルインストーラー | BE | **T+7d** |
| チャットコピー/共有フック | FE | **T+7d** |
| 画像タブ & トグル | FE | **T+10d** |
| ノートモジュールMVP | FE/BE | **T+12d** |
| プラン対応クォータエンドツーエンド | FE/BE | **T+14d** |

## 9. 実装方針

### 9.1 ファイル構成

- **新規ファイル**:
  - `ui/theme.ts` - 統一テーマ定義
  - `components/LocalModelStatusBadge.tsx` - ローカルモデルステータス表示
  - `components/QuotaWarningBanner.tsx` - クォータ警告バナー
  - `components/MessageActions.tsx` - メッセージアクション
  - `components/ImageGenerationPanel.tsx` - 画像生成パネル
  - `components/NoteEditor.tsx` - ノートエディタ
  - `store/imageStore.ts` - 画像状態管理
  - `store/noteStore.ts` - ノート状態管理

- **更新ファイル**:
  - `store/index.ts` - 新規ストアスライス統合
  - `store/userStore.ts` - プラン・クォータ管理
  - `store/chatStore.ts` - メッセージアクション機能
  - `store/localModelStore.ts` - ローカルモデル管理強化
  - `constants/models.ts` - モデル定義更新
  - `services/api.ts` - APIキー管理、クォータ適用

### 9.2 テスト項目

- **ローカルモデルインストール**: DL中断→再開、容量不足警告、チェックサム検証
- **ModelSelectバッジ**: 状態遷移の色、エラー表示
- **クォータ管理**: プラン別制限、フォールバック、警告表示
- **画像生成**: SDXL/DALL-E生成、プラン制限、エラー処理
- **メッセージアクション**: コピー、共有、ノート保存、画像保存
- **ノートAIアシスト**: プラン別クォータ、AIレスポンス
- **APIキー管理**: 発行、ローテーション、エラー処理
- **UI一貫性**: パディング統一、スタイル集中化

## 10. 成果物

- DB移行、更新されたExpoコード、`/docs/ARCHITECTURE.md`
- 各マイルストーン完了後の進捗報告
