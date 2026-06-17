import { PRESETS } from "./presets";
import type { AudioEngine, AudioEngineOptions, AudioPreset } from "./types";
import {
  getVolume,
  initVolume,
  isMuted,
  mute,
  setVolume,
  unmute,
} from "./volume";

const STORAGE_KEY_DEFAULT = "tide-audio-muted";

/**
 * Create an audio engine instance.
 * SSR-safe: returns a no-op engine when AudioContext is unavailable.
 */
export function createAudioEngine(options?: AudioEngineOptions): AudioEngine {
  const storageKey = options?.storageKey ?? STORAGE_KEY_DEFAULT;

  if (options?.initialVolume !== undefined) {
    if (
      !Number.isFinite(options.initialVolume) ||
      options.initialVolume < 0 ||
      options.initialVolume > 1
    ) {
      throw new RangeError(
        `createAudioEngine: initialVolume must be finite between 0 and 1, got ${options.initialVolume}`,
      );
    }
  }

  initVolume(options?.initialVolume ?? 0.5, storageKey);

  let ctx: AudioContext | null = null;

  function getContext(): AudioContext | null {
    if (typeof window === "undefined" || typeof AudioContext === "undefined") {
      return null;
    }
    if (!ctx || ctx.state === "closed") {
      ctx = new AudioContext();
    }
    if (ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
    return ctx;
  }

  function play(preset: AudioPreset): void {
    if (!preset) {
      throw new TypeError("play: preset is required");
    }
    if (!preset.type) {
      throw new TypeError("play: preset.type is required");
    }
    if (!Number.isFinite(preset.frequency) || preset.frequency <= 0) {
      throw new RangeError(
        `play: frequency must be positive finite, got ${preset.frequency}`,
      );
    }
    if (!Number.isFinite(preset.duration) || preset.duration <= 0) {
      throw new RangeError(
        `play: duration must be positive finite, got ${preset.duration}`,
      );
    }
    if (isMuted()) return;

    const audioCtx = getContext();
    if (!audioCtx) return;

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = preset.type;
    oscillator.frequency.setValueAtTime(preset.frequency, audioCtx.currentTime);

    if (
      preset.endFrequency !== undefined &&
      Number.isFinite(preset.endFrequency)
    ) {
      oscillator.frequency.linearRampToValueAtTime(
        preset.endFrequency,
        audioCtx.currentTime + preset.duration / 1000,
      );
    }

    const vol = getVolume() * (preset.gain ?? 1);
    gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      audioCtx.currentTime + preset.duration / 1000,
    );

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + preset.duration / 1000);

    oscillator.onended = () => {
      oscillator.disconnect();
      gainNode.disconnect();
    };
  }

  return {
    play,
    playTick: () => play(PRESETS.tick),
    playSuccess: () => play(PRESETS.success),
    playError: () => play(PRESETS.error),
    playHover: () => play(PRESETS.hover),
    playWarning: () => play(PRESETS.warning),
    playNotification: () => play(PRESETS.notification),
    getVolume,
    setVolume,
    mute,
    unmute,
    isMuted,
    dispose: () => {
      if (ctx && ctx.state !== "closed") {
        ctx.close().catch(() => {});
        ctx = null;
      }
    },
  };
}
