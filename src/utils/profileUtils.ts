// src/utils/profileUtils.ts
import { supabase } from '../lib/supabase';
import type { SoundProfile, SoundProfileWithSounds } from '../types/sound';

export async function getSoundProfiles(): Promise<SoundProfile[]> {
  const { data, error } = await supabase
    .from('sound_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching sound profiles:', error);
    throw error;
  }

  return data || [];
}

export async function getSoundProfilesWithSounds(): Promise<
  SoundProfileWithSounds[]
> {
  const { data, error } = await supabase
    .from('sound_profiles')
    .select(
      `
      *,
      sounds (*)
    `
    )
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching sound profiles with sounds:', error);
    throw error;
  }

  return (
    data?.map((profile) => ({
      id: profile.id,
      title: profile.title,
      description: profile.description,
      slug: profile.slug,
      sounds: profile.sounds.map((sound) => ({
        id: sound.id,
        name: sound.name,
        description: sound.description,
        file: sound.file_path,
        profileId: sound.profile_id,
      })),
    })) || []
  );
}

export async function getSoundProfileById(
  id: string
): Promise<SoundProfileWithSounds | null> {
  const { data, error } = await supabase
    .from('sound_profiles')
    .select(
      `
      *,
      sounds (*)
    `
    )
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching sound profile:', error);
    throw error;
  }

  if (!data) return null;

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    slug: data.slug,
    sounds: data.sounds.map((sound) => ({
      id: sound.id,
      name: sound.name,
      description: sound.description,
      file: sound.file_path,
      profileId: sound.profile_id,
    })),
  };
}

export async function createSoundProfile(
  profile: Omit<SoundProfile, 'id'>
): Promise<SoundProfile> {
  const { data, error } = await supabase
    .from('sound_profiles')
    .insert(profile)
    .select()
    .single();

  if (error) {
    console.error('Error creating sound profile:', error);
    throw error;
  }

  return data;
}

export async function updateSoundProfile(
  id: string,
  profile: Partial<SoundProfile>
): Promise<SoundProfile> {
  const { data, error } = await supabase
    .from('sound_profiles')
    .update(profile)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating sound profile:', error);
    throw error;
  }

  return data;
}

export async function deleteSoundProfile(id: string): Promise<void> {
  const { error } = await supabase.from('sound_profiles').delete().eq('id', id);

  if (error) {
    console.error('Error deleting sound profile:', error);
    throw error;
  }
}
// Add the new function here, right before the final closing brace
export async function saveSoundProfiles(
  profiles: SoundProfile[]
): Promise<void> {
  const { error } = await supabase.from('sound_profiles').upsert(
    profiles.map((profile) => ({
      id: profile.id,
      title: profile.title,
      description: profile.description,
      slug: profile.slug,
    }))
  );

  if (error) {
    console.error('Error saving sound profiles:', error);
    throw error;
  }
}
