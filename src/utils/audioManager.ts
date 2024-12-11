import { Howl } from 'howler';

class AudioManager {
  private static instance: AudioManager;
  private sounds: Map<string, Howl> = new Map();
  private volume: number = 1.0;

  private constructor() {}

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  getSound(soundFile: string): Howl {
    let sound = this.sounds.get(soundFile);

    if (!sound) {
      sound = new Howl({
        src: [soundFile],
        html5: true,
        volume: this.volume,
      });
      this.sounds.set(soundFile, sound);
    }

    return sound;
  }

  play(soundFile: string): void {
    const sound = this.getSound(soundFile);
    sound.play();
  }

  pause(): void {
    this.sounds.forEach((sound) => {
      if (sound.playing()) {
        sound.pause();
      }
    });
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
}

export const audioManager = AudioManager.getInstance();
