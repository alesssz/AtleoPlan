# AtleoPlan — notes for AI assistants

A workout-plan app: Laravel 13 API (`backend/`) and React 19 / TypeScript / Vite PWA (`frontend/`), one repository. Start from [README.md](README.md); the docs in [`docs/`](docs), indexed in [docs/README.md](docs/README.md), are the reference and win over this file.

| Need | Read |
|---|---|
| Setup, ports, commands, known problems | [S1. Setup](docs/start/S1-setup.md) |
| How screens look and behave | [D1. UI design](docs/design/D1-ui.md) |
| Why the stack, storage, hosting and offline rules are what they are | [D2. Decisions](docs/design/D2-decisions.md) |
| Every table: columns, relations, ids, what happens on delete | [D3. Data model](docs/design/D3-data-model.md) |
| The React app's architecture | [C1. Frontend](docs/concepts/C1-frontend.md) |
| The Laravel API's architecture | [C2. Backend](docs/concepts/C2-backend.md) |
| Recipes: tables, endpoints and admin screens, pages, the database client, CI | [H1](docs/how-to/H1-database.md) · [H2](docs/how-to/H2-backend.md) · [H3](docs/how-to/H3-frontend.md) · [H4](docs/how-to/H4-database-tools.md) · [H5](docs/how-to/H5-ci.md) |
| Git, code style, comments, docs, the public repository | [P1. Conventions](docs/project/P1-conventions.md) |
| What to work on next | [Backlog](docs/project/backlog.md) |

## Running things

- **PHP and Composer only through Docker.** Never install PHP, Composer or Laravel Boost, and never use a copy already on the computer. Backend commands run from the repository root: `docker compose exec backend php artisan …`, `docker compose exec backend composer …` (`run --rm` instead of `exec` when the stack is stopped).
- **The frontend runs on the host** with Node 24 (`.nvmrc`): `npm …` inside `frontend/`. Never `npm audit fix --force`, never `sudo npm`.
- **On Windows,** commands run from Git Bash: the `Makefile` needs `bash`, `grep` and `cp`.
- **Ports** are the standard ones + 500: Laravel 8500, Postgres 5932, Mailpit 8525, Vite 5673, Vite's preview of the build 4673.
- **`make help`** lists every command. `make check` runs every check (Pint, tests, ESLint, TypeScript, docs' contents lists) and must pass before a merge; CI runs the same, plus the build ([H5](docs/how-to/H5-ci.md)).
- **Tests** (`make test`) run on the `atleoplan_test` database, guarded by `tests/Feature/TestDatabaseTest.php`. Never weaken the `<server>` / `<env force>` overrides in `backend/phpunit.xml`.
- **`.env` files hold secrets:** never read or print them. A new variable goes in `.env.example`, or in `compose.yaml` when it is a development setting.

## Rules

A summary of [P1](docs/project/P1-conventions.md), which wins.

- **English** everywhere in the repository: code, comments, docs, commit messages.
- **Written for developers who know the stack.** Comments explain *why* (a decision, a constraint, a trap, an edge case), never what the language, the framework or a tool does; no history, branch names, backlog IDs or doc references in comments. Docs describe the project as it is.
- **A change updates the docs section it touches in the same commit.** Sections are cited by code between docs (`H2.3`); after changing a heading, `make toc`.
- **A new kind of work** (table, endpoint, job, screen, check) adds a short recipe to its how-to guide.
- **A new endpoint:** policy, Form Request, then an action or service; a Pest test per route, forbidden cases included. **A new table:** D3 first, then migration, model, policy, factory, tests, API Resource, frontend types. An applied migration never changes.
- **Git:** one branch per task from `main` (`make branch name=<type>/<name>`, types `feat`, `fix`, `docs`, `chore`), Conventional Commits, merged with `make merge` once CI passes. Commits use the GitHub noreply address; the hook in `.githooks/` refuses any other identity.
- **The repository is public:** nothing committed holds a secret, a real person's data or a private detail ([P1.5](docs/project/P1-conventions.md#p15-a-public-repository)).
- **Backlog:** one entry per point, IDs never reused, the entry deleted by the commit that finishes it.
