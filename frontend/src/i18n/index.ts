/*
 * i18next, set up once at start. The starting language: the choice saved in
 * this browser, then the browser's own, then English. Once signed in, the
 * account's language takes over (src/routes/useAccountPreferences.ts).
 */
import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import { FALLBACK_LANGUAGE, SUPPORTED_LANGUAGES } from './languages'
import de from './locales/de.json'
import en from './locales/en.json'
import es from './locales/es.json'
import it from './locales/it.json'

export const LANGUAGE_STORAGE_KEY = 'atleoplan.language'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    // Bundled, so translations need no request and work offline
    resources: {
      it: { translation: it },
      en: { translation: en },
      es: { translation: es },
      de: { translation: de },
    },
    supportedLngs: SUPPORTED_LANGUAGES,
    fallbackLng: FALLBACK_LANGUAGE,
    // 'it-IT' and 'it-CH' both mean 'it'
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    // Synchronous, so the first render already has the texts
    initAsync: false,
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ['localStorage'],
    },
    interpolation: {
      // React escapes already: twice would show "&amp;"
      escapeValue: false,
    },
  })

/**
 * Screen readers pick their voice from <html lang>, browsers hyphenate and
 * offer translation by it.
 */
function syncDocumentLanguage(language: string | undefined) {
  document.documentElement.lang = language ?? FALLBACK_LANGUAGE
}
syncDocumentLanguage(i18n.resolvedLanguage)
i18n.on('languageChanged', () => syncDocumentLanguage(i18n.resolvedLanguage))

export default i18n
