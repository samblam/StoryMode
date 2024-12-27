import { Howl } from 'howler';

class AudioManager {
  private static instance: AudioManager;
  private sounds: Map<string, Howl> = new Map();
  private volume: number = 1.0;
  private currentSoundId: string | null = null;

  private constructor() {
    console.log('AudioManager - constructor');
  }

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private async loadSound(soundUrl: string): Promise<Howl> {
      console.log('AudioManager - loadSound - soundUrl:', soundUrl);
    return new Promise((resolve, reject) => {
      const sound = new Howl({
        src: [soundUrl],
        html5: true,
        preload: true,
        volume: this.volume,
        format: ['mp3'],
        onload: () => {
            console.log('AudioManager - loadSound - onload - soundUrl:', soundUrl, sound);
            resolve(sound);
        },
        onloaderror: (_id, error) => {
            console.error('AudioManager - loadSound - onloaderror - soundUrl:', soundUrl, 'error:', error);
            reject(error);
        }
      });
    });
  }

  async getSound(soundUrl: string): Promise<Howl> {
      console.log('AudioManager - getSound - soundUrl:', soundUrl);
    try {
      let sound = this.sounds.get(soundUrl);
      
      if (!sound) {
        sound = await this.loadSound(soundUrl);
        this.sounds.set(soundUrl, sound);
          console.log('AudioManager - getSound - loaded sound - soundUrl:', soundUrl);
      }
      
      return sound;
    } catch (error) {
      console.error('AudioManager - getSound - Error loading sound:', error, 'soundUrl:', soundUrl);
      throw error;
    }
  }

  async play(soundUrl: string): Promise<void> {
      console.log('AudioManager - play - soundUrl:', soundUrl);
    try {
      // Stop current sound if different
      if (this.currentSoundId && this.currentSoundId !== soundUrl) {
        await this.pause();
      }

      const sound = await this.getSound(soundUrl);
      
      if (sound.playing()) {
        sound.pause();
        this.currentSoundId = null;
        console.log('AudioManager - play - sound paused - soundUrl:', soundUrl);
        return;
      }

      sound.play();
      this.currentSoundId = soundUrl;
        console.log('AudioManager - play - sound playing - soundUrl:', soundUrl);
      
      // Update UI elements
      this.updatePlayButton(soundUrl, true);
      
      // Handle sound ending
      sound.once('end', () => {
        this.currentSoundId = null;
          console.log('AudioManager - play - sound ended - soundUrl:', soundUrl);
        this.updatePlayButton(soundUrl, false);
      });

    } catch (error) {
      console.error('AudioManager - play - Error playing sound:', error, 'soundUrl:', soundUrl);
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
        console.log('AudioManager - updatePlayButton - soundUrl:', soundUrl, 'isPlaying:', isPlaying);
    }
  }

  async pause(): Promise<void> {
      console.log('AudioManager - pause - currentSoundId:', this.currentSoundId);
    if (this.currentSoundId) {
      const sound = this.sounds.get(this.currentSoundId);
      if (sound?.playing()) {
        sound.pause();
        this.updatePlayButton(this.currentSoundId, false);
          console.log('AudioManager - pause - sound paused - currentSoundId:', this.currentSoundId);
      }
      this.currentSoundId = null;
    }
  }

  isPlaying(): boolean {
    if (!this.currentSoundId) return false;
    const sound = this.sounds.get(this.currentSoundId);
      const playing = sound?.playing() || false
      console.log('AudioManager - isPlaying - currentSoundId:', this.currentSoundId, 'playing:', playing);
    return playing;
  }

  getCurrentSoundId(): string | null {
    return this.currentSoundId;
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach(sound => {
      sound.volume(this.volume);
    });
      console.log('AudioManager - setVolume - volume:', this.volume);
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
      console.log('AudioManager - cleanup');
  }
}

export const audioManager = AudioManager.getInstance();