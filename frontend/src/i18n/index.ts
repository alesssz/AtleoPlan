/*
 * Sets up i18next, the translation library, once, when the app starts
 * (imported first thing by src/main.tsx). After this, any component gets its
 * texts with `const { t } = useTranslation()` and `t('nav.home')`: t() looks
 * the key up in the current language's file (src/i18n/locales/*.json).
 * docs/04-frontend.md 4.7, decisions in docs/02-decisions.md 2.4.
 *
 * Where the language comes from, in order:
 *   1. the choice saved in this browser (localStorage), made in Profile;
 *   2. the browser's own language (navigator.language), e.g. 'it-IT' → 'it';
 *   3. English, when neither is one of ours.
 * Once signed in, the account's language takes over, and is saved here too
 * (src/routes/useAccountPreferences.ts, docs/04-frontend.md 4.13.4).
 *
 * Being called index.ts, the file is what `import … from './i18n'` (the
 * folder) loads.
 */
// Default imports (no braces): each package's main export, named here
import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
// A named import (braces): one of the things react-i18next exports by name
import { initReactI18next } from 'react-i18next'
import { FALLBACK_LANGUAGE, SUPPORTED_LANGUAGES } from './languages'
// Importing a .json file gives its content as a JavaScript object
// (enabled by resolveJsonModule in tsconfig.app.json)
import de from './locales/de.json'
import en from './locales/en.json'
import es from './locales/es.json'
import it from './locales/it.json'

/** The localStorage entry holding the language picked in Profile. */
export const LANGUAGE_STORAGE_KEY = 'atleoplan.language'

// Method chaining: use() returns i18n itself, so the calls line up one
// after the other, ending with init(), which takes the settings
i18n
  // Finds the starting language (localStorage, then the browser): see above
  .use(LanguageDetector)
  // Connects i18next to React: useTranslation() re-renders components
  // when the language changes
  .use(initReactI18next)
  .init({
    // Every text, bundled in the app: no network request for translations,
    // so they work offline too. One "namespace" (translation) per language.
    resources: {
      it: { translation: it },
      en: { translation: en },
      es: { translation: es },
      de: { translation: de },
    },
    supportedLngs: SUPPORTED_LANGUAGES,
    // The language whose text shows when a key is missing in the user's one
    fallbackLng: FALLBACK_LANGUAGE,
    // 'it-IT' or 'it-CH' from the browser both mean our 'it'
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    // The resources are already here: set up synchronously, so the very
    // first render already has the texts (no flash of keys)
    initAsync: false,
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      // i18n.changeLanguage() saves the new choice there
      caches: ['localStorage'],
    },
    // Interpolation: filling {{name}} placeholders in a text with values,
    // as in t('preferences.languageHint', { weight: '82,5 kg' })
    interpolation: {
      // React already escapes what it renders: escaping twice would show
      // "&amp;" instead of "&"
      escapeValue: false,
    },
  })

/**
 * Keeps <html lang="…"> in step with the language: screen readers use it to
 * pick their voice, browsers to hyphenate and to offer translation.
 * @param language the language in use; undefined before i18next has one
 */
function syncDocumentLanguage(language: string | undefined) {
  document.documentElement.lang = language ?? FALLBACK_LANGUAGE
}
// Once now, then on every change ('languageChanged' is i18next's event)
syncDocumentLanguage(i18n.resolvedLanguage)
i18n.on('languageChanged', () => syncDocumentLanguage(i18n.resolvedLanguage))

/**
 * The configured i18next instance, as the file's default export: imported
 * with `import i18n from '@/i18n'` (tests use it to switch language).
 * Components use useTranslation() instead.
 */
export default i18n
