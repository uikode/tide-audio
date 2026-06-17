import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getVolume,
  initVolume,
  isMuted,
  mute,
  setVolume,
  unmute,
} from "../src/volume";

describe("volume", () => {
  beforeEach(() => {
    // Reset state
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
    initVolume(0.5, "tide-audio-muted");
  });

  describe("getVolume", () => {
    it("should return default volume of 0.5", () => {
      expect(getVolume()).toBe(0.5);
    });

    it("should return custom initial volume", () => {
      initVolume(0.8, "tide-audio-muted");
      expect(getVolume()).toBe(0.8);
    });
  });

  describe("setVolume", () => {
    it("should set volume to valid value", () => {
      setVolume(0.7);
      expect(getVolume()).toBe(0.7);
    });

    it("should accept 0", () => {
      setVolume(0);
      expect(getVolume()).toBe(0);
    });

    it("should accept 1", () => {
      setVolume(1);
      expect(getVolume()).toBe(1);
    });

    it("should throw RangeError for negative value", () => {
      expect(() => setVolume(-0.1)).toThrow(RangeError);
      expect(() => setVolume(-0.1)).toThrow("must be between 0 and 1");
    });

    it("should throw RangeError for value above 1", () => {
      expect(() => setVolume(1.1)).toThrow(RangeError);
      expect(() => setVolume(1.1)).toThrow("must be between 0 and 1");
    });

    it("should throw RangeError for NaN", () => {
      expect(() => setVolume(Number.NaN)).toThrow(RangeError);
      expect(() => setVolume(Number.NaN)).toThrow("must be finite");
    });

    it("should throw RangeError for Infinity", () => {
      expect(() => setVolume(Number.POSITIVE_INFINITY)).toThrow(RangeError);
      expect(() => setVolume(Number.POSITIVE_INFINITY)).toThrow(
        "must be finite",
      );
    });

    it("should throw RangeError for -Infinity", () => {
      expect(() => setVolume(Number.NEGATIVE_INFINITY)).toThrow(RangeError);
      expect(() => setVolume(Number.NEGATIVE_INFINITY)).toThrow(
        "must be finite",
      );
    });
  });

  describe("mute/unmute", () => {
    it("should start unmuted", () => {
      expect(isMuted()).toBe(false);
    });

    it("should mute", () => {
      mute();
      expect(isMuted()).toBe(true);
    });

    it("should unmute after muting", () => {
      mute();
      unmute();
      expect(isMuted()).toBe(false);
    });

    it("should persist mute state to localStorage", () => {
      mute();
      expect(localStorage.getItem("tide-audio-muted")).toBe("1");
    });

    it("should persist unmute state to localStorage", () => {
      mute();
      unmute();
      expect(localStorage.getItem("tide-audio-muted")).toBe("0");
    });

    it("should restore mute state from localStorage on init", () => {
      localStorage.setItem("tide-audio-muted", "1");
      initVolume(0.5, "tide-audio-muted");
      expect(isMuted()).toBe(true);
    });

    it("should use custom storage key", () => {
      initVolume(0.5, "my-custom-key");
      mute();
      expect(localStorage.getItem("my-custom-key")).toBe("1");
    });

    it("should handle localStorage unavailable gracefully", () => {
      vi.stubGlobal("localStorage", undefined);
      initVolume(0.5, "tide-audio-muted");
      // Should not throw
      expect(() => mute()).not.toThrow();
      expect(() => unmute()).not.toThrow();
      expect(isMuted()).toBe(false);
    });
  });
});
