import { Howl } from 'howler';

class AudioManager {
  private static instance: AudioManager;
  private sounds: Map<string, Howl> = new Map();
  private volume: number = 1.0;
  private currentSoundId: string | null = null;

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  async refreshUrl(soundId: string): Promise<string> {
    try {
      const response = await fetch('/api/sounds/refresh-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ soundId }),
      });

      if (!response.ok) throw new Error('Failed to refresh URL');

      const data = await response.json();
      if (!data.success) throw new Error(data.error || 'Failed to refresh URL');

      return data.url;
    } catch (error) {
      console.error('Error refreshing URL:', error);
      throw error;
    }
  }

  getSound(soundId: string): Howl {
    let sound = this.sounds.get(soundId);

    if (!sound) {
      sound = new Howl({
        src: [soundId],
        html5: true,
        volume: this.volume,
        onloaderror: async (id, error) => {
          console.error('Load error:', error);
          try {
            // Try to refresh the URL and reload the sound
            const newUrl = await this.refreshUrl(soundId);
            sound?.unload();
            this.sounds.delete(soundId);
            sound = new Howl({
              src: [newUrl],
              html5: true,
              volume: this.volume,
            });
            this.sounds.set(soundId, sound);
            sound.play();
          } catch (refreshError) {
            console.error('Failed to refresh and reload sound:', refreshError);
          }
        },
        onend: () => {
          if (this.currentSoundId === soundId) {
            this.currentSoundId = null;
          }
        },
      });
      this.sounds.set(soundId, sound);
    }

    return sound;
  }

  play(soundId: string): void {
    // Stop current sound if different from the one being played
    if (this.currentSoundId && this.currentSoundId !== soundId) {
      this.pause();
    }

    const sound = this.getSound(soundId);
    sound.play();
    this.currentSoundId = soundId;
  }

  pause(): void {
    if (this.currentSoundId) {
      const sound = this.sounds.get(this.currentSoundId);
      if (sound?.playing()) {
        sound.pause();
      }
    }
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
    this.sounds.forEach((sound) => {
      sound.volume(this.volume);
    });
  }

  getVolume(): number {
    return this.volume;
  }

  cleanup(): void {
    this.sounds.forEach((sound) => {
      sound.unload();
    });
    this.sounds.clear();
    this.currentSoundId = null;
  }
}

export const audioManager = AudioManager.getInstance();
