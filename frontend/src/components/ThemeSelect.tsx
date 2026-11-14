/*
 * The theme picker. Like LanguageSelect, it only changes the account;
 * useAccountPreferences applies it to the page.
 */
import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useUpdatePreferences } from '@/api/auth'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { THEMES, type Theme } from '@/theme/theme'
import { useTheme } from '@/theme/useTheme'

const THEME_ICONS: Record<Theme, LucideIcon> = {
  dark: Moon,
  light: Sun,
  system: Monitor,
}

interface ThemeSelectProps {
  /** For the label's htmlFor. */
  id: string
}

export function ThemeSelect({ id }: ThemeSelectProps) {
  const { t } = useTranslation()
  const { theme } = useTheme()
  const updatePreferences = useUpdatePreferences()

  return (
    <Select value={theme} onValueChange={value => updatePreferences.mutate({ theme: value as Theme })}>
      <SelectTrigger id={id} className="h-11 w-full rounded-xl sm:w-56">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {THEMES.map((option) => {
          const Icon = THEME_ICONS[option]
          return (
            <SelectItem key={option} value={option}>
              <Icon aria-hidden="true" />
              {t(`theme.${option}`)}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
