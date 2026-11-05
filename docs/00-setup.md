# 0. Setup

How to get AtleoPlan running on a computer: what is already in place, what is needed, how the Laravel and React apps are created, the port rule, the commands for every day, useful links and known problems. The decisions behind these choices are in [2. Decisions](02-decisions.md); how work is done is in [3. Conventions](03-conventions.md).

---

## 0.1 Where the project stands

**Done:**

- **Design docs:** UI ([1](01-ui-design.md)), decisions ([2](02-decisions.md)), conventions ([3](03-conventions.md)), data model ([6](06-data-model.md)), [backlog](backlog.md).
- **Git:** repository on GitHub (`alesssz/AtleoPlan`) with the personal GitHub identity, and a hook that refuses any other email ([0.3](#03-git-identity)).
- **Docker stack for development:** [`Dockerfile`](../Dockerfile), [`compose.yaml`](../compose.yaml), [`docker/php/dev.ini`](../docker/php/dev.ini). Four services:

| Service | What it is |
|---|---|
| `backend` | Laravel on FrankenPHP (PHP 8.4 inside the Caddy web server), with Composer, ffmpeg and the PHP extensions the app needs |
| `queue` | Same image, runs the queued jobs (video conversion, emails) |
| `postgres` | PostgreSQL 18, data kept in the `postgres-data` volume |
| `mailpit` | Catches every email the app sends and shows it in a web page |

- **Laravel app** in `backend/` ([0.6](#06-creating-the-laravel-backend)): Laravel 13 on Postgres, Sanctum (`install:api`), Filament 5 with its admin panel at `/admin`, spatie/laravel-medialibrary, laravel-query-builder and laravel-translatable, Pest 4. The default migrations have run and the two example tests pass.
- **React app** in `frontend/` ([0.7](#07-creating-the-react-frontend), guide in [4](04-frontend.md)): React 19, TypeScript 6, Vite 8 on port 5673 with the proxy to Laravel; React Router, TanStack Query, i18next in four languages, Tailwind and shadcn/ui with the design system's colours, a dark / light theme; the app's frame (tab bar on phones, sidebar wider) in the energetic style of 1.5, empty states on the pages not built yet, a working Profile page; Vitest and ESLint with the code style. Node 24 pinned in `.nvmrc`.

- **Tests** run on their own Postgres database, `atleoplan_test`, never on the development one ([0.6](#06-creating-the-laravel-backend)).
- **Sanctum in SPA mode** for the React app at `localhost:5673`, and the **`media` table** of spatie/laravel-medialibrary.

**Not yet:** the app's features, in the order of the [backlog](backlog.md) (sign-in, exercise library, plans, workout mode, history). The remaining frontend libraries come with the feature that needs them ([4.11](04-frontend.md#411-known-limits)). Deployment is postponed: everything runs locally for now ([OPS-3](backlog.md#ops-3-deploy-to-the-free-server)).

---

## 0.2 Prerequisites

| Tool | Why | Check |
|---|---|---|
| **Docker Desktop** | Runs PHP, Composer, Postgres and Mailpit: **no PHP or Composer needed on your computer** | `docker --version` |
| **Node 24** with npm (the version in `.nvmrc`) | Runs the React app and Vite on your computer | `node --version` |
| **Git** | | `git --version` |
| **Make** | Runs the shortcuts of [0.8](#08-everyday-commands). Already on a Mac; on Windows it is a separate install, for example `choco install make` | `make --version` |

**On Windows, run every command from Git Bash** (it comes with Git; in VS Code, the arrow next to the terminal's **+**). The recipes of the `Makefile` need `bash`, `grep` and `cp`: from the Command Prompt or PowerShell, `make` stops with `"grep" is not recognized`, and `cp` may not exist either. A PHP or Composer already installed on the computer is simply not used: the project's PHP is the one in the container.

Git for Windows may check files out with Windows line endings (CRLF, `core.autocrlf`). It is harmless: the repository keeps LF, and the hook and every check of `make check` pass.

Docker Desktop needs free space on its virtual disk: when it is full, builds fail with misleading errors ([0.10](#010-troubleshooting)). `docker system df` shows the usage.

---

## 0.3 Git identity

A computer's global Git identity may be another one (on the work Mac it is the work identity). In this repository every commit uses the **personal GitHub identity** (the same as Chronovault) with GitHub's **noreply address**, so no real email ever enters the history and the repository can become public as it is ([3.1](03-conventions.md#31-git)).

On a **new clone**, before the first commit:

```sh
git config user.name "Alessandro"
git config user.email "32982604+alesssz@users.noreply.github.com"
git config core.hooksPath .githooks   # turns on the hook below
```

The hook [`.githooks/pre-commit`](../.githooks/pre-commit) refuses a commit whose author or committer has any other email. Check the identity in use with `git var GIT_AUTHOR_IDENT`.

On GitHub, **Settings → Emails → "Block command line pushes that expose my email"** adds a second guard on the server side.

---

## 0.4 Ports

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

## 0.5 First start: the Docker stack

**On a new clone of the project as it is now, one command does everything:** set the Git identity ([0.3](#03-git-identity)), then run `make setup` and `make doctor`. In order, `make setup`:

1. turns on the Git hook;
2. creates `backend/.env` from `backend/.env.example`, if missing: without it Laravel believes it is in production and `migrate` stops to ask for confirmation;
3. builds the image;
4. installs the Composer packages, before the stack starts: without `vendor/` the queue worker crashes and keeps restarting until they arrive;
5. generates Laravel's key, only if it is empty: replacing it would invalidate existing sessions;
6. starts the containers, installs the npm packages, creates the test database and runs the migrations.

It can be run again safely: what is already in place stays as it is.

The rest of this section and [0.6](#06-creating-the-laravel-backend) are how the project was created the first time, kept for reference. From the project folder:

```sh
docker compose build            # builds the backend image (a few minutes the first time)
docker compose up -d postgres mailpit
docker compose ps               # both should say "healthy"
```

The `backend` and `queue` services start only once the Laravel app exists ([0.6](#06-creating-the-laravel-backend)); before that they would stop at once, finding no `artisan` file.

---

## 0.6 Creating the Laravel backend

How the backend works once created, for a reader new to PHP and Laravel: [5. Backend](05-backend.md).

**How it works.** There is no need to go inside the container: commands are typed in your computer's terminal, from the project folder, and Docker runs them in the container. The container is a computer with PHP and Composer installed, working on your computer's `backend/` folder:

1. `docker compose run --rm backend <command>` starts a container from the `backend` image and runs the command in it.
2. Inside the container, `/app` **is** your computer's `./backend` folder (a bind mount in `compose.yaml`): what the command writes there appears on your computer at once, and what is edited in VS Code is seen at once by the container.
3. `--rm` deletes the container when the command ends; the files stay.

`run --rm` is for when the stack is stopped (as now, before Laravel exists); once it runs, `docker compose exec backend <command>` uses the container already started, which is faster ([0.8](#08-everyday-commands)).

For `create-project`, `./backend` must be empty (or missing: Docker creates it).

```sh
# 1. Create the Laravel app in ./backend
docker compose run --rm backend composer create-project laravel/laravel .

# 2. Start everything: Laravel answers at http://localhost:8500
docker compose up -d

# 3. Add the API layer: Sanctum and routes/api.php
docker compose exec backend php artisan install:api
```

The same can be done from inside the container, if preferred; it is equivalent, only longer:

```sh
docker compose run --rm backend bash      # a shell in the container, in /app
composer create-project laravel/laravel .
exit
```

A new Laravel app's `.env` points at SQLite: it does not matter here, because `compose.yaml` passes the Postgres settings as environment variables, and in Laravel those win over `.env`.

**The packages of [2.2](02-decisions.md#22-stack)**, each with its own install step (check the linked page for the current version):

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

**The photo and video table** of spatie/laravel-medialibrary, published and then run (published migrations get comments like ours, [3.2](03-conventions.md#32-code)):

```sh
docker compose exec backend php artisan vendor:publish \
  --provider="Spatie\MediaLibrary\MediaLibraryServiceProvider" --tag="medialibrary-migrations"
docker compose exec backend php artisan migrate
```

**Cookie login from the React app (Sanctum SPA mode)**, so the browser at `localhost:5673` is recognised:

- in `backend/bootstrap/app.php`, inside `withMiddleware`: `$middleware->statefulApi();`
- `SANCTUM_STATEFUL_DOMAINS=localhost:5673`, set in `compose.yaml` with the other environment variables.

**A separate database for the tests.** Tests run on `atleoplan_test`, in the same Postgres container, so `RefreshDatabase` never empties the development data:

- `docker/postgres/init/01-test-database.sql` creates it when the Postgres volume is new; on a volume that already exists, create it once by hand: `docker compose exec postgres psql -U atleoplan -c "CREATE DATABASE atleoplan_test OWNER atleoplan;"`
- `backend/phpunit.xml` points the tests at it. The variables set by `compose.yaml` are in `$_SERVER`, which Laravel reads first, so they are overridden with `<server>` entries as well as `<env force="true">`; `<env>` alone is not enough.
- `tests/Feature/TestDatabaseTest.php` fails if the tests are ever on another database.

---

## 0.7 Creating the React frontend

**No Docker here.** Unlike the backend, the frontend runs directly on your computer with its own Node and npm ([0.2](#02-prerequisites)), so the usual npm commands are used, with no `docker compose` in front. Why ([2.2](02-decisions.md#22-stack)):

- npm needs only Node, whose version is pinned in [`.nvmrc`](../.nvmrc) (`nvm use` picks it up).
- VS Code's TypeScript and ESLint read the types from `frontend/node_modules`, which must therefore be on your computer.
- Vite reloads pages faster when it reads the files from your computer's own disk.

Day to day this means two terminals: `docker compose up -d` for the backend, `npm run dev` in `frontend/` for React.

`npm create vite` asks a couple of questions: the proposed answers are fine.

```sh
# 1. Create the app in ./frontend (React + TypeScript template)
npm create vite@latest frontend -- --template react-ts

# 2. Install and start it
cd frontend
npm install
npm run dev
```

**Port and proxy.** In `frontend/vite.config.ts`, the dev server moves to 5673 ([0.4](#04-ports)) and forwards the backend's paths to Laravel. The browser then sees a single address, as it will in production behind Caddy ([2.6](02-decisions.md#26-hosting)), and Sanctum's cookies work without CORS:

```ts
export default defineConfig({
  plugins: [react()],
  server: {
    // Standard port + 500 (docs/00-setup.md 0.4); fail rather than pick another
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
```

The others of [2.2](02-decisions.md#22-stack) come with the feature that needs them:
- react-hook-form and zod with sign-in (FEAT-1);
- dnd-kit with the plan editor (FEAT-2);
- vite-plugin-pwa with workout mode (FEAT-3);
- Recharts with the progress charts (phase 2).

How the frontend is built and how to work on it: [4. Frontend](04-frontend.md).

---

## 0.8 Everyday commands

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

**Shortcuts: `make`.** The [`Makefile`](../Makefile) wraps the commands above, so they need not be typed in full; `make help` lists them all. The most used:

| What | Command |
|---|---|
| Is everything in order? Docker and its disk, Node, npm cache, Git identity and hook, packages, ports, test database; prints the fix for each problem | `make doctor` |
| New clone: hook, `backend/.env` and its key, image, packages, test database, migrations ([0.5](#05-first-start-the-docker-stack)) | `make setup` |
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
| Every check before a merge: Pint, tests, lint, types | `make check` (needs the stack up) |
| Known vulnerabilities in the packages (report only) | `make audit` |
| New branch from an up-to-date `main` | `make branch name=feat/plan-editor` |
| Back to `main`, up to date with GitHub | `make sync` |
| Push the current branch | `make push` |
| Merge the current branch into `main` | `make merge` ([3.1](03-conventions.md#31-git)) |

Values go in variables (`c=`, `s=`), because Make reads anything after the target as more targets.

---

## 0.9 Useful links

**Local**

| What | Address |
|---|---|
| Laravel | http://localhost:8500 |
| Filament admin (once installed) | http://localhost:8500/admin |
| React app (once created) | http://localhost:5673 |
| Mailpit | http://localhost:8525 |

**Documentation**

| Topic | Link |
|---|---|
| Laravel | https://laravel.com/docs |
| Sanctum, SPA authentication | https://laravel.com/docs/sanctum#spa-authentication |
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
| free-exercise-db (exercise data, [2.3](02-decisions.md#23-exercise-library)) | https://github.com/yuhonas/free-exercise-db |

---

## 0.10 Troubleshooting

| Symptom | Cause and fix |
|---|---|
| A build fails in `apt-get update` with **"At least one invalid signature was encountered"** | Docker Desktop's disk is full, not a signature problem. `docker system df` shows it; `docker builder prune -af` (build cache) and `docker image prune -af` (unused images) free space without touching data. |
| **"port is already allocated"** | Another project uses that port. Check with `lsof -nP -iTCP:8500 -sTCP:LISTEN` (on Windows, `netstat -ano \| grep :8500`); change it once with the variable of [0.4](#04-ports). |
| `make` stops with **`"grep" is not recognized`**, or **`cp`** is not recognized | The terminal is the Command Prompt or PowerShell: on Windows, use Git Bash ([0.2](#02-prerequisites)). |
| `migrate` says **"APPLICATION IN PRODUCTION"** on a new clone | `backend/.env` is missing, so Laravel assumes production. `make setup` creates it ([0.5](#05-first-start-the-docker-stack)). |
| `backend` or `queue` stops at once: **"Could not open input file: artisan"** | The Laravel app does not exist yet: [0.6](#06-creating-the-laravel-backend). |
| `create-project` says the **directory is not empty** | `./backend` must be empty: remove what is in it, hidden files included. |
| `composer require` fails with **"… is locked to version … and an update of this package was not requested"** | The new package needs other versions of packages already in `composer.lock`. Add `-W` (`--with-all-dependencies`) so Composer may update them too; try first with `--dry-run` to see what would change. |
| `queue` shows **unhealthy** | Fixed in `compose.yaml` (the image's healthcheck asks Caddy, which the worker does not run); recreate it with `docker compose up -d queue`. Whether the worker works is in `docker compose logs queue`. |
| `npm install` fails with **EACCES** and "Your cache folder contains root-owned files" (macOS, Linux) | An npm command once run with `sudo` left files in `~/.npm` owned by root. Give them back to the user: `sudo chown -R $(id -u):$(id -g) ~/.npm`. Never run npm with `sudo`. |
| Tests fail with **database "atleoplan_test" does not exist** | The Postgres volume predates the init script: `make test-db` creates it ([0.6](#06-creating-the-laravel-backend)). |
| Something odd, cause unknown | `make doctor` checks the usual suspects above and prints the fix for each. |
| A commit is **refused by pre-commit** | The identity is not the noreply one: [0.3](#03-git-identity). |
| A change to `dev.ini` or the `Dockerfile` has no effect | The image must be rebuilt: `docker compose build && docker compose up -d`. |
| The React app gets **401 / CSRF token mismatch** | The browser is not on `localhost:5673`, or Sanctum's SPA settings are missing: [0.6](#06-creating-the-laravel-backend). |

---

← [Contents](../README.md#documentation) · [1. UI design](01-ui-design.md) →
