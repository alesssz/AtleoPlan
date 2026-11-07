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
- [UI](#ui)
  - [UI-2 Plan editor on a wide screen: the library beside the plan](#ui-2-plan-editor-on-a-wide-screen-the-library-beside-the-plan)
  - [UI-3 Add to plan from an exercise's page](#ui-3-add-to-plan-from-an-exercises-page)
- [FEAT](#feat)
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

1. The exercise library: its API, import, translation and screens are done; left are its admin screen, where translations are reviewed, and its media ([BE-1](#be-1-exercise-library-api-and-admin))
2. [FEAT-3](#feat-3-workout-mode-and-home) workout mode and Home
3. [FEAT-4](#feat-4-summary-and-history) summary and history

The plans are done (FEAT-2: tables, API, list, page, editor); two refinements of their screens wait in [UI-2](#ui-2-plan-editor-on-a-wide-screen-the-library-beside-the-plan) and [UI-3](#ui-3-add-to-plan-from-an-exercises-page).

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

## UI

### UI-2 Plan editor on a wide screen: the library beside the plan

**Priority:** low · **Kind:** desktop layout · **Found:** 2026-11-07

**What is missing.** [D1.4.8](../design/D1-ui.md#d148-plan-editor) asks, on desktop, for two columns: the library on the left, the plan on the right, exercises dragged from the library into a day. The editor ([C1.16](../concepts/C1-frontend.md#c116-the-plan-editor)) adds exercises from a picker window on every width, which works but leaves a wide screen half empty.

**Options.**
- A) From 1024 px, the picker's list as a left column, and dnd-kit dragging from it into the open day: a second kind of draggable, and each day a droppable.
- B) The same two columns, adding with a "+" on each library row, without dragging across.

**Recommended.** B first: it gives the layout for a fraction of the work, reusing `ExercisePicker`'s list; dragging across can follow if it is missed.

### UI-3 Add to plan from an exercise's page

**Priority:** medium · **Kind:** missing action · **Found:** 2026-11-07

**What is missing.** **Add to plan** on an exercise's page ([D1.4.4](../design/D1-ui.md#d144-exercise-details)): choose a plan and a day, and the exercise joins it with three sets.

**Options.**
- A) A dialog listing the plans and their days; the app reads the plan, adds the exercise with the draft's functions (`plan-draft.ts`) and saves the whole plan.
- B) Open the plan's editor with the exercise already added: `/plans/:id/edit?add=12&day=2`.

**Recommended.** B: it reuses the editor, its draft and its rules, and the user sees the result before saving.

## FEAT

### FEAT-3 Workout mode and Home

**Priority:** high · **Kind:** feature · **Found:** 2026-11-05

**Done:** the three tables and the API: saving a whole workout sent by the phone, late and twice, listing and reading with totals, deleting, the sets of last time, and Home's data with the suggested day (`feat/workout-api`, [C2.5.7](../concepts/C2-backend.md#c257-the-workouts-endpoints), [H1.15](../how-to/H1-database.md#h115-the-workout-tables-as-built), [H2.14](../how-to/H2-backend.md#h214-the-workouts-api-as-built)).

**What is missing.** The screens, each on its own branch:
- **Workout mode** ([D1.4.9](../design/D1-ui.md#d149-workout-mode)): full screen, the day's exercises with the "Last" column from `last-sets`, one-tap sets, set types, the rest timer with sound and vibration, supersets, Previous and Next, swap and skip; the session kept on the device and sent with `PUT /api/sessions/{id}`; the screen kept on (Wake Lock). The summary at the end belongs to FEAT-4.
- **Home** ([D1.4.2](../design/D1-ui.md#d142-home)) from `GET /api/home`: the active plan's card with the suggested day and Start, the other days as chips, the banner of a workout left open, the week strip with its numbers, Free workout.
- **Working offline** ([D2.7](../design/D2-decisions.md#d27-offline-and-sync)): the PWA (vite-plugin-pwa), the query cache kept in IndexedDB, the queue of workouts to send, retried until a 2xx or a 410.

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

Tables: [D3.4](../design/D3-data-model.md#d34-exercise-library). The admin screen also takes a language out of an exercise's `machine_translated` when a person has reviewed it: every imported exercise has `it`, `es` and `de` there ([C2.14.4](../concepts/C2-backend.md#c2144-the-translation-of-the-library)).

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
