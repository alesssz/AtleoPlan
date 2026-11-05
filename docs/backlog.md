# Backlog

Work that is known and waiting: features, interface, backend and data changes, tooling, docs. One entry per point, each small enough to be picked up and finished on its own, with what is missing, the options and the one recommended.

This page is not a numbered section of the docs: it changes all the time, and it empties as work gets done.

## How this page works

- **One point, one branch** ([3.1](03-conventions.md#31-git)); several small points may share one.
- **Done means deleted.** The branch that does a point removes its entry in the same commit. What the change did is told by the commit and by the section it touched, not here.
- **IDs are never reused.** Each entry has an area prefix and a number (`UI-5`, `BE-2`), kept for good. Each area counts on its own; the next number is one above the highest ever used in that area (`git log -S "UI-" -- docs/backlog.md` finds deleted ones).
- **Areas:** `UI` interface, `FEAT` features, `BE` server, `DATA` database, `OPS` tooling, CI, deployment, `DOCS` documentation. They appear with their first entry and go when they empty.
- **Priority:** high (in the way), medium (worse than it should be), low (polish).

### Template

```markdown
### UI-n Short statement of the problem

**Priority:** high | medium | low · **Kind:** e.g. missing feature, phones · **Found:** YYYY-MM-DD

**What is missing.** What, where, and why it matters.

**Options.**
- A) …
- B) …

**Recommended.** Which option and why.
```

---

## Road to the MVP

The order of work for phase 1 ([1.8](01-ui-design.md#18-release-phases-and-open-questions)); each step needs the ones before it.

1. [DATA-2](#data-2-design-the-data-model) data model
2. [FEAT-1](#feat-1-sign-in-and-accounts) sign-in
3. [BE-1](#be-1-exercise-library-api-and-admin) exercise library API, then [DATA-1](#data-1-import-and-translate-free-exercise-db) its import
4. [UI-1](#ui-1-exercise-library-screens) exercise library screens
5. [FEAT-2](#feat-2-plans) plans
6. [FEAT-3](#feat-3-workout-mode-and-home) workout mode and Home
7. [FEAT-4](#feat-4-summary-and-history) summary and history

## OPS

### OPS-2 Check that the AtleoPlan name is free

**Priority:** medium · **Kind:** naming · **Found:** 2026-11-05

**What is missing.** The name ([2.1](02-decisions.md#21-name)) has not been checked against domains (`.app`, `.com`), App Store, Play Store and EU trademarks (EUIPO).

**Recommended.** Check before buying a domain or opening store accounts; DuckDNS needs no check.

### OPS-3 Deploy to the free server

**Priority:** low · **Kind:** deployment, postponed · **Found:** 2026-11-05

**What is missing.** The app runs only on the local machine. Deploying waits until there is something worth using away from the desk; the plan is in [2.6](02-decisions.md#26-hosting).

**Steps, when it is time.**
- Check again the free tiers (Oracle, DuckDNS): they change often.
- Create the Oracle Always Free account (home region Milan or Frankfurt) and an ARM VM with Ubuntu 24.04.
- Open ports 80 and 443, both in the Oracle console and in the VM's `iptables`.
- Install Docker, point `atleoplan.duckdns.org` at the VM, start the production Compose.
- Set up backups of the database and of the media on the server's disk ([2.5](02-decisions.md#25-photos-and-videos)).
- Write the deployment section of the docs ([3.3](03-conventions.md#33-documentation)).

**Recommended.** Keep the local stack close to the production one (same Docker images, Postgres rather than SQLite), so that deploying is a configuration step and not a rewrite.

## DATA

### DATA-2 Design the data model

**Priority:** high · **Kind:** design · **Found:** 2026-11-05

**What is missing.** The tables of the MVP are described nowhere as a whole; [2.3](02-decisions.md#23-exercise-library), [2.7](02-decisions.md#27-offline-and-sync) and [2.8](02-decisions.md#28-workout-rules) hold pieces. Needed: exercises (public and personal, translatable fields), muscles, equipment, plans, days, plan items (sets, reps, rest, set types, supersets), sessions and logged sets (UUIDs from the device), the active plan, user preferences.

**Options.**
- A) A new docs section, "5. Data model", with every MVP table, column and relation, reviewed before any migration.
- B) Design each table with the feature that needs it.

**Recommended.** A: migrations are expensive to change once data exists ([3.2](03-conventions.md#32-code)), and the tables lean on each other (a logged set points to an exercise and to a plan item).

### DATA-1 Import and translate free-exercise-db

**Priority:** high · **Kind:** seed data · **Found:** 2026-11-05

**What is missing.** The public library is empty until free-exercise-db is imported ([2.3](02-decisions.md#23-exercise-library)).

**Options.**
- A) A Laravel command that reads the JSON and the photos and writes them into the database, plus a separate translation script.
- B) A one-off SQL dump.

**Recommended.** A: the command can run again on a fresh database, and translations get their **Machine translated** flag as they are written.

## FEAT

### FEAT-1 Sign-in and accounts

**Priority:** high · **Kind:** feature · **Found:** 2026-11-05

**What is missing.** Sign up, sign in, sign out, forgot and reset password (emails in Mailpit), the guard that sends visitors to `/login`, and language and theme saved on the account ([1.4.1](01-ui-design.md#141-sign-in-and-onboarding), [1.4.14](01-ui-design.md#1414-profile-and-settings)). Brings react-hook-form and zod for the forms, and the admin flag that opens Filament.

**Options.**
- A) Laravel Fortify: Laravel's headless authentication backend (routes, rate limiting, reset tokens), with the React screens written by us.
- B) Hand-written controllers for each step.

**Recommended.** A: the security-sensitive parts are Laravel's own and maintained; Sanctum's SPA mode is already set ([0.6](00-setup.md#06-creating-the-laravel-backend)).

### FEAT-2 Plans

**Priority:** high · **Kind:** feature · **Found:** 2026-11-05

**What is missing.** Plan list, details and editor: days, exercises with sets, reps, rest, set types (W, D, F) and supersets, reordering by drag and drop (dnd-kit), the one active plan ([1.4.6](01-ui-design.md#146-plan-list)–[1.4.8](01-ui-design.md#148-plan-editor), [2.8](02-decisions.md#28-workout-rules)). Needs DATA-2, FEAT-1, BE-1.

### FEAT-3 Workout mode and Home

**Priority:** high · **Kind:** feature · **Found:** 2026-11-05

**What is missing.** Home with the suggested day ([1.4.2](01-ui-design.md#142-home)); workout mode with the rest timer, last time's values and one-tap sets ([1.4.9](01-ui-design.md#149-workout-mode)); working offline: the PWA (vite-plugin-pwa), the persisted query cache, sessions and sets with UUIDs synced later ([2.7](02-decisions.md#27-offline-and-sync)). Needs FEAT-2.

### FEAT-4 Summary and history

**Priority:** medium · **Kind:** feature · **Found:** 2026-11-05

**What is missing.** The summary at the end of a workout and the history of past sessions ([1.4.10](01-ui-design.md#1410-workout-summary), [1.4.11](01-ui-design.md#1411-history)). Needs FEAT-3. Charts and records are phase 2.

## BE

### BE-1 Exercise library: API and admin

**Priority:** high · **Kind:** backend · **Found:** 2026-11-05

**What is missing.** Migrations, models and policies for exercises (public, managed by admins; personal, owned by a user), with translatable fields and photos (medialibrary); the API to list with search and filters (laravel-query-builder), show, and create, edit and delete personal ones; the Filament resource for the public library ([1.4.15](01-ui-design.md#1415-admin-panel-filament)). Needs DATA-2 and FEAT-1; DATA-1 then fills it.

## UI

### UI-1 Exercise library screens

**Priority:** high · **Kind:** missing screens · **Found:** 2026-11-05

**What is missing.** The library with search and filters, the exercise details and the editor of personal exercises with photos ([1.4.3](01-ui-design.md#143-exercise-library)–[1.4.5](01-ui-design.md#145-exercise-editor)), replacing the placeholder at `/exercises`. Needs BE-1.
