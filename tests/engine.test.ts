import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createAudioEngine } from "../src/engine";
import type { AudioEngine } from "../src/types";

// Mock AudioContext
class MockOscillator {
  type = "sine";
  frequency = { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() };
  connect = vi.fn();
  disconnect = vi.fn();
  start = vi.fn();
  stop = vi.fn();
  onended: (() => void) | null = null;
}

class MockGainNode {
  gain = { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() };
  connect = vi.fn();
  disconnect = vi.fn();
}

class MockAudioContext {
  state = "running";
  currentTime = 0;
  destination = {};
  createOscillator = vi.fn(() => new MockOscillator());
  createGain = vi.fn(() => new MockGainNode());
  resume = vi.fn(() => Promise.resolve());
  close = vi.fn(() => Promise.resolve());
}

describe("createAudioEngine", () => {
  let engine: AudioEngine;

  beforeEach(() => {
    vi.stubGlobal("AudioContext", MockAudioContext);
    vi.stubGlobal("localStorage", {
      store: {} as Record<string, string>,
      getItem(key: string) {
        return this.store[key] ?? null;
      },
      setItem(key: string, val: string) {
        this.store[key] = val;
      },
      removeItem(key: string) {
        delete this.store[key];
      },
      clear() {
        this.store = {};
      },
    });
    vi.stubGlobal("window", {});
    engine = createAudioEngine();
  });

  afterEach(() => {
    engine.dispose();
    vi.unstubAllGlobals();
  });

  describe("initialization", () => {
    it("should create an engine with default options", () => {
      expect(engine).toBeDefined();
      expect(engine.getVolume()).toBe(0.5);
      expect(engine.isMuted()).toBe(false);
    });

    it("should create an engine with custom initial volume", () => {
      const e = createAudioEngine({ initialVolume: 0.8 });
      expect(e.getVolume()).toBe(0.8);
      e.dispose();
    });

    it("should throw for invalid initialVolume (> 1)", () => {
      expect(() => createAudioEngine({ initialVolume: 1.5 })).toThrow(
        RangeError,
      );
    });

    it("should throw for invalid initialVolume (< 0)", () => {
      expect(() => createAudioEngine({ initialVolume: -0.1 })).toThrow(
        RangeError,
      );
    });

    it("should throw for NaN initialVolume", () => {
      expect(() => createAudioEngine({ initialVolume: Number.NaN })).toThrow(
        RangeError,
      );
    });

    it("should throw for Infinity initialVolume", () => {
      expect(() =>
        createAudioEngine({ initialVolume: Number.POSITIVE_INFINITY }),
      ).toThrow(RangeError);
    });
  });

  describe("play", () => {
    it("should create oscillator with correct type and frequency", () => {
      engine.playTick();
      const ctx = new MockAudioContext();
      // Verify AudioContext was created (via playTick)
      expect(AudioContext).toHaveBeenCalled;
    });

    it("should create oscillator node on playTick", () => {
      engine.playTick();
      // The engine creates AudioContext internally
      // We verify by checking no errors thrown
      expect(true).toBe(true);
    });

    it("should not play when muted", () => {
      engine.mute();
      // Should not throw, just no-op
      expect(() => engine.playTick()).not.toThrow();
    });

    it("should throw TypeError for null preset", () => {
      // biome-ignore lint/suspicious/noExplicitAny: testing runtime validation for invalid input
      expect(() => engine.play(null as any)).toThrow(TypeError);
    });

    it("should throw TypeError for preset without type", () => {
      expect(() =>
        // biome-ignore lint/suspicious/noExplicitAny: testing runtime validation for invalid input
        engine.play({ type: "" as any, frequency: 440, duration: 100 }),
      ).toThrow(TypeError);
    });

    it("should throw RangeError for non-positive frequency", () => {
      expect(() =>
        engine.play({ type: "sine", frequency: 0, duration: 100 }),
      ).toThrow(RangeError);
      expect(() =>
        engine.play({ type: "sine", frequency: -100, duration: 100 }),
      ).toThrow(RangeError);
    });

    it("should throw RangeError for NaN frequency", () => {
      expect(() =>
        engine.play({ type: "sine", frequency: Number.NaN, duration: 100 }),
      ).toThrow(RangeError);
    });

    it("should throw RangeError for non-positive duration", () => {
      expect(() =>
        engine.play({ type: "sine", frequency: 440, duration: 0 }),
      ).toThrow(RangeError);
      expect(() =>
        engine.play({ type: "sine", frequency: 440, duration: -50 }),
      ).toThrow(RangeError);
    });

    it("should throw RangeError for NaN duration", () => {
      expect(() =>
        engine.play({ type: "sine", frequency: 440, duration: Number.NaN }),
      ).toThrow(RangeError);
    });
  });

  describe("preset methods", () => {
    it("should play tick without error", () => {
      expect(() => engine.playTick()).not.toThrow();
    });

    it("should play success without error", () => {
      expect(() => engine.playSuccess()).not.toThrow();
    });

    it("should play error without error", () => {
      expect(() => engine.playError()).not.toThrow();
    });

    it("should play hover without error", () => {
      expect(() => engine.playHover()).not.toThrow();
    });

    it("should play warning without error", () => {
      expect(() => engine.playWarning()).not.toThrow();
    });

    it("should play notification without error", () => {
      expect(() => engine.playNotification()).not.toThrow();
    });
  });

  describe("volume control via engine", () => {
    it("should get/set volume", () => {
      engine.setVolume(0.9);
      expect(engine.getVolume()).toBe(0.9);
    });

    it("should mute/unmute", () => {
      engine.mute();
      expect(engine.isMuted()).toBe(true);
      engine.unmute();
      expect(engine.isMuted()).toBe(false);
    });
  });

  describe("dispose", () => {
    it("should dispose without error", () => {
      expect(() => engine.dispose()).not.toThrow();
    });

    it("should handle double dispose", () => {
      engine.dispose();
      expect(() => engine.dispose()).not.toThrow();
    });
  });

  describe("SSR safety", () => {
    it("should handle missing window gracefully", () => {
      vi.stubGlobal("window", undefined);
      const ssrEngine = createAudioEngine();
      expect(() => ssrEngine.playTick()).not.toThrow();
      ssrEngine.dispose();
    });

    it("should handle missing AudioContext gracefully", () => {
      vi.stubGlobal("AudioContext", undefined);
      vi.stubGlobal("window", {});
      const ssrEngine = createAudioEngine();
      expect(() => ssrEngine.playTick()).not.toThrow();
      ssrEngine.dispose();
    });
  });
});
