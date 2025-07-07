import { getClient } from '../lib/supabase';
import type { Database } from '../types/database';

type SoundProfile = Database['public']['Tables']['sound_profiles']['Row'];

interface ProfileResponse {
    data: SoundProfile[];
    error: string | null;
}

/**
 * Get all sound profiles, optionally filtered by client ID
 */
export async function getSoundProfiles(clientId?: string): Promise<ProfileResponse> {
    console.log('[ProfileUtils] getSoundProfiles called with clientId:', clientId);
    
    try {
        console.log('[ProfileUtils] Initializing admin Supabase client...');
        // Use the admin client as this function is called from an admin-only page
        const supabaseAdmin = getClient({ requiresAdmin: true });
        console.log('[ProfileUtils] Admin client initialized successfully');
        
        console.log('[ProfileUtils] Building query...');
        let query = supabaseAdmin
            .from('sound_profiles')
            .select('*')
            .order('title');

        // Filter by client if provided
        if (clientId) {
            console.log('[ProfileUtils] Adding client filter for clientId:', clientId);
            query = query.or(`client_id.eq.${clientId},is_template.eq.true`);
        }

        console.log('[ProfileUtils] Executing query...');
        const { data, error } = await query;

        if (error) {
            console.error('[ProfileUtils] Database query error:', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
            });
            return {
                data: [],
                error: error.message
            };
        }

        console.log('[ProfileUtils] Query successful. Results:', {
            count: data?.length || 0,
            profiles: data?.map(p => ({ id: p.id, title: p.title, slug: p.slug })) || []
        });

        return {
            data: data || [],
            error: null
        };
    } catch (error) {
        console.error('[ProfileUtils] Exception in getSoundProfiles:', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : null,
            error: error
        });
        return {
            data: [],
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
