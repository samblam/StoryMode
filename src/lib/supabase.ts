import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// Load environment variables
const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase public environment variables');
}

if (!supabaseServiceRole) {
  console.warn('Warning: SUPABASE_SERVICE_ROLE_KEY not found. Some admin operations may be limited.');
}

/**
 * Public client for general usage
 * - Use for all regular database operations
 * - Subject to Row Level Security (RLS) policies
 * - Should be used for most operations
 */
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});

// Test connection
(async () => {
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .limit(1);
      
    if (error) {
      console.error('Supabase connection error:', error);
    } else {
      console.log('Supabase connection successful:', data);
    }
  } catch (error) {
    console.error('Supabase connection failed:', error);
  }
})();

/**
 * Admin client with service role key for privileged operations
 * - Use only when RLS policies would prevent necessary access
 * - Should be used sparingly and only when absolutely necessary
 * - Bypasses RLS policies - use with caution
 */
export const supabaseAdmin = createClient<Database>(
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

/**
 * Type definition for client usage contexts
 */
export type ClientContext = {
  requiresAdmin?: boolean;
  bypassRLS?: boolean;
};

/**
 * Determines if admin client should be used based on context
 * @param context - Client usage context
 * @returns boolean indicating if admin client is required
 */
export function requiresAdminClient(context: ClientContext): boolean {
  return Boolean(context.requiresAdmin || context.bypassRLS);
}

/**
 * Gets the appropriate client based on context
 * @param context - Client usage context
 * @returns Either supabase or supabaseAdmin client
 */
export function getClient(context: ClientContext = {}) {
  return requiresAdminClient(context) ? supabaseAdmin : supabase;
}
