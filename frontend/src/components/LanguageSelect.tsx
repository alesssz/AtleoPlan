/*
 * The language picker (Profile, docs/01-ui-design.md 1.4.14). The choice is
 * saved on the account, so it follows the user to other devices. This picker
 * only changes the account: useAccountPreferences (src/routes/) applies it, which
 * switches every text at once, saves it in this browser and updates <html lang>
 * (src/i18n/index.ts). Language names are shown in their own language:
 * "Deutsch", not "Tedesco". Translations: docs/04-frontend.md 4.7.
 *
 * Built from shadcn/ui's Select (src/components/ui/select.tsx): several
 * small components that fit together (trigger, value, list, items). Its
 * label is drawn by the parent (SettingRow in ProfilePage), linked through
 * the `id` prop.
 */
import { useTranslation } from 'react-i18next'
import { useUpdatePreferences } from '@/api/auth'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FALLBACK_LANGUAGE, isLanguage, LANGUAGE_NAMES, SUPPORTED_LANGUAGES, type Language } from '@/i18n/languages'

/** Props of LanguageSelect. */
interface LanguageSelectProps {
  /** The id of the picker's button, which the label's htmlFor points to. */
  id: string
}

/** A drop-down of the supported languages, each in its own language. */
export function LanguageSelect({ id }: LanguageSelectProps) {
  // react-i18next's hook; destructuring takes the i18next instance out of
  // its result, for its current language
  const { i18n } = useTranslation()
  // The request that saves the language on the account (src/api/auth.ts)
  const updatePreferences = useUpdatePreferences()
  // The language in use; one of ours, or the fallback while starting.
  // isLanguage() is a type guard, so `current` is typed as a Language
  const current = isLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : FALLBACK_LANGUAGE

  return (
    // A "controlled" component: React gives it its value and is told of
    // every change, which it applies (here: to the account). The Select hands
    // back a plain string: `as Language` tells TypeScript it is one of ours,
    // which holds because only SUPPORTED_LANGUAGES are offered
    <Select value={current} onValueChange={language => updatePreferences.mutate({ locale: language as Language })}>
      {/* The button that opens the list: 44 px tall, rounded, full width on
          phones and 224 px from 640 px up */}
      <SelectTrigger id={id} className="h-11 w-full rounded-xl sm:w-56">
        {/* Shows the selected item's text */}
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {/* .map() turns each language code into a <SelectItem>; `key`
            lets React tell list items apart and must be unique */}
        {SUPPORTED_LANGUAGES.map(language => (
          // lang= lets screen readers pronounce each name in its language
          <SelectItem key={language} value={language} lang={language}>
            {LANGUAGE_NAMES[language]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
