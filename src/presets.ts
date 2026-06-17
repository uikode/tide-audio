// Sound presets — short oscillator-based UI feedback sounds
// NO .mp3/.wav/.ogg files — Web Audio API synthesis only
import { getAudioContext } from "./context"
import { getVolume } from "./volume"

interface ToneConfig {
  frequency: number
  duration: number
  type: OscillatorType
  ramp?: number // frequency ramp target
}

function playTone(config: ToneConfig): void {
  const vol = getVolume()
  if (vol === 0) return

  const ctx = getAudioContext()
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = config.type
  osc.frequency.setValueAtTime(config.frequency, ctx.currentTime)
  if (config.ramp) {
    osc.frequency.linearRampToValueAtTime(
      config.ramp,
      ctx.currentTime + config.duration
    )
  }

  gain.gain.setValueAtTime(vol * 0.3, ctx.currentTime)
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    ctx.currentTime + config.duration
  )

  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start()
  osc.stop(ctx.currentTime + config.duration)
}

/** Short click feedback (~50ms) */
export function playTick(): void {
  playTone({ frequency: 1200, duration: 0.05, type: "sine" })
}

/** Rising two-tone: C5 → E5 (~180ms) */
export function playSuccess(): void {
  playTone({ frequency: 523, duration: 0.1, type: "sine" })
  setTimeout(
    () => playTone({ frequency: 659, duration: 0.15, type: "sine" }),
    80
  )
}

/** Low descending buzz (~150ms) */
export function playError(): void {
  playTone({ frequency: 200, duration: 0.15, type: "sawtooth", ramp: 150 })
}

/** Mid-tone double pulse (~200ms) */
export function playWarning(): void {
  playTone({ frequency: 440, duration: 0.08, type: "triangle" })
  setTimeout(
    () => playTone({ frequency: 440, duration: 0.08, type: "triangle" }),
    120
  )
}

/** Soft navigation click (~30ms) */
export function playNavigate(): void {
  playTone({ frequency: 800, duration: 0.03, type: "sine" })
}

/** Celebration arpeggio: C-E-G-C (~300ms) */
export function playPublish(): void {
  const notes = [523, 659, 784, 1047]
  notes.forEach((freq, i) => {
    setTimeout(
      () => playTone({ frequency: freq, duration: 0.12, type: "sine" }),
      i * 60
    )
  })
}
