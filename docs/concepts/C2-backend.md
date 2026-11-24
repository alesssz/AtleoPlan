# C2. Backend

The architecture of the Laravel API in `backend/`: its pieces, the path of a request, the conventions of each layer, and the decisions behind each feature's endpoints, the admin panel and the import commands.

The stack's rationale is in [D2.2](../design/D2-decisions.md#d22-stack), the tables in [D3](../design/D3-data-model.md), setup in [S1.6](../start/S1-setup.md#s16-the-backends-configuration), step-by-step recipes and commands in [H1. Database](../how-to/H1-database.md) and [H2. Backend](../how-to/H2-backend.md), the React side in [C1. Frontend](C1-frontend.md).

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
  - [C2.5.7 The workouts' endpoints](#c257-the-workouts-endpoints)
  - [C2.5.8 A plan as a file](#c258-a-plan-as-a-file)
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
| **FrankenPHP** | Web server | the `backend` container, port 8500 |
| **PostgreSQL 18** | `atleoplan` for development, `atleoplan_test` for tests | the `postgres` container |
| **Sanctum** | Session-cookie authentication for the SPA; API tokens later for a mobile app | [C2.7](#c27-signing-in-sanctum) |
| **Fortify** | Headless sign-up, sign-in and password-reset routes | `config/fortify.php`, [C2.7](#c27-signing-in-sanctum) |
| **Socialite** | Sign in with Google | [C2.7.8](#c278-signing-in-with-google) |
| **Filament 5** | The admin panel | `/admin` ([C2.8](#c28-admin-panel-filament)) |
| **spatie/laravel-translatable** | Translated columns as JSON | [C2.6](#c26-database-migrations-models-factories-seeders) |
| **spatie/laravel-medialibrary** | Exercise photos and their converted copies | [C2.5.9](#c259-the-photos-of-an-exercise) |
| **spatie/laravel-query-builder** | Whitelisted filters on list endpoints | [C2.5.2](#c252-lists-filters-and-pages) |
| **Pest** | Tests | [C2.11](#c211-tests-with-pest) |
| **Pint** | Code style, `laravel` preset | `make pint` |

---

## C2.2 Code conventions

- **Thin controllers.** A controller authorises through a policy, takes validated input from a Form Request, calls an action and returns an API Resource ([C2.5](#c25-routes-and-controllers)). Business rules live in `app/Actions/`, container-injected classes tested without HTTP.
- **Form Requests validate, policies authorise.** Requests have no `authorize()`; the controller calls `Gate::authorize()`, so the order (404, then 422, then 403) is the same everywhere.
- **Laravel 13 attributes over properties:** `#[Fillable]`, `#[Hidden]`, `#[Scope]` on models; `#[Signature]`, `#[Description]` on commands.
- **Enums for every closed list** (`app/Enums/`): logging types, set types, muscle roles, locales, themes, units. Columns cast to them, validation uses `Rule::enum()`, the frontend mirrors the values in `as const` arrays.
- **Writes that belong together run in `DB::transaction()`.** Nested actions open their own, which become savepoints of the outer one ([C2.5.8](#c258-a-plan-as-a-file)).
- **Weights are exact:** `numeric(7,3)`, serialised as strings (`"80.000"`), always kilograms ([D3.2.3](../design/D3-data-model.md#d323-weights-are-always-in-kilograms)).
- **Moments are stored in UTC** and sent as ISO 8601 ([C2.5.7](#c257-the-workouts-endpoints)).
- **Every validation key the app adds** has its text in `lang/{en,it,es,de}/validation.php` ([C2.7.7](#c277-messages-in-the-users-language)).
- **`config()`, never `env()`,** outside `config/`.

---

## C2.3 Folder structure

```
backend/
├── app/
│   ├── Actions/              business rules, outside the controllers (C2.5.3)
│   │   ├── Exercises/          SavePersonalExercise, DuplicateExercise, ExercisePhotos (C2.5.4, C2.5.9);
│   │   │                       SavePublicExercise (C2.8.2); ImportFreeExercise, TranslateExercise, CorrectLoggingType (C2.14)
│   │   ├── Plans/              SavePlan (C2.5.5); ExportPlan, ImportPlan (C2.5.8)
│   │   ├── Workouts/           SaveWorkoutSession, FindLastSets, HomeSummary (C2.5.7)
│   │   ├── Auth/               SignInWithSocialAccount (C2.7.8)
│   │   ├── Users/              ChangeUserAccess (C2.8.3)
│   │   └── Fortify/            CreateNewUser, ResetUserPassword (C2.7)
│   ├── Console/Commands/     exercises:import, :import-extra, :translate, :correct-logging-types (C2.14)
│   ├── Enums/                Locale, Theme, WeightUnit, LoggingType, MuscleRole, SetType (D3.2.4); SocialProvider,
│   │                         SocialSignInError; ImportOutcome, CorrectionOutcome
│   ├── Exceptions/           SocialSignInRefused (C2.7.8)
│   ├── Filament/Resources/   admin screens: Exercises, Users (C2.8)
│   ├── Http/
│   │   ├── Controllers/        (C2.5)
│   │   ├── Middleware/         SetLocaleFromRequest (C2.7.7), SignOutDisabledAccount (C2.7.9), SetPanelLocale (C2.8.1)
│   │   ├── Requests/           Form Requests
│   │   └── Resources/          API Resources
│   ├── Models/               one per table (C2.6)
│   ├── Policies/             ExercisePolicy, PlanPolicy, WorkoutSessionPolicy (C2.5.1)
│   ├── Providers/            AppServiceProvider, FortifyServiceProvider, Filament/AdminPanelProvider
│   ├── Rules/                SupersetsAreNeighbours (C2.5.6)
│   └── Support/              SearchText (D3.4.6)
├── bootstrap/app.php       routing, middleware, exception rendering (C2.4)
├── database/
│   ├── data/                 exercise-translations/, extra-exercises.json, logging-type-corrections.json (C2.14)
│   └── migrations/, factories/, seeders/
├── lang/                   validation, auth, password and admin texts per language (C2.7.7, C2.8.1)
├── resources/views/        filament/google-sign-in.blade.php (C2.8.4)
├── routes/
│   ├── api.php               the JSON API under /api (C2.5)
│   └── web.php               Google sign-in routes
└── tests/                  Feature/ by area, Unit/ (C2.11)
```

The backend has no asset pipeline: the interface is in `frontend/`, and Filament ships compiled assets. `/` answers 404; `/up` is Laravel's health route.

---

## C2.4 The life of a request

```
Browser ─▶ Vite :5673 (Caddy in production) ─▶ FrankenPHP :8500 ─▶ public/index.php ─▶ bootstrap/app.php
         ─▶ middleware: session and CSRF (statefulApi), Accept-Language, disabled accounts, auth:sanctum
         ─▶ route ─▶ Form Request ─▶ controller (policy, action) ─▶ API Resource ─▶ JSON
```

- **`bootstrap/app.php`** turns on Sanctum's `statefulApi()`, appends `SetLocaleFromRequest` and `SignOutDisabledAccount` to both `web` (Fortify's routes) and `api`, puts the latter before authentication in the priority list ([C2.7.9](#c279-a-disabled-account-is-signed-out-at-once)), and renders exceptions as JSON under `/api/*` or when JSON is expected.
- **One origin.** The React app and the API share an address, so the session cookie works without CORS ([D2.6](../design/D2-decisions.md#d26-hosting)).

**`vendor/` in a Docker volume.** On Docker Desktop a bind-mounted folder makes every OPcache revalidation (about a thousand files per request, 96 % of them packages) cross the VM boundary, costing over a second per request after a pause. `compose.yaml` puts `vendor/` in a named volume on the VM's disk: the app's code stays bind-mounted and live, packages are read at native speed, and `backend/vendor/` on the host is a copy for the editor, refreshed after every Composer change ([D2.10](../design/D2-decisions.md#d210-local-development)).

---

## C2.5 Routes and controllers

All of `routes/api.php` except `/health` is behind `auth:sanctum`; `routes/web.php` holds the Google sign-in routes (they need the session).

Every endpoint has the same shape ([P1.2](../project/P1-conventions.md#p12-code)): `Gate::authorize()`, a Form Request, an action, an API Resource. Three controllers cover the range:

- **`ExerciseController`**: a filtered, paginated list with per-row permissions (C2.5.1–C2.5.4);
- **`PlanController`**: a whole tree saved in one request, with optimistic versioning ([C2.5.5](#c255-the-plans-endpoints), [C2.5.6](#c256-validating-nested-data));
- **`WorkoutSessionController`**: idempotent writes from a phone that may be offline ([C2.5.7](#c257-the-workouts-endpoints)).

### C2.5.1 Permissions: policies

| Ability | `ExercisePolicy` allows when |
|---|---|
| `view` | The exercise is public, or mine |
| `create` | Always: a new exercise is personal |
| `update`, `delete` | It is mine. Public ones are refused to admins too: they edit them in the panel, whose screen has its own rules ([C2.8.2](#c282-the-exercise-library-screen)) |
| `duplicate` | It is public |

**Lists do not ask row by row.** `Exercise::visibleTo($user)` applies the `view` rule in SQL ([C2.6](#c26-database-migrations-models-factories-seeders)); the tests check that both agree.

**403, not 404, for someone else's row:** exercise ids are sequential and their existence is no secret; plans and workouts, with UUIDs, answer the same way.

### C2.5.2 Lists: filters and pages

```
GET /api/exercises?filter[search]=panca&filter[muscle]=chest,triceps&page=2
```

```php
QueryBuilder::for(Exercise::visibleTo($request->user()))
    ->allowedFilters(
        AllowedFilter::scope('search')->delimiter(''),
        AllowedFilter::scope('muscle', 'withPrimaryMuscle'),
        AllowedFilter::scope('equipment', 'usingEquipment'),
        AllowedFilter::scope('source', 'fromSource'),
    )
    ->with(self::RELATIONS)                 // equipment, muscles, media
    ->orderByName()
    ->paginate($request->perPage());
```

- **Only listed filters work;** any other (`filter[owner_id]=…`) is a 400, so no unintended column can be filtered on.
- **Commas split a value** into several scope arguments (`chest,triceps`); a search must not be split, hence `delimiter('')`.
- **Values** are validated by `ListExercisesRequest`: 422 for `filter[source]=everyone` or `per_page=500`.
- **Pagination** is Laravel's (`data`, `links`, `meta`), with `withQueryString()`.

**No N+1.** Relations are eager-loaded per page and Resources read them with `whenLoaded()`: a forgotten `with()` shows up as a missing key, not as a slow page.

### C2.5.3 Actions: the work outside the controller

An action is a plain class in `app/Actions/` doing one job of the app, injected into the controller method:

```php
public function store(StoreExerciseRequest $request, SavePersonalExercise $save): ExerciseResource
{
    Gate::authorize('create', Exercise::class);
    $exercise = $save->create($request->user(), $request->validated());

    return new ExerciseResource($exercise->load(self::RELATIONS));
}
```

Actions are tested directly (`SavePersonalExerciseTest.php`) and reused: `ImportPlan` composes `SavePersonalExercise` and `SavePlan`, the Artisan commands call the import actions, the panel calls `SavePublicExercise`. Each wraps its writes in a transaction.

### C2.5.4 The exercise library's endpoints

[D1.4.3](../design/D1-ui.md#d143-exercise-library)–[D1.4.5](../design/D1-ui.md#d145-exercise-editor). Texts are read and written in the request's language ([C2.7.7](#c277-messages-in-the-users-language)).

| Method and path | What it does | Answers |
|---|---|---|
| `GET /api/muscles` | The 17 muscle groups, by name | 200 |
| `GET /api/equipment` | The 12 kinds of equipment, by name | 200 |
| `GET /api/exercises` | Public exercises and mine, by name, 50 per page. `filter[search]` (name and aliases), `filter[muscle]` (primary, comma-separated slugs), `filter[equipment]` (slugs), `filter[source]` (`mine`, `public`); `page`, `per_page` (≤ 100) | 200; 422; 400 unknown filter |
| `GET /api/exercises/{id}` | One exercise | 200; 403; 404 |
| `POST /api/exercises` | Creates a personal exercise | 201; 422 |
| `PATCH /api/exercises/{id}` | Changes mine, only the fields sent | 200; 403; 422 |
| `DELETE /api/exercises/{id}` | Soft-deletes mine | 204; 403 |

**`ExerciseResource`:**

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
    { "id": 1, "url": "/storage/1/conversions/0-large.webp", "thumb_url": "/storage/1/conversions/0-thumb.webp" }
  ]
}
```

**Photos are paths, not URLs.** medialibrary builds URLs from `APP_URL`, which inside the container is not the browser's address. `ExercisePhotoResource` sends the path, which works wherever the React app is served (its server forwards `/storage`) and keeps photos on the app's origin for the offline cache. `public/storage` is the `storage:link` symlink.

**Input** (`StoreExerciseRequest`): `name` (required, ≤ 100), `aliases`, `instructions` (lists of strings), `description`, `logging_type`, `equipment_id`, `youtube_url` (YouTube only), `muscles` (list of `{ "id": 6, "role": "primary" }`). `UpdateExerciseRequest` adds `sometimes` to each field; `muscles`, when sent, is the complete list.

**One language per personal exercise** ([D2.4](../design/D2-decisions.md#d24-languages)). Texts are stored under the request's language and replace any other (`replaceTranslations()`): an Italian exercise edited with the app in English becomes English. Otherwise the stale Italian name would return when the app is switched back to Italian.

Photos and Duplicate as mine: [C2.5.9](#c259-the-photos-of-an-exercise).

### C2.5.5 The plans' endpoints

[D1.4.6](../design/D1-ui.md#d146-plan-list)–[D1.4.8](../design/D1-ui.md#d148-plan-editor). A plan is only ever seen by its owner (`PlanPolicy`).

| Method and path | What it does | Answers |
|---|---|---|
| `GET /api/plans` | Plans in use: the active one first, then by last change, each with `days_count` and `last_used_at` (the start of its latest finished workout, a `withMax()` subquery). `?archived=1`: the archived ones | 200; 422 |
| `GET /api/plans/{id}` | The whole plan: days, items, sets | 200; 403; 404, also for a non-UUID |
| `POST /api/plans` | Creates a whole plan | 201; 200 when the same id is sent again; 422 |
| `PUT /api/plans/{id}` | Saves the whole plan | 200 with `meta.changed_elsewhere`; 403; 422 |
| `DELETE /api/plans/{id}` | Deletes it with its days, items and sets | 204; 403 |
| `POST /api/plans/{id}/activate` | Makes it the active plan | 200; 403 someone else's or archived |
| `POST /api/plans/{id}/archive` | Archives it; if active, no plan is active any more | 200; 403 |
| `POST /api/plans/{id}/unarchive` | Back to the list, not active | 200; 403 |
| `GET /api/plans/{id}/export` | The plan file ([C2.5.8](#c258-a-plan-as-a-file)) | 200; 403 |
| `POST /api/plans/import` | A plan file as a new plan, with `meta.created_exercises` | 201; 422 |

**State changes are routes of their own** (`POST …/activate`), not `PATCH {"archived": true}`, which would mix them into the whole-plan save and its rules.

**`PlanResource`:**

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
          "for_time": false,
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

- **The list** uses the same resource without `days` and with `days_count`, decided by `whenLoaded()` and `whenCounted()`.
- **No `position`:** order is array order.
- **`exercise`** is `ExerciseResource`, also for an exercise deleted since: `PlanItem::exercise()` includes trashed rows ([D3.11](../design/D3-data-model.md#d311-traps-to-avoid)).
- **Weights and RPE are strings** (`"40.000"`, `"8.5"`); clients send numbers back.
- **A whole plan costs 8 queries** regardless of size: the plan, then one per relation in `$plan->load([...])`. A test asserts that 20 exercises cost as many as one.

**Input:** the same tree without `exercise` objects, `is_active` and dates; each item has `exercise_id`, each set a required `set_type`; `PUT` adds `version`, the version the editor started from ([C2.5.6](#c256-validating-nested-data)).

**A save**, `PUT /api/plans/{id}`:

```
PUT /api/plans/0192…f20  { version: 3, name, days: [ … ] }
│
├─ auth:sanctum ............ 401
├─ route model binding ..... 404
├─ UpdatePlanRequest ....... 422, one message per field
├─ Gate::authorize('update') 403
└─ SavePlan::update(), in one transaction
   ├─ read the version, locking the row ........ 4 > 3: changed elsewhere
   ├─ the plan's fields, version 5
   ├─ days and items: matched by UUID .......... updated, created, or (not sent) deleted
   ├─ sets: all deleted, all inserted .......... 2 queries
   └─ commit
→ 200 { data: the plan, meta: { changed_elsewhere: true } }
```

- **The body is the whole plan** ([D3.5.6](../design/D3-data-model.md#d356-saving-a-plan)). No endpoint per day or set: one request, one transaction, never half a change. Days and items left out are deleted; a field left out is emptied.
- **Days and items keep their UUIDs; sets do not.** Workouts point to days and items, so they are updated in place by id (an item can move to another day). Nothing points to a set, so sets are replaced.
- **The version** is read with `lockForUpdate()`, so two concurrent saves cannot both read 4. An older starting version still saves (last write wins) and `meta.changed_elsewhere` makes the app warn ([D3.5.7](../design/D3-data-model.md#d357-when-a-plan-is-changed-in-two-places)).
- **A create is idempotent.** Ids are UUIDs made on the device ([D3.2.1](../design/D3-data-model.md#d321-which-kind-of-id)); a resent `POST` finds this user's plan with that id and answers 200 with it, writing nothing. The same id on someone else's plan is a 422.

**The active plan** is `users.active_plan_id`, one cell, so two plans can never be active ([D3.3](../design/D3-data-model.md#d33-users-and-preferences)). `PlanPolicy::activate()` checks what the column cannot: mine, not archived. Archiving the active plan clears it; deleting clears it through `nullOnDelete()`.

**Not checked:** that a set's targets fit the exercise's logging type (a weight on a plank). The editor shows only the relevant fields, and a stray value is harmless.

### C2.5.6 Validating nested data

A plan arrives as a tree, validated at every level with `.*`:

```php
'days' => ['present', 'array', 'max:14'],
'days.*.name' => ['required', 'string', 'max:50'],
'days.*.items.*.exercise_id' => ['required', 'integer', /* … */],
'days.*.items.*.sets.*.set_type' => ['required', Rule::enum(SetType::class)],
```

Errors name the exact place (`days.0.items.2.sets.1.target_reps_max`); `lang/*/validation.php` names the field by its wildcard key (`days.*.items.*.sets.*.target_reps_max` → "ripetizioni massime").

| Rule | Used for |
|---|---|
| `present` | `days`, `items`, `sets`: a forgotten key must not read as "delete them all" |
| `distinct` | `days.*.items.*.id`: the same id in two days is refused |
| `required_with` | Reps min and max: both or neither |
| `gte:days.*.items.*.sets.*.target_reps_min` | Max ≥ min; the `*` resolves to the same set |
| `decimal:0,3` | Kilograms, as `numeric(7,3)` |
| `Rule::exists(…)->where(fn …)` | An exercise that is public or mine; the closure's conditions are parenthesised, so its `or` cannot leak |
| `Rule::unique(…)->whereNot(…)` | A day's id: not used by another plan, this plan's own days excluded |
| `SupersetsAreNeighbours` | On `days.*.items`: a superset's exercises are adjacent, at least two; translated via `$fail('validation.superset_neighbours')->translate()` |

**One abstract request, two endpoints.** `StorePlanRequest` and `UpdatePlanRequest` extend `PlanRequest`, which leaves `planId()` to them: the URL's plan on update, the id sent on create.

**Three traps:**

- **`unique` and `exists` are skipped once an earlier rule of the field fails.** A day id `"day-1"` fails `uuid` and the `unique` query never runs; otherwise Postgres would raise "invalid input syntax for type uuid". Rule order matters: `uuid` before `unique`.
- **`validated()` keeps a list item only through its validated fields.** A set sent as `{}` has no field with a rule, so `sets: [{}]` vanished from the validated data. Hence `set_type` is required.
- **"This plan" is what the request says it is.** On create, day ids are checked against the plan with the id sent; if that id is someone else's, the request is refused on `id` anyway.

### C2.5.7 The workouts' endpoints

The server side of workout mode, history and Home ([D1.4.2](../design/D1-ui.md#d142-home), [D1.4.9](../design/D1-ui.md#d149-workout-mode)), on the tables of [D3.6](../design/D3-data-model.md#d36-workouts).

| Method and path | What it does | Answers |
|---|---|---|
| `PUT /api/sessions/{uuid}` | Saves a whole workout, new or not | 201 new; 200 again; 410 deleted; 403; 422 |
| `GET /api/sessions` | Mine, newest first, 20 per page, with totals. `?status=open` or `finished`; `from` and `to`, either or both, for those started in a span (history's filter by date) | 200; 422 |
| `GET /api/sessions/calendar?from=…&to=…` | Mine, finished and started in the span, oldest first: only `id`, `started_at`, `duration_seconds`. No pages: the span is at most 367 days (a year in any zone, a leap one included), so a year view comes in one answer | 200; 422 |
| `GET /api/sessions/{uuid}` | One whole workout with totals; `meta.last_sets`: last time for each exercise, before this workout | 200; 403; 404, also when deleted |
| `DELETE /api/sessions/{uuid}` | Soft-deletes it | 204; 403 |
| `GET /api/sessions/last-sets?exercises=12,40` | Per exercise, the sets of the last finished workout that had it | 200; 422 |
| `GET /api/home` | Active plan's days with estimated duration, suggested day, last day done, open workout, finished workouts of the last 32 days | 200 |

**`PUT` to the workout's own address, no `POST`.** The phone mints the UUID at Start, possibly offline ([D3.2.1](../design/D3-data-model.md#d321-which-kind-of-id)). `PUT` creates (201) then replaces (200): idempotent, so the phone's queue can resend after a lost answer without duplicating. `{session}` is not route-model-bound, since the row may not exist; `whereUuid('session')` makes anything else a 404.

**A save**, `SaveWorkoutSession`, in one transaction ([D3.6.5](../design/D3-data-model.md#d365-sending-a-session-to-the-server)):

```
PUT /api/sessions/0192…f30  { started_at, finished_at, exercises: [ { sets: [ … ] } ] }
│
├─ SaveSessionRequest ........... shape, ids, values that fit each exercise; 422
└─ SaveWorkoutSession
   ├─ find the UUID, trashed included
   │   ├─ someone else's ........ 403
   │   ├─ deleted ............... nothing written → 410 Gone: the phone stops resending
   │   └─ unknown ............... a new session of this user
   ├─ plan, day, each item: kept if still the user's, nulled otherwise
   ├─ moments converted to UTC
   ├─ exercises and sets matched by UUID; those not sent are deleted
   └─ commit
→ 201 or 200 { data: the whole session }
```

- **A workout is never refused because a plan changed.** The phone may have trained offline while the plan was edited or deleted elsewhere. The request checks only the format of `plan_id`, `plan_day_id`, `plan_item_id`; the action keeps links that still exist and belong to the user and nulls the rest, while the session keeps its copied names ("Push Pull Legs · Day A"). Someone else's plan id is nulled the same way, revealing nothing.
- **A deleted session stays deleted.** The soft-deleted row ([D3.7.3](../design/D3-data-model.md#d373-deleting-a-session-a-soft-delete)) lets a late resend answer **410 Gone**, which the queue treats as done.
- **Exercises and sets are complete lists,** as for a plan: a set unticked on the phone is not sent and its row is deleted. Unlike plan sets, logged sets have device UUIDs and are updated in place.
- **Values fit the logging type** ([D3.6.3](../design/D3-data-model.md#d363-logged_sets)): `REQUIRED_BY_LOGGING` and `OPTIONAL_BY_LOGGING` in `SaveSessionRequest` (reps for `weight_reps` and `reps`, each with an optional weight and optional seconds for reps done as fast as possible; a time; a distance); any other value field must be empty. The rule spans two tables, beyond a check constraint, so it runs in `after()`.
- **Moments are converted to UTC before saving.** Laravel writes `Y-m-d H:i:s` without the offset, so `2026-11-09T18:00:00+01:00` would otherwise be stored an hour late.
- **A span is the device's.** `from` and `to` of the list and of the calendar are the device's midnights, since only it knows where the user's day begins; `span()` in `ListSessionsRequest` and `SessionCalendarRequest` converts them to UTC before the query, for the same reason.

**Totals are computed by the database** ([D3.8](../design/D3-data-model.md#d38-computed-never-stored)): `exercises_done`, `sets_done`, `reps_done`, `volume_kg`, warm-ups excluded. `WorkoutSession::withTotals()` adds them as `SELECT` subqueries, so a page of 20 is still one query; the resource sends them with `whenHas()`. The screens show reps rather than `volume_kg` (it adds unlike exercises and counts nothing bodyweight, [D2.8](../design/D2-decisions.md#d28-workout-rules)); it stays in the answer, exact, for per-exercise uses.

**Last time** (`last-sets`, and `meta.last_sets`) is `FindLastSets`: per exercise, the sets of this user's last finished, non-deleted workout where it had at least one set, in any plan ([D3.6.4](../design/D3-data-model.md#d364-how-the-screens-use-these-tables)). `last-sets` asks for the latest overall (workout mode's "Last" column); a whole workout passes `$before`, so a workout opened weeks later is compared with what came before *it*. Two queries for any number of exercises; the first uses Postgres's `distinct on (exercise_id, timed)` over rows sorted newest first. **The kind** (`timed`: any set has seconds) gives a rep-counted exercise done as fast as possible its own last time, apart from its rep days. `distinct on` must repeat the leading `order by` expressions, so the `exists (…)` subquery appears in both.

**`GET /api/home`** (`HomeSummary`):

```json
{
  "active_plan": { "id": "01a1…802", "name": "Push Pull Legs", "is_active": true, "days_count": 3, "…": "…" },
  "days": [
    { "id": "01a1…cdd", "name": "Day A – Push", "exercises": 5, "estimated_minutes": 36 },
    { "id": "01a1…856", "name": "Day B – Pull", "exercises": 5, "estimated_minutes": 41 }
  ],
  "suggested_day_id": "01a1…856",
  "last_day": { "id": "01a1…cdd", "name": "Day A – Push", "finished_at": "2026-11-06T19:02:00.000000Z" },
  "open_session": null,
  "recent_sessions": [
    { "id": "0192…f30", "day_name": "Day A – Push", "exercises_done": 1, "sets_done": 1, "volume_kg": "640.000", "…": "…" }
  ]
}
```

- **The suggested day** is `Plan::suggestedDay()`: the day after the last one done in a finished, non-deleted workout of the plan, wrapping to the first; the first when nothing was done or the last day done was deleted ([D2.8](../design/D2-decisions.md#d28-workout-rules)).
- **The estimate** counts 40 seconds of work per planned set (`SET_SECONDS`) plus its rest (the user's default when none). Never stored.
- **The month and the week** are the client's: 32 days cover the current month, and so its week, in any time zone, and the phone groups by its own first of the month and Monday ([D3.2.5](../design/D3-data-model.md#d325-times)).

### C2.5.8 A plan as a file

Export and import ([D3.5.8](../design/D3-data-model.md#d358-the-plan-file)): `ExportPlan`, `ImportPlan` (`app/Actions/Plans/`), `ImportPlanRequest`.

**Export answers plain JSON** (`response()->json($export->export($plan))`), not a resource: the file has its own shape without a `data` wrapper. `ExportPlan` walks days and items, assigns each exercise a reference on first sight (`??=`) and lists the exercises once at the end.

**Import reuses the save paths.** `ImportPlan` finds or creates each exercise (`SavePersonalExercise` for missing ones), then calls `SavePlan::create()` with references replaced by ids, all in one `DB::transaction()`; the nested actions' transactions become savepoints, so any failure undoes everything.

**The editor's rules, re-prefixed.** `PlanRequest::itemRules($prefix)` returns an item's rules for any prefix: `'days.*.items.*.'` in the editor, `'plan.days.*.items.*.'` here. An item's `"exercise": "e1"` is checked with `Rule::in($refs)`, the references the file declares, read from the body before validation.

**201 set by hand.** A resource answers 201 only for a model it saw created (`wasRecentlyCreated`); this plan was created inside the action, so `->response()->setStatusCode(201)`.

### C2.5.9 The photos of an exercise

[D2.5](../design/D2-decisions.md#d25-photos-and-videos), [D1.4.5](../design/D1-ui.md#d145-exercise-editor): photos of personal exercises uploaded from the app, their copies, Duplicate as mine. Public exercises' photos are managed in the panel ([C2.8.2](#c282-the-exercise-library-screen)).

**Storage:** medialibrary collection `photos` (the first is the cover) on the `public` disk (`storage/app/public/<media id>/`), served at `/storage/…`. Conversions are queued, so an upload answers at once and the `queue` container makes the copies.

**Emptying the database leaves the files:** `migrate:fresh` drops the rows with no model event, and the next photos would get the same ids, so the same folders. `make fresh` and `make reset` then run `media-library:clean --skip-conversions`, which deletes every folder of the disk that no `media` row owns: after `migrate:fresh`, all of them. The `public` disk holds nothing else, or that would go too.

| Conversion (`Exercise::registerMediaConversions()`) | Size | For |
|---|---|---|
| `thumb` | ≤ 400 × 400 px, WebP | lists' 40–56 px squares and workout mode's 80 px one, sharp on dense screens |
| `large` | ≤ 1600 × 1600 px, WebP | the exercise's page |

`Fit::Max` keeps proportions and never enlarges. The original stays on disk ([D2.5](../design/D2-decisions.md#d25-photos-and-videos)).

**`ExercisePhotoResource`:** `id`, `url` (`large`), `thumb_url`. Until a conversion exists its address is the original's, so the photo shows at once; an upload's own answer is always that case.

**Endpoints**, on the user's own exercises (`ExercisePolicy::update()`):

| Route | Body | Answer |
|---|---|---|
| `POST /api/exercises/{id}/photos` | multipart, field `photo` | 201, the photo |
| `PUT /api/exercises/{id}/photos` | `{ "ids": [14, 12, 13] }`, every photo once, cover first | 200, the photos in order |
| `DELETE /api/exercises/{id}/photos/{photo}` | | 204; 404 for another exercise's photo |
| `POST /api/exercises/{id}/duplicate` | | 201, the copy (`ExercisePolicy::duplicate()`) |

**Rules** (`StoreExercisePhotoRequest`, `ReorderExercisePhotosRequest`, the action `ExercisePhotos`):

| Rule | Message (422 on the field) |
|---|---|
| `File::image()->types(['jpg', 'jpeg', 'png', 'webp'])->max(10 * 1024)`: checked by content | Laravel's `image`, `mimes`, `max.file` |
| At most 5 photos, in `after()` | `validation.too_many_photos` |
| The order lists exactly the exercise's photos (`present`, since `[]` is the right order for none) | `validation.photo_order` |

The stored name is `photo.<extension>` (`usingFileName()`), the extension guessed from content; `IMG_4032.JPG` says nothing. `Media::setNewOrder($ids)` reorders; `$media->delete()` removes row and files.

**Duplicate as mine** (`DuplicateExercise`): a new exercise owned by the user, texts in the request's language only (falling back to English, [D2.4](../design/D2-decisions.md#d24-languages)), logging type, equipment, video link, muscles with roles, and each photo copied as a new file (`$media->copy($copy, 'photos')`), so the copy is independent of the public exercise. Import columns are not copied.

**Bulk conversions.** `queue:listen` boots Laravel per job: fine for one photo, slow for the import's 1,746. `QUEUE_CONVERSIONS_BY_DEFAULT=false` runs conversions inside the command instead; the Makefile's `ARTISAN_NOW` sets it for `make exercises-import` and `make exercises-thumbnails` (`media-library:regenerate --only-missing`, about 5 minutes for the imported photos).

**GD** is the image driver (`install-php-extensions gd` in the image): reads JPEG, PNG and WebP, writes WebP; no HEIC (D2.5).

---

## C2.6 Database: migrations, models, factories, seeders

Tables, columns, ids and delete behaviour are in [D3. Data model](../design/D3-data-model.md); the recipe for a new table in [H1.2](../how-to/H1-database.md#h12-a-new-table-from-start-to-finish).

**Migrations.**
- **Never edited once run;** a change is a new migration.
- **Non-obvious columns carry a comment,** and the constraints rules depend on live in the database too: check constraints on set values and feelings, foreign keys with explicit `cascadeOnDelete()` / `nullOnDelete()` / `restrictOnDelete()`.
- **A data-filling migration writes through `DB`, never a model:** the model keeps changing, and an old migration using it could behave differently on a fresh database (`…_add_search_text_to_exercises_table`).

**Models.**
- **`#[Fillable]` closes mass assignment:** `is_admin`, `disabled_at` and `active_plan_id` are not fillable.
- **`$attributes` mirrors the table's defaults,** since a freshly created model does not read them back (`Exercise`).
- **Relations of note:** `Exercise::muscles()` through the pivot class `ExerciseMuscle`, so `role` casts to `MuscleRole`; `Plan::items()` as `hasManyThrough` the days; ordered relations (`orderBy('position')`), so eager loading keeps order; `PlanItem::exercise()` and `SessionExercise::exercise()` with `withTrashed()`, so a deleted exercise still shows in plans and history ([D3.11](../design/D3-data-model.md#d311-traps-to-avoid)).
- **Scopes** (`#[Scope]`) hold the query rules: `Exercise::visibleTo()`, `search()`, `withPrimaryMuscle()`, `usingEquipment()`, `fromSource()`, `orderByName()`; `WorkoutSession::withTotals()`. An `or` always goes inside a `where(fn …)` closure, so it cannot leak into conditions chained after it.

| Trait | On | Why |
|---|---|---|
| `HasUuids` | plans, days, items, workouts and their rows (not `plan_sets`) | Device-made ids are kept; Laravel generates a UUIDv7 only when empty ([D3.2.1](../design/D3-data-model.md#d321-which-kind-of-id)) |
| `SoftDeletes` | exercises, workout sessions | Plans and history keep pointing to them ([D3.7](../design/D3-data-model.md#d37-what-happens-on-delete)) |
| `HasTranslations` | exercises, muscles, equipment | One JSON value per language; fallback to English, then any language, set in `AppServiceProvider` ([D3.4.5](../design/D3-data-model.md#d345-translations)) |
| `InteractsWithMedia` | exercises | Photos ([C2.5.9](#c259-the-photos-of-an-exercise)) |

**Model events.** `Exercise::booted()` rewrites `search_text` on `saving`, so every writer (API, panel, import, factories) keeps it right ([D3.4.6](../design/D3-data-model.md#d346-searching)). Mass updates and `DB::table()` bypass events and must not touch the searchable columns.

**Seeders** hold only what the app needs to run (17 muscles, 12 kinds of equipment) and the development account; `DemoPlanSeeder` (`make plans-demo`) adds two example plans per user. The public library is an Artisan command, not a seeder: it reads an external dataset, takes options and reports failures ([C2.14](#c214-artisan-commands-of-our-own)).

---

## C2.7 Signing in: Sanctum

**Fortify** handles the moments that change who is signed in (sign-up, sign-in, sign-out, password reset); **Sanctum** recognises the user on every later request. Google sign-in is a third way in, through **Socialite** and two routes of ours ([C2.7.8](#c278-signing-in-with-google)); afterwards Sanctum sees an ordinary session. The React side: [C1.13](C1-frontend.md#c113-signing-in-and-forms).

### C2.7.1 How a session works

Sessions live in the `sessions` table, keyed by the `HttpOnly` `atleoplan-session` cookie. `statefulApi()` makes `/api` requests from `SANCTUM_STATEFUL_DOMAINS` (`localhost:5673`, set in `compose.yaml`) start the session and verify the CSRF token (`XSRF-TOKEN` cookie echoed in `X-XSRF-TOKEN`); `auth:sanctum` then admits the request or answers 401. Password guessing is throttled ([C2.7.4](#c274-slowing-down-password-guessing)).

```
Browser (localhost:5673)                        Laravel, through Vite's proxy
  │
  ├─ GET /sanctum/csrf-cookie ───────────────▶  sets XSRF-TOKEN
  │
  ├─ POST /api/auth/login ───────────────────▶  CSRF, rate limit, password; starts the session
  │    { email, password, remember }       ◀──  200, sets atleoplan-session
  │    X-XSRF-TOKEN: …
  │
  └─ GET /api/user ──────────────────────────▶  auth:sanctum reads the session
                                           ◀──  { "data": { "name": "Ann", … } }
```

**Cookies, not tokens, for the web app:** a token held in JavaScript can be exfiltrated by injected code, an `HttpOnly` cookie cannot. It works because the app and the API share one origin ([D2.6](../design/D2-decisions.md#d26-hosting)). A mobile app (phase 3) would use bearer tokens (`HasApiTokens`); the `personal_access_tokens` table already exists.

**Routes.** Fortify's are prefixed `/api/auth` (`config/fortify.php`), because `/login` is a React page and the proxy forwards `/api` ([C1.1](C1-frontend.md#c11-the-pieces)).

| Method and path | What it does | Answers |
|---|---|---|
| `POST /api/auth/register` | Signs up, then in | 201 |
| `POST /api/auth/login` | Signs in | 200; 422; 429 |
| `POST /api/auth/logout` | Signs out | 204 |
| `POST /api/auth/forgot-password` | Sends the email | 200; 422 unknown email |
| `POST /api/auth/reset-password` | Sets the new password | 200; 422 wrong token |
| `GET /api/user` (ours) | Who is signed in | 200; 401 |
| `GET /auth/google/redirect` (ours, browser visit) | Off to Google ([C2.7.8](#c278-signing-in-with-google)) | 302 |
| `GET /auth/google/callback` (ours, browser visit) | Back from Google: signs in, links or creates the user | 302 into the app, or `/login?error=…` |
| `PATCH /api/user/preferences` (ours) | Language, theme, unit, default rest (0–600 s), weight step (0.25–50, ≤ 2 decimals), timer sound, vibration, countdown (0–30 s), `show_rpe`; only the fields sent | 204; 422 |

### C2.7.2 Signing in and out

Fortify's route and controller; `FortifyServiceProvider` supplies the credential check, to also refuse disabled accounts:

```php
Fortify::authenticateUsing(function (Request $request) {
    $user = User::where('email', $request->input('email'))->first();

    if (! $user || ! Hash::check((string) $request->input('password'), $user->password)) {
        return null;                       // 422 with auth.failed
    }

    // Only someone who knows the password learns that the account is disabled
    if ($user->disabled_at !== null) {
        throw ValidationException::withMessages(['email' => __('auth.disabled')]);
    }

    return $user;
});
```

- **Wrong password and unknown email get the same message.**
- **Emails are lowercased** before every lookup (`lowercase_usernames`): Postgres compares text exactly.
- **The session id is regenerated** after sign-in, against fixation.

### C2.7.3 Signing up

`app/Actions/Fortify/CreateNewUser.php`: name, email (unique), password (`Password::default()`), and an optional `locale` (`Rule::enum(Locale::class)`), defaulting to the request's language, so emails to a new account go out in the language the app was showing.

### C2.7.4 Slowing down password guessing

Five attempts a minute per email **and** IP, then 429 (`RateLimiter::for('login', …)` in `FortifyServiceProvider`, named in `config/fortify.php`). Keying on both means an attacker cannot lock someone out by trying their email from elsewhere.

### C2.7.5 Forgot password

Fortify stores a hashed, single-use token (60 minutes) and emails a link; the app supplies `ResetUserPassword` and the link's target, the React page rather than a Laravel route:

```php
ResetPassword::createUrlUsing(fn (User $user, string $token): string => sprintf(
    '%s/reset-password?token=%s&email=%s',
    config('app.frontend_url'),
    $token,
    urlencode($user->email),               // keeps a + in an address intact
));
```

**Known limit:** an unknown email gets a 422, so this form (like sign-up) reveals who has an account: [BE-3](../project/backlog.md#be-3-harden-the-public-sign-in-routes).

### C2.7.6 Fortify or by hand

The five controller methods are short to write; the difference is who answers for the details. With Fortify, session regeneration, lowercased emails on every path, remember-me tokens, reset events and security fixes come with the package, and two-factor or email verification is one line in `features`. What is app-specific (disabled accounts, the account language, the React reset link) fits the hooks Fortify leaves open (`authenticateUsing`, actions, `createUrlUsing`). By hand would be the better choice only for an unusual sign-in flow.

**Set aside:** Breeze and Jetstream generate Blade or Inertia screens, and the screens are React; Passport is an OAuth server, more than this needs ([D2.2](../design/D2-decisions.md#d22-stack)).

**Only enabled features are installed:** the two-factor and passkey migrations and the profile/password actions published by `fortify:install` are removed, and those features are off in `config/fortify.php`.

### C2.7.7 Messages in the user's language

| File | Holds |
|---|---|
| `lang/{it,es,de}/auth.php`, `passwords.php` | Sign-in and password reset |
| `lang/{it,es,de}/validation.php` | Validation messages for the rules in use, and field names |
| `lang/{it,es,de}.json` | The password email's sentences, keyed by the English text |
| `lang/en/auth.php`, `validation.php` | Only additions (the disabled-account message, English field names such as `muscles.*.role`), merged over Laravel's own by key |

- **Responses** use the request's language: the React app sends `Accept-Language` on every call, and `SetLocaleFromRequest` applies it.
- **Emails** use the account's language (`User` implements `HasLocalePreference`), since they may be read later on another device.
- **A new validation rule** adds its message to the three `validation.php` files; `tests/Feature/Auth/LanguageTest.php` lists the keys it checks. Without a translation the English message shows.
- **Fields inside lists** are named with `*` in `attributes` (`'muscles.*.role' => 'ruolo del muscolo'`); otherwise the message reads "Il campo muscles.0.role è obbligatorio".

### C2.7.8 Signing in with Google

"Continue with Google" ([D1.4.1](../design/D1-ui.md#d141-sign-in-and-onboarding)) is OAuth through Socialite; handling Google's answer is `app/Actions/Auth/SignInWithSocialAccount.php`. Table: [D3.3.1](../design/D3-data-model.md#d331-social_accounts).

```
Browser                         Laravel (through Vite, /auth/…)         Google
  │
  ├─ GET /auth/google/redirect?locale=it&from=/plans ─▶
  │                               from and locale into the session; Socialite stores a random `state`
  │  ◀── 302 to accounts.google.com?client_id=…&redirect_uri=…&state=…&scope=openid profile email
  │
  ├─ account chooser, consent ─────────────────────────────────────────────▶
  │  ◀── 302 to /auth/google/callback?code=…&state=… ─────────────────────
  │
  ├─ GET /auth/google/callback?code=…&state=… ─▶
  │                               state matches the session's?
  │                               code + client secret ──────────────────▶
  │                                                 ◀── sub, email, email_verified, name
  │                               find, link or create the user; Auth::login(); session regenerated
  │  ◀── 302 to /plans (or /login?error=…)
  │
  └─ the React app boots; GET /api/user finds the session
```

| Piece | Stops |
|---|---|
| **`state`**, checked against the session | A callback started on another site, signing the victim into the attacker's account. It needs the session, hence `web.php` |
| **The client secret**, server-side only | Anyone else exchanging a `code` for the person's details |
| **Registered redirect URIs** ([S1.11.4](../start/S1-setup.md#s1114-the-client-and-its-secret)) | Google sending the `code` elsewhere |
| **`email_verified`** required before using the address | A Google account created with someone else's (non-Gmail) address taking over their account |
| **`from` accepted only as a path** (`/plans`, never `//site` or `https://…`) | An open redirect |
| **`session()->regenerate()`** after `Auth::login()` | Session fixation ([C2.7.2](#c272-signing-in-and-out)) |

**Who signs in**, in order:

1. **A linked Google account** (a `social_accounts` row with its `sub`): that user. By id, not address, which can change on Google's side.
2. **An address that belongs to a password account:** Google is linked to it. Refusing and asking for the password would be marginally safer and clumsier for every user; `email_verified` is what makes linking safe.
3. **A new address:** a new account without password, in the language the app was showing.

Cases 2 and 3 require `email_verified`. A disabled account is refused in all three, before anything is linked.

**From the admin panel** (`?to=admin`) the journey ends on the panel, or its login page with the error ([C2.8.4](#c284-the-way-in-a-link-and-google-on-the-panels-login)).

**Errors return as a code,** `/login?error=cancelled|failed|unverified|disabled` (`SocialSignInError`), since a redirect carries no JSON body. The action throws `SocialSignInRefused` with the reason, so a check can stop it at any depth; the controller catches it. Anything unexpected (Google unreachable, a wrong secret, a stale `state`) is `failed`.

**Every visit leaves a line in the log**, since the codes are vague on purpose and a failed return leaves no other trace: `info` when leaving for Google and when signed in (the user's id, never the email), `warning` for each failure with its reason (Google's `error`, Socialite's exception, the refusal's code). Each line carries what tells the causes apart: the request's `host`, whether the session cookie came back (`session_cookie`), whether the session still held the visit (`visit_started`), and the user agent. Reading them: [S1.11.7](../start/S1-setup.md#s1117-when-it-does-not-work).

**Accounts without a password:** `users.password` is nullable. `Hash::check()` never matches an empty hash, so the password form refuses them like a wrong password; Forgot password sets one, after which both ways work.

**Outside Fortify,** which has no social sign-in, but on the same `web` guard and session: to Sanctum a Google user is indistinguishable. Socialite's drivers make Apple a configuration change.

### C2.7.9 A disabled account is signed out at once

Disabling an account in the panel ([C2.8.3](#c283-the-users-screen)) sets `users.disabled_at`. Sign-in is refused with a password and with Google, but an **existing session** stays valid, for weeks with "remember me".

**`SignOutDisabledAccount`** runs on every `web` and `api` request: when the session's user is disabled it signs them out (as C2.7.2 does) and lets the request continue as a visitor's:

| The request | Then |
|---|---|
| Behind `auth:sanctum` (almost all of `/api`) | 401: the app treats it as an ended session and opens sign-in, which then says "This account has been disabled." |
| Public (`/api/health`, sign-in routes) | Answered as for any visitor |
| The admin panel | Unaffected: `canAccessPanel()` already refuses a disabled admin on every request |

**It must run before authentication.** Laravel sorts route middleware by a priority list, and a middleware missing from it runs after all listed ones: merely appended, this one would run after `auth:sanctum` had admitted the user. `bootstrap/app.php` therefore adds it with `prependToPriorityList(AuthenticatesRequests::class, SignOutDisabledAccount::class)`. Checking the resulting order: [H2.6](../how-to/H2-backend.md#h26-an-admin-screen).

**Why not delete the user's sessions on Disable:** the middleware also covers sessions outside the `sessions` table (tests, other drivers), needs nothing to happen at Disable, and holds whatever sets the column, tinker or a database client included.

---

## C2.8 Admin panel: Filament

- **Configured** in `app/Providers/Filament/AdminPanelProvider.php`: path `/admin`, login page, colours, render hooks. Served by Laravel directly, not through the React app.
- **Two resources,** in `app/Filament/Resources/<Name>/`: the public exercise library ([C2.8.2](#c282-the-exercise-library-screen)) and users ([C2.8.3](#c283-the-users-screen)).
- **Admins only, in every environment:** `User` implements `FilamentUser`, and `canAccessPanel()` requires `is_admin` and an enabled account; anyone else gets 403 ([D3.3](../design/D3-data-model.md#d33-users-and-preferences)).
- **The session is shared with the React app** (same `web` guard; cookies are per host, not per port).

Getting an admin account in development: [H2.6](../how-to/H2-backend.md#h26-an-admin-screen).

### C2.8.1 The panel's language

The panel speaks the admin's language (`users.locale`); on the login page, before anyone is known, the browser's. Filament's own texts are translated by the package; ours (field, column, filter and action labels) are in `lang/<language>/admin.php`, read with `__('admin.…')` and `trans_choice()`.

`SetPanelLocale` is in the panel's middleware as **persistent**:

```php
->middleware([SetPanelLocale::class], isPersistent: true)
```

After the first load, every interaction is a Livewire request to `/livewire/update`, which crosses only persistent middleware: without it the page would load in Italian and switch to English at the first filter.

**Labels are methods** (`getModelLabel()`, `getNavigationLabel()`), not properties: a property is fixed when the class loads, before the middleware sets the language.

### C2.8.2 The exercise library screen

`/admin/exercises`, `app/Filament/Resources/Exercises/`: the public library, to correct, translate and review ([D1.4.15](../design/D1-ui.md#d1415-admin-panel-filament)).

| File | Holds |
|---|---|
| `ExerciseResource.php` | Queries, pages and permissions |
| `Tables/ExercisesTable.php` | Columns (first photo, name, equipment, primary muscles, logging type, languages to review), search, filters |
| `Schemas/ExerciseForm.php` | One tab per language, then data, photos, source |
| `Pages/CreateExercise.php`, `EditExercise.php` | Hand the form to `SavePublicExercise` |
| `app/Actions/Exercises/SavePublicExercise.php` | The save rules, tested without Filament |

**Public exercises only.** `getEloquentQuery()` and `getRecordRouteBindingEloquentQuery()` add `whereNull('owner_id')`: a personal exercise's edit URL is a 404. The panel never shows users' own exercises.

**Its own permissions.** Filament asks the model's policy when it has the method, and `ExercisePolicy` refuses `update` and `delete` on public exercises to everyone, because through the React editor an admin would rewrite a public exercise in one language. The panel is admin-only already, so the resource overrides `getAuthorizationResponse()`: everything on a public exercise, nothing on a personal one, never `forceDelete` (plans and workouts reference exercises: [D3.7.2](../design/D3-data-model.md#d372-deleting-an-exercise-a-soft-delete)). The alternative, admin abilities in the policy (`adminUpdate`…), would keep every rule in one file at the cost of a policy serving two audiences.

**The table reuses the model's scopes:** search is `Exercise::search()` (so "panca" finds "Panca piana" with the panel in English, aliases included, [D3.4.6](../design/D3-data-model.md#d346-searching)), the default order `orderByName()`, the muscle filter `withPrimaryMuscle()`.

| Filter | Shows |
|---|---|
| Equipment, Primary muscles, Logged as | As in the app |
| To review in | Exercises whose Italian, Spanish or German is still machine translated: `whereJsonContains('machine_translated', 'it')` |
| Source | free-exercise-db, our extras (`AtleoPlan_…`), or created in the panel (no `external_id`) |
| Deleted | Without, with, only; a deleted exercise has Restore |

**One tab per language.** A plain `TextInput::make('name')` on a translated column would edit only the current locale. Each tab's fields sit in a `Group` with `statePath('translations.it')`, so the form state holds every language apart:

```php
Tab::make('Italiano')->schema([
    Group::make([
        TextInput::make('name'),
        TagsInput::make('aliases'),
        Textarea::make('description'),
        Repeater::make('instructions')->simple(Textarea::make('step')),
        Toggle::make('reviewed'),                   // not on English
    ])->statePath('translations.it'),
    Section::make('English original')->collapsed(), // on the edit page, for comparison
]),
```

The pages fill and save through `SavePublicExercise::formState()` / `update()` / `create()` instead of Filament's column mapping (`mutateFormDataBeforeFill()`, `handleRecordUpdate()`, `handleRecordCreation()`).

| Save rule (`SavePublicExercise`) | Why |
|---|---|
| Each language written as its tab shows it; an emptied language loses its text | The form is the whole truth: `replaceTranslations()`, since `setTranslation()` would keep the emptied language |
| **Reviewed by a person** off adds the language to `machine_translated`; on removes it | The import's flag ([C2.14.4](#c2144-the-translation-of-the-library)) is cleared by a person, language by language |
| Never English, nor an empty language, in `machine_translated` | English is the original; an empty language has nothing to review |
| A new exercise has its switches on | The admin wrote it |
| A muscle in both lists stays primary | As in the import |
| Only public exercises | `update()` on a personal one throws |

`search_text` follows through the model's `saving` event ([C2.6](#c26-database-migrations-models-factories-seeders)).

**Photos** use the official `filament/spatie-laravel-media-library-plugin` field, which writes the `photos` collection itself after the record is saved (`saveRelationships()`), so files never pass through `SavePublicExercise`. Previews and the table column use `thumb` ([C2.5.9](#c259-the-photos-of-an-exercise)).

```php
SpatieMediaLibraryFileUpload::make('photos')
    ->collection('photos')
    ->multiple()->reorderable()->maxFiles(ExercisePhotos::MAX)
    ->image()->acceptedFileTypes(['image/jpeg', 'image/png', 'image/webp'])->maxSize(10 * 1024)
    ->conversion('thumb')
```

### C2.8.3 The users screen

`/admin/users`, `app/Filament/Resources/Users/`: role, linked Google account, status, sign-up date; search by name and email; filters by role and status.

**List only.** Admins do not create accounts (people sign up), edit names, emails or passwords (users do, on Profile), or delete accounts (phase 2, [D3.7.4](../design/D3-data-model.md#d374-deleting-an-account-an-action-in-the-code)). There are no create or edit pages, and `getAuthorizationResponse()` allows only `viewAny` and `view`: with no `UserPolicy`, Filament would allow everything.

**Four confirmed row actions:** **Make admin**, **Remove admin**, **Disable**, **Enable**, each shown only when meaningful, all through `ChangeUserAccess`.

**Never on yourself:** one wrong click would lock the admin out, and with a single admin, everyone. The actions are hidden on the admin's own row (marked "You") and `ChangeUserAccess` throws if asked anyway.

**Disabling acts at once:** the next request signs the user out ([C2.7.9](#c279-a-disabled-account-is-signed-out-at-once)).

### C2.8.4 The way in: a link, and Google on the panel's login

**Where the panel is.** Laravel serves it at `/admin` on its own address: **http://localhost:8500/admin** in development. Vite forwards `/api`, `/sanctum`, `/storage` and `/auth/`, not `/admin`, because a Filament page also loads scripts, styles and Livewire requests from other paths. In production Caddy forwards `/admin` too, so the panel is on the app's address.

**Already signed in.** Same `web` session, and cookies go to the same **host name** whatever the port: signed in on `localhost:5673`, `localhost:8500/admin` opens directly. `127.0.0.1:8500` is another host name, so it shows the login page.

**The link in the app.** `GET /api/user` sends `admin_url` to admins (`null` otherwise), from `config('app.admin_url')` / `ADMIN_URL` (`http://localhost:${APP_PORT}/admin` in `compose.yaml`; the app's address + `/admin` in production). The backend knows where the panel is; the React app would need its own setting for the same fact ([C1.13.8](C1-frontend.md#c1138-the-link-to-the-admin-panel)).

**Google on the panel's login page,** for admins who signed up with Google and have no password:

```php
->renderHook(PanelsRenderHook::AUTH_LOGIN_FORM_AFTER, fn () => view('filament.google-sign-in'))
```

The view links to `/auth/google/redirect?to=admin&locale=it` with `<x-filament::button>`, only when Google is configured. `GoogleSignInController` keeps `admin: true` in the session for the callback, then:

| Back from Google | Lands on |
|---|---|
| An admin, signed in | The panel, `ADMIN_URL` |
| A non-admin, signed in anyway | The React app's Home, rather than the panel's 403 |
| An error | The panel's login page with `?google_error=disabled`, shown above the button in the page's language |

Only the literal `admin` is read from `to`, never an address (open redirect, C2.7.8); only the four known `google_error` values are shown.

---

## C2.9 Queues and jobs

- **Queued today:** medialibrary's photo conversions ([C2.5.9](#c259-the-photos-of-an-exercise)); video conversion comes with videos ([D2.5](../design/D2-decisions.md#d25-photos-and-videos)).
- **The queue is a Postgres table** (`QUEUE_CONNECTION=database`): no extra service to run or host.
- **The worker** is the `queue` container (`queue:listen --tries=3 --timeout=300`), which reloads code per job; failures go to `failed_jobs`.
- **Tests run jobs synchronously** (`QUEUE_CONNECTION=sync` in `phpunit.xml`).

---

## C2.10 Configuration and .env

- **`backend/.env`** holds this machine's values and secrets and is not committed. **`.env.example`** lists every variable with harmless values and a comment: what it does, who reads it, whether `compose.yaml` or the tests override it, and whether the app uses it at all (Redis, S3 and Memcached are skeleton defaults, unused).
- **`compose.yaml` wins over `.env`.** The app name, `FRONTEND_URL` (links in emails), `ADMIN_URL`, and the database, mail, queue and Sanctum settings for Docker are set in `x-backend.environment`, and Laravel never overwrites a variable already in the environment. Hence a SQLite line left in `.env` has no effect.
- **`APP_KEY`** encrypts cookies and sessions; changing it signs everyone out.

Inspecting the configuration in use and clearing caches: [H2.11](../how-to/H2-backend.md#h211-finding-out-what-is-going-on).

---

## C2.11 Tests with Pest

- **`tests/Feature/`**, by area (`Auth`, `ExerciseLibrary`, `Plans`, `Workouts`, `Admin`), goes through HTTP: every endpoint, forbidden cases included ([P1.2](../project/P1-conventions.md#p12-code)), plus the actions called directly. **`tests/Unit/`** holds pure classes (`SearchText`).
- **The test database** is `atleoplan_test`, forced in `phpunit.xml` and guarded by `TestDatabaseTest` ([S1.6](../start/S1-setup.md#s16-the-backends-configuration)); `RefreshDatabase` gives each test empty tables.
- **Query counts are asserted** where they matter: a whole plan, a page of the exercise list.
- **Emails** are faked with `Notification::fake()`; `LanguageTest` reads the `array` mailer to check the real text per language.
- **Datasets** have named keys, so failures read as sentences: `with data set "a link that is not YouTube"`.
- **`tests/Feature/ExerciseLibrary/`** is the reference for an API with permissions: the list and its filters, the other endpoints with each refusal, the action without HTTP. **`tests/Feature/Admin/`** drives the panel's pages as Livewire components.

---

## C2.14 Artisan commands of our own

Four commands build the public exercise library, in this order under `make exercises-import`: `exercises:import` from free-exercise-db ([C2.14.3](#c2143-the-free-exercise-db-import)), `exercises:correct-logging-types` ([C2.14.6](#c2146-the-logging-types-corrected-after-the-import)), `exercises:import-extra` ([C2.14.5](#c2145-the-extra-exercises)), `exercises:translate` ([C2.14.4](#c2144-the-translation-of-the-library)). Make targets: [H1.8](../how-to/H1-database.md#h18-the-exercise-librarys-data).

### C2.14.1 A command class

- **The command does I/O; an action holds the rules.** The command reads files, loops, shows progress and a summary; the rules for one exercise live in `ImportFreeExercise`, `TranslateExercise`, `CorrectLoggingType`, which tests call directly ([C2.5.3](#c253-actions-the-work-outside-the-controller)).
- **One transaction per item:** a failing exercise is rolled back alone, listed at the end, and the command exits non-zero, so `make` stops.
- **Idempotent:** a second run changes nothing already right and never undoes an admin's work.

### C2.14.2 Testing a command

Through `$this->artisan()` (output and exit code), on a small dataset written to the system temp folder, with `Storage::fake('public')` for photos (`ImportFreeExerciseTest.php`). `ImportExtraExercisesTest` imports the real `extra-exercises.json`, so a bad entry fails CI.

### C2.14.3 The free-exercise-db import

**Source.** [free-exercise-db](https://github.com/yuhonas/free-exercise-db), public domain: `dist/exercises.json` with 876 exercises and `exercises/<id>/0.jpg`, `1.jpg`, 1,746 photos (start and end position, 98 MB). `make exercises-import` clones it once into `backend/storage/app/free-exercise-db` (git-ignored).

**Mapping** (`ImportFreeExercise`):

| Source | Becomes | Notes |
|---|---|---|
| `id` (`Barbell_Bench_Press`) | `external_id` | How a second run finds the exercise |
| `name`, `instructions` | English `name`, `instructions` | HTML tags and empty steps removed; other languages from C2.14.4 |
| `level`, `category` | `level`, `category` | Kept, not shown yet |
| `equipment` (`e-z curl bar`, or null) | `equipment_id` | By slug: `Str::slug('e-z curl bar')` is `EquipmentSeeder`'s `e-z-curl-bar` |
| `primaryMuscles`, `secondaryMuscles` | `exercise_muscle` with role | By slug; a muscle in both lists stays primary |
| `images` | the `photos` collection, in order | The first is the cover |
| (none) | `logging_type` | Guessed: stretching and cardio → time; body only or no equipment → reps; else weight and reps (637 / 137 / 102). Known wrong guesses are corrected afterwards (C2.14.6) |
| `force`, `mechanic` | not kept | [D3.4.7](../design/D3-data-model.md#d347-what-is-not-in-the-table) |

**Re-running** never duplicates and never undoes an admin's work:

| The exercise is… | Default | With `--update` |
|---|---|---|
| Not in the library | Created | Created |
| Already there | Left as it is | English texts, level, category, equipment and muscles refreshed; other languages, logging type and photos kept |
| Soft-deleted by an admin | Left deleted | Left deleted |
| Without photos (an interrupted run, or `--without-photos`) | Photos added | Photos added |

**Photos are stored as the source's JPEGs** and get their two WebP conversions like any photo ([C2.5.9](#c259-the-photos-of-an-exercise)), synchronously inside the command.

### C2.14.4 The translation of the library

free-exercise-db is English only. Italian, Spanish and German translations of the 876 names and 3,738 steps are **repository files**, `backend/database/data/exercise-translations/{it,es,de}.json`, written into the database by `exercises:translate`.

**Files, not a translation service per import:** the translations are part of the app like the seeders' muscle names: versioned, reviewed in pull requests, identical on every machine, free to reapply after `make fresh`. A service would need a key, cost money per run and could return different text each time.

**Provenance.** Machine translated with an LLM under one style guide (the names gym-goers use in each country, "Panca piana", "Press de banca", "Bankdrücken"; the informal *tu*/*tú*/*du* the app uses; muscles and equipment named as in the seeders; exactly one translated step per English step), validated by script, and flagged as machine translated until a person reviews each language.

```json
"Upright_Barbell_Row": {
  "name": "Tirate al mento con bilanciere",
  "aliases": ["rematore alto", "upright row"],
  "instructions": ["Afferra un bilanciere con presa prona un po' più stretta della larghezza delle spalle. …", "…"]
}
```

`aliases` are other names people search for in that language ([D3.4.6](../design/D3-data-model.md#d346-searching)), the English name included for those who know it.

| Rule (`TranslateExercise`) | Why |
|---|---|
| Only the target language changes: `setTranslation('name', 'it', …)` | English and the other languages stay; `replaceTranslations()` ([C2.5.4](#c254-the-exercise-librarys-endpoints)) would drop them |
| An existing translation is kept, unless `--force` | It may have been corrected in the panel |
| Steps must match the English one for one | A different count means a translation of another version of the text (e.g. after `exercises:import --update`): refused, listed at the end |
| The language joins `machine_translated` | Not reviewed until a person says so in the panel ([C2.8.2](#c282-the-exercise-library-screen); [D2.3](../design/D2-decisions.md#d23-exercise-library)) |
| Soft-deleted exercises are translated too | Ready if restored |

`--locale=it` limits to one language; `--force` rewrites and so undoes manual corrections, meant for after a fix to the files themselves.

### C2.14.5 The extra exercises

free-exercise-db covers weights and machines well and calisthenics barely (no frog stand, front lever, burpees, dead hang). The project's own public exercises are in **`backend/database/data/extra-exercises.json`**, added by `exercises:import-extra`.

**Same shape as the dataset, same action:** `ImportFreeExercise` imports them with C2.14.3's rules, reading two extra keys when present:

```json
{
  "id": "AtleoPlan_Frog_Stand",
  "name": "Frog Stand",
  "aliases": ["crow pose", "frog balance"],
  "level": "beginner", "category": "strength", "equipment": "body only",
  "loggingType": "time",
  "primaryMuscles": ["shoulders"], "secondaryMuscles": ["triceps", "abdominals", "forearms"],
  "instructions": ["Squat down and place your hands flat on the floor…", "…"],
  "images": []
}
```

| Key | Why |
|---|---|
| `id` prefixed `AtleoPlan_` | Never collides with a dataset id, now or after an update |
| `aliases` | English alternative names, which the dataset lacks |
| `loggingType` | Stated, not guessed: a frog stand is bodyweight, which the guess would log as reps, but it is held for time |
| `images: []` | No photos yet; lists show a placeholder |

Their translations are entries in the same `exercise-translations` files (C2.14.4). There are 21: calisthenics staples missing from the dataset (chest-to-bar and L-sit pull-ups, frog stand, ice cream maker, dead hang, chest-to-wall handstand, burpees, front lever, full bridge, shoulder dislocates, shoulder opener, two-arm kettlebell swing, L-sit, toes-to-bar, back lever, tuck planche, hollow body hold, pike push-up, archer pull-up, skin the cat, dragon flag).

**Adding one** means a new entry in the four files; `ImportExtraExercisesTest` imports the real file, so an unknown muscle, a misspelt logging type or a missing translation fails there.

### C2.14.6 The logging types corrected after the import

The import's guess (C2.14.3) is wrong for a few exercises: a plank is bodyweight, so it is guessed as reps, but it is held for time; with reps a plan cannot say "3 × 30 s plank". The right types are listed in **`backend/database/data/logging-type-corrections.json`** and applied by `exercises:correct-logging-types`.

```json
{ "id": "Plank", "from": "reps", "to": "time", "why": "Held as long as possible, on the forearms" }
```

`id` is the `external_id`; `from` is the type the import guesses (the correction applies only to an exercise still on it); `why` documents the entry, since JSON has no comments.

| The exercise is… (`CorrectLoggingType`, in order) | Then | Why |
|---|---|---|
| Absent or soft-deleted | Nothing | An import with `--limit`, or an admin's choice |
| Already on `to` | Nothing | Idempotent |
| On a third type | Kept | An admin chose it in the panel |
| Used in a plan or a workout, corrected from a type counted in reps to `time`, with a weight in a set | Kept, and named in the summary | A time records no weight ([D3.6.3](../design/D3-data-model.md#d363-logged_sets)): the kilograms would be lost |
| The same, with no weight | Changed, with its sets | Whoever used it wrote as reps the seconds they meant |
| Used in a plan or a workout, any other pair | Kept, and named in the summary | No conversion keeps the sets' meaning, and a workout with the old values would be refused on resend |
| Otherwise | Changed to `to` | |

**The sets of a used exercise,** in one transaction with its type. A plank in a plan as "3 × 30" was meant as 30 seconds, so every plan set's reps target moves to `target_duration_seconds` (the top of a range: "20–30" becomes 30 s) and loses its effort target, which a time has not; its plan items lose `for_time`; every logged set's `reps` moves to `duration_seconds`, except in a set done as fast as possible, which keeps the seconds it has. A weight of 0 counts as none. The sets of soft-deleted workouts are converted too, as they can be brought back. The plans touched get `version` + 1, so a draft started before is saved with the warning that the plan changed elsewhere ([D3.5.7](../design/D3-data-model.md#d357-when-a-plan-is-changed-in-two-places)); a workout still waiting on a phone with the old reps is refused when sent. The summary counts the plans and workouts changed.

**The list:** nine, all to `time`: Plank, Side Bridge, the two isometric neck exercises, Isometric Chest Squeezes, Mountain Climbers, Balance Board, Downward Facing Balance, Battling Ropes; selected by searching the instructions for "hold", "seconds" and "as long as", then checked one by one. Excluded on purpose:
- **Push Up to Side Plank** stays reps: its instructions say "for 10 or more reps".
- **Weighted holds and carries** (Plate Pinch, Crucifix, Farmer's Walk, Yoke Walk, sleds) are wrong as weight and reps too, but `time` and `distance` record no weight, so correcting them would lose the kilograms: [DATA-4](../project/backlog.md#data-4-weighted-holds-and-carries-have-no-fitting-logging-type).

**A separate command, not a better guess:** the guess reads only category and equipment, and a plank and a crunch share both, so a list of names is needed anyway. A separate command also reaches a library imported before the list existed, which the import, leaving existing exercises alone, never would.

---

← [C1. Frontend](C1-frontend.md) · [Contents](../README.md) · [H1. Database: how to](../how-to/H1-database.md) →
