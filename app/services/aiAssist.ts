export interface AIAssistRequest {
  text: string;
  action: 'correct' | 'summarize' | 'translate' | 'improve' | 'expand';
  targetLanguage?: string;
  customPrompt?: string;
}

export interface AIAssistResponse {
  success: boolean;
  result?: string;
  error?: string;
  usage?: {
    tokens: number;
    cost?: number;
  };
}

class AIAssistService {
  private baseUrl = 'https://sywokupckgoqmimyiecb.supabase.co/functions/v1/openrouter-proxy';
  
  /**
   * Supabase Edge Function経由でOpenRouter APIリクエストを送信
   */
  private async makeRequest(prompt: string, model: string, maxTokens: number = 1000): Promise<AIAssistResponse> {
    try {
      console.log(`[AIAssist] 使用モデル: ${model}`); // デバッグログ
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: prompt
            }
          ],
          model: model,
          max_tokens: maxTokens,
          temperature: 0.7,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          error: `API エラー: ${errorData.error || response.statusText}`
        };
      }

      const data = await response.json();
      
      if (!data.choices || data.choices.length === 0) {
        return {
          success: false,
          error: 'AIからの応答が空でした'
        };
      }

      return {
        success: true,
        result: data.choices[0].message.content.trim(),
        usage: {
          tokens: data.usage?.total_tokens || 0,
          cost: data.usage?.total_cost || 0
        }
      };
    } catch (error) {
      console.error('AI Assist API Error:', error);
      return {
        success: false,
        error: `ネットワークエラー: ${error instanceof Error ? error.message : '不明なエラー'}`
      };
    }
  }

  /**
   * プランに応じたモデルを取得
   */
  private getModelForPlan(plan: string): string {
    switch (plan) {
      case 'premium':
        return 'anthropic/claude-3-sonnet-20240229';
      case 'lite':
        return 'openai/gpt-4o';
      case 'free':
      default:
        return 'openai/gpt-4o-mini';
    }
  }

  /**
   * テキスト校正
   */
  async correctText(text: string, customPrompt?: string, modelId?: string): Promise<AIAssistResponse> {
    const model = modelId || this.getModelForPlan('free');
    
    const prompt = customPrompt || `以下のテキストを自然で読みやすい日本語に校正してください。文法の間違い、表現の改善、敬語の適切な使用などを修正し、より良い文章にしてください。元の意味は変えずに、文章の流れと読みやすさを向上させてください。

校正対象のテキスト:
${text}

校正後のテキストのみを返してください。説明は不要です。`;

    return this.makeRequest(prompt, model, 1500);
  }

  /**
   * テキスト要約
   */
  async summarizeText(text: string, modelId?: string): Promise<AIAssistResponse> {
    const model = modelId || this.getModelForPlan('free');
    
    const prompt = `以下のテキストを簡潔に要約してください。重要なポイントを3-5個の箇条書きでまとめ、読者が内容の全体像を素早く理解できるようにしてください。

要約対象のテキスト:
${text}

要約（箇条書き形式）:`;

    return this.makeRequest(prompt, model, 800);
  }

  /**
   * テキスト翻訳
   */
  async translateText(text: string, targetLanguage: string = 'English', modelId?: string): Promise<AIAssistResponse> {
    const model = modelId || this.getModelForPlan('free');
    
    const prompt = `以下のテキストを${targetLanguage}に翻訳してください。自然で流暢な翻訳を心がけ、文脈に応じて適切な表現を使用してください。

翻訳対象のテキスト:
${text}

翻訳結果（${targetLanguage}）:`;

    return this.makeRequest(prompt, model, 1200);
  }

  /**
   * テキスト改善
   */
  async improveText(text: string, modelId?: string): Promise<AIAssistResponse> {
    const model = modelId || this.getModelForPlan('free');
    
    const prompt = `以下のテキストを改善してください。より魅力的で説得力があり、読みやすい文章にしてください。専門用語の説明を追加したり、具体例を入れたり、論理的な流れを改善したりして、全体的な文章のクオリティを向上させてください。

改善対象のテキスト:
${text}

改善後のテキスト:`;

    return this.makeRequest(prompt, model, 2000);
  }

  /**
   * テキスト拡張
   */
  async expandText(text: string, modelId?: string): Promise<AIAssistResponse> {
    const model = modelId || this.getModelForPlan('free');
    
    const prompt = `以下の短いテキストを詳細に拡張してください。背景情報、具体例、詳しい説明を追加して、より包括的で情報豊富な内容にしてください。元の意図を保ちながら、読者にとってより価値のある内容に拡張してください。

拡張対象のテキスト:
${text}

拡張後のテキスト:`;

    return this.makeRequest(prompt, model, 2500);
  }

  /**
   * カスタムプロンプトでのテキスト処理
   */
  async processWithCustomPrompt(text: string, customPrompt: string, modelId?: string): Promise<AIAssistResponse> {
    // モデルIDが指定されている場合はそれを使用、そうでなければプランベースのデフォルト
    const model = modelId || this.getModelForPlan('free');
    
    const prompt = `${customPrompt}

対象のテキスト:
${text}`;

    return this.makeRequest(prompt, model, 2000);
  }

  /**
   * 一般的なAIアシスト処理
   */
  async processText(request: AIAssistRequest & { modelId?: string }): Promise<AIAssistResponse> {
    switch (request.action) {
      case 'correct':
        return this.correctText(request.text, request.customPrompt, request.modelId);
      case 'summarize':
        return this.summarizeText(request.text, request.modelId);
      case 'translate':
        return this.translateText(request.text, request.targetLanguage, request.modelId);
      case 'improve':
        return this.improveText(request.text, request.modelId);
      case 'expand':
        return this.expandText(request.text, request.modelId);
      default:
        return {
          success: false,
          error: 'サポートされていないアクションです'
        };
    }
  }
}

export const aiAssistService = new AIAssistService(); 