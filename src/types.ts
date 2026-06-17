/** Configuration for a single audio preset */
export interface AudioPreset {
  /** Oscillator type */
  type: OscillatorType;
  /** Frequency in Hz */
  frequency: number;
  /** Duration in milliseconds */
  duration: number;
  /** Optional second frequency for sweep effects */
  endFrequency?: number;
  /** Gain (0-1) relative to master volume */
  gain?: number;
}

/** Options for creating an audio engine */
export interface AudioEngineOptions {
  /** Storage key for persisting mute state (default: 'tide-audio-muted') */
  storageKey?: string;
  /** Initial volume 0-1 (default: 0.5) */
  initialVolume?: number;
}

/** The audio engine instance */
export interface AudioEngine {
  /** Play a custom preset */
  play(preset: AudioPreset): void;
  /** Play tick sound */
  playTick(): void;
  /** Play success sound */
  playSuccess(): void;
  /** Play error sound */
  playError(): void;
  /** Play hover sound */
  playHover(): void;
  /** Play warning sound */
  playWarning(): void;
  /** Play notification sound */
  playNotification(): void;
  /** Get current volume (0-1) */
  getVolume(): number;
  /** Set volume (0-1) */
  setVolume(v: number): void;
  /** Mute audio */
  mute(): void;
  /** Unmute audio */
  unmute(): void;
  /** Check if muted */
  isMuted(): boolean;
  /** Dispose and release AudioContext */
  dispose(): void;
}
