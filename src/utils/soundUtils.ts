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

// Added new download functionality
const downloadQueue = new Set<string>();

export async function handleSoundDownload(button: HTMLElement): Promise<void> {
  if (button.hasAttribute('data-downloading')) return;

  const sounds = JSON.parse(button.dataset.sounds || '[]');
  if (sounds.length === 0) {
    alert('No sounds available to download');
    return;
  }

  try {
    button.setAttribute('data-downloading', 'true');
    (button as any).disabled = true;
    const originalText = button.textContent || '';

    for (let i = 0; i < sounds.length; i++) {
      const sound = sounds[i];
      if (downloadQueue.has(sound.file)) continue;

      try {
        downloadQueue.add(sound.file);
        button.textContent = `Downloading ${i + 1}/${sounds.length}`;

        const response = await fetch(sound.file);
        if (!response.ok) throw new Error(`Failed to download ${sound.name}`);

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `${sound.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')}.mp3`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        if (i < sounds.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } finally {
        downloadQueue.delete(sound.file);
      }
    }

    button.textContent = originalText;
  } catch (error) {
    console.error('Download error:', error);
    alert('Failed to download some sounds. Please try again.');
  } finally {
    button.removeAttribute('data-downloading');
    (button as any).disabled = false;
    downloadQueue.clear();
  }
}
