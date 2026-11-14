/*
 * Likely bugs, and one style without Prettier: 2 spaces, single quotes, no
 * semicolons, stroustrup braces. `make fix` fixes the style.
 */
import js from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import { defineConfig, globalIgnores } from 'eslint/config'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
  // The production build is generated code, never linted
  globalIgnores(['dist']),

  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      stylistic.configs.customize({
        indent: 2,
        quotes: 'single',
        semi: false,
        jsx: true,
        braceStyle: 'stroustrup',
      }),
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },

  {
    // shadcn ships a component and its variants (Button, buttonVariants) in
    // one file
    files: ['src/components/ui/**/*.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
