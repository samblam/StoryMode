import { Howl } from 'howler';

class AudioManager {
  private static instance: AudioManager;
  private sounds: Map<string, { howl: Howl; lastUsed: number }> = new Map();
  private volume: number = 1.0;
  private currentSoundFile: string | null = null;
  private refreshTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();

  private constructor() {
    console.log('AudioManager - constructor');
  }

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private async refreshUrl(soundId: string): Promise<string | null> {
    try {
      const response = await fetch('/api/sounds/refresh-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ soundId }),
      });

      if (!response.ok) throw new Error('Failed to refresh URL');
      const data = await response.json();
      return data.url;
    } catch (error) {
      console.error('URL refresh error:', error);
      return null;
    }
  }

  private async loadSound(soundFile: string, soundId: string): Promise<Howl> {
    console.log('AudioManager - loadSound - soundFile:', soundFile);
    return new Promise((resolve, reject) => {
      const sound = new Howl({
        src: [soundFile],
        html5: true,
        preload: true,
        volume: this.volume,
        format: ['mp3'],
        onload: () => {
          console.log('AudioManager - loadSound - onload - soundFile:', soundFile);
          resolve(sound);
        },
        onloaderror: async (_id, error) => {
          console.error('AudioManager - loadSound - onloaderror - soundFile:', soundFile, 'error:', error);
          // Try to refresh URL on load error
          const freshUrl = await this.refreshUrl(soundId);
          if (freshUrl) {
            sound.unload();
            const newSound = new Howl({
              src: [freshUrl],
              html5: true,
              preload: true,
              volume: this.volume,
              format: ['mp3'],
              onload: () => resolve(newSound),
              onloaderror: (_id, error) => reject(error)
            });
          } else {
            reject(error);
          }
        }
      });
    });
  }

  async getSound(soundFile: string, soundId: string): Promise<Howl> {
    console.log('AudioManager - getSound - soundFile:', soundFile);
    const soundData = this.sounds.get(soundFile);
    
    if (soundData?.howl) {
      soundData.lastUsed = Date.now();
      return soundData.howl;
    }

    try {
      const sound = await this.loadSound(soundFile, soundId);
      this.sounds.set(soundFile, { 
        howl: sound, 
        lastUsed: Date.now() 
      });
      return sound;
    } catch (error) {
      console.error('AudioManager - getSound - Error loading sound:', error, 'soundFile:', soundFile);
      throw error;
    }
  }

  async play(soundFile: string, soundId: string): Promise<void> {
    console.log('AudioManager - play - soundFile:', soundFile);
    try {
      // Stop current sound if different
      if (this.currentSoundFile && this.currentSoundFile !== soundFile) {
        await this.pause();
      }

      const sound = await this.getSound(soundFile, soundId);
      
      if (sound.playing()) {
        sound.pause();
        this.currentSoundFile = null;
        console.log('AudioManager - play - sound paused - soundFile:', soundFile);
        return;
      }

      sound.play();
      this.currentSoundFile = soundFile;
      console.log('AudioManager - play - sound playing - soundFile:', soundFile);
      
      // Update UI elements
      this.updatePlayButton(soundFile, true);
      
      // Handle sound ending
      sound.once('end', () => {
        this.currentSoundFile = null;
        console.log('AudioManager - play - sound ended - soundFile:', soundFile);
        this.updatePlayButton(soundFile, false);
        
        // Dispatch custom event for audio end
        const event = new CustomEvent('audioend', {
          detail: {
            soundFile,
            duration: sound.duration()
          }
        });
        document.dispatchEvent(event);
      });

    } catch (error) {
      console.error('AudioManager - play - Error playing sound:', error, 'soundFile:', soundFile);
      this.updatePlayButton(soundFile, false);
      throw error;
    }
  }

  private updatePlayButton(soundFile: string, isPlaying: boolean) {
    const button = document.querySelector(`[data-sound="${soundFile}"]`) as HTMLButtonElement;
    if (button) {
      button.textContent = isPlaying ? 'Pause' : 'Play';
      button.classList.remove(isPlaying ? 'bg-green-400' : 'bg-yellow-400');
      button.classList.add(isPlaying ? 'bg-yellow-400' : 'bg-green-400');
    }
  }

  async pause(): Promise<void> {
    console.log('AudioManager - pause - currentSoundFile:', this.currentSoundFile);
    if (this.currentSoundFile) {
      const soundData = this.sounds.get(this.currentSoundFile);
      if (soundData?.howl?.playing()) {
        soundData.howl.pause();
        this.updatePlayButton(this.currentSoundFile, false);
      }
      this.currentSoundFile = null;
    }
  }

  isPlaying(): boolean {
    if (!this.currentSoundFile) return false;
    const soundData = this.sounds.get(this.currentSoundFile);
    const playing = soundData?.howl?.playing() || false;
    console.log('AudioManager - isPlaying - currentSoundFile:', this.currentSoundFile, 'playing:', playing);
    return playing;
  }

  getCurrentSoundId(): string | null {
    return this.currentSoundFile;
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
    this.sounds.forEach(({ howl }) => {
      howl.volume(this.volume);
    });
    console.log('AudioManager - setVolume - volume:', this.volume);
  }

  getVolume(): number {
    return this.volume;
  }

  cleanup(): void {
    // Clear all timeouts
    this.refreshTimeouts.forEach(timeout => clearTimeout(timeout));
    this.refreshTimeouts.clear();

    // Unload all sounds
    this.sounds.forEach(({ howl }) => howl.unload());
    this.sounds.clear();
    this.currentSoundFile = null;
    console.log('AudioManager - cleanup');
  }
}

export const audioManager = AudioManager.getInstance();