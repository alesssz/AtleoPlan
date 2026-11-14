/*
 * Holds, applies and saves the theme.
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { applyTheme, readStoredTheme, storeTheme, watchSystemTheme, type Theme } from './theme'
import { ThemeContext } from './ThemeContext'

interface ThemeProviderProps {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(readStoredTheme)

  useEffect(() => {
    applyTheme(theme)
    // 'system' also follows the device when it switches mode
    if (theme !== 'system') return
    return watchSystemTheme(() => applyTheme('system'))
  }, [theme])

  // Stable while the theme is unchanged, so readers do not re-render for nothing
  const value = useMemo(() => ({
    theme,
    setTheme: (next: Theme) => {
      storeTheme(next)
      setThemeState(next)
    },
  }), [theme])

  return <ThemeContext value={value}>{children}</ThemeContext>
}
