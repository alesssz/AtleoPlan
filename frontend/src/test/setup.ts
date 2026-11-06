/*
 * Runs before every test file (vite.config.ts → test.setupFiles): settings
 * shared by all the tests, so no test file has to repeat them.
 * Tests and checks: docs/concepts/C1-frontend.md C1.10.
 */
// Adds DOM matchers to Vitest's expect(): toBeInTheDocument(),
// toHaveAttribute()… (imported for its effect only, no names)
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, vi } from 'vitest'
// A *default* import: the file's one main export, named here as we like
// (no braces). src/i18n/index.ts ends with `export default i18n`.
import i18n from '@/i18n'

// beforeEach(fn) runs fn before each test (`it(…)`) of every file.
// `async () => { … }` is an arrow function (a short way to write a function)
// marked async: inside it, `await` pauses until a Promise (a value that
// arrives later) is ready; Vitest waits for it before starting the test.
// Tests run in English unless they switch language themselves, whatever the
// language of the computer running them
beforeEach(async () => {
  await i18n.changeLanguage('en')
})

// afterEach(fn) runs fn after each test.
// Removes what a test rendered, so the next test starts from an empty page;
// restores anything replaced with vi.stubGlobal, such as fetch(); and forgets
// cookies, such as the CSRF one, and the saved theme
afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  document.cookie = 'XSRF-TOKEN=; expires=Thu, 01 Jan 1970 00:00:00 GMT'
  localStorage.clear()
})
