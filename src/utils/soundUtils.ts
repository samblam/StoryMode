// src/utils/soundUtils.ts
import { supabase } from '../lib/supabase';
import type { Sound } from '../types/sound';

export async function getSounds(): Promise<Sound[]> {
  const { data, error } = await supabase
    .from('sounds')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching sounds:', error);
    throw error;
  }

  return (
    data?.map((sound) => ({
      id: sound.id,
      name: sound.name,
      description: sound.description,
      file: sound.file_path,
      profileId: sound.profile_id,
    })) || []
  );
}

export async function getSoundsByProfileId(
  profileId: string
): Promise<Sound[]> {
  const { data, error } = await supabase
    .from('sounds')
    .select('*')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching sounds for profile:', error);
    throw error;
  }

  return (
    data?.map((sound) => ({
      id: sound.id,
      name: sound.name,
      description: sound.description,
      file: sound.file_path,
      profileId: sound.profile_id,
    })) || []
  );
}

export async function createSound(sound: {
  name: string;
  description: string;
  file_path: string;
  profile_id: string;
}): Promise<Sound> {
  const { data, error } = await supabase
    .from('sounds')
    .insert(sound)
    .select()
    .single();

  if (error) {
    console.error('Error creating sound:', error);
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    file: data.file_path,
    profileId: data.profile_id,
  };
}

export async function updateSound(
  id: string,
  sound: Partial<{
    name: string;
    description: string;
    file_path: string;
    profile_id: string;
  }>
): Promise<Sound> {
  const { data, error } = await supabase
    .from('sounds')
    .update(sound)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating sound:', error);
    throw error;
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description,
    file: data.file_path,
    profileId: data.profile_id,
  };
}

export async function deleteSound(id: string): Promise<void> {
  const { error } = await supabase.from('sounds').delete().eq('id', id);

  if (error) {
    console.error('Error deleting sound:', error);
    throw error;
  }
}

export async function deleteSoundsByProfileId(
  profileId: string
): Promise<void> {
  const { error } = await supabase
    .from('sounds')
    .delete()
    .eq('profile_id', profileId);

  if (error) {
    console.error('Error deleting sounds for profile:', error);
    throw error;
  }
}
