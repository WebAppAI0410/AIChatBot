import { AuthClient } from '@supabase/auth-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';
import Constants from 'expo-constants';

// app.config.jsから環境変数を取得
const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl;
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.supabaseAnonKey;

// 環境変数の値を検証
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Supabase環境変数が設定されていません。app.config.jsを確認してください。');
}

export const authClient = new AuthClient({
  url: `${SUPABASE_URL}/auth/v1`,
  headers: {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  },
  storage: AsyncStorage,
  autoRefreshToken: true,
  persistSession: true,
  detectSessionInUrl: false,
});

export default authClient; 