import { describe, test, expect, beforeEach, vi, afterEach } from "vitest"
import {
  setVolume,
  getVolume,
  mute,
  unmute,
  isMuted,
  initVolume,
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
    initVolume(0.5, "tide-audio-muted")
  })

  test("default volume is 0.5 after init", () => {
    expect(getVolume()).toBe(0.5)
  })

  test("setVolume sets exact value", () => {
    setVolume(0.7)
    expect(getVolume()).toBe(0.7)
  })

  test("setVolume to exact boundaries", () => {
    setVolume(0)
    expect(getVolume()).toBe(0)
    setVolume(1)
    expect(getVolume()).toBe(1)
  })

  test("setVolume throws on value > 1", () => {
    expect(() => setVolume(1.5)).toThrow(RangeError)
    expect(() => setVolume(1.5)).toThrow("must be between 0 and 1")
  })

  test("setVolume throws on negative value", () => {
    expect(() => setVolume(-0.5)).toThrow(RangeError)
    expect(() => setVolume(-0.5)).toThrow("must be between 0 and 1")
  })

  test("setVolume throws on NaN", () => {
    expect(() => setVolume(NaN)).toThrow(RangeError)
    expect(() => setVolume(NaN)).toThrow("must be finite")
  })

  test("setVolume throws on Infinity", () => {
    expect(() => setVolume(Infinity)).toThrow(RangeError)
    expect(() => setVolume(-Infinity)).toThrow(RangeError)
  })

  test("mute sets muted state", () => {
    mute()
    expect(isMuted()).toBe(true)
  })

  test("unmute clears muted state", () => {
    mute()
    unmute()
    expect(isMuted()).toBe(false)
  })

  test("isMuted defaults to false", () => {
    expect(isMuted()).toBe(false)
  })
})

describe("tide-audio localStorage persistence", () => {
  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()
    initVolume(0.5, "tide-audio-muted")
  })

  test("mute persists '1' to localStorage", () => {
    mute()
    expect(localStorageMock.setItem).toHaveBeenCalledWith("tide-audio-muted", "1")
  })

  test("unmute persists '0' to localStorage", () => {
    mute()
    vi.clearAllMocks()
    unmute()
    expect(localStorageMock.setItem).toHaveBeenCalledWith("tide-audio-muted", "0")
  })

  test("custom storage key is used", () => {
    initVolume(0.3, "my-custom-key")
    mute()
    expect(localStorageMock.setItem).toHaveBeenCalledWith("my-custom-key", "1")
  })
})

describe("tide-audio presets", () => {
  test("exports all preset functions", async () => {
    const mod = await import("../src/presets")
    expect(typeof mod.playTick).toBe("function")
    expect(typeof mod.playSuccess).toBe("function")
    expect(typeof mod.playError).toBe("function")
    expect(typeof mod.playHover).toBe("function")
    expect(typeof mod.playWarning).toBe("function")
    expect(typeof mod.playNotification).toBe("function")
  })

  test("playTick returns tick preset config", async () => {
    const { playTick } = await import("../src/presets")
    const preset = playTick()
    expect(preset.type).toBe("sine")
    expect(preset.frequency).toBe(800)
    expect(preset.duration).toBe(50)
  })

  test("playSuccess returns success preset with endFrequency", async () => {
    const { playSuccess } = await import("../src/presets")
    const preset = playSuccess()
    expect(preset.type).toBe("sine")
    expect(preset.frequency).toBe(520)
    expect(preset.endFrequency).toBe(780)
  })

  test("playError returns error preset with square wave", async () => {
    const { playError } = await import("../src/presets")
    const preset = playError()
    expect(preset.type).toBe("square")
    expect(preset.frequency).toBe(200)
  })

  test("playHover returns short high-frequency preset", async () => {
    const { playHover } = await import("../src/presets")
    const preset = playHover()
    expect(preset.type).toBe("sine")
    expect(preset.frequency).toBe(1200)
    expect(preset.duration).toBe(30)
    expect(preset.gain).toBe(0.1)
  })

  test("playWarning returns triangle wave with sweep", async () => {
    const { playWarning } = await import("../src/presets")
    const preset = playWarning()
    expect(preset.type).toBe("triangle")
    expect(preset.frequency).toBe(400)
    expect(preset.endFrequency).toBe(300)
  })

  test("playNotification returns ascending sweep", async () => {
    const { playNotification } = await import("../src/presets")
    const preset = playNotification()
    expect(preset.type).toBe("sine")
    expect(preset.frequency).toBe(600)
    expect(preset.endFrequency).toBe(900)
  })

  test("PRESETS has all 6 entries", async () => {
    const { PRESETS } = await import("../src/presets")
    expect(Object.keys(PRESETS)).toEqual(
      expect.arrayContaining(["tick", "success", "error", "hover", "warning", "notification"])
    )
    expect(Object.keys(PRESETS).length).toBe(6)
  })

  test("all presets have required fields", async () => {
    const { PRESETS } = await import("../src/presets")
    for (const [name, preset] of Object.entries(PRESETS)) {
      expect(preset.type, `${name}.type`).toBeDefined()
      expect(preset.frequency, `${name}.frequency`).toBeGreaterThan(0)
      expect(preset.duration, `${name}.duration`).toBeGreaterThan(0)
    }
  })
})

