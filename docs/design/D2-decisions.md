# D2. Decisions

The choices made before writing code, each with its reason and what was set aside. A decision changes by editing its section here, with the reason for the change; the screens it affects are described in [D1. UI design](D1-ui.md).

## Contents

- [D2.1 Name](#d21-name)
- [D2.2 Stack](#d22-stack)
- [D2.3 Exercise library](#d23-exercise-library)
- [D2.4 Languages](#d24-languages)
- [D2.5 Photos and videos](#d25-photos-and-videos)
- [D2.6 Hosting](#d26-hosting)
- [D2.7 Offline and sync](#d27-offline-and-sync)
- [D2.8 Workout rules](#d28-workout-rules)

---

## D2.1 Name

**AtleoPlan.** "Atleo" comes from *atleta* / *athlete* / *Athlet*, understood in all four languages of the app; "Plan" says what the app is about (*piano*, *plan*, *Plan*). Set aside: Spotter (already used by other apps), AtleoGym (generic, and ties the app to the gym when plans are used at home or outdoors too).

Before buying a domain or opening store accounts, the name is checked against domains, App Store, Play Store and EU trademarks (EUIPO): see the backlog ([OPS-2](../project/backlog.md#ops-2-check-that-the-atleoplan-name-is-free)).

---

## D2.2 Stack

| Layer | Choice | Why | Set aside |
|---|---|---|---|
| Backend | **Laravel**, API only | Known stack; Sanctum, policies, queues, Pint and Pest out of the box | Inertia (ties the frontend to the server: no offline, no mobile app later) |
| Auth | **Sanctum**: cookies for the web app, tokens for the future mobile app. **Fortify** for signing up, in and out and resetting a password, with the screens in React | Official, simple; cookie auth needs frontend and API on the same domain, which the hosting gives ([D2.6](#d26-hosting)). Fortify keeps the security-sensitive parts in Laravel's own maintained code ([C2.7.6](../concepts/C2-backend.md#c276-fortify-or-by-hand)) | Passport (OAuth server, more than needed); hand-written controllers (more of our own code to keep safe); Breeze and Jetstream (screens not in React) |
| Database | **PostgreSQL** | JSON columns for translations, solid constraints | MySQL (works too; Postgres is the choice for its JSON and constraint support) |
| Admin | **Filament** | Admin panel for the public library and the users without writing a back office in React ([D1.4.15](D1-ui.md#d1415-admin-panel-filament)) | A React admin (weeks of work for an internal tool) |
| Frontend | **React + TypeScript**, Vite, as a PWA | New to learn after Vue; the most used; React Native (Expo) reuses the same knowledge for a store app | Svelte (no mobile path), Angular (heavy), Flutter (another language, weak on the web) |
| Server data | **TanStack Query** | Cache, retries, offline mutations | Redux (more code for the same result) |
| Routing | **React Router** | The most documented | TanStack Router (good, smaller community) |
| UI | **Tailwind + shadcn/ui** (Radix base, Nova preset), **Lucide** icons, **Inter** served by the app | Components copied into the project, fully editable; the font bundled rather than from Google Fonts, so it works offline | Component libraries that can't be changed from inside |
| Forms | **react-hook-form + zod** | Validation shared between forms and API types | — |
| Drag and drop | **dnd-kit** | Touch and keyboard support | — |
| Charts | **Recharts** | Simple line and bar charts | — |
| Translations | **react-i18next** (frontend), Laravel language files and **spatie/laravel-translatable** (backend) | See [D2.4](#d24-languages) | — |
| Tests | **Pest** (backend), **Vitest** + Testing Library (frontend), **Playwright** (end to end) | Same tools as Chronovault for the frontend | — |
| Local development | **Backend in Docker**, **frontend directly on the computer** (macOS or Windows) with Node 24 (pinned in `.nvmrc`) ([S1.7](../start/S1-setup.md#s17-creating-the-react-frontend)) | The backend needs PHP, its extensions and ffmpeg, which stay off the computer, and runs the same image as production. The frontend needs only Node; VS Code's TypeScript and ESLint read `frontend/node_modules` from the computer; Vite's hot reload is faster on the computer's own disk. In production the React app is static files served by Caddy, so the dev server has no production twin to match | Frontend in Docker: `node_modules` would live in a Docker volume, invisible to VS Code (or installed twice), and hot reload is slower through Docker's file sharing on macOS |

---

## D2.3 Exercise library

**The library is AtleoPlan's own database.** Exercises live in its Postgres in two kinds:

| Kind | Managed by | Seen by |
|---|---|---|
| **Public** (`owner_id` empty) | Admins, in the admin panel | Everyone |
| **Personal** (`owner_id` = a user) | Their owner, in the app ([D1.4.5](D1-ui.md#d145-exercise-editor)) | Their owner, and whoever opens a plan they shared |

**Initial import: free-exercise-db.** The public library starts from [free-exercise-db](https://github.com/yuhonas/free-exercise-db), imported once: 876 exercises with main and secondary muscles, equipment, level, category, instructions and two photos each (start and end position). It is public domain (Unlicense): once imported, its rows are AtleoPlan's to change, translate or delete, with no licence obligation, a paid version included.

**How it is imported.** An Artisan command, `make exercises-import`, which can run again at any time ([C2.14.3](../concepts/C2-backend.md#c2143-the-free-exercise-db-import)):
- **What is kept:** name and instructions in English, level, category, equipment, primary and secondary muscles, photos. `force` and `mechanic` are not kept, since no screen uses them.
- **The logging type is guessed,** since the source does not say: stretching and cardio are timed, exercises with the body only or no equipment count reps, the rest are weight and reps. An admin corrects the exceptions.
- **Running it again never undoes people's work:** exercises already there are left alone unless asked to refresh, and then only their English texts and the source's data change; other languages, the logging type and the photos stay. An exercise deleted by an admin stays deleted.

**Translations.** free-exercise-db is in English only. Names and instructions were translated into Italian, Spanish and German once, by Claude, with other names people search for ("rematore alto" for the upright row); the translations are files of the repository, written into the database by `exercises:translate`, which `make exercises-import` runs after the import ([C2.14.4](../concepts/C2-backend.md#c2144-the-translation-of-the-library)). All three languages keep a **Machine translated** flag until a person reviews them in the admin panel ([D1.4.15](D1-ui.md#d1415-admin-panel-filament)): Italian first, then Spanish and German by native speakers. free-exercise-db has no descriptions, so there were none to translate.

**wger: only the muscle drawings.** [wger](https://wger.de) has its own exercise database, translated into many languages, under CC-BY-SA 4.0: using it means crediting every author and releasing what is derived from it (the translations, for example) under the same licence. It is not imported. Its SVG drawings of the muscles may be used for a muscle map in the interface, credited on a Credits page.

**Set aside:** ExerciseDB and MuscleWiki (proprietary, not free for commercial use).

---

## D2.4 Languages

- **Italian, English, Spanish and German** from the start; English is the fallback when a text is missing in the user's language.
- **Interface:** every text comes from translation files (react-i18next on the frontend, Laravel's language files for the API's messages, e.g. validation errors, and for emails: [C2.7.7](../concepts/C2-backend.md#c277-messages-in-the-users-language)). No text is written directly in a component ([P1.2](../project/P1-conventions.md#p12-code)).
- **Content:** the translatable fields of public exercises (name, aliases, description, instructions) are JSON columns with one value per language (spatie/laravel-translatable). Personal exercises and plans are in their author's language only.
- **Formats:** numbers, dates and units follow the language (`82,5 kg` in Italian, Spanish and German, `82.5 kg` in English), through `Intl.NumberFormat` and `Intl.DateTimeFormat`.
- **Language choice:** preset from the browser, changeable in the settings ([D1.4.14](D1-ui.md#d1414-profile-and-settings)) and saved on the account.

---

## D2.5 Photos and videos

**Limits**

| | Accepted upload | Stored after processing |
|---|---|---|
| **Video** | Up to **30 s** and **100 MB**; mp4, mov (iPhone), webm | 720p, H.264, no audio, about 2 Mbit/s (about **8 MB for 30 s**), plus a poster image. The original is deleted. |
| **Photo** | Up to **10 MB**; jpg, png, heic, webp | WebP at 1600 px plus a 400 px thumbnail |
| **Per exercise** | At most **2 videos and 5 photos** | |

Why these numbers: two or three reps are enough to show how an exercise is done (10–15 s), so 30 s leaves room. 100 MB covers 30 s of 4K from an iPhone. The server converts every video (a queue job running ffmpeg), also because the HEVC videos of iPhones do not play in every browser. Media are handled with spatie/laravel-medialibrary.

**Storage: the server's disk first, R2 later.**

- **Now:** files are stored on the disk of the server that runs the app ([D2.6](#d26-hosting)): free, simple, and 200 GB are far more than needed (the imported photos take 98 MB; a thousand videos about 8 GB).
- **Later**, with real users: Cloudflare R2 on a **Cloudflare account of its own**, with its own free 10 GB, separate costs and an easy hand-over if the app is sold. Laravel writes to a "disk": switching is a change of `FILESYSTEM_DISK` in `.env`, not of the code.
- **Not Chronovault's R2:** its FLAC files already use that account's free 10 GB, and the two projects stay apart.
- Files on the server's disk need **backups**, planned with the deployment.

---

## D2.6 Hosting

**Not yet.** During development everything runs on the local machine with Docker; deploying is postponed until the app is worth putting online ([OPS-3](../project/backlog.md#ops-3-deploy-to-the-free-server)). What follows is the plan for that day.

**One free server runs everything:** the React app, Laravel, its queue worker, Postgres and the media.

```
               atleoplan.duckdns.org (HTTPS)
                          │
                ┌─────────▼──────────┐
                │ Caddy (front door) │
                └───┬────────────┬───┘
       pages        │            │   /api, /sanctum, /admin, /storage
          ┌─────────▼──┐     ┌───▼──────────┐
          │ React app  │     │   Laravel    │
          │(static PWA)│     │  (API REST)  │
          └────────────┘     └──┬────────┬──┘
                                │        │
                       ┌────────▼─┐  ┌───▼─────────────────┐
                       │ Postgres │  │ Queue worker, ffmpeg│
                       └──────────┘  │ scheduler           │
                                     └─────────────────────┘
                 Oracle Cloud Always Free VM (Docker Compose)
```

| Piece | Choice | Why |
|---|---|---|
| Server | **Oracle Cloud Always Free**, an ARM (Ampere A1) VM with 4 cores and 24 GB of RAM, 200 GB of disk, 10 TB of traffic a month | Free for good, not a trial; more than enough for Laravel, the worker, Postgres and ffmpeg; ARM like a Mac with Apple silicon, so the same Docker images run locally and on the server |
| Front door | **Caddy** (or FrankenPHP, which is Caddy with PHP inside, supported by Laravel Octane) | Gets and renews HTTPS certificates by itself; a short config sends pages to React and API calls to Laravel |
| Domain | **DuckDNS**, `atleoplan.duckdns.org` | Free, HTTPS works with Caddy; a paid domain (`atleoplan.app`, about €14 a year at Cloudflare Registrar) when the app opens to the public |
| One domain | Frontend and API at the same address | Sanctum's cookie auth works without CORS |

**Things to know about Oracle:** a credit card is asked for verification only; the home region is chosen once and cannot change (Milan or Frankfurt), and free resources exist only there; ARM VMs are sometimes "out of capacity" in a region and need retrying; a VM idle for 7 days can be reclaimed (an upgrade to Pay As You Go avoids it and stays free within the limits, with a spending alert at €1); Oracle's Ubuntu images block ports 80 and 443 with `iptables` even after they are opened in the console.

**Set aside:**

- **Vercel:** fine for the React app alone, but Laravel needs a place that is always on (queue worker, ffmpeg, disk, database), which serverless functions are not. Its Hobby plan is also for non-commercial use only. With the frontend there and the API elsewhere, Sanctum's cookie auth gets complicated.
- **Render (free) + Neon:** the free service sleeps when idle and takes tens of seconds to wake; no free background worker for the videos.
- **Laravel Cloud:** the paid alternative if managing a server is not wanted: `git push` and it runs everything, a few dollars a month at this size.

Free tiers change often: they are checked again when the app is first deployed.

---

## D2.7 Offline and sync

- **Plans, sessions and logged sets get a UUID created on the device** ([D3.2](D3-data-model.md#d32-rules-for-every-table)). A workout logged offline is sent later, and sending it twice changes nothing (the server recognises the UUID): no duplicates, no conflicts.
- Plans and exercises already opened are kept on the device (TanStack Query's persisted cache in IndexedDB); the photos of the active plan's exercises are downloaded ahead by the service worker.
- Changes made offline wait in a queue and are sent in order when the network comes back; `SyncIndicator` shows their state ([D1.6](D1-ui.md#d16-states-and-edge-cases)).
- **Where it stands:** finished workouts already have their queue, in `localStorage`, sent when the app opens and when the network returns ([C1.17.5](../concepts/C1-frontend.md#c1175-the-queue-of-workouts-to-send)). The service worker, the persisted cache, the general queue and `SyncIndicator` come with the offline part of [FEAT-3](../project/backlog.md#feat-3-workout-mode-and-home).
- For plans, the last change wins, with a warning when the plan was changed elsewhere in the meantime ([D3.5](D3-data-model.md#d35-plans)).

---

## D2.8 Workout rules

- **One active plan at a time.** Setting another plan as active replaces it.
- **The day is chosen by the user, every time.** The app suggests the day after the last one completed, in the plan's order (back to the first after the last), and shows it first; any other day is one tap away ([D1.4.2](D1-ui.md#d142-home)).
- **Set types from the MVP:** normal, warm-up, drop set, to failure.
- **Warm-up sets count neither for volume nor for records**, or the statistics would be inflated.
- **Estimated one-rep max:** Epley formula, weight × (1 + reps / 30), on every set that is not a warm-up.
- **Volume:** sets × reps × weight, warm-up excluded, per exercise and per muscle group. Only the weight that is known counts: a set with the body alone adds nothing, a weighted pull-up adds its added weight (+10 kg × 6 = 60 kg). The body's own weight is not known, so bodyweight work is followed by its reps rather than by volume.

---

← [D1. UI design](D1-ui.md) · [Contents](../README.md) · [D3. Data model](D3-data-model.md) →
