/*
 * The theme without React: the `dark` class on <html> switches the colours of
 * src/index.css. index.html repeats the first part of this logic before React
 * loads: keep the two in step.
 */

/** 'system' follows the device. */
export const THEMES = ['dark', 'light', 'system'] as const

export type Theme = (typeof THEMES)[number]

/** Dark: easier to read on a phone lying on the bench. */
export const DEFAULT_THEME: Theme = 'dark'

/** Also read by index.html. */
export const THEME_STORAGE_KEY = 'atleoplan.theme'

const DARK_QUERY = '(prefers-color-scheme: dark)'

/** The phone's status bar takes the theme's background. */
const THEME_COLORS = { dark: '#0B0B0F', light: '#FFFFFF' }

function isTheme(value: string | null): value is Theme {
  return THEMES.includes(value as Theme)
}

export function readStoredTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    return isTheme(stored) ? stored : DEFAULT_THEME
  }
  catch {
    // Blocked storage (private mode, some settings)
    return DEFAULT_THEME
  }
}

export function storeTheme(theme: Theme): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }
  catch {
    // Blocked storage: the theme still applies until the page is closed
  }
}

export function systemPrefersDark(): boolean {
  return window.matchMedia(DARK_QUERY).matches
}
export function watchSystemTheme(onChange: () => void): () => void {
  const query = window.matchMedia(DARK_QUERY)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

export function applyTheme(theme: Theme): void {
  const dark = theme === 'dark' || (theme === 'system' && systemPrefersDark())
  document.documentElement.classList.toggle('dark', dark)
  document.querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', dark ? THEME_COLORS.dark : THEME_COLORS.light)
}
