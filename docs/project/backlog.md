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
  - [OPS-4 Open the development app from a phone](#ops-4-open-the-development-app-from-a-phone)
- [UI](#ui)
  - [UI-2 Plan editor on a wide screen: the library beside the plan](#ui-2-plan-editor-on-a-wide-screen-the-library-beside-the-plan)
  - [UI-3 Add to plan from an exercise's page](#ui-3-add-to-plan-from-an-exercises-page)
- [FEAT](#feat)
  - [FEAT-3 Workout mode and Home](#feat-3-workout-mode-and-home)
  - [FEAT-5 New records during a workout](#feat-5-new-records-during-a-workout)
  - [FEAT-6 Edit a past workout](#feat-6-edit-a-past-workout)
  - [FEAT-7 An exercise's own history](#feat-7-an-exercises-own-history)
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
2. [FEAT-3](#feat-3-workout-mode-and-home) working offline (workout mode and Home are done)

The plans are done (FEAT-2: tables, API, list, page, editor); two refinements of their screens wait in [UI-2](#ui-2-plan-editor-on-a-wide-screen-the-library-beside-the-plan) and [UI-3](#ui-3-add-to-plan-from-an-exercises-page). Workout mode's refinements wait in [FEAT-5](#feat-5-new-records-during-a-workout) (live records); its preferences are on Profile (UI-7, [C1.13.4](../concepts/C1-frontend.md#c1134-preferences-on-the-account)). The summary and history are done (FEAT-4); their refinements wait in [FEAT-6](#feat-6-edit-a-past-workout) and [FEAT-7](#feat-7-an-exercises-own-history).

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

### OPS-4 Open the development app from a phone

**Priority:** medium · **Kind:** tooling, phones · **Found:** 2026-11-07

**What is missing.** Workout mode is made for a phone, and some of it can only be seen there: the screen kept on (Wake Lock), the vibration, the beep with the phone asleep, the layout under a real notch. The development app answers only on the computer itself (`localhost:5673`); a phone on the same Wi-Fi cannot open it.

**Options.**
- A) Vite listening on the local network (`server.host: true`, or `npm run dev -- --host`), the phone opening `http://<the computer's IP>:5673`. The Wake Lock API, like most powerful browser APIs, works only on HTTPS or `localhost`, so the phone would see everything but the screen kept on.
- B) A) plus HTTPS in development, with a local certificate (`@vitejs/plugin-basic-ssl`, or `mkcert`) the phone trusts, and the session cookie's settings checked for the new address ([C2.7](../concepts/C2-backend.md#c27-signing-in-sanctum)).
- C) Chrome's remote debugging of an Android phone over USB, with port forwarding: the phone opens `localhost:5673` as the computer does.

**Recommended.** C for an Android phone: no certificate, no change to the cookies, and DevTools on the computer shows the phone's page. B when an iPhone must be checked; a how-to in H3.8 in either case.

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

**Done:**
- the three tables and the API: saving a whole workout sent by the phone, late and twice, listing and reading with totals, deleting, the sets of last time, and Home's data with the suggested day (`feat/workout-api`, [C2.5.7](../concepts/C2-backend.md#c257-the-workouts-endpoints), [H1.15](../how-to/H1-database.md#h115-the-workout-tables-as-built), [H2.14](../how-to/H2-backend.md#h214-the-workouts-api-as-built));
- workout mode: Start on a plan's day, the "Last" column, one-tap sets, set types, the rest timer with sound and vibration, supersets, Previous, Next and the dots, the screen kept on, ✕ pausing and Resume on the plan's page; the workout kept on the phone and, at Done, queued and sent with `PUT /api/sessions/{id}`, the queue retried when the app opens and when the network returns (`feat/workout-mode`, [C1.17](../concepts/C1-frontend.md#c117-workout-mode), [H3.15](../how-to/H3-frontend.md#h315-workout-mode-as-built)). The big stepper and the exercise menu came with UI-6 ([C1.17.7](../concepts/C1-frontend.md#c1177-the-big-stepper-and-the-exercises-menu)); live records wait in [FEAT-5](#feat-5-new-records-during-a-workout); the summary at the end came with FEAT-4 ([C1.19](../concepts/C1-frontend.md#c119-the-summary-and-history));
- Home: the active plan's card with the suggested day, Start and a chip per day, the banner with Resume, Free workout (with Add exercises in workout mode), the week strip and its numbers (`feat/home`, [C1.18](../concepts/C1-frontend.md#c118-home), [H3.16](../how-to/H3-frontend.md#h316-home-as-built)). The recent records wait for Progress (phase 2).

**What is missing.** One part, on its own branch:
- **Working offline** ([D2.7](../design/D2-decisions.md#d27-offline-and-sync)): the PWA (vite-plugin-pwa), so the app opens with no network; the query cache kept in IndexedDB; the queue of workouts, today in `localStorage` ([C1.17.5](../concepts/C1-frontend.md#c1175-the-queue-of-workouts-to-send)), moved to IndexedDB if it grows, and sent by the service worker in the background (Background Sync, where the browser has it); a notification when a rest ends with the app in the background.

### FEAT-5 New records during a workout

**Priority:** low · **Kind:** feature · **Found:** 2026-11-07

**What is missing.** [D1.4.9](../design/D1-ui.md#d149-workout-mode) asks for a **New record** badge on a set that beats a personal record, as soon as it is ticked, and [D1.4.10](../design/D1-ui.md#d1410-workout-summary) for the records broken, highlighted in the summary ([C1.19](../concepts/C1-frontend.md#c119-the-summary-and-history)). There are no records yet: they come with Progress ([D1.4.12](../design/D1-ui.md#d1412-progress), phase 2).

**Options.**
- A) An endpoint with the user's best per exercise (heaviest weight, best estimated one-rep max, [D2.8](../design/D2-decisions.md#d28-workout-rules)), read at Start with `last-sets`; the comparison in the browser, so it works offline, during the workout and in the summary.
- B) The records only in the summary and history, worked out by the backend (`meta` of `GET /api/sessions/{id}`, beside `meta.last_sets`).

**Recommended.** A, with the records of Progress: the badge mid-workout is the motivating moment, and the comparison is a few lines once the bests are known; the summary then shows the same badges.

### FEAT-6 Edit a past workout

**Priority:** low · **Kind:** feature · **Found:** 2026-11-08

**What is missing.** [D1.4.11](../design/D1-ui.md#d1411-history) asks for a past workout's page to be editable: fix a wrong weight, add a forgotten set, change the feeling or the notes. FEAT-4 shows it read-only ([C1.19](../concepts/C1-frontend.md#c119-the-summary-and-history)); the backend already takes a whole workout again with `PUT /api/sessions/{id}` ([C2.5.7](../concepts/C2-backend.md#c257-the-workouts-endpoints)).

**Options.**
- A) An Edit button opening the workout in a form like workout mode's rows (`SetRow` without ✓ and the timer), turned back into the `PUT` body by a function the reverse of `toSessionInput()`; sent through the queue, so it works offline.
- B) Each value editable in place on the workout's page, one request per change: no such endpoint exists, and a whole-workout `PUT` per field is wasteful.

**Recommended.** A: one body, one request, the rules already tested by the backend.

### FEAT-7 An exercise's own history

**Priority:** low · **Kind:** feature · **Found:** 2026-11-08

**What is missing.** [D1.4.4](../design/D1-ui.md#d144-exercise-details) gives an exercise's page a **My history** tab: the last sessions with that exercise, the best set, the estimated one-rep max. History (FEAT-4) lists whole workouts only.

**Options.**
- A) `GET /api/exercises/{id}/history`: the user's sets of that exercise, by workout, newest first, paged, with the best set and the estimated one-rep max ([D2.8](../design/D2-decisions.md#d28-workout-rules)) worked out by the database; the tab drawn with `SessionExercises` and `loggedSetText()`, each workout compared with the one before by `compareExercise()`.
- B) Wait for Progress's "by exercise" chart (phase 2), which needs the same data, and build both together.

**Recommended.** B, unless the tab is missed before phase 2: the data, the endpoint and the best-set rules are the same as the chart's.

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
