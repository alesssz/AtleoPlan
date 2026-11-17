# S1. Setup

Getting AtleoPlan running locally: prerequisites, the port rule, the first start, how the two apps are configured, everyday commands, links and known problems. The decisions behind these choices are in [D2. Decisions](../design/D2-decisions.md); how work is done is in [P1. Conventions](../project/P1-conventions.md).

## Contents

- [S1.1 Where the project stands](#s11-where-the-project-stands)
- [S1.2 Prerequisites](#s12-prerequisites)
- [S1.3 Git identity](#s13-git-identity)
- [S1.4 Ports](#s14-ports)
- [S1.5 First start: the Docker stack](#s15-first-start-the-docker-stack)
- [S1.6 The backend's configuration](#s16-the-backends-configuration)
- [S1.7 The frontend on the host](#s17-the-frontend-on-the-host)
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

Both apps run locally; deployment is [OPS-3](../project/backlog.md#ops-3-deploy-to-the-free-server). What the app does is in the [README](../../README.md); what comes next in the [backlog](../project/backlog.md).

The development stack ([`Dockerfile`](../../Dockerfile), [`compose.yaml`](../../compose.yaml), [`docker/php/dev.ini`](../../docker/php/dev.ini)) has four services; the React app runs on the host ([S1.7](#s17-the-frontend-on-the-host)):

| Service | What it is |
|---|---|
| `backend` | Laravel on FrankenPHP (PHP 8.4 inside Caddy), with Composer, ffmpeg and the PHP extensions the app needs |
| `queue` | Same image, runs the queued jobs (the photos' converted copies) |
| `postgres` | PostgreSQL 18, data in the `postgres-data` volume |
| `mailpit` | Catches every email the app sends |

---

## S1.2 Prerequisites

| Tool | Why | Check |
|---|---|---|
| **Docker Desktop** | Runs PHP, Composer, Postgres and Mailpit: **no PHP or Composer on the host** | `docker --version` |
| **Node 24** with npm (the version in `.nvmrc`) | Runs the React app and Vite on the host | `node --version` |
| **Git** | | `git --version` |
| **Make** | Runs the shortcuts of [S1.8](#s18-everyday-commands). Preinstalled on macOS; on Windows a separate install, e.g. `choco install make` | `make --version` |

**On Windows, run every command from Git Bash.** The `Makefile`'s recipes need `bash`, `grep` and `cp`: from the Command Prompt or PowerShell, `make` stops with `"grep" is not recognized`. A PHP or Composer installed on the host is not used: the project's PHP is the container's.

Git for Windows may check files out with CRLF line endings (`core.autocrlf`). It is harmless: the repository keeps LF, and the hook and every check of `make check` pass.

Docker Desktop needs free space on its virtual disk: when it is full, builds fail with misleading errors ([S1.10](#s110-troubleshooting)). `docker system df` shows the usage.

---

## S1.3 Git identity

Every commit uses the maintainer's GitHub **noreply address**, so no real email enters the history of this public repository ([P1.1](../project/P1-conventions.md#p11-git), [P1.5](../project/P1-conventions.md#p15-a-public-repository)). A machine's global Git identity may be another one, so on a **new clone**, before the first commit:

```sh
git config user.name "Alessandro"
git config user.email "32982604+alesssz@users.noreply.github.com"
git config core.hooksPath .githooks   # also done by make setup
```

The hook [`.githooks/pre-commit`](../../.githooks/pre-commit) refuses a commit whose author or committer has any other email. `git var GIT_AUTHOR_IDENT` shows the identity in use. On GitHub, **Settings → Emails → "Block command line pushes that expose my email"** adds the same guard on the server side.

---

## S1.4 Ports

**Rule: on the host, each service uses its standard port + 500**, so it never clashes with other projects. Inside the containers the standard ports stay.

| Service | Standard | On the host | Variable to change it |
|---|---|---|---|
| Laravel (API, Filament admin) | 8000 | **8500** | `APP_PORT` |
| Postgres | 5432 | **5932** | `DB_FORWARD_PORT` |
| Mailpit (web UI) | 8025 | **8525** | `MAIL_UI_PORT` |
| Vite (React dev server) | 5173 | **5673** | `server.port` in `frontend/vite.config.ts` |

Mailpit's SMTP port (1025) is used inside Docker only. Every port is bound to `127.0.0.1`: reachable from the host, not from the network.

A new service follows the same rule. To use another port once: `APP_PORT=8600 docker compose up -d`.

---

## S1.5 First start: the Docker stack

**On a new clone:** set the Git identity ([S1.3](#s13-git-identity)), then `make setup` and `make doctor`. In order, `make setup`:

1. turns on the Git hook;
2. creates `backend/.env` from `backend/.env.example`, if missing: without it Laravel assumes production and `migrate` stops to ask for confirmation;
3. builds the image;
4. installs the Composer packages before the stack starts (without `vendor/` the queue worker crashes and restarts in a loop), into the `vendor` volume, then copied to `backend/vendor/` for the editor ([H2.10](../how-to/H2-backend.md#h210-adding-a-package));
5. generates Laravel's key, only if it is empty: replacing it would invalidate existing sessions;
6. starts the containers, installs the npm packages, creates the test database and runs the migrations;
7. fills the muscles and the equipment (`make reference-data`): the fixed lists every exercise points to ([D3.4.1](../design/D3-data-model.md#d341-muscles-and-equipment)), needed by the app and by the exercise import;
8. links `public/storage`, so the web server serves the photos at `/storage/…`.

It is idempotent: the seeders write with `updateOrCreate()`, and what is already in place stays as it is.

**Where the files live:**

| What | Where | Kind | Why there |
|---|---|---|---|
| The Laravel code, `backend/` | The host's folder, at `/app` in the container | Bind mount | Edited on the host, seen at once by Laravel |
| The Composer packages, as the app reads them | The `vendor` volume (`atleoplan_vendor`), at `/app/vendor` | Named volume | Read a thousand at a time on every request: ten times faster than through the shared folder ([D2.10](../design/D2-decisions.md#d210-local-development)) |
| The same packages, a copy for the editor | `backend/vendor/` on the host, at `/vendor-host` | Bind mount | So the editor resolves Laravel's classes; Composer refreshes it after every change, `make vendor` by hand |
| The database | The `postgres-data` volume | Named volume | Survives `make down`; `make down-v` deletes it |
| Composer's downloads | The `composer-cache` volume | Named volume | A package is downloaded once, even when the `vendor` volume is rebuilt |
| The frontend, `frontend/` with its `node_modules/` | The host only | — | Vite runs on the host, not in Docker |

`make down-v` deletes every volume, the packages' too: `make setup` puts them back.

**After a pull**, run `make setup` again: it brings the image, the packages and the database up to date. `make doctor` checks that the packages are installed, not that they are the latest.

**The exercise library.** On a new database, `make exercises-import` fills it ([H1.8](../how-to/H1-database.md#h18-the-exercise-librarys-data)). A library imported by an earlier version of the import is brought up to date with `make exercises-extra` (no "Frog stand" in it), `make exercises-correct` (Plank logged as reps) and `make exercises-thumbnails` (photo addresses ending in `.jpg`, not `-thumb.webp`; about 5 minutes).

**How to check:** `make psql`, then `select count(*) from muscles;` gives 17, and `select count(*) from equipment;` gives 12.

**The first account.** The database starts empty: register at http://localhost:5673/register, after `make dev`. For an admin, which also opens the panel at http://localhost:8500/admin (or Profile → Administration in the app), `make artisan c="db:seed"` creates `test@example.com`, password `password`; or make an existing account an admin, a Google one included ([C2.8](../concepts/C2-backend.md#c28-admin-panel-filament), [C2.8.4](../concepts/C2-backend.md#c284-the-way-in-a-link-and-google-on-the-panels-login)). Emails, such as "reset your password", appear in Mailpit, at http://localhost:8525.

---

## S1.6 The backend's configuration

How the backend is built: [C2. Backend](../concepts/C2-backend.md). What is set where, outside the application code:

- **Environment.** `compose.yaml` passes the development settings (database, mail, `FRONTEND_URL`, `SANCTUM_STATEFUL_DOMAINS`) as environment variables, which win over `backend/.env`. `backend/.env` holds the key and the secrets; `backend/.env.example` lists every variable with no secret.
- **Cookie sign-in from the React app (Sanctum SPA mode):** `$middleware->statefulApi()` in `backend/bootstrap/app.php`, and `SANCTUM_STATEFUL_DOMAINS=localhost:5673` in `compose.yaml`. The browser must be on exactly that host and port.
- **Fortify** ([C2.7](../concepts/C2-backend.md#c27-signing-in-sanctum)): `config/fortify.php` sets `prefix` to `api/auth`, `views` to `false`, and only the registration and password-reset features; the migrations and actions of the features that are off are not in the repository. `FRONTEND_URL` builds the links in emails.
- **A separate database for the tests.** Tests run on `atleoplan_test`, in the same Postgres container, so `RefreshDatabase` never empties the development data:
  - `docker/postgres/init/01-test-database.sql` creates it when the Postgres volume is new; on an older volume, `make test-db`;
  - `backend/phpunit.xml` points the tests at it. The variables set by `compose.yaml` are in `$_SERVER`, which Laravel reads first, so they are overridden with `<server>` entries as well as `<env force="true">`; `<env>` alone is not enough;
  - `tests/Feature/TestDatabaseTest.php` fails if the tests are ever on another database.

---

## S1.7 The frontend on the host

**No Docker here:** the frontend runs on the host with its own Node and npm ([S1.2](#s12-prerequisites)), so npm commands run in `frontend/` with no `docker compose` in front. Why ([D2.2](../design/D2-decisions.md#d22-stack)):

- npm needs only Node, pinned in [`.nvmrc`](../../.nvmrc) (`nvm use` picks it up);
- the editor's TypeScript and ESLint read the types from `frontend/node_modules`, which must be on the host;
- Vite reloads faster from the host's own disk.

`make start` brings up the stack, then Vite; `make up` and `make dev` do each half.

**Port and proxy** ([`frontend/vite.config.ts`](../../frontend/vite.config.ts)): the dev server listens on `127.0.0.1:5673` with `strictPort` ([S1.4](#s14-ports)) and forwards `/api`, `/sanctum`, `/storage` and `/auth/` to Laravel. The browser sees a single origin, as it will in production behind Caddy ([D2.6](../design/D2-decisions.md#d26-hosting)), so Sanctum's cookies work without CORS. The Filament admin is opened directly at http://localhost:8500/admin.

How the frontend is built: [C1. Frontend](../concepts/C1-frontend.md).

---

## S1.8 Everyday commands

Run from the repository root. Backend commands use `docker compose exec backend …`, or `docker compose run --rm backend …` while the stack is stopped.

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
| Fill the public exercise library (after a fresh database too) | `make exercises-import`: the first time it also clones free-exercise-db into `backend/storage/app/` ([H1.8](../how-to/H1-database.md#h18-the-exercise-librarys-data)) |
| Add the extra exercises (calisthenics) to a library imported before them | `make exercises-extra` ([H1.8](../how-to/H1-database.md#h18-the-exercise-librarys-data)) |
| Correct the logging types the import guessed wrong (Plank as time) in a library imported before the list | `make exercises-correct` ([H1.8](../how-to/H1-database.md#h18-the-exercise-librarys-data)) |
| Make the small and large copies of photos added before they existed | `make exercises-thumbnails` ([H1.8](../how-to/H1-database.md#h18-the-exercise-librarys-data)) |
| Example plans to look at (after the import) | `make plans-demo`: two plans for every user who has none ([H1.8](../how-to/H1-database.md#h18-the-exercise-librarys-data)) |
| Add a package (then copied to `backend/vendor/` for the editor) | `docker compose exec backend composer require <package>` |
| Copy the packages to `backend/vendor/` by hand | `make vendor` ([H2.10](../how-to/H2-backend.md#h210-adding-a-package)) |
| Interactive console | `docker compose exec backend php artisan tinker` |
| Tests (on the `atleoplan_test` database) | `docker compose exec backend php artisan test` |
| Format the code (Pint) | `docker compose exec backend vendor/bin/pint` |
| List the routes | `docker compose exec backend php artisan route:list` |

**Database**

| What | Command |
|---|---|
| SQL console | `docker compose exec postgres psql -U atleoplan` |
| From a database client ([H4](../how-to/H4-database-tools.md)) | host `localhost`, port `5932`, user, password and database `atleoplan` |

**Frontend** (in `frontend/`)

| What | Command |
|---|---|
| Dev server, http://localhost:5673 | `npm run dev` |
| Production build | `npm run build` |
| Tests | `npx vitest` |

**`make`.** The [`Makefile`](../../Makefile) wraps the commands above; `make help` lists every target. The most used:

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
| The repository's settings on GitHub and its last CI runs, against the ones decided (needs `gh`, signed in) | `make github-check` |
| New branch from an up-to-date `main` | `make branch name=feat/plan-editor` |
| Back to `main`, up to date with GitHub | `make sync` |
| Push the current branch | `make push` |
| Merge the current branch into `main` | `make merge` ([P1.1](../project/P1-conventions.md#p11-git)) |

Arguments go in variables (`c=`, `s=`, `f=`, `o=`): Make reads any other word after the target as another target.

---

## S1.9 Useful links

**Local**

| What | Address |
|---|---|
| Laravel API | http://localhost:8500/api/health |
| Filament admin | http://localhost:8500/admin |
| React app | http://localhost:5673 |
| Mailpit | http://localhost:8525 |
| Postgres, from a database client | `127.0.0.1:5932`, database, user and password `atleoplan` ([H4](../how-to/H4-database-tools.md)) |

**Documentation**

| Topic | Link |
|---|---|
| Sanctum, SPA authentication | https://laravel.com/docs/sanctum#spa-authentication |
| Fortify | https://laravel.com/docs/fortify |
| React Hook Form | https://react-hook-form.com |
| Zod | https://zod.dev |
| Filament | https://filamentphp.com/docs |
| spatie/laravel-medialibrary | https://spatie.be/docs/laravel-medialibrary |
| spatie/laravel-query-builder | https://spatie.be/docs/laravel-query-builder |
| Pest | https://pestphp.com/docs |
| FrankenPHP | https://frankenphp.dev/docs/ |
| TanStack Query | https://tanstack.com/query/latest/docs/framework/react/overview |
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
| `exercises:import` fails with **`Unknown equipment "barbell"`** or **`Unknown muscle`** for every exercise | The muscles and the equipment are missing, as on a database made with `make migrate` alone. `make reference-data`, then the import again; `make exercises-import` and `make setup` run it themselves ([S1.5](#s15-first-start-the-docker-stack)) |
| A new screen shows an error after a pull, or a table "does not exist" | The pull brought new migrations or packages: `make setup` ([S1.5](#s15-first-start-the-docker-stack)) |
| Every API call takes **1–2 seconds** on the local stack | Composer's packages are read through the folder shared with Docker's virtual machine. They belong in the `vendor` volume: `make setup`; `make doctor` says whether they are there ([H2.10](../how-to/H2-backend.md#h210-adding-a-package)) |
| Every request fails with **`vendor/autoload.php: Failed to open stream`** | The `vendor` volume is empty, as after `make down-v`: `make setup` |
| The editor does not know a package's classes | The copy in `backend/vendor/` is missing or old: `make vendor` ([H2.10](../how-to/H2-backend.md#h210-adding-a-package)) |
| **"port is already allocated"** | Another project uses that port. Check with `lsof -nP -iTCP:8500 -sTCP:LISTEN` (on Windows, `netstat -ano \| grep :8500`); change it once with the variable of [S1.4](#s14-ports). |
| `make` stops with **`"grep" is not recognized`**, or **`cp`** is not recognized | The terminal is the Command Prompt or PowerShell: on Windows, use Git Bash ([S1.2](#s12-prerequisites)). |
| `migrate` says **"APPLICATION IN PRODUCTION"** on a new clone | `backend/.env` is missing, so Laravel assumes production. `make setup` creates it ([S1.5](#s15-first-start-the-docker-stack)). |
| `composer require` fails with **"… is locked to version … and an update of this package was not requested"** | The new package needs other versions of packages already in `composer.lock`. Add `-W` (`--with-all-dependencies`) so Composer may update them too; try first with `--dry-run` to see what would change. |
| `make` stops with **`✖ Node 22, the project wants 24 (.nvmrc)`**; `npm test` run by hand fails with **`ERR_REQUIRE_ESM`** ("require() of ES Module … not supported") | The terminal's Node is not `.nvmrc`'s, often Homebrew's ahead of nvm's on the PATH. Every `make` target that runs npm refuses it: an older npm also rewrites `package-lock.json`, dropping the `libc` fields of the platform packages. `nvm use` in the repository root; `nvm alias default 24` for new terminals. `make doctor` checks it. |
| `npm install` fails with **EACCES** and "Your cache folder contains root-owned files" (macOS, Linux) | An npm command once run with `sudo` left files in `~/.npm` owned by root: `sudo chown -R $(id -u):$(id -g) ~/.npm`. Never run npm with `sudo`. |
| Tests fail with **database "atleoplan_test" does not exist** | The Postgres volume predates the init script: `make test-db` creates it ([S1.6](#s16-the-backends-configuration)). |
| Something odd, cause unknown | `make doctor` checks the usual suspects above and prints the fix for each. |
| A commit is **refused by pre-commit** | The identity is not the noreply one: [S1.3](#s13-git-identity). |
| A change to `dev.ini` or the `Dockerfile` has no effect | The image must be rebuilt: `docker compose build && docker compose up -d`. |
| The React app gets **401 / CSRF token mismatch** | The browser is not on `localhost:5673`, or Sanctum's SPA settings are missing: [S1.6](#s16-the-backends-configuration). |
| **`/admin` answers 403** | The account is not an admin: [C2.8](../concepts/C2-backend.md#c28-admin-panel-filament). |
| **http://localhost:5673/admin** shows nothing, or the app's "page not found" | The panel is not in the React app and Vite does not forward `/admin`: it is at http://localhost:8500/admin, or Profile → Administration ([C2.8.4](../concepts/C2-backend.md#c284-the-way-in-a-link-and-google-on-the-panels-login)). |
| The panel asks for a password, and the account was made with Google | **Continue with Google** under the panel's form. Or sign in to the app first, then open `localhost:8500/admin` with `localhost`, not `127.0.0.1`: the session cookie follows the host name ([C2.8.4](../concepts/C2-backend.md#c284-the-way-in-a-link-and-google-on-the-panels-login)). |
| The app shows **"Can't reach the server"** | The Docker stack is not running, or the server has an error: `make up`, then `make logs`. |
| **"Too many attempts"** when signing in | Five tries a minute for one email: wait a minute ([C2.7.4](../concepts/C2-backend.md#c274-slowing-down-password-guessing)). |
| A reset email's **link opens the wrong address** | `FRONTEND_URL` in `compose.yaml`; after changing it, `docker compose up -d`. |

---

## S1.11 Sign in with Google: the credentials

"Continue with Google" ([C2.7.8](../concepts/C2-backend.md#c278-signing-in-with-google)) needs an **OAuth client** in the Google Cloud Console: the app sends people to Google with the client's id, and Google sends them back only to the addresses listed in it. The client is made once, by the project's owner; each clone then needs its two values in `backend/.env`. Without them the rest of the app works, and the Google button fails with a logged warning.

### S1.11.1 The project

A Google Cloud project named `AtleoPlan` ([console.cloud.google.com](https://console.cloud.google.com), project picker → **New project**). Every step below happens inside it. No billing account is needed.

### S1.11.2 The consent screen

**APIs & Services → OAuth consent screen** (the **Google Auth Platform**):

- **App name** `AtleoPlan`; support and contact email: the owner's;
- **Audience: External** (Internal is only for Google Workspace organisations);
- **no logo**: a logo makes Google ask for a brand verification first;
- **Data access** stays empty: the app asks only for `openid`, `email` and `profile`, which need nothing added there.

### S1.11.3 The test users

**Audience → Test users**: the accounts allowed to sign in. The publishing status stays **Testing**, so anyone else gets "Access blocked"; publishing is S1.11.6.

### S1.11.4 The client, and its secret

**Clients → Create client**, type **Web application** (`AtleoPlan dev`):

- **Authorized JavaScript origins:** empty. The app goes to Google through the backend, not from JavaScript.
- **Authorized redirect URIs**, exactly:

  ```
  http://localhost:5673/auth/google/callback
  ```

  `http`, `localhost` (not `127.0.0.1`), Vite's port `5673` ([S1.4](#s14-ports)), no final `/`; anything else is `redirect_uri_mismatch`. The same address serves every developer machine, and a phone through `adb reverse` ([H3.8.2](../how-to/H3-frontend.md#h382-a-real-android-phone-over-usb)).

The **Client ID** ends in `.apps.googleusercontent.com`, the **Client secret** starts with `GOCSPX-`. Google shows a new client's secret only once: download the JSON and keep it outside the repository (a password manager). A lost secret is replaced from the client's page.

### S1.11.5 The two lines, on each computer

At the end of `backend/.env`:

```
GOOGLE_CLIENT_ID=…apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-…
```

- **Only these two.** The return address is built from `FRONTEND_URL` (set in `compose.yaml`), so it cannot drift from the one registered with Google.
- **Never committed:** `backend/.env` is ignored; `backend/.env.example` holds the names with empty values.
- **Then** `docker compose restart backend`.

To check that both are set without printing them: `docker compose exec backend grep -c '^GOOGLE_CLIENT_' .env` answers `2`.

### S1.11.6 Later, when deploying

With [OPS-3](../project/backlog.md#ops-3-deploy-to-the-free-server):

1. the client's **Authorized redirect URIs** get `https://<domain>/auth/google/callback`; the development one stays;
2. **Branding → Authorized domains**: the domain;
3. **Audience → Publish app**, so that anyone can sign in; with the basic scopes alone, Google asks for no review;
4. the production server's `.env` gets the same two lines.

### S1.11.7 When it does not work

| Google says | Why |
|---|---|
| `Error 400: redirect_uri_mismatch` | The address the app sent is not in the client's list, character for character: `localhost` against `127.0.0.1`, a `/` at the end, https, another port. The error's details show the address sent |
| "Access blocked: AtleoPlan has not completed the Google verification process" | The account is not among the test users (S1.11.3) |
| `Error 401: invalid_client` | A wrong or old id or secret in `backend/.env`, or the backend not restarted after writing them |
| `Error 401: deleted_client` | The client was deleted in the console: a new one (S1.11.4), new lines in every `backend/.env` |

**When the app says it** ("Signing in with Google didn't work", `/login?error=failed`), Laravel stopped before going to Google or after coming back. `make logs` says why: the two lines missing from `backend/.env`, a wrong secret (`invalid_client`), a return opened twice (`InvalidStateException`). More in [H2.11](../how-to/H2-backend.md#h211-finding-out-what-is-going-on).

---

[Contents](../README.md) · [D1. UI design](../design/D1-ui.md) →
