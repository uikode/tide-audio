const STORAGE_KEY_DEFAULT = "tide-audio-muted";

let _volume = 0.5;
let _muted = false;
let _storageKey = STORAGE_KEY_DEFAULT;

/**
 * Initialize volume state. Restores mute from localStorage if available.
 */
export function initVolume(initialVolume: number, storageKey: string): void {
  _volume = initialVolume;
  _storageKey = storageKey;
  _muted = loadMuteState();
}

/**
 * Get the current volume (0-1).
 */
export function getVolume(): number {
  return _volume;
}

/**
 * Set volume. Must be a finite number between 0 and 1.
 */
export function setVolume(v: number): void {
  if (!Number.isFinite(v)) {
    throw new RangeError(`setVolume: value must be finite, got ${v}`);
  }
  if (v < 0 || v > 1) {
    throw new RangeError(`setVolume: value must be between 0 and 1, got ${v}`);
  }
  _volume = v;
}

/**
 * Mute audio output. Persists to localStorage.
 */
export function mute(): void {
  _muted = true;
  saveMuteState(true);
}

/**
 * Unmute audio output. Persists to localStorage.
 */
export function unmute(): void {
  _muted = false;
  saveMuteState(false);
}

/**
 * Check if audio is currently muted.
 */
export function isMuted(): boolean {
  return _muted;
}

function saveMuteState(muted: boolean): void {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(_storageKey, muted ? "1" : "0");
    }
  } catch {
    // localStorage unavailable (SSR, private browsing)
  }
}

function loadMuteState(): boolean {
  try {
    if (typeof localStorage !== "undefined") {
      return localStorage.getItem(_storageKey) === "1";
    }
  } catch {
    // localStorage unavailable
  }
  return false;
}
