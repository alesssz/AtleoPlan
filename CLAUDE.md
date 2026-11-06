# AtleoPlan — notes for AI assistants

A workout-plan app: Laravel 13 API (`backend/`) + React 19 / TypeScript / Vite PWA (`frontend/`), one repository. Start from [README.md](README.md); the docs in [`docs/`](docs), indexed in [docs/README.md](docs/README.md), are the reference and win over anything assumed here.

| Need | Read |
|---|---|
| Setup, ports, every command, known problems | [docs/start/S1-setup.md](docs/start/S1-setup.md) |
| How screens look and behave | [docs/design/D1-ui.md](docs/design/D1-ui.md) |
| Why the stack, storage, hosting, offline rules are what they are | [docs/design/D2-decisions.md](docs/design/D2-decisions.md) |
| Git, code style, comments, docs rules | [docs/project/P1-conventions.md](docs/project/P1-conventions.md) |
| How the React app is built, recipes for pages, endpoints, translations | [docs/concepts/C1-frontend.md](docs/concepts/C1-frontend.md) |
| How the Laravel app is built, recipes for tables, endpoints, jobs, admin screens | [docs/concepts/C2-backend.md](docs/concepts/C2-backend.md) |
| Every table: columns, relations, ids, what happens on delete | [docs/design/D3-data-model.md](docs/design/D3-data-model.md) |
| Building tables in practice: artisan commands, migrations, models, factories, seeders, tinker, errors | [docs/how-to/H1-database.md](docs/how-to/H1-database.md) |
| Building endpoints, admin screens, jobs in practice: commands, files, tests, errors | [docs/how-to/H2-backend.md](docs/how-to/H2-backend.md) |
| Building pages, data hooks, forms in practice: files, tests, translations, browser tools, errors | [docs/how-to/H3-frontend.md](docs/how-to/H3-frontend.md) |
| Opening the database: connection details, TablePlus, alternatives | [docs/how-to/H4-database-tools.md](docs/how-to/H4-database-tools.md) |
| What to work on next | [docs/project/backlog.md](docs/project/backlog.md) |

## Running things

- **The project is developed on a Mac (a work computer) and on a Windows PC.** On Windows, run commands from Git Bash, not the Command Prompt or PowerShell: the `Makefile` needs `bash`, `grep` and `cp` (docs/start/S1-setup.md S1.2).
- **PHP and Composer are used only through Docker.** Never install PHP, Composer or Laravel Boost for this project, and do not use a copy already on the computer. Run backend commands from the repository root through the container:
  `docker compose exec backend php artisan …`, `docker compose exec backend composer …` (`run --rm` instead of `exec` when the stack is stopped).
- **The frontend runs directly on the computer**, Node 24 (`.nvmrc`): `npm …` inside `frontend/`, no Docker. Never `npm audit fix --force`, never `sudo npm`.
- Host ports are standard + 500: Laravel 8500, Postgres 5932, Mailpit 8525, Vite 5673.
- The `Makefile` wraps all of this (`make help`); `make check` runs every check (Pint, tests, lint, types) and must pass before a merge.
- Tests: `make test` (`docker compose exec backend php artisan test`). They run on the `atleoplan_test` database; `tests/Feature/TestDatabaseTest.php` guards it. Never weaken the `<server>` / `<env force>` overrides in `backend/phpunit.xml`.
- Style: `docker compose exec backend vendor/bin/pint`, `npm run lint` in `frontend/`.
- `.env` files hold secrets: do not read or print them; new variables go in `.env.example` (or in `compose.yaml` when they are development settings).

## Working rules (summary of docs/project/P1-conventions.md)

- Everything in the repository is in English: code, comments, docs, commit messages. The user talks to you in Italian; answer in Italian.
- **Comments in depth, for a reader new to Laravel, PHP and React**: the user reads the code to learn the stack. A header on every file, PHPDoc / TSDoc on every class, function, component, prop and field, a line on each local variable, labelled JSX blocks, commented migrations; and the framework concept behind a line explained the first time it appears in a file, with a pointer to docs/concepts/C1-frontend.md or docs/concepts/C2-backend.md. The guides are equally in-depth and updated in the same change.
- **Every task comes with its "how to"** (P1.3): the docs say not only what was built but how, so the user can do the next one by hand. The how-to covers the commands in order, with their real output; the files and what goes in each; how to check the result; and the errors met. It goes in the how-to guide for the area (07 database, 08 backend, 09 frontend, or a new section), on the model of docs/how-to/H1-database.md H1.2; 04 and 05 keep the explanations. The final reply of each task also lists, briefly, the commands that were run.
- **A change updates the docs section it touches in the same commit.** Docs are grouped by purpose in `docs/start/` (S), `design/` (D), `concepts/` (C), `how-to/` (H), `project/` (P); a document's code is its letter plus a number (`H2`), and sections are cited as "see H2.3", also in code comments. Index: docs/README.md.
- Backlog: one entry per point, IDs never reused, the entry is deleted by the commit that finishes it.
- One branch per task from `main` (`feat/…`, `fix/…`, `docs/…`, `chore/…`), pushed with `make push` and merged with `make merge` (checks, `--no-ff`, push, branch deleted).

## Git identity

Commits use the personal GitHub noreply address set in this repository's `.git/config`; a computer's global identity (on the Mac, the work one) must never appear. The hook in `.githooks/` refuses any other email. Never add a `Co-Authored-By` trailer or any Claude attribution to commits or pull requests.

**At the end of every task, give a ready-to-paste commit message** for the work done, following [P1.1](docs/project/P1-conventions.md#p11-git): English, imperative one-line subject, a body when the why is not obvious, backlog IDs or doc sections when relevant, no attribution line. **Never commit, push or merge yourself: the user does it by hand.** Leave the changes in the working tree and say which branch they are on.

**At the start of every task, create its branch yourself**, before editing anything: `make branch name=<type>/<short-name>` (switches to `main`, pulls, creates the branch), with a type of [P1.1](docs/project/P1-conventions.md#p11-git) and a short English name, e.g. `docs/data-model`, `feat/sign-in`. If `main` has uncommitted changes from an earlier task, ask first. Creating the branch is the only git change you make.
