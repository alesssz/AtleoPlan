/*
 * ESLint configuration of the React app (`npm run lint`, `make lint`).
 * ESLint reads the code without running it and reports problems.
 *
 * Two jobs: catch likely bugs (the recommended rules of JavaScript,
 * TypeScript and React hooks) and keep one code style everywhere, as in
 * Chronovault: 2 spaces, single quotes, no semicolons, and "stroustrup"
 * braces (`else` and `catch` on their own line after the closing brace)
 * (docs/project/P1-conventions.md P1.2). Style problems are fixed by
 * `npm run lint -- --fix` (`make fix`); VS Code fixes them on save with the
 * ESLint extension. There is no Prettier. Checks: docs/concepts/C1-frontend.md C1.10.
 *
 * A plain .js file (no types): ESLint loads it directly. The configuration
 * is an array of objects; each applies its settings to the files it names,
 * and later objects override earlier ones.
 */
import js from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'
import { defineConfig, globalIgnores } from 'eslint/config'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'
import tseslint from 'typescript-eslint'

// `export default`: the file's main export, the one ESLint reads
export default defineConfig([
  // The production build is generated code, never linted
  globalIgnores(['dist']),

  {
    // Every TypeScript file; `**` matches any folder depth
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Likely bugs in plain JavaScript (unused variables, unreachable code…)
      js.configs.recommended,
      // The same for TypeScript (no `any` by mistake, unsafe patterns…)
      tseslint.configs.recommended,
      // The Rules of Hooks: hooks only at the top of a component, and
      // complete dependency lists in useEffect / useMemo (docs/concepts/C1-frontend.md C1.4)
      reactHooks.configs.flat.recommended,
      // Files that export components should export only components, so
      // Fast Refresh can update them in place without reloading the page
      reactRefresh.configs.vite,
      // Code style: formatting only, never behaviour
      stylistic.configs.customize({
        indent: 2,
        quotes: 'single',
        semi: false,
        jsx: true,
        braceStyle: 'stroustrup',
      }),
    ],
    languageOptions: {
      // Browser globals (window, document, fetch…) are known names
      globals: globals.browser,
    },
  },

  {
    // shadcn/ui's components export a component and its style variants
    // (Button and buttonVariants) from one file, which is how shadcn ships
    // them; the Fast Refresh rule would flag every one of them.
    files: ['src/components/ui/**/*.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
])
