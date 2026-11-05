/*
 * useTheme(): the hook components use to read or change the theme.
 *
 * A "hook" is a function whose name starts with `use` and that may call
 * React's own hooks (useState, useContext…). It can only be called at the
 * top level of a component or of another hook: never inside an if, a loop
 * or an event handler, because React tells hooks apart by their call order
 * (the Rules of Hooks, checked by ESLint). docs/04-frontend.md 4.4.
 */
import { useContext } from 'react'
// `type ThemeContextValue` inside the braces: that one name is a type-only import
import { ThemeContext, type ThemeContextValue } from './ThemeContext'

/**
 * The current theme and the function to change it.
 * @returns the theme and setTheme, from the nearest ThemeProvider
 * @throws Error when called outside a ThemeProvider
 * @example const { theme, setTheme } = useTheme()
 */
export function useTheme(): ThemeContextValue {
  // The value ThemeProvider put in the context; null outside of it
  const context = useContext(ThemeContext)
  // After this check TypeScript knows `context` is not null ("narrowing")
  if (!context) throw new Error('useTheme() must be used inside <ThemeProvider>')
  return context
}
