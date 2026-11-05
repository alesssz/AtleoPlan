/*
 * The language picker (Profile, docs/01-ui-design.md 1.4.14). Changing it
 * switches every text at once, saves the choice in this browser and updates
 * <html lang> (src/i18n/index.ts). Language names are shown in their own
 * language: "Deutsch", not "Tedesco". Translations: docs/04-frontend.md 4.7.
 *
 * Built from shadcn/ui's Select (src/components/ui/select.tsx): several
 * small components that fit together (trigger, value, list, items).
 */
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { FALLBACK_LANGUAGE, isLanguage, LANGUAGE_NAMES, SUPPORTED_LANGUAGES } from '@/i18n/languages'

/** A labelled drop-down of the supported languages, each in its own language. */
export function LanguageSelect() {
  // react-i18next's hook; destructuring takes two fields out of its result:
  // t translates, i18n is the i18next instance (its language, changeLanguage())
  const { t, i18n } = useTranslation()
  // useId() is a React hook that returns an id unique to this instance of
  // the component (stable across re-renders), linking the <label> to the picker
  const id = useId()
  // The language in use; one of ours, or the fallback while starting.
  // isLanguage() is a type guard, so `current` is typed as a Language
  const current = isLanguage(i18n.resolvedLanguage) ? i18n.resolvedLanguage : FALLBACK_LANGUAGE

  return (
    // Label above picker (a flex column), 8 px apart
    <div className="flex flex-col gap-2">
      {/* htmlFor is JSX's name for the label's `for` attribute */}
      <label htmlFor={id} className="text-sm font-medium">{t('preferences.language')}</label>
      {/* A "controlled" component: React gives it its value and is told of
          every change, which it applies (here: to i18next, which re-renders
          everything with the new texts). changeLanguage() returns a
          Promise; `void` says we do not wait for it on purpose */}
      <Select value={current} onValueChange={language => void i18n.changeLanguage(language)}>
        {/* The button that opens the list: 48 px tall (a comfortable tap
            target), full width on phones, 256 px from 640 px up */}
        <SelectTrigger id={id} className="h-12 w-full sm:w-64">
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
    </div>
  )
}
