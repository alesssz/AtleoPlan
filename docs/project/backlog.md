# Backlog

Work that is known and waiting: features, interface, backend and data changes, tooling, docs. One entry per point, each small enough to be picked up and finished on its own, with what is missing, the options and the one recommended.

This page is not a numbered section of the docs: it changes all the time, and it empties as work gets done.

## Contents

- [How this page works](#how-this-page-works)
  - [Template](#template)
- [Road to the MVP](#road-to-the-mvp)
- [OPS](#ops)
  - [OPS-2 Check that the AtleoPlan name is free](#ops-2-check-that-the-atleoplan-name-is-free)
  - [OPS-3 Deploy to the free server](#ops-3-deploy-to-the-free-server)
- [DATA](#data)
  - [DATA-1 Import and translate free-exercise-db](#data-1-import-and-translate-free-exercise-db)
- [FEAT](#feat)
  - [FEAT-2 Plans](#feat-2-plans)
  - [FEAT-3 Workout mode and Home](#feat-3-workout-mode-and-home)
  - [FEAT-4 Summary and history](#feat-4-summary-and-history)
- [BE](#be)
  - [BE-1 Exercise library: API and admin](#be-1-exercise-library-api-and-admin)
  - [BE-2 Manage users in the admin panel](#be-2-manage-users-in-the-admin-panel)
  - [BE-3 Harden the public sign-in routes](#be-3-harden-the-public-sign-in-routes)

## How this page works

- **One point, one branch** ([P1.1](P1-conventions.md#p11-git)); several small points may share one.
- **Done means deleted.** The branch that does a point removes its entry in the same commit. What the change did is told by the commit and by the section it touched, not here.
- **IDs are never reused.** Each entry has an area prefix and a number (`UI-5`, `BE-2`), kept for good. Each area counts on its own; the next number is one above the highest ever used in that area (`git log -S "UI-" -- docs/project/backlog.md` finds deleted ones).
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

The order of work for phase 1 ([D1.8](../design/D1-ui.md#d18-release-phases-and-open-questions)); each step needs the ones before it. The tables they create are designed in [D3. Data model](../design/D3-data-model.md).

1. The exercise library: its API, import and screens are done; left are its admin screen and media ([BE-1](#be-1-exercise-library-api-and-admin)) and its translation ([DATA-1](#data-1-import-and-translate-free-exercise-db))
2. [FEAT-2](#feat-2-plans) plans: the tables and the API are done; left are the screens
3. [FEAT-3](#feat-3-workout-mode-and-home) workout mode and Home
4. [FEAT-4](#feat-4-summary-and-history) summary and history

## OPS

### OPS-2 Check that the AtleoPlan name is free

**Priority:** medium · **Kind:** naming · **Found:** 2026-11-05

**What is missing.** The name ([D2.1](../design/D2-decisions.md#d21-name)) has not been checked against domains (`.app`, `.com`), App Store, Play Store and EU trademarks (EUIPO).

**Recommended.** Check before buying a domain or opening store accounts; DuckDNS needs no check.

### OPS-3 Deploy to the free server

**Priority:** low · **Kind:** deployment, postponed · **Found:** 2026-11-05

**What is missing.** The app runs only on the local machine. Deploying waits until there is something worth using away from the desk; the plan is in [D2.6](../design/D2-decisions.md#d26-hosting).

**Steps, when it is time.**
- Check again the free tiers (Oracle, DuckDNS): they change often.
- Create the Oracle Always Free account (home region Milan or Frankfurt) and an ARM VM with Ubuntu 24.04.
- Open ports 80 and 443, both in the Oracle console and in the VM's `iptables`.
- Install Docker, point `atleoplan.duckdns.org` at the VM, start the production Compose.
- Set up backups of the database and of the media on the server's disk ([D2.5](../design/D2-decisions.md#d25-photos-and-videos)).
- Write the deployment section of the docs ([P1.3](P1-conventions.md#p13-documentation)).

**Recommended.** Keep the local stack close to the production one (same Docker images, Postgres rather than SQLite), so that deploying is a configuration step and not a rewrite.

## DATA

### DATA-1 Import and translate free-exercise-db

**Priority:** high · **Kind:** seed data · **Found:** 2026-11-05

**Done:** the import, in English with muscles, equipment and photos: `make exercises-import` (`feat/exercise-import`, [C2.14.3](../concepts/C2-backend.md#c2143-the-free-exercise-db-import), [H1.12](../how-to/H1-database.md#h112-the-free-exercise-db-import-as-built)).

**What is missing.** The translation into Italian, Spanish and German of the names and instructions ([D2.3](../design/D2-decisions.md#d23-exercise-library)): Italian reviewed by hand, Spanish and German marked **Machine translated** until a native speaker reviews them.

**Options.**
- A) An Artisan command calling an LLM's API, one exercise at a time, writing each language with `setTranslation()` and adding it to `machine_translated`; it skips languages already there, so it can resume.
- B) A script outside the app that writes a JSON file of translations, then a command that reads it.

**To decide first:** which model and API, its cost for 876 exercises × 3 languages, and where the API key lives (`.env`, never in Git).

**Recommended.** A: the same shape as the import, it can stop and resume, and nothing is written twice.

## FEAT

### FEAT-2 Plans

**Priority:** high · **Kind:** feature · **Found:** 2026-11-05

**Done:** the four tables, `users.active_plan_id`, and the API: list, whole plan, create and save a whole plan with its version, delete, activate, archive (`feat/plan-api`, [C2.5.5](../concepts/C2-backend.md#c255-the-plans-endpoints), [H1.13](../how-to/H1-database.md#h113-the-plan-tables-as-built), [H2.13](../how-to/H2-backend.md#h213-the-plans-api-as-built)).

**What is missing.** The screens, each on its own branch:
- **List and details** ([D1.4.6](../design/D1-ui.md#d146-plan-list), [D1.4.7](../design/D1-ui.md#d147-plan-details)): the cards with the Active badge, the Archived filter, the days as tabs with "4 × 8–10 · 90 s" and "+ 2 warm-up", supersets joined by a bar; Set as active, Archive, Delete. The Templates section, Share and Duplicate are phase 2 ([D3.9](../design/D3-data-model.md#d39-left-for-later)).
- **Editor** ([D1.4.8](../design/D1-ui.md#d148-plan-editor)): days and exercises reordered by drag and drop (dnd-kit), exercises added from the library in its select mode ([D1.4.3](../design/D1-ui.md#d143-exercise-library)), sets with their types (W, D, F), supersets, the draft kept on the device and **Discard changes**, the warning when `meta.changed_elsewhere` is true ([D2.8](../design/D2-decisions.md#d28-workout-rules), [D3.5.7](../design/D3-data-model.md#d357-when-a-plan-is-changed-in-two-places)).

### FEAT-3 Workout mode and Home

**Priority:** high · **Kind:** feature · **Found:** 2026-11-05

**What is missing.** Home with the suggested day ([D1.4.2](../design/D1-ui.md#d142-home)); workout mode with the rest timer, last time's values and one-tap sets ([D1.4.9](../design/D1-ui.md#d149-workout-mode)); working offline: the PWA (vite-plugin-pwa), the persisted query cache, sessions and sets with UUIDs synced later ([D2.7](../design/D2-decisions.md#d27-offline-and-sync)). Tables: [D3.6](../design/D3-data-model.md#d36-workouts). Needs FEAT-2.

### FEAT-4 Summary and history

**Priority:** medium · **Kind:** feature · **Found:** 2026-11-05

**What is missing.** The summary at the end of a workout and the history of past sessions ([D1.4.10](../design/D1-ui.md#d1410-workout-summary), [D1.4.11](../design/D1-ui.md#d1411-history)). Needs FEAT-3. Charts and records are phase 2.

## BE

### BE-1 Exercise library: API and admin

**Priority:** high · **Kind:** backend · **Found:** 2026-11-05

**Done:**
- the tables, models, relations and seeders of the library, with their tests (`feat/exercise-tables`, [H1.10](../how-to/H1-database.md#h110-the-exercise-library-as-built));
- the API without media: the policy, the list with search, filters and pages, reading, creating, changing and deleting personal exercises, the lists of muscles and equipment (`feat/exercise-api`, [C2.5.4](../concepts/C2-backend.md#c254-the-exercise-librarys-endpoints), [H2.12](../how-to/H2-backend.md#h212-the-exercise-library-api-as-built)).

**What is missing.** Two parts, each on its own branch:
- `feat/exercise-media`: the photo and video uploads of personal exercises, with their limits, the conversion job and the order of the photos ([D2.5](../design/D2-decisions.md#d25-photos-and-videos)); the resized photos (a 400 px thumbnail for the library's rows) and the videos in `ExerciseResource`, which already sends the photos as stored; in the editor, the media field of [D1.4.5](../design/D1-ui.md#d145-exercise-editor); **Duplicate as mine** for a public exercise ([D1.4.4](../design/D1-ui.md#d144-exercise-details)), which copies its photos too.
- `feat/exercise-admin`: the Filament resource for the public library, one field per language ([D1.4.15](../design/D1-ui.md#d1415-admin-panel-filament)). Filament asks the model's policy, and `ExercisePolicy` refuses changes to public exercises, admins included, because the API must: the resource overrides `canEdit()`, `canDelete()` and `canCreate()` for admins, or the policy gains a separate ability for the panel.

Tables: [D3.4](../design/D3-data-model.md#d34-exercise-library). DATA-1 then fills it.

### BE-2 Manage users in the admin panel

**Priority:** medium · **Kind:** missing screen · **Found:** 2026-11-05

**What is missing.** The Users screen of [D1.4.15](../design/D1-ui.md#d1415-admin-panel-filament), to list users, change their role and disable them. The column exists and signing in already refuses a disabled account, but nothing sets it yet, and a user who is already signed in stays signed in until the session ends.

**Options.**
- A) A Filament resource, and a middleware on the `auth:sanctum` routes that signs out a disabled account.
- B) Only the resource, with disabling taking effect at the next sign-in.

**Recommended.** A: disabling an account is usually urgent, so it must act at once.

### BE-3 Harden the public sign-in routes

**Priority:** low until the app is public · **Kind:** security · **Found:** 2026-11-05

**What is missing.** Signing in has a rate limit ([C2.7.4](../concepts/C2-backend.md#c274-slowing-down-password-guessing)). Signing up and asking for a reset email have none, beyond one email per address per minute. Both also reveal whether an address has an account, by their answers.

**Options.**
- A) Rate limits on both routes, and the same answer to a known and an unknown email when asking for a reset.
- B) Leave as it is while the app is personal.

**Recommended.** B for now and A before opening to other users (phase 2): with a single user nothing is at stake, and signing up will still need to say that an email is taken, unless it moves to verifying the address by email.
