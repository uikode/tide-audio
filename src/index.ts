// @uikode/tide-audio — Web Audio UI feedback sounds
// Zero dependencies, oscillator synthesis only

import { resumeAudio } from "./context"

export { getAudioContext, resumeAudio } from "./context"
export {
  setVolume,
  getVolume,
  mute,
  unmute,
  isMuted,
  toggleMute,
} from "./volume"
export {
  playTick,
  playSuccess,
  playError,
  playWarning,
  playNavigate,
  playPublish,
} from "./presets"

/**
 * Initialize audio context on first user interaction.
 * Call once at app startup — handles browser autoplay policy.
 * Returns cleanup function to remove listeners.
 */
export function initOnInteraction(): () => void {
  const handler = () => {
    resumeAudio()
    document.removeEventListener("click", handler)
    document.removeEventListener("keydown", handler)
  }
  document.addEventListener("click", handler, { once: true })
  document.addEventListener("keydown", handler, { once: true })
  return () => {
    document.removeEventListener("click", handler)
    document.removeEventListener("keydown", handler)
  }
}