describe("tide-audio index exports", () => {
  test("exports all public API", async () => {
    const mod = await import("../src/index")
    // Engine
    expect(typeof mod.createAudioEngine).toBe("function")
    // Volume
    expect(typeof mod.setVolume).toBe("function")
    expect(typeof mod.getVolume).toBe("function")
    expect(typeof mod.mute).toBe("function")
    expect(typeof mod.unmute).toBe("function")
    expect(typeof mod.isMuted).toBe("function")
    // Presets
    expect(typeof mod.playTick).toBe("function")
    expect(typeof mod.playSuccess).toBe("function")
    expect(typeof mod.playError).toBe("function")
    expect(typeof mod.playHover).toBe("function")
    expect(typeof mod.playWarning).toBe("function")
    expect(typeof mod.playNotification).toBe("function")
  })
})

describe("tide-audio createAudioEngine", () => {
  let mockOsc: any
  let mockGain: any
  let mockCtx: any

  beforeEach(() => {
    localStorageMock.clear()
    vi.clearAllMocks()

    mockOsc = {
      type: "",
      frequency: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      disconnect: vi.fn(),
      onended: null,
    }

    mockGain = {
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
    }

    mockCtx = {
      currentTime: 0,
      state: "running",
      createOscillator: vi.fn(() => mockOsc),
      createGain: vi.fn(() => mockGain),
      destination: {},
      resume: vi.fn(() => Promise.resolve()),
      close: vi.fn(() => Promise.resolve()),
    }

    // @ts-ignore
    globalThis.AudioContext = vi.fn(() => mockCtx)
    // @ts-ignore
    globalThis.window = {}
  })

  afterEach(() => {
    vi.restoreAllMocks()
    // @ts-ignore
    delete globalThis.window
  })

  test("creates engine with default options", async () => {
    vi.resetModules()
    const { createAudioEngine } = await import("../src/engine")
    const engine = createAudioEngine()
    expect(engine).toBeDefined()
    expect(typeof engine.play).toBe("function")
    expect(typeof engine.playTick).toBe("function")
    expect(typeof engine.dispose).toBe("function")
  })

  test("throws on invalid initialVolume", async () => {
    vi.resetModules()
    const { createAudioEngine } = await import("../src/engine")
    expect(() => createAudioEngine({ initialVolume: 2 })).toThrow(RangeError)
    expect(() => createAudioEngine({ initialVolume: -1 })).toThrow(RangeError)
    expect(() => createAudioEngine({ initialVolume: NaN })).toThrow(RangeError)
  })

  test("engine.play creates oscillator and gain nodes", async () => {
    vi.resetModules()
    const { createAudioEngine } = await import("../src/engine")
    const engine = createAudioEngine({ initialVolume: 0.5 })
    engine.play({ type: "sine", frequency: 440, duration: 100, gain: 0.5 })

    expect(mockCtx.createOscillator).toHaveBeenCalled()
    expect(mockCtx.createGain).toHaveBeenCalled()
    expect(mockOsc.type).toBe("sine")
    expect(mockOsc.frequency.setValueAtTime).toHaveBeenCalledWith(440, 0)
    expect(mockOsc.connect).toHaveBeenCalledWith(mockGain)
    expect(mockGain.connect).toHaveBeenCalledWith(mockCtx.destination)
    expect(mockOsc.start).toHaveBeenCalled()
    expect(mockOsc.stop).toHaveBeenCalled()
  })

  test("engine.play does not play when muted", async () => {
    vi.resetModules()
    const { createAudioEngine } = await import("../src/engine")
    const engine = createAudioEngine({ initialVolume: 0.5 })
    engine.mute()
    engine.play({ type: "sine", frequency: 440, duration: 100 })

    expect(mockCtx.createOscillator).not.toHaveBeenCalled()
  })

  test("engine.play throws on missing preset", async () => {
    vi.resetModules()
    const { createAudioEngine } = await import("../src/engine")
    const engine = createAudioEngine()
    // @ts-ignore - testing runtime validation
    expect(() => engine.play(null)).toThrow(TypeError)
  })

  test("engine.play throws on invalid frequency", async () => {
    vi.resetModules()
    const { createAudioEngine } = await import("../src/engine")
    const engine = createAudioEngine()
    expect(() => engine.play({ type: "sine", frequency: -1, duration: 100 })).toThrow(RangeError)
    expect(() => engine.play({ type: "sine", frequency: 0, duration: 100 })).toThrow(RangeError)
  })

  test("engine.play throws on invalid duration", async () => {
    vi.resetModules()
    const { createAudioEngine } = await import("../src/engine")
    const engine = createAudioEngine()
    expect(() => engine.play({ type: "sine", frequency: 440, duration: 0 })).toThrow(RangeError)
    expect(() => engine.play({ type: "sine", frequency: 440, duration: -50 })).toThrow(RangeError)
  })

  test("engine.play applies endFrequency sweep", async () => {
    vi.resetModules()
    const { createAudioEngine } = await import("../src/engine")
    const engine = createAudioEngine({ initialVolume: 0.5 })
    engine.play({ type: "sine", frequency: 440, duration: 100, endFrequency: 880 })

    expect(mockOsc.frequency.linearRampToValueAtTime).toHaveBeenCalledWith(880, 0.1)
  })

  test("engine.dispose closes AudioContext", async () => {
    vi.resetModules()
    const { createAudioEngine } = await import("../src/engine")
    const engine = createAudioEngine({ initialVolume: 0.5 })
    // Trigger context creation
    engine.play({ type: "sine", frequency: 440, duration: 100 })
    engine.dispose()
    expect(mockCtx.close).toHaveBeenCalled()
  })

  test("engine.playTick calls play with tick preset", async () => {
    vi.resetModules()
    const { createAudioEngine } = await import("../src/engine")
    const engine = createAudioEngine({ initialVolume: 0.5 })
    engine.playTick()

    expect(mockOsc.type).toBe("sine")
    expect(mockOsc.frequency.setValueAtTime).toHaveBeenCalledWith(800, 0)
  })
})
