/*
 * Applies the signed-in user's language and theme to this device, so a choice
 * made on the phone follows the user to the computer (docs/01-ui-design.md
 * 1.4.14). The data flows one way: the pickers change the account
 * (useUpdatePreferences in src/api/auth.ts), and this hook applies the account
 * to the page. Used by RequireAuth, so it runs on every signed-in screen.
 */
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { User } from '@/api/auth'
import { useTheme } from '@/theme/useTheme'

/**
 * Keeps the page in step with the account.
 * @param user the signed-in user; undefined or null when there is none
 */
export function useAccountPreferences(user: User | null | undefined) {
  // i18next's instance, to change the language
  const { i18n } = useTranslation()
  // The function that applies and saves the theme, from the theme context
  const { setTheme } = useTheme()
  // Only these two values, so a refetch that changes nothing does nothing.
  // `?.` gives undefined when there is no user
  const locale = user?.locale
  const theme = user?.theme

  // An effect: changing the language and the theme touches the world outside
  // this component. It runs again whenever a value in the list changes
  useEffect(() => {
    if (locale) void i18n.changeLanguage(locale)
  }, [locale, i18n])

  useEffect(() => {
    if (theme) setTheme(theme)
  }, [theme, setTheme])
}
