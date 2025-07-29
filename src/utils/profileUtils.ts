import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';

type SoundProfile = Database['public']['Tables']['sound_profiles']['Row'];

interface ProfileResponse {
    data: SoundProfile[];
    error: string | null;
}

/**
 * Get all sound profiles, optionally filtered by client ID
 */
export async function getSoundProfiles(token: string, clientId?: string): Promise<ProfileResponse> {
    console.log('getSoundProfiles clientId:', clientId, 'token:', token);
    try {
        let query = supabase
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
