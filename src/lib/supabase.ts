import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Remove any trailing slashes from the URL
const cleanSupabaseUrl = supabaseUrl.replace(/\/$/, '');

export const supabase = createClient<Database>(cleanSupabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'X-Client-Info': 'supabase-js/2.39.3',
      'X-Client-Name': 'storymode-website',
    },
  },
});