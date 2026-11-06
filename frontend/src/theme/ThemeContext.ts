/*
 * The React context that carries the theme to every component.
 *
 * A context is React's way to share a value with a whole part of the app
 * (a subtree of components) without passing it through every component's
 * props. Three steps: createContext() makes it (here), a provider component
 * puts a value in (ThemeProvider), and useContext() reads it from any
 * component below (useTheme). When the value changes, every reader
 * re-renders. Context explained: docs/concepts/C1-frontend.md C1.4.
 *
 * Kept in its own file so ThemeProvider.tsx exports only a component
 * (Fast Refresh, see eslint.config.js).
 */
import { createContext } from 'react'
// `import type`: imports a type only; it disappears from the built
// JavaScript (the project requires this form for types: verbatimModuleSyntax)
import type { Theme } from './theme'

/** What useTheme() gives a component. */
export interface ThemeContextValue {
  /** The user's choice: 'dark', 'light' or 'system'. */
  theme: Theme
  /**
   * Changes the theme, applies it and saves it. The type reads: a function
   * taking a Theme and returning nothing (void).
   */
  setTheme: (theme: Theme) => void
}

/**
 * The context itself. `<ThemeContextValue | null>` is a generic type
 * argument: the context holds a ThemeContextValue or null. Its default,
 * null, is what a component gets when it is not inside a ThemeProvider:
 * useTheme() turns that into a clear error.
 */
export const ThemeContext = createContext<ThemeContextValue | null>(null)
