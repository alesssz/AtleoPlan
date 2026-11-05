# 3. Conventions

How work is done in this repository: Git, code, comments, documentation and the backlog. They follow Chronovault's conventions, adapted to Laravel and React.

---

## 3.1 Git

- **One branch per task** from `main`, with a short English name and a type prefix: `feat/plan-editor`, `fix/rest-timer`, `docs/ui-design`, `chore/docker`.
- **Commit messages** in English, imperative, one subject line (`Add the rest timer to workout mode`), a body when the why is not obvious.
- **Identity:** commits use the same personal GitHub identity as Chronovault, set in this repository's own `.git/config`; the global Git configuration of this computer is for work and is never used here.
- **No real email in the history:** author and committer are always the GitHub noreply address, so the repository can become public as it is. The `pre-commit` hook in `.githooks/` refuses any other identity; a new clone turns it on with `git config core.hooksPath .githooks` ([0.3](00-setup.md#03-git-identity)).
- Merges into `main` keep a merge commit (`--no-ff`), so each branch stays readable in the history.

---

## 3.2 Code

- **Language:** everything in the repository is in English: code, comments, docs, commit messages. The interface's texts are in translation files, one per language (Italian, English, Spanish, German), never written in a component ([2.4](02-decisions.md#24-languages)).
- **Comments, in depth:**
  - Every file starts with what it is for and how it fits in (a PHP docblock at the top of the class, a block comment at the top of a TypeScript file).
  - Every class, function, React component, hook, exported constant, prop and type field has a doc comment (PHPDoc / TSDoc).
  - Every local constant or variable gets a short line saying what it holds; one line may cover a group that belongs together.
  - Non-obvious lines explain *why*, not *what*.
  - The main blocks of JSX are labelled (`{/* Rest timer bar */}`), and Blade / Filament views likewise.
  - Tests describe their fixtures and scenarios.
  - Migrations get comments explaining each table and column; once applied, a migration never changes: a change is a new migration.
- **Style:**
  - PHP: **Laravel Pint** with the `laravel` preset.
  - TypeScript: **ESLint** with stylistic rules, as in Chronovault: 2 spaces, no semicolons, single quotes; no Prettier. VS Code fixes on save.
- **A new API endpoint:** the controller only authorises (a policy), validates (a Form Request) and calls an action or service; the rules live in the service, tested without HTTP; the answer is an API Resource. Every route is covered by a Pest test, the forbidden cases included (another user's plan, a public exercise edited by a non-admin).
- **A new table or column:** migration (commented) → model (casts, relations) → policy → factory → tests → API Resource → the frontend's API types.
- **Identifiers created on the device** (sessions, logged sets) are UUIDs, and the endpoints that receive them are idempotent ([2.7](02-decisions.md#27-offline-and-sync)).
- **Icon-only buttons** always have a label, which is also their tooltip: mouse users see what screen readers hear ([1.7](01-ui-design.md#17-responsive-layout-and-accessibility)).
- **Never** put credentials (storage keys, API tokens) in client code or in Git; they live in `.env`, which is not committed (`.env.example` is, with every variable and no secrets).

---

## 3.3 Documentation

- **`README.md`** holds only the introduction, a short quick start and the index; everything else is in `docs/`, one file per numbered section (`docs/02-decisions.md` is section 2).
- **A change updates the section it touches, in the same commit.** A change to how the project is installed or started also updates the setup section, once it exists.
- **Headings keep their numbers**, and references give them ("see 1.4.9"), in the docs and in code comments: `// Warm-up sets are excluded (docs/02-decisions.md 2.8)`.
- **A new section** is a new `docs/NN-name.md`, a row in the README's index, and the navigation lines at the bottom of the previous and next pages.
- **Setup** ([0](00-setup.md)) follows the project: a new service, port, command or prerequisite updates it in the same commit.
- Sections still to come, as the code is written: architecture, project structure, data flows, data model and security, API reference, configuration, testing, deployment, troubleshooting.

---

## 3.4 Backlog

Work known and waiting goes in [`docs/backlog.md`](backlog.md), one entry per point with an ID (`UI-5`, `FEAT-1`) that is never reused. The branch that does a point deletes its entry in the same commit; a point found along the way that does not belong to the branch gets an entry instead of a fix on the side.

---

← [2. Decisions](02-decisions.md) · [Contents](../README.md#documentation)
