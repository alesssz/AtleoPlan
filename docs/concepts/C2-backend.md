# C2. Backend

The architecture of the Laravel API in `backend/`: its pieces, the path of a request, the conventions of each layer, and the decisions behind each feature's endpoints, the admin panel and the import commands. The shape of each common change is in [C2.12](#c212-recipes).

The code's comments follow [P1.2](../project/P1-conventions.md#p12-code): a header where a file's role is not obvious, and the reasons behind the code, not what it does. The choices behind the stack are in [D2.2](../design/D2-decisions.md#d22-stack); the setup in [S1.6](../start/S1-setup.md#s16-creating-the-laravel-backend); the React side in [C1. Frontend](C1-frontend.md).

## Contents

- [C2.1 The pieces](#c21-the-pieces)
- [C2.2 Code conventions](#c22-code-conventions)
- [C2.3 Folder structure](#c23-folder-structure)
- [C2.4 The life of a request](#c24-the-life-of-a-request)
- [C2.5 Routes and controllers](#c25-routes-and-controllers)
  - [C2.5.1 Permissions: policies](#c251-permissions-policies)
  - [C2.5.2 Lists: filters and pages](#c252-lists-filters-and-pages)
  - [C2.5.3 Actions: the work outside the controller](#c253-actions-the-work-outside-the-controller)
  - [C2.5.4 The exercise library's endpoints](#c254-the-exercise-librarys-endpoints)
  - [C2.5.5 The plans' endpoints](#c255-the-plans-endpoints)
  - [C2.5.6 Validating nested data](#c256-validating-nested-data)
  - [C2.5.8 A plan as a file](#c258-a-plan-as-a-file)
  - [C2.5.7 The workouts' endpoints](#c257-the-workouts-endpoints)
  - [C2.5.9 The photos of an exercise](#c259-the-photos-of-an-exercise)
- [C2.6 Database: migrations, models, factories, seeders](#c26-database-migrations-models-factories-seeders)
- [C2.7 Signing in: Sanctum](#c27-signing-in-sanctum)
  - [C2.7.1 How a session works](#c271-how-a-session-works)
  - [C2.7.2 Signing in and out](#c272-signing-in-and-out)
  - [C2.7.3 Signing up](#c273-signing-up)
  - [C2.7.4 Slowing down password guessing](#c274-slowing-down-password-guessing)
  - [C2.7.5 Forgot password](#c275-forgot-password)
  - [C2.7.6 Fortify or by hand](#c276-fortify-or-by-hand)
  - [C2.7.7 Messages in the user's language](#c277-messages-in-the-users-language)
  - [C2.7.8 Signing in with Google](#c278-signing-in-with-google)
  - [C2.7.9 A disabled account is signed out at once](#c279-a-disabled-account-is-signed-out-at-once)
- [C2.8 Admin panel: Filament](#c28-admin-panel-filament)
  - [C2.8.1 The panel's language](#c281-the-panels-language)
  - [C2.8.2 The exercise library screen](#c282-the-exercise-library-screen)
  - [C2.8.3 The users screen](#c283-the-users-screen)
  - [C2.8.4 The way in: a link, and Google on the panel's login](#c284-the-way-in-a-link-and-google-on-the-panels-login)
- [C2.9 Queues and jobs](#c29-queues-and-jobs)
- [C2.10 Configuration and .env](#c210-configuration-and-env)
- [C2.11 Tests with Pest](#c211-tests-with-pest)
- [C2.12 Recipes](#c212-recipes)
- [C2.13 Artisan and Composer commands](#c213-artisan-and-composer-commands)
- [C2.14 Artisan commands of our own](#c214-artisan-commands-of-our-own)
  - [C2.14.1 A command class](#c2141-a-command-class)
  - [C2.14.2 Testing a command](#c2142-testing-a-command)
  - [C2.14.3 The free-exercise-db import](#c2143-the-free-exercise-db-import)
  - [C2.14.4 The translation of the library](#c2144-the-translation-of-the-library)
  - [C2.14.5 The extra exercises](#c2145-the-extra-exercises)
  - [C2.14.6 The logging types corrected after the import](#c2146-the-logging-types-corrected-after-the-import)

---

## C2.1 The pieces

| Piece | Role | Where |
|---|---|---|
| **PHP 8.4, Laravel 13** | The API, the admin panel, the queue worker, the import commands | the `backend` and `queue` containers ([S1.2](../start/S1-setup.md#s12-prerequisites)) |
| **FrankenPHP** | Web server (Caddy with PHP built in) | the `backend` container, port 8500 |
| **PostgreSQL 18** | The database; `atleoplan` for development, `atleoplan_test` for tests | the `postgres` container |
| **Sanctum** | Session-cookie authentication for the SPA; API tokens later for the mobile app | [C2.7](#c27-signing-in-sanctum) |
| **Fortify** | The headless sign-up, sign-in and password-reset routes | `config/fortify.php`, [C2.7](#c27-signing-in-sanctum) |
| **Socialite** | Sign in with Google | [C2.7.8](#c278-signing-in-with-google) |
| **Filament 5** | The admin panel | `/admin` ([C2.8](#c28-admin-panel-filament)) |
| **spatie/laravel-translatable** | Translated columns as JSON | [C2.6](#c26-database-migrations-models-factories-seeders) |
| **spatie/laravel-medialibrary** | Exercise photos and their converted copies | [C2.5.9](#c259-the-photos-of-an-exercise) |
| **spatie/laravel-query-builder** | Whitelisted filters on list endpoints | [C2.5.2](#c252-lists-filters-and-pages) |
| **Pest** | Tests | `make test` ([C2.11](#c211-tests-with-pest)) |
| **Pint** | Code style, `laravel` preset | `make pint` |

---

## C2.2 Code conventions

- **Thin controllers.** A controller authorises through a policy, takes validated input from a Form Request, calls an action and returns an API Resource ([C2.5](#c25-routes-and-controllers)). Business rules live in `app/Actions/`, plain classes injected by the container and tested without HTTP.
- **Form Requests validate, policies authorise.** Requests have no `authorize()`; the controller calls `Gate::authorize()` itself, so the order (404, then 422, then 403) is the same everywhere.
- **Laravel 13's attributes over properties:** `#[Fillable]`, `#[Hidden]` and `#[Scope]` on models, `#[Signature]` and `#[Description]` on commands.
- **Enums for every closed list** (`app/Enums/`): logging types, set types, muscle roles, locales, themes, units. Columns cast to them, validation uses `Rule::enum()`, and the frontend keeps the same values in `as const` arrays.
- **Writes that belong together run in `DB::transaction()`.** Nested actions open their own, which Laravel turns into savepoints of the outer one ([C2.5.8](#c258-a-plan-as-a-file)).
- **Weights are exact.** `numeric(7,3)` columns, sent as strings (`"80.000"`), always in kilograms ([D3.2.3](../design/D3-data-model.md#d323-weights-are-always-in-kilograms)).
- **Moments are stored in UTC** and sent as ISO 8601 ([C2.5.7](#c257-the-workouts-endpoints)).
- **Messages are translated:** every validation key the app adds has its text in `lang/{en,it,es,de}/validation.php` ([C2.7.7](#c277-messages-in-the-users-language)).
- **`config()`, never `env()`,** outside `config/`: `env()` returns nothing once the configuration is cached.

---

## C2.3 Folder structure

```
backend/
├── app/                    the application's own code (namespace App\)
│   ├── Actions/              actions: one job of the app each, outside the controllers (C2.5.3)
│   │   ├── Exercises/          SavePersonalExercise, ImportFreeExercise, TranslateExercise
│   │   ├── Plans/              SavePlan: saves a whole plan (C2.5.5); ExportPlan, ImportPlan: a plan as a file (C2.5.8)
│   │   ├── Workouts/           SaveWorkoutSession, HomeSummary (C2.5.7)
│   │   └── Fortify/            what Fortify leaves to us: creating a user, setting a new password (C2.7)
│   ├── Console/Commands/     our own Artisan commands: exercises:import, exercises:translate (C2.14)
│   ├── Enums/                fixed lists of values: Locale, Theme, WeightUnit, LoggingType, MuscleRole, SetType (D3.2.4), ImportOutcome
│   ├── Http/
│   │   ├── Controllers/        receive a request, return an answer (C2.5)
│   │   ├── Middleware/         steps every request crosses: SetLocaleFromRequest (C2.7.7), SignOutDisabledAccount (C2.7.9), SetPanelLocale (C2.8.1)
│   │   ├── Requests/           Form Requests: the validation of an endpoint (C2.5)
│   │   └── Resources/          API Resources: the JSON shape of a model (C2.5)
│   ├── Models/               Eloquent models, one class per table: User, Muscle, Equipment, Exercise, ExerciseMuscle, Plan, PlanDay, PlanItem, PlanSet, WorkoutSession, SessionExercise, LoggedSet (C2.6)
│   ├── Policies/             who may do what to a row: ExercisePolicy, PlanPolicy, WorkoutSessionPolicy (C2.5.1)
│   ├── Rules/                validation rules of our own: SupersetsAreNeighbours (C2.5.6)
│   ├── Filament/Resources/   the admin panel's screens: Exercises, Users (C2.8)
│   └── Providers/            service providers: set things up when the app starts
│       └── Filament/           the admin panel's configuration (C2.8)
├── bootstrap/
│   ├── app.php               builds the application: routes, middleware, error handling (C2.4)
│   └── providers.php         the list of service providers to load
├── config/                 one PHP file per area (database, mail, queue…), reading .env (C2.10)
├── database/
│   ├── migrations/           the history of the database's structure (C2.6)
│   ├── factories/            fake records for tests and seeders
│   └── seeders/              code that fills the database with starting data
├── lang/                   messages in each language: validation, sign-in, emails (C2.7.7)
├── public/                 the only folder the web server exposes
│   └── index.php             every request enters here (C2.4)
├── resources/views/        Blade HTML templates: only Laravel's welcome page (React draws the app)
├── routes/
│   ├── api.php               the JSON API for the React app, under /api (C2.5)
│   ├── web.php               HTML pages; only the welcome page at /
│   └── console.php           scheduled tasks and small custom Artisan commands
├── storage/                files written while running: logs, uploads, caches (never committed)
├── tests/                  Pest tests: Feature/ (through HTTP), Unit/ (single classes) (C2.11)
├── vendor/                 packages installed by Composer: never edited, never committed; a copy for the editor, the app reads a Docker volume (C2.4)
├── artisan                 the Artisan command-line tool
├── composer.json / .lock   the PHP packages, like package.json / package-lock.json
├── phpunit.xml             test settings: the test database, mail and queue for tests
└── .env / .env.example     settings and secrets of this machine / the template of every variable
```

**Unused skeleton files.** `backend/package.json` and `backend/vite.config.js` are Laravel's asset pipeline for Blade pages. The interface is the React app in `frontend/`, and Filament ships its own compiled assets.

---

## C2.4 The life of a request

```
Browser ─▶ Vite :5673 (Caddy in production) ─▶ FrankenPHP :8500 ─▶ public/index.php ─▶ bootstrap/app.php
         ─▶ middleware: session and CSRF (statefulApi), Accept-Language, disabled accounts, auth:sanctum
         ─▶ route ─▶ Form Request ─▶ controller (policy, action) ─▶ API Resource ─▶ JSON
```

- **`bootstrap/app.php`** registers the routes, turns on Sanctum's `statefulApi()`, appends `SetLocaleFromRequest` and `SignOutDisabledAccount` to the `web` and `api` groups (the second placed before authentication in the priority list, [C2.7.9](#c279-a-disabled-account-is-signed-out-at-once)), and renders every exception under `/api/*` as JSON.
- **One origin.** The React app and the API share an address, so the session cookie works without CORS ([D2.6](../design/D2-decisions.md#d26-hosting)).
- **Errors** are logged to `storage/logs/laravel.log`; with `APP_DEBUG` on, an API error's JSON carries the trace.

**`vendor/` in a Docker volume.** Docker Desktop runs Linux in a virtual machine; a bind-mounted folder makes every OPcache revalidation (about a thousand files per request, 96% of them packages) cross from one system to the other, which cost over a second per request after a pause. `compose.yaml` therefore puts `vendor/` in a named volume on the virtual machine's own disk: the app's code stays bind-mounted and live, the packages are read at native speed, and `backend/vendor/` on the computer is a copy for the editor, refreshed after every Composer change ([D2.10](../design/D2-decisions.md#d210-local-development)).

---

## C2.5 Routes and controllers

All of `routes/api.php` but `/health` sits behind `auth:sanctum`; `routes/web.php` holds only the Google sign-in routes (they need the session) and Laravel's welcome page. `make routes` lists them.

**The shape of an endpoint** ([P1.2](../project/P1-conventions.md#p12-code)): a policy (`Gate::authorize()`), a Form Request, an action, an API Resource. Three controllers show the range:

- **`ExerciseController`**: a filtered, paginated list with permissions per row (C2.5.1–C2.5.4);
- **`PlanController`**: a whole tree saved in one request, with optimistic versioning ([C2.5.5](#c255-the-plans-endpoints), [C2.5.6](#c256-validating-nested-data));
- **`WorkoutSessionController`**: idempotent writes from a phone that may be offline ([C2.5.7](#c257-the-workouts-endpoints)).

### C2.5.1 Permissions: policies

| Action | `ExercisePolicy` says yes when |
|---|---|
| `view` | The exercise is public, or mine |
| `create` | Always: a new exercise is always personal |
| `update`, `delete` | It is mine. A public one is refused, to admins too: they edit public exercises in the admin panel, whose screen has rules of its own ([C2.8.2](#c282-the-exercise-library-screen)) |

**A list does not ask row by row.** It uses a query scope with the same rule as `view`, in SQL: `Exercise::visibleTo($user)` ([C2.6](#c26-database-migrations-models-factories-seeders)). The two must agree, and the tests check both.

**403, not 404, for someone else's exercise:** exercise ids are sequential and their existence is not a secret. Plans and workouts, with UUIDs, answer 403 the same way.

### C2.5.2 Lists: filters and pages

The library's list uses spatie/laravel-query-builder, which applies only the `filter[...]` parameters it is told to accept:

```
GET /api/exercises?filter[search]=panca&filter[muscle]=chest,triceps&page=2
```

```php
QueryBuilder::for(Exercise::visibleTo($request->user()))      // the starting query
    ->allowedFilters(
        AllowedFilter::scope('search')->delimiter(''),         // filter[search] → the scope search()
        AllowedFilter::scope('muscle', 'withPrimaryMuscle'),   // filter[muscle] → withPrimaryMuscle()
    )
    ->with(['equipment', 'muscles'])                           // the relations, loaded once for the page
    ->orderByName()                                            // another scope
    ->paginate(50);                                            // one page, read from ?page=
```

- **Only listed filters work.** Any other name (`filter[owner_id]=…`) gets a 400, so a request cannot filter on a column we did not mean to expose.
- **Commas split a value** into several scope arguments (`chest,triceps`); a search must not be split, hence `delimiter('')`.
- **The values** are checked by a Form Request (`ListExercisesRequest`): 422 for `filter[source]=everyone` or `per_page=500`.
- **Pagination** is Laravel's (`data`, `links`, `meta`), with `withQueryString()` keeping the filters in the links.

**No N+1.** Relations are eager-loaded for the page, and Resources read them with `whenLoaded()`: a forgotten `with()` shows up as a missing key, not as a slow page.

### C2.5.3 Actions: the work outside the controller

An **action** is a plain class in `app/Actions/` that does one job of the app, such as `SavePersonalExercise`. The controller receives it by method injection:

```php
public function store(StoreExerciseRequest $request, SavePersonalExercise $save): ExerciseResource
{
    Gate::authorize('create', Exercise::class);
    $exercise = $save->create($request->user(), $request->validated());

    return new ExerciseResource($exercise->load(['equipment', 'muscles']));
}
```

Actions are tested directly, without HTTP (`SavePersonalExerciseTest.php`), and reused by other callers: `ImportPlan` uses `SavePersonalExercise` and `SavePlan`, the Artisan commands use the import actions. Each wraps its writes in a transaction.

### C2.5.4 The exercise library's endpoints

The library's API, all under `auth:sanctum` ([D1.4.3](../design/D1-ui.md#d143-exercise-library)–[D1.4.5](../design/D1-ui.md#d145-exercise-editor)). Texts arrive and leave in the request's language (`Accept-Language`, [C2.7.7](#c277-messages-in-the-users-language)).

| Method and path | What it does | Answers |
|---|---|---|
| `GET /api/muscles` | The 17 muscle groups, sorted by name | 200 |
| `GET /api/equipment` | The 12 kinds of equipment, sorted by name | 200 |
| `GET /api/exercises` | Public exercises and mine, sorted by name, 50 per page. Filters: `filter[search]` (name and aliases), `filter[muscle]` (primary muscles, slugs separated by commas), `filter[equipment]` (slugs), `filter[source]` (`mine` or `public`); `page`, `per_page` (up to 100) | 200; 422 for a wrong value; 400 for an unknown filter |
| `GET /api/exercises/{id}` | One exercise | 200; 403 someone else's; 404 |
| `POST /api/exercises` | Creates a personal exercise | 201; 422 |
| `PATCH /api/exercises/{id}` | Changes mine, only the fields sent | 200; 403 public or someone else's; 422 |
| `DELETE /api/exercises/{id}` | Deletes mine (soft delete) | 204; 403 |

**An exercise in JSON**, as `ExerciseResource` sends it:

```json
{
  "id": 3,
  "name": "Panca piana con bilanciere",
  "aliases": [],
  "description": null,
  "instructions": [],
  "logging_type": "weight_reps",
  "youtube_url": null,
  "is_mine": false,
  "equipment": { "id": 1, "slug": "barbell", "name": "Bilanciere" },
  "muscles": [
    { "id": 6, "slug": "chest", "name": "Petto", "role": "primary" },
    { "id": 17, "slug": "triceps", "name": "Tricipiti", "role": "secondary" }
  ],
  "photos": [
    { "id": 1, "url": "/storage/1/conversions/0-large.webp", "thumb_url": "/storage/1/conversions/0-thumb.webp" },
    { "id": 2, "url": "/storage/2/conversions/1-large.webp", "thumb_url": "/storage/2/conversions/1-thumb.webp" }
  ]
}
```

**Photos are paths, not full URLs.** medialibrary builds URLs from `APP_URL`, which inside the container is not the address the browser uses. `ExercisePhotoResource` sends only the path (`/storage/1/conversions/0-large.webp`), which works wherever the React app is served, since its server forwards `/storage` to Laravel, and keeps the photos on the app's origin for the offline cache. `public/storage` is the `storage:link` symlink, created by `make setup`. `media` is eager-loaded with the other relations.

**What is sent to create or change one** (`StoreExerciseRequest`): `name` (required, up to 100 characters), `aliases` and `instructions` (lists of texts), `description`, `logging_type`, `equipment_id`, `youtube_url` (a YouTube address), and `muscles`, a list of `{ "id": 6, "role": "primary" }`. A change sends only the fields that change. `muscles`, when sent, is the complete list: muscles left out are removed.

**One language per personal exercise** ([D2.4](../design/D2-decisions.md#d24-languages)). The texts are stored under the request's language and replace any other: an exercise written in Italian, then edited with the app in English, becomes English. Otherwise the old Italian name would come back on switching the app to Italian again.

Each photo has two addresses, a large and a small copy; uploading, ordering and removing them, and Duplicate as mine: [C2.5.9](#c259-the-photos-of-an-exercise).

### C2.5.5 The plans' endpoints

The workout plans' API ([D1.4.6](../design/D1-ui.md#d146-plan-list)–[D1.4.8](../design/D1-ui.md#d148-plan-editor)). A plan is only ever seen by its owner (`PlanPolicy`).

| Method and path | What it does | Answers |
|---|---|---|
| `GET /api/plans` | My plans in use: the active one first, then the most recently changed, each with `days_count` and `last_used_at` (the start of its latest finished workout, or `null`; a `withMax()` subquery). `?archived=1`: the archived ones instead | 200; 422 for a wrong `archived` |
| `GET /api/plans/{id}` | One whole plan: days, exercises, sets | 200; 403 someone else's; 404, also for an id that is not a UUID |
| `POST /api/plans` | Creates a whole plan | 201; 200 when the same id is sent again; 422 |
| `PUT /api/plans/{id}` | Saves the whole plan again | 200, with `meta.changed_elsewhere`; 403; 422 |
| `DELETE /api/plans/{id}` | Deletes it, with its days, exercises and sets | 204; 403 |
| `POST /api/plans/{id}/activate` | Makes it the active plan, replacing the one before | 200; 403 someone else's or archived |
| `POST /api/plans/{id}/archive` | Archives it; if it was the active plan, there is none any more | 200; 403 |
| `POST /api/plans/{id}/unarchive` | Brings it back to the list, not active | 200; 403 |
| `GET /api/plans/{id}/export` | The plan as a file's content ([C2.5.8](#c258-a-plan-as-a-file)) | 200; 403 |
| `POST /api/plans/import` | A plan file as a new plan, with `meta.created_exercises` | 201; 422 not a plan file |

**State changes as routes of their own.** Activating and archiving are `POST` to a verb after the plan's address, not `PATCH {"archived": true}`, which would mix them into the whole-plan save and its rules.

**A whole plan in JSON**, as `PlanResource` sends it:

```json
{
  "id": "0192f4a7-3c1e-7d2a-9b4f-8e6a1c5d3f20",
  "name": "Push Pull Legs",
  "goal": "Ipertrofia",
  "notes": null,
  "version": 1,
  "is_active": false,
  "archived_at": null,
  "updated_at": "2026-11-07T09:11:10.000000Z",
  "days": [
    {
      "id": "0192f4a7-3c1e-7d2a-9b4f-8e6a1c5d3f21",
      "name": "Giorno A – Spinta",
      "items": [
        {
          "id": "0192f4a7-3c1e-7d2a-9b4f-8e6a1c5d3f22",
          "exercise_id": 47,
          "superset_group": null,
          "rest_seconds": 120,
          "notes": null,
          "exercise": { "id": 47, "name": "Barbell Bench Press - Medium Grip", "…": "as in C2.5.4" },
          "sets": [
            { "set_type": "warm_up", "target_reps_min": 10, "target_reps_max": 10, "target_weight_kg": "40.000", "target_rpe": null, "target_duration_seconds": null, "target_distance_meters": null },
            { "set_type": "normal", "target_reps_min": 8, "target_reps_max": 10, "target_weight_kg": "80.000", "target_rpe": null, "target_duration_seconds": null, "target_distance_meters": null }
          ]
        }
      ]
    }
  ]
}
```

- **The list** sends the same keys, without `days` and with `days_count`: one resource class, and `whenLoaded()` and `whenCounted()` decide.
- **No `position`:** the order of each list is the order of the rows.
- **`exercise`** is the library's JSON ([C2.5.4](#c254-the-exercise-librarys-endpoints)), also for an exercise deleted after it was put in the plan: `PlanItem::exercise()` reads deleted ones too ([D3.11](../design/D3-data-model.md#d311-traps-to-avoid)).
- **Weights and RPE are text** (`"40.000"`, `"8.5"`), exact, as `weight_step` on the user; the app sends numbers back. Always in kilograms ([D3.2.3](../design/D3-data-model.md#d323-weights-are-always-in-kilograms)).
- **The whole plan costs 8 queries**, whatever its size: the plan itself, then one per relation loaded by `$plan->load([...])` (days, items, sets, exercises, and the exercises' equipment, muscles and photos). A test checks that a plan of 20 exercises costs as many as a plan of one.

**What the editor sends** to create or save: the same tree, without the `exercise` objects, `is_active` and the dates. Each item has `exercise_id`, each set a required `set_type`; on `PUT`, the body also has `version`, the version the editor started from. [C2.5.6](#c256-validating-nested-data) has the rules.

**The flow of a save.** What happens to `PUT /api/plans/{id}`, in order:

```
PUT /api/plans/0192…f20  { version: 3, name, days: [ … ] }
│
├─ auth:sanctum ............ signed in? otherwise 401
├─ route model binding ..... the Plan with this UUID; otherwise 404
├─ UpdatePlanRequest ....... the whole tree valid? otherwise 422, one message per field
├─ Gate::authorize('update') my plan? otherwise 403
└─ SavePlan::update(), in one transaction
   ├─ read the version, locking the row ........ 4 > 3: changed elsewhere
   ├─ the plan's fields, version 5
   ├─ days and items: matched by UUID .......... updated, created, or (not sent) deleted
   ├─ sets: all deleted, all written again ..... 2 queries
   └─ commit, or nothing at all
→ 200 { data: the plan as it is now, meta: { changed_elsewhere: true } }
```

Four ideas are behind it:

- **The body is the whole plan.** The editor holds the plan as a draft and sends all of it when saving ([D3.5.6](../design/D3-data-model.md#d356-saving-a-plan)). There is no endpoint per day or per set: one request, one transaction, and the server never holds half a change. Days and items left out are deleted, and a field left out is emptied.
- **Days and items keep their UUIDs; sets do not.** Workouts point to days and items, so a save updates them in place, by id, and an item can even move to another day. Nothing points to a set, so the sets are deleted and inserted again.
- **The version.** `SavePlan` reads it with `lockForUpdate()` (`select … for update`), so two saves of the same plan arriving together cannot both read 4. When the editor started from an older version, the save still goes through (the last change wins) and `meta.changed_elsewhere` tells the app to warn ([D3.5.7](../design/D3-data-model.md#d357-when-a-plan-is-changed-in-two-places)).
- **A create can be sent twice.** The ids are UUIDs made on the device ([D3.2.1](../design/D3-data-model.md#d321-which-kind-of-id)). If the answer to `POST` is lost and the device sends it again, the controller finds a plan of this user with that id and answers 200 with it, writing nothing. The same id on someone else's plan is a 422.

**The active plan** is `users.active_plan_id`, one cell, so two plans can never be active at once ([D3.3](../design/D3-data-model.md#d33-users-and-preferences)). `activate` sets it with `$user->activePlan()->associate($plan)->save()`; `PlanPolicy::activate()` checks what the column cannot: that the plan is mine and not archived. Archiving the active plan empties it, and deleting it empties it by itself, through the foreign key's `nullOnDelete()`.

**What is not checked:** that a set's targets fit how the exercise is logged (a weight on a timed plank, say). The editor shows only the fields that make sense, and a stray value does no harm.

### C2.5.6 Validating nested data

A plan arrives as a tree, validated at every level with `.*`:

```php
'days' => ['present', 'array', 'max:14'],
'days.*.name' => ['required', 'string', 'max:50'],                          // every day's name
'days.*.items.*.exercise_id' => ['required', 'integer', /* … */],            // every item of every day
'days.*.items.*.sets.*.set_type' => ['required', Rule::enum(SetType::class)], // every set
```

An error names the exact place: `days.0.items.2.sets.1.target_reps_max`, and the message names the field by its entry in `lang/*/validation.php`, `days.*.items.*.sets.*.target_reps_max` → "ripetizioni massime".

The tools used in `PlanRequest`, each for a reason:

| Rule | Does | Used for |
|---|---|---|
| `present` | The key must be there, even as `[]` | `days`, `items`, `sets`: a forgotten key must not read as "delete them all" |
| `distinct` | No value twice, across the whole body | `days.*.items.*.id`: the same id in two different days is refused |
| `required_with:other` | Required when the other field is there | The reps: both or neither |
| `gte:other` | At least the other field's value | `target_reps_max` ≥ `target_reps_min`. A `*` in `other` means "of this same set" |
| `decimal:0,3` | At most three decimals | Kilograms, stored as `numeric(7,3)` |
| `Rule::exists(…)->where(fn …)` | The row exists, with extra conditions | An exercise that is public or mine. The function's conditions are wrapped in parentheses, so its `or` cannot leak out |
| `Rule::unique(…)->whereNot(…)` | No row has this value, leaving some rows out | A day's id: not used by another plan, but this plan's own days do not count |
| A class of our own | Any check | Supersets (below) |

**One abstract request for two endpoints.** `StorePlanRequest` and `UpdatePlanRequest` share the tree's rules through the abstract `PlanRequest`, which leaves `planId()` to them: the plan in the URL for an update, the id sent for a create.

**A rule of our own:** `SupersetsAreNeighbours` on `days.*.items` ("the exercises of a superset are next to each other, and there are at least two"), with a translated message (`$fail('validation.superset_neighbours')->translate()`).

**Three traps of nested validation:**

- **`unique` and `exists` are skipped once an earlier rule of the field has failed.** A day id `"day-1"` fails `uuid`, and Laravel does not run the `unique` query, which Postgres would answer with an error ("invalid input syntax for type uuid"), not with a "no". The order of the rules is what matters: `uuid` before `unique`.
- **`validated()` keeps a list only through its items' validated fields.** A set sent as `{}` has no field with a rule, so the list `sets: [{}]` vanished from the validated data. Hence `set_type` is required.
- **An id checked against "this plan" trusts what "this plan" is.** On a create, the days' ids are checked against the plan with the id sent; if that id is someone else's, the request is refused on `id` anyway.


### C2.5.8 A plan as a file

Export and import ([D3.5.8](../design/D3-data-model.md#d358-the-plan-file)): two endpoints of `PlanController`, an action each, `ExportPlan` and `ImportPlan` (`app/Actions/Plans/`), and a Form Request, `ImportPlanRequest`.

**Export answers plain JSON,** `response()->json($export->export($plan))`, not a resource: the file has its own shape, with no `data` around it, and is sent back as it is. `ExportPlan` walks days and items, gives each exercise a reference the first time it meets it (`??=`), and lists the exercises once each at the end.

**Import reuses what saves plans and exercises.** `ImportPlan` finds or creates each exercise used, with `SavePersonalExercise` for the missing ones, then hands the plan to `SavePlan::create()` in the editor's own shape, with the references turned into exercise ids. All inside one `DB::transaction()`: the two actions open their own, which Laravel turns into savepoints of the outer one, so a failure anywhere undoes everything.

**The rules are the editor's,** under `plan.`: the static `PlanRequest::itemRules($prefix)` gives the rules of an item and its sets for any prefix, `'days.*.items.*.'` in the editor, `'plan.days.*.items.*.'` here. An item names `"exercise": "e1"`, checked with `Rule::in($refs)`, the references the file declares, read from the body before validation (`$this->input('exercises')`).

**Answered with a status set by hand.** A resource answers 201 only when it wraps a model it saw being created; here the plan was created inside the action, so `->response()->setStatusCode(201)`.

### C2.5.7 The workouts' endpoints

The server side of workout mode, history and Home ([D1.4.2](../design/D1-ui.md#d142-home), [D1.4.9](../design/D1-ui.md#d149-workout-mode)), on the tables of [D3.6](../design/D3-data-model.md#d36-workouts).

| Method and path | What it does | Answers |
|---|---|---|
| `PUT /api/sessions/{uuid}` | Saves a whole workout, new or not | 201 new; 200 saved again; 410 deleted elsewhere; 403 someone else's; 422 |
| `GET /api/sessions` | My workouts, the most recent first, 20 per page, each with its totals. `?status=open` or `finished` | 200; 422 |
| `GET /api/sessions/{uuid}` | One whole workout: exercises, sets, totals; in `meta.last_sets`, last time for each of its exercises, before it | 200; 403; 404, also when deleted |
| `DELETE /api/sessions/{uuid}` | Deletes it, softly | 204; 403 |
| `GET /api/sessions/last-sets?exercises=12,40` | For each exercise, the sets of the last finished workout in which it was done | 200; 422 |
| `GET /api/home` | Home in one request: the active plan's days with an estimated duration, the suggested day, the day done last, the workout left open, the finished workouts of the last 8 days | 200 |

**Why a `PUT` to the session's own address, and no `POST`.** The phone makes the session's UUID when Start is tapped, possibly offline ([D3.2.1](../design/D3-data-model.md#d321-which-kind-of-id)). `PUT` to that address creates it the first time (201) and replaces it after (200): idempotent, so the phone's queue can resend after a lost answer without making a second workout. `{session}` is not loaded by route model binding, since there may be no row yet; `whereUuid('session')` on the route answers 404 to anything that is not a UUID.

**The flow of a save**, `SaveWorkoutSession`, in one transaction ([D3.6.5](../design/D3-data-model.md#d365-sending-a-session-to-the-server)):

```
PUT /api/sessions/0192…f30  { started_at, finished_at, exercises: [ { sets: [ … ] } ] }
│
├─ SaveSessionRequest ........... the shape, the ids, the values that fit each exercise; 422 otherwise
└─ SaveWorkoutSession
   ├─ find the UUID, deleted ones included
   │   ├─ someone else's ........ 403
   │   ├─ deleted ............... nothing written → 410 Gone: the phone stops resending
   │   └─ unknown ............... a new session of this user
   ├─ the plan, its day, each item: kept if still the user's, emptied otherwise
   ├─ moments turned into UTC
   ├─ exercises and sets matched by UUID; those not sent are deleted
   └─ commit
→ 201 or 200 { data: the whole session }
```

- **A workout is never refused because a plan changed.** The phone may have trained offline while the plan was edited or deleted on the laptop. The request checks only the format of `plan_id`, `plan_day_id` and `plan_item_id`; the action keeps the links that still exist and belong to the user, empties the others, and the session keeps the names it copied ("Push Pull Legs · Day A"). Someone else's plan id is emptied the same way, so it reveals nothing.
- **A deleted session stays deleted.** Its row stays, soft-deleted ([D3.7.3](../design/D3-data-model.md#d373-deleting-a-session-a-soft-delete)), so a late send finds it and answers **410 Gone**, which the phone's queue reads as done.
- **Exercises and sets are a whole list each, as for a plan.** An exercise taken out or a set unticked on the phone is simply not sent, and its row is deleted. Unlike a plan's sets, a logged set has a UUID made on the phone and is updated in place.
- **The values fit how the exercise is logged** ([D3.6.3](../design/D3-data-model.md#d363-logged_sets)): reps for `weight_reps` and `reps`, each with a weight that may be left empty (a set with the body alone; the added weight of a weighted pull-up) and seconds that may be given (the time of reps done as fast as possible), a time or a distance. Two constants of `SaveSessionRequest` say it, `REQUIRED_BY_LOGGING` and `OPTIONAL_BY_LOGGING`; any other value field must be empty. The rule spans two tables, which a check constraint cannot see, so the Form Request checks it in `after()`.
- **Moments are converted to UTC before saving.** The phone sends `2026-11-09T18:00:00+01:00`, and Laravel writes a date as `Y-m-d H:i:s` without the offset: unconverted, it would be stored as 18:00 UTC, an hour late.

**Totals, worked out by the database** ([D3.8](../design/D3-data-model.md#d38-computed-never-stored)). The list, a whole session and Home's recent workouts carry `exercises_done`, `sets_done`, `reps_done` and `volume_kg` (weight × reps), warm-ups excluded. The screens show reps, not `volume_kg`: a workout's volume adds up unlike exercises and counts nothing done with the body alone ([D2.8](../design/D2-decisions.md#d28-workout-rules)); it stays in the answer, exact, for later uses per exercise. The scope `WorkoutSession::withTotals()` adds them as subqueries of the `SELECT`, so a page of 20 sessions is still one query, and the sum is exact. The resource sends them with `whenHas()`, only when the query added them. `volume_kg` is text with three decimals, like every weight.

**Last time** (`last-sets`, and `meta.last_sets` of a whole workout): for each exercise, the sets of the last finished, not deleted workout of this user in which it had at least one set, in any plan ([D3.6.4](../design/D3-data-model.md#d364-how-the-screens-use-these-tables)). One action, `FindLastSets`, serves both: `last-sets` asks for the latest of all, for workout mode's "Last" column; a whole workout asks for those **before it** (`$before`), for history's comparison exercise by exercise, so a workout opened weeks later is compared with what came before *it*. Two queries for any number of exercises; the first uses Postgres's `distinct on (exercise_id, timed)`, which keeps the first row of each exercise and kind among rows sorted newest first. **The kind** is whether one of the sets has seconds: an exercise counted in reps and done as fast as possible ("50 in 1:12", a plan item's `for_time`) has its own last time, apart from the days it was done for reps ([D3.6.4](../design/D3-data-model.md#d364-how-the-screens-use-these-tables)). `distinct on` must repeat the first expressions of `order by`, so the kind, an `exists (…)` subquery, is written in both.

**Home** (`HomeSummary`), with Day A done yesterday:

```json
{
  "active_plan": { "id": "01a1…802", "name": "Push Pull Legs", "is_active": true, "days_count": 3, "…": "…" },
  "days": [
    { "id": "01a1…cdd", "name": "Day A – Push", "exercises": 5, "estimated_minutes": 36 },
    { "id": "01a1…856", "name": "Day B – Pull", "exercises": 5, "estimated_minutes": 41 },
    { "id": "01a1…027", "name": "Day C – Legs", "exercises": 5, "estimated_minutes": 42 }
  ],
  "suggested_day_id": "01a1…856",
  "last_day": { "id": "01a1…cdd", "name": "Day A – Push", "finished_at": "2026-11-06T19:02:00.000000Z" },
  "open_session": null,
  "recent_sessions": [
    { "id": "0192…f30", "day_name": "Day A – Push", "exercises_done": 1, "sets_done": 1, "volume_kg": "640.000", "…": "…" }
  ]
}
```

- **The suggested day** is `Plan::suggestedDay()`: the day after the last one done in a finished, not deleted workout of the plan, back to the first after the last; the first day when nothing was done yet, or when the last day done was deleted ([D2.8](../design/D2-decisions.md#d28-workout-rules)).
- **The estimate** counts, for each planned set, 40 seconds of work plus its exercise's rest (the user's default when none). An estimate, never stored.
- **The week** is the app's to work out: the recent workouts cover the last 8 days, enough for this week in any time zone, and the phone groups them by its own Monday ([D3.2.5](../design/D3-data-model.md#d325-times)).

### C2.5.9 The photos of an exercise

[D2.5](../design/D2-decisions.md#d25-photos-and-videos), [D1.4.5](../design/D1-ui.md#d145-exercise-editor): the photos of personal exercises, uploaded from the app; their smaller copies; Duplicate as mine. The public exercises' photos are managed in the admin panel ([C2.8.2](#c282-the-exercise-library-screen)).

**Storage.** spatie/laravel-medialibrary, collection `photos` (the first is the cover), on the `public` disk (`storage/app/public/<media id>/`), served at `/storage/…`. Conversions are queued, so an upload answers at once and the `queue` container makes the copies a moment later.

**The two copies** (`Exercise::registerMediaConversions()`):

| Conversion | Size | For |
|---|---|---|
| `thumb` | At most 400 × 400 px, WebP | The lists' 40–56 px squares and workout mode's 80 px one, sharp on a dense screen |
| `large` | At most 1600 × 1600 px, WebP | The exercise's page |

`Fit::Max` keeps the proportions and never enlarges: a 1200 × 900 photo gets a 400 × 300 thumb, an 850 px one a `large` of 850 px. The original stays on the disk ([D2.5](../design/D2-decisions.md#d25-photos-and-videos)).

**The JSON of a photo** (`ExercisePhotoResource`): `id`, `url` (the `large` copy) and `thumb_url`. Until the job has made a copy, its address is the original's: the photo shows at once, heavier for a few seconds. The answer of an upload is always that case, since the job runs after it.

**The endpoints**, only on the user's own exercises (`ExercisePolicy::update()`; a public one is a 403):

| Route | Body | Answer |
|---|---|---|
| `POST /api/exercises/{id}/photos` | A multipart form, field `photo` | 201, the photo |
| `PUT /api/exercises/{id}/photos` | `{ "ids": [14, 12, 13] }`, every photo once, the cover first | 200, the photos in order |
| `DELETE /api/exercises/{id}/photos/{photo}` | | 204; 404 for a photo of another exercise |
| `POST /api/exercises/{id}/duplicate` | | 201, the copy (`ExercisePolicy::duplicate()`: public exercises only) |

**The rules** (`StoreExercisePhotoRequest`, `ReorderExercisePhotosRequest`, the action `ExercisePhotos`):

| Rule | Message (422 on the field) |
|---|---|
| `File::image()->types(['jpg', 'jpeg', 'png', 'webp'])->max(10 * 1024)`: an image by its content, of these types, at most 10 MB (`max` is in kilobytes) | Laravel's `image`, `mimes`, `max.file` |
| At most 5 photos, checked in `after()` | `validation.too_many_photos` |
| The order lists exactly the exercise's photos (`present`, not `required`: an empty list is the right order for an exercise with none) | `validation.photo_order` |

The file's name becomes `photo.<extension>` (`usingFileName()`): the phone's `IMG_4032.JPG` says nothing, and the extension is guessed from the content. `Media::setNewOrder($ids)` writes the order; `$media->delete()` removes the row and its files.

**Duplicate as mine** (`DuplicateExercise`): a new exercise owned by the user, with the texts in the request's language only (falling back to English), as every personal exercise ([D2.4](../design/D2-decisions.md#d24-languages)); the logging type, the equipment, the video link, the muscles with their roles; and the photos, each copied as a new file with `$media->copy($copy, 'photos')`, so the copy keeps them whatever happens to the public exercise. Not the import's columns.

**Many photos at once.** The `queue` container runs `queue:listen`, which starts Laravel again for every job: fine for a photo, slow for the 1,746 of the import. `QUEUE_CONVERSIONS_BY_DEFAULT=false` makes the conversions run inside the command instead; the Makefile's `ARTISAN_NOW` sets it, and `make exercises-import` and `make exercises-thumbnails` use it. `make exercises-thumbnails` runs `media-library:regenerate --only-missing`: the copies of photos added before they existed; 5 minutes for the 1,746 imported photos.

**The library's image tool is GD**, built into the Docker image (`install-php-extensions gd`): it reads JPEG, PNG and WebP and writes WebP, not HEIC (D2.5).

---

## C2.6 Database: migrations, models, factories, seeders

The tables, their columns and ids, and what happens on delete are in [D3. Data model](../design/D3-data-model.md); the recipe for a new table in [H1](../how-to/H1-database.md).

**Migrations.**
- **Never edited once run;** a change is a new migration.
- **Columns whose meaning or constraint is not obvious carry a comment,** and constraints the rules depend on live in the database too (check constraints on set values and feelings, foreign keys with explicit `cascadeOnDelete()` / `nullOnDelete()` / `restrictOnDelete()`).
- **A migration that fills a new column** writes through the `DB` facade, never the model: the model keeps changing, and an old migration that uses it could behave differently on a fresh database (`2026_11_10_093058_add_search_text_to_exercises_table`).

**Models.**
- **Mass assignment** is closed by `#[Fillable]`: `is_admin`, `disabled_at` and `active_plan_id` are not fillable, so no request can set them.
- **Defaults in `$attributes`** mirror the table's: a model just created does not read the database's defaults back (`Exercise`).
- **Relations** used beyond the obvious: `Exercise::muscles()` through a pivot class (`ExerciseMuscle`) so `role` casts to `MuscleRole`; `Plan::items()` as `hasManyThrough` the days; ordered relations (`orderBy('position')`) so eager loading keeps the order; `PlanItem::exercise()` and `SessionExercise::exercise()` with `withTrashed()`, so a deleted exercise still shows in plans and history ([D3.11](../design/D3-data-model.md#d311-traps-to-avoid)).
- **Scopes** (`#[Scope]`) carry the query rules: `Exercise::visibleTo()`, `search()`, `withPrimaryMuscle()`, `usingEquipment()`, `fromSource()`, `orderByName()`; `WorkoutSession::withTotals()`. An `or` always goes inside a `where(fn …)` closure, so it cannot leak into the conditions chained after it.

| Trait | On | Why |
|---|---|---|
| `HasUuids` | plans, plan days, plan items, workouts and their rows (not `plan_sets`) | Ids made on the device are kept; Laravel makes a UUIDv7 only when the id is empty ([D3.2.1](../design/D3-data-model.md#d321-which-kind-of-id)) |
| `SoftDeletes` | exercises, workout sessions | Plans and history keep pointing to them ([D3.7](../design/D3-data-model.md#d37-what-happens-on-delete)) |
| `HasTranslations` | exercises, muscles, equipment | One JSON value per language; falls back to English, then to any language, set once in `AppServiceProvider` ([D3.4.5](../design/D3-data-model.md#d345-translations)) |
| `InteractsWithMedia` | exercises | The photos ([C2.5.9](#c259-the-photos-of-an-exercise)) |

**Model events.** `Exercise::booted()` rewrites `search_text` on `saving`, so every writer (API, admin panel, import, factories) keeps it right ([D3.4.6](../design/D3-data-model.md#d346-searching)). Mass updates (`Exercise::where(…)->update(…)`) and `DB::table()` bypass events, and must not touch the searchable columns.

**Seeders and imports.** Seeders hold only what the app needs to run (the 17 muscles, the 12 kinds of equipment) and the development account. The public exercise library is an Artisan command, not a seeder: it reads an outside dataset, takes options and reports failures ([C2.14](#c214-artisan-commands-of-our-own)). `DemoPlanSeeder` (`make plans-demo`) gives development users two example plans.

---

## C2.7 Signing in: Sanctum

**Fortify** handles the moments that change who is signed in: signing up, in and out, resetting a password. **Sanctum** recognises the signed-in user on every request after that. Signing in with Google is a third way in, with **Socialite** and two routes of our own ([C2.7.8](#c278-signing-in-with-google)); after it, Sanctum sees a session like any other. The React side is in [C1.13](C1-frontend.md#c113-signing-in-and-forms).

### C2.7.1 How a session works

Sessions are stored in the `sessions` table, identified by the `atleoplan-session` cookie. Three protections work together:

| What | Stops | How |
|---|---|---|
| **`HttpOnly` cookie** | Malicious code injected in the page stealing the session | JavaScript cannot read this cookie |
| **CSRF token** | Another website making the user's browser send a request | Cookies travel by themselves, even for a request started by another site. So each request that changes something must also carry a token in a header. The token is in the `XSRF-TOKEN` cookie, which only pages on our own address can read |
| **Rate limit** | Guessing passwords | [C2.7.4](#c274-slowing-down-password-guessing) |

**What Sanctum does.** On every `/api` request, the middleware turned on by `statefulApi()` in `bootstrap/app.php` checks that the browser is on an address listed in `SANCTUM_STATEFUL_DOMAINS` (`localhost:5673`, set in `compose.yaml`). It then starts the session, checks the CSRF token, and `auth:sanctum` lets the request through, or answers 401.

**The whole journey of signing in:**

```
Browser (localhost:5673)                        Laravel, through Vite's proxy
  │
  ├─ GET /sanctum/csrf-cookie ───────────────▶  sets the XSRF-TOKEN cookie
  │
  ├─ POST /api/auth/login ───────────────────▶  checks the CSRF token, the rate limit,
  │    { email, password, remember }            the password; starts the session
  │    X-XSRF-TOKEN: …                     ◀──  200, sets atleoplan-session
  │
  └─ GET /api/user ──────────────────────────▶  auth:sanctum reads the session
                                           ◀──  { "data": { "name": "Ann", … } }
```

**Why cookies and not tokens for the web app:** a token kept in JavaScript can be stolen by injected code, and an `HttpOnly` cookie cannot. It works because the React app and the API share one origin ([D2.6](../design/D2-decisions.md#d26-hosting)).

**The mobile app (phase 3)** will use **API tokens** sent in a header (`Authorization: Bearer …`) instead, with the `HasApiTokens` trait on the `User` model; their table, `personal_access_tokens`, already exists.

**Where the routes are.** Fortify's are under `/api/auth` (`prefix` in `config/fortify.php`): `/login` is a React page, and the proxy forwards `/api` to Laravel ([C1.1](C1-frontend.md#c11-the-pieces)).

| Method and path | What it does | Answers |
|---|---|---|
| `POST /api/auth/register` | Signs up, then signs in | 201 |
| `POST /api/auth/login` | Signs in | 200; 422 if refused; 429 after too many tries |
| `POST /api/auth/logout` | Signs out | 204 |
| `POST /api/auth/forgot-password` | Sends the email | 200; 422 if the email is unknown |
| `POST /api/auth/reset-password` | Sets the new password | 200; 422 if the token is wrong |
| `GET /api/user` (ours) | Who is signed in | 200; 401 for a visitor |
| `GET /auth/google/redirect` (ours, a browser visit) | Off to Google ([C2.7.8](#c278-signing-in-with-google)) | 302 to Google |
| `GET /auth/google/callback` (ours, a browser visit) | Back from Google: signs in, links or creates the user | 302 into the app, or to `/login?error=…` |
| `PATCH /api/user/preferences` (ours) | Saves the language, the theme, one of the five workout preferences (unit, default rest 0–600 s, weight step 0.25–50 with two decimals at most, timer sound, vibration) or the plan editor's `show_rpe`; only the fields sent | 204; 422 if not valid |

### C2.7.2 Signing in and out

The route and the controller are Fortify's. `app/Providers/FortifyServiceProvider.php` supplies the credential check, because this app also refuses disabled accounts:

```php
Fortify::authenticateUsing(function (Request $request) {
    $user = User::where('email', $request->input('email'))->first();

    if (! $user || ! Hash::check((string) $request->input('password'), $user->password)) {
        return null;                       // Fortify answers 422 with auth.failed
    }

    // Only someone who knows the password learns that the account is disabled
    if ($user->disabled_at !== null) {
        throw ValidationException::withMessages(['email' => __('auth.disabled')]);
    }

    return $user;                          // Fortify signs this user in
});
```

- **A wrong password and an unknown email get the same message,** so the form does not reveal who has an account.
- **Emails are lowercased** before any lookup (`lowercase_usernames` in `config/fortify.php`): Postgres compares text exactly.
- **The session id is regenerated** after signing in, against session fixation.

### C2.7.3 Signing up

`app/Actions/Fortify/CreateNewUser.php` holds what is specific to this app: the fields and the account's starting language. Fortify calls it, signs the new user in, and answers 201.

```php
public function create(array $input): User
{
    Validator::make($input, [
        'name' => ['required', 'string', 'max:255'],
        'email' => ['required', 'string', 'email', 'max:255', Rule::unique(User::class)],
        'password' => $this->passwordRules(),
        'locale' => ['sometimes', Rule::enum(Locale::class)],
    ])->validate();

    return User::create([
        'name' => $input['name'],
        'email' => $input['email'],
        'password' => Hash::make($input['password']),
        'locale' => $input['locale'] ?? app()->getLocale(),
    ]);
}
```

### C2.7.4 Slowing down password guessing

5 attempts a minute for one email from one IP address, then 429. Defined in `FortifyServiceProvider`, named in `config/fortify.php`:

```php
RateLimiter::for('login', function (Request $request) {
    $throttleKey = Str::transliterate(Str::lower((string) $request->input('email')).'|'.$request->ip());

    return Limit::perMinute(5)->by($throttleKey);
});
```

The key is the email *and* the IP address, so an attacker cannot lock someone out by trying their email from elsewhere.

### C2.7.5 Forgot password

Two requests joined by an email: asking stores a hashed token and emails a link; the link opens the React screen `/reset-password`, which sends the token, the email and the new password. A token works once and expires after 60 minutes. Both controllers are Fortify's; the app provides two things:

- **What to do with the new password,** in `app/Actions/Fortify/ResetUserPassword.php`.
- **Where the link points:** the React app, not a Laravel route that does not exist. In `FortifyServiceProvider`:

```php
ResetPassword::createUrlUsing(fn (User $user, string $token): string => sprintf(
    '%s/reset-password?token=%s&email=%s',
    config('app.frontend_url'),            // FRONTEND_URL (C2.10)
    $token,
    urlencode($user->email),               // keeps a + in an address intact
));
```

**Known limit:** an unknown email gets a 422, so this form reveals who has an account, as signing up also does. It is noted in [BE-3](../project/backlog.md#be-3-harden-the-public-sign-in-routes), to deal with before the app opens to the public.

### C2.7.6 Fortify or by hand

Writing the five controller methods by hand is short; the difference is in who answers for the details:

| | With Fortify | By hand |
|---|---|---|
| **We write** | `CreateNewUser`, `ResetUserPassword`, the password check, the rate limit, the reset link | All of the above, the five controller methods and their routes |
| **Session id renewed after signing in** | Done | One line to remember |
| **Emails in lowercase, everywhere** | One setting | In each of the four methods; forgetting one means a user who cannot sign in |
| **"Remember me" tokens, reset events** | Done | Written and maintained by us |
| **Security fixes** | Arrive with `composer update` | Ours to notice and apply |
| **Later: two-factor, email verification** | One line in `features` | A project of its own |
| **Seeing the code** | In `vendor/laravel/fortify`, one more thing to read | All in our files |
| **Changing the behaviour** | Limited to what it offers, though `authenticateUsing` and response classes cover a lot | Anything |

**Why Fortify here:** these are the parts where a small mistake is a security hole, and nothing about them is specific to a workout app. What is specific, the disabled accounts, the language and the link to React, fits in the places Fortify leaves open. By hand would be the better choice if signing in had to work in an unusual way, such as signing in with a code from a club's card.

**Set aside:** Laravel Breeze and Jetstream, which generate screens of their own (Blade, Inertia); our screens are in React. Laravel Passport, an OAuth server, is more than this needs ([D2.2](../design/D2-decisions.md#d22-stack)).

**Only the features in use are installed.** The migrations for two-factor and passkeys and the actions for changing profile and password, published by `fortify:install`, were removed with those features off in `config/fortify.php`: no empty columns or unused code.

### C2.7.7 Messages in the user's language

Laravel's messages are read with `__('auth.failed')`, from the files in `lang/`. Our languages ([D2.4](../design/D2-decisions.md#d24-languages)):

| File | Holds |
|---|---|
| `lang/{it,es,de}/auth.php`, `passwords.php` | Signing in and resetting a password |
| `lang/{it,es,de}/validation.php` | Validation errors, for the rules the app uses so far, and the names of the fields |
| `lang/{it,es,de}.json` | The sentences of the password email, whose keys are the English text |
| `lang/en/auth.php`, `validation.php` | Only what we added: the disabled account's message, and the English names of fields such as `muscles.*.role`. English comes with Laravel, and our files are merged over its own, key by key |

**Which language each message uses:**

- **A message answering a request** uses the language the request asks for. The React app sets `Accept-Language` on every call, and the middleware `app/Http/Middleware/SetLocaleFromRequest.php` applies it.
- **An email** uses the language of the account, because it may be read much later, on another device. `User` implements `HasLocalePreference`, and Laravel asks it before writing the email.

**A new validation rule** in a Form Request adds its message to the three `validation.php` files; `tests/Feature/Auth/LanguageTest.php` lists the keys it checks. A rule without a translation shows its English message.

**A field inside a list** is named with `*` in `attributes`: `'muscles.*.role' => 'ruolo del muscolo'`. Without it, the message would read "Il campo muscles.0.role è obbligatorio".

### C2.7.8 Signing in with Google

"Continue with Google" ([D1.4.1](../design/D1-ui.md#d141-sign-in-and-onboarding)) is OAuth through **Laravel Socialite**; what to do with Google's answer is ours, in `app/Actions/Auth/SignInWithSocialAccount.php`. The table: [D3.3.1](../design/D3-data-model.md#d331-social_accounts).

**The journey** is made of browser visits, not `fetch()` calls:

```
Browser                         Laravel (through Vite, /auth/…)         Google
  │
  ├─ GET /auth/google/redirect?locale=it&from=/plans ─▶
  │                               keeps from and locale in the session;
  │                               Socialite keeps a random `state` there too
  │  ◀── 302 to accounts.google.com?client_id=…&redirect_uri=…&state=…&scope=openid profile email
  │
  ├─ the account chooser, the consent ─────────────────────────────────────▶
  │  ◀── 302 to /auth/google/callback?code=…&state=… ─────────────────────
  │
  ├─ GET /auth/google/callback?code=…&state=… ─▶
  │                               state = the session's? (else: refused)
  │                               code + client secret ──────────────────▶
  │                                                 ◀── who: sub, email, email_verified, name
  │                               find, link or create the user;
  │                               Auth::login(), session regenerated
  │  ◀── 302 to /plans (or /login?error=…)
  │
  └─ the React app loads, GET /api/user finds the session, as after any reload
```

**What each piece guards against:**

| Piece | Stops |
|---|---|
| **`state`**, random, kept in the session and checked on return | A callback started on another site, which would sign the victim into the attacker's account. Socialite does it; it needs the session, which is why the routes are in `web.php` |
| **The client secret**, sent by Laravel only, never seen by the browser | Anyone else swapping a `code` for the person's details |
| **Redirect URIs** listed in the Google client ([S1.11.4](../start/S1-setup.md#s1114-the-client-and-its-secret)) | Google sending the `code` to any other address |
| **`email_verified`** required before using the address | Someone making a Google account with another person's address (possible with addresses that are not Gmail) and entering their AtleoPlan account |
| **`from` accepted only as a path** (`/plans`, never `//site` or `https://…`) | An "open redirect": a link that signs in and then lands on a lookalike site |
| **`session()->regenerate()`** after `Auth::login()` | Session fixation, as for a password ([C2.7.2](#c272-signing-in-and-out)) |

**Who signs in: the three cases**, in this order:

1. **The Google account is linked** (a row in `social_accounts` with its `sub`): that user. By the id, not the address, which a person can change on Google's side.
2. **The address belongs to an account** made with a password: Google is linked to it, its plans kept. Refusing and asking for the password instead would be safer by a hair and clumsier for every user; `email_verified` is what makes linking safe.
3. **A new address:** a new account, no password, the language the app was showing.

Cases 2 and 3 need `email_verified`. A disabled account is refused in all three, before anything is linked.

**Started from the admin panel** (`?to=admin`), the same journey ends on the panel, or back on its login page with the error ([C2.8.4](#c284-the-way-in-a-link-and-google-on-the-panels-login)).

**Errors go back to the React app as a code,** `/login?error=cancelled|failed|unverified|disabled` (`app/Enums/SocialSignInError.php`): a redirect cannot carry a JSON body. The action throws `SocialSignInRefused` with the reason, so its checks can stop it from anywhere without an `if` at every level; the controller catches it. Anything unexpected (Google unreachable, a wrong secret, a stale `state`) is `failed`, with the details in the log through `report()`.

**An account without a password.** `users.password` is nullable: someone who signed up with Google has none. `Hash::check()` never matches an empty hash, so the password form refuses them like a wrong password; Forgot password sets one, and both ways then work.

**Not with Fortify.** Fortify has no social sign-in; the two routes are ours and use the same session and guard (`web`), so to Sanctum a user signed in with Google looks exactly like one signed in with a password. Socialite's drivers make Apple, later, a configuration rather than a rewrite.

### C2.7.9 A disabled account is signed out at once

An admin disables an account in the panel ([C2.8.3](#c283-the-users-screen)), which fills `users.disabled_at`. Signing in is refused to such an account, with a password (`FortifyServiceProvider`) and with Google (C2.7.8); but someone **already signed in** keeps a valid session cookie, and with "remember me" would stay in for weeks.

**The middleware `SignOutDisabledAccount`** (`app/Http/Middleware/`) runs on every request of the `web` and `api` groups. When the session's user has `disabled_at` set, it signs them out, with the same three steps as signing out (C2.7.2), and lets the request go on as a visitor's:

| The request | What happens next |
|---|---|
| A route behind `auth:sanctum` (almost all of `/api`) | 401. The React app reads a 401 as "the session has ended" and opens the sign-in page (`frontend/src/lib/query-client.ts`); signing in again says "This account has been disabled." |
| A public route (`/api/health`, the sign-in routes) | Answered as for any visitor |
| The admin panel | Not concerned: `canAccessPanel()` already refuses a disabled admin at every request |

**It must run before authentication.** Laravel sorts a route's middleware by a priority list, whatever order the groups add them in, and a middleware not in the list runs after all those in it: merely appended, this one would run after `auth:sanctum` had already let the user in. `bootstrap/app.php` puts it in the list, right before authentication:

```php
$middleware->web(append: [SignOutDisabledAccount::class]);
$middleware->api(append: [SignOutDisabledAccount::class]);
$middleware->prependToPriorityList(AuthenticatesRequests::class, SignOutDisabledAccount::class);
```

The order a route really gets is shown in tinker by `app('router')->gatherRouteMiddleware($route)`.

**Why a middleware and not deleting the sessions.** Sessions live in the `sessions` table, and their rows have a `user_id`: deleting the user's rows at Disable would sign them out too. But the middleware also covers a session that is not in that table (a test's, or another driver's), needs nothing to happen at Disable, and holds whatever sets the column, tinker or TablePlus included.

---

## C2.8 Admin panel: Filament

- **The panel** is configured in `app/Providers/Filament/AdminPanelProvider.php`: path `/admin`, login page, colours, render hooks. Laravel serves it directly, not through the React app.
- **Two resources:** the public exercise library ([C2.8.2](#c282-the-exercise-library-screen)) and the users ([C2.8.3](#c283-the-users-screen)), in `app/Filament/Resources/<Name>/`.
- **Only admins enter,** in every environment. The `User` model implements `FilamentUser`, and its `canAccessPanel()` checks `is_admin` and that the account is not disabled. Anyone else gets a 403 ([D3.3](../design/D3-data-model.md#d33-users-and-preferences)).
- **Getting there:** http://localhost:8500/admin in development, or **Profile → Administration → Open** in the app, for an admin; an admin with no password signs in with Google ([C2.8.4](#c284-the-way-in-a-link-and-google-on-the-panels-login)).
- **Getting an admin in development.** `make artisan c="db:seed"` creates `test@example.com`, password `password`, an admin. To make an existing account an admin: `make tinker`, then `User::where('email', 'you@example.com')->update(['is_admin' => true]);`. `make artisan c="make:filament-user"` creates a user, but not an admin, so it needs the same step.
- **The session is shared with the React app:** both use the `web` guard, and cookies are per host, whatever the port. Signing in on one signs in on the other.

### C2.8.1 The panel's language

The panel speaks the admin's language, the one they chose in the app (`users.locale`); on its login page, before anyone is known, the browser's. Filament's own texts (Save, Search, the filters' menus) come translated with the package. Ours, the labels of fields, columns, filters and actions, are in **`lang/<language>/admin.php`**, one file per language with the same keys, read with `__('admin.exercises.name')`; `trans_choice()` picks a sentence by number ("1 photo", "3 photos").

The middleware `SetPanelLocale` sets the language, listed in the panel's own middleware as **persistent**:

```php
->middleware([SetPanelLocale::class], isPersistent: true)
```

A Filament page is a Livewire component: after the first load, each interaction is a request to `/livewire/update`, which crosses only the middleware marked persistent. Without `isPersistent`, the page would load in Italian and come back in English at the first filter.

**Labels as methods** (`getModelLabel()`, `getNavigationLabel()`), not properties: a property's value is fixed when the class is loaded, before the middleware has set the language.

### C2.8.2 The exercise library screen

`/admin/exercises`, `app/Filament/Resources/Exercises/`: the public library, to correct, translate and review it ([D1.4.15](../design/D1-ui.md#d1415-admin-panel-filament)).

| File | What it holds |
|---|---|
| `ExerciseResource.php` | The model, the menu, the pages, the queries and the permissions |
| `Tables/ExercisesTable.php` | The list: first photo, name, equipment, primary muscles, logging type, languages to review; search; filters |
| `Schemas/ExerciseForm.php` | The form: one tab per language, then the exercise's data, its photos and its source |
| `Pages/ListExercises.php`, `CreateExercise.php`, `EditExercise.php` | The pages; the last two hand the form to the action |
| `app/Actions/Exercises/SavePublicExercise.php` | The rules of saving, tested without Filament |

**Public exercises only.** `getEloquentQuery()` adds `whereNull('owner_id')` to every list, and `getRecordRouteBindingEloquentQuery()` to the edit page's URL: `/admin/exercises/<a personal one>/edit` is a 404. A user's personal exercises are theirs; the panel never shows them.

**Its own permissions.** Filament asks the model's policy before each action, when the policy has the method. `ExercisePolicy::update()` and `delete()` refuse public exercises to everyone, admins included, because the API must: through the React app's editor, an admin would rewrite a public exercise in one language. The panel is already for admins only, so the resource answers for itself, overriding `getAuthorizationResponse()`: everything on a public exercise, nothing on a personal one, and never `forceDelete` (plans and workouts point to exercises: [D3.7.2](../design/D3-data-model.md#d372-deleting-an-exercise-a-soft-delete)). The alternative, a second set of abilities in the policy (`adminUpdate`…), would keep every rule in one file at the cost of a policy that mixes two audiences.

**The list reuses the model's scopes.** The search box calls `Exercise::search()`, so "panca" finds "Panca piana" with the panel in English, aliases included ([D3.4.6](../design/D3-data-model.md#d346-searching)); the default order is `orderByName()`; the muscle filter is `withPrimaryMuscle()`. The filters:

| Filter | Shows |
|---|---|
| Equipment, Primary muscles, Logged as | As in the app's library |
| To review in | The exercises whose Italian, Spanish or German is still machine translated: `whereJsonContains('machine_translated', 'it')` |
| Source | free-exercise-db, our extras (`AtleoPlan_…`), or created in the panel (no `external_id`) |
| Deleted | Without, with, or only the deleted ones; a deleted exercise opens and has Restore |

**The form, one tab per language.** A plain `TextInput::make('name')` on a translated column would edit only the current language. Each tab's fields sit in a `Group` with `statePath('translations.it')`, so the form's state holds every language apart:

```php
Tab::make('Italiano')->schema([
    Group::make([
        TextInput::make('name'),                    // → translations.it.name
        TagsInput::make('aliases'),                 // a list of words
        Textarea::make('description'),
        Repeater::make('instructions')->simple(Textarea::make('step')),   // a list of steps, reorderable
        Toggle::make('reviewed'),                   // not on English
    ])->statePath('translations.it'),
    Section::make('English original')->collapsed(), // to compare, on the edit page
]),
```

The edit page fills the form with `SavePublicExercise::formState()` and saves through `SavePublicExercise::update()`, in place of Filament's own `fill()` and `save()` of the model's columns (`mutateFormDataBeforeFill()`, `handleRecordUpdate()`; `handleRecordCreation()` on the create page).

**The rules of saving** (`SavePublicExercise`):

| Rule | Why |
|---|---|
| Each language written as the tab shows it; a language left empty loses its text | The form is the whole truth. `replaceTranslations()`, not `setTranslation()`, which would keep the emptied language |
| A language whose **Reviewed by a person** is off joins `machine_translated`; on, it leaves it | The flag of the import ([C2.14.4](#c2144-the-translation-of-the-library)) is cleared by a person, language by language |
| English never in `machine_translated`, nor a language with no text | English is the original; an empty language has nothing to review |
| A new exercise has its switches on | The admin wrote it |
| A muscle in both lists stays primary | As in the import |
| Only public exercises | `update()` of a personal one throws |

`search_text` follows by itself: the model's `saving` event rewrites it at every save ([C2.6](#c26-database-migrations-models-factories-seeders)).

**The photos** are a section of the form with the field of the official plugin **filament/spatie-laravel-media-library-plugin**, `SpatieMediaLibraryFileUpload`: upload, preview, drag into order, remove, with the app's limits (5, 10 MB, JPEG, PNG, WebP). It reads and writes the exercise's `photos` collection itself, so the files never pass through `SavePublicExercise`: Filament saves the field after the exercise, with `saveRelationships()`, on the create page too. Its previews and the list's column show the small copy, `thumb` ([C2.5.9](#c259-the-photos-of-an-exercise)).

```php
SpatieMediaLibraryFileUpload::make('photos')
    ->collection('photos')
    ->multiple()->reorderable()->maxFiles(ExercisePhotos::MAX)
    ->image()->acceptedFileTypes(['image/jpeg', 'image/png', 'image/webp'])->maxSize(10 * 1024)
    ->conversion('thumb')
```

Videos come in phase 2.

### C2.8.3 The users screen

`/admin/users`, `app/Filament/Resources/Users/`: the users, with their role, a Google account if linked, their status and when they signed up; search by name and email, filters by role and status.

**Only the list.** An admin does not create accounts (people sign up), edit names, emails or passwords (each user does on Profile), nor delete accounts (phase 2, [D3.7.4](../design/D3-data-model.md#d374-deleting-an-account-an-action-in-the-code)). There are no create and edit pages, and `getAuthorizationResponse()` allows only `viewAny` and `view`: there is no `UserPolicy`, and without one Filament allows everything.

**Four row actions,** each confirmed: **Make admin**, **Remove admin**, **Disable**, **Enable**, each shown only when it makes sense, all calling the action `ChangeUserAccess`.

**Never on yourself.** An admin cannot remove their own role nor disable their own account: one wrong click would lock them out, and, if they are the only admin, everyone. The buttons are hidden on the admin's own row (marked "You"), and `ChangeUserAccess` throws if asked anyway. Another admin can do it.

**Disabling acts at once:** the user's next request signs them out ([C2.7.9](#c279-a-disabled-account-is-signed-out-at-once)).

### C2.8.4 The way in: a link, and Google on the panel's login

**Where the panel is.** Not inside the React app: Laravel serves it, at `/admin` of its own address. In development that is **http://localhost:8500/admin**; Vite (port 5673) forwards `/api`, `/sanctum`, `/storage` and `/auth/` to Laravel, not `/admin`, because a Filament page also loads its own scripts, styles and Livewire requests from other paths. In production Caddy forwards `/admin` too, and the panel is on the app's address.

**Already signed in.** The panel uses the same session as the app (the `web` guard), and a browser sends a cookie to the same **host name** whatever the port: signed in on `localhost:5673`, `localhost:8500/admin` opens at once. Not on `127.0.0.1:8500`: another host name to the browser, so no cookie, and the panel's login page.

**The link in the app.** `GET /api/user` sends `admin_url`, the panel's address, to an admin, and `null` to anyone else; Profile shows an **Administration** card with **Open** only when it is there ([C1.13.8](C1-frontend.md#c1138-the-link-to-the-admin-panel)). The address is a setting, `config('app.admin_url')`, from `ADMIN_URL`: `http://localhost:8500/admin` in `compose.yaml` (with `APP_PORT` if changed), the app's address + `/admin` in production. The backend gives it because it knows where the panel is; the React app would need a setting of its own for the same fact.

**Google on the panel's login page.** An admin who signed up with Google has no password, so a render hook adds "Continue with Google" under Filament's login form:

```php
// app/Providers/Filament/AdminPanelProvider.php
->renderHook(PanelsRenderHook::AUTH_LOGIN_FORM_AFTER, fn () => view('filament.google-sign-in'))
```

The view (`resources/views/filament/google-sign-in.blade.php`) is a link to the same first stop as the React app's button, `/auth/google/redirect?to=admin&locale=it`, drawn with Filament's `<x-filament::button>`, and only when Google is set up on this computer. `GoogleSignInController` keeps `admin: true` in the session for the second stop, then:

| Back from Google | Lands on |
|---|---|
| An admin, signed in | The panel, `ADMIN_URL` |
| Someone who is not an admin, signed in all the same | The React app's Home, rather than the panel's 403 |
| An error (cancelled, unverified, disabled…) | The panel's login page, `?google_error=disabled`, which the view shows above the button in the page's language |

Only the word `admin` is read from `to`, never an address: a link that sends the browser to any address given would be an open redirect (C2.7.8). The view shows only the four known reasons; anything else typed in `google_error` is ignored.

---

## C2.9 Queues and jobs

- **What is queued today:** medialibrary's photo conversions ([C2.5.9](#c259-the-photos-of-an-exercise)); video conversion with ffmpeg comes with videos ([D2.5](../design/D2-decisions.md#d25-photos-and-videos)).
- **The queue is a Postgres table** (`QUEUE_CONNECTION=database`): no extra service to run or host.
- **The worker** is the `queue` container (`queue:listen --tries=3`); failed jobs go to `failed_jobs`. `make logs s=queue` follows it.
- **In tests jobs run synchronously** (`QUEUE_CONNECTION=sync` in `phpunit.xml`).

---

## C2.10 Configuration and .env

- **Code reads `config()`, never `env()`,** which returns nothing once the configuration is cached.
- **`backend/.env`** holds this computer's values and secrets, and is never committed. **`.env.example`** lists every variable with harmless values; each one has a comment saying what it does, who reads it, whether `compose.yaml` or the tests set it otherwise, and whether the app uses it at all (Redis, S3 and Memcached are Laravel's defaults, left unused). A new variable goes in both files, with its comment in `.env.example`.
- **Variables from `compose.yaml` win over `.env`.** The app's name, the frontend's address (`FRONTEND_URL`, for links in emails) and the database, mail, queue and Sanctum settings for Docker are set there (`x-backend.environment`), and Laravel never overwrites a variable that is already set. That is why `.env` may still mention SQLite without effect.
- **`APP_KEY`** in `.env` encrypts cookies and sessions. `create-project` generated it; changing it signs everyone out.
- **Useful commands:**
  - `make artisan c="config:show database"` shows the values actually in use;
  - `make clear` empties the caches when a change seems ignored.

---

## C2.11 Tests with Pest

- **`tests/Feature/`**, by area, goes through HTTP: every endpoint, including the forbidden cases (another user's plan answering 403, [P1.2](../project/P1-conventions.md#p12-code)), and the actions called directly. **`tests/Unit/`** holds pure classes such as `SearchText`.
- **The test database** is `atleoplan_test`, forced in `phpunit.xml` and guarded by `TestDatabaseTest` ([S1.6](../start/S1-setup.md#s16-creating-the-laravel-backend)); `RefreshDatabase` gives each test empty tables.
- **Query counts are asserted** where they matter: a plan of 20 exercises costs as many queries as a plan of one.
- **Emails** are faked with `Notification::fake()`; `LanguageTest` reads what the `array` mailer received to check the real text in each language.
- **Datasets** with named keys read as sentences in the output: `it refuses invalid data with data set "a link that is not YouTube"`.

`tests/Feature/ExerciseLibrary/` is the reference for an API with permissions: one file for the list and its filters, one for the other endpoints with each refusal, one for the action called without HTTP. `tests/Feature/Admin/` tests the panel's screens as Livewire components. `make test`, `make test f=Name`.

---

## C2.12 Recipes

The shape of each common change; the commands and the easy mistakes are in [H1. Database](../how-to/H1-database.md) and [H2. Backend](../how-to/H2-backend.md).

**A new table with its model:**

1. `make artisan c="make:model Plan -mf"` creates the model, its migration (`-m`) and its factory (`-f`).
2. Fill in the migration, commenting every column ([P1.2](../project/P1-conventions.md#p12-code)), then run `make migrate`.
3. In the model, set the fillable columns, the casts and the relations.
4. In the factory, describe what realistic fake data looks like.
5. Add the TypeScript type of the model in `frontend/src/api/`.

**A new endpoint.** For example, list the user's plans (`PlanController` is the real one, [C2.5.5](#c255-the-plans-endpoints)):

1. **Route** in `routes/api.php`, inside an `auth:sanctum` group: `Route::get('/plans', [PlanController::class, 'index']);`
2. **Controller:** `make artisan c="make:controller PlanController"`. It stays thin ([C2.5](#c25-routes-and-controllers)).
3. **Validation**, if the endpoint takes input: `make artisan c="make:request StorePlanRequest"`. List the rules there, such as `'name' => ['required', 'string', 'max:100']`, and delete the generated `authorize()`. A change that accepts partial data can extend the creation's request and add `sometimes` to each field (`UpdateExerciseRequest`).
4. **Permission:** `make artisan c="make:policy PlanPolicy --model=Plan"`, with a method per action, such as `update(User $user, Plan $plan): bool`.
5. **JSON shape:** `make artisan c="make:resource PlanResource"`.
6. **The work**, when it is more than a line: an action, `make artisan c="make:class Actions/Plans/SavePlan"` ([C2.5.3](#c253-actions-the-work-outside-the-controller)). A list with filters: a scope per filter on the model, and `QueryBuilder` in the controller ([C2.5.2](#c252-lists-filters-and-pages)).
7. **Test** in `tests/Feature/`. It covers success, invalid input (422), signed out (401) and someone else's record (403).
8. **Frontend:** the `src/api/` file and its hooks ([C1.9](C1-frontend.md#c19-recipes)).

**A body shaped as a tree** (a plan with its days, exercises and sets): rules with `.*` for every level, `present` on the lists, an action that saves it all in one transaction ([C2.5.6](#c256-validating-nested-data)). **A check Laravel has no rule for:** `make artisan c="make:rule Name"`, then `validate()` calling `$fail('validation.key')->translate()`, and the message in the four `lang/*/validation.php`.

**Data a phone sends later, maybe twice** (a workout): a `PUT` to the row's own UUID, made on the phone, which creates or replaces; every row of the body matched by its UUID; a deleted row answered with 410 so the phone stops resending ([C2.5.7](#c257-the-workouts-endpoints)).

**Work in the background.**

1. `make artisan c="make:job ConvertVideo"`, then write the work in `handle()`.
2. Dispatch it: `ConvertVideo::dispatch(...)`.
3. After changing a job's code, run `make restart` (in development `queue:listen` reloads the code by itself, but restarting is harmless).

**An admin screen:** `make artisan c="make:filament-resource Exercise --generate"`, then adjust its columns and fields ([C2.8](#c28-admin-panel-filament)).

**A command of our own:** `make artisan c="make:command ImportSomething"`, then its `#[Signature]` and `handle()`; the rules in an action, and a test with `$this->artisan()` ([C2.14](#c214-artisan-commands-of-our-own)).

**Before calling it done:** `make fix`, then `make check`.

---

## C2.13 Artisan and Composer commands

Every command runs inside the container. The `make` shortcuts avoid typing `docker compose exec backend …` ([S1.8](../start/S1-setup.md#s18-everyday-commands)).

| What | Command |
|---|---|
| Any Artisan command | `make artisan c="…"` |
| The list of Artisan commands, and help on one | `make artisan c="list"`, `make artisan c="help make:model"` |
| Generate a class (model, controller, request, policy, resource, rule, job, test) | `make artisan c="make:model Plan -mf"`, `make:controller`, `make:request`, `make:policy`, `make:resource`, `make:rule`, `make:job`, `make:test --pest` |
| Migrations | `make migrate`, `make fresh`, `make artisan c="migrate:status"`, `make artisan c="migrate:rollback"` (undoes the last batch) |
| A PHP console with the app loaded | `make tinker` |
| The routes | `make routes` |
| Configuration in use, caches | `make artisan c="config:show mail"`, `make clear` |
| Add or update a package | `make composer c="require spatie/something"`; `make composer c="update vendor/package"` |
| Format the PHP code | `make pint` (part of `make fix`) |
| Tests | `make test`, `make test f=Name` |
| Logs | `make logs`; the file `backend/storage/logs/laravel.log` |
| A command of our own, generated | `make artisan c="make:command Name"` ([C2.14](#c214-artisan-commands-of-our-own)) |
| Fill the public exercise library, then translate it | `make exercises-import`, `make exercises-import o="--limit=5"` |
| Translate the imported exercises again | `make exercises-translate`, `make exercises-translate o="--locale=it --force"` |
| Correct the logging types the import guessed wrong | `make exercises-correct` ([C2.14.6](#c2146-the-logging-types-corrected-after-the-import)) |
| The small and large copies of the photos that lack them | `make exercises-thumbnails` ([C2.5.9](#c259-the-photos-of-an-exercise)) |

---

## C2.14 Artisan commands of our own

Four commands build the public exercise library: `exercises:import` from free-exercise-db (C2.14.3), `exercises:translate` into Italian, Spanish and German ([C2.14.4](#c2144-the-translation-of-the-library)), `exercises:import-extra` for exercises of our own ([C2.14.5](#c2145-the-extra-exercises)) and `exercises:correct-logging-types` for the import's wrong guesses ([C2.14.6](#c2146-the-logging-types-corrected-after-the-import)). `make exercises-import` runs them in that order.

### C2.14.1 A command class

- **The command does I/O, the action holds the rules.** The command reads the files, loops, prints a progress bar and a summary; the rules of one exercise live in an action (`ImportFreeExercise`, `TranslateExercise`, `CorrectLoggingType`), which a test calls directly ([C2.5.3](#c253-actions-the-work-outside-the-controller)).
- **Each item in its own transaction:** one exercise that fails is rolled back alone, listed at the end, and the command exits with a failure code, so `make` stops.
- **Idempotent:** running a command again changes nothing that is already right, and never undoes an admin's work.

### C2.14.2 Testing a command

Commands are tested through `$this->artisan()` (output and exit code), on a small dataset written to the system's temporary folder, with `Storage::fake('public')` for the photos (`ImportFreeExerciseTest.php`). `ImportExtraExercisesTest` imports the real `extra-exercises.json`, so a bad entry fails CI.

### C2.14.3 The free-exercise-db import

**What it reads.** [free-exercise-db](https://github.com/yuhonas/free-exercise-db) is a public domain repository: `dist/exercises.json` holds 876 exercises, and `exercises/<id>/0.jpg`, `1.jpg` their 1,746 photos (start and end position), 98 MB once copied. `make exercises-import` clones it once into `backend/storage/app/free-exercise-db`, which Git ignores, then runs the command.

**How each field is mapped** (`app/Actions/Exercises/ImportFreeExercise.php`):

| Source | Becomes | Notes |
|---|---|---|
| `id` (`Barbell_Bench_Press`) | `external_id` | How a second run finds the exercise again |
| `name` | `name`, English | The other languages come from the translation ([C2.14.4](#c2144-the-translation-of-the-library)) |
| `instructions` | `instructions`, English | HTML tags and empty steps removed |
| `level`, `category` | `level`, `category` | As they are; not shown yet |
| `equipment` (`e-z curl bar`, or null) | `equipment_id` | Matched by slug: `Str::slug('e-z curl bar')` is `e-z-curl-bar`, the slug of `EquipmentSeeder` |
| `primaryMuscles`, `secondaryMuscles` | `exercise_muscle`, with the role | Matched by slug the same way; a muscle in both lists stays primary |
| `images` | the `photos` collection, in order | Copied to the `public` disk; the first is the cover |
| (nothing) | `logging_type` | Guessed: stretching and cardio → time; body only or no equipment → reps; the rest → weight and reps. It gave 637 weight and reps, 137 time, 102 reps; nine wrong guesses, Plank among them, are then corrected ([C2.14.6](#c2146-the-logging-types-corrected-after-the-import)) |
| `force`, `mechanic` | (not kept) | No column for them ([D3.4.7](../design/D3-data-model.md#d347-what-is-not-in-the-table)) |

**Running it again** never duplicates, and never undoes the work of an admin:

| The exercise is… | Default | With `--update` |
|---|---|---|
| Not in the library | Created | Created |
| Already there | Left as it is | English texts, level, category, equipment and muscles refreshed from the source; other languages, logging type and photos kept |
| Deleted by an admin (soft delete) | Left deleted | Left deleted |
| Without photos (an import stopped halfway, or run with `--without-photos`) | Photos added | Photos added |

**One exercise that fails** (a muscle or kind of equipment not in our lists) is rolled back alone: the command lists it at the end, imports the others, and ends with a failure code.

**Photos are stored as they come**, as the source's JPEGs, and get their two WebP copies (1600 and 400 px) as any photo does ([C2.5.9](#c259-the-photos-of-an-exercise)); `make exercises-import` makes them inside the command. A library imported before the copies existed gets them with `make exercises-thumbnails`.


### C2.14.4 The translation of the library

free-exercise-db is in English only. Its 876 names and 3,738 steps were translated into Italian, Spanish and German once, and the translations are **files of the repository**, `backend/database/data/exercise-translations/it.json`, `es.json` and `de.json`. A command writes them into the database: `php artisan exercises:translate`, which `make exercises-import` runs right after the import.

**Why files, not a call to a translation service at every import.** The translations are part of the app, like the seeders' muscle names: versioned with the code, reviewed in a pull request, the same on every computer and on the server, and free to apply again after `make fresh`. A service would need a key, cost money at every run, and could give a different text each time.

**How they were made.** Machine translated with an LLM, once, following one style guide: the names gym-goers use in each country ("Panca piana", "Press de banca", "Bankdrücken"), the informal *tu*, *tú*, *du* the app uses, muscles and equipment named as in the seeders, exactly one translated step for each English step. A script checked the result before it was committed, and every language stays flagged as machine translated until a person reviews it.

**One entry of a file**, keyed by the exercise's `external_id`:

```json
"Upright_Barbell_Row": {
  "name": "Tirate al mento con bilanciere",
  "aliases": ["rematore alto", "upright row"],
  "instructions": ["Afferra un bilanciere con presa prona un po' più stretta della larghezza delle spalle. …", "…"]
}
```

`aliases` are other names people search for, in that language: the library's search looks in them too ([D3.4.6](../design/D3-data-model.md#d346-searching)), so "rematore alto" finds the upright row, and "upright row" too, for those who know it by its English name. The English source had none.

**The rules** (`app/Actions/Exercises/TranslateExercise.php`):

| Rule | Why |
|---|---|
| Only the language being written changes: `setTranslation('name', 'it', …)` | English, the original, and the other languages stay. `replaceTranslations()`, used for personal exercises ([C2.5.4](#c254-the-exercise-librarys-endpoints)), would drop them |
| A language the exercise already has is kept, unless `--force` | It may have been corrected by a person since, in the admin panel |
| The steps must match the English one for one | A translation with a different number of steps was made from another version of the text, such as English refreshed by `exercises:import --update`: refused, and listed at the end |
| The language joins `machine_translated` | Every language is marked as not reviewed, Italian included, until a person reviews it in the admin panel ([C2.8.2](#c282-the-exercise-library-screen); [D2.3](../design/D2-decisions.md#d23-exercise-library)) |
| An exercise deleted by an admin is translated too | It stays deleted, and is ready if brought back |

**Running it again** writes nothing new: every language is already there. `--locale=it` limits it to one language; `--force` rewrites, which undoes corrections made by hand, so it is for after a fix to the files themselves.

**Where the texts show.** HasTranslations reads the request's language ([D3.4.5](../design/D3-data-model.md#d345-translations)), so with these files every screen that shows a public exercise is in the user's language: the library, its search and filters, the exercise's page, the plans. Nothing in the frontend changed.

### C2.14.5 The extra exercises

free-exercise-db covers weights and machines well and calisthenics barely: no frog stand, front lever, burpees or dead hang. The project's own public exercises fill the gap, kept in **`backend/database/data/extra-exercises.json`** and added by `php artisan exercises:import-extra` (`make exercises-extra`, and `make exercises-import` after the dataset).

**The same shape as free-exercise-db, so the same action.** Each entry is written as the dataset's are, and `ImportFreeExercise` imports it with the rules of C2.14.3 (found again by `external_id`, left alone unless `--update`, never duplicated, an exercise deleted by an admin left deleted). Two keys are ours, and the action reads them when present:

```json
{
  "id": "AtleoPlan_Frog_Stand",
  "name": "Frog Stand",
  "aliases": ["crow pose", "frog balance"],
  "level": "beginner", "category": "strength", "equipment": "body only",
  "loggingType": "time",
  "primaryMuscles": ["shoulders"], "secondaryMuscles": ["triceps", "abdominals", "forearms"],
  "instructions": ["Squat down and place your hands flat on the floor…", "…", "…"],
  "images": []
}
```

| Key | Why |
|---|---|
| `id` with `AtleoPlan_` | Never the same as one of free-exercise-db's, today or after an update of the dataset |
| `aliases` | English other names ("crow pose"): the dataset has none, and the search looks in every language's |
| `loggingType` | Stated, not guessed: a frog stand is body weight, which the guess would count in reps, but it is held for a time |
| `images: []` | No photos yet; the list shows a placeholder, as for a personal exercise without photos |

**Their translations** are entries of the same `exercise-translations/{it,es,de}.json` files, so `exercises:translate` writes them like the dataset's, marked machine translated (C2.14.4). 21 exercises: the 12 of a calisthenics plan that were missing (chest-to-bar and L-sit pull-ups, frog stand, ice cream maker, dead hang, chest-to-wall handstand, burpees, front lever, full bridge, shoulder dislocates, shoulder opener, two-arm kettlebell swing) and 9 of the same family (L-sit, toes-to-bar, back lever, tuck planche, hollow body hold, pike push-up, archer pull-up, skin the cat, dragon flag).

**Adding one** is a new entry in the four files, then `make exercises-extra`; the tests of `ImportExtraExercisesTest.php` import the real file, so a muscle we do not have, a misspelt logging type or a missing translation fails there.

### C2.14.6 The logging types corrected after the import

The import guesses how an exercise's sets are logged (C2.14.3), and the guess is wrong for a few of free-exercise-db's exercises: a plank is body weight, so it is guessed as reps, while it is held for a time. With reps, a plan cannot ask for "3 × 30 s plank" and workout mode asks how many. The right types are a list in the repository, **`backend/database/data/logging-type-corrections.json`**, applied by `php artisan exercises:correct-logging-types` (`make exercises-correct`, and `make exercises-import` right after the dataset).

```json
{ "id": "Plank", "from": "reps", "to": "time", "why": "Held as long as possible, on the forearms" }
```

| Key | What it is |
|---|---|
| `id` | The exercise's `external_id`, free-exercise-db's id |
| `from` | The type the import guesses for it: the correction applies only to an exercise still on it |
| `to` | The right type |
| `why` | The reason, for whoever reads the file: JSON has no comments |

**The rules** (`app/Actions/Exercises/CorrectLoggingType.php`), in this order:

| The exercise is… | What happens | Why |
|---|---|---|
| Not in the library, or deleted by an admin | Nothing | An import with `--limit`, or an admin's choice |
| Already on `to` | Nothing | A second run changes nothing |
| On a third type, neither `from` nor `to` | Kept | An admin chose it in the admin panel |
| In a plan or a workout already, of anyone | Kept, and named in the summary | Its sets were written for the old type: a workout with reps on a `time` exercise would be refused if sent again ([D3.6.3](../design/D3-data-model.md#d363-logged_sets), `SaveSessionRequest`) |
| Otherwise | Changed to `to` | |

**Which exercises.** Nine, all `time`: Plank, Side Bridge (the side plank), the two isometric neck exercises and Isometric Chest Squeezes ("hold for the recommended number of seconds"), Mountain Climbers ("for 20-30 seconds"), Balance Board, Downward Facing Balance and Battling Ropes. They were found by reading the dataset's instructions for "hold", "seconds" and "as long as", then one by one. Two kinds were left out on purpose:
- **Push Up to Side Plank** stays reps: despite its name, its instructions say "for 10 or more reps".
- **Holds and carries with a weight** (Plate Pinch, Crucifix, Farmer's Walk, Yoke Walk, the sleds) are wrong as weight and reps too, but `time` and `distance` record no weight ([D3.6.3](../design/D3-data-model.md#d363-logged_sets)): correcting them would lose the kilograms. They wait in the backlog, [DATA-4](../project/backlog.md#data-4-weighted-holds-and-carries-have-no-fitting-logging-type).

**Why a command after the import, not a change to the guess.** The guess reads only the category and the equipment, and a plank and a crunch have the same ones: telling them apart needs a list of names anyway. A separate command also reaches a library imported before the list existed, which the import, leaving existing exercises alone, never would.

---

← [C1. Frontend](C1-frontend.md) · [Contents](../README.md) · [H1. Database: how to](../how-to/H1-database.md) →
