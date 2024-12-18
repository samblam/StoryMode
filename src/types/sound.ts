export interface Sound {
  id: string;
  name: string;
  description: string;
  file: string;
  storage_path: string;  // Add this field
  profileId: string;
}

export interface SoundProfile {
  id: string;
  title: string;
  description: string;
  slug: string;
  clientId?: string;
}

export interface SoundProfileWithSounds extends SoundProfile {
  sounds: Sound[];
}