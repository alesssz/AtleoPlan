/*
 * The end of a rest, felt and heard (docs/design/D1-ui.md D1.4.9): a
 * vibration and a short beep, each when the user wants it (Profile:
 * timer_vibration, timer_sound).
 *
 * The beep is made by the browser's Web Audio API, with no sound file: an
 * oscillator plays a tone for a third of a second, twice. The vibration is
 * navigator.vibrate(), which phones with Android support and iPhones ignore.
 * Both are guarded: a browser, or a test, without them gets nothing.
 */

/**
 * Plays the end of a rest.
 * @param options what the user wants: sound, vibration
 */
export function restOver(options: { sound: boolean, vibration: boolean }): void {
  if (options.vibration && typeof navigator.vibrate === 'function') {
    // Vibrate 200 ms, pause 100 ms, vibrate 200 ms
    navigator.vibrate([200, 100, 200])
  }
  if (options.sound && typeof AudioContext === 'function') {
    try {
      beep(new AudioContext())
    }
    catch {
      // No sound allowed now (a page that was never touched): nothing to do
    }
  }
}

/**
 * Two short beeps.
 * @param audio the browser's audio context
 */
function beep(audio: AudioContext): void {
  for (const start of [0, 0.4]) {
    // An oscillator makes the tone; a gain node fades it, so it does not click
    const tone = audio.createOscillator()
    const volume = audio.createGain()
    tone.frequency.value = 880
    volume.gain.setValueAtTime(0.25, audio.currentTime + start)
    volume.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + start + 0.3)
    tone.connect(volume).connect(audio.destination)
    tone.start(audio.currentTime + start)
    tone.stop(audio.currentTime + start + 0.3)
  }
}
