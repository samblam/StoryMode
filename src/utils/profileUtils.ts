import fs from 'fs/promises';
import path from 'path';
import type { SoundProfile } from '../types/sound';

const PROFILES_FILE = path.join(process.cwd(), 'public', 'sounds', 'profiles.json');

export async function getSoundProfiles(): Promise<SoundProfile[]> {
  try {
    const data = await fs.readFile(PROFILES_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return empty array
    return [];
  }
}

export async function saveSoundProfiles(profiles: SoundProfile[]): Promise<void> {
  const dir = path.dirname(PROFILES_FILE);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(PROFILES_FILE, JSON.stringify(profiles, null, 2));
}