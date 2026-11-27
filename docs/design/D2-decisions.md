# D2. Decisions

The project's technical and product decisions, each with its reason and the alternatives set aside. A decision changes by editing its section here, with the reason for the change; the screens it affects are described in [D1. UI design](D1-ui.md).

## Contents

- [D2.1 Name](#d21-name)
- [D2.2 Stack](#d22-stack)
- [D2.3 Exercise library](#d23-exercise-library)
- [D2.4 Languages](#d24-languages)
- [D2.5 Photos and videos](#d25-photos-and-videos)
- [D2.6 Hosting](#d26-hosting)
- [D2.7 Offline and sync](#d27-offline-and-sync)
- [D2.8 Workout rules](#d28-workout-rules)
- [D2.9 Plan files](#d29-plan-files)
- [D2.10 Local development](#d210-local-development)
- [D2.11 Continuous integration](#d211-continuous-integration)

---

## D2.1 Name

**AtleoPlan.** "Atleo" comes from *atleta* / *athlete* / *Athlet*, understood in all four languages of the app; "Plan" says what the app is about (*piano*, *plan*, *Plan*). Set aside: Spotter (already used by other apps), AtleoGym (generic, and ties the app to the gym when plans are used at home or outdoors too).

Before buying a domain or opening store accounts, the name is checked against domains, App Store, Play Store and EU trademarks (EUIPO): see the backlog ([OPS-2](../project/backlog.md#ops-2-check-that-the-atleoplan-name-is-free)).

---

## D2.2 Stack

| Layer | Choice | Why | Set aside |
|---|---|---|---|
| Backend | **Laravel**, API only | Sanctum, policies, queues, Pint and Pest out of the box | Inertia (ties the frontend to the server: no offline, no mobile app later) |
| Auth | **Sanctum**: cookies for the web app, tokens for the future mobile app. **Fortify** for signing up, in and out and resetting a password, with the screens in React. **Socialite** for signing in with Google | Official, simple; cookie auth needs frontend and API on the same domain, which the hosting gives ([D2.6](#d26-hosting)). Fortify keeps the security-sensitive parts in Laravel's own maintained code ([C2.7.6](../concepts/C2-backend.md#c276-fortify-or-by-hand)); Socialite does the same for OAuth, and Apple later is one more of its drivers ([C2.7.8](../concepts/C2-backend.md#c278-signing-in-with-google)) | Passport (OAuth server, more than needed); hand-written controllers (more of our own code to keep safe); Breeze and Jetstream (screens not in React) |
| Database | **PostgreSQL** | JSON columns for translations, solid constraints | MySQL (works too; Postgres is the choice for its JSON and constraint support) |
| Admin | **Filament** | Admin panel for the public library and the users without writing a back office in React ([D1.4.15](D1-ui.md#d1415-admin-panel-filament)) | A React admin (weeks of work for an internal tool) |
| Frontend | **React + TypeScript**, Vite, as a PWA | The most used; React Native (Expo) reuses the same knowledge for a store app | Svelte (no mobile path), Angular (heavy), Flutter (another language, weak on the web) |
| Server data | **TanStack Query** | Cache, retries, offline mutations | Redux (more code for the same result) |
| Routing | **React Router** | The most documented | TanStack Router (good, smaller community) |
| UI | **Tailwind + shadcn/ui** (Radix base, Nova preset), **Lucide** icons, **Inter** served by the app | Components copied into the project, fully editable; the font bundled rather than from Google Fonts, so it works offline | Component libraries that can't be changed from inside |
| Forms | **react-hook-form + zod** | Validation shared between forms and API types | — |
| Drag and drop | **dnd-kit** | Touch and keyboard support | — |
| Charts | **Recharts** | Simple line and bar charts | — |
| Translations | **react-i18next** (frontend), Laravel language files and **spatie/laravel-translatable** (backend) | See [D2.4](#d24-languages) | — |
| Tests | **Pest** (backend), **Vitest** + Testing Library (frontend), **Playwright** (end to end) | Vitest runs on Vite's own configuration | — |
| Local development | **Backend in Docker**, **frontend directly on the host** (macOS or Windows) with Node 24 (pinned in `.nvmrc`) ([S1.7](../start/S1-setup.md#s17-the-frontend-on-the-host)) | The backend needs PHP, its extensions and ffmpeg, which stay off the host, and runs the same image as production. The frontend needs only Node; VS Code's TypeScript and ESLint read `frontend/node_modules` from the host; Vite's hot reload is faster on the host's own disk. In production the React app is static files served by Caddy, so the dev server has no production twin to match | Frontend in Docker: `node_modules` would live in a Docker volume, invisible to VS Code (or installed twice), and hot reload is slower through Docker's file sharing on macOS |

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
- **The logging type is guessed,** since the source does not say: stretching and cardio are timed, exercises with the body only or no equipment count reps, the rest are weight and reps. The exceptions found so far (Plank, guessed as reps, is held for a time) are a list in the repository, applied after the import ([C2.14.6](../concepts/C2-backend.md#c2146-the-logging-types-corrected-after-the-import)); an admin corrects the others.
- **At a commit chosen by hand:** the dataset is downloaded at a fixed commit, raised only after reading what changed, so a change upstream never reaches the library unseen.
- **Running it again never undoes people's work:** exercises already there are left alone unless asked to refresh, and then only their English texts and the source's data change; other languages, the logging type and the photos stay. An exercise deleted by an admin stays deleted.

**Extra exercises of our own.** free-exercise-db is mostly weights and machines; calisthenics was missing (frog stand, front lever, burpees, dead hang…). The project keeps a few more public exercises in a file of the repository, `backend/database/data/extra-exercises.json`, in free-exercise-db's shape, with the logging type stated rather than guessed, and imports them with the same rules (`make exercises-extra`, which `make exercises-import` runs too; [C2.14.5](../concepts/C2-backend.md#c2145-the-extra-exercises)). Their external ids start with `AtleoPlan_`, so they never meet the dataset's. They are machine-written in the four languages and flagged as machine translated like the rest.

**Translations.** free-exercise-db is in English only. Names and instructions are machine-translated into Italian, Spanish and German, with other names people search for ("rematore alto" for the upright row); the translations are files of the repository, written into the database by `exercises:translate`, which `make exercises-import` runs after the import ([C2.14.4](../concepts/C2-backend.md#c2144-the-translation-of-the-library)). All three languages keep a **Machine translated** flag until a person reviews them in the admin panel ([D1.4.15](D1-ui.md#d1415-admin-panel-filament)): Italian first, then Spanish and German by native speakers. free-exercise-db has no descriptions.

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
| **Video** (phase 2) | Up to **30 s** and **100 MB**; mp4, mov (iPhone), webm | 720p, H.264, no audio, about 2 Mbit/s (about **8 MB for 30 s**), plus a poster image. The original is deleted. |
| **Photo** | Up to **10 MB** and **50 megapixels**; jpg, png, webp | The original, drawn again without its metadata, plus two WebP copies: at most 1600 px for the exercise's page, at most 400 px for lists and workout mode |
| **Per exercise** | At most **2 videos and 5 photos** | |

Why these numbers: two or three reps are enough to show how an exercise is done (10–15 s), so 30 s leaves room. 100 MB covers 30 s of 4K from an iPhone. The server converts every video (a queue job running ffmpeg), also because the HEVC videos of iPhones do not play in every browser. Media are handled with spatie/laravel-medialibrary.

**Photos** ([C2.5.9](../concepts/C2-backend.md#c259-the-photos-of-an-exercise)):
- **The original is kept.** medialibrary always keeps the file uploaded, and its copies are files beside it. Keeping it lets the copies be made again if their sizes change (`make exercises-thumbnails`, `media-library:regenerate`); the app never shows it once the copies exist. At most 50 MB per exercise, on a 200 GB disk.
- **A user's own photos are private.** They may show a body or a home. The library's are public files under `/storage`; a personal exercise's are on a disk with no address, and the API gives them to their owner only. A public file's address is a counting id and a fixed name: anyone could download them all.
- **No metadata.** A phone's photo records where it was taken, the device and the moment. A user's photo is drawn again on upload, which drops all of it; the pixels limit keeps that, and the copies, within the server's memory.
- **No HEIC.** GD, the image library of the Docker image, writes WebP but cannot read HEIC, and Imagick with libheif would make the image heavier. An iPhone's browser sends a JPEG anyway when the form does not ask for HEIC, so nobody uploading from a phone notices.

The imported photos take 98.7 MB; their small copies 20.7 MB (about 12 KB each instead of 56), and the lists load those.

**Videos come in phase 2** ([D1.8](D1-ui.md#d18-release-phases-and-open-questions)): the `videos` collection exists, with nothing that fills it yet.

**Storage: the server's disk first, R2 later.**

- **Now:** files are stored on the disk of the server that runs the app ([D2.6](#d26-hosting)): free, simple, and 200 GB are far more than needed (the imported photos take 98 MB; a thousand videos about 8 GB).
- **Later**, with real users: Cloudflare R2 (10 GB free) on a **dedicated Cloudflare account**, so the app's storage, quota and costs stay separate and the app can be handed over on its own. Switching is a change of `FILESYSTEM_DISK` in `.env`, not of the code.
- Files on the server's disk need **backups**, planned with the deployment: both disks, the library's and the users' own.

---

## D2.6 Hosting

**Not deployed yet.** Everything runs locally with Docker; deployment is postponed until the app is worth putting online ([OPS-3](../project/backlog.md#ops-3-deploy-to-the-free-server)). What follows is the target setup.

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
- **Where it stands:** the app opens with no network, from the service worker's cache of its files, its screens from the query cache kept in IndexedDB for a week, and the active plan's photos from the worker's photo cache, downloaded ahead ([C1.21](../concepts/C1-frontend.md#c121-opening-with-no-network)); finished workouts have their queue, in `localStorage`, sent when the app opens and when the network returns ([C1.17.5](../concepts/C1-frontend.md#c1175-the-queue-of-workouts-to-send)), and preferences changed offline wait beside them ([C1.13.4](../concepts/C1-frontend.md#c1134-preferences-on-the-account)). `SyncIndicator` and a banner show what waits and what the server refused, and a server that does not answer is treated as offline ([C1.17.5](../concepts/C1-frontend.md#c1175-the-queue-of-workouts-to-send)). The rest is postponed ([FEAT-3](../project/backlog.md#feat-3-workout-mode-and-home)): the other changes made offline (plans, exercises), sending with the app closed, which only Chrome and Edge allow, and a notification at a rest's end with the app in the background.
- For plans, the last change wins, with a warning when the plan was changed elsewhere in the meantime ([D3.5](D3-data-model.md#d35-plans)).
- **What waits on a phone is its user's.** A phone can be shared: the workouts and drafts kept on it are tied to who made them, neither shown to nor sent by anyone else who signs in, and sent when their owner signs in there again. Signing out does not delete them, since an unsent workout lost is worse than one waiting; it says they stay. The cached answers and photos do go at signing out ([C1.13.2](../concepts/C1-frontend.md#c1132-the-guards)).

---

## D2.8 Workout rules

- **One active plan at a time.** Setting another plan as active replaces it.
- **The day is chosen by the user, every time.** The app suggests the day after the last one completed, in the plan's order (back to the first after the last), and shows it first; any other day is one tap away ([D1.4.2](D1-ui.md#d142-home)).
- **Set types from the MVP:** normal, warm-up, drop set, to failure.
- **Warm-up sets count neither for volume nor for records**, or the statistics would be inflated.
- **Estimated one-rep max:** Epley formula, weight × (1 + reps / 30), on every set that is not a warm-up.
- **Volume:** sets × reps × weight, warm-up excluded, **per exercise** (and, in phase 2, per muscle group). Only the weight that is known counts: a set with the body alone adds nothing, a weighted pull-up adds its added weight (+10 kg × 6 = 60 kg). The body's own weight is not known, so bodyweight work is followed by its reps rather than by volume.
- **No workout volume.** A workout's or a week's volume, everything added together, is not shown: it adds up unlike exercises (a kilogram of squat is not a kilogram of curl), and counts nothing done with the body alone, so a calisthenics workout weighed 0. A workout shows its time, exercises, sets and **reps** (the body alone included); a week its workouts, sets and **minutes**. Volume stays beside each exercise with weights.
- **Better than last time, exercise by exercise.** Each exercise is compared with the last time it was done, in any plan, by its best set, the rule fitting how it is logged: weight × reps by the estimated one-rep max; reps by the added weight, then the reps; time and distance by the longest; reps done as fast as possible by the reps, then the shortest time, and only against last time done the same way. When the best sets tie, the total reps decide. The verdict is better, the same, lower, or first time; the summary and history count them ("2 better · 1 same", [D1.4.10](D1-ui.md#d1410-workout-summary)). This works for bodyweight exercises, which a volume cannot.

---

## D2.9 Plan files

A plan can be saved as a file and imported again, on the same server or another ([D1.4.7](D1-ui.md#d147-plan-details), [D3.5.8](D3-data-model.md#d358-the-plan-file)). The first use: moving a plan from the development server to production without entering it again.

- **JSON, not CSV or Excel.** A plan is a tree: days, their exercises with supersets and notes, their sets; each exercise with several muscles and a list of instructions. JSON holds that as it is, and both Laravel and the browser read it with nothing added. A CSV is one table: a row per set, the plan, day and exercise repeated on each, lists squeezed into a cell; a semicolon in a note, or a spreadsheet turning "8-10" into a date, breaks it. Excel has the same limits and needs a library. A spreadsheet stays a good way to **write** a plan by hand, a different feature with a format made for people ([FEAT-8](../project/backlog.md#feat-8-write-a-plan-in-a-spreadsheet-and-import-it)).
- **The plan only, with the exercises it uses.** No workout history and no photos: the plan is what takes time to write again; a personal exercise's photos are few and can be added by hand. History and photos belong to the full **Export my data** the GDPR asks for ([D1.4.14](D1-ui.md#d1414-profile-and-settings)).
- **Each exercise described in full,** public ones too, so that an exercise missing on the other server is created as the importer's own rather than refusing the file: an extra exercise not yet imported there, a personal one.
- **Nothing is sent by surprise.** Import plan explains what file it wants, looks at the file on the device (size, JSON, format, version), and shows what it holds before **Import**; the backend still checks every field. A bare file picker gives no idea of what it expects.
- **An import never changes anything:** the plan arrives as a new one. Exercises already there are reused, found by their stable id or their name, so importing twice does not duplicate them.

---

## D2.10 Local development

**The backend stack runs in Docker on macOS and Windows; the frontend runs directly on the host** (Vite, Node 24). PHP and Composer are never installed on the host: one image gives the same PHP, the same extensions and ffmpeg everywhere ([S1.5](../start/S1-setup.md#s15-first-start-the-docker-stack)).

**The code is shared, the Composer packages are in a volume.** With `vendor/` in the bind mount, every API call takes 1 to 2 seconds locally, on macOS and Windows alike. Docker Desktop runs Linux in a virtual machine; `./backend`, shared with it, is slow to read file by file, and after every pause of two seconds PHP's OPcache checks the date of the thousand files a request uses, 96% of them in `vendor/` ([C2.4](../concepts/C2-backend.md#c24-the-life-of-a-request)). With `vendor/` in a Docker named volume, a request after a pause went from about 1,200 ms to about 90 ms. The code stays shared, so a saved change is still seen at the next request. The host's `backend/vendor/` is a copy for the editor, refreshed by Composer after every change. How to measure it: [H2.11](../how-to/H2-backend.md#h211-finding-out-what-is-going-on).

| Choice | Why |
|---|---|
| `vendor/` in a named volume | Same fix on macOS and Windows, free, a few lines of `compose.yaml`, nothing to install on the host |
| A copy on the host, made by Composer's `post-autoload-dump` | The editor keeps completing Laravel's classes and opening their source; it follows every Composer command by itself, whoever types it |
| rsync for the copy | Sends only what changed; still about 20 s on Windows, where checking 24,722 files through the shared folder is slow, but only after a Composer command |

**Set aside:**

- **The repository inside WSL2's own disk** (on Windows): what Laravel's documentation advises there, and the fastest. Windows only, so macOS would stay slow; it also moves the whole way of working (Node, Git, the editor through VS Code's WSL extension) into Linux.
- **A longer `opcache.revalidate_freq`** (30 s, say): one line, but a saved change would be seen only up to 30 s later, which breaks the edit-and-reload loop; requests after a long pause would stay slow.
- **`opcache.validate_timestamps=0`:** the fastest, but no change is ever seen without a restart.
- **FrankenPHP's worker mode with Laravel Octane:** the app stays loaded between requests, fastest of all. One more package, and a different way of thinking: what a request leaves in memory is still there for the next. Its reload on save watches the files, which does not work through the shared folder on Windows. It may still come with production ([D2.6](#d26-hosting)).
- **Docker Desktop's synchronized file shares:** Docker's own answer, a synchronized copy inside the virtual machine, as fast as a volume for all the code. Only with a paid Docker subscription.
- **Mutagen, docker-sync, OrbStack:** the same synchronization for free, but one more tool to install and keep running on each host; OrbStack is for the Mac only.

---

## D2.11 Continuous integration

**GitHub Actions checks every push:** a CI workflow on any branch, an audit of the dependencies every week and when they change, Dependabot proposing the actions' new versions, and merges only through a pull request whose CI passed. How it works: [H5](../how-to/H5-ci.md).

| Choice | Why |
|---|---|
| Runs on a push to any branch | A branch is checked as soon as it is pushed; its pull request needs no run of its own, since checks belong to the commit |
| The backend in its own Docker image, with Docker Compose | The rule of the project, PHP only through Docker ([D2.10](#d210-local-development)), holds in CI too: the same PHP, extensions and Postgres as locally; a failure in CI reproduces locally, and the other way round |
| Only GitHub's own actions (`actions/checkout`, `actions/setup-node`), pinned to a commit hash | An action is someone's code run with the repository's token. The backend needs none (Docker is on the runner), so the setting "GitHub's actions only" holds with no exception ([H5.3](../how-to/H5-ci.md#h53-the-settings-on-github)). A tag can be moved to other code, a hash cannot; Dependabot proposes the new hashes |
| A read-only token in every workflow | The jobs read the code and run checks; nothing they run could push, comment or open a pull request |
| An audit workflow beside Dependabot's alerts | The alerts only warn, on GitHub's page; the audit fails the branch that brings a vulnerable version, before the merge, and fails weekly on a new advisory, by email |
| The advisories reviewed listed with their reason (`auditIgnore`, `config.audit.ignore`) | Some advisories have no fix the packages that bring them can take ([H5.4](../how-to/H5-ci.md#h54-the-audit-and-the-advisories-reviewed)); a failure always there would hide the new one. Each one left out is written down, with why |
| Dependabot's version updates for the actions only | npm and Composer updates are made by hand, a few at a time, with `make check`; their security is covered by the alerts and the audit |
| CodeQL's default setup, not a workflow of ours | GitHub's own analysis, configured and updated by GitHub, with no file to keep; it also reads the workflows, the part of a CI most often written carelessly. It does not read PHP |
| `make github-check` reads the settings with `gh` | Settings live on GitHub's pages, outside the repository, where a change goes unnoticed; one command compares them all with the ones decided, as `make doctor` does for the local setup |
| Merges only through a pull request, both CI jobs required | GitHub merges only a commit whose CI passed: nothing reaches `main` directly from a local clone. `make merge` opens the pull request and lets auto-merge finish it |

**Set aside:**

- **PHP set up on the runner by a third-party action** (`shivammathur/setup-php`): faster than building the image, but one more author's code with the token, an exception to "GitHub's actions only", and a PHP that is not the project's image.
- **Caching the Docker image between runs** (`docker/build-push-action` with GitHub's cache): a minute or two saved per run, for another third-party action. Worth it if the backend job grows slow.

---

← [D1. UI design](D1-ui.md) · [Contents](../README.md) · [D3. Data model](D3-data-model.md) →
