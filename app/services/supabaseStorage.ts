import { StorageClient } from '@supabase/storage-js';
import Constants from 'expo-constants';

// app.config.js から環境変数を取得
const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl;
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.supabaseAnonKey;

// 環境変数の値を検証
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase環境変数が設定されていません。app.config.jsを確認してください。');
}

// StorageClientの初期化
export const storageClient = new StorageClient(`${SUPABASE_URL}/storage/v1`, {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
});

export default storageClient; 