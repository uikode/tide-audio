import type { AudioPreset } from "./types";

/** Built-in audio presets */
export const PRESETS: Record<string, AudioPreset> = {
  tick: {
    type: "sine",
    frequency: 800,
    duration: 50,
    gain: 0.3,
  },
  success: {
    type: "sine",
    frequency: 520,
    duration: 150,
    endFrequency: 780,
    gain: 0.4,
  },
  error: {
    type: "square",
    frequency: 200,
    duration: 200,
    gain: 0.3,
  },
  hover: {
    type: "sine",
    frequency: 1200,
    duration: 30,
    gain: 0.1,
  },
  warning: {
    type: "triangle",
    frequency: 400,
    duration: 180,
    endFrequency: 300,
    gain: 0.35,
  },
  notification: {
    type: "sine",
    frequency: 600,
    duration: 120,
    endFrequency: 900,
    gain: 0.4,
  },
};

/** Play a tick sound using the default engine */
export function playTick(): AudioPreset {
  return PRESETS.tick;
}

/** Play a success sound using the default engine */
export function playSuccess(): AudioPreset {
  return PRESETS.success;
}

/** Play an error sound using the default engine */
export function playError(): AudioPreset {
  return PRESETS.error;
}

/** Play a hover sound using the default engine */
export function playHover(): AudioPreset {
  return PRESETS.hover;
}

/** Play a warning sound using the default engine */
export function playWarning(): AudioPreset {
  return PRESETS.warning;
}

/** Play a notification sound using the default engine */
export function playNotification(): AudioPreset {
  return PRESETS.notification;
}
