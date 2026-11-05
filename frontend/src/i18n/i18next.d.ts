/*
 * Makes translation keys type-checked. TypeScript reads the keys from the
 * English file, so:
 *   - t('nav.home') autocompletes in VS Code;
 *   - t('nav.hom') (a typo, or a key that does not exist) is a type error,
 *     caught by `npm run typecheck` before anyone sees a raw key on screen.
 * The other languages must have the same keys: src/i18n/locales.test.ts
 * checks it. docs/04-frontend.md 4.7.
 *
 * A .d.ts file ("declaration file") holds types only, never code that runs;
 * TypeScript picks it up because it is in src/ (tsconfig.app.json).
 *
 * This is "module augmentation": it adds our types to the i18next package's
 * own CustomTypeOptions interface, which i18next's types then use.
 * Interfaces with the same name merge, so this adds fields to i18next's one.
 */
// Loads i18next's types, so the `declare module` below extends them
// instead of declaring a new, empty module
import 'i18next'
// `import type`: only the type of the JSON file is wanted, not its content
import type en from './locales/en.json'

declare module 'i18next' {
  /** i18next's hook for apps to describe their translations. */
  interface CustomTypeOptions {
    /** The one namespace the app uses (see src/i18n/index.ts). */
    defaultNS: 'translation'
    /**
     * The shape of every language's file: the English one. `typeof en` is
     * the type TypeScript infers from the JSON: every key, nested.
     */
    resources: {
      /** The texts of the 'translation' namespace. */
      translation: typeof en
    }
  }
}
