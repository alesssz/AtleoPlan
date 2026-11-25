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
  - [OPS-8 Vite's proxy hides the browser's host from Laravel](#ops-8-vites-proxy-hides-the-browsers-host-from-laravel)
- [UI](#ui)
  - [UI-2 Plan editor on a wide screen: the library beside the plan](#ui-2-plan-editor-on-a-wide-screen-the-library-beside-the-plan)
- [FEAT](#feat)
  - [FEAT-3 Workout mode and Home](#feat-3-workout-mode-and-home)
  - [FEAT-5 New records during a workout](#feat-5-new-records-during-a-workout)
  - [FEAT-6 Edit a past workout](#feat-6-edit-a-past-workout)
  - [FEAT-7 An exercise's own history](#feat-7-an-exercises-own-history)
  - [FEAT-8 Write a plan in a spreadsheet, and import it](#feat-8-write-a-plan-in-a-spreadsheet-and-import-it)
  - [FEAT-10 Google on Profile](#feat-10-google-on-profile)
  - [FEAT-11 Videos of an exercise](#feat-11-videos-of-an-exercise)
  - [FEAT-12 Choose the sound at the end of a rest or a timed set](#feat-12-choose-the-sound-at-the-end-of-a-rest-or-a-timed-set)
  - [FEAT-13 The volume of the sound](#feat-13-the-volume-of-the-sound)
- [BE](#be)
  - [BE-3 Harden the public sign-in routes](#be-3-harden-the-public-sign-in-routes)
  - [BE-5 A plan at the largest size allowed cannot be saved](#be-5-a-plan-at-the-largest-size-allowed-cannot-be-saved)
  - [BE-6 A UUID in capitals fails with a 500](#be-6-a-uuid-in-capitals-fails-with-a-500)
- [SEC](#sec)
  - [SEC-1 Anyone can download the photos of personal exercises](#sec-1-anyone-can-download-the-photos-of-personal-exercises)
  - [SEC-2 Photos keep their metadata, location included](#sec-2-photos-keep-their-metadata-location-included)
  - [SEC-3 No limit on a photo's pixels](#sec-3-no-limit-on-a-photos-pixels)
  - [SEC-4 A shared phone keeps, and sends, the previous user's workouts](#sec-4-a-shared-phone-keeps-and-sends-the-previous-users-workouts)
  - [SEC-5 No rate limit once signed in](#sec-5-no-rate-limit-once-signed-in)
  - [SEC-6 Sign-in limited per email and address only](#sec-6-sign-in-limited-per-email-and-address-only)
  - [SEC-7 Weak password rules](#sec-7-weak-password-rules)
  - [SEC-8 Answers that reveal other users' exercises](#sec-8-answers-that-reveal-other-users-exercises)
  - [SEC-9 Update webauthn-lib](#sec-9-update-webauthn-lib)
  - [SEC-10 The exercise library's download is not pinned](#sec-10-the-exercise-librarys-download-is-not-pinned)
  - [SEC-11 Verify the address at sign-up](#sec-11-verify-the-address-at-sign-up)
- [DATA](#data)
  - [DATA-4 Weighted holds and carries have no fitting logging type](#data-4-weighted-holds-and-carries-have-no-fitting-logging-type)

## How this page works

- **One point, one branch** ([P1.1](P1-conventions.md#p11-git)); several small points may share one.
- **Done means deleted.** The branch that does a point removes its entry in the same commit. What the change did is told by the commit and by the section it touched, not here.
- **IDs are never reused.** Each entry has an area prefix and a number (`UI-5`, `BE-2`), kept for good. Each area counts on its own; the next number is one above the highest ever used in that area (`git log -S "UI-" -- docs/project/backlog.md` finds deleted ones).
- **Areas:** `UI` interface, `FEAT` features, `BE` server, `DATA` database, `OPS` tooling, CI, deployment, `SEC` security, `DOCS` documentation. They appear with their first entry and go when they empty.
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

Refinements of what exists, not blocking the MVP: [UI-2](#ui-2-plan-editor-on-a-wide-screen-the-library-beside-the-plan), [FEAT-5](#feat-5-new-records-during-a-workout), [FEAT-6](#feat-6-edit-a-past-workout), [FEAT-7](#feat-7-an-exercises-own-history), [FEAT-10](#feat-10-google-on-profile). Workout mode from use in the gym: [FEAT-12](#feat-12-choose-the-sound-at-the-end-of-a-rest-or-a-timed-set), [FEAT-13](#feat-13-the-volume-of-the-sound). Phase 2: [FEAT-11](#feat-11-videos-of-an-exercise), [BE-3](#be-3-harden-the-public-sign-in-routes), [SEC-11](#sec-11-verify-the-address-at-sign-up).

Before deploying: [SEC-1](#sec-1-anyone-can-download-the-photos-of-personal-exercises), [SEC-2](#sec-2-photos-keep-their-metadata-location-included), [SEC-4](#sec-4-a-shared-phone-keeps-and-sends-the-previous-users-workouts), [SEC-5](#sec-5-no-rate-limit-once-signed-in), and the security settings among [OPS-3](#ops-3-deploy-to-the-free-server)'s steps; the other `SEC` points are hardening.

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
- A reset for production, as `make fresh` is locally (the database emptied, the media disk with it, since one without the other is broken), behind a stronger guard: the project's name typed, `APP_ENV=production` checked, a dump of the database and an archive of the media disk taken first; run on the server.
- Security settings, none of which development needs:
  - Laravel trusts Caddy as its proxy (`trustProxies()` in `bootstrap/app.php`, with the forwarded address, scheme and host) and only the production host (`trustHosts()`): otherwise every request comes from Caddy's address, so five wrong passwords lock anyone out of signing in, and one person locks every admin out of the panel's login.
  - `SESSION_SECURE_COOKIE=true`, `APP_DEBUG=false`, `LOG_LEVEL` above `debug`.
  - Headers from Caddy: HSTS, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, and a CSP with `frame-ancestors 'none'` (the inline theme script of `index.html` allowed by its hash); `/storage` with `Content-Security-Policy: default-src 'none'; sandbox`.
  - A cap on request bodies ([SEC-5](#sec-5-no-rate-limit-once-signed-in)).
  - A production stage of the Docker image running as a user other than root, without git and Composer.
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

### OPS-8 Vite's proxy hides the browser's host from Laravel

**Priority:** low · **Kind:** development setup · **Found:** 2026-11-20

**What is missing.** `vite.config.ts` says "No changeOrigin: Laravel must see the browser's host", but a proxy entry given as a plain string gets `changeOrigin: true` from Vite: Laravel sees `localhost:8500` on every request through `/api`, `/sanctum`, `/storage` and `/auth/`, whatever address the browser opened. Signing in is unaffected, since Sanctum recognises the app by `Origin` and `Referer`, but in development the `host` of the Google sign-in log lines ([C2.7.8](../concepts/C2-backend.md#c278-signing-in-with-google)) is always the same and tells nothing, and anything built from the request's host (`url()`, signed links) differs from production, where Caddy passes the browser's host on.

**Where.** `frontend/vite.config.ts`: `server.proxy`, its comment, and `preview`, which reuses it; `trace()` in `GoogleSignInController`.

**Options.**
- A) Each entry as `{ target: backendUrl, changeOrigin: false }`: Laravel sees `localhost:5673` (or `4673` for the preview), as it sees the public host behind Caddy.
- B) Keep `changeOrigin` and add `xfwd: true`, so the proxy sends `X-Forwarded-Host`; Laravel reads it only once the proxy is trusted (`trustProxies`), one more difference from production.
- C) Only correct the comment, and leave `host` out of the log.

**Recommended.** A: development then matches production, and the comment becomes true. Done when the log's `host` shows `localhost:5673`, and signing in with a password and with Google, the photos under `/storage` and a password reset link all work as before, through `make dev` and through the preview.

## UI

### UI-2 Plan editor on a wide screen: the library beside the plan

**Priority:** low · **Kind:** desktop layout · **Found:** 2026-11-07

**What is missing.** [D1.4.8](../design/D1-ui.md#d148-plan-editor) asks, on desktop, for two columns: the library on the left, the plan on the right, exercises dragged from the library into a day. The editor ([C1.16](../concepts/C1-frontend.md#c116-the-plan-editor)) adds exercises from a picker window on every width, which works but leaves a wide screen half empty. Since the editor has two steps ([C1.16.7](../concepts/C1-frontend.md#c1167-two-steps-one-draft)), the columns belong in the second: the library on the left, the open tab's exercises on the right.

**Options.**
- A) From 1024 px, the picker's list as a left column, and dnd-kit dragging from it into the open day: a second kind of draggable, and each day a droppable.
- B) The same two columns, adding with a "+" on each library row, without dragging across.

**Recommended.** B first: it gives the layout for a fraction of the work, reusing `ExercisePicker`'s list; dragging across can follow if it is missed.

## FEAT

### FEAT-3 Workout mode and Home

**Priority:** high · **Kind:** feature · **Found:** 2026-11-05

**Done.** The workout tables and API ([C2.5.7](../concepts/C2-backend.md#c257-the-workouts-endpoints)), workout mode ([C1.17](../concepts/C1-frontend.md#c117-workout-mode)) and Home ([C1.18](../concepts/C1-frontend.md#c118-home)); finished workouts are already queued on the phone and retried when the app opens and when the network returns; the service worker opens the app with no network, and the query cache kept in IndexedDB for a week opens the screens already seen, and Start works from the active plan, its last sets and its photos read ahead; `SyncIndicator` shows what waits and what the server refused ([C1.21](../concepts/C1-frontend.md#c121-opening-with-no-network)). Live records are tracked in [FEAT-5](#feat-5-new-records-during-a-workout); Home's recent records wait for Progress (phase 2).

**What is missing.** **Working offline** ([D2.7](../design/D2-decisions.md#d27-offline-and-sync)): a general queue for the other changes made offline (preferences first, [C1.11](../concepts/C1-frontend.md#c111-known-limits)), counted by `SyncIndicator` ([D1.6](../design/D1-ui.md#d16-states-and-edge-cases)) with the workouts; the queue of workouts, today in `localStorage` ([C1.17.5](../concepts/C1-frontend.md#c1175-the-queue-of-workouts-to-send)), moved to IndexedDB if it grows, and sent by the service worker in the background (Background Sync, where the browser has it); a notification when a rest ends with the app in the background.

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

### FEAT-12 Choose the sound at the end of a rest or a timed set

**Priority:** low · **Kind:** missing preference · **Found:** 2026-11-19

**What is missing.** The end of a rest, and a hold reaching its target, always play the same two 880 Hz beeps (`restOver()` in `lib/alarm.ts`), and the countdown before a timed set its fixed ticks (`countdownStep()`); Profile can only turn the sound and the vibration on or off (`timer_sound`, `timer_vibration`, [D3.3](../design/D3-data-model.md#d33-users-and-preferences)). In a loud gym, or with music in the earphones, a different tone may be the one that gets noticed.

**Where.** `lib/alarm.ts` (`restOver()`, `countdownStep()`, the tones they pass to `play()`); `WorkoutPreferences.tsx`; the users table, `UpdatePreferencesRequest`, `UserResource`, `User` in `api/auth.ts`.

**Options.**
- A) A few synthesised tones (two beeps, three rising beeps, a long tone, a bell made of two detuned oscillators), chosen in Profile with a ▶ to hear it; a new column `timer_tone` (string, default the current beeps) beside `timer_sound`, which stays the on/off switch. No sound files: nothing to precache, works offline.
- B) Audio files (mp3) in `public/`, precached by the service worker: any sound, but heavier, and `HTMLAudioElement` is less reliable than Web Audio on iPhones.

**Recommended.** A, in the same branch as [FEAT-13](#feat-13-the-volume-of-the-sound): both are columns of the preferences and both change `restOver()`. The ▶ in Profile is a user gesture, so it also unlocks audio for the page. Done when the chosen tone plays at the end of a rest and at a timed set's target, with a test of the preference saved.

### FEAT-13 The volume of the sound

**Priority:** low · **Kind:** missing preference · **Found:** 2026-11-19

**What is missing.** Every tone plays at a fixed gain of 0.25 (`play()` in `lib/alarm.ts`): too quiet over music for some, too loud for others, and the phone's own volume changes every other sound too.

**Where.** As [FEAT-12](#feat-12-choose-the-sound-at-the-end-of-a-rest-or-a-timed-set): `lib/alarm.ts`, `WorkoutPreferences.tsx`, the users table and its request, resource and type.

**Options.**
- A) A `timer_volume` column (0–100, default 50), a slider in Profile under the sound switch, mapped to a gain from 0 to 0.5 (50 is today's 0.25; above about 1 the tone clips). Saved with the account, like the other preferences.
- B) The volume kept in `localStorage`, per phone: right if the same account trains with a phone and a tablet, but the only preference that would not follow the account.

**Recommended.** A, with FEAT-12. The gain is relative to the system volume: the slider can make the beep quieter or louder than today, never louder than the phone allows, and an iPhone in silent mode may mute it; the preference's hint says so.

## BE

### BE-3 Harden the public sign-in routes

**Priority:** low until the app is public · **Kind:** security · **Found:** 2026-11-05

**What is missing.** Signing in has a rate limit ([C2.7.4](../concepts/C2-backend.md#c274-slowing-down-password-guessing)). Signing up and asking for a reset email have none, beyond one email per address per minute. Both also reveal whether an address has an account, by their answers.

**Options.**
- A) Rate limits on both routes, and the same answer to a known and an unknown email when asking for a reset.
- B) Leave as it is until the app is public.

**Recommended.** A before opening to other users (phase 2); until then the app is not deployed, so nothing is exposed. Signing up will still reveal that an email is taken, unless it moves to verifying the address by email first.

### BE-5 A plan at the largest size allowed cannot be saved

**Priority:** low · **Kind:** robustness · **Found:** 2026-11-25

**What is missing.** `PlanRequest` allows 14 days × 30 items × 20 sets, 8,400 sets. `SavePlan` writes them in one `insert()` of 9 columns: 75,600 bound values, over Postgres's 65,535 a statement. Such a plan, saved or imported, fails with a 500.

**Recommended.** Insert in chunks of 1,000 rows; a Pest test that saves the largest plan.

### BE-6 A UUID in capitals fails with a 500

**Priority:** low · **Kind:** robustness · **Found:** 2026-11-25

**What is missing.** Postgres compares `uuid` columns ignoring case; the lookups in PHP of `SavePlan` and `SaveWorkoutSession` (`$existing->get($id)`, `distinct`) do not. An id already there, sent again in capitals, misses the lookup, is inserted again and hits the primary key. Only the sender's own rows are concerned.

**Recommended.** Lowercase every id in the Form Requests' `prepareForValidation()`.

## SEC

The points of a security review of 2026-11-25. None is exploitable while the app runs only locally (every port of `compose.yaml` listens on 127.0.0.1); they matter from the deployment ([OPS-3](#ops-3-deploy-to-the-free-server)), whose own settings are among its steps.

### SEC-1 Anyone can download the photos of personal exercises

**Priority:** high, before deploying · **Kind:** privacy · **Found:** 2026-11-25

**What is missing.** Photos are files of the `public` disk, served under `/storage/<media id>/` with no sign-in ([C1.14.7](../concepts/C1-frontend.md#c1147-uploading-photos-and-duplicate-as-mine)). Media ids count up and the names are fixed (`photo.jpg`, `.png` or `.webp`; `0.jpg` for a copy from the library; `conversions/<name>-thumb.webp` and `-large.webp`), so a loop over the ids downloads every user's photos of their own exercises, which may show their body or their home. A soft-deleted exercise's photos stay there too. The library's photos are meant to be public.

**Where.** `app/Actions/Exercises/ExercisePhotos.php`, `DuplicateExercise`, medialibrary's default disk and path generator (its config is not published), `ExercisePhotoResource`; the service worker's `/storage` rule in `frontend/vite.config.ts`; Caddy's `/storage` ([OPS-3](#ops-3-deploy-to-the-free-server)).

**Options.**
- A) The photos of personal exercises on a private disk, served by a route behind `ExercisePolicy::view` (`response()->file()`, or an `X-Accel-Redirect` for Caddy to send). Same origin, so the session cookie goes with every `<img>`. The library's photos stay on `public`; duplicating copies to the private disk; a command moves the photos of existing personal exercises. The service worker caches the new route as it caches `/storage`.
- B) A path generator with an unguessable segment per media: no route and no check, but an address once seen (a screenshot, a log) opens the photo forever.

**Recommended.** A. Done when a personal photo answers 404 to a signed-out request and to another user, the owner sees it as before, offline too, and a library photo still loads from `/storage`.

### SEC-2 Photos keep their metadata, location included

**Priority:** medium, before deploying · **Kind:** privacy · **Found:** 2026-11-25

**What is missing.** `ExercisePhotos::add` stores the file as uploaded. The original, served until its conversions exist and kept afterwards, holds its EXIF data: a phone photo's GPS position, the device, the moment. The WebP conversions drop it.

**Options.**
- A) Re-encode the original on upload, after applying its EXIF orientation, with the image library the conversions already use: every metadata goes.
- B) Never serve the original, only the conversions: the location stays in the file, and in the backups.

**Recommended.** A, in [SEC-1](#sec-1-anyone-can-download-the-photos-of-personal-exercises)'s branch. Done when a JPEG uploaded with a GPS position (a test fixture) is stored without it.

### SEC-3 No limit on a photo's pixels

**Priority:** low · **Kind:** resource abuse · **Found:** 2026-11-25

**What is missing.** `StoreExercisePhotoRequest` checks the type and 10 MB, not the dimensions. A PNG under 10 MB can declare 20,000 × 20,000 pixels: GD needs over 1.5 GB to convert it, and the queue worker dies at its memory limit, three times (`--tries=3`).

**Recommended.** A `dimensions` rule, at most 8,000 pixels a side, on the API's upload and the admin panel's; with SEC-1.

### SEC-4 A shared phone keeps, and sends, the previous user's workouts

**Priority:** medium · **Kind:** privacy, data · **Found:** 2026-11-25

**What is missing.** Signing out (`forgetAccount()` in `src/api/auth.ts`) empties the query cache only. The `localStorage` keys `atleoplan.activeSession`, `atleoplan.finishedSession`, `atleoplan.pendingSessions` and `atleoplan.planDraft.*`, and the service worker's `photos` cache, stay, tied to no user. Whoever signs in next on the phone sees the previous user's workout in progress and plan drafts, and the queue sends the previous user's unsent workouts into the new account (`sendEach()` in `src/lib/pending-sessions.ts`).

**Options.**
- A) Every stored entry carries its user's id; another user's entries are ignored, and kept until their owner signs in again. Signing out empties the photos cache.
- B) Signing out deletes them all, after a warning when workouts are still unsent.

**Recommended.** A, with B's warning: an unsent workout lost is worse than one waiting. Done when A, with a workout queued, signs out and B signs in: nothing of A's is shown or sent; A signs in again and it is sent.

### SEC-5 No rate limit once signed in

**Priority:** medium, before deploying · **Kind:** resource abuse · **Found:** 2026-11-25

**What is missing.** Only signing in has a limiter (`FortifyServiceProvider`). A signed-in user can repeat without end `POST /api/exercises/{id}/duplicate` (up to 5 photos copied and converted each time), `POST /api/plans/import` (up to 420 exercises and 8,400 sets a call), `PUT /api/sessions/{new id}` (2,500 sets a call) and photo uploads: disk, database and queue grow without bound. Limits such as `max:420` are checked only after the wildcard rules are expanded for every element sent, so a body of a million entries costs a lot before being refused. Signing up and the reset email: [BE-3](#be-3-harden-the-public-sign-in-routes).

**Recommended.** `RateLimiter::for('api')` by user id on the `auth:sanctum` group, and tighter named limiters for import, duplicate and photo upload; a cap on the body's size (Caddy's `request_body`, and a count checked in the import's `prepareForValidation()`). Caps per user (personal exercises, plans, photo bytes) if the limiters are not enough. Done when Pest tests see the 429s.

### SEC-6 Sign-in limited per email and address only

**Priority:** low, before deploying · **Kind:** password guessing · **Found:** 2026-11-25

**What is missing.** The `login` limiter is keyed on email and IP: one address can try 5 passwords a minute on each of any number of accounts. `POST /api/auth/user/confirm-password`, registered by Fortify and used by nothing in the app, has no limit: someone holding a stolen session can guess its password at full speed.

**Recommended.** Two limits on sign-in, by email and IP and by IP alone; the confirm-password route throttled, or not registered.

### SEC-7 Weak password rules

**Priority:** low · **Kind:** passwords · **Found:** 2026-11-25

**What is missing.** `PasswordValidationRules` uses `Password::default()`, and `Password::defaults()` is never set: 8 characters, nothing else.

**Recommended.** `Password::defaults()` in `AppServiceProvider`: at least 10 characters, and `uncompromised()` in production (Have I Been Pwned's range API: only the start of the password's hash leaves the server). Sign-up and reset share it.

### SEC-8 Answers that reveal other users' exercises

**Priority:** low · **Kind:** information leak · **Found:** 2026-11-25

**What is missing.** Another user's personal exercise is never shown, but some answers tell that it exists. `SaveSessionRequest::after()` reads exercises without the owner's condition, so a set's value errors come back for someone else's exercise and not for a missing one, telling its logging type too; `GET /api/exercises/{id}` answers 403 for someone else's and 404 for a missing one; the photo Form Requests validate (count, ids) before the policy runs. Never a name or a content.

**Recommended.** `after()` skips an exercise whose `exists` failed; the photo requests authorize first; 404 for an exercise the user cannot see.

### SEC-9 Update webauthn-lib

**Priority:** low · **Kind:** dependencies · **Found:** 2026-11-25

**What is missing.** `composer audit` reports six advisories on `web-auth/webauthn-lib` 5.3.12, required by `laravel/passkeys` through Fortify. Passkeys are not enabled (`config/fortify.php`), so the code concerned does not run.

**Recommended.** `composer update web-auth/webauthn-lib` (5.3.17 or later), then `composer audit` clean and `make check`.

### SEC-10 The exercise library's download is not pinned

**Priority:** low · **Kind:** supply chain · **Found:** 2026-11-25

**What is missing.** `make exercises-import` clones free-exercise-db at its latest commit, unchecked, and `ImportFreeExercise` joins the image names of its JSON into paths unchecked. A compromised upstream could change the library, or reach outside its folder with `../` (only images are accepted).

**Recommended.** A pinned commit (`git checkout <sha>` after the clone, raised by hand); image names with `..` or a leading `/` refused.

### SEC-11 Verify the address at sign-up

**Priority:** low until the app is public · **Kind:** accounts · **Found:** 2026-11-25

**What is missing.** Sign-up accepts an address nobody proved. Signing in with Google takes such an account back from whoever chose its password ([C2.7.8](../concepts/C2-backend.md#c278-signing-in-with-google)), but an account can still be made in someone else's name, and sign-up tells whether an address is taken ([BE-3](#be-3-harden-the-public-sign-in-routes)).

**Recommended.** Fortify's email verification (`Features::emailVerification()`, `MustVerifyEmail`), the app limited until the link is opened; with BE-3, before opening to other users.

## DATA

### DATA-4 Weighted holds and carries have no fitting logging type

**Priority:** low · **Kind:** data model · **Found:** 2026-11-12

**What is missing.** Some of free-exercise-db's exercises are a weight held for a time or carried for a distance: Plate Pinch and Crucifix (held), Farmer's Walk, Yoke Walk, Rickshaw Carry and the sleds (carried). The import guesses them as weight and reps, which is wrong; but `time` and `distance` record no weight ([D3.6.3](../design/D3-data-model.md#d363-logged_sets)), so the list of corrected logging types leaves them out ([C2.14.6](../concepts/C2-backend.md#c2146-the-logging-types-corrected-after-the-import)). "Farmer's walk, 2 × 32 kg, 40 m" cannot be written.

**Options.**
- A) `time` and `distance` accept an optional `weight_kg`, as `reps` does for an added weight: a change to the rules of `SaveSessionRequest`, of the plan's sets and of workout mode's rows, no new column. Then the list of corrected logging types gains these exercises.
- B) Two new types, `weight_time` and `weight_distance`: clearer, but one more value in the enum, the migration's check, and every `switch` on the type in the frontend.
- C) Nothing: no current plan uses a weighted hold or carry.

**Recommended.** C until a plan needs one; then A, which keeps four types and reuses the optional weight that `reps` already has.
