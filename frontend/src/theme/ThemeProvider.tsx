/*
 * ThemeProvider: holds the current theme, applies it to the page, saves it,
 * and shares it with every component below it (through ThemeContext).
 * Wraps the whole app in src/App.tsx. Theme: docs/concepts/C1-frontend.md C1.8;
 * state, effects, useMemo and context: C1.4.
 *
 * The repo's example of the three core React tools together:
 * - useState: a value React remembers between renders; changing it with
 *   its setter makes React call the component again (re-render);
 * - useEffect: code that touches the world outside React (here the <html>
 *   class and a device listener), run after React has drawn;
 * - context: the value shared with the whole app.
 */
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { applyTheme, readStoredTheme, storeTheme, watchSystemTheme, type Theme } from './theme'
import { ThemeContext } from './ThemeContext'

/** Props of ThemeProvider: the inputs it receives from its parent. */
interface ThemeProviderProps {
  /**
   * The part of the app that can read and change the theme (all of it).
   * `children` is the special prop holding whatever is written between
   * <ThemeProvider> and </ThemeProvider>; ReactNode is the type of anything
   * React can draw (elements, text, lists, null…).
   */
  children: ReactNode
}

/**
 * Makes the theme available to everything inside it (see useTheme()).
 * `({ children }: ThemeProviderProps)` destructures the props object: it
 * takes its `children` field out as a variable, and types the whole object.
 */
export function ThemeProvider({ children }: ThemeProviderProps) {
  // The current choice. useState returns a pair, [value, setter], taken
  // apart by array destructuring. `<Theme>` says what type the state holds.
  // useState's argument is a function (readStoredTheme, not called here),
  // so localStorage is read once, on the first render, not on every render.
  const [theme, setThemeState] = useState<Theme>(readStoredTheme)

  // An effect runs after React has drawn the screen, and again whenever a
  // value in its dependency list ([theme]) changes: here, every time the
  // theme changes, the page's class is updated to match.
  useEffect(() => {
    applyTheme(theme)
    // With 'system', also follow the device when it switches mode (e.g. at
    // sunset). The function returned is the effect's "cleanup": React calls
    // it before the next run and when the component goes away, so the
    // listener never piles up.
    if (theme !== 'system') return
    return watchSystemTheme(() => applyTheme('system'))
  }, [theme])

  // The value handed to the context. useMemo keeps the same object between
  // renders while `theme` is unchanged; a new object every time would make
  // every component that reads the context render again for nothing.
  // `() => ({ … })`: an arrow function returning an object needs the
  // parentheses, or the braces would read as the function's body.
  const value = useMemo(() => ({
    theme,
    // Saves the choice, then updates the state: React re-renders, the
    // effect above applies the new theme
    setTheme: (next: Theme) => {
      storeTheme(next)
      setThemeState(next)
    },
  }), [theme])

  // In React 19 the context object is itself the provider component:
  // <ThemeContext value={…}> (older code writes <ThemeContext.Provider>).
  // {children} draws whatever was passed in.
  return <ThemeContext value={value}>{children}</ThemeContext>
}
