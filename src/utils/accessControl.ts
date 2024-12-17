// src/utils/accessControl.ts

import { supabaseAdmin } from '../lib/supabase';
import type { User } from '../types/auth';
import type { Database } from '../types/database';

type SoundProfileWithClient = Database['public']['Tables']['sound_profiles']['Row'] & {
  client?: Database['public']['Tables']['clients']['Row'] | null;
  sounds: Database['public']['Tables']['sounds']['Row'][];
};

export async function getAccessibleSoundProfiles(user: User | undefined): Promise<SoundProfileWithClient[]> {
  if (!user) {

  try {
    let query = supabaseAdmin
      .from('sound_profiles')
      .select(`
        *,
        client:clients(*),
        sounds(*)
      `)
      .order('created_at', { ascending: false });

    // If user is a client, filter to only show their profiles
    if (user.role === 'client' && user.clientId) {
      query = query.eq('client_id', user.clientId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching sound profiles:', error);
    return [];
  }
}

export async function getAccessibleSounds(user: User | undefined) {
  if (!user) return [];

  try {
    let query = supabaseAdmin
      .from('sounds')
      .select(`
        *,
        sound_profiles!inner(
          *,
          client:clients(*)
        )
      `)
      .order('created_at', { ascending: false });

    // If user is a client, filter to only show their sounds
    if (user.role === 'client' && user.clientId) {
      query = query.eq('sound_profiles.client_id', user.clientId);
    }

    const { data, error } = await query;

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching sounds:', error);
    return [];
  }
}

export function organizeProfilesByClient(profiles: SoundProfileWithClient[]) {
  return profiles.reduce((acc, profile) => {
    const clientName = profile.client?.name || 'No Client';
    if (!acc[clientName]) {
      acc[clientName] = [];
    }
    acc[clientName].push(profile);
    return acc;
  }, {} as Record<string, SoundProfileWithClient[]>);
}