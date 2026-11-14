/*
 * The end of a rest, felt and heard, as the user's timer_vibration and
 * timer_sound ask. The beep is synthesised, with no sound file; iPhones ignore
 * navigator.vibrate(). Both are guarded, so a browser or a test without them
 * gets nothing.
 */

export function restOver(options: { sound: boolean, vibration: boolean }): void {
  if (options.vibration && typeof navigator.vibrate === 'function') {
    navigator.vibrate([200, 100, 200])
  }
  if (options.sound && typeof AudioContext === 'function') {
    try {
      beep(new AudioContext())
    }
    catch {
      // Audio is refused on a page that was never touched
    }
  }
}

/** Two short beeps. */
function beep(audio: AudioContext): void {
  for (const start of [0, 0.4]) {
    // The fade keeps the tone from clicking
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
