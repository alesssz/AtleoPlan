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
- **React app** in `frontend/` ([S1.7](#s17-creating-the-react-frontend), guide in [C1](../concepts/C1-frontend.md)): React 19, TypeScript 6, Vite 8 on port 5673 with the proxy to Laravel; React Router, TanStack Query, i18next in four languages, Tailwind and shadcn/ui with the design system's colours, a dark / light theme; the app's frame (tab bar on phones, sidebar wider) in the energetic style of D1.5, empty states on the pages not built yet, a working Profile page; Vitest and ESLint with the code style. Node 24 pinned in `.nvmrc`.

- **Signing in:** sign up, in and out, and resetting a password, with Fortify and four React screens; route guards; language and theme saved on the account; only admins open `/admin` ([C2.7](../concepts/C2-backend.md#c27-signing-in-sanctum), [C1.13](../concepts/C1-frontend.md#c113-signing-in-and-forms)).
- **Exercise library, tables** (first part of BE-1): `muscles` and `equipment` filled with free-exercise-db's 17 muscles and 12 kinds of equipment in four languages, `exercises` and `exercise_muscle`, with their models, relations and tests ([D3.4](../design/D3-data-model.md#d34-exercise-library), [H1.10](../how-to/H1-database.md#h110-the-exercise-library-as-built)).
- **Exercise library, API** (second part of BE-1): the list with search, filters and pages, reading, creating, changing and deleting personal exercises ([C2.5.4](../concepts/C2-backend.md#c254-the-exercise-librarys-endpoints)).
- **Exercise library, screens** (UI-1): the list with search and filters, an exercise's page, the editor of personal exercises, with the imported photos ([C1.14](../concepts/C1-frontend.md#c114-the-exercise-library-screens)).
- **Exercise library, import and translation** (DATA-1): `make exercises-import` downloads free-exercise-db and fills the public library with its exercises, their muscles, equipment and photos ([H1.12](../how-to/H1-database.md#h112-the-free-exercise-db-import-as-built)), then writes their names, other names and steps in Italian, Spanish and German from the files of the repository ([H1.14](../how-to/H1-database.md#h114-the-translation-of-the-library-as-built)).
- **Plans, tables and API** (first part of FEAT-2): `plans`, `plan_days`, `plan_items`, `plan_sets` and the user's active plan; the API lists, reads, creates and saves a whole plan, deletes, activates and archives ([C2.5.5](../concepts/C2-backend.md#c255-the-plans-endpoints), [H1.13](../how-to/H1-database.md#h113-the-plan-tables-as-built)). After pulling it: `make migrate`.
- **Plans, screens** (second part of FEAT-2): the plan list and a plan's page, its days as tabs; `make plans-demo` gives every user two example plans ([C1.15](../concepts/C1-frontend.md#c115-the-plan-screens)).
- **Plans, editor** (last part of FEAT-2): days, exercises from the library, sets and their types, supersets, drag and drop, the draft kept in the browser ([C1.16](../concepts/C1-frontend.md#c116-the-plan-editor)).
- **Workouts, tables and API** (first part of FEAT-3): saving a workout sent by the phone, history with totals, the sets of last time, Home's data with the suggested day ([C2.5.7](../concepts/C2-backend.md#c257-the-workouts-endpoints)). After pulling it: `make migrate`.
- **Workout mode** (second part of FEAT-3): Start on a plan's day, sets ticked one tap each with last time's values, the rest timer with beep and vibration, supersets, the screen kept on; the workout kept on the phone and sent at Done, or as soon as the network returns ([C1.17](../concepts/C1-frontend.md#c117-workout-mode)).
- **Home** (third part of FEAT-3): the active plan with the suggested day and Start, a chip per day, Resume for a workout left open, a free workout with its exercises added on the way, this week's days and numbers ([C1.18](../concepts/C1-frontend.md#c118-home)).
- **Tests** run on their own Postgres database, `atleoplan_test`, never on the development one ([S1.6](#s16-creating-the-laravel-backend)).
- **Sanctum in SPA mode** for the React app at `localhost:5673`, and the **`media` table** of spatie/laravel-medialibrary.

**Not yet:** the app's features, in the order of the [backlog](../project/backlog.md) (the library's admin screen, where translations are reviewed, and photo uploads, the app working offline, history). The remaining frontend libraries come with the feature that needs them ([C1.11](../concepts/C1-frontend.md#c111-known-limits)). Deployment is postponed: everything runs locally for now ([OPS-3](../project/backlog.md#ops-3-deploy-to-the-free-server)).

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

A computer's global Git identity may be another one (on the work Mac it is the work identity). In this repository every commit uses the **personal GitHub identity** (the same as Chronovault) with GitHub's **noreply address**, so no real email ever enters the history and the repository can become public as it is ([P1.1](../project/P1-conventions.md#p11-git)).

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
4. installs the Composer packages, before the stack starts: without `vendor/` the queue worker crashes and keeps restarting until they arrive;
5. generates Laravel's key, only if it is empty: replacing it would invalidate existing sessions;
6. starts the containers, installs the npm packages, creates the test database and runs the migrations.

It can be run again safely: what is already in place stays as it is.

**The first account.** The database starts empty: create an account at http://localhost:5673/register, after `make dev`. For an admin, which also opens `/admin`, run `make artisan c="db:seed"`: it creates `test@example.com`, password `password` ([C2.8](../concepts/C2-backend.md#c28-admin-panel-filament)). Emails, such as "reset your password", appear in Mailpit, at http://localhost:8525.

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

For `create-project`, `./backend` must be empty (or missing: Docker creates it).

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
| Stop and **delete the database** | `docker compose down -v` |
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
| Example plans to look at (after the import) | `make plans-demo`: two plans for every user who has none ([H3.13.1](../how-to/H3-frontend.md#h3131-plans-to-look-at)) |
| Add a package | `docker compose exec backend composer require <package>` |
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
| New clone: hook, `backend/.env` and its key, image, packages, test database, migrations ([S1.5](#s15-first-start-the-docker-stack)) | `make setup` |
| Start everything (stack, then React) / only the stack / stop | `make start` / `make up` / `make down` |
| The local addresses | `make urls` |
| Any artisan or Composer command | `make artisan c="route:list"`, `make composer c="require vendor/package"` |
| Migrations / empty and rebuild the database | `make migrate` / `make fresh` |
| Save / restore the development database | `make db-dump` (to `backups/`, not committed) / `make db-restore f=backups/<file>.sql` |
| Create the tests' database on an old volume | `make test-db` |
| A change seems ignored (config, routes cached) | `make clear` |
| Logs | `make logs` (backend), `make logs s=queue` |
| React dev server | `make dev` |
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
| **"port is already allocated"** | Another project uses that port. Check with `lsof -nP -iTCP:8500 -sTCP:LISTEN` (on Windows, `netstat -ano \| grep :8500`); change it once with the variable of [S1.4](#s14-ports). |
| `make` stops with **`"grep" is not recognized`**, or **`cp`** is not recognized | The terminal is the Command Prompt or PowerShell: on Windows, use Git Bash ([S1.2](#s12-prerequisites)). |
| `migrate` says **"APPLICATION IN PRODUCTION"** on a new clone | `backend/.env` is missing, so Laravel assumes production. `make setup` creates it ([S1.5](#s15-first-start-the-docker-stack)). |
| `backend` or `queue` stops at once: **"Could not open input file: artisan"** | The Laravel app does not exist yet: [S1.6](#s16-creating-the-laravel-backend). |
| `create-project` says the **directory is not empty** | `./backend` must be empty: remove what is in it, hidden files included. |
| `composer require` fails with **"… is locked to version … and an update of this package was not requested"** | The new package needs other versions of packages already in `composer.lock`. Add `-W` (`--with-all-dependencies`) so Composer may update them too; try first with `--dry-run` to see what would change. |
| `queue` shows **unhealthy** | Fixed in `compose.yaml` (the image's healthcheck asks Caddy, which the worker does not run); recreate it with `docker compose up -d queue`. Whether the worker works is in `docker compose logs queue`. |
| `npm install` fails with **EACCES** and "Your cache folder contains root-owned files" (macOS, Linux) | An npm command once run with `sudo` left files in `~/.npm` owned by root. Give them back to the user: `sudo chown -R $(id -u):$(id -g) ~/.npm`. Never run npm with `sudo`. |
| Tests fail with **database "atleoplan_test" does not exist** | The Postgres volume predates the init script: `make test-db` creates it ([S1.6](#s16-creating-the-laravel-backend)). |
| Something odd, cause unknown | `make doctor` checks the usual suspects above and prints the fix for each. |
| A commit is **refused by pre-commit** | The identity is not the noreply one: [S1.3](#s13-git-identity). |
| A change to `dev.ini` or the `Dockerfile` has no effect | The image must be rebuilt: `docker compose build && docker compose up -d`. |
| The React app gets **401 / CSRF token mismatch** | The browser is not on `localhost:5673`, or Sanctum's SPA settings are missing: [S1.6](#s16-creating-the-laravel-backend). |
| **`/admin` answers 403** | The account is not an admin: [C2.8](../concepts/C2-backend.md#c28-admin-panel-filament). |
| The app shows **"Can't reach the server"** | The Docker stack is not running, or the server has an error: `make up`, then `make logs`. |
| **"Too many attempts"** when signing in | Five tries a minute for one email: wait a minute ([C2.7.4](../concepts/C2-backend.md#c274-slowing-down-password-guessing)). |
| A reset email's **link opens the wrong address** | `FRONTEND_URL` in `compose.yaml`; after changing it, `docker compose up -d`. |

---

[Contents](../README.md) · [D1. UI design](../design/D1-ui.md) →
