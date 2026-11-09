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

// jsdom, the fake browser of the tests, has no ResizeObserver, the browser's
// way to be told when an element changes size. Radix's Checkbox
// (src/components/ui/checkbox.tsx) uses one, so without this every test
// drawing the exercise editor fails with "ResizeObserver is not defined"
// (docs/how-to/H3-frontend.md H3.12.7). Real browsers all have it; here a
// version that does nothing is enough, since tests never resize anything.
// globalThis is the global object: in a browser, `window`
globalThis.ResizeObserver ??= class {
  /** Starts watching an element: nothing to do in tests. */
  observe() {}
  /** Stops watching an element. */
  unobserve() {}
  /** Stops watching everything. */
  disconnect() {}
}

// Three more things jsdom lacks, which Radix's Select (src/components/ui/
// select.tsx, the Profile's pickers) calls when it opens: whether an element
// holds the pointer, letting it go, and scrolling the chosen option into
// view. Without them, a click on a Select in a test fails with
// "target.hasPointerCapture is not a function" (docs/how-to/H3-frontend.md
// H3.21). Doing nothing is enough here, as for ResizeObserver.
// Element.prototype: what every element of the page inherits
Element.prototype.hasPointerCapture ??= () => false
Element.prototype.releasePointerCapture ??= () => {}
Element.prototype.scrollIntoView ??= () => {}

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
