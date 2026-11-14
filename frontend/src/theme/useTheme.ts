import { useContext } from 'react'
import { ThemeContext, type ThemeContextValue } from './ThemeContext'

/**
 * @throws Error when called outside a ThemeProvider
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme() must be used inside <ThemeProvider>')
  return context
}
