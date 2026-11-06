/*
 * The theme's plain logic, without React: which themes exist, where the
 * choice is saved, and how it is applied to the page. The React side
 * (ThemeProvider, useTheme) builds on this. docs/concepts/C1-frontend.md C1.8.
 *
 * Applying a theme = putting or removing the `dark` class on <html>; the
 * colours follow from src/index.css, and Tailwind's `dark:` classes switch
 * on inside it. index.html has a copy of the first lines of this logic,
 * run before React loads (keep the two in step).
 */

/**
 * The choices offered in Profile; 'system' follows the device's setting.
 * `as const` freezes the array and keeps its exact values as its type
 * (readonly ['dark', 'light', 'system']) instead of a loose string[], so
 * the Theme type below can be derived from it.
 */
export const THEMES = ['dark', 'light', 'system'] as const

/**
 * One of THEMES: 'dark' | 'light' | 'system'. `typeof THEMES` is the type
 * of the array; `[number]` asks for the type of its elements (whatever a
 * numeric index returns). One list, so a new theme is added in one place.
 */
export type Theme = (typeof THEMES)[number]

/** Dark is the default (docs/design/D1-ui.md D1.1, principle 5). */
export const DEFAULT_THEME: Theme = 'dark'

/** The localStorage entry holding the choice (also read by index.html). */
export const THEME_STORAGE_KEY = 'atleoplan.theme'

/** The device's "dark mode" setting, as a media query. */
const DARK_QUERY = '(prefers-color-scheme: dark)'

/** Status-bar colour of each theme on phones: the theme's background. */
const THEME_COLORS = { dark: '#0B0B0F', light: '#FFFFFF' }

/**
 * True when `value` is one of THEMES. The return type `value is Theme`
 * makes this a type guard: after `if (isTheme(x))`, TypeScript knows x is a
 * Theme, not just any string. `value as Theme` silences a type complaint of
 * includes(); the check itself happens at runtime.
 */
function isTheme(value: string | null): value is Theme {
  return THEMES.includes(value as Theme)
}

/**
 * The saved choice, or the default when nothing (valid) is saved.
 * @returns the theme to start with
 */
export function readStoredTheme(): Theme {
  try {
    // The raw saved value, possibly null or stale
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return isTheme(stored) ? stored : DEFAULT_THEME
  }
  catch {
    // localStorage can be blocked (private mode, some settings)
    return DEFAULT_THEME
  }
}

/**
 * Saves the choice for the next visit; a blocked localStorage is ignored.
 * @param theme the choice to save
 */
export function storeTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }
  catch {
    // Nothing to do: the theme still applies until the page is closed
  }
}

/** Whether the device is set to dark mode right now. */
export function systemPrefersDark(): boolean {
  return window.matchMedia(DARK_QUERY).matches
}

/**
 * Calls `onChange` whenever the device switches between dark and light
 * mode; returns the function that stops listening. The types say it:
 * `onChange: () => void` is a function taking nothing and returning
 * nothing, and the result `() => void` is one too.
 * @param onChange called on every switch
 * @returns the function that removes the listener
 */
export function watchSystemTheme(onChange: () => void): () => void {
  // The media query object, which fires 'change' events
  const query = window.matchMedia(DARK_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

/**
 * Applies a theme to the page: the `dark` class on <html> and the status-bar colour.
 * @param theme the theme to apply
 */
export function applyTheme(theme: Theme): void {
  // 'system' becomes dark or light depending on the device
  const dark = theme === 'dark' || (theme === 'system' && systemPrefersDark())
  document.documentElement.classList.toggle('dark', dark)
  // `?.` (optional chaining): call setAttribute only if querySelector found
  // the tag; when it returns null the line does nothing instead of crashing
  document.querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', dark ? THEME_COLORS.dark : THEME_COLORS.light)
}
