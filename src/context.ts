// AudioContext singleton — lazy init, resumed on user interaction
let ctx: AudioContext | null = null

export function getAudioContext(): AudioContext {
  if (!ctx) ctx = new AudioContext()
  return ctx
}

export function resumeAudio(): Promise<void> {
  return getAudioContext().resume()
}
