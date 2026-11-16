/*
 * Kept out of ThemeProvider.tsx so that file exports only a component, as Fast
 * Refresh requires.
 */
import { createContext } from 'react'
import type { Theme } from './theme'

export interface ThemeContextValue {
  theme: Theme
  /** Applies and saves it. */
  setTheme: (theme: Theme) => void
}

/** null outside a ThemeProvider, which useTheme() turns into an error. */
export const ThemeContext = createContext<ThemeContextValue | null>(null)
