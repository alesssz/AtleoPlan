/*
 * The language picker. It only changes the account; useAccountPreferences
 * applies it, so the choice follows the user to other devices. Names are in
 * their own language: "Deutsch".
 */
import { useTranslation } from 'react-i18next'
import { useUpdatePreferences } from '@/api/auth'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FALLBACK_LANGUAGE, isLanguage, LANGUAGE_NAMES, SUPPORTED_LANGUAGES, type Language } from '@/i18n/languages'

interface LanguageSelectProps {
  /** For the label's htmlFor. */
  id: string
}

export function LanguageSelect({ id }: LanguageSelectProps) {
  const { i18n } = useTranslation()
  const updatePreferences = useUpdatePreferences()
  const current = isLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : FALLBACK_LANGUAGE

  return (
    // Only supported languages are offered, so the cast holds
    <Select value={current} onValueChange={language => updatePreferences.mutate({ locale: language as Language })}>
      <SelectTrigger id={id} className="h-11 w-full rounded-xl sm:w-56">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_LANGUAGES.map(language => (
          // Screen readers pronounce each name in its own language
          <SelectItem key={language} value={language} lang={language}>
            {LANGUAGE_NAMES[language]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
