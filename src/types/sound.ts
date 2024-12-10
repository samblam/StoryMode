export interface Sound {
  id: string;
  name: string;
  description: string;
  file: string;
  profileId: string;
}

export interface SoundProfile {
  id: string;
  title: string;
  description: string;
  slug: string;
}

export interface SoundProfileWithSounds extends SoundProfile {
  sounds: Sound[];
}