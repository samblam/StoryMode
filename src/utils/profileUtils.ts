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
    try {
        // Use the admin client as this function is called from an admin-only page
        const supabaseAdmin = getClient({ requiresAdmin: true });
        
        let query = supabaseAdmin
            .from('sound_profiles')
            .select('*')
            .order('title');

        // Filter by client if provided
        if (clientId) {
            query = query.or(`client_id.eq.${clientId},is_template.eq.true`);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching sound profiles:', error);
            return {
                data: [],
                error: error.message
            };
        }

        return {
            data: data || [],
            error: null
        };
    } catch (error) {
        console.error('Error in getSoundProfiles:', error);
        return {
            data: [],
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}
