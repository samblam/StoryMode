import { supabase } from '../lib/supabase';
import type { SoundProfile, SoundProfileWithSounds, Sound } from '../types/sound';
import { deleteSoundsByProfileId } from './soundUtils';

let isProcessingDelete = false;

export async function getSoundProfiles(clientId?: string): Promise<SoundProfile[]> {
  let query = supabase
    .from('sound_profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (clientId) {
    query = query.eq('client_id', clientId);
  }

  const { data, error } = await query;

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
      sounds: profile.sounds.map((sound: Sound) => ({
        id: sound.id,
        name: sound.name,
        description: sound.description,
       
        profileId: sound.profileId,
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
    sounds: data.sounds.map((sound: Sound) => ({
      id: sound.id,
      name: sound.name,
      description: sound.description,
      
      profileId: sound.profileId,
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

// Added new profile deletion handler
export async function handleProfileDelete(button: HTMLButtonElement): Promise<void> {
  if (isProcessingDelete) return;

  const profileId = button.dataset.profileId;
  const soundCount = parseInt(button.dataset.soundCount || '0');

  if (!profileId) return;

  const message =
    soundCount > 0
      ? `This will delete the profile and ${soundCount} associated sound${
          soundCount !== 1 ? 's' : ''
        }. Are you sure?`
      : 'Are you sure you want to delete this profile?';

  if (!confirm(message)) return;

  try {
    isProcessingDelete = true;
    button.disabled = true;

    await deleteSoundsByProfileId(profileId);
    await deleteSoundProfile(profileId);

    const currentTab =
      new URLSearchParams(window.location.search).get('tab') || 'library';
    window.location.href = `/sounds?tab=${currentTab}&success=Profile deleted successfully`;
  } catch (error) {
    console.error('Profile deletion error:', error);
    alert(error instanceof Error ? error.message : 'Failed to delete profile');
    button.disabled = false;
  } finally {
    isProcessingDelete = false;
  }
}
