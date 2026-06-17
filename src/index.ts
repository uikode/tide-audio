/**
 * @uikode/tide-audio - Oscillator-based UI feedback sounds
 * Zero dependencies, tree-shakeable, SSR-safe
 */

export type { AudioEngine, AudioPreset, AudioEngineOptions } from "./types";
export { createAudioEngine } from "./engine";
export {
  playTick,
  playSuccess,
  playError,
  playHover,
  playWarning,
  playNotification,
} from "./presets";
export { getVolume, setVolume, mute, unmute, isMuted } from "./volume";
