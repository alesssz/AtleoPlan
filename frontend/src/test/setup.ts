/*
 * Before every test file.
 */

import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
import i18n from '@/i18n'

// jsdom has no ResizeObserver, which Radix's Checkbox uses: without it every
// test drawing the exercise editor fails
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
}

// Missing from jsdom and called by Radix's Select when it opens
Element.prototype.hasPointerCapture ??= () => false
Element.prototype.releasePointerCapture ??= () => {}
Element.prototype.scrollIntoView ??= () => {}

// English, whatever the computer's language, unless a test switches
beforeEach(async () => {
  await i18n.changeLanguage('en')
})

// Restores stubbed globals such as fetch(), and forgets cookies and the
// saved theme
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  localStorage.clear()
})
