import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

// Singleton instances
let supabaseInstance: SupabaseClient<Database> | null = null;

// Initialize regular client
function getSupabaseClient(): SupabaseClient<Database> {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing required Supabase environment variables: PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY must be set');
  }

  supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return supabaseInstance;
}

// Initialize admin client
function getSupabaseAdminClient(): SupabaseClient<Database> {
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseServiceRole = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseServiceRole) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set. Admin client cannot be created.');
  }

  return createClient<Database>(
    supabaseUrl,
    supabaseServiceRole,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

/**
 * Type definition for client usage contexts
 */
export type ClientContext = {
  requiresAdmin?: boolean;
  bypassRLS?: boolean;
};

/**
 * Determines if admin client should be used based on context
 */
export function requiresAdminClient(context: ClientContext): boolean {
  return Boolean(context.requiresAdmin || context.bypassRLS);
}

/**
 * Gets the appropriate client based on context
 */
export function getClient(context: ClientContext = {}): SupabaseClient<Database> {
  return requiresAdminClient(context) ? getSupabaseAdminClient() : getSupabaseClient();
}

// Export a default client instance for convenience
export const supabase = getSupabaseClient();