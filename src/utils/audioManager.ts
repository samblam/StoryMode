import { Howl } from 'howler';

interface AudioState {
  volume: number;
  sounds: Map<string, Howl>;
  currentSound: Howl | null;
  currentSoundId: string | null;
}

class AudioManager {
  private static instance: AudioManager;
  private state: AudioState = {
    volume: 1.0,
    sounds: new Map(),
    currentSound: null,
    currentSoundId: null
  };

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  getSound(soundFile: string): Howl {
    if (!this.state.sounds.has(soundFile)) {
      const sound = new Howl({
        src: [soundFile],
        html5: true,
        preload: true,
        volume: this.state.volume,
        onplay: () => {
          this.state.currentSoundId = soundFile;
          this.updatePlayButtons(soundFile, 'Pause');
        },
        onpause: () => {
          this.updatePlayButtons(soundFile, 'Play');
        },
        onend: () => {
          this.state.currentSoundId = null;
          this.updatePlayButtons(soundFile, 'Play');
        },
        onstop: () => {
          this.state.currentSoundId = null;
          this.updatePlayButtons(soundFile, 'Play');
        }
      });
      this.state.sounds.set(soundFile, sound);
    }
    return this.state.sounds.get(soundFile)!;
  }

  private updatePlayButtons(soundFile: string, text: string): void {
    document.querySelectorAll('.play-button').forEach(button => {
      if (button instanceof HTMLElement && button.dataset.sound === soundFile) {
        button.textContent = text;
        if (text === 'Play') {
          button.classList.remove('bg-yellow-400', 'hover:bg-yellow-500');
          button.classList.add('bg-green-400', 'hover:bg-green-500');
        } else {
          button.classList.remove('bg-green-400', 'hover:bg-green-500');
          button.classList.add('bg-yellow-400', 'hover:bg-yellow-500');
        }
      }
    });
  }

  setVolume(volume: number): void {
    this.state.volume = Math.max(0, Math.min(1, volume));
    this.state.sounds.forEach(sound => {
      sound.volume(this.state.volume);
    });
  }

  getVolume(): number {
    return this.state.volume;
  }

  getCurrentSoundId(): string | null {
    return this.state.currentSoundId;
  }

  play(soundFile: string): void {
    if (this.state.currentSound && this.state.currentSoundId !== soundFile) {
      this.state.currentSound.pause();
    }
    const sound = this.getSound(soundFile);
    sound.volume(this.state.volume);
    sound.play();
    this.state.currentSound = sound;
    this.state.currentSoundId = soundFile;
  }

  pause(): void {
    if (this.state.currentSound) {
      this.state.currentSound.pause();
    }
  }

  stop(): void {
    if (this.state.currentSound) {
      this.state.currentSound.stop();
      this.state.currentSound = null;
      this.state.currentSoundId = null;
    }
  }

  seek(position: number): void {
    if (this.state.currentSound) {
      this.state.currentSound.seek(position);
    }
  }

  getCurrentTime(): number {
    return this.state.currentSound ? this.state.currentSound.seek() as number : 0;
  }

  getDuration(): number {
    return this.state.currentSound ? this.state.currentSound.duration() : 0;
  }

  isPlaying(): boolean {
    return this.state.currentSound?.playing() || false;
  }
}

export const audioManager = AudioManager.getInstance();