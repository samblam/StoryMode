import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRole = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

console.log("supabase.ts - Initializing...");

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('supabase.ts - Missing Supabase environment variables:', {supabaseUrl, supabaseAnonKey});
    throw new Error(
    'Missing Supabase environment variables. Please check your .env file.'
  );
}

// Public client for general usage
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

// Admin client with service role key for privileged operations
let supabaseAdmin;

// Only create supabaseAdmin client on the server
if (import.meta.env.SSR){
  supabaseAdmin = createClient<Database>(
      supabaseUrl,
      supabaseServiceRole,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  );
}
export { supabaseAdmin };


console.log("supabase.ts - Initialization complete");