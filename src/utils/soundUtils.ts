import fs from 'fs/promises';
import path from 'path';
import type { Sound } from '../types/sound';

const SOUNDS_DATA_FILE = path.join(process.cwd(), 'public', 'sounds', 'sounds-data.json');

export async function getSounds(): Promise<Sound[]> {
  try {
    const data = await fs.readFile(SOUNDS_DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

export async function saveSounds(sounds: Sound[]): Promise<void> {
  const dir = path.dirname(SOUNDS_DATA_FILE);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(SOUNDS_DATA_FILE, JSON.stringify(sounds, null, 2));
}

export async function deleteSound(soundFile: string): Promise<void> {
  const publicDir = path.join(process.cwd(), 'public');
  const filePath = path.join(publicDir, soundFile.replace(/^\//, ''));
  
  try {
    await fs.unlink(filePath);
  } catch (error) {
    console.error('Error deleting sound file:', error);
    throw new Error('Failed to delete sound file');
  }

  const sounds = await getSounds();
  const updatedSounds = sounds.filter(sound => sound.file !== soundFile);
  await saveSounds(updatedSounds);
}