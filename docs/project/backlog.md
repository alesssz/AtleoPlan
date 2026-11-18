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
  - [OPS-5 Drop the minimatch override](#ops-5-drop-the-minimatch-override)
  - [OPS-6 Drop the glob override](#ops-6-drop-the-glob-override)
- [UI](#ui)
  - [UI-2 Plan editor on a wide screen: the library beside the plan](#ui-2-plan-editor-on-a-wide-screen-the-library-beside-the-plan)
  - [UI-3 Add to plan from an exercise's page](#ui-3-add-to-plan-from-an-exercises-page)
  - [UI-8 Photos while creating an exercise](#ui-8-photos-while-creating-an-exercise)
- [FEAT](#feat)
  - [FEAT-3 Workout mode and Home](#feat-3-workout-mode-and-home)
  - [FEAT-5 New records during a workout](#feat-5-new-records-during-a-workout)
  - [FEAT-6 Edit a past workout](#feat-6-edit-a-past-workout)
  - [FEAT-7 An exercise's own history](#feat-7-an-exercises-own-history)
  - [FEAT-8 Write a plan in a spreadsheet, and import it](#feat-8-write-a-plan-in-a-spreadsheet-and-import-it)
  - [FEAT-10 Google on Profile](#feat-10-google-on-profile)
  - [FEAT-11 Videos of an exercise](#feat-11-videos-of-an-exercise)
- [BE](#be)
  - [BE-3 Harden the public sign-in routes](#be-3-harden-the-public-sign-in-routes)
- [DATA](#data)
  - [DATA-4 Weighted holds and carries have no fitting logging type](#data-4-weighted-holds-and-carries-have-no-fitting-logging-type)

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

**What is missing.** What, where it shows, how to see it, and why it matters.

**Where.** Files and parts of them.

**Options.**
- A) …
- B) …

**Recommended.** Which option, why, and how to check it is done.
```

---

## Road to the MVP

Phase 1 ([D1.8](../design/D1-ui.md#d18-release-phases-and-open-questions)) is built except for one point: [FEAT-3](#feat-3-workout-mode-and-home), working offline. The exercise library, sign-in (Google included), the admin panel, the plans, workout mode, Home, the summary and history are in place; the tables are in [D3. Data model](../design/D3-data-model.md).

Refinements of what exists, not blocking the MVP: [UI-2](#ui-2-plan-editor-on-a-wide-screen-the-library-beside-the-plan), [UI-3](#ui-3-add-to-plan-from-an-exercises-page), [UI-8](#ui-8-photos-while-creating-an-exercise), [FEAT-5](#feat-5-new-records-during-a-workout), [FEAT-6](#feat-6-edit-a-past-workout), [FEAT-7](#feat-7-an-exercises-own-history), [FEAT-10](#feat-10-google-on-profile). Phase 2: [FEAT-11](#feat-11-videos-of-an-exercise), [BE-3](#be-3-harden-the-public-sign-in-routes).

## OPS

### OPS-2 Check that the AtleoPlan name is free

**Priority:** medium · **Kind:** naming · **Found:** 2026-11-05

**What is missing.** The name ([D2.1](../design/D2-decisions.md#d21-name)) has not been checked against domains (`.app`, `.com`), App Store, Play Store and EU trademarks (EUIPO).

**Recommended.** Check before buying a domain or opening store accounts; DuckDNS needs no check.

### OPS-3 Deploy to the free server

**Priority:** low · **Kind:** deployment, postponed · **Found:** 2026-11-05

**What is missing.** The app runs only locally. Deployment is postponed until the app is worth putting online; the target setup is in [D2.6](../design/D2-decisions.md#d26-hosting).

**Steps.**
- Check the free tiers again (Oracle, DuckDNS): they change often.
- Create the Oracle Always Free account (home region Milan or Frankfurt) and an ARM VM with Ubuntu 24.04.
- Open ports 80 and 443, both in the Oracle console and in the VM's `iptables`.
- Install Docker, point `atleoplan.duckdns.org` at the VM, start the production Compose.
- Set up backups of the database and of the media on the server's disk ([D2.5](../design/D2-decisions.md#d25-photos-and-videos)).
- Caddy forwards `/api`, `/sanctum`, `/storage` and `/auth/` to Laravel, as Vite does in development; Google's client gets the production return address, and the app is published ([S1.11.6](../start/S1-setup.md#s1116-later-when-deploying)).
- Write the deployment section of the docs ([P1.3](P1-conventions.md#p13-documentation)).

**Recommended.** Keep the local stack close to the production one (same Docker images, Postgres rather than SQLite), so that deploying is a configuration step and not a rewrite.

### OPS-5 Drop the minimatch override

**Priority:** low · **Kind:** dependencies · **Found:** 2026-11-13

**What is missing.** `frontend/package.json` forces `minimatch` 11 with `overrides`, for a vulnerability fixed only there, while `eslint`, `typescript-eslint` and `shadcn` (through `ts-morph`) still ask for 10 ([H3.7.1](../how-to/H3-frontend.md#h371-a-vulnerable-package-deep-in-the-tree-overrides)). An override is a version nobody upstream tested with; it should not outlive its reason.

**Recommended.** After updating those packages, remove `overrides` and the `"//"` note, `npm install`, `npm ls minimatch`: when no 10.x is left, the override goes, in a `chore/…` branch with `make check`.

### OPS-6 Drop the glob override

**Priority:** low · **Kind:** dependencies · **Found:** 2026-11-17

**What is missing.** `frontend/package.json` forces `workbox-build`'s `glob` to 14: its own range, `^11.0.1`, finds no file with the forced `minimatch` 11 ([H3.7.1](../how-to/H3-frontend.md#h371-a-vulnerable-package-deep-in-the-tree-overrides)), and 11 has an advisory fixed only in 14. Build time only, but a version `workbox-build` was not tested with.

**Recommended.** When `workbox-build` (through `vite-plugin-pwa`) accepts `glob` 14, remove the scoped override and its line in the `"//"` note, `npm install`, `npm ls glob`, then `make fe-build` must still list the precached files; in a `chore/…` branch with `make check`.

## UI

### UI-2 Plan editor on a wide screen: the library beside the plan

**Priority:** low · **Kind:** desktop layout · **Found:** 2026-11-07

**What is missing.** [D1.4.8](../design/D1-ui.md#d148-plan-editor) asks, on desktop, for two columns: the library on the left, the plan on the right, exercises dragged from the library into a day. The editor ([C1.16](../concepts/C1-frontend.md#c116-the-plan-editor)) adds exercises from a picker window on every width, which works but leaves a wide screen half empty. Since the editor has two steps ([C1.16.7](../concepts/C1-frontend.md#c1167-two-steps-one-draft)), the columns belong in the second: the library on the left, the open tab's exercises on the right.

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

### UI-8 Photos while creating an exercise

**Priority:** low · **Kind:** missing action · **Found:** 2026-11-12

**What is missing.** Photos are added on an exercise's edit page ([C1.14.7](../concepts/C1-frontend.md#c1147-uploading-photos-and-duplicate-as-mine)): the upload needs the exercise's id, which the server gives at Create. On the new exercise's page a line says so, and the user creates, then opens Edit to add them.

**Options.**
- A) The create page keeps the files chosen (previews from `URL.createObjectURL`), creates the exercise, then sends them one by one with their bars, and opens the exercise.
- B) After Create, open the edit page instead of the exercise's, with the photos' section in view.
- C) As it is.

**Recommended.** B first, a one-line change in `useGoToExercise()`; A if B feels like a detour.

## FEAT

### FEAT-3 Workout mode and Home

**Priority:** high · **Kind:** feature · **Found:** 2026-11-05

**Done.** The workout tables and API ([C2.5.7](../concepts/C2-backend.md#c257-the-workouts-endpoints)), workout mode ([C1.17](../concepts/C1-frontend.md#c117-workout-mode)) and Home ([C1.18](../concepts/C1-frontend.md#c118-home)); finished workouts are already queued on the phone and retried when the app opens and when the network returns; the service worker opens the app with no network, and the query cache kept in IndexedDB for a week opens the screens already seen, and Start works from the active plan and its last sets read ahead, Last column included ([C1.21](../concepts/C1-frontend.md#c121-opening-with-no-network)). Live records are tracked in [FEAT-5](#feat-5-new-records-during-a-workout); Home's recent records wait for Progress (phase 2).

**What is missing.** **Working offline** ([D2.7](../design/D2-decisions.md#d27-offline-and-sync)): the photos of the active plan's exercises downloaded ahead by the service worker; a general queue for the other changes made offline (preferences first, [C1.11](../concepts/C1-frontend.md#c111-known-limits)) and `SyncIndicator` ([D1.6](../design/D1-ui.md#d16-states-and-edge-cases)); the queue of workouts, today in `localStorage` ([C1.17.5](../concepts/C1-frontend.md#c1175-the-queue-of-workouts-to-send)), moved to IndexedDB if it grows, and sent by the service worker in the background (Background Sync, where the browser has it); a notification when a rest ends with the app in the background.

### FEAT-5 New records during a workout

**Priority:** low · **Kind:** feature · **Found:** 2026-11-07

**What is missing.** [D1.4.9](../design/D1-ui.md#d149-workout-mode) asks for a **New record** badge on a set that beats a personal record, as soon as it is ticked, and [D1.4.10](../design/D1-ui.md#d1410-workout-summary) for the records broken, highlighted in the summary ([C1.19](../concepts/C1-frontend.md#c119-the-summary-and-history)). There are no records yet: they come with Progress ([D1.4.12](../design/D1-ui.md#d1412-progress), phase 2).

**Options.**
- A) An endpoint with the user's best per exercise (heaviest weight, best estimated one-rep max, [D2.8](../design/D2-decisions.md#d28-workout-rules)), read at Start with `last-sets`; the comparison in the browser, so it works offline, during the workout and in the summary.
- B) The records only in the summary and history, worked out by the backend (`meta` of `GET /api/sessions/{id}`, beside `meta.last_sets`).

**Recommended.** A, with the records of Progress: the badge mid-workout is the motivating moment, and the comparison is a few lines once the bests are known; the summary then shows the same badges.

**Two kinds of best with a time.** A hold (a dead hang, a plank, logged by time) is better longer. Reps done as fast as possible (a plan item's `for_time`, [C1.17.9](../concepts/C1-frontend.md#c1179-exercises-done-as-fast-as-possible)) are better with the same reps in less time, and the set says so itself: it has both `reps` and `duration_seconds`. The comparison with last time already follows this (`compare.ts`); the records should too, and keep the two kinds apart, as last time does.

### FEAT-6 Edit a past workout

**Priority:** low · **Kind:** feature · **Found:** 2026-11-08

**What is missing.** [D1.4.11](../design/D1-ui.md#d1411-history) asks for a past workout's page to be editable: fix a wrong weight, add a forgotten set, change the feeling or the notes. The page is read-only today ([C1.19](../concepts/C1-frontend.md#c119-the-summary-and-history)); the backend already takes a whole workout again with `PUT /api/sessions/{id}` ([C2.5.7](../concepts/C2-backend.md#c257-the-workouts-endpoints)).

**Options.**
- A) An Edit button opening the workout in a form like workout mode's rows (`SetRow` without ✓ and the timer), turned back into the `PUT` body by a function the reverse of `toSessionInput()`; sent through the queue, so it works offline.
- B) Each value editable in place on the workout's page, one request per change: no such endpoint exists, and a whole-workout `PUT` per field is wasteful.

**Recommended.** A: one body, one request, the rules already tested by the backend.

### FEAT-7 An exercise's own history

**Priority:** low · **Kind:** feature · **Found:** 2026-11-08

**What is missing.** [D1.4.4](../design/D1-ui.md#d144-exercise-details) gives an exercise's page a **My history** tab: the last sessions with that exercise, the best set, the estimated one-rep max. History lists whole workouts only.

**Options.**
- A) `GET /api/exercises/{id}/history`: the user's sets of that exercise, by workout, newest first, paged, with the best set and the estimated one-rep max ([D2.8](../design/D2-decisions.md#d28-workout-rules)) worked out by the database; the tab drawn with `SessionExercises` and `loggedSetText()`, each workout compared with the one before by `compareExercise()`.
- B) Wait for Progress's "by exercise" chart (phase 2), which needs the same data, and build both together.

**Recommended.** B, unless the tab is missed before phase 2: the data, the endpoint and the best-set rules are the same as the chart's.

### FEAT-8 Write a plan in a spreadsheet, and import it

**Priority:** low · **Kind:** idea · **Found:** 2026-11-10

**What is missing.** A plan can be imported from a file made by Export ([D3.5.8](../design/D3-data-model.md#d358-the-plan-file)), JSON, complete but not meant to be written by hand ([D2.9](../design/D2-decisions.md#d29-plan-files)). Writing a long plan from paper might be quicker in a spreadsheet than in the editor: a row per exercise, columns for day, exercise, sets, reps, weight, rest, notes.

**Options.**
- A) A downloadable Excel template and its import: `.xlsx` read on the server (a PHP library such as PhpSpreadsheet) or in the browser (SheetJS); exercises matched by name, as the JSON import does by its third rule, and the unknown ones listed for the user to pick or create.
- B) The same with CSV only: no library, but Excel opens and saves CSV with the computer's separator (`;` in Italy) and may turn "8-10" into a date.
- C) Nothing: the editor, with the picker's search and Create «…», is quick enough.

**Recommended.** Defer until there is a real need (a long plan to transcribe from paper); then A, with an Excel template, the format users are most likely to have.

### FEAT-10 Google on Profile

**Priority:** low · **Kind:** missing feature · **Found:** 2026-11-11

**What is missing.** Signing in with Google works ([C2.7.8](../concepts/C2-backend.md#c278-signing-in-with-google)), but Profile says nothing about it. A user who made the account with a password cannot link Google from there (they can only by signing in with Google with the same, verified, address), nor unlink it; a user who signed up with Google does not see that they have no password, and learns to set one only from Forgot password.

**Options.**
- A) An "Accounts" card on Profile: Google linked or not, with Link (the same `/auth/google/redirect`, with the signed-in user linked instead of a new one) and Unlink (refused while there is no password, or the account would have no way in); "Set a password" for an account without one, sending the reset email.
- B) Only the information: "Signed in with Google", and "no password yet" with the link to set one.

**Recommended.** B before the app opens to other users (phase 2); A when Apple sign-in arrives, when choosing between two providers makes Link and Unlink worth it.

### FEAT-11 Videos of an exercise

**Priority:** low, phase 2 · **Kind:** feature · **Found:** 2026-11-12

**What is missing.** The videos of [D2.5](../design/D2-decisions.md#d25-photos-and-videos) and [D1.4.5](../design/D1-ui.md#d145-exercise-editor): up to 2 per exercise, 30 s and 100 MB each, converted by a queued job with ffmpeg (already in the Docker image) to 720p H.264 without audio, with a poster image, the original deleted; "Processing…" until the job ends; on the exercise's page, muted and looping, full screen on a tap. Photos are done; D1.8 puts video upload in phase 2.

**Options.**
- A) The same shape as the photos: `POST /api/exercises/{id}/videos`, a job of our own that runs ffmpeg (medialibrary's conversions make images, not videos), a `processing` state in the JSON, the panel's field for public exercises.
- B) Only the YouTube link, which already exists ([D1.4.5](../design/D1-ui.md#d145-exercise-editor)).

**Recommended.** A in phase 2; B until then.

## BE

### BE-3 Harden the public sign-in routes

**Priority:** low until the app is public · **Kind:** security · **Found:** 2026-11-05

**What is missing.** Signing in has a rate limit ([C2.7.4](../concepts/C2-backend.md#c274-slowing-down-password-guessing)). Signing up and asking for a reset email have none, beyond one email per address per minute. Both also reveal whether an address has an account, by their answers.

**Options.**
- A) Rate limits on both routes, and the same answer to a known and an unknown email when asking for a reset.
- B) Leave as it is until the app is public.

**Recommended.** A before opening to other users (phase 2); until then the app is not deployed, so nothing is exposed. Signing up will still reveal that an email is taken, unless it moves to verifying the address by email first.

## DATA

### DATA-4 Weighted holds and carries have no fitting logging type

**Priority:** low · **Kind:** data model · **Found:** 2026-11-12

**What is missing.** Some of free-exercise-db's exercises are a weight held for a time or carried for a distance: Plate Pinch and Crucifix (held), Farmer's Walk, Yoke Walk, Rickshaw Carry and the sleds (carried). The import guesses them as weight and reps, which is wrong; but `time` and `distance` record no weight ([D3.6.3](../design/D3-data-model.md#d363-logged_sets)), so the list of corrected logging types leaves them out ([C2.14.6](../concepts/C2-backend.md#c2146-the-logging-types-corrected-after-the-import)). "Farmer's walk, 2 × 32 kg, 40 m" cannot be written.

**Options.**
- A) `time` and `distance` accept an optional `weight_kg`, as `reps` does for an added weight: a change to the rules of `SaveSessionRequest`, of the plan's sets and of workout mode's rows, no new column. Then the list of corrected logging types gains these exercises.
- B) Two new types, `weight_time` and `weight_distance`: clearer, but one more value in the enum, the migration's check, and every `switch` on the type in the frontend.
- C) Nothing: no current plan uses a weighted hold or carry.

**Recommended.** C until a plan needs one; then A, which keeps four types and reuses the optional weight that `reps` already has.
