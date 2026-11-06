# C2. Backend

How the Laravel backend in `backend/` works, written for someone who knows little PHP or Laravel and wants to read the code and change it with confidence. Read [C2.1](#c21-the-pieces)–[C2.4](#c24-the-life-of-a-request) once, in order: they explain the pieces and the path a request takes. The other sections explain one topic each, and [C2.12](#c212-recipes) holds the step-by-step recipes to keep open while coding.

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
- [C2.6 Database: migrations, models, factories, seeders](#c26-database-migrations-models-factories-seeders)
- [C2.7 Signing in: Sanctum](#c27-signing-in-sanctum)
  - [C2.7.1 How a session works](#c271-how-a-session-works)
  - [C2.7.2 Signing in and out](#c272-signing-in-and-out)
  - [C2.7.3 Signing up](#c273-signing-up)
  - [C2.7.4 Slowing down password guessing](#c274-slowing-down-password-guessing)
  - [C2.7.5 Forgot password](#c275-forgot-password)
  - [C2.7.6 Fortify or by hand](#c276-fortify-or-by-hand)
  - [C2.7.7 Messages in the user's language](#c277-messages-in-the-users-language)
- [C2.8 Admin panel: Filament](#c28-admin-panel-filament)
- [C2.9 Queues and jobs](#c29-queues-and-jobs)
- [C2.10 Configuration and .env](#c210-configuration-and-env)
- [C2.11 Tests with Pest](#c211-tests-with-pest)
- [C2.12 Recipes](#c212-recipes)
- [C2.13 Artisan and Composer commands](#c213-artisan-and-composer-commands)

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
│   │   ├── Exercises/          SavePersonalExercise
│   │   └── Fortify/            what Fortify leaves to us: creating a user, setting a new password (C2.7)
│   ├── Enums/                fixed lists of values: Locale, Theme, WeightUnit, LoggingType, MuscleRole (D3.2.4)
│   ├── Http/
│   │   ├── Controllers/        receive a request, return an answer (C2.5)
│   │   ├── Middleware/         steps every request crosses: SetLocaleFromRequest (C2.7.7)
│   │   ├── Requests/           Form Requests: the validation of an endpoint (C2.5)
│   │   └── Resources/          API Resources: the JSON shape of a model (C2.5)
│   ├── Models/               Eloquent models, one class per table: User, Muscle, Equipment, Exercise, ExerciseMuscle (C2.6)
│   ├── Policies/             who may do what to a row: ExercisePolicy (C2.5.1)
│   └── Providers/            service providers: set things up when the app starts
│       └── Filament/           the admin panel's configuration (C2.8)
│   (to come: Jobs background work, Filament/Resources admin screens)
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
├── vendor/                 packages installed by Composer: never edited, never committed
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

The rules themselves live in services or actions, tested without HTTP. The smallest real example is `CurrentUserController`, with `UpdatePreferencesRequest` and `UserResource`: it needs no policy, because it only touches the user asking. The complete one is `ExerciseController`, explained in the four sections below; [C2.12](#c212-recipes) has the recipe, and [H2.12](../how-to/H2-backend.md#h212-the-exercise-library-api-as-built) how it was built.

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
| `update`, `delete` | It is mine. A public one is refused, to admins too: they edit public exercises in the admin panel (BE-1, `feat/exercise-admin`) |

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
  ]
}
```

**What is sent to create or change one** (`StoreExerciseRequest`): `name` (required, up to 100 characters), `aliases` and `instructions` (lists of texts), `description`, `logging_type`, `equipment_id`, `youtube_url` (a YouTube address), and `muscles`, a list of `{ "id": 6, "role": "primary" }`. A change sends only the fields that change. `muscles`, when sent, is the complete list: muscles left out are removed.

**One language per personal exercise** ([D2.4](../design/D2-decisions.md#d24-languages)). The texts are stored under the request's language and replace any other: an exercise written in Italian, then edited with the app in English, becomes English. Otherwise the old Italian name would come back on switching the app to Italian again.

Photos and videos are not here yet: they come with `feat/exercise-media` ([BE-1](../project/backlog.md#be-1-exercise-library-api-and-admin)).

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

```php
$exercise->equipment->name;                  // the equipment's name (one more query)
$user->exercises()->create([...]);           // with (): a query, here creating with owner_id filled in
$exercise->muscles()->attach($chest, ['role' => MuscleRole::Primary]);   // adds a pivot row
$muscle->pivot->role;                         // a column of the pivot row, as an enum
```

- **The pivot's own columns**, such as `role`, are loaded only when listed with `withPivot('role')`.
- **A cast on a pivot column** needs a small *pivot class* (`ExerciseMuscle extends Pivot`), named on the relation with `using()`.
- **When the column's name does not follow the convention**, it is given: `belongsTo(User::class, 'owner_id')`, because Laravel would look for `user_id`.

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

- **`SoftDeletes`**: `delete()` fills `deleted_at` instead of removing the row, and every query leaves those rows out. `withTrashed()` brings them back, and `forceDelete()` removes the row for real. An exercise uses it, so that plans and history pointing to it keep working ([D3.7.2](../design/D3-data-model.md#d372-deleting-an-exercise-a-soft-delete)).
- **`HasTranslations`** (spatie/laravel-translatable): the columns listed in `$translatable` hold one value per language, as JSON. `$muscle->name` gives the current language's value. When that language is missing, it falls back to English, then to any language there is; this is set once in `AppServiceProvider` ([D3.4.5](../design/D3-data-model.md#d345-translations)).
- **`InteractsWithMedia`** (spatie/laravel-medialibrary), with `implements HasMedia`: files belong to the model, stored as rows of the `media` table, in named *collections* (`photos`, `videos`) declared in `registerMediaCollections()`.

How these were built step by step, with the real output: [H1.10](../how-to/H1-database.md#h110-the-exercise-library-as-built).

**Factories** build fake but realistic records for tests: `User::factory()->create()` inserts a user with a random name and email. **Seeders** fill the database with starting data: the fixed lists the app needs (the 17 muscles and the 12 kinds of equipment), the development account, and later the public exercise library (DATA-1). `make fresh` runs them.

**Seeing the data:**
- `make psql` opens an SQL console;
- `make tinker` opens a PHP console with the whole app loaded, where you can type `User::count()`;
- any database program can connect at `localhost:5932` ([S1.4](../start/S1-setup.md#s14-ports)).

**Doing it in practice:** every command, what to write in each file, seeders, tinker and the common errors, on a real table followed from start to finish, are in [H1. Database: how to](../how-to/H1-database.md).

---

## C2.7 Signing in: Sanctum

Signing in is built from two packages that do different jobs. **Fortify** handles the moments that change who is signed in: signing up, in and out, resetting a password. **Sanctum** recognises the signed-in user on every request after that.

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
| `PATCH /api/user/preferences` (ours) | Saves the language or theme | 204; 422 if not valid |

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

---

## C2.8 Admin panel: Filament

Filament builds the admin panel from PHP classes. You describe a table's columns and a form's fields in PHP, and Filament draws the pages, the search, the filters and the validation.

- **The panel** is configured in `app/Providers/Filament/AdminPanelProvider.php`: path `/admin`, login page, colours, and where to look for resources. Open http://localhost:8500/admin. It is served directly by Laravel, not through the React app.
- **A resource** is the admin screen for one model: its list, its form and its pages. `make artisan c="make:filament-resource Exercise --generate"` creates one from the table's columns. The public exercise library is the first (BE-1, [D1.4.15](../design/D1-ui.md#d1415-admin-panel-filament)).
- **Only admins enter,** in every environment. The `User` model implements `FilamentUser`, and its `canAccessPanel()` checks `is_admin` and that the account is not disabled. Anyone else gets a 403 ([D3.3](../design/D3-data-model.md#d33-users-and-preferences)).
- **Getting an admin in development.** `make artisan c="db:seed"` creates `test@example.com`, password `password`, an admin. To make an existing account an admin: `make tinker`, then `User::where('email', 'you@example.com')->update(['is_admin' => true]);`. `make artisan c="make:filament-user"` creates a user, but not an admin, so it needs the same step.
- **The session is shared with the React app:** both use the `web` guard, and cookies are per host, whatever the port. Signing in on one signs in on the other.

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
- **`backend/.env`** sets the variables for this computer. It holds secrets, so it is never committed and never shown (an assistant must not read it). **`.env.example`** lists every variable with harmless values, and it is committed. A new variable goes in both files.
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

`tests/Feature/Auth/` is the model of an area's tests: signing in, signing up, resetting a password, the current user, languages and who may open the admin panel. `tests/Feature/ExerciseLibrary/` is the model for an API with permissions: one file for the list and its filters, one for the other endpoints with each refusal, one for the action called without HTTP.

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

**A new endpoint.** For example, list the user's plans:

1. **Route** in `routes/api.php`, inside an `auth:sanctum` group: `Route::get('/plans', [PlanController::class, 'index']);`
2. **Controller:** `make artisan c="make:controller PlanController"`. It stays thin ([C2.5](#c25-routes-and-controllers)).
3. **Validation**, if the endpoint takes input: `make artisan c="make:request StorePlanRequest"`. List the rules there, such as `'name' => ['required', 'string', 'max:100']`, and delete the generated `authorize()`. A change that accepts partial data can extend the creation's request and add `sometimes` to each field (`UpdateExerciseRequest`).
4. **Permission:** `make artisan c="make:policy PlanPolicy --model=Plan"`, with a method per action, such as `update(User $user, Plan $plan): bool`.
5. **JSON shape:** `make artisan c="make:resource PlanResource"`.
6. **The work**, when it is more than a line: an action, `make artisan c="make:class Actions/Plans/SavePlan"` ([C2.5.3](#c253-actions-the-work-outside-the-controller)). A list with filters: a scope per filter on the model, and `QueryBuilder` in the controller ([C2.5.2](#c252-lists-filters-and-pages)).
7. **Test** in `tests/Feature/`. It covers success, invalid input (422), signed out (401) and someone else's record (403).
8. **Frontend:** the `src/api/` file and its hooks ([C1.9](C1-frontend.md#c19-recipes)).

**Work in the background.**

1. `make artisan c="make:job ConvertVideo"`, then write the work in `handle()`.
2. Dispatch it: `ConvertVideo::dispatch(...)`.
3. After changing a job's code, run `make restart` (in development `queue:listen` reloads the code by itself, but restarting is harmless).

**An admin screen:** `make artisan c="make:filament-resource Exercise --generate"`, then adjust its columns and fields ([C2.8](#c28-admin-panel-filament)).

**Before calling it done:** `make fix`, then `make check`.

---

## C2.13 Artisan and Composer commands

Every command runs inside the container. The `make` shortcuts avoid typing `docker compose exec backend …` ([S1.8](../start/S1-setup.md#s18-everyday-commands)).

| What | Command |
|---|---|
| Any Artisan command | `make artisan c="…"` |
| The list of Artisan commands, and help on one | `make artisan c="list"`, `make artisan c="help make:model"` |
| Generate a class (model, controller, request, policy, resource, job, test) | `make artisan c="make:model Plan -mf"`, `make:controller`, `make:request`, `make:policy`, `make:resource`, `make:job`, `make:test --pest` |
| Migrations | `make migrate`, `make fresh`, `make artisan c="migrate:status"`, `make artisan c="migrate:rollback"` (undoes the last batch) |
| A PHP console with the app loaded | `make tinker` |
| The routes | `make routes` |
| Configuration in use, caches | `make artisan c="config:show mail"`, `make clear` |
| Add or update a package | `make composer c="require spatie/something"`; `make composer c="update vendor/package"` |
| Format the PHP code | `make pint` (part of `make fix`) |
| Tests | `make test`, `make test f=Name` |
| Logs | `make logs`; the file `backend/storage/logs/laravel.log` |

**Official documentation**, worth reading next to this page:
- Laravel: https://laravel.com/docs. The pages *Routing*, *Eloquent*, *Migrations*, *Validation*, *Authorization*, *Queues*, *Sanctum* and *Fortify* match the sections above; *Authentication* and *Resetting Passwords* cover the by-hand way of [C2.7](#c27-signing-in-sanctum).
- Filament: https://filamentphp.com/docs.
- Pest: https://pestphp.com/docs.
- PHP itself: https://www.php.net/manual.

---

← [C1. Frontend](C1-frontend.md) · [Contents](../README.md) · [H1. Database: how to](../how-to/H1-database.md) →
