import { describe, test, expect, beforeEach, vi, afterEach } from "vitest"
import {
  setVolume,
  getVolume,
  mute,
  unmute,
  isMuted,
  toggleMute,
} from "../src/volume"

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value }),
    removeItem: vi.fn((key: string) => { delete store[key] }),
    clear: () => { store = {} },
  }
})()

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock })

describe("tide-audio volume", () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
    unmute()
    setVolume(0.3)
  })

  test("default volume is 0.3", () => {
    expect(getVolume()).toBe(0.3)
  })

  test("setVolume clamps to 0-1", () => {
    setVolume(1.5)
    expect(getVolume()).toBe(1)
    setVolume(-0.5)
    expect(getVolume()).toBe(0)
  })

  test("setVolume to exact boundaries", () => {
    setVolume(0)
    expect(getVolume()).toBe(0)
    setVolume(1)
    expect(getVolume()).toBe(1)
  })

  test("setVolume ignores NaN", () => {
    setVolume(0.5)
    setVolume(NaN)
    expect(getVolume()).toBe(0.5)
  })

  test("setVolume ignores Infinity", () => {
    setVolume(0.5)
    setVolume(Infinity)
    expect(getVolume()).toBe(0.5)
    setVolume(-Infinity)
    expect(getVolume()).toBe(0.5)
  })

  test("mute returns 0 volume", () => {
    setVolume(0.5)
    mute()
    expect(getVolume()).toBe(0)
    expect(isMuted()).toBe(true)
  })

  test("unmute restores volume", () => {
    setVolume(0.7)
    mute()
    unmute()
    expect(getVolume()).toBe(0.7)
  })

  test("toggleMute flips state", () => {
    expect(isMuted()).toBe(false)
    toggleMute()
    expect(isMuted()).toBe(true)
    toggleMute()
    expect(isMuted()).toBe(false)
  })
})

describe("tide-audio localStorage persistence", () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
    unmute()
    setVolume(0.3)
  })

  test("mute persists to localStorage", () => {
    mute()
    expect(localStorageMock.setItem).toHaveBeenCalledWith("tide-audio-muted", "true")
  })

  test("unmute removes from localStorage", () => {
    mute()
    unmute()
    expect(localStorageMock.removeItem).toHaveBeenCalledWith("tide-audio-muted")
  })

  test("toggleMute persists state", () => {
    toggleMute() // now muted
    expect(localStorageMock.setItem).toHaveBeenCalledWith("tide-audio-muted", "true")
    vi.clearAllMocks()
    toggleMute() // now unmuted
    expect(localStorageMock.removeItem).toHaveBeenCalledWith("tide-audio-muted")
  })
})

describe("tide-audio presets (smoke)", () => {
  test("exports all preset functions", async () => {
    const mod = await import("../src/presets")
    expect(typeof mod.playTick).toBe("function")
    expect(typeof mod.playSuccess).toBe("function")
    expect(typeof mod.playError).toBe("function")
    expect(typeof mod.playWarning).toBe("function")
    expect(typeof mod.playNavigate).toBe("function")
    expect(typeof mod.playPublish).toBe("function")
  })
})

describe("tide-audio index exports", () => {
  test("exports all public API", async () => {
    const mod = await import("../src/index")
    // Volume
    expect(typeof mod.setVolume).toBe("function")
    expect(typeof mod.getVolume).toBe("function")
    expect(typeof mod.mute).toBe("function")
    expect(typeof mod.unmute).toBe("function")
    expect(typeof mod.isMuted).toBe("function")
    expect(typeof mod.toggleMute).toBe("function")
    // Context
    expect(typeof mod.getAudioContext).toBe("function")
    expect(typeof mod.resumeAudio).toBe("function")
    // Presets
    expect(typeof mod.playTick).toBe("function")
    expect(typeof mod.playSuccess).toBe("function")
    expect(typeof mod.playError).toBe("function")
    expect(typeof mod.playWarning).toBe("function")
    expect(typeof mod.playNavigate).toBe("function")
    expect(typeof mod.playPublish).toBe("function")
    // Init
    expect(typeof mod.initOnInteraction).toBe("function")
  })
})
