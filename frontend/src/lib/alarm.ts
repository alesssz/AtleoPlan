/*
 * The signals of workout mode, felt and heard, as the user's timer_vibration
 * and timer_sound ask: the end of a rest or of a hold, and the countdown
 * before a timed set. The tones are synthesised, with no sound file; iPhones
 * ignore navigator.vibrate(). Both are guarded, so a browser or a test
 * without them gets nothing.
 */

interface AlarmOptions {
  sound: boolean
  vibration: boolean
}

/** A tone: when it starts after now, its pitch and its length, in seconds and Hz. */
interface Tone {
  start: number
  frequency: number
  length: number
}

/** The end of a rest, or a hold reaching its target: two short beeps. */
export function restOver(options: AlarmOptions): void {
  signal(options, [200, 100, 200], [{ start: 0, frequency: 880, length: 0.3 }, { start: 0.4, frequency: 880, length: 0.3 }])
}

/**
 * One step of the countdown before a timed set: a short, lower tick for
 * "3, 2, 1", a longer, higher tone for the start, as a race's lights.
 */
export function countdownStep(options: AlarmOptions, go: boolean): void {
  if (go) signal(options, [300], [{ start: 0, frequency: 1046, length: 0.45 }])
  else signal(options, [60], [{ start: 0, frequency: 660, length: 0.12 }])
}

function signal(options: AlarmOptions, pattern: number[], tones: Tone[]): void {
  if (options.vibration && typeof navigator.vibrate === 'function') {
    navigator.vibrate(pattern)
  }
  if (options.sound && typeof AudioContext === 'function') {
    try {
      play(new AudioContext(), tones)
    }
    catch {
      // Audio is refused on a page that was never touched
    }
  }
}

function play(audio: AudioContext, tones: Tone[]): void {
  for (const { start, frequency, length } of tones) {
    // The fade keeps the tone from clicking
    const tone = audio.createOscillator()
    const volume = audio.createGain()
    tone.frequency.value = frequency
    volume.gain.setValueAtTime(0.25, audio.currentTime + start)
    volume.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + start + length)
    tone.connect(volume).connect(audio.destination)
    tone.start(audio.currentTime + start)
    tone.stop(audio.currentTime + start + length)
  }
}
