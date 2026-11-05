/*
 * The theme picker (Profile, docs/01-ui-design.md 1.4.14): dark, light or
 * the device's setting. Works through useTheme() (src/theme/), which reads
 * the theme context. Theme: docs/04-frontend.md 4.8.
 *
 * Same shape as LanguageSelect: a <label> and a shadcn/ui Select.
 */
import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
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

/** A labelled drop-down of the themes, each with its icon. */
export function ThemeSelect() {
  // The translate function, taken out of useTranslation()'s result (destructuring)
  const { t } = useTranslation()
  // The current theme and the function to change it, from the theme context
  // (src/theme/useTheme.ts), destructured the same way
  const { theme, setTheme } = useTheme()
  // A unique id linking the <label> to the picker
  const id = useId()

  return (
    // Label above picker, 8 px apart
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-medium">{t('preferences.theme')}</label>
      {/* A controlled Select: value from the context, changes sent back to
          it. The Select hands back a plain string: `as Theme` tells
          TypeScript it is one of ours, which holds because only THEMES are
          offered */}
      <Select value={theme} onValueChange={value => setTheme(value as Theme)}>
        {/* 48 px tall, full width on phones, 256 px from 640 px up */}
        <SelectTrigger id={id} className="h-12 w-full sm:w-64">
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
    </div>
  )
}
