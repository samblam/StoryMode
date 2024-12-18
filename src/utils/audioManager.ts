import { Howl } from 'howler';
import { supabaseAdmin, supabase } from '../lib/supabase';

class AudioManager {
  private static instance: AudioManager;
  private sounds: Map<string, Howl> = new Map();
  private volume: number = 1.0;
  private currentSoundId: string | null = null;
  private urlCache: Map<string, { url: string, expires: number }> = new Map();

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private async getSignedUrl(storagePath: string): Promise<string> {
    // Check cache first
    const cached = this.urlCache.get(storagePath);
    if (cached && Date.now() < cached.expires) {
      return cached.url;
    }

    const { data, error } = await supabase.storage
      .from('sounds')
      .createSignedUrl(storagePath, 3600, {
        download: false,
        transform: {
          format: 'origin'
        }
      }); // 1 hour expiry

    if (error || !data?.signedUrl) {
      throw new Error(`Failed to get signed URL: ${error?.message}`);
    }

    // Cache the URL
    this.urlCache.set(storagePath, {
      url: data.signedUrl,
      expires: Date.now() + (3600 * 1000) // 1 hour in milliseconds
    });

    return data.signedUrl;
  }

  async createSound(soundId: string, storagePath: string): Promise<Howl> {
    const signedUrl = await this.getSignedUrl(storagePath);
    
    const sound = new Howl({
      src: [signedUrl],
      html5: true,
      volume: this.volume,
      format: ['mp3'],
      onloaderror: async (_id, error) => {
        console.error('Sound load error:', error);
        // Remove from cache to force refresh on next try
        this.urlCache.delete(storagePath);
        this.sounds.delete(soundId);
      },
      onplayerror: async (_id, error) => {
        console.error('Sound play error:', error);
        // Try to refresh URL and reload
        try {
          const newUrl = await this.getSignedUrl(storagePath);
          sound.unload();
          sound._src = newUrl;
          sound.load();
        } catch (refreshError) {
          console.error('Failed to refresh sound URL:', refreshError);
        }
      }
    });

    this.sounds.set(soundId, sound);
    return sound;
  }

  async getSound(soundId: string, storagePath: string): Promise<Howl> {
    let sound = this.sounds.get(soundId);
    
    if (!sound) {
      sound = await this.createSound(soundId, storagePath);
    }

    return sound;
  }

  async play(soundId: string, storagePath: string): Promise<void> {
    try {
      if (this.currentSoundId && this.currentSoundId !== soundId) {
        await this.pause();
      }

      const sound = await this.getSound(soundId, storagePath);
      sound.play();
      this.currentSoundId = soundId;
    } catch (error) {
      console.error('Play error:', error);
      throw error;
    }
  }

  async pause(): Promise<void> {
    if (this.currentSoundId) {
      const sound = this.sounds.get(this.currentSoundId);
      if (sound?.playing()) {
        sound.pause();
      }
    }
    this.currentSoundId = null;
  }

  isPlaying(): boolean {
    if (!this.currentSoundId) return false;
    const sound = this.sounds.get(this.currentSoundId);
    return sound?.playing() || false;
  }

  getCurrentSoundId(): string | null {
    return this.currentSoundId;
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach(sound => {
      sound.volume(this.volume);
    });
  }

  getVolume(): number {
    return this.volume;
  }

  cleanup(): void {
    this.sounds.forEach(sound => {
      sound.unload();
    });
    this.sounds.clear();
    this.urlCache.clear();
    this.currentSoundId = null;
  }
}

export const audioManager = AudioManager.getInstance();