export interface Sound {
  id: string;
  name: string;
  description: string;
  file: string;
  profileId: string;
}

// src/types/sound.ts
export interface SoundProfile {
  id: string;
  title: string;
  description: string;
  slug: string;
  clientId?: string; // Add this line
}

export interface SoundProfileWithSounds extends SoundProfile {
  sounds: Sound[];
}