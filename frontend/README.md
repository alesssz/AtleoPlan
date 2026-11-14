# AtleoPlan — frontend

The React app: React 19, TypeScript, Vite, React Router, TanStack Query, i18next (it, en, es, de), Tailwind CSS and shadcn/ui. It runs directly on your computer with Node 24 (`.nvmrc`), not in Docker, and talks to the Laravel backend through Vite's proxy.

**Architecture:** [docs/concepts/C1-frontend.md](../docs/concepts/C1-frontend.md): how the pieces fit, the folder structure, what happens when the app opens, routing, server data, translations, styles and theme, tests, and each feature's screens.

**Recipes** (a new page, data from the API, a form, tests, translations, packages, common errors): [docs/how-to/H3-frontend.md](../docs/how-to/H3-frontend.md).

```sh
npm install          # once, and after package.json changes (make fe-install)
npm run dev          # http://localhost:5673 (make dev); the backend must be up (make up)
npm test             # tests once (make fe-test); npm run test:watch reruns on save
npm run lint         # ESLint; add -- --fix to fix the style (make fix)
npm run typecheck    # TypeScript (make typecheck)
npm run build        # production build in dist/ (make fe-build)
```

From the repository root, `make check` runs everything, backend included.
