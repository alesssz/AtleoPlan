/*
 * The theme picker (Profile, docs/design/D1-ui.md D1.4.14): dark, light or
 * the device's setting. Works through useTheme() (src/theme/), which reads
 * the theme context. Theme: docs/concepts/C1-frontend.md C1.8.
 *
 * Same shape as LanguageSelect: a shadcn/ui Select whose label is drawn by
 * the parent (SettingRow), linked through the `id` prop.
 *
 * The choice is saved on the account, so it follows the user to other devices.
 * This picker only changes the account; useAccountPreferences (src/routes/)
 * applies the account to the page.
 */
import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useUpdatePreferences } from '@/api/auth'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { THEMES, type Theme } from '@/theme/theme'
import { useTheme } from '@/theme/useTheme'

/**
 * The icon shown next to each choice. A component can be stored in a
 * variable like any value: these are the icon components themselves.
 */
const THEME_ICONS: Record<Theme, LucideIcon> = {
  dark: Moon,
  light: Sun,
  system: Monitor,
}

/** Props of ThemeSelect. */
interface ThemeSelectProps {
  /** The id of the picker's button, which the label's htmlFor points to. */
  id: string
}

/** A drop-down of the themes, each with its icon. */
export function ThemeSelect({ id }: ThemeSelectProps) {
  // The translate function, taken out of useTranslation()'s result (destructuring)
  const { t } = useTranslation()
  // The current theme, from the theme context (src/theme/useTheme.ts),
  // destructured the same way
  const { theme } = useTheme()
  // The request that saves it on the account (src/api/auth.ts)
  const updatePreferences = useUpdatePreferences()

  return (
    // A controlled Select: value from the context, changes sent to the account.
    // The Select hands back a plain string: `as Theme` tells TypeScript it
    // is one of ours, which holds because only THEMES are offered
    <Select value={theme} onValueChange={value => updatePreferences.mutate({ theme: value as Theme })}>
      {/* 44 px tall, rounded, full width on phones, 224 px from 640 px up */}
      <SelectTrigger id={id} className="h-11 w-full rounded-xl sm:w-56">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {/* One item per theme. With braces after `=>` the arrow function
            has a body and needs an explicit `return` */}
        {THEMES.map((option) => {
          // A component chosen at runtime must be in a capitalised variable
          // for JSX to treat it as a component: <Icon />, not <icon />
          const Icon = THEME_ICONS[option]
          return (
            <SelectItem key={option} value={option}>
              <Icon aria-hidden="true" />
              {/* The key is built with a template literal: theme.dark,
                  theme.light, theme.system */}
              {t(`theme.${option}`)}
            </SelectItem>
          )
        })}
      </SelectContent>
    </Select>
  )
}
