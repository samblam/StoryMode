import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

let supabase: SupabaseClient<Database>;
let supabaseAdmin: SupabaseClient<Database>;

if (typeof import.meta !== 'undefined' && import.meta.env) {
    // Load environment variables
    const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    // Validate environment variables
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Missing required Supabase public environment variables');
    }

    supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        },
    });

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
export { supabase, supabaseAdmin };
