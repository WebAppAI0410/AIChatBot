/**
 * モデル別プロンプトテンプレート定義
 */

/**
 * Qwen3シリーズ用のプロンプトテンプレート
 * <|im_start|>/<|im_end|>形式のトークンを使用
 */
export const QWEN3_TEMPLATE = `<|im_start|>system
{system_message}
<|im_end|>
{chat_history}
<|im_start|>user
{prompt}
<|im_end|>
<|im_start|>assistant
`;

/**
 * Qwen3のサンプリングパラメータ推奨値
 */
export const QWEN3_SAMPLING = {
  temperature: 0.7,    // 生成の多様性
  top_p: 0.9,          // 出力トークン選択の確率閾値  
  top_k: 40,           // 考慮する最大トークン数
  repeat_penalty: 1.1, // 繰り返しを抑制する係数
  max_tokens: 1024     // 最大生成トークン数
};

/**
 * 汎用的なChatMLフォーマット
 */
export const CHATML_TEMPLATE = `<|im_start|>system
{system_message}
<|im_end|>
{chat_history}
<|im_start|>user
{prompt}
<|im_end|>
<|im_start|>assistant
`;

/**
 * モデル固有のユーザープロンプトをフォーマットする関数
 * @param template テンプレート文字列
 * @param systemMessage システムメッセージ
 * @param chatHistory チャット履歴
 * @param userPrompt ユーザープロンプト
 * @returns フォーマット済みプロンプト
 */
export const formatPrompt = (
  template: string,
  systemMessage: string,
  chatHistory: { role: 'user' | 'assistant', content: string }[],
  userPrompt: string
): string => {
  // チャット履歴をフォーマット
  const formattedHistory = chatHistory.map(msg => {
    return `<|im_start|>${msg.role}\n${msg.content}\n<|im_end|>`;
  }).join('\n');
  
  // テンプレート内のプレースホルダーを置換
  return template
    .replace('{system_message}', systemMessage)
    .replace('{chat_history}', formattedHistory)
    .replace('{prompt}', userPrompt);
}; 