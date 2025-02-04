import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

// Singleton instances
let supabaseInstance: SupabaseClient<Database> | null = null;
let supabaseAdminInstance: SupabaseClient<Database> | null = null;

// Initialize regular client
function getSupabaseClient(): SupabaseClient<Database> {
  console.log('Initializing regular Supabase client'); // Added log
  if (supabaseInstance) {
    console.log('Regular Supabase client instance already exists, returning cached instance'); // Added log
    return supabaseInstance;
  }

  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

  console.log('Supabase URL:', supabaseUrl); // Added log
  console.log('Supabase Anon Key:', supabaseAnonKey); // Added log

  if (!supabaseUrl || !supabaseAnonKey) {
    const errorMessage = 'Missing required Supabase environment variables: PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY must be set';
    console.error(errorMessage); // Added log
    throw new Error(errorMessage);
  }

  try {
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'sb-token',
        storage: {
          getItem: (key) => {
            if (typeof window !== 'undefined') {
              return window.localStorage.getItem(key);
            }
            return null;
          },
          setItem: (key, value) => {
            if (typeof window !== 'undefined') {
              window.localStorage.setItem(key, value);
            }
          },
          removeItem: (key) => {
            if (typeof window !== 'undefined') {
              window.localStorage.removeItem(key);
            }
          },
        },
      }
    });

    // Disable realtime subscription features
    supabaseInstance.realtime.disconnect();
    console.log('Regular Supabase client initialized successfully'); // Added log
  } catch (error) {
    console.error('Error initializing regular Supabase client:', error); // Added log
    throw error;
  }

  return supabaseInstance;
}

// Initialize admin client
function getSupabaseAdminClient(): SupabaseClient<Database> {
  console.log('Initializing admin Supabase client'); // Added log
  if (supabaseAdminInstance) {
    console.log('Admin Supabase client instance already exists, returning cached instance'); // Added log
    return supabaseAdminInstance;
  }

  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseServiceRole = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('Supabase URL:', supabaseUrl); // Added log
  console.log('Supabase Service Role Key:', supabaseServiceRole); // Added log

  if (!supabaseServiceRole) {
    console.warn('SUPABASE_SERVICE_ROLE_KEY not found. Falling back to regular client.');
    return getSupabaseClient();
  }

  try {
    supabaseAdminInstance = createClient<Database>(
      supabaseUrl,
      supabaseServiceRole,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
          storageKey: 'sb-admin-token',
          storage: {
            getItem: (key) => {
              if (typeof window !== 'undefined') {
                return window.localStorage.getItem(key);
              }
              return null;
            },
            setItem: (key, value) => {
              if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, value);
              }
            },
            removeItem: (key) => {
              if (typeof window !== 'undefined') {
                window.localStorage.removeItem(key);
              }
            },
          },
        },
      }
    );
    console.log('Admin Supabase client initialized successfully'); // Added log
  } catch (error) {
    console.error('Error initializing admin Supabase client:', error); // Added log
    throw error;
  }

  return supabaseAdminInstance;
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