# S1. Setup

How to get AtleoPlan running on a computer: what is already in place, what is needed, how the Laravel and React apps are created, the port rule, the commands for every day, useful links and known problems. The decisions behind these choices are in [D2. Decisions](../design/D2-decisions.md); how work is done is in [P1. Conventions](../project/P1-conventions.md).

## Contents

- [S1.1 Where the project stands](#s11-where-the-project-stands)
- [S1.2 Prerequisites](#s12-prerequisites)
- [S1.3 Git identity](#s13-git-identity)
- [S1.4 Ports](#s14-ports)
- [S1.5 First start: the Docker stack](#s15-first-start-the-docker-stack)
- [S1.6 Creating the Laravel backend](#s16-creating-the-laravel-backend)
- [S1.7 Creating the React frontend](#s17-creating-the-react-frontend)
- [S1.8 Everyday commands](#s18-everyday-commands)
- [S1.9 Useful links](#s19-useful-links)
- [S1.10 Troubleshooting](#s110-troubleshooting)
- [S1.11 Sign in with Google: the credentials](#s111-sign-in-with-google-the-credentials)
  - [S1.11.1 The project](#s1111-the-project)
  - [S1.11.2 The consent screen](#s1112-the-consent-screen)
  - [S1.11.3 The test users](#s1113-the-test-users)
  - [S1.11.4 The client, and its secret](#s1114-the-client-and-its-secret)
  - [S1.11.5 The two lines, on each computer](#s1115-the-two-lines-on-each-computer)
  - [S1.11.6 Later, when deploying](#s1116-later-when-deploying)
  - [S1.11.7 When it does not work](#s1117-when-it-does-not-work)

---

## S1.1 Where the project stands

**Done:**

- **Design docs:** UI ([D1](../design/D1-ui.md)), decisions ([D2](../design/D2-decisions.md)), conventions ([P1](../project/P1-conventions.md)), data model ([D3](../design/D3-data-model.md)), how-to guides for the database ([H1](../how-to/H1-database.md)), the backend ([H2](../how-to/H2-backend.md)), the frontend ([H3](../how-to/H3-frontend.md)) and opening the database ([H4](../how-to/H4-database-tools.md)), [backlog](../project/backlog.md).
- **Git:** repository on GitHub (`alesssz/AtleoPlan`) with the personal GitHub identity, and a hook that refuses any other email ([S1.3](#s13-git-identity)).
- **Docker stack for development:** [`Dockerfile`](../../Dockerfile), [`compose.yaml`](../../compose.yaml), [`docker/php/dev.ini`](../../docker/php/dev.ini). Four services:

| Service | What it is |
|---|---|
| `backend` | Laravel on FrankenPHP (PHP 8.4 inside the Caddy web server), with Composer, ffmpeg and the PHP extensions the app needs |
| `queue` | Same image, runs the queued jobs (video conversion, emails) |
| `postgres` | PostgreSQL 18, data kept in the `postgres-data` volume |
| `mailpit` | Catches every email the app sends and shows it in a web page |

- **Laravel app** in `backend/` ([S1.6](#s16-creating-the-laravel-backend)): Laravel 13 on Postgres, Sanctum (`install:api`), Filament 5 with its admin panel at `/admin`, spatie/laravel-medialibrary, laravel-query-builder and laravel-translatable, Pest 4. The default migrations have run and the two example tests pass.
- **React app** in `frontend/` ([S1.7](#s17-creating-the-react-frontend), guide in [C1](../concepts/C1-frontend.md)): React 19, TypeScript 6, Vite 8 on port 5673 with the proxy to Laravel; React Router, TanStack Query, i18next in four languages, Tailwind and shadcn/ui with the design system's colours, a dark / light theme; the app's frame (tab bar on phones, sidebar wider) in the energetic style of D1.5, empty states on the pages not built yet, a working Profile page with the language, the theme and the workout's preferences; Vitest and ESLint with the code style. Node 24 pinned in `.nvmrc`.

- **The logo:** a heavy italic A with a tick cut out of it, in the app, the browser tab and the README ([D1.5](../design/D1-ui.md#d15-design-system), [H3.19](../how-to/H3-frontend.md#h319-the-logo-as-built)).
- **Signing in:** sign up, in and out, and resetting a password, with Fortify and four React screens; route guards; language and theme saved on the account; only admins open `/admin` ([C2.7](../concepts/C2-backend.md#c27-signing-in-sanctum), [C1.13](../concepts/C1-frontend.md#c113-signing-in-and-forms)).
- **Exercise library, tables** (first part of BE-1): `muscles` and `equipment` filled with free-exercise-db's 17 muscles and 12 kinds of equipment in four languages, `exercises` and `exercise_muscle`, with their models, relations and tests ([D3.4](../design/D3-data-model.md#d34-exercise-library), [H1.10](../how-to/H1-database.md#h110-the-exercise-library-as-built)).
- **Exercise library, API** (second part of BE-1): the list with search, filters and pages, reading, creating, changing and deleting personal exercises ([C2.5.4](../concepts/C2-backend.md#c254-the-exercise-librarys-endpoints)).
- **Exercise library, screens** (UI-1): the list with search and filters, an exercise's page, the editor of personal exercises, with the imported photos ([C1.14](../concepts/C1-frontend.md#c114-the-exercise-library-screens)).
- **Exercise library, photos** (last part of BE-1): photos of personal exercises uploaded, ordered and removed in the editor, of public ones in the admin panel; a 400 px and a 1600 px WebP copy of each; Duplicate as mine ([C2.5.9](../concepts/C2-backend.md#c259-the-photos-of-an-exercise), [C1.14.7](../concepts/C1-frontend.md#c1147-uploading-photos-and-duplicate-as-mine)).
- **Exercise library, import and translation** (DATA-1): `make exercises-import` downloads free-exercise-db and fills the public library with its exercises, their muscles, equipment and photos ([H1.12](../how-to/H1-database.md#h112-the-free-exercise-db-import-as-built)), adds the project's own extra exercises (calisthenics, [H1.17](../how-to/H1-database.md#h117-the-extra-exercises-as-built)), then writes their names, other names and steps in Italian, Spanish and German from the files of the repository ([H1.14](../how-to/H1-database.md#h114-the-translation-of-the-library-as-built)).
- **Plans, tables and API** (first part of FEAT-2): `plans`, `plan_days`, `plan_items`, `plan_sets` and the user's active plan; the API lists, reads, creates and saves a whole plan, deletes, activates and archives ([C2.5.5](../concepts/C2-backend.md#c255-the-plans-endpoints), [H1.13](../how-to/H1-database.md#h113-the-plan-tables-as-built)). After pulling it: `make migrate`.
- **Plans, screens** (second part of FEAT-2): the plan list and a plan's page, its days as tabs; `make plans-demo` gives every user two example plans ([C1.15](../concepts/C1-frontend.md#c115-the-plan-screens)).
- **Plans, editor** (last part of FEAT-2): days, exercises from the library, sets and their types, supersets, drag and drop, the draft kept in the browser ([C1.16](../concepts/C1-frontend.md#c116-the-plan-editor)).
- **Workouts, tables and API** (first part of FEAT-3): saving a workout sent by the phone, history with totals, the sets of last time, Home's data with the suggested day ([C2.5.7](../concepts/C2-backend.md#c257-the-workouts-endpoints)). After pulling it: `make migrate`.
- **Workout mode** (second part of FEAT-3): Start on a plan's day, sets ticked one tap each with last time's values, the rest timer with beep and vibration, supersets, the screen kept on; the workout kept on the phone and sent at Done, or as soon as the network returns ([C1.17](../concepts/C1-frontend.md#c117-workout-mode)).
- **The stepper and the exercise menu** (UI-6): a tap on a set's value opens a big − / + panel; "⋯" beside an exercise swaps it for another of the same muscle, skips it, or adds a note ([C1.17.7](../concepts/C1-frontend.md#c1177-the-big-stepper-and-the-exercises-menu)).
- **Workout preferences** (UI-7): Profile's Workout card, with the weight unit, the default rest, the stepper's weight step, the timer's sound and vibration ([C1.13.4](../concepts/C1-frontend.md#c1134-preferences-on-the-account)).
- **Home** (third part of FEAT-3): the active plan with the suggested day and Start, a chip per day, Resume for a workout left open, a free workout with its exercises added on the way, this week's days and numbers ([C1.18](../concepts/C1-frontend.md#c118-home)).
- **Sign in with Google** (FEAT-9): "Continue with Google" on the sign-in and sign-up pages, with Laravel Socialite; an address already registered is linked, a new one gets an account without a password ([C2.7.8](../concepts/C2-backend.md#c278-signing-in-with-google), [C1.13.7](../concepts/C1-frontend.md#c1137-continue-with-google)). It needs the Google credentials in `backend/.env` on each computer ([S1.11](#s111-sign-in-with-google-the-credentials)). After pulling it: `make setup` (a new Composer package, two migrations).
- **Summary and history** (FEAT-4): after Finish, the workout's numbers, the comparison with last time, how it felt and notes; history by month under Progress, each workout with its sets, deletable ([C1.19](../concepts/C1-frontend.md#c119-the-summary-and-history)).
- **Tests** run on their own Postgres database, `atleoplan_test`, never on the development one ([S1.6](#s16-creating-the-laravel-backend)).
- **Sanctum in SPA mode** for the React app at `localhost:5673`, and the **`media` table** of spatie/laravel-medialibrary.

**Not yet:** the app's features, in the order of the [backlog](../project/backlog.md) (the library's admin screen, where translations are reviewed, and photo uploads, the app working offline). The remaining frontend libraries come with the feature that needs them ([C1.11](../concepts/C1-frontend.md#c111-known-limits)). Deployment is postponed: everything runs locally for now ([OPS-3](../project/backlog.md#ops-3-deploy-to-the-free-server)).

---

## S1.2 Prerequisites

| Tool | Why | Check |
|---|---|---|
| **Docker Desktop** | Runs PHP, Composer, Postgres and Mailpit: **no PHP or Composer needed on your computer** | `docker --version` |
| **Node 24** with npm (the version in `.nvmrc`) | Runs the React app and Vite on your computer | `node --version` |
| **Git** | | `git --version` |
| **Make** | Runs the shortcuts of [S1.8](#s18-everyday-commands). Already on a Mac; on Windows it is a separate install, for example `choco install make` | `make --version` |

**On Windows, run every command from Git Bash** (it comes with Git; in VS Code, the arrow next to the terminal's **+**). The recipes of the `Makefile` need `bash`, `grep` and `cp`: from the Command Prompt or PowerShell, `make` stops with `"grep" is not recognized`, and `cp` may not exist either. A PHP or Composer already installed on the computer is simply not used: the project's PHP is the one in the container.

Git for Windows may check files out with Windows line endings (CRLF, `core.autocrlf`). It is harmless: the repository keeps LF, and the hook and every check of `make check` pass.

Docker Desktop needs free space on its virtual disk: when it is full, builds fail with misleading errors ([S1.10](#s110-troubleshooting)). `docker system df` shows the usage.

---

## S1.3 Git identity

A computer's global Git identity may be another one. In this repository every commit uses the **personal GitHub identity** (the same as Chronovault) with GitHub's **noreply address**, so no real email ever enters the history of this public repository ([P1.1](../project/P1-conventions.md#p11-git), [P1.5](../project/P1-conventions.md#p15-a-public-repository)).

On a **new clone**, before the first commit:

```sh
git config user.name "Alessandro"
git config user.email "32982604+alesssz@users.noreply.github.com"
git config core.hooksPath .githooks   # turns on the hook below
```

The hook [`.githooks/pre-commit`](../../.githooks/pre-commit) refuses a commit whose author or committer has any other email. Check the identity in use with `git var GIT_AUTHOR_IDENT`.

On GitHub, **Settings → Emails → "Block command line pushes that expose my email"** adds a second guard on the server side.

---

## S1.4 Ports

**Rule: on your computer, each service uses its standard port + 500.** Standard ports are often taken by other projects (Chronovault adds 100); + 500 is kept for AtleoPlan. Inside the containers the standard ports stay.

| Service | Standard | On your computer | Variable to change it |
|---|---|---|---|
| Laravel (API, Filament admin) | 8000 | **8500** | `APP_PORT` |
| Postgres | 5432 | **5932** | `DB_FORWARD_PORT` |
| Mailpit (web page) | 8025 | **8525** | `MAIL_UI_PORT` |
| Vite (React dev server) | 5173 | **5673** | `server.port` in `frontend/vite.config.ts` |

Mailpit's SMTP port (1025) is used by Laravel inside Docker only and is not opened on your computer. Every port is bound to `127.0.0.1`: reachable from your computer, not from the network.

A new service follows the same rule. To use another port once: `APP_PORT=8600 docker compose up -d`.

---

## S1.5 First start: the Docker stack

**On a new clone of the project as it is now, one command does everything:** set the Git identity ([S1.3](#s13-git-identity)), then run `make setup` and `make doctor`. In order, `make setup`:

1. turns on the Git hook;
2. creates `backend/.env` from `backend/.env.example`, if missing: without it Laravel believes it is in production and `migrate` stops to ask for confirmation;
3. builds the image;
4. installs the Composer packages, before the stack starts: without `vendor/` the queue worker crashes and keeps restarting until they arrive. They go into the `vendor` Docker volume, which makes requests ten times faster than reading them through the folder shared with the computer, and Composer then copies them to `backend/vendor/` for the editor ([H2.18](../how-to/H2-backend.md#h218-a-fast-local-backend-the-packages-in-a-volume-as-built));
5. generates Laravel's key, only if it is empty: replacing it would invalidate existing sessions;
6. starts the containers, installs the npm packages, creates the test database and runs the migrations;
7. fills the muscles and the equipment (`make reference-data`): the fixed lists every exercise points to ([D3.4.1](../design/D3-data-model.md#d341-muscles-and-equipment)), which the app and the exercise import both need.

It can be run again safely: what is already in place stays as it is.

**Where the files live.** Docker Desktop runs Linux in a virtual machine, on the Mac and on Windows alike. A folder of the computer shared with a container (a *bind mount*) is seen by both at once, but every file read through it crosses from one system to the other; a Docker *named volume* sits on the virtual machine's own disk, fast, and the computer does not see it ([H2.18.2](../how-to/H2-backend.md#h2182-two-kinds-of-mount)):

| What | Where | Kind | Why there |
|---|---|---|---|
| The Laravel code, `backend/` | The computer's folder, at `/app` in the container | Bind mount | Edited in VS Code, seen at once by Laravel |
| The Composer packages, `backend/vendor/` as the app reads them | The `vendor` volume (`atleoplan_vendor`), at `/app/vendor` | Named volume | Read a thousand at a time on every request: ten times faster than through the shared folder ([D2.10](../design/D2-decisions.md#d210-local-development)) |
| The same packages, a copy for the editor | `backend/vendor/` on the computer, at `/vendor-host` | Bind mount | So VS Code can complete and open Laravel's classes; Composer refreshes it after every change, `make vendor` by hand |
| The database | The `postgres-data` volume | Named volume | Survives `make down`; `make down-v` deletes it |
| Composer's downloads | The `composer-cache` volume | Named volume | A package is downloaded once, even when the `vendor` volume is rebuilt |
| The frontend, `frontend/` with its `node_modules/` | The computer only | — | Vite runs on the computer, not in Docker |

`make down-v` deletes every volume, the packages' too: `make setup` puts them back.

**After a pull, on either computer,** run `make setup` again: it brings the image, the packages and the database up to date with what was pulled, so new packages and new migrations are never forgotten. `make doctor` is not enough for this: it checks that the packages are installed, not that they are the latest. Then, if the exercise library is empty (on a new database, or the first time after the library was added), run `make exercises-import`; if it is there but older than the extra exercises (no "Frog stand" in it), `make exercises-extra` adds them in seconds; if Plank is still logged as reps, `make exercises-correct` puts it right; if the library's photos have no small copies yet (their addresses end in `.jpg`, not `-thumb.webp`), `make exercises-thumbnails` makes them, in about 5 minutes.

What the last step of `make setup` prints. The seeders write with `updateOrCreate()`, so a second run changes nothing:

```
docker compose exec backend php artisan db:seed --class=MuscleSeeder

   INFO  Seeding database.

  Database\Seeders\MuscleSeeder ...................................... RUNNING
  Database\Seeders\MuscleSeeder ................................... 74 ms DONE

docker compose exec backend php artisan db:seed --class=EquipmentSeeder

   INFO  Seeding database.

  Database\Seeders\EquipmentSeeder ................................... RUNNING
  Database\Seeders\EquipmentSeeder ................................ 58 ms DONE
```

**How to check:** `make psql`, then `select count(*) from muscles;` gives 17, and `select count(*) from equipment;` gives 12.

**The first account.** The database starts empty: create an account at http://localhost:5673/register, after `make dev`. For an admin, which also opens the panel at http://localhost:8500/admin (or Profile → Administration in the app), run `make artisan c="db:seed"`: it creates `test@example.com`, password `password`; or make your own account an admin, a Google one included ([C2.8](../concepts/C2-backend.md#c28-admin-panel-filament), [C2.8.4](../concepts/C2-backend.md#c284-the-way-in-a-link-and-google-on-the-panels-login)). Emails, such as "reset your password", appear in Mailpit, at http://localhost:8525.

The rest of this section and [S1.6](#s16-creating-the-laravel-backend) are how the project was created the first time, kept for reference. From the project folder:

```sh
docker compose build            # builds the backend image (a few minutes the first time)
docker compose up -d postgres mailpit
docker compose ps               # both should say "healthy"
```

The `backend` and `queue` services start only once the Laravel app exists ([S1.6](#s16-creating-the-laravel-backend)); before that they would stop at once, finding no `artisan` file.

---

## S1.6 Creating the Laravel backend

How the backend works once created, for a reader new to PHP and Laravel: [C2. Backend](../concepts/C2-backend.md).

**How it works.** There is no need to go inside the container: commands are typed in your computer's terminal, from the project folder, and Docker runs them in the container. The container is a computer with PHP and Composer installed, working on your computer's `backend/` folder:

1. `docker compose run --rm backend <command>` starts a container from the `backend` image and runs the command in it.
2. Inside the container, `/app` **is** your computer's `./backend` folder (a bind mount in `compose.yaml`): what the command writes there appears on your computer at once, and what is edited in VS Code is seen at once by the container.
3. `--rm` deletes the container when the command ends; the files stay.

`run --rm` is for when the stack is stopped (as now, before Laravel exists); once it runs, `docker compose exec backend <command>` uses the container already started, which is faster ([S1.8](#s18-everyday-commands)).

For `create-project`, `./backend` must be empty (or missing: Docker creates it). With today's `compose.yaml` it never is: Docker creates `backend/vendor/` as the place where the `vendor` volume is mounted, and Composer stops with `Project directory "/app/." is not empty.` To create the app again from scratch, comment out the two `vendor` lines under the `x-backend` block's `volumes:` for that one command ([H2.18.6](../how-to/H2-backend.md#h2186-when-something-goes-wrong)).

```sh
# D1. Create the Laravel app in ./backend
docker compose run --rm backend composer create-project laravel/laravel .

# D2. Start everything: Laravel answers at http://localhost:8500
docker compose up -d

# P1. Add the API layer: Sanctum and routes/api.php
docker compose exec backend php artisan install:api
```

The same can be done from inside the container, if preferred; it is equivalent, only longer:

```sh
docker compose run --rm backend bash      # a shell in the container, in /app
composer create-project laravel/laravel .
exit
```

A new Laravel app's `.env` points at SQLite: it does not matter here, because `compose.yaml` passes the Postgres settings as environment variables, and in Laravel those win over `.env`.

**The packages of [D2.2](../design/D2-decisions.md#d22-stack)**, each with its own install step (check the linked page for the current version):

```sh
docker compose exec backend composer require filament/filament
docker compose exec backend php artisan filament:install --panels     # admin panel at /admin
docker compose exec backend composer require spatie/laravel-medialibrary \
  spatie/laravel-query-builder spatie/laravel-translatable
# -W: Pest needs one exact PHPUnit version, and a new app's composer.lock pins
# another; -W lets Composer move PHPUnit (and laravel/pao) to fit
docker compose exec backend composer require --dev pestphp/pest pestphp/pest-plugin-laravel -W
docker compose exec backend vendor/bin/pest --init     # tests/Pest.php, tests rewritten for Pest
```

**The photo and video table** of spatie/laravel-medialibrary, published and then run (published migrations get comments like ours, [P1.2](../project/P1-conventions.md#p12-code)):

```sh
docker compose exec backend php artisan vendor:publish \
  --provider="Spatie\MediaLibrary\MediaLibraryServiceProvider" --tag="medialibrary-migrations"
docker compose exec backend php artisan migrate
```

**Cookie login from the React app (Sanctum SPA mode)**, so the browser at `localhost:5673` is recognised:

- in `backend/bootstrap/app.php`, inside `withMiddleware`: `$middleware->statefulApi();`
- `SANCTUM_STATEFUL_DOMAINS=localhost:5673`, set in `compose.yaml` with the other environment variables.

**Signing in with Fortify** ([C2.7](../concepts/C2-backend.md#c27-signing-in-sanctum)):

```sh
docker compose exec backend composer require laravel/fortify
docker compose exec backend php artisan fortify:install
```

`fortify:install` publishes `config/fortify.php`, `app/Providers/FortifyServiceProvider.php`, the actions and two migrations. Then:

- in `config/fortify.php`: `prefix` to `api/auth`, `views` to `false`, `features` down to registration and password resets;
- the migrations for two-factor and passkeys, and the actions for changing profile and password, are deleted, as their features are off;
- `FRONTEND_URL`, for the links in emails, goes in `compose.yaml` and `.env.example`.

**A separate database for the tests.** Tests run on `atleoplan_test`, in the same Postgres container, so `RefreshDatabase` never empties the development data:

- `docker/postgres/init/01-test-database.sql` creates it when the Postgres volume is new; on a volume that already exists, create it once by hand: `docker compose exec postgres psql -U atleoplan -c "CREATE DATABASE atleoplan_test OWNER atleoplan;"`
- `backend/phpunit.xml` points the tests at it. The variables set by `compose.yaml` are in `$_SERVER`, which Laravel reads first, so they are overridden with `<server>` entries as well as `<env force="true">`; `<env>` alone is not enough.
- `tests/Feature/TestDatabaseTest.php` fails if the tests are ever on another database.

---

## S1.7 Creating the React frontend

**No Docker here.** Unlike the backend, the frontend runs directly on your computer with its own Node and npm ([S1.2](#s12-prerequisites)), so the usual npm commands are used, with no `docker compose` in front. Why ([D2.2](../design/D2-decisions.md#d22-stack)):

- npm needs only Node, whose version is pinned in [`.nvmrc`](../../.nvmrc) (`nvm use` picks it up).
- VS Code's TypeScript and ESLint read the types from `frontend/node_modules`, which must therefore be on your computer.
- Vite reloads pages faster when it reads the files from your computer's own disk.

Day to day this means two terminals: `docker compose up -d` for the backend, `npm run dev` in `frontend/` for React.

`npm create vite` asks a couple of questions: the proposed answers are fine.

```sh
# D1. Create the app in ./frontend (React + TypeScript template)
npm create vite@latest frontend -- --template react-ts

# D2. Install and start it
cd frontend
npm install
npm run dev
```

**Port and proxy.** In `frontend/vite.config.ts`, the dev server moves to 5673 ([S1.4](#s14-ports)) and forwards the backend's paths to Laravel. The browser then sees a single address, as it will in production behind Caddy ([D2.6](../design/D2-decisions.md#d26-hosting)), and Sanctum's cookies work without CORS:

```ts
export default defineConfig({
  plugins: [react()],
  server: {
    // Standard port + 500 (docs/start/S1-setup.md S1.4); fail rather than pick another
    port: 5673,
    strictPort: true,
    // Laravel's paths go to the backend container; everything else is React
    proxy: {
      '/api': 'http://localhost:8500',
      '/sanctum': 'http://localhost:8500',
      '/storage': 'http://localhost:8500',
      '/auth/': 'http://localhost:8500',   // added later, for Google (FEAT-9)
    },
  },
})
```

The Filament admin is opened directly at http://localhost:8500/admin.

**The base libraries,** as they were installed. `npm install` in `frontend/` restores them all on a new clone; this list is for reference only.

```sh
npm install tailwindcss @tailwindcss/vite @fontsource-variable/inter
npx shadcn@latest init -t vite -b radix -p nova   # Radix base, Nova preset; needs the @/ alias first
npx shadcn@latest add card select skeleton separator
npm install react-router @tanstack/react-query i18next react-i18next i18next-browser-languagedetector
npm install -D @tanstack/react-query-devtools vitest jsdom @testing-library/react \
  @testing-library/jest-dom @testing-library/user-event @stylistic/eslint-plugin
npm install react-hook-form zod @hookform/resolvers      # forms, with signing in
npx shadcn@latest add input label
```

The others of [D2.2](../design/D2-decisions.md#d22-stack) come with the feature that needs them:
- dnd-kit with the plan editor (FEAT-2);
- vite-plugin-pwa with the offline work (FEAT-3); workout mode itself needed no package;
- Recharts with the progress charts (phase 2).

How the frontend is built and how to work on it: [C1. Frontend](../concepts/C1-frontend.md).

---

## S1.8 Everyday commands

Run from the project folder. `exec` runs in the container already started (fast); `run --rm` starts a new one and removes it afterwards (works with the stack stopped).

**The stack**

| What | Command |
|---|---|
| Start everything | `docker compose up -d` |
| Stop (data kept) | `docker compose down` |
| Stop and **delete the database** (and the Composer packages: `make setup` after) | `docker compose down -v` |
| What is running, and on which ports | `docker compose ps` |
| Follow the logs | `docker compose logs -f backend` (or `queue`, `postgres`) |
| Restart the queue worker | `docker compose restart queue` |
| Rebuild after changing `Dockerfile` or `dev.ini` | `docker compose build && docker compose up -d` |
| A shell in the backend container | `docker compose exec backend bash` |

**Laravel**

| What | Command |
|---|---|
| Any artisan command | `docker compose exec backend php artisan <command>` |
| Run the migrations | `docker compose exec backend php artisan migrate` |
| Empty the database and rebuild it, with test data | `docker compose exec backend php artisan migrate:fresh --seed` |
| Fill the public exercise library (after a fresh database too) | `make exercises-import`: the first time it also clones free-exercise-db into `backend/storage/app/` ([H1.12](../how-to/H1-database.md#h112-the-free-exercise-db-import-as-built)) |
| Add the extra exercises (calisthenics) to a library imported before them | `make exercises-extra` ([H1.17](../how-to/H1-database.md#h117-the-extra-exercises-as-built)) |
| Correct the logging types the import guessed wrong (Plank as time) in a library imported before the list | `make exercises-correct` ([H1.19](../how-to/H1-database.md#h119-the-corrected-logging-types-as-built)) |
| Make the small and large copies of photos added before they existed | `make exercises-thumbnails` ([H2.17](../how-to/H2-backend.md#h2174-the-copies-of-the-photos-already-there)) |
| Example plans to look at (after the import) | `make plans-demo`: two plans for every user who has none ([H3.13.1](../how-to/H3-frontend.md#h3131-plans-to-look-at)) |
| Add a package (it is then copied to `backend/vendor/` for the editor by itself, about 20 s on Windows) | `docker compose exec backend composer require <package>` |
| Copy the packages to `backend/vendor/` by hand | `make vendor` ([H2.18](../how-to/H2-backend.md#h218-a-fast-local-backend-the-packages-in-a-volume-as-built)) |
| Interactive console | `docker compose exec backend php artisan tinker` |
| Tests (on the `atleoplan_test` database) | `docker compose exec backend php artisan test` |
| Format the code (Pint) | `docker compose exec backend vendor/bin/pint` |
| List the routes | `docker compose exec backend php artisan route:list` |

**Database**

| What | Command |
|---|---|
| SQL console | `docker compose exec postgres psql -U atleoplan` |
| From a GUI (TablePlus, DBeaver…) | host `localhost`, port `5932`, user, password and database `atleoplan` |

**Frontend** (in `frontend/`)

| What | Command |
|---|---|
| Dev server, http://localhost:5673 | `npm run dev` |
| Production build | `npm run build` |
| Tests | `npx vitest` |

**Shortcuts: `make`.** The [`Makefile`](../../Makefile) wraps the commands above, so they need not be typed in full; `make help` lists them all. The most used:

| What | Command |
|---|---|
| Is everything in order? Docker and its disk, Node, npm cache, Git identity and hook, packages, ports, test database; prints the fix for each problem | `make doctor` |
| New clone, or after a pull: hook, `backend/.env` and its key, image, packages, test database, migrations, muscles and equipment ([S1.5](#s15-first-start-the-docker-stack)) | `make setup` |
| Only the muscles and the equipment; safe to run again | `make reference-data` |
| Start everything (stack, then React) / only the stack / stop | `make start` / `make up` / `make down` |
| The local addresses | `make urls` |
| Any artisan or Composer command | `make artisan c="route:list"`, `make composer c="require vendor/package"` |
| Migrations / empty and rebuild the database | `make migrate` / `make fresh` |
| Save / restore the development database | `make db-dump` (to `backups/`, not committed) / `make db-restore f=backups/<file>.sql` |
| Create the tests' database on an old volume | `make test-db` |
| A change seems ignored (config, routes cached) | `make clear` |
| Logs | `make logs` (backend), `make logs s=queue` |
| React dev server | `make dev` |
| An Android phone on USB opens the dev app at its own `localhost:5673` ([H3.8.2](../how-to/H3-frontend.md#h382-a-real-android-phone-over-usb)) | `make phone` |
| Tests, all or some | `make test`, `make test f=TestDatabase` |
| Fix PHP format and ESLint problems automatically | `make fix` |
| Every check before a merge: Pint, tests, lint, types, the docs' contents lists | `make check` (needs the stack up) |
| Rebuild the contents list at the top of every doc, after adding, renaming or removing a heading | `make toc` |
| Known vulnerabilities in the packages (report only) | `make audit` |
| New branch from an up-to-date `main` | `make branch name=feat/plan-editor` |
| Back to `main`, up to date with GitHub | `make sync` |
| Push the current branch | `make push` |
| Merge the current branch into `main` | `make merge` ([P1.1](../project/P1-conventions.md#p11-git)) |

Values go in variables (`c=`, `s=`), because Make reads anything after the target as more targets.

---

## S1.9 Useful links

**Local**

| What | Address |
|---|---|
| Laravel | http://localhost:8500 |
| Filament admin (once installed) | http://localhost:8500/admin |
| React app (once created) | http://localhost:5673 |
| Mailpit | http://localhost:8525 |
| Postgres, from a database program | `127.0.0.1:5932`, database, user and password `atleoplan` ([H4](../how-to/H4-database-tools.md)) |

**Documentation**

| Topic | Link |
|---|---|
| Laravel | https://laravel.com/docs |
| Sanctum, SPA authentication | https://laravel.com/docs/sanctum#spa-authentication |
| Fortify | https://laravel.com/docs/fortify |
| React Hook Form | https://react-hook-form.com |
| Zod | https://zod.dev |
| Filament | https://filamentphp.com/docs |
| spatie/laravel-medialibrary | https://spatie.be/docs/laravel-medialibrary |
| spatie/laravel-query-builder | https://spatie.be/docs/laravel-query-builder |
| Pest | https://pestphp.com/docs |
| FrankenPHP | https://frankenphp.dev/docs/ |
| Docker Compose | https://docs.docker.com/compose/ |
| React | https://react.dev/learn |
| Vite | https://vite.dev/guide/ |
| TanStack Query | https://tanstack.com/query/latest/docs/framework/react/overview |
| React Router | https://reactrouter.com |
| Tailwind CSS | https://tailwindcss.com/docs |
| shadcn/ui (Vite) | https://ui.shadcn.com/docs/installation/vite |
| react-i18next | https://react.i18next.com |
| vite-plugin-pwa | https://vite-pwa-org.netlify.app |
| Mailpit | https://mailpit.axllent.org |
| free-exercise-db (exercise data, [D2.3](../design/D2-decisions.md#d23-exercise-library)) | https://github.com/yuhonas/free-exercise-db |

---

## S1.10 Troubleshooting

| Symptom | Cause and fix |
|---|---|
| A build fails in `apt-get update` with **"At least one invalid signature was encountered"** | Docker Desktop's disk is full, not a signature problem. `docker system df` shows it; `docker builder prune -af` (build cache) and `docker image prune -af` (unused images) free space without touching data. |
| `exercises:import` fails with **`Unknown equipment "barbell"`** or **`Unknown muscle`** for every exercise | The muscles and the equipment are missing, as on a database made with `make migrate` alone. `make reference-data`, then the import again; `make exercises-import` and `make setup` now do it themselves ([S1.5](#s15-first-start-the-docker-stack)) |
| A new screen shows an error after a pull, or a table "does not exist" | The pull brought new migrations or packages: `make setup` ([S1.5](#s15-first-start-the-docker-stack)) |
| Every API call takes **1–2 seconds** on the local stack | Composer's packages are read through the folder shared with Docker's virtual machine. They belong in the `vendor` volume: `make setup`; `make doctor` says whether they are there ([H2.18](../how-to/H2-backend.md#h218-a-fast-local-backend-the-packages-in-a-volume-as-built)) |
| Every request fails with **`vendor/autoload.php: Failed to open stream`** | The `vendor` volume is empty, as after `make down-v`: `make setup` |
| The editor does not know a package's classes | The copy in `backend/vendor/` is missing or old: `make vendor` ([H2.18](../how-to/H2-backend.md#h218-a-fast-local-backend-the-packages-in-a-volume-as-built)) |
| **"port is already allocated"** | Another project uses that port. Check with `lsof -nP -iTCP:8500 -sTCP:LISTEN` (on Windows, `netstat -ano \| grep :8500`); change it once with the variable of [S1.4](#s14-ports). |
| `make` stops with **`"grep" is not recognized`**, or **`cp`** is not recognized | The terminal is the Command Prompt or PowerShell: on Windows, use Git Bash ([S1.2](#s12-prerequisites)). |
| `migrate` says **"APPLICATION IN PRODUCTION"** on a new clone | `backend/.env` is missing, so Laravel assumes production. `make setup` creates it ([S1.5](#s15-first-start-the-docker-stack)). |
| `backend` or `queue` stops at once: **"Could not open input file: artisan"** | The Laravel app does not exist yet: [S1.6](#s16-creating-the-laravel-backend). |
| `create-project` says the **directory is not empty** | `./backend` must be empty: remove what is in it, hidden files included. |
| `composer require` fails with **"… is locked to version … and an update of this package was not requested"** | The new package needs other versions of packages already in `composer.lock`. Add `-W` (`--with-all-dependencies`) so Composer may update them too; try first with `--dry-run` to see what would change. |
| `queue` shows **unhealthy** | Fixed in `compose.yaml` (the image's healthcheck asks Caddy, which the worker does not run); recreate it with `docker compose up -d queue`. Whether the worker works is in `docker compose logs queue`. |
| `make check` or `npm test` fails at once with **`ERR_REQUIRE_ESM`** ("require() of ES Module … encoding-lite.js … not supported"), 31 errors and no test run | The terminal's Node is older than the project's: Node 22 cannot `require()` an ES module, Node 24 can, and a test library depends on it. `node -v` shows it; `nvm use` in the repository's root switches to the version of `.nvmrc` (24), for that terminal; `nvm alias default 24` makes it the default for new ones. `make doctor` checks it too. Met during DATA-3 ([H1.19.4](../how-to/H1-database.md#h1194-the-tests)). |
| `npm install` fails with **EACCES** and "Your cache folder contains root-owned files" (macOS, Linux) | An npm command once run with `sudo` left files in `~/.npm` owned by root. Give them back to the user: `sudo chown -R $(id -u):$(id -g) ~/.npm`. Never run npm with `sudo`. |
| Tests fail with **database "atleoplan_test" does not exist** | The Postgres volume predates the init script: `make test-db` creates it ([S1.6](#s16-creating-the-laravel-backend)). |
| Something odd, cause unknown | `make doctor` checks the usual suspects above and prints the fix for each. |
| A commit is **refused by pre-commit** | The identity is not the noreply one: [S1.3](#s13-git-identity). |
| A change to `dev.ini` or the `Dockerfile` has no effect | The image must be rebuilt: `docker compose build && docker compose up -d`. |
| The React app gets **401 / CSRF token mismatch** | The browser is not on `localhost:5673`, or Sanctum's SPA settings are missing: [S1.6](#s16-creating-the-laravel-backend). |
| **`/admin` answers 403** | The account is not an admin: [C2.8](../concepts/C2-backend.md#c28-admin-panel-filament). |
| **http://localhost:5673/admin** shows nothing, or the app's "page not found" | The panel is not in the React app and Vite does not forward `/admin`: it is at http://localhost:8500/admin, or Profile → Administration ([C2.8.4](../concepts/C2-backend.md#c284-the-way-in-a-link-and-google-on-the-panels-login)). |
| The panel asks for a password, and the account was made with Google | **Continue with Google** under the panel's form. Or sign in to the app first, then open `localhost:8500/admin` with `localhost`, not `127.0.0.1`: the session cookie follows the host name ([C2.8.4](../concepts/C2-backend.md#c284-the-way-in-a-link-and-google-on-the-panels-login)). |
| The app shows **"Can't reach the server"** | The Docker stack is not running, or the server has an error: `make up`, then `make logs`. |
| **"Too many attempts"** when signing in | Five tries a minute for one email: wait a minute ([C2.7.4](../concepts/C2-backend.md#c274-slowing-down-password-guessing)). |
| A reset email's **link opens the wrong address** | `FRONTEND_URL` in `compose.yaml`; after changing it, `docker compose up -d`. |

---

## S1.11 Sign in with Google: the credentials

"Continue with Google" ([C2.7.8](../concepts/C2-backend.md#c278-signing-in-with-google)) needs an **OAuth client** created in the Google Cloud Console with the owner's Google account: the app sends people to Google with the client's id, and Google sends them back only to the addresses listed in it. Nobody else can do this part, and its two values are secrets. Done once for the project; then two lines in `backend/.env` on **each computer** (the Windows PC, the Mac).

A plain Gmail account is enough. No credit card: signing in with Google is free. The console may show its menus in Italian, and Google moves them now and then: the names below are the English ones, with where they sit.

### S1.11.1 The project

1. https://console.cloud.google.com, signed in with the owner's account.
2. Top left, next to the logo, the **project picker** → **New project**.
3. Name `AtleoPlan`, the rest as it is → **Create**.
4. Once made, choose it in the picker: every step below happens inside it.

### S1.11.2 The consent screen

What people see while choosing their account.

1. Menu ☰ → **APIs & Services** → **OAuth consent screen**. It opens the **Google Auth Platform** → **Get started**.
2. **App information:** App name `AtleoPlan`; User support email: the owner's Gmail.
3. **Audience:** **External** (Internal is only for Google Workspace organisations).
4. **Contact information:** the owner's Gmail.
5. **Finish:** accept the policy → **Create**.

**No logo.** With a logo Google asks for a brand verification first; not needed now.

**Data access** stays empty: the app asks only for the basic scopes, `openid`, `email` and `profile` (name, address, photo), which need nothing added there.

### S1.11.3 The test users

1. Google Auth Platform → **Audience** → **Test users** → **Add users**.
2. The owner's Gmail, and any other account used for trying it.

The publishing status stays **Testing**: only the accounts in this list can sign in, anyone else gets "Access blocked". Enough for development; going public is S1.11.6.

### S1.11.4 The client, and its secret

1. Google Auth Platform → **Clients** → **Create client**.
2. Application type **Web application**; name `AtleoPlan dev`.
3. **Authorized JavaScript origins:** empty. The app goes to Google through the backend, not from JavaScript.
4. **Authorized redirect URIs** → **Add URI**, exactly:

   ```
   http://localhost:5673/auth/google/callback
   ```

   `http`, not https; `localhost`, not `127.0.0.1`; port `5673`, Vite's ([S1.4](#s14-ports)); no `/` at the end. One character different and Google answers `redirect_uri_mismatch`. The same address works on both computers, and on a phone through `adb reverse` ([H3.8.2](../how-to/H3-frontend.md#h382-a-real-android-phone-over-usb)), which is `localhost:5673` for the phone too.
5. **Create.**

A window shows the **Client ID** (ending in `.apps.googleusercontent.com`) and the **Client secret** (starting with `GOCSPX-`). **Download JSON**, or copy the secret now: for new clients Google shows it this once. Lost, it is not recovered: the client's page adds a new secret, and the old one is deleted.

Keep the JSON file outside the repository (a password manager is the right place): it holds the secret.

### S1.11.5 The two lines, on each computer

At the end of `backend/.env`:

```
GOOGLE_CLIENT_ID=…apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-…
```

- **Only these two.** The return address is not written here: the code builds it from `FRONTEND_URL` (`http://localhost:5673`, set in `compose.yaml`), so it cannot drift from the one given to Google.
- **Never committed:** `backend/.gitignore` leaves `.env` out (`git check-ignore -v backend/.env` answers `backend/.gitignore:3:.env	backend/.env`). Not pasted in a chat either: the names go in `backend/.env.example` with empty values, the values only in `.env`.
- **Then**, from the repository's root: `docker compose restart backend`.
- **On the Mac** the same two lines in its own `backend/.env`: the same client serves both computers.

To check that both lines are there without showing them:

```sh
docker compose exec backend grep -c '^GOOGLE_CLIENT_' .env
```

`2` means both are there; `0` or `1`, one is missing (the container's working folder is the backend's, so `.env` is `backend/.env`).

### S1.11.6 Later, when deploying

Not now: with [OPS-3](../project/backlog.md#ops-3-deploy-to-the-free-server).

1. The client's **Authorized redirect URIs** get the production address too, `https://<domain>/auth/google/callback`; the development one stays.
2. **Branding** → **Authorized domains**: the domain.
3. **Audience** → **Publish app**, so that anyone can sign in. With the basic scopes alone, Google asks for no review.
4. The production server's `.env` gets the same two lines.

### S1.11.7 When it does not work

| Google says | Why |
|---|---|
| `Error 400: redirect_uri_mismatch` | The address the app sent is not in the client's list, character for character: `localhost` against `127.0.0.1`, a `/` at the end, https, another port. The error's details show the address sent |
| "Access blocked: AtleoPlan has not completed the Google verification process" | The account is not among the test users (S1.11.3) |
| `Error 401: invalid_client` | A wrong or old id or secret in `backend/.env`, or the backend not restarted after writing them |
| `Error 401: deleted_client` | The client was deleted in the console: a new one (S1.11.4), new lines in every `.env` |

**When the app says it,** back on its own sign-in page: "Signing in with Google didn't work" (`/login?error=failed`) means Laravel stopped before going to Google or after coming back. `make logs` says why: the two lines missing from `backend/.env`, a wrong secret (`invalid_client`), a return opened twice (`InvalidStateException`). More in [H2.15.7](../how-to/H2-backend.md#h2157-checking-it-for-real).

---

[Contents](../README.md) · [D1. UI design](../design/D1-ui.md) →
