import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient<Database>;
let supabaseAdmin: SupabaseClient<Database>;

// Store references for checking if clients are initialized
let isSupabaseInitialized = false;
let isSupabaseAdminInitialized = false;

function initializeClients() {
  try {
    // Only initialize once
    if (!isSupabaseInitialized) {
      // Validate required environment variables
      const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
      const supabaseServiceRole = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error(
          'Missing required Supabase environment variables: PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY must be set'
        );
      }

      // Initialize regular client
      supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false,
        },
      });
      isSupabaseInitialized = true;

      // Initialize admin client if service role key is available
      if (supabaseServiceRole) {
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
        isSupabaseAdminInitialized = true;
      } else {
        console.warn('SUPABASE_SERVICE_ROLE_KEY not found. Admin functionality will be limited.');
        supabaseAdmin = supabase; // Fallback to regular client
      }
    }
  } catch (error) {
    console.error('Error initializing Supabase clients:', error);
    throw error;
  }
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
 * Ensures clients are initialized before use
 */
export function getClient(context: ClientContext = {}): SupabaseClient<Database> {
  if (!isSupabaseInitialized) {
    initializeClients();
  }

  if (requiresAdminClient(context) && !isSupabaseAdminInitialized) {
    throw new Error('Admin client requested but not initialized. Check SUPABASE_SERVICE_ROLE_KEY.');
  }

  return requiresAdminClient(context) ? supabaseAdmin : supabase;
}

// Initialize clients on import
initializeClients();

export { supabase, supabaseAdmin };