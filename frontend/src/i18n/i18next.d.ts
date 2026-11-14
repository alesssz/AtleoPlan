/*
 * Translation keys typed from the English file, so a missing or misspelt key is
 * a type error. The other languages must have the same keys: locales.test.ts
 * checks it.
 */
import 'i18next'
import type en from './locales/en.json'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: {
      translation: typeof en
    }
  }
}
