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

// --- AudioContext mock tests for presets ---

describe("tide-audio presets with AudioContext mock", () => {
  let mockOsc: any
  let mockGain: any
  let mockCtx: any

  beforeEach(() => {
    unmute()
    setVolume(0.5)

    mockOsc = {
      type: "",
      frequency: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    }

    mockGain = {
      gain: {
        setValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
    }

    mockCtx = {
      currentTime: 0,
      createOscillator: vi.fn(() => mockOsc),
      createGain: vi.fn(() => mockGain),
      destination: {},
      resume: vi.fn(() => Promise.resolve()),
    }

    // @ts-ignore - mocking AudioContext
    globalThis.AudioContext = vi.fn(() => mockCtx)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test("playTick creates oscillator with sine wave at 1200Hz", async () => {
    // Reset module to get fresh AudioContext
    vi.resetModules()
    const { playTick } = await import("../src/presets")
    const { setVolume: sv, unmute: um } = await import("../src/volume")
    um()
    sv(0.5)

    playTick()

    expect(mockCtx.createOscillator).toHaveBeenCalled()
    expect(mockCtx.createGain).toHaveBeenCalled()
    expect(mockOsc.type).toBe("sine")
    expect(mockOsc.frequency.setValueAtTime).toHaveBeenCalledWith(1200, 0)
    expect(mockOsc.connect).toHaveBeenCalledWith(mockGain)
    expect(mockGain.connect).toHaveBeenCalledWith(mockCtx.destination)
    expect(mockOsc.start).toHaveBeenCalled()
    expect(mockOsc.stop).toHaveBeenCalled()
  })

  test("playError creates oscillator with sawtooth wave at 200Hz with ramp", async () => {
    vi.resetModules()
    const { playError } = await import("../src/presets")
    const { setVolume: sv, unmute: um } = await import("../src/volume")
    um()
    sv(0.5)

    playError()

    expect(mockOsc.type).toBe("sawtooth")
    expect(mockOsc.frequency.setValueAtTime).toHaveBeenCalledWith(200, 0)
    expect(mockOsc.frequency.linearRampToValueAtTime).toHaveBeenCalledWith(150, 0.15)
  })

  test("presets do not play when muted", async () => {
    vi.resetModules()
    const { playTick } = await import("../src/presets")
    const { mute: m } = await import("../src/volume")
    m()

    playTick()

    expect(mockCtx.createOscillator).not.toHaveBeenCalled()
  })

  test("presets do not play when volume is 0", async () => {
    vi.resetModules()
    const { playTick } = await import("../src/presets")
    const { setVolume: sv, unmute: um } = await import("../src/volume")
    um()
    sv(0)

    playTick()

    expect(mockCtx.createOscillator).not.toHaveBeenCalled()
  })

  test("playNavigate uses sine at 800Hz with short duration", async () => {
    vi.resetModules()
    const { playNavigate } = await import("../src/presets")
    const { setVolume: sv, unmute: um } = await import("../src/volume")
    um()
    sv(0.5)

    playNavigate()

    expect(mockOsc.type).toBe("sine")
    expect(mockOsc.frequency.setValueAtTime).toHaveBeenCalledWith(800, 0)
    expect(mockOsc.stop).toHaveBeenCalledWith(0.03)
  })
})

describe("tide-audio context", () => {
  test("getAudioContext creates singleton", async () => {
    vi.resetModules()
    const mockCtx = { resume: vi.fn(() => Promise.resolve()) }
    // @ts-ignore
    globalThis.AudioContext = vi.fn(() => mockCtx)

    const { getAudioContext } = await import("../src/context")
    const ctx1 = getAudioContext()
    const ctx2 = getAudioContext()
    expect(ctx1).toBe(ctx2)
    expect(globalThis.AudioContext).toHaveBeenCalledTimes(1)
  })

  test("resumeAudio calls resume on context", async () => {
    vi.resetModules()
    const mockCtx = { resume: vi.fn(() => Promise.resolve()) }
    // @ts-ignore
    globalThis.AudioContext = vi.fn(() => mockCtx)

    const { resumeAudio } = await import("../src/context")
    await resumeAudio()
    expect(mockCtx.resume).toHaveBeenCalled()
  })
})
