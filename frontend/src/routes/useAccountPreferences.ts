/*
 * Applies the account's language and theme to this device, so a choice made on
 * the phone follows the user to the computer. One way only: the pickers change
 * the account, this applies the account to the page.
 */
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import type { User } from '@/api/auth'
import { useTheme } from '@/theme/useTheme'

export function useAccountPreferences(user: User | null | undefined) {
  const { i18n } = useTranslation()
  const { setTheme } = useTheme()
  // The two values, not the user, so a refetch that changes nothing does nothing
  const locale = user?.locale
  const theme = user?.theme

  useEffect(() => {
    if (locale) void i18n.changeLanguage(locale)
  }, [locale, i18n])

  useEffect(() => {
    if (theme) setTheme(theme)
  }, [theme, setTheme])
}
