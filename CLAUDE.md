# AtleoPlan — notes for AI assistants

A workout-plan app: Laravel 13 API (`backend/`) + React 19 / TypeScript / Vite PWA (`frontend/`), one repository. Start from [README.md](README.md); the docs in [`docs/`](docs/) are the reference and win over anything assumed here.

| Need | Read |
|---|---|
| Setup, ports, every command, known problems | [docs/00-setup.md](docs/00-setup.md) |
| How screens look and behave | [docs/01-ui-design.md](docs/01-ui-design.md) |
| Why the stack, storage, hosting, offline rules are what they are | [docs/02-decisions.md](docs/02-decisions.md) |
| Git, code style, comments, docs rules | [docs/03-conventions.md](docs/03-conventions.md) |
| What to work on next | [docs/backlog.md](docs/backlog.md) |

## Running things

- **PHP and Composer exist only in Docker.** Never install PHP, Composer or Laravel Boost on the Mac (it is a work computer). Run backend commands from the repository root through the container:
  `docker compose exec backend php artisan …`, `docker compose exec backend composer …` (`run --rm` instead of `exec` when the stack is stopped).
- **The frontend runs on the Mac**, Node 24 (`.nvmrc`): `npm …` inside `frontend/`, no Docker. Never `npm audit fix --force`, never `sudo npm`.
- Host ports are standard + 500: Laravel 8500, Postgres 5932, Mailpit 8525, Vite 5673.
- The `Makefile` wraps all of this (`make help`); `make check` runs every check (Pint, tests, lint, types) and must pass before a merge.
- Tests: `make test` (`docker compose exec backend php artisan test`). They run on the `atleoplan_test` database; `tests/Feature/TestDatabaseTest.php` guards it. Never weaken the `<server>` / `<env force>` overrides in `backend/phpunit.xml`.
- Style: `docker compose exec backend vendor/bin/pint`, `npm run lint` in `frontend/`.
- `.env` files hold secrets: do not read or print them; new variables go in `.env.example` (or in `compose.yaml` when they are development settings).

## Working rules (summary of docs/03-conventions.md)

- Everything in the repository is in English: code, comments, docs, commit messages. The user talks to you in Italian; answer in Italian.
- **Comments in depth**: a header on every file, PHPDoc / TSDoc on every class, function, component, prop and field, a line on each local variable, labelled JSX blocks, commented migrations.
- **A change updates the docs section it touches in the same commit.** Sections are numbered and cited as "see 2.5", also in code comments.
- Backlog: one entry per point, IDs never reused, the entry is deleted by the commit that finishes it.
- One branch per task from `main` (`feat/…`, `fix/…`, `docs/…`, `chore/…`), pushed with `make push` and merged with `make merge` (checks, `--no-ff`, push, branch deleted).

## Git identity

Commits use the personal GitHub noreply address set in this repository's `.git/config`; the Mac's global identity is the work one and must never appear. The hook in `.githooks/` refuses any other email. Never add a `Co-Authored-By` trailer or any Claude attribution to commits or pull requests.
