# AtleoPlan — frontend

The React app: React 19, TypeScript, Vite, React Router, TanStack Query, i18next (it, en, es, de), Tailwind CSS and shadcn/ui. It runs on the host with Node 24 (`.nvmrc`), not in Docker, and reaches the Laravel API through Vite's proxy.

- **Architecture:** [C1. Frontend](../docs/concepts/C1-frontend.md)
- **Recipes** (pages, API data, forms, tests, translations, packages, common errors): [H3. Frontend](../docs/how-to/H3-frontend.md)

```sh
npm install          # once, and after package.json changes (make fe-install)
npm run dev          # http://localhost:5673 (make dev); the backend must be up (make up)
npm test             # tests once (make fe-test); npm run test:watch reruns on save
npm run lint         # ESLint; add -- --fix to fix the style (make fix)
npm run typecheck    # TypeScript (make typecheck)
npm run build        # production build in dist/ (make fe-build)
```

From the repository root, `make check` runs everything, backend included.
