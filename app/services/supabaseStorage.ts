import { StorageClient } from '@supabase/storage-js';

// Supabaseプロジェクト情報
const SUPABASE_URL = 'https://alperyqhdtpnivxfnqdi.supabase.co';
// 匿名キーを使用（サービスキーはクライアントサイドでは使わない）
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFscGVyeXFoZHRwbml2eGZucWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MDc5OTcsImV4cCI6MjA2MjM4Mzk5N30.0gTXgFtD2uIhGdSB4twConRJPF_0Ccz5zePqa0hD8B0';

// StorageClientの初期化
export const storageClient = new StorageClient(`${SUPABASE_URL}/storage/v1`, {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
});

export default storageClient; 