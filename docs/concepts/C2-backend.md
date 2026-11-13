# C2. Backend

How the Laravel backend in `backend/` works, written for someone who knows little PHP or Laravel and wants to read the code and change it with confidence. Read [C2.1](#c21-the-pieces)–[C2.4](#c24-the-life-of-a-request) once, in order: they explain the pieces and the path a request takes. The other sections explain one topic each, and [C2.12](#c212-recipes) holds the step-by-step recipes to keep open while coding.

**New to Laravel itself?** [L1. Laravel course](../learn/L1-laravel.md) teaches the framework lesson by lesson, keeping apart what is Laravel and what this project adds; this page is about how the app is built with it.

Every PHP file starts with a comment saying what it is and points to the section of this page that explains its concepts ([P1.2](../project/P1-conventions.md#p12-code)). The choices behind the stack are in [D2.2](../design/D2-decisions.md#d22-stack); the setup in [S1.6](../start/S1-setup.md#s16-creating-the-laravel-backend); the React side in [C1. Frontend](C1-frontend.md).

## Contents

- [C2.1 The pieces](#c21-the-pieces)
- [C2.2 PHP you will meet](#c22-php-you-will-meet)
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

| Piece | What it is | In this project |
|---|---|---|
| **PHP 8.4** | The programming language. A PHP program runs once per web request: it reads the request, does its work, prints the answer and ends. | Runs inside the `backend` Docker container, never directly on your computer ([S1.2](../start/S1-setup.md#s12-prerequisites)). |
| **Composer** | PHP's package manager, like npm for JavaScript. It reads `composer.json`, downloads the packages into `vendor/`, and records the exact versions in `composer.lock`. | `make composer c="require vendor/package"` |
| **Laravel 13** | A framework: the ready-made structure of a web application (routing, database, authentication, queues, emails, tests). You write the parts specific to the app; Laravel calls them at the right moment. | All of `backend/` |
| **Artisan** | Laravel's command-line tool (`php artisan …`). It generates files, runs migrations, opens a console, lists routes. | `make artisan c="route:list"` ([C2.13](#c213-artisan-and-composer-commands)) |
| **FrankenPHP** | The web server: it receives HTTP requests and hands them to PHP. It is the Caddy web server with PHP built in. | The `backend` container, port 8500 on your computer |
| **PostgreSQL** | The database where everything is stored. | The `postgres` container. Development data lives in `atleoplan`, tests in `atleoplan_test`. |
| **Sanctum** | Laravel's authentication for single-page apps (cookies) and mobile apps (tokens): recognises the signed-in user on every request. | [C2.7](#c27-signing-in-sanctum) |
| **Fortify** | Laravel's sign-in backend: the routes and logic of signing up, in and out and resetting a password, with no screens. | `config/fortify.php`, [C2.7](#c27-signing-in-sanctum) |
| **Filament** | A package that builds an admin panel out of PHP classes, with no frontend code to write. | http://localhost:8500/admin ([C2.8](#c28-admin-panel-filament)) |
| **Pest** | The testing tool: small files that call the app and check the answers. | `make test` ([C2.11](#c211-tests-with-pest)) |

---

## C2.2 PHP you will meet

PHP syntax as it appears in this project. A line in the code that looks strange is probably in this table.

| Syntax | Meaning | Example |
|---|---|---|
| `<?php` | Start of PHP code. Every `.php` file begins with it. | |
| `$name` | A variable: every variable starts with `$`. No `let` or `const`. | `$user = User::first();` |
| `;` | Ends every statement. Unlike our TypeScript, PHP requires it. | |
| `[1, 2]`, `['a' => 1]` | Arrays. The same type serves as a list and as a map of key → value. | `['status' => 'ok']` |
| `->` | Reaches a property or a method of an object (`.` in JavaScript). | `$request->user()` |
| `::` | Reaches something of the class itself, not of one object: a static method or a constant. | `Route::get(...)`, `User::query()` |
| `Foo::class` | The full name of a class as a string (`'App\Models\User'`). Laravel uses it to refer to classes without creating them. | `User::class` |
| `namespace App\Models;` | The "folder" a class belongs to. Its full name becomes `App\Models\User`, so two classes called `User` cannot clash. | top of every class file |
| `use Illuminate\Support\Facades\Route;` | Imports a class by its full name, so the file can write just `Route`. Like `import` in TypeScript. | |
| `class A extends B` | A is a kind of B: it inherits B's methods and may override some. | `class User extends Authenticatable` |
| `implements I` | The class promises to have the methods listed by the interface I. | |
| `use HasFactory;` **inside** a class | A **trait**: a bundle of methods copied into the class. The same keyword as an import, in a different place. | `use HasFactory, Notifiable;` |
| `public`, `protected`, `private` | Who may use a method or property: anyone; the class and its children; the class only. | |
| `function f(int $x): string` | Typed parameters and return value; PHP checks them while running. `?string` means "string or null". `: void` returns nothing. | `public function up(): void` |
| `fn () => …` | A short anonymous function returning one expression (JavaScript's arrow function). | `fn () => response()->json([...])` |
| `function () use ($x) { … }` | A longer anonymous function. `use` lists the outside variables it may read. | |
| `name: value` in a call | A named argument, for readability. | `configure(basePath: dirname(__DIR__))` |
| `#[Something(...)]` | An **attribute**: a label on a class or method that Laravel reads to configure it. | `#[Fillable(['name', 'email'])]` |
| `?->`, `??` | Null-safe call (skipped if the left side is null); "this, or that if null". | `$user?->name ?? 'guest'` |
| `"Hi {$name}"`, `'a' . 'b'` | Interpolation works only in double quotes; `.` joins strings (not `+`). | |
| `===` | Strict equality (same value **and** type). Prefer it to `==`. | |
| `__DIR__` | The folder of the current file. | `dirname(__DIR__)`, the parent folder |
| `return new class extends Migration { … };` | An anonymous class, created and returned on the spot. Laravel's migrations are written this way. | |

**Laravel's global helpers** are functions available everywhere, with no import:
- `response()->json([...])` builds a JSON answer;
- `env('KEY')` reads `.env`, but only inside `config/` ([C2.10](#c210-configuration-and-env));
- `config('app.name')` reads a configuration value;
- `now()` gives the current date and time;
- `dd($x)` ("dump and die") prints a value and stops, useful while debugging.

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
│   (to come: Jobs background work)
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

**Files to know about but not use.** `backend/package.json` and `backend/vite.config.js` are Laravel's own pipeline for CSS and JavaScript in Blade pages. AtleoPlan's interface is the separate React app in `frontend/`, and Filament ships its own compiled assets, so those two files are unused.

**Convention over configuration.** Laravel finds things by their name and place, without registration:
- a `User` model reads the `users` table;
- the `UserFactory` belongs to `User`;
- a test class must sit in `tests/`.

Following the conventions means writing less configuration.

---

## C2.4 The life of a request

What happens, step by step, when the React app calls `GET /api/health`:

1. **The browser** sends the request to Vite (`localhost:5673`). Vite's proxy forwards it to the `backend` container ([C1.1](C1-frontend.md#c11-the-pieces)). In production, Caddy does the same job.
2. **FrankenPHP**, the web server in the container, serves the `public/` folder. The path is not a real file, so it hands the request to **`public/index.php`**: every request goes through this one file (the "front controller").
3. `index.php` loads Composer's **autoloader**: from then on, any class is loaded the moment it is first used. Then it loads **`bootstrap/app.php`**, which builds the Laravel **application**. Building it means:
   - telling it where the routes are (`withRouting`);
   - adding **middleware**, layers every request crosses on its way in and out, such as Sanctum's `statefulApi()`;
   - saying how errors become answers: JSON for `/api/*`.
4. The **service providers** listed in `bootstrap/providers.php` run. They register services and configure packages; for example, `AdminPanelProvider` sets up Filament.
5. The request crosses the **middleware**. For `/api` routes, these:
   - start the session when the request comes from the React app;
   - check the CSRF token on requests that change data;
   - refuse visitors not signed in, on routes that require it.
6. The **router** compares the method and path with the routes in `routes/`, finds `Route::get('/health', …)` in `routes/api.php` (whose routes all start with `/api`), and calls its function.
7. The function returns `response()->json(['status' => 'ok'])`. Laravel turns it into an HTTP response, with status 200, the header `Content-Type: application/json`, and the JSON body.
8. The response crosses the middleware back, which may add cookies or headers, and goes to the browser.

In development the whole sequence restarts from scratch on every request, so a code change is live on the next request without restarting anything.

**Why it is still fast: OPcache.** PHP compiles each file into instructions before running it. **OPcache**, a part of PHP, keeps those compiled files in memory, so a file used by the previous request is not read and compiled again. Step 3 alone uses nearly a thousand files, 96% of them Composer's packages in `vendor/`. To notice a saved change, OPcache checks a file's date again once two seconds have passed since the last check (`opcache.revalidate_freq`, 2 in development). On a normal disk, a thousand such checks cost nothing.

**Why `vendor/` lives in a Docker volume.** Docker Desktop runs Linux in a virtual machine, on the Mac and on Windows. `./backend`, mounted into the container, is a folder shared between the two systems, and every date check crosses from one to the other. After a pause, a request paid a thousand of them: over a second, against a tenth of a second right after another request. So `compose.yaml` puts `vendor/` in a **named volume**, a folder on the virtual machine's own disk. The app's code stays shared and live; the packages, changed only by Composer, are read at Linux's speed. The `backend/vendor/` folder on the computer becomes a copy for the editor, refreshed by Composer after every change. How it was measured and built: [H2.18](../how-to/H2-backend.md#h218-a-fast-local-backend-the-packages-in-a-volume-as-built); why this and not another fix: [D2.10](../design/D2-decisions.md#d210-local-development).

**When something breaks,** Laravel writes the error and its stack trace to `storage/logs/laravel.log`. For an API call, it also answers with JSON describing the error, while `APP_DEBUG` is on in development.

---

## C2.5 Routes and controllers

**A route** connects a method and a path to the code that answers:

```php
Route::get('/health', fn () => response()->json(['status' => 'ok']));   // routes/api.php
```

- **Where:** routes in `routes/api.php` get the `/api` prefix and the API middleware. Those in `routes/web.php` are for HTML pages; we use them only for Laravel's welcome page and Filament.
- **Methods:** `Route::get`, `post`, `put`, `patch`, `delete`. They follow REST: `GET` reads, `POST` creates, `PATCH` updates, `DELETE` removes.
- **Parameters:** `Route::get('/plans/{plan}', …)` passes the `{plan}` part to the code. With a model in the function's signature (`function (Plan $plan)`), Laravel loads that record from the database and answers 404 if it does not exist. This is called "route model binding".
- **Protection:** `->middleware('auth:sanctum')` answers 401 to visitors who are not signed in ([C2.7](#c27-signing-in-sanctum)).
- **Seeing them all:** `make routes`.

**A controller** is a class that holds the code of related routes, used as soon as that code is more than one line:

```php
Route::get('/exercises', [ExerciseController::class, 'index']);   // calls ExerciseController::index()
```

Our rule for an endpoint ([P1.2](../project/P1-conventions.md#p12-code)): **the controller stays thin**. It does three things:
1. asks a **policy** whether the user may act (`$this->authorize('update', $plan)`);
2. lets a **Form Request** validate the input, which answers 422 with one message per invalid field when the input is not valid;
3. calls the code that does the work and returns an **API Resource**, a class that decides the JSON shape of a model.

The rules themselves live in services or actions, tested without HTTP. The smallest real example is `CurrentUserController`, with `UpdatePreferencesRequest` and `UserResource`: it needs no policy, because it only touches the user asking. The complete one is `ExerciseController`, explained in the four sections below; [C2.12](#c212-recipes) has the recipe, and [H2.12](../how-to/H2-backend.md#h212-the-exercise-library-api-as-built) how it was built. `PlanController` is the second, for data shaped as a tree: a plan with its days, exercises and sets, saved in one request ([C2.5.5](#c255-the-plans-endpoints), [C2.5.6](#c256-validating-nested-data)). `WorkoutSessionController` is the third, for data sent by a phone that may be offline ([C2.5.7](#c257-the-workouts-endpoints)).

### C2.5.1 Permissions: policies

A **policy** is a class of yes/no answers about one model, one method per action. Laravel finds it by name: `ExercisePolicy` for `Exercise`, in `app/Policies/`. Each method receives the signed-in user, then the row:

```php
public function update(User $user, Exercise $exercise): bool
{
    return $exercise->isOwnedBy($user);        // only my own; a public one gets a 403
}
```

The controller asks with `Gate::authorize('update', $exercise)`. A `false` stops the request with a **403**, and the rest of the method never runs. Creating has no row yet, so the class is passed instead: `Gate::authorize('create', Exercise::class)`, and the method has only `$user`.

| Action | `ExercisePolicy` says yes when |
|---|---|
| `view` | The exercise is public, or mine |
| `create` | Always: a new exercise is always personal |
| `update`, `delete` | It is mine. A public one is refused, to admins too: they edit public exercises in the admin panel, whose screen has rules of its own ([C2.8.2](#c282-the-exercise-library-screen)) |

**A list does not ask row by row.** Calling the policy for each of 800 exercises would mean loading them all first. The list uses a **query scope** that holds the same rule as `view`, written as SQL: `Exercise::visibleTo($user)` ([C2.6](#c26-database-migrations-models-factories-seeders)). The two must agree, and the tests check both.

**403 or 404 for someone else's exercise?** We answer 403: the exercise exists, and you may not see it. Answering 404 would hide even that it exists, which matters when ids can be guessed and their existence is a secret; here it is not.

### C2.5.2 Lists: filters and pages

A list endpoint takes its options from the **query string**, the part of the URL after `?`. The library's list uses [spatie/laravel-query-builder](https://spatie.be/docs/laravel-query-builder), which reads the `filter[...]` parameters and applies only those it was told to accept:

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
- **Commas split a value** into several: `chest,triceps` becomes two arguments of the scope. A search must not be split, hence `delimiter('')`.
- **The values** are checked by a Form Request (`ListExercisesRequest`), which answers 422 to `filter[source]=everyone` or `per_page=500`. On a `GET`, a Form Request's rules read the query string.
- **`paginate()`** runs two queries, the page's rows and the total count. The answer carries the rows in `data`, the URLs of the first, previous, next and last pages in `links`, and `current_page`, `last_page`, `per_page` and `total` in `meta`. `withQueryString()` keeps the filters in those URLs.

**N+1 queries.** Reading `$exercise->muscles` on each exercise of a page would run one query per exercise: 1 for the list, plus N. `with([...])` loads the relation for the whole page in one query. In the API Resource, `$this->whenLoaded('muscles', …)` uses the relation only if it was loaded, and otherwise leaves the key out: a forgotten `with()` shows up as a missing key, not as a slow page.

### C2.5.3 Actions: the work outside the controller

An **action** is a small class that does one job of the app: `SavePersonalExercise` creates and changes a personal exercise. It lives in `app/Actions/`, and it is a plain class, created with `make artisan c="make:class Actions/Exercises/SavePersonalExercise"`: Laravel has no special base class for it.

The controller receives it as a parameter, and Laravel's **service container** builds it ("dependency injection"):

```php
public function store(StoreExerciseRequest $request, SavePersonalExercise $save): ExerciseResource
{
    Gate::authorize('create', Exercise::class);
    $exercise = $save->create($request->user(), $request->validated());

    return new ExerciseResource($exercise->load(['equipment', 'muscles']));
}
```

**Why not in the controller:**
- a test can call it directly, without HTTP (`app(SavePersonalExercise::class)->create($user, [...])`, in `tests/Feature/ExerciseLibrary/SavePersonalExerciseTest.php`);
- another caller can reuse it, such as an Artisan command or an import.

**`DB::transaction(fn () => …)`** groups the writes: the exercise and its muscles are saved together, or not at all.

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

**Photos are paths, not full URLs.** medialibrary builds a photo's URL from `APP_URL`, which inside the container is `http://localhost:8000`, while the browser reaches Laravel at `localhost:8500`, through Vite at 5673: a full URL would point to the wrong place. `ExercisePhotoResource` keeps only the path, `/storage/1/conversions/0-large.webp`, which works wherever the React app is, since its server forwards `/storage` to Laravel (Vite in development, Caddy in production), and keeps the photos on the app's own address for the offline cache to come. `public/storage` must be a link to `storage/app/public`: `make setup` creates it with `storage:link`, and `make artisan c="storage:link"` does on a clone made before. The controller loads `media` with the other relations, so the photos add one query per page, not one per exercise.

**What is sent to create or change one** (`StoreExerciseRequest`): `name` (required, up to 100 characters), `aliases` and `instructions` (lists of texts), `description`, `logging_type`, `equipment_id`, `youtube_url` (a YouTube address), and `muscles`, a list of `{ "id": 6, "role": "primary" }`. A change sends only the fields that change. `muscles`, when sent, is the complete list: muscles left out are removed.

**One language per personal exercise** ([D2.4](../design/D2-decisions.md#d24-languages)). The texts are stored under the request's language and replace any other: an exercise written in Italian, then edited with the app in English, becomes English. Otherwise the old Italian name would come back on switching the app to Italian again.

Each photo has two addresses, a large and a small copy; uploading, ordering and removing them, and Duplicate as mine: [C2.5.9](#c259-the-photos-of-an-exercise).

### C2.5.5 The plans' endpoints

The workout plans' API, all under `auth:sanctum` ([D1.4.6](../design/D1-ui.md#d146-plan-list)–[D1.4.8](../design/D1-ui.md#d148-plan-editor)). A plan is only ever seen by its owner (`PlanPolicy`). How it was built, step by step: [H1.13](../how-to/H1-database.md#h113-the-plan-tables-as-built) for the tables, [H2.13](../how-to/H2-backend.md#h213-the-plans-api-as-built) for the API.

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

**Actions as routes of their own.** `apiResource` gives the five routes that create, read, update and delete. Activating and archiving are none of those, so each gets a verb after the plan's address and `POST`, since it changes something. The alternative, `PATCH /api/plans/{id}` with `{"archived": true}`, would mix them into the whole-plan save, which has its own rules.

**A whole plan in JSON**, as `PlanResource` sends it (from tinker, [H2.13.7](../how-to/H2-backend.md#h2137-look-at-the-json)):

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
- **Days and items keep their UUIDs; sets do not.** The workout sessions of FEAT-3 will point to days and items, so a save updates them in place, by id, and an item can even move to another day. Nothing points to a set, so the sets are deleted and inserted again, which is simpler than working out which one changed.
- **The version.** `SavePlan` reads it with `lockForUpdate()`, which adds `for update` to the query: Postgres makes any other save of the same plan wait until this one ends, so two saves arriving together cannot both read 4. When the editor started from an older version, the save still goes through (the last change wins) and `meta.changed_elsewhere` tells the app to warn ([D3.5.7](../design/D3-data-model.md#d357-when-a-plan-is-changed-in-two-places)).
- **A create can be sent twice.** The ids are UUIDs made on the device ([D3.2.1](../design/D3-data-model.md#d321-which-kind-of-id)). If the answer to `POST` is lost and the device sends it again, the controller finds a plan of this user with that id and answers 200 with it, writing nothing. The same id on someone else's plan is a 422.

**The active plan** is `users.active_plan_id`, one cell, so two plans can never be active at once ([D3.3](../design/D3-data-model.md#d33-users-and-preferences)). `activate` sets it with `$user->activePlan()->associate($plan)->save()`; `PlanPolicy::activate()` checks what the column cannot: that the plan is mine and not archived. Archiving the active plan empties it, and deleting it empties it by itself, through the foreign key's `nullOnDelete()`.

**What is not checked:** that a set's targets fit how the exercise is logged (a weight on a timed plank, say). The editor shows only the fields that make sense, and a stray value does no harm.

### C2.5.6 Validating nested data

A plan arrives as a tree: a plan has days, a day has items, an item has sets. A Form Request reaches every level with **`.*`**, "each item of the list":

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

**An abstract base class for two requests.** `StorePlanRequest` and `UpdatePlanRequest` share the tree's rules through `PlanRequest`, an `abstract` class: never used by itself, it leaves one method, `planId()`, to the two classes that extend it. The update answers "the plan in the URL"; the create answers "the plan with the id sent". `...parent::rules()` spreads the shared rules into each class's own array.

**A rule of our own.** "The exercises of a superset are next to each other, and there are at least two" is not one of Laravel's rules. `make artisan c="make:rule SupersetsAreNeighbours"` creates `app/Rules/SupersetsAreNeighbours.php`, with one method:

```php
public function validate(string $attribute, mixed $value, Closure $fail): void
{
    // $value: one day's list of items, since the rule is on 'days.*.items'
    // … when something is wrong:
    $fail('validation.superset_neighbours')->translate();
}
```

It is used like any rule: `'days.*.items' => ['present', 'array', new SupersetsAreNeighbours]`. `$fail()` refuses the value, and `->translate()` reads the message from `lang/*/validation.php` in the request's language. English needs the message too, in `lang/en/validation.php`, since Laravel's own file does not have it.

**Three behaviours that matter here**, all met while building it ([H2.13.5](../how-to/H2-backend.md#h2135-the-traps-of-nested-validation)):

- **`unique` and `exists` are skipped once an earlier rule of the field has failed.** A day id `"day-1"` fails `uuid`, and Laravel does not run the `unique` query, which Postgres would answer with an error ("invalid input syntax for type uuid"), not with a "no". The order of the rules is what matters: `uuid` before `unique`.
- **`validated()` keeps a list only through its items' validated fields.** A set sent as `{}` has no field with a rule, so the list `sets: [{}]` vanished from the validated data. Hence `set_type` is required.
- **An id checked against "this plan" trusts what "this plan" is.** On a create, the days' ids are checked against the plan with the id sent; if that id is someone else's, the request is refused on `id` anyway.


### C2.5.8 A plan as a file

Export and import ([D3.5.8](../design/D3-data-model.md#d358-the-plan-file)): two endpoints of `PlanController`, an action each, `ExportPlan` and `ImportPlan` (`app/Actions/Plans/`), and a Form Request, `ImportPlanRequest`. How they were built: [H3.26](../how-to/H3-frontend.md#h326-plan-files-export-and-import-as-built).

**Export answers plain JSON,** `response()->json($export->export($plan))`, not a resource: the file has its own shape, with no `data` around it, and is sent back as it is. `ExportPlan` walks days and items, gives each exercise a reference the first time it meets it (`??=`), and lists the exercises once each at the end.

**Import reuses what saves plans and exercises.** `ImportPlan` finds or creates each exercise used, with `SavePersonalExercise` for the missing ones, then hands the plan to `SavePlan::create()` in the editor's own shape, with the references turned into exercise ids. All inside one `DB::transaction()`: the two actions open their own, which Laravel turns into **savepoints** of the outer one, so a failure anywhere undoes everything. The constructor receives the two actions from the service container:

```php
public function __construct(
    private SavePlan $savePlan,
    private SavePersonalExercise $saveExercise,
) {}
```

`private` in a constructor's parameters (**constructor property promotion**, PHP 8) declares the property and assigns it in one line.

**The rules are the editor's,** under `plan.`: `PlanRequest::itemRules($prefix)`, a `static` method shared by both, gives the rules of an item and its sets for any prefix, `'days.*.items.*.'` in the editor, `'plan.days.*.items.*.'` here. `static` because it needs no request: only the prefix. An item names `"exercise": "e1"`, checked with `Rule::in($refs)`, the references the file declares, read from the body before validation (`$this->input('exercises')`).

**Answered with a status set by hand.** A resource answers 201 only when it wraps a model it saw being created; here the plan was created inside the action, so `->response()->setStatusCode(201)`.

### C2.5.7 The workouts' endpoints

The first part of FEAT-3: the server side of workout mode and Home ([D1.4.2](../design/D1-ui.md#d142-home), [D1.4.9](../design/D1-ui.md#d149-workout-mode)), on the tables of [D3.6](../design/D3-data-model.md#d36-workouts). How it was built: [H2.14](../how-to/H2-backend.md#h214-the-workouts-api-as-built).

| Method and path | What it does | Answers |
|---|---|---|
| `PUT /api/sessions/{uuid}` | Saves a whole workout, new or not | 201 new; 200 saved again; 410 deleted elsewhere; 403 someone else's; 422 |
| `GET /api/sessions` | My workouts, the most recent first, 20 per page, each with its totals. `?status=open` or `finished` | 200; 422 |
| `GET /api/sessions/{uuid}` | One whole workout: exercises, sets, totals; in `meta.last_sets`, last time for each of its exercises, before it (FEAT-4) | 200; 403; 404, also when deleted |
| `DELETE /api/sessions/{uuid}` | Deletes it, softly | 204; 403 |
| `GET /api/sessions/last-sets?exercises=12,40` | For each exercise, the sets of the last finished workout in which it was done | 200; 422 |
| `GET /api/home` | Home in one request: the active plan's days with an estimated duration, the suggested day, the day done last, the workout left open, the finished workouts of the last 8 days | 200 |

**Why a `PUT` to the session's own address, and no `POST`.** The phone makes the session's UUID when Start is tapped, possibly offline ([D3.2.1](../design/D3-data-model.md#d321-which-kind-of-id)). Sending it is "put this session at this address": the first time creates it (201), every later time replaces it (200). `PUT` is the HTTP method that means exactly this, and it is safe to repeat: the phone's queue can resend after a lost answer without making a second workout. `{session}` is not loaded by route model binding, since there may be no row yet; `whereUuid('session')` on the route answers 404 to anything that is not a UUID.

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
- **A deleted session stays deleted.** Its row stays, soft-deleted ([D3.7.3](../design/D3-data-model.md#d373-deleting-a-session-a-soft-delete)), so a late send finds it and answers **410 Gone**: the session is gone for good, and the phone's queue reads this as done. D3.6.5's sketch returned silently; a status the phone can read is better.
- **Exercises and sets are a whole list each, as for a plan.** An exercise taken out or a set unticked on the phone is simply not sent, and its row is deleted. Unlike a plan's sets, a logged set has a UUID made on the phone and is updated in place.
- **The values fit how the exercise is logged** ([D3.6.3](../design/D3-data-model.md#d363-logged_sets)): reps for `weight_reps` and `reps`, each with a weight that may be left empty (a set with the body alone; the added weight of a weighted pull-up) and seconds that may be given (the time of reps done as fast as possible, since `feat/for-time`), a time or a distance. Two constants of `SaveSessionRequest` say it, `REQUIRED_BY_LOGGING` and `OPTIONAL_BY_LOGGING`; any other value field must be empty. The rule spans two tables, which a check constraint cannot see, so the Form Request checks it in an `after()` method, which Laravel calls after the rules with the validator, to add errors of its own ("The weight field does not fit how this exercise is logged.").
- **Moments are stored in UTC.** The phone sends `2026-11-09T18:00:00+01:00`. Laravel writes a date as `Y-m-d H:i:s`, without the offset, so the moment was stored as 18:00 UTC, an hour late, until the action turned every moment into UTC first ([H2.14.5](../how-to/H2-backend.md#h2145-the-trap-of-the-moments)).

**Totals, worked out by the database** ([D3.8](../design/D3-data-model.md#d38-computed-never-stored)). The list, a whole session and Home's recent workouts carry `exercises_done`, `sets_done`, `reps_done` and `volume_kg` (weight × reps), warm-ups excluded. The screens show reps, not `volume_kg`: a workout's volume adds up unlike exercises and counts nothing done with the body alone ([D2.8](../design/D2-decisions.md#d28-workout-rules)); it stays in the answer, exact, for later uses per exercise. The scope `WorkoutSession::withTotals()` adds them as subqueries of the `SELECT`, so a page of 20 sessions is still one query, and the sum is exact. The resource sends them with `whenHas()`, only when the query added them. `volume_kg` is text with three decimals, like every weight.

**Last time** (`last-sets`, and `meta.last_sets` of a whole workout): for each exercise, the sets of the last finished, not deleted workout of this user in which it had at least one set, in any plan ([D3.6.4](../design/D3-data-model.md#d364-how-the-screens-use-these-tables)). One action, `FindLastSets`, serves both: `last-sets` asks for the latest of all, for workout mode's "Last" column; a whole workout asks for those **before it** (`$before`), for history's comparison exercise by exercise, so a workout opened weeks later is compared with what came before *it*. How it was built: [H2.14.9](../how-to/H2-backend.md#h2149-later-last-time-before-a-workout-feat-4). Two queries for any number of exercises; the first uses Postgres's `distinct on (exercise_id, timed)`, which keeps the first row of each exercise and kind among rows sorted newest first. **The kind** is whether one of the sets has seconds: an exercise counted in reps and done as fast as possible ("50 in 1:12", a plan item's `for_time`) has its own last time, apart from the days it was done for reps ([D3.6.4](../design/D3-data-model.md#d364-how-the-screens-use-these-tables)). `distinct on` must repeat the first expressions of `order by`, so the kind, an `exists (…)` subquery, is written in both. How it was built: [H3.25.2](../how-to/H3-frontend.md#h3252-the-backend-a-column-a-rule-and-last-time-of-each-kind).

**Home** (`HomeSummary`), from the real development database with Day A done yesterday:

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

`feat/exercise-media` ([D2.5](../design/D2-decisions.md#d25-photos-and-videos), [D1.4.5](../design/D1-ui.md#d145-exercise-editor)): the photos of personal exercises, uploaded from the app; their smaller copies; Duplicate as mine. The public exercises' photos are managed in the admin panel ([C2.8.2](#c282-the-exercise-library-screen)). How it was built, with the real output: [H2.17](../how-to/H2-backend.md#h217-the-photos-of-an-exercise-as-built).

**medialibrary in four ideas.** spatie/laravel-medialibrary keeps files for models:
1. A file is a **row of `media`**, linked to its model (`model_type`, `model_id`) and to a **collection**, here `photos`; `order_column` is the order, the first is the cover.
2. The file itself is on a **disk**, `public` (`storage/app/public/<media id>/photo.jpg`), served at `/storage/...` through the `public/storage` link.
3. **Conversions** are copies the package makes of each file, declared in the model's `registerMediaConversions()`; they go in `<media id>/conversions/`, and the row's `generated_conversions` records which exist.
4. Conversions are **queued** by default: a job of the `queue` container makes them a moment later, so the upload answers at once.

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

**Migrations** describe the database's structure as code. Each file in `database/migrations/` does one step:
- `up()` makes the change, such as creating a table;
- `down()` undoes it.

Laravel records which migrations have run, in the `migrations` table, and `make migrate` runs only the new ones. This way every computer and the server end up with the same structure.

```php
Schema::create('plans', function (Blueprint $table) {
    $table->uuid('id')->primary();                 // primary key "id", a UUID created on the device (D3.2)
    $table->foreignId('user_id')->constrained();   // must point to an existing users.id
    $table->string('name');                        // varchar(255), required
    $table->text('notes')->nullable();             // may be empty (NULL)
    $table->timestamps();                          // created_at and updated_at, filled by Laravel
});
```

Tables with a number as their id use `$table->id()`, a `bigint` that grows by itself. Which table uses which, and every table's columns, is in [D3. Data model](../design/D3-data-model.md).

- **A migration that has run is never edited.** A change is a new migration (`make artisan c="make:migration add_x_to_plans_table"`). Editing an old one would leave databases that already ran it out of step.
- **The file name starts with a date and time,** and that decides the order.
- **The commands:**
  - `make migrate` runs the new migrations;
  - `make fresh` empties the database and runs everything again, with the seeders;
  - `make artisan c="migrate:status"` shows which migrations have run.

**Eloquent models** are PHP classes that each stand for one table. An object of the class stands for one row:

```php
$user = User::find(1);                       // SELECT … WHERE id = 1
$user->name = 'Ale'; $user->save();          // UPDATE
User::where('email', $email)->first();       // query builder: SQL as PHP calls
$plan->days;                                 // a relation: the plan's days (another query)
```

- **The table name follows from the class name:** `User` reads `users`, and `PlanDay` would read `plan_days`.
- **`#[Fillable([...])]`** lists the columns that may be filled from a request's data in one go (`User::create($data)`). Any other column is ignored, so a request cannot set `is_admin`. This is protection against "mass assignment".
- **`#[Hidden([...])]`** lists the columns never included when the model is turned into JSON, such as `password`.
- **`casts()`** converts columns when they are read or written: `'email_verified_at' => 'datetime'` gives a date object, and `'password' => 'hashed'` hashes the password when it is set.
- **`$attributes`** gives a new model its default values. The table has its own defaults, but a model just created does not read them back, so without this a column would be `null` until the row is loaded again (`app/Models/Exercise.php`).

**Relations** are methods that say how a table is linked to another. Once one is written, `$exercise->muscles` reads the linked rows, with no SQL. Laravel works out the table and the column names from the class names. The exercise library has the three kinds ([D3.4](../design/D3-data-model.md#d34-exercise-library)):

| Kind | Where | Read as |
|---|---|---|
| **belongsTo**: this table has the column pointing to the other | `Exercise::equipment()`, `Exercise::owner()` | "an exercise belongs to one kind of equipment" |
| **hasMany**: the other table points here | `Equipment::exercises()`, `User::exercises()` | "a kind of equipment has many exercises" |
| **belongsToMany**: a pivot table in between holds the pairs | `Exercise::muscles()`, `Muscle::exercises()` | "an exercise works many muscles, a muscle is worked by many exercises" |
| **hasManyThrough**: skips a level in between | `Plan::items()`, through the days | "a plan has many items, through its days": one query with a join |

```php
$exercise->equipment->name;                  // the equipment's name (one more query)
$user->exercises()->create([...]);           // with (): a query, here creating with owner_id filled in
$exercise->muscles()->attach($chest, ['role' => MuscleRole::Primary]);   // adds a pivot row
$muscle->pivot->role;                         // a column of the pivot row, as an enum
```

- **The pivot's own columns**, such as `role`, are loaded only when listed with `withPivot('role')`.
- **A cast on a pivot column** needs a small *pivot class* (`ExerciseMuscle extends Pivot`), named on the relation with `using()`.
- **When the column's name does not follow the convention**, it is given: `belongsTo(User::class, 'owner_id')`, because Laravel would look for `user_id`.
- **Setting a belongsTo** without touching the column by hand: `$user->activePlan()->associate($plan)->save()` fills `active_plan_id`; `->dissociate()` empties it.
- **An order inside the relation**, `hasMany(PlanDay::class)->orderBy('position')`, applies to every read of it, eager loading included.
- **Loading levels in one go:** `$plan->load(['days.items.sets'])` follows the dots, one query per level for all the rows ([C2.5.5](#c255-the-plans-endpoints)).

**Query scopes** are named pieces of a query, written on the model and used like any query method:

```php
#[Scope]
protected function visibleTo(Builder $query, User $user): void
{
    $query->where(fn (Builder $q) => $q->whereNull('owner_id')->orWhere('owner_id', $user->id));
}

Exercise::visibleTo($user)->search('panca')->orderByName()->get();   // scopes chain
```

- **`#[Scope]`** turns the protected method into one callable on the model or on a query, without the `$query` argument: Laravel passes it.
- **The function in `where(fn …)`** becomes a parenthesis in SQL: `(owner_id is null or owner_id = 5)`. Without it, the `or` would mix with the conditions added after.
- **`toRawSql()`** in tinker shows the SQL a chain of scopes produces ([H2.12.3](../how-to/H2-backend.md#h2123-scopes-the-sql-they-write)).
- **The older form**, still common in examples, is a public method named `scopeVisibleTo(…)`, called as `visibleTo(…)`. Both work.

`Exercise` has six: `visibleTo`, `search`, `withPrimaryMuscle`, `usingEquipment`, `fromSource` and `orderByName`.

**Traits that change how a model behaves**, added with `use` inside the class:

- **`HasUuids`**: the id is a UUID instead of a number. Laravel makes one (a UUIDv7) only when the id is empty, so one made on the device is kept; the plans' four tables use it, except `plan_sets` ([D3.2.1](../design/D3-data-model.md#d321-which-kind-of-id)). A `{plan}` in a URL that is not a UUID gets a 404 before any query.
- **`SoftDeletes`**: `delete()` fills `deleted_at` instead of removing the row, and every query leaves those rows out. `withTrashed()` brings them back, and `forceDelete()` removes the row for real. An exercise uses it, so that plans and history pointing to it keep working ([D3.7.2](../design/D3-data-model.md#d372-deleting-an-exercise-a-soft-delete)).
- **`HasTranslations`** (spatie/laravel-translatable): the columns listed in `$translatable` hold one value per language, as JSON. `$muscle->name` gives the current language's value. When that language is missing, it falls back to English, then to any language there is; this is set once in `AppServiceProvider` ([D3.4.5](../design/D3-data-model.md#d345-translations)).
- **`InteractsWithMedia`** (spatie/laravel-medialibrary), with `implements HasMedia`: files belong to the model, stored as rows of the `media` table, in named *collections* (`photos`, `videos`) declared in `registerMediaCollections()`. Attaching one: `$exercise->addMedia($path)->preservingOriginal()->toMediaCollection('photos')`, which copies the file to the media disk (`public`, `storage/app/public`); without `preservingOriginal()` the file is moved instead. Reading them: `$exercise->getMedia('photos')`, in their order. The import does both ([C2.14.3](#c2143-the-free-exercise-db-import)).

**Model events.** Eloquent fires an event around every write of a model: `saving` before each insert or update, `saved` after it, `creating`, `updating`, `deleting` and others. A model registers what to do in its static `booted()` method, which Laravel calls once, the first time the class is used:

```php
protected static function booted(): void
{
    static::saving(function (Exercise $exercise) {
        $exercise->search_text = SearchText::forExercise(
            $exercise->getTranslations('name'),
            $exercise->getTranslations('aliases'),
        );
    });
}
```

- **The function receives the model about to be written** and may change it: what it sets is saved with the rest, in the same query.
- **It runs whoever saves**: a controller, an action, an Artisan command, the admin panel, a factory in a test. That is the point of putting it on the model: `exercises.search_text` cannot be forgotten by a new piece of code ([D3.4.6](../design/D3-data-model.md#d346-searching)).
- **Only what goes through the model fires events.** `DB::table('exercises')->update(…)` and `Exercise::where(…)->update(…)` (a "mass update", one query for many rows) do not: they write the columns they are given and nothing else.
- **`saveQuietly()`** saves without firing any event, when that is wanted.
- **Larger cases** move the functions to an *observer* class (`php artisan make:observer`), attached with `#[ObservedBy(…)]`; one event on one model does not need it.

**A migration that writes data.** A migration usually changes structure only. When a new column must be filled for the rows already there, the same migration can do it after `Schema::table()`, reading and writing with the `DB` facade rather than the model: the model will keep changing over the years, and an old migration that uses it could break or behave differently when run on a new database. `2026_11_10_093058_add_search_text_to_exercises_table` is the first one ([H1.16](../how-to/H1-database.md#h116-the-search-text-as-built)).

How these were built step by step, with the real output: [H1.10](../how-to/H1-database.md#h110-the-exercise-library-as-built) for the exercise library, [H1.13](../how-to/H1-database.md#h113-the-plan-tables-as-built) for the plans.

**Factories** build fake but realistic records for tests: `User::factory()->create()` inserts a user with a random name and email. **Seeders** fill the database with starting data: the fixed lists the app needs (the 17 muscles and the 12 kinds of equipment) and the development account. `make fresh` runs them. The public exercise library is not a seeder but an Artisan command, `make exercises-import`, because it reads a dataset from outside, takes options and reports what failed ([C2.14](#c214-artisan-commands-of-our-own)); after `make fresh`, run it again. `DemoPlanSeeder` is development data only: two example plans for every user who has none, run by hand with `make plans-demo` after the import ([H3.13.1](../how-to/H3-frontend.md#h3131-plans-to-look-at)).

**Seeing the data:**
- `make psql` opens an SQL console;
- `make tinker` opens a PHP console with the whole app loaded, where you can type `User::count()`;
- any database program can connect at `localhost:5932` ([S1.4](../start/S1-setup.md#s14-ports)).

**Doing it in practice:** every command, what to write in each file, seeders, tinker and the common errors, on a real table followed from start to finish, are in [H1. Database: how to](../how-to/H1-database.md).

---

## C2.7 Signing in: Sanctum

Signing in is built from two packages that do different jobs. **Fortify** handles the moments that change who is signed in: signing up, in and out, resetting a password. **Sanctum** recognises the signed-in user on every request after that. Signing in with Google is a third way in, with **Socialite** and two routes of our own ([C2.7.8](#c278-signing-in-with-google)); after it, Sanctum sees a session like any other.

This section explains each step twice: **how this app does it with Fortify, and how the same step looks written by hand.** The app uses Fortify ([C2.7.6](#c276-fortify-or-by-hand) says why), so the by-hand code is not in the repository; it is here because it shows what Fortify does for us. It was run against the same scenarios as our tests, and it passes them. The React side is in [C1.13](C1-frontend.md#c113-signing-in-and-forms).

### C2.7.1 How a session works

HTTP has no memory: each request arrives knowing nothing about the one before. A **session** adds the memory:

1. When a user signs in, Laravel creates a row in the `sessions` table, with a long random id, and writes the user's id in it.
2. It sends that random id to the browser in a **cookie**, here named `atleoplan-session`.
3. The browser sends the cookie back with every request, by itself.
4. Laravel finds the session from the cookie, and from it the user: `$request->user()`.

**The password is never stored.** What is stored is a **hash**: the result of a one-way calculation, which cannot be turned back into the password. To check a password, Laravel hashes what was typed and compares the two results. `Hash::make()` makes a hash, and `Hash::check()` compares.

**Three protections work together:**

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

**Why cookies and not tokens for the web app:** a token kept in JavaScript can be stolen by injected code, and an `HttpOnly` cookie cannot. It all works because the React app and the API share one address ([D2.6](../design/D2-decisions.md#d26-hosting)).

**The mobile app (phase 3)** will use **API tokens** sent in a header (`Authorization: Bearer …`) instead, with the `HasApiTokens` trait on the `User` model; their table, `personal_access_tokens`, already exists.

**Where the routes are.** Fortify's are under `/api/auth`, set by `prefix` in `config/fortify.php`. Not plain `/login`, for two reasons: `/login` is a React page, and Vite and Caddy forward only `/api` to Laravel ([C1.1](C1-frontend.md#c11-the-pieces)).

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

**With Fortify.** The route and the controller are Fortify's. We add one piece, in `app/Providers/FortifyServiceProvider.php`: how to check the password, because this app also refuses disabled accounts.

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

**By hand:**

```php
// routes: the web middleware gives the session, cookies and CSRF protection
Route::middleware('web')->prefix('api/auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:login');
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth');
});

// in AuthController
public function login(Request $request): Response
{
    $credentials = $request->validate([
        'email' => ['required', 'string', 'email'],
        'password' => ['required', 'string'],
    ]);
    // Postgres compares text exactly: ANN@x.com would not find ann@x.com
    $credentials['email'] = Str::lower($credentials['email']);

    // Finds the user, checks the hash and starts the session, all in one call.
    // The second argument is "remember me": a long-lived cookie
    if (! Auth::attempt($credentials, $request->boolean('remember'))) {
        throw ValidationException::withMessages(['email' => __('auth.failed')]);
    }

    if (Auth::user()->disabled_at !== null) {
        Auth::logout();
        throw ValidationException::withMessages(['email' => __('auth.disabled')]);
    }

    // A new session id, so one planted before signing in becomes useless
    // ("session fixation"). Easy to forget, and nothing visibly breaks without it
    $request->session()->regenerate();

    return response()->noContent();
}

public function logout(Request $request): Response
{
    Auth::guard('web')->logout();              // forgets the user
    $request->session()->invalidate();         // empties the session
    $request->session()->regenerateToken();    // a new CSRF token

    return response()->noContent();
}
```

**A detail worth noticing in both:** a wrong password and an unknown email get the same message. A different one would let anyone find out who has an account.

### C2.7.3 Signing up

**With Fortify.** We write only what is specific to this app, in `app/Actions/Fortify/CreateNewUser.php`: which fields are required, and how to create the user. Fortify calls it, signs the new user in, and answers 201.

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

**By hand,** the same rules, plus what Fortify does around them:

```php
public function register(Request $request): Response
{
    // Before validating, so `unique` compares the lowercase form
    $request->merge(['email' => Str::lower((string) $request->input('email'))]);

    $data = $request->validate([
        'name' => ['required', 'string', 'max:255'],
        'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
        // confirmed: a password_confirmation field must match
        'password' => ['required', 'string', Password::default(), 'confirmed'],
    ]);

    // Only fields in the model's #[Fillable] are written, so is_admin cannot be
    // slipped in. The `hashed` cast on the model hashes the password
    $user = User::create($data);

    Auth::login($user);
    $request->session()->regenerate();

    return response()->noContent(201);
}
```

### C2.7.4 Slowing down password guessing

A **rate limiter** counts requests and answers 429 above a limit. Ours allows 5 attempts a minute for one email from one address.

**With Fortify,** it is defined in `FortifyServiceProvider`, and `config/fortify.php` names it, so Fortify puts it on its login route:

```php
RateLimiter::for('login', function (Request $request) {
    $throttleKey = Str::transliterate(Str::lower((string) $request->input('email')).'|'.$request->ip());

    return Limit::perMinute(5)->by($throttleKey);
});
```

**By hand,** the same definition, and `->middleware('throttle:login')` on the route, as in [C2.7.2](#c272-signing-in-and-out).

The key counts the email *and* the address, so an attacker cannot lock someone out from elsewhere by trying their email on purpose.

### C2.7.5 Forgot password

There are two requests, joined by an email:

1. **Asking.** Laravel creates a random **token**, stores its hash in `password_reset_tokens`, and emails a link holding the token.
2. **Setting.** The link opens the React screen `/reset-password`. It sends the token, the email and the new password. Laravel checks the token, saves the password and deletes the token, so the link works once. A token expires after 60 minutes (`config/auth.php`).

**With Fortify,** both controllers are Fortify's. We provide two things:

- **What to do with the new password,** in `app/Actions/Fortify/ResetUserPassword.php`.
- **Where the link points.** By default Laravel links to a page of its own, which we do not have, and the email would fail with "route not found". In `FortifyServiceProvider`:

```php
ResetPassword::createUrlUsing(fn (User $user, string $token): string => sprintf(
    '%s/reset-password?token=%s&email=%s',
    config('app.frontend_url'),            // FRONTEND_URL (C2.10)
    $token,
    urlencode($user->email),               // keeps a + in an address intact
));
```

**By hand,** that same link setting, and the **password broker**, Laravel's tool for tokens:

```php
public function sendResetLink(Request $request): JsonResponse
{
    $request->validate(['email' => ['required', 'email']]);

    // Creates the token and sends the email; answers with a status, not an exception
    $status = Password::sendResetLink(['email' => Str::lower($request->input('email'))]);

    if ($status !== Password::RESET_LINK_SENT) {
        throw ValidationException::withMessages(['email' => __($status)]);
    }

    return response()->json(['message' => __($status)]);
}

public function resetPassword(Request $request): JsonResponse
{
    $data = $request->validate([
        'token' => ['required'],
        'email' => ['required', 'email'],
        'password' => ['required', 'string', Password::default(), 'confirmed'],
    ]);
    $data['email'] = Str::lower($data['email']);

    // Checks the token, then calls this function, then deletes the token
    $status = Password::reset($data, function (User $user, string $password) {
        $user->forceFill([
            'password' => Hash::make($password),
            // Signs out any device holding the old "remember me" cookie
            'remember_token' => Str::random(60),
        ])->save();

        event(new PasswordReset($user));
    });

    if ($status !== Password::PASSWORD_RESET) {
        throw ValidationException::withMessages(['email' => __($status)]);
    }

    return response()->json(['message' => __($status)]);
}
```

The password facade here is `Illuminate\Support\Facades\Password`, while in the validation rules `Password::default()` is `Illuminate\Validation\Rules\Password`. They share a name, so a real file would import one under another name, with `as`.

**Known limit:** an unknown email gets a 422, so this form reveals who has an account, as signing up also does. It is noted in [BE-3](../project/backlog.md#be-3-harden-the-public-sign-in-routes), to deal with before the app opens to the public.

### C2.7.6 Fortify or by hand

Both work, and the by-hand code above is not long. The difference is in who answers for the details:

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

**What `fortify:install` generated, and what was removed.** It publishes migrations and actions for every feature. The migrations for two-factor and passkeys and the actions for changing profile and password were deleted, with those features off in `config/fortify.php`: no empty columns or unused code. Each comes back with its feature.

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

"Continue with Google" ([FEAT-9](../design/D1-ui.md#d141-sign-in-and-onboarding)) uses **OAuth**, the standard way for a site to ask another (Google) "who is this person?" without ever seeing their Google password. **Laravel Socialite**, Laravel's official package for it, knows Google's addresses and answers; what to do with the answer is ours, in `app/Actions/Auth/SignInWithSocialAccount.php`. How it was built: [H2.15](../how-to/H2-backend.md#h215-sign-in-with-google-as-built); the table: [D3.3.1](../design/D3-data-model.md#d331-social_accounts).

**The journey.** It is made of browser visits, not `fetch()` calls: the browser itself goes to Google and back.

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
2. **The address belongs to an account** made with a password: Google is linked to it, its plans kept. Decided with the owner: the other choice, refusing and asking to sign in with the password, was clumsier.
3. **A new address:** a new account, no password, the language the app was showing.

Cases 2 and 3 need `email_verified`. A disabled account is refused in all three, before anything is linked.

**Started from the admin panel** (`?to=admin`), the same journey ends on the panel, or back on its login page with the error ([C2.8.4](#c284-the-way-in-a-link-and-google-on-the-panels-login)).

**Errors go back to the React app as a code,** `/login?error=cancelled|failed|unverified|disabled` (`app/Enums/SocialSignInError.php`): a redirect cannot carry a JSON body. The action throws `SocialSignInRefused` with the reason, so its checks can stop it from anywhere without an `if` at every level; the controller catches it. Anything unexpected (Google unreachable, a wrong secret, a stale `state`) is `failed`, with the details in the log through `report()`.

**An account without a password.** `users.password` is nullable: someone who signed up with Google has none. `Hash::check()` never matches an empty hash, so the password form refuses them like a wrong password; Forgot password sets one, and both ways then work.

**Not with Fortify.** Fortify has no social sign-in; the two routes are ours, short, and use the same session and guard (`web`), so to Sanctum a user signed in with Google looks exactly like one signed in with a password.

**By hand, without Socialite,** the callback would: compare `state` with the session's; POST the `code`, the client id and secret and the redirect URI to `https://oauth2.googleapis.com/token`; read `access_token` from the answer; GET `https://www.googleapis.com/oauth2/v3/userinfo` with it. Socialite is those steps, plus the same for a dozen other providers, which is what makes Apple later a driver rather than a rewrite.

### C2.7.9 A disabled account is signed out at once

An admin disables an account in the panel ([C2.8.3](#c283-the-users-screen)), which fills `users.disabled_at`. Signing in was already refused to such an account, with a password (`FortifyServiceProvider`) and with Google (C2.7.8). What was missing: someone **already signed in** keeps a valid session cookie, and with "remember me" would stay in for weeks.

**The middleware `SignOutDisabledAccount`** (`app/Http/Middleware/`) runs on every request of the `web` and `api` groups. When the session's user has `disabled_at` set, it signs them out, with the same three steps as signing out (C2.7.2), and lets the request go on as a visitor's:

| The request | What happens next |
|---|---|
| A route behind `auth:sanctum` (almost all of `/api`) | 401. The React app reads a 401 as "the session has ended" and opens the sign-in page (`frontend/src/lib/query-client.ts`); signing in again says "This account has been disabled." Nothing changed in the frontend |
| A public route (`/api/health`, the sign-in routes) | Answered as for any visitor |
| The admin panel | Not concerned: `canAccessPanel()` already refuses a disabled admin at every request |

**It must run before authentication.** Laravel sorts a route's middleware by a **priority list**, whatever order the groups add them in: the session first, then authentication (`auth:sanctum`, whose class implements the `AuthenticatesRequests` interface), then the others. A middleware not in the list stays after all those in it, so this one, merely appended to the groups, ran after `auth:sanctum` had let the user in, and the request was answered as theirs. `bootstrap/app.php` puts it in the list, right before authentication:

```php
$middleware->web(append: [SignOutDisabledAccount::class]);
$middleware->api(append: [SignOutDisabledAccount::class]);
$middleware->prependToPriorityList(AuthenticatesRequests::class, SignOutDisabledAccount::class);
```

The order a route really gets is shown by `$router->gatherRouteMiddleware($route)`, in tinker ([H2.16.5](../how-to/H2-backend.md#h2165-the-middleware-and-the-priority-list)).

**Why a middleware and not deleting the sessions.** Sessions live in the `sessions` table, and their rows have a `user_id`: deleting the user's rows at Disable would sign them out too. But the middleware also covers a session that is not in that table (a test's, or another driver's), needs nothing to happen at Disable, and holds whatever sets the column, tinker or TablePlus included.

---

## C2.8 Admin panel: Filament

Filament builds the admin panel from PHP classes. You describe a table's columns and a form's fields in PHP, and Filament draws the pages, the search, the filters and the validation.

- **The panel** is configured in `app/Providers/Filament/AdminPanelProvider.php`: path `/admin`, login page, colours, and where to look for resources. Open http://localhost:8500/admin. It is served directly by Laravel, not through the React app.
- **A resource** is the admin screen for one model: its list, its form and its pages, in `app/Filament/Resources/<Name>/`. `make artisan c="make:filament-resource Exercise"` creates one; `--generate` also writes fields and columns from the table's. Two exist: the public exercise library (BE-1, [C2.8.2](#c282-the-exercise-library-screen)) and the users (BE-2, [C2.8.3](#c283-the-users-screen)); how they were built: [H2.16](../how-to/H2-backend.md#h216-the-admin-panel-as-built).
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

A Filament page is a **Livewire** component: after the first load, each click that changes something (a filter, a sort, Save) is a small request to `/livewire/update`, which re-renders only that component. Those requests do not pass through the panel's middleware list, only through the middleware marked persistent; without `isPersistent`, the page would load in Italian and come back in English at the first filter.

**Labels as methods.** A resource's names are read from methods, `getModelLabel()`, `getNavigationLabel()`, not from properties: a property's value is fixed when the class is loaded, before the middleware has set the language.

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

**Its own permissions.** Filament asks the model's policy before each action, when the policy has the method. `ExercisePolicy::update()` and `delete()` refuse public exercises to everyone, admins included, because the API must: through the React app's editor, an admin would rewrite a public exercise in one language. The panel is already for admins only, so the resource answers for itself, overriding `getAuthorizationResponse()`: everything on a public exercise, nothing on a personal one, and never `forceDelete` (plans and workouts point to exercises: [D3.7.2](../design/D3-data-model.md#d372-deleting-an-exercise-a-soft-delete)). Decided with the owner; the other way was a second set of abilities in the policy (`adminUpdate`…), one file for every rule but a bigger policy.

**The list reuses the model's scopes.** The search box calls `Exercise::search()`, so "panca" finds "Panca piana" with the panel in English, aliases included ([D3.4.6](../design/D3-data-model.md#d346-searching)); the default order is `orderByName()`; the muscle filter is `withPrimaryMuscle()`. The filters:

| Filter | Shows |
|---|---|
| Equipment, Primary muscles, Logged as | As in the app's library |
| To review in | The exercises whose Italian, Spanish or German is still machine translated: `whereJsonContains('machine_translated', 'it')` |
| Source | free-exercise-db, our extras (`AtleoPlan_…`), or created in the panel (no `external_id`) |
| Deleted | Without, with, or only the deleted ones; a deleted exercise opens and has Restore |

**The form, one tab per language.** Filament's `TextInput::make('name')` on a translated column would edit only the current language. Each tab's fields sit in a `Group` with `statePath('translations.it')`, so the form's state holds every language apart:

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

**The photos** (`feat/exercise-media`) are a section of the form with the field of the official plugin **filament/spatie-laravel-media-library-plugin**, `SpatieMediaLibraryFileUpload`: upload, preview, drag into order, remove, with the app's limits (5, 10 MB, JPEG, PNG, WebP). It reads and writes the exercise's `photos` collection itself, so the files never pass through `SavePublicExercise`: Filament saves the field after the exercise, with `saveRelationships()`, on the create page too. Its previews and the list's column show the small copy, `thumb` ([C2.5.9](#c259-the-photos-of-an-exercise)).

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

**Only the list.** An admin does not create accounts (people sign up), edit names, emails or passwords (each user does on Profile), nor delete accounts (phase 2, [D3.7.4](../design/D3-data-model.md#d374-deleting-an-account-an-action-in-the-code)). The generated create and edit pages were removed, and `getAuthorizationResponse()` allows only `viewAny` and `view`: there is no `UserPolicy`, and without one Filament allows everything.

**Four actions on a row,** in a ⋮ menu, each with a window to confirm that says what will happen: **Make admin**, **Remove admin**, **Disable**, **Enable**, each shown only when it makes sense. They are **custom actions**: `Action::make('disable')` with a label, an icon, `requiresConfirmation()`, and a closure that calls the action `ChangeUserAccess`.

**Never on yourself.** An admin cannot remove their own role nor disable their own account: one wrong click would lock them out, and, if they are the only admin, everyone. The buttons are hidden on the admin's own row (marked "You"), and `ChangeUserAccess` throws if asked anyway. Another admin can do it.

**Disabling acts at once:** the user's next request signs them out ([C2.7.9](#c279-a-disabled-account-is-signed-out-at-once)).

### C2.8.4 The way in: a link, and Google on the panel's login

**Where the panel is.** Not inside the React app: Laravel serves it, at `/admin` of its own address. In development that is **http://localhost:8500/admin**; Vite (port 5673) forwards `/api`, `/sanctum`, `/storage` and `/auth/` to Laravel, not `/admin`, because a Filament page also loads its own scripts, styles and Livewire requests from other paths. In production Caddy forwards `/admin` too, and the panel is on the app's address.

**Already signed in.** The panel uses the same session as the app (the `web` guard), and a browser sends a cookie to the same **host name** whatever the port: signed in on `localhost:5673`, `localhost:8500/admin` opens at once. Not on `127.0.0.1:8500`: another host name to the browser, so no cookie, and the panel's login page.

**The link in the app.** `GET /api/user` sends `admin_url`, the panel's address, to an admin, and `null` to anyone else; Profile shows an **Administration** card with **Open** only when it is there ([C1.13.8](C1-frontend.md#c1138-the-link-to-the-admin-panel)). The address is a setting, `config('app.admin_url')`, from `ADMIN_URL`: `http://localhost:8500/admin` in `compose.yaml` (with `APP_PORT` if changed), the app's address + `/admin` in production. The backend gives it because it knows where the panel is; the React app would need a setting of its own for the same fact.

**Google on the panel's login page.** Filament's login asks for an email and a password, and an admin who signed up with Google has no password. Under its form, a **render hook** adds "Continue with Google": a named place in Filament's pages where an app inserts HTML, here a Blade view:

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

Some work is too slow to do while the user waits, such as converting a video with ffmpeg ([D2.5](../design/D2-decisions.md#d25-photos-and-videos)) or sending an email. That work goes on a **queue**:

1. The code creates a **job**, a class in `app/Jobs/` with a `handle()` method doing the work, and **dispatches** it: `ConvertVideo::dispatch($media)`. Dispatching only saves a row in the `jobs` table and returns at once.
2. The **worker**, which is the `queue` container running `php artisan queue:listen`, takes the jobs one at a time and runs them.
3. A job that fails is retried, up to 3 times (`--tries=3` in `compose.yaml`). After that it lands in the `failed_jobs` table. `make artisan c="queue:failed"` lists them, and `make artisan c="queue:retry all"` tries them again.

**Where the queue lives:** in development the queue is a table in Postgres (`QUEUE_CONNECTION=database`), so there is no extra service to run. In tests, jobs run immediately (`QUEUE_CONNECTION=sync` in `phpunit.xml`).

**Seeing it work:** `make logs s=queue` shows what the worker is doing.

---

## C2.10 Configuration and .env

- **`config/*.php`** hold every setting, grouped by area (`database.php`, `mail.php`, `queue.php`…). Each value reads an environment variable with a default: `'default' => env('QUEUE_CONNECTION', 'database')`. Code reads settings with `config('queue.default')`, never with `env()`, because `env()` returns nothing once the configuration is cached.
- **`backend/.env`** sets the variables for this computer. It holds secrets, so it is never committed and never shown (an assistant must not read it). **`.env.example`** lists every variable with harmless values, and it is committed; each one has a comment saying what it does, who reads it, whether `compose.yaml` or the tests set it otherwise, and whether the app uses it at all (Redis, S3 and Memcached are Laravel's defaults, left unused). A new variable goes in both files, with its comment in `.env.example`.
- **Variables from `compose.yaml` win over `.env`.** The app's name, the frontend's address (`FRONTEND_URL`, for links in emails) and the database, mail, queue and Sanctum settings for Docker are set there (`x-backend.environment`), and Laravel never overwrites a variable that is already set. That is why `.env` may still mention SQLite without effect.
- **`APP_KEY`** in `.env` encrypts cookies and sessions. `create-project` generated it; changing it signs everyone out.
- **Useful commands:**
  - `make artisan c="config:show database"` shows the values actually in use;
  - `make clear` empties the caches when a change seems ignored.

---

## C2.11 Tests with Pest

A test is a small function that uses the app and checks the result. If someone later breaks that behaviour, the test fails and says where.

```php
it('answers ok without signing in', function () {        // the scenario, in words
    $this->getJson('/api/health')                       // a request, as the React app would send it
        ->assertOk()                                     // status 200
        ->assertExactJson(['status' => 'ok']);           // exactly this body
});
```

**The two folders:**
- **`tests/Feature/`** holds tests that go through HTTP: a request in, then checks on the status, the JSON, and the database (`$this->assertDatabaseHas('plans', [...])`). Most of our tests belong here. Every endpoint has one, including the forbidden cases, such as another user's plan answering 403 ([P1.2](../project/P1-conventions.md#p12-code)).
- **`tests/Unit/`** holds tests of one class or function, without HTTP.

**Writing tests:**
- **`expect($value)->toBe(…)`** is Pest's way to check a value; there are many matchers (`toBeTrue`, `toHaveCount`…).
- **Signing in inside a test:** `$this->actingAs(User::factory()->create())`.
- **The database:** tests run on `atleoplan_test`, never on the development data ([S1.6](../start/S1-setup.md#s16-creating-the-laravel-backend)). A test that writes to the database adds `uses(RefreshDatabase::class);` at the top of its file. Every test then starts from empty tables.
- **Datasets** run one test with several inputs: `it(…)->with([…])`, as in `tests/Feature/Auth/RegistrationTest.php`.
- **Emails:** `Notification::fake()` records them instead of sending, and `Notification::assertSentTo()` checks them. To see the real text, `tests/Feature/Auth/LanguageTest.php` reads what the `array` mailer received.

`tests/Feature/Auth/` is the model of an area's tests: signing in, signing up, resetting a password, the current user, languages, who may open the admin panel and the disabled accounts. `tests/Feature/Admin/` tests the panel's screens as Livewire components ([H2.16.6](../how-to/H2-backend.md#h2166-the-tests)). `tests/Feature/ExerciseLibrary/` is the model for an API with permissions: one file for the list and its filters, one for the other endpoints with each refusal, one for the action called without HTTP.

**Datasets** with `'a name' => [values]` keys show that name in the output, which reads better than the values themselves: `it refuses invalid data with data set "a link that is not YouTube"`.

**Running them:**
- `make test` runs them all;
- `make test f=Health` runs only the tests whose name matches;
- `make check` runs them together with the frontend's checks.

---

## C2.12 Recipes

The short versions. [H2. Backend: how to](../how-to/H2-backend.md) builds a real endpoint step by step, with the output of each command: reading and changing data, permissions, tests, an admin screen, a job, translated messages, settings, packages and the common errors.

**A new table with its model.** The short version; [H1.2](../how-to/H1-database.md#h12-a-new-table-from-start-to-finish) goes through it on a real table, with the output of each command.

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

**An admin screen:** `make artisan c="make:filament-resource Exercise --generate"`, then adjust its columns and fields ([C2.8](#c28-admin-panel-filament), as built: [H2.16](../how-to/H2-backend.md#h216-the-admin-panel-as-built)).

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

**Official documentation**, worth reading next to this page:
- Laravel: https://laravel.com/docs. The pages *Routing*, *Eloquent*, *Migrations*, *Validation*, *Authorization*, *Queues*, *Sanctum* and *Fortify* match the sections above; *Authentication* and *Resetting Passwords* cover the by-hand way of [C2.7](#c27-signing-in-sanctum).
- Filament: https://filamentphp.com/docs.
- Pest: https://pestphp.com/docs.
- PHP itself: https://www.php.net/manual.

---

## C2.14 Artisan commands of our own

Artisan's commands are not only Laravel's: an app can add its own, for work that is not a web request, such as an import, a clean-up, or a task run every night. The first one in this project is `exercises:import`, which fills the public exercise library from free-exercise-db; the second, `exercises:translate`, writes its Italian, Spanish and German texts ([C2.14.4](#c2144-the-translation-of-the-library)); then `exercises:import-extra` adds exercises of our own ([C2.14.5](#c2145-the-extra-exercises)) and `exercises:correct-logging-types` puts right the import's wrong guesses ([C2.14.6](#c2146-the-logging-types-corrected-after-the-import)). How they were built and run: [H1.12](../how-to/H1-database.md#h112-the-free-exercise-db-import-as-built) and [H1.14](../how-to/H1-database.md#h114-the-translation-of-the-library-as-built).

### C2.14.1 A command class

A command is a class in `app/Console/Commands/`, which Laravel finds and registers by itself. `make artisan c="make:command ImportFreeExerciseDb"` generates its skeleton. Three parts:

```php
// The name, then the options: --update is a switch, --path= and --limit= take a value.
// The text after " : " is the help of `php artisan help exercises:import`
#[Signature('exercises:import
    {--path= : The folder of free-exercise-db}
    {--update : Also refresh the exercises already imported}
    {--without-photos : Import the texts only}
    {--limit= : Import only the first N exercises}')]
// One line in `php artisan list`
#[Description('Import the public exercise library from free-exercise-db (DATA-1)')]
class ImportFreeExerciseDb extends Command
{
    // The work. Its parameters come from the service container, as in a
    // controller's method; the return value is the exit code
    public function handle(ImportFreeExercise $import): int
    {
        $limit = $this->option('limit');           // an option's value; null when not typed
        $this->info('Importing 876 exercises');    // a green line; error() red, line() plain
        $this->withProgressBar($rows, fn ($row) => …);   // a bar that moves with each item

        return self::SUCCESS;                      // 0; self::FAILURE is 1
    }
}
```

- **Attributes or properties.** `make:command` in Laravel 13 writes `#[Signature]` and `#[Description]` above the class. Older code and most tutorials write the same as two properties, `protected $signature = '…'` and `protected $description = '…'`; both work.
- **Options** are read with `$this->option('name')`, **arguments** (values without `--`, written as `{file}` in the signature) with `$this->argument('name')`.
- **The exit code** tells whoever called the command whether it worked: `make` stops on a failure, and so would a script on the server.
- **Keep the rules out of the command.** The command reads the files, loops, prints; the rules of one exercise live in an action, `ImportFreeExercise`, which a test calls directly ([C2.5.3](#c253-actions-the-work-outside-the-controller)).
- **Small commands** can be a function in `routes/console.php` instead of a class, like Laravel's example `inspire`.

### C2.14.2 Testing a command

`$this->artisan()` runs a command inside a test, as `php artisan` would, and checks what it printed and its exit code:

```php
$this->artisan('exercises:import', ['--path' => $path, '--limit' => 1])
    ->expectsOutputToContain('Created: 1')     // a line of its output
    ->assertSuccessful()                       // exit code 0; assertFailed() for 1
    ->run();                                   // runs it now, then the checks below can follow

expect(Exercise::count())->toBe(1);
```

Files the command reads are written by the test into the system's temporary folder (`sys_get_temp_dir()`), and `Storage::fake('public')` replaces the disk the photos go to with an empty one in memory: `tests/Feature/ExerciseLibrary/ImportFreeExerciseTest.php`.

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

**Why files, not a call to a translation service at every import.** The translations are part of the app, like the seeders' muscle names: versioned with the code, reviewed in a pull request, the same on every computer and on the server, and free to apply again after `make fresh`. A service would need a key, cost money at every run, and could give a different text each time. This is option B of DATA-1.

**How they were made.** By Claude, in the session that built this command (Claude Code, with the work split in 12 parts done side by side), following one guide for all parts: the names gym-goers use in each country ("Panca piana", "Press de banca", "Bankdrücken"), the informal *tu*, *tú*, *du* the app uses, the muscles and equipment named as in the seeders, and exactly one translated step for each English step. A script checked every part before it was joined ([H1.14](../how-to/H1-database.md#h114-the-translation-of-the-library-as-built)).

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

**Adding one** is a new entry in the four files, then `make exercises-extra`; the tests of `ImportExtraExercisesTest.php` import the real file, so a muscle we do not have, a misspelt logging type or a missing translation fails there ([H1.17](../how-to/H1-database.md#h117-the-extra-exercises-as-built)).

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
- **Holds and carries with a weight** (Plate Pinch, Crucifix, Farmer's Walk, Yoke Walk, the sleds) are wrong as weight and reps too, but `time` and `distance` record no weight ([D3.6.3](../design/D3-data-model.md#d363-logged_sets)): correcting them would lose the kilograms. They wait in the backlog, DATA-4.

**Why a command after the import, not a change to the guess.** The guess reads only the category and the equipment, and a plank and a crunch have the same ones: telling them apart needs a list of names anyway. A separate command also reaches a library imported before the list existed, which the import, leaving existing exercises alone, never would. How it was built and run: [H1.19](../how-to/H1-database.md#h119-the-corrected-logging-types-as-built).

---

← [C1. Frontend](C1-frontend.md) · [Contents](../README.md) · [H1. Database: how to](../how-to/H1-database.md) →
