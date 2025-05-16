// 簡易的なローカライゼーション機能
import { Platform, NativeModules } from 'react-native';

// 言語の検出（実際のアプリではデバイス設定に基づいて動的に変更）
const getLocale = (): string => {
  // 今回はデフォルトで日本語を使用
  return 'ja';
};

// 翻訳リソース
const resources: Record<string, Record<string, string>> = {
  ja: {
    'quota.types.tokens': 'トークン',
    'quota.types.images': '画像生成',
    'quota.types.aiAssist': 'AIアシスト',
    'quota.types.default': 'クォータ',
    'quota.message.empty': '{quota}の月間クォータを使い切りました。プランをアップグレードするか、来月まで待ってください。',
    'quota.message.remaining': '{quota}の月間クォータが残り{percent}%です。プランをアップグレードして制限を増やしましょう。',
    'quota.action.upgrade': 'プランをアップグレード',
    
    // 検索関連の翻訳
    'search.placeholder': '検索...',
    'search.cancel': 'キャンセル',
    'search.clearInput': '検索をクリア',
    'search.cancelSearch': '検索をキャンセル',
    
    // ヘッダー関連の翻訳
    'header.backButton': '戻る',
    'header.modelSelection': 'モデル選択'
  }
};

// 変数置換関数
const replaceVariables = (text: string, variables: Record<string, string | number>): string => {
  return Object.entries(variables).reduce((result, [key, value]) => {
    return result.replace(new RegExp(`{${key}}`, 'g'), String(value));
  }, text);
};

/**
 * 指定されたキーに対応する翻訳を取得
 * @param key 翻訳キー
 * @param fallback キーが見つからない場合のフォールバックテキスト
 * @param variables 置換変数
 */
export function t(key: string, fallback?: string, variables?: Record<string, string | number>): string {
  const locale = getLocale();
  const localeResources = resources[locale] || {};
  let text = localeResources[key] || fallback || key;
  
  if (variables) {
    text = replaceVariables(text, variables);
  }
  
  return text;
} 