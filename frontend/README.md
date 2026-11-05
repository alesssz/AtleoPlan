# AtleoPlan — frontend

The React app: React 19, TypeScript, Vite, React Router, TanStack Query, i18next (it, en, es, de), Tailwind CSS and shadcn/ui. It runs directly on your computer with Node 24 (`.nvmrc`), not in Docker, and talks to the Laravel backend through Vite's proxy.

**The guide is [docs/04-frontend.md](../docs/04-frontend.md):** how the pieces fit, the folder structure, what happens when the app opens, React for a Vue developer, routing, server data, translations, styles and theme, recipes, tests. Every source file starts with a comment saying what it does.

```sh
npm install          # once, and after package.json changes (make fe-install)
npm run dev          # http://localhost:5673 (make dev); the backend must be up (make up)
npm test             # tests once (make fe-test); npm run test:watch reruns on save
npm run lint         # ESLint; add -- --fix to fix the style (make fix)
npm run typecheck    # TypeScript (make typecheck)
npm run build        # production build in dist/ (make fe-build)
```

From the repository root, `make check` runs everything, backend included.
