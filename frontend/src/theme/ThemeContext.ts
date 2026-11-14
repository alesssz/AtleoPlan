/*
 * Apart from ThemeProvider.tsx, which may then export only a component (Fast
 * Refresh, eslint.config.js).
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
