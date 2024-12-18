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

  private async loadSound(soundUrl: string): Promise<Howl> {
    return new Promise((resolve, reject) => {
      const sound = new Howl({
        src: [soundUrl],
        html5: true,
        preload: true,
        volume: this.volume,
        format: ['mp3'],
        onload: () => resolve(sound),
        onloaderror: (_id, error) => reject(error)
      });
    });
  }

  async getSound(soundUrl: string): Promise<Howl> {
    try {
      let sound = this.sounds.get(soundUrl);
      
      if (!sound) {
        sound = await this.loadSound(soundUrl);
        this.sounds.set(soundUrl, sound);
      }
      
      return sound;
    } catch (error) {
      console.error('Error loading sound:', error);
      throw error;
    }
  }

  async play(soundUrl: string): Promise<void> {
    try {
      // Stop current sound if different
      if (this.currentSoundId && this.currentSoundId !== soundUrl) {
        await this.pause();
      }

      const sound = await this.getSound(soundUrl);
      
      if (sound.playing()) {
        sound.pause();
        this.currentSoundId = null;
        return;
      }

      sound.play();
      this.currentSoundId = soundUrl;
      
      // Update UI elements
      this.updatePlayButton(soundUrl, true);
      
      // Handle sound ending
      sound.once('end', () => {
        this.currentSoundId = null;
        this.updatePlayButton(soundUrl, false);
      });

    } catch (error) {
      console.error('Error playing sound:', error);
      this.updatePlayButton(soundUrl, false);
      throw error;
    }
  }

  private updatePlayButton(soundUrl: string, isPlaying: boolean) {
    const button = document.querySelector(`[data-sound="${soundUrl}"]`) as HTMLButtonElement;
    if (button) {
      button.textContent = isPlaying ? 'Pause' : 'Play';
      button.classList.remove(isPlaying ? 'bg-green-400' : 'bg-yellow-400');
      button.classList.add(isPlaying ? 'bg-yellow-400' : 'bg-green-400');
    }
  }

  async pause(): Promise<void> {
    if (this.currentSoundId) {
      const sound = this.sounds.get(this.currentSoundId);
      if (sound?.playing()) {
        sound.pause();
        this.updatePlayButton(this.currentSoundId, false);
      }
      this.currentSoundId = null;
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
    this.currentSoundId = null;
  }
}

export const audioManager = AudioManager.getInstance();