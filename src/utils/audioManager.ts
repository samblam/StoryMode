import { Howl } from 'howler';

interface LoadingState {
  status: 'idle' | 'loading' | 'loaded' | 'error';
  progress: number;
  error?: string;
}

class AudioManager {
  private static instance: AudioManager;
  private sounds: Map<string, { howl: Howl; lastUsed: number }> = new Map();
  private volume: number = 1.0;
  private currentSoundId: string | null = null;
  private refreshTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private loadingPromises: Map<string, Promise<Howl>> = new Map();
  private soundButtonStates: Map<string, boolean> = new Map();
  private loadingStates: Map<string, LoadingState> = new Map();
  private debug = false;

  private constructor() {
    console.log('AudioManager - constructor');
  }

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private updateLoadingState(soundId: string, state: Partial<LoadingState>) {
    const current = this.loadingStates.get(soundId) || {
      status: 'idle',
      progress: 0
    };
    const newState = { ...current, ...state };
    this.loadingStates.set(soundId, newState);
    
    // Emit loading state change event
    document.dispatchEvent(new CustomEvent('audioLoadingStateChange', {
      detail: { soundId, state: newState }
    }));

    if (this.debug) {
      console.log(`AudioManager - Loading state update for ${soundId}:`, newState);
    }
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

  private async loadSound(soundFile: string, soundId: string, retryCount = 0): Promise<Howl> {
    // Update loading state to loading with 0 progress
    this.updateLoadingState(soundId, { status: 'loading', progress: 0 });
    
    if (this.debug) {
      console.log('AudioManager - loadSound - soundFile:', soundFile);
    }
    
    // Pre-fetch and validate the URL
    if (retryCount === 0) {
      try {
        this.updateLoadingState(soundId, { progress: 10 });
        const freshUrl = await this.refreshUrl(soundId);
        if (freshUrl) {
          soundFile = freshUrl;
          this.updateLoadingState(soundId, { progress: 20 });
        }
      } catch (error) {
        if (this.debug) {
          console.error('Pre-fetch URL failed:', error);
        }
      }
    }

    return new Promise((resolve, reject) => {
      let loadStartTime = Date.now();
      const progressInterval = setInterval(() => {
        // Simulate progress based on time elapsed (max 5 seconds)
        const elapsed = Date.now() - loadStartTime;
        const progress = Math.min(90, 20 + (elapsed / 5000) * 70);
        this.updateLoadingState(soundId, { progress });
      }, 100);

      const sound = new Howl({
        src: [soundFile],
        html5: true,
        preload: 'metadata',
        volume: this.volume,
        format: ['mp3'],
        onload: () => {
          clearInterval(progressInterval);
          if (this.debug) {
            console.log('AudioManager - loadSound - onload - soundFile:', soundFile);
          }
          this.updateLoadingState(soundId, { status: 'loaded', progress: 100 });
          resolve(sound);
        },
        onloaderror: async (_id, error) => {
          clearInterval(progressInterval);
          if (this.debug) {
            console.error('AudioManager - loadSound - onloaderror - soundFile:', soundFile, 'error:', error);
          }
          
          // If this is the first attempt, try refreshing URL
          if (retryCount === 0) {
            try {
              this.updateLoadingState(soundId, { progress: 50 });
              const freshUrl = await this.refreshUrl(soundId);
              if (freshUrl) {
                sound.unload();
                // Retry with fresh URL
                return resolve(this.loadSound(freshUrl, soundId, retryCount + 1));
              }
            } catch (refreshError) {
              console.error('URL refresh failed:', refreshError);
            }
          }
          
          // If we've already retried or refresh failed, update state and reject
          this.updateLoadingState(soundId, { 
            status: 'error', 
            progress: 0,
            error: `Failed to load sound: ${error}`
          });
          reject(new Error(`Failed to load sound: ${error}`));
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

    // Check if we're already loading this sound
    let loadingPromise = this.loadingPromises.get(soundFile);
    if (!loadingPromise) {
      // Start new load
      loadingPromise = this.loadSound(soundFile, soundId).then(sound => {
        // Store the loaded sound
        this.sounds.set(soundFile, { 
          howl: sound, 
          lastUsed: Date.now() 
        });
        // Clear the loading promise
        this.loadingPromises.delete(soundFile);
        return sound;
      }).catch(error => {
        // Clear the loading promise on error
        this.loadingPromises.delete(soundFile);
        throw error;
      });
      // Store the loading promise
      this.loadingPromises.set(soundFile, loadingPromise);
    }

    return loadingPromise;
  }

  async play(soundFile: string, soundId: string): Promise<void> {
    try {
      // Stop current sound if different
      if (this.currentSoundId && this.currentSoundId !== soundId) {
        await this.pause();
      }
   
      const sound = await this.getSound(soundFile, soundId);
      
      if (sound.playing()) {
        sound.pause();
        this.currentSoundId = null;
        this.updatePlayButton(soundId, false);
        if (this.debug) {
          console.log('AudioManager - play - sound paused - soundFile:', soundFile);
        }
        return;
      }
  
      // Play with proper event handling and timeout
      await new Promise<void>((resolve, reject) => {
        const playHandler = () => resolve();
        const errorHandler = () => reject(new Error('Play failed'));
        
        // Set up event listeners
        sound.once('play', playHandler);
        sound.once('playerror', errorHandler);
        
        // Start playback
        sound.play();
        
        // Set timeout for playback start
        const timeout = setTimeout(() => {
          sound.off('play', playHandler);
          sound.off('playerror', errorHandler);
          reject(new Error('Playback timeout'));
        }, 2000);
        
        // Cleanup on success
        sound.once('end', () => {
          clearTimeout(timeout);
          sound.off('play', playHandler);
          sound.off('playerror', errorHandler);
        });
      });
      
      this.currentSoundId = soundId;
      this.updatePlayButton(soundId, true);
      if (this.debug) {
        console.log('AudioManager - play - sound playing - soundFile:', soundFile);
      }
      
      // Handle sound ending
      sound.once('end', () => {
        this.currentSoundId = null;
        this.updatePlayButton(soundId, false);
        console.log('AudioManager - play - sound ended - soundFile:', soundFile);
        
        document.dispatchEvent(new CustomEvent('audioend', {
          detail: {
            soundId,
            duration: sound.duration()
          }
        }));
      });
   
    } catch (error) {
      console.error('AudioManager - play - Error playing sound:', error);
      this.currentSoundId = null;
      this.updatePlayButton(soundId, false);
      // Display error to user
      alert(`Error playing sound: ${(error as Error).message}`);
      throw error;
    }
  }

  private updatePlayButton(soundId: string, isPlaying: boolean) {
    const button = document.querySelector(`[data-sound-id="${soundId}"]`) as HTMLButtonElement;
    if (button) {
      button.textContent = isPlaying ? 'Pause' : 'Play';
      button.classList.remove(isPlaying ? 'bg-green-400' : 'bg-yellow-400');
      button.classList.add(isPlaying ? 'bg-yellow-400' : 'bg-green-400');
      this.soundButtonStates.set(soundId, isPlaying);
    }
  }

  async pause(): Promise<void> {
    console.log('AudioManager - pause - currentSoundId:', this.currentSoundId);
    if (this.currentSoundId) {
      const soundData = this.sounds.get(this.currentSoundId);
      if (soundData?.howl?.playing()) {
        soundData.howl.pause();
        this.updatePlayButton(this.currentSoundId, false);
      }
      this.currentSoundId = null;
    }
  }

  isPlaying(soundId: string): boolean {
    if (!soundId) return false;
    return this.soundButtonStates.get(soundId) || false;
  }

  getCurrentSoundId(): string | null {
    return this.currentSoundId;
  }

  getLoadingState(soundId: string): LoadingState {
    return this.loadingStates.get(soundId) || {
      status: 'idle',
      progress: 0
    };
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
    this.loadingPromises.clear();
    this.loadingStates.clear();
    this.currentSoundId = null;
    console.log('AudioManager - cleanup');
  }
}

export const audioManager = AudioManager.getInstance();