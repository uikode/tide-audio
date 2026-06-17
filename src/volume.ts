// Volume control — global state for all tide-audio presets
// Mute state persisted to localStorage for cross-session memory

const STORAGE_KEY = "tide-audio-muted"

let _volume = 0.3
let _muted = loadMutedState()

function loadMutedState(): boolean {
  if (typeof globalThis.localStorage === "undefined") return false
  try {
    return localStorage.getItem(STORAGE_KEY) === "true"
  } catch {
    return false
  }
}

function persistMutedState(muted: boolean): void {
  if (typeof globalThis.localStorage === "undefined") return
  try {
    if (muted) {
      localStorage.setItem(STORAGE_KEY, "true")
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // Storage full or blocked — silently ignore
  }
}

export function setVolume(v: number): void {
  if (!Number.isFinite(v)) return
  _volume = Math.max(0, Math.min(1, v))
}

export function getVolume(): number {
  return _muted ? 0 : _volume
}

export function mute(): void {
  _muted = true
  persistMutedState(true)
}

export function unmute(): void {
  _muted = false
  persistMutedState(false)
}

export function isMuted(): boolean {
  return _muted
}

export function toggleMute(): void {
  _muted = !_muted
  persistMutedState(_muted)
}
