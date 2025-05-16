import { AuthClient } from '@supabase/auth-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import 'react-native-url-polyfill/auto';

const SUPABASE_URL = 'https://alperyqhdtpnivxfnqdi.supabase.co/auth/v1';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFscGVyeXFoZHRwbml2eGZucWRpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4MDc5OTcsImV4cCI6MjA2MjM4Mzk5N30.0gTXgFtD2uIhGdSB4twConRJPF_0Ccz5zePqa0hD8B0';

export const authClient = new AuthClient({
  url: SUPABASE_URL,
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