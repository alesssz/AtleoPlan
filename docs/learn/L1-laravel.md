# L1. Laravel course

A course on **standard Laravel**: the parts of the framework that AtleoPlan uses, in the order in which it makes sense to learn them. Each lesson explains one idea, shows where the project uses it, has you try it, and ends with a recap and a small exercise.

**How it differs from the other documents.** [C2. Backend](../concepts/C2-backend.md) explains how *this app* works, and [H1](../how-to/H1-database.md)–[H2](../how-to/H2-backend.md) give recipes for *this app*. Both mix Laravel with the project's packages and conventions. This course separates them: each lesson says what is Laravel, and what is a package or a choice of ours.

**The examples have been run.** The running example below was built for real on this project, then removed. The outputs shown are what the commands printed, on Laravel 13.40, PHP 8.4 and Pest 4.7.

## Contents

- [L1.1 How this course works](#l11-how-this-course-works)
- [L1.2 PHP for Laravel](#l12-php-for-laravel)
- [L1.3 Artisan, tinker and the folders](#l13-artisan-tinker-and-the-folders)
- [L1.4 The life of a request, and the service container](#l14-the-life-of-a-request-and-the-service-container)
- [L1.5 Migrations: the tables as code](#l15-migrations-the-tables-as-code)
- [L1.6 Eloquent models: reading and writing](#l16-eloquent-models-reading-and-writing)
- [L1.7 Relations and eager loading](#l17-relations-and-eager-loading)
- [L1.8 Queries: scopes, pages and soft deletes](#l18-queries-scopes-pages-and-soft-deletes)
- [L1.9 Collections and helpers](#l19-collections-and-helpers)
- [L1.10 Factories and seeders](#l110-factories-and-seeders)
- [L1.11 Routes](#l111-routes)
- [L1.12 Controllers](#l112-controllers)
- [L1.13 Validation: Form Requests](#l113-validation-form-requests)
- [L1.14 Authorization: policies and Gate](#l114-authorization-policies-and-gate)
- [L1.15 API Resources](#l115-api-resources)
- [L1.16 Middleware](#l116-middleware)
- [L1.17 Signing in: guards, Sanctum and Fortify](#l117-signing-in-guards-sanctum-and-fortify)
- [L1.18 Configuration and .env](#l118-configuration-and-env)
- [L1.19 Translations](#l119-translations)
- [L1.20 Tests with Pest](#l120-tests-with-pest)
- [L1.21 What Laravel has that the project does not use yet](#l121-what-laravel-has-that-the-project-does-not-use-yet)
- [L1.22 What in this project is not plain Laravel](#l122-what-in-this-project-is-not-plain-laravel)
- [L1.23 Final exercise and clean-up](#l123-final-exercise-and-clean-up)
- [L1.24 Where to go next](#l124-where-to-go-next)

## L1.1 How this course works

**For whom.** Someone who can program, maybe in JavaScript or another language, but has never written PHP or Laravel. No knowledge of the project is needed beyond having it running ([S1. Setup](../start/S1-setup.md)).

**The structure of each lesson:**
1. **The idea:** what the thing is, and why Laravel has it.
2. **In AtleoPlan:** the files of the project that use it, to read after the lesson.
3. **Try it:** a small example, with the real output.
4. **Recap:** the few things to remember.
5. **Exercise:** a short task, with the solution hidden under "Solution". Try first, then open it.

**Labels.** Each lesson opens with one of these, so you always know what you are learning:

| Label | Means | Example |
|---|---|---|
| **Standard** | Part of Laravel itself: in every Laravel project, documented on laravel.com/docs | Routes, Eloquent, validation |
| **Official package** | Made by the Laravel team, installed separately with Composer | Sanctum, Fortify, Tinker, Pint |
| **Third party** | A package made by someone else | Filament, the spatie packages |
| **AtleoPlan** | A choice of this project, built from standard pieces | Actions in `app/Actions/`, the Makefile |

**The running example: notes.** Through the course we build a small, complete feature that the app does not have: **training notes**. A user writes notes (a title, a body, pinned or not), and only they can read them. Every lesson adds one piece: the table, the model, the routes, the validation, the permissions, the JSON, the tests. It is small enough to understand at once, and it touches every standard piece the real app uses.

**Follow along on a throwaway branch.** Typing the code yourself teaches far more than reading it. Make a branch that will never be merged, and delete it at the end ([L1.23](#l123-final-exercise-and-clean-up) says how):

```sh
git switch main
git switch -c learn/notes      # a branch of your own; never pushed, never merged
```

**Two ways to try anything:**
- **Tinker** (`make tinker`): a PHP console with the whole app loaded. Type a line, see the result. Ideal for models and queries.
- **A Pest test** (`make test f=Name`): a script that calls the app as the React app would. Ideal for routes and permissions.

**Commands go through Docker.** PHP runs in the `backend` container, so `php artisan route:list` becomes `make artisan c="route:list"`, and `make tinker`, `make test`, `make migrate` wrap the usual ones ([S1.8](../start/S1-setup.md#s18-everyday-commands)). This is an AtleoPlan choice: on a project without Docker you would type `php artisan …` directly.

---

## L1.2 PHP for Laravel

**Standard** (the language itself) · [PHP manual](https://www.php.net/manual/en/langref.php)

**The idea.** Laravel is written in PHP, and so is everything you write in it. Modern PHP (version 8) looks much like TypeScript with a few different symbols. [C2.2](../concepts/C2-backend.md#c22-php-you-will-meet) has the complete table of the syntax met in the project; here are the pieces you need first, tried for real.

**Variables, arrays, functions.** Every variable starts with `$`, every statement ends with `;`. An array is both a list and a map:

```php
// A list of three sets, each a map of key => value
$sets = [['kg' => 80, 'reps' => 8], ['kg' => 85, 'reps' => 6], ['kg' => 90, 'reps' => 3]];

echo $sets[1]['kg'];          // 85: the second item (counting from 0), its 'kg' key
echo count($sets);            // 3

// fn (...) => ... is an arrow function, like (s) => ... in JavaScript
$volume = array_sum(array_map(fn (array $s) => $s['kg'] * $s['reps'], $sets));
echo $volume;                 // 1420: 80×8 + 85×6 + 90×3
```

**Objects.** `->` reaches a property or method of an object (`.` in JavaScript); `::` reaches something of the class itself:

```php
$user = User::find(1);        // a static method of the class User
echo $user->name;             // a property of that object
$user?->name ?? 'guest';      // ?-> skips when $user is null; ?? gives a fallback
```

```
> $u = null; echo $u?->name ?? 'guest';
guest
```

**Classes, namespaces, imports.** Each class lives in a file of its own, and its `namespace` matches its folder. `use` at the top of a file imports a class by its full name:

```php
namespace App\Models;                       // this class is App\Models\Note, in app/Models/

use Illuminate\Database\Eloquent\Model;     // import: now "Model" means this class

class Note extends Model                    // a Note is a kind of Model, and inherits its methods
{
    use SoftDeletes;                        // "use" INSIDE a class: a trait, methods copied in
}
```

**Types.** Parameters and return values can be typed, and PHP checks them while running: `function total(array $sets): int`. `?string` means "a string or null", `void` means "returns nothing".

**Attributes** are labels in `#[...]` that Laravel reads to configure a class: `#[Fillable(['title'])]` above a model ([L1.6](#l16-eloquent-models-reading-and-writing)).

**Enums** are fixed lists of values. The project's `app/Enums/Theme.php`:

```php
enum Theme: string
{
    case Dark = 'dark';
    case Light = 'light';
    case System = 'system';
}
```

```
> echo Theme::Dark->value;              // the value stored in the database
dark
> echo Theme::from('light')->name;      // from a value to the case
Light
> var_export(Theme::tryFrom('pink'));   // tryFrom gives null for an unknown value; from() would throw
NULL
```

**`match`** is a `switch` that returns a value and compares strictly:

```
> echo match (true) { 7 > 5 => 'heavy', default => 'light' };
heavy
```

**In AtleoPlan:** every file. `app/Models/User.php` is the most commented one, line by line.

**Recap**
- `$` for variables, `;` at the end, `->` for objects, `::` for classes.
- One class per file; `namespace` = folder; `use` at the top imports, `use` inside a class adds a trait.
- Types on parameters and returns are checked while running.
- `#[...]` attributes and `enum`s are everywhere in modern Laravel.

**Exercise.** In `make tinker`, with the `$sets` above, compute the total number of repetitions.

<details>
<summary>Solution</summary>

```php
> array_sum(array_column($sets, 'reps'));
= 17
```

`array_column()` takes one key from every item: `[8, 6, 3]`. [L1.9](#l19-collections-and-helpers) shows the Laravel way: `collect($sets)->sum('reps')`.
</details>

---

## L1.3 Artisan, tinker and the folders

**Standard** (Artisan) · **Official package** (Tinker) · [Artisan](https://laravel.com/docs/artisan), [Structure](https://laravel.com/docs/structure)

**The idea.** A Laravel project has a fixed shape, and **Artisan**, its command-line tool, generates the files in the right place with the right skeleton. You rarely create a file by hand.

**The folders that matter** (the full map, with the project's own files: [C2.3](../concepts/C2-backend.md#c23-folder-structure)):

| Folder | Holds | Generated with |
|---|---|---|
| `app/Models/` | One class per table | `make:model` |
| `app/Http/Controllers/` | The code that answers a route | `make:controller` |
| `app/Http/Requests/` | Validation rules | `make:request` |
| `app/Http/Resources/` | The JSON shape | `make:resource` |
| `app/Http/Middleware/` | Steps every request crosses | `make:middleware` |
| `app/Policies/` | Permissions | `make:policy` |
| `app/Console/Commands/` | Artisan commands of the app, such as `exercises:import` | `make:command` |
| `database/migrations/` | The tables' history | `make:migration`, `make:model -m` |
| `database/factories/`, `seeders/` | Fake and starting data | `make:factory`, `make:seeder` |
| `routes/` | `api.php`, `web.php`, `console.php` | written by hand |
| `tests/Feature/` | Tests through HTTP | `make:test --pest` |
| `config/` | Settings, one file per area | written by hand |
| `lang/` | Translations | written by hand |

**Convention over configuration.** Laravel finds things by name: the model `Note` reads the table `notes`, the factory `NoteFactory` belongs to `Note`, the policy `NotePolicy` too. Follow the names and nothing needs registering.

**Try it.** The first file of the running example:

```sh
make artisan c="make:model Note -mf"
```

```
INFO  Model [app/Models/Note.php] created successfully.
INFO  Factory [database/factories/NoteFactory.php] created successfully.
INFO  Migration [database/migrations/2026_11_06_121220_create_notes_table.php] created successfully.
```

`-m` adds the migration, `-f` the factory. `make artisan c="help make:model"` lists the other options: `-s` a seeder, `-c` a controller, `--policy` a policy, `-a` all of them. Careful: `-p` is not "policy" but `--pivot`, a model for a pivot table ([L1.7](#l17-relations-and-eager-loading)).

**The commands you will use most:**

| What | Command |
|---|---|
| Everything Artisan can do | `make artisan c="list"` |
| Help on one command | `make artisan c="help make:controller"` |
| The routes | `make artisan c="route:list --path=api"` |
| A PHP console with the app | `make tinker` |
| A setting's value | `make artisan c="config:show app"` |

**Tinker** keeps a session open: variables survive from one line to the next. Models are found by their short name (`Note::count()`); other classes need their full name, or a `use` line first.

**In AtleoPlan:** every file under `app/` started from an Artisan command; [H2.12.1](../how-to/H2-backend.md#h2121-generate-the-files) lists the ones run for the exercise library.

**Recap**
- The folders are fixed; Artisan's `make:*` commands create files in them.
- Names connect things: `Note` ↔ `notes` ↔ `NoteFactory` ↔ `NotePolicy`.
- Tinker is the place to try a line of PHP against the real app.

**Exercise.** Find, with Artisan alone, which option of `make:controller` creates a controller with the five methods of an API.

<details>
<summary>Solution</summary>

```sh
make artisan c="help make:controller"
```

The list shows `--api  Exclude the create and edit methods from the controller`. With `--model=Note` too, the methods already receive a `Note`. [L1.12](#l112-controllers) uses it.
</details>

---

## L1.4 The life of a request, and the service container

**Standard** · [Request lifecycle](https://laravel.com/docs/lifecycle), [Service container](https://laravel.com/docs/container)

**The idea.** Every HTTP request enters through one file, `public/index.php`, which builds the application and passes the request through a series of steps until a route answers. [C2.4](../concepts/C2-backend.md#c24-the-life-of-a-request) follows `GET /api/health` step by step. The short version:

```
request → public/index.php → bootstrap/app.php builds the app
        → service providers set things up
        → middleware (session, CSRF, sign-in…)          L1.16
        → the router finds the route                   L1.11
        → the controller method runs                   L1.12
        → the answer goes back through the middleware → browser
```

**The service container** is the part that makes Laravel feel like magic. It is a registry that knows how to build the app's objects. When a method lists a class among its parameters, Laravel builds one and passes it in:

```php
// In ExerciseController: Laravel sees the types and provides both objects
public function store(StoreExerciseRequest $request, SavePersonalExercise $save) { … }
```

This is **dependency injection**: the method says what it needs, the container provides it. It works in controller methods, in middleware, in jobs, in console commands. Outside those, `app(Class::class)` asks the container directly:

```
> get_class(app(App\Actions\Exercises\SavePersonalExercise::class));
App\Actions\Exercises\SavePersonalExercise
```

**Service providers** (`app/Providers/`) run at start-up, before any request is handled. They configure the framework and the packages. `AppServiceProvider::boot()` is where app-wide settings go.

**Facades** are the static-looking calls such as `Route::get()`, `DB::transaction()` and `Gate::authorize()`. Behind each one the container holds an object, and the facade passes the call to it. They are short to type and can be replaced with fakes in tests.

**In AtleoPlan:**
- `bootstrap/app.php` (routes, middleware, errors), heavily commented;
- `app/Providers/AppServiceProvider.php` (the translations' fallback);
- `ExerciseController::store()`, which receives the action `SavePersonalExercise` as a parameter.

**Recap**
- One entry point; middleware around; a route at the centre.
- Type a class in a method's parameters and Laravel provides it.
- `Route::`, `DB::`, `Gate::` are facades: a static face on an object of the container.

**Exercise.** In `make tinker`, check that `app('config')` returns the same object every time. What does it tell you about the config object?

<details>
<summary>Solution</summary>

```
> app('config') === app('config') ? 'same' : 'new';
same
```

The container registered it as a **singleton**: built once per request, then shared. A plain class like `SavePersonalExercise` is built anew each time it is asked for, unless registered otherwise.
</details>

---

## L1.5 Migrations: the tables as code

**Standard** · [Migrations](https://laravel.com/docs/migrations)

**The idea.** The structure of the database is written as PHP files, one per change, kept in Git. Each computer, the test database and the server run the same files in the same order, and end up with the same tables. Laravel records which files have run in the `migrations` table, so each runs once.

A migration has two methods: `up()` makes the change, `down()` undoes it.

**Try it.** `make:model Note -m` generated `database/migrations/2026_11_06_121220_create_notes_table.php`, with only `id` and timestamps. Filled in:

```php
public function up(): void
{
    // Schema::create(): a new table. $table is the "blueprint": each call adds a column
    Schema::create('notes', function (Blueprint $table) {
        $table->id();                                  // bigint, primary key, grows by itself
        // user_id, pointing to users.id; deleting the user deletes their notes
        $table->foreignId('user_id')->constrained()->cascadeOnDelete();
        $table->string('title', 100);                  // varchar(100), required
        $table->text('body')->nullable();              // long text, may be empty (NULL)
        $table->boolean('pinned')->default(false);
        $table->timestamps();                          // created_at, updated_at, filled by Laravel
        $table->softDeletesTz();                       // deleted_at, for soft deletes (L1.8)
    });
}

public function down(): void
{
    Schema::dropIfExists('notes');                     // the undo of up()
}
```

**See the SQL before running it:**

```sh
make artisan c="migrate --pretend"
```

```
⇂ create table "notes" ("id" bigserial not null primary key, "user_id" bigint not null, "title" varchar(100) not null, "body" text null, "pinned" boolean not null default '0', "created_at" timestamp(0) without time zone null, "updated_at" timestamp(0) without time zone null, "deleted_at" timestamp(0) with time zone null)
⇂ alter table "notes" add constraint "notes_user_id_foreign" foreign key ("user_id") references "users" ("id") on delete cascade
```

`foreignId('user_id')->constrained()` guessed the table `users` from the column's name. Then run it:

```sh
make migrate
```

```
2026_11_06_121220_create_notes_table .......................... 95.35ms DONE
```

**The commands:**

| What | Command |
|---|---|
| Run the new migrations | `make migrate` |
| Which have run | `make artisan c="migrate:status"` |
| Undo the last one | `make artisan c="migrate:rollback --step=1"` (runs its `down()`) |
| Empty the database and run all again, with seeders | `make fresh` (development data is lost) |

**The golden rule: never edit a migration that has run** on another computer or on the server. They would not run it again, and the databases would differ. A change is a new migration: `make artisan c="make:migration add_mood_to_notes_table"`. While a migration exists only on your computer, `migrate:rollback`, edit, `migrate` is fine.

**In AtleoPlan:** `database/migrations/`, each commented column by column; the reasons behind every column are in [D3. Data model](../design/D3-data-model.md), the step-by-step in [H1.2](../how-to/H1-database.md#h12-a-new-table-from-start-to-finish).

**Recap**
- One file per change; `up()` does, `down()` undoes; the date in the name sets the order.
- `--pretend` shows the SQL; `migrate:status` shows what ran.
- A migration that has run elsewhere is never edited: write a new one.

**Exercise.** Write the migration that adds an optional `mood` column (text up to 20 characters) to `notes`.

<details>
<summary>Solution</summary>

```sh
make artisan c="make:migration add_mood_to_notes_table"
```

The name tells Artisan the table, so the file already holds `Schema::table('notes', …)` (`table`, not `create`: it changes an existing table).

```php
public function up(): void
{
    Schema::table('notes', function (Blueprint $table) {
        $table->string('mood', 20)->nullable();
    });
}

public function down(): void
{
    Schema::table('notes', function (Blueprint $table) {
        $table->dropColumn('mood');
    });
}
```

`nullable()` matters: the table already has rows, and they would have no value for a required column. [H1.3.3](../how-to/H1-database.md#h133-changing-a-table-that-already-exists) covers changing a table.
</details>

---

## L1.6 Eloquent models: reading and writing

**Standard** · [Eloquent](https://laravel.com/docs/eloquent), [Casts](https://laravel.com/docs/eloquent-mutators)

**The idea.** **Eloquent** is Laravel's ORM: one class per table (a **model**), one object per row. You read and write rows as objects, without SQL. The model `Note` reads the table `notes` by convention, and asks the database for the columns: none are listed in the class.

**The model of the running example:**

```php
namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

// The columns a request's data may fill in one go
#[Fillable(['title', 'body', 'pinned'])]
class Note extends Model
{
    use HasFactory, SoftDeletes;

    // Conversions applied when reading and writing a column
    protected function casts(): array
    {
        return ['pinned' => 'boolean'];
    }
}
```

**Mass assignment.** `Note::create([...])` fills many columns at once from an array, often a request's data. Laravel accepts only the columns listed as **fillable**, so a request cannot slip in `user_id` or `is_admin`. Before the `#[Fillable]` line was written:

```
> Note::create(['title' => 'Squat day', 'user_id' => 1]);
Illuminate\Database\Eloquent\MassAssignmentException: Add [title] to fillable property to allow mass assignment on [App\Models\Note].
```

`user_id` is deliberately **not** fillable: the code sets it, through the relation ([L1.7](#l17-relations-and-eager-loading)).

**Try it.** A tinker session, with a user made by the factory ([L1.10](#l110-factories-and-seeders)) and the relation of L1.7:

```php
> $ann = User::factory()->create(['name' => 'Ann']);
> $note = $ann->notes()->create(['title' => 'Squat day', 'body' => 'Felt strong.']);   // INSERT
> $note->title;
= "Squat day"
> var_export($note->pinned);
NULL                                     // not false! See below
> $note->pinned = true; $note->save();   // UPDATE
> var_export($note->fresh()->pinned);    // fresh(): read the row again from the database
true
> $note->update(['title' => 'Heavy squat day']);   // set fillable columns and save, in one call
> $note->fresh()->title;
= "Heavy squat day"
```

**The trap of the defaults.** The table says `pinned` defaults to `false`, but a model just created does not read the row back, so `$note->pinned` is `null` until `fresh()`. The JSON of a note just created via the API showed it too: `"pinned": null`. The fix is to give the model the same defaults:

```php
protected $attributes = ['pinned' => false];
```

`app/Models/Exercise.php` does this for `logging_type`.

**Casts** convert a column on the way in and out:

| Cast | Database | PHP |
|---|---|---|
| `'boolean'` | `true`/`false` | `true`/`false`, also from `1` and `0` |
| `'datetime'` | a timestamp | a Carbon date object: `$note->created_at->diffForHumans()` |
| `'array'` | JSON text | a PHP array |
| `'hashed'` | a hash | set a plain password, the hash is stored |
| `Theme::class` | `'dark'` | `Theme::Dark` |

**Reading:**

| Code | Gives |
|---|---|
| `Note::all()` | Every row (careful on big tables) |
| `Note::find(5)` | The row with id 5, or `null` |
| `Note::findOrFail(5)` | The row, or an exception that becomes a **404** in a request |
| `Note::where('pinned', true)->get()` | The rows that match ([L1.8](#l18-queries-scopes-pages-and-soft-deletes)) |
| `Note::count()` | How many |

```
> Note::findOrFail(99999);
Illuminate\Database\Eloquent\ModelNotFoundException  No query results for model [App\Models\Note] 99999.
```

**In AtleoPlan:** `app/Models/User.php` (casts, hidden columns, the most commented model); `app/Models/Exercise.php` (defaults, translations, soft deletes).

**Recap**
- A model = a table; an object = a row. No columns listed in the class.
- `#[Fillable]` protects from mass assignment; set owner columns through relations.
- `casts()` converts; `$attributes` gives a new model its defaults.
- `find()` returns null, `findOrFail()` a 404.

**Exercise.** In tinker, with `$ann` above, create a second note titled "Bench day", not pinned, then count Ann's pinned notes.

<details>
<summary>Solution</summary>

```php
> $ann->notes()->create(['title' => 'Bench day']);
> $ann->notes()->where('pinned', true)->count();
= 1
```

1: only "Squat day", pinned earlier. The next lessons continue from here, with these two notes. L1.8 turns `where('pinned', true)` into a scope: `$ann->notes()->pinned()->count()`.
</details>

---

## L1.7 Relations and eager loading

**Standard** · [Relationships](https://laravel.com/docs/eloquent-relationships)

**The idea.** Tables point to each other with foreign keys (`notes.user_id → users.id`). In Eloquent, a **relation** is a method that describes the link once; then `$note->user` and `$user->notes` read the linked rows without SQL.

**The three kinds you will meet:**

| Kind | Where the foreign key is | Example |
|---|---|---|
| `belongsTo` | In **this** table | A note belongs to a user: `notes.user_id` |
| `hasMany` | In the **other** table | A user has many notes |
| `belongsToMany` | In a **pivot** table between the two | An exercise works many muscles, a muscle is worked by many exercises (`exercise_muscle`) |

**The two sides of notes:**

```php
// In Note: this table holds user_id
public function user(): BelongsTo
{
    return $this->belongsTo(User::class);
}

// In User: the other table holds the key pointing here
public function notes(): HasMany
{
    return $this->hasMany(Note::class);
}
```

**With or without brackets:**

```php
$note->user;                   // a property: the related row, loaded on first use
$note->user->name;             // "Ann"
$ann->notes;                   // a collection of all her notes
$ann->notes()                  // a method: a query, which can be refined before running
    ->where('pinned', true)
    ->count();
$ann->notes()->create([...]);  // creates with user_id already filled in
```

```
> $ann->notes()->count();
= 2
> $ann->notes()->orderBy('title')->pluck('title');
= ["Bench day", "Squat day"]
> Note::find($note->id)->user->name;
= "Ann"
```

**`belongsToMany`** in the project: an exercise and its muscles, with the muscle's role in an extra pivot column. `withPivot('role')` loads that column, and `$muscle->pivot->role` reads it:

```php
public function muscles(): BelongsToMany
{
    return $this->belongsToMany(Muscle::class)->withPivot('role');
}

$exercise->muscles()->attach($chest, ['role' => 'primary']);   // adds a pivot row
$exercise->muscles()->sync([3 => ['role' => 'primary']]);      // makes the list exactly this
```

**Eager loading and the N+1 problem.** Showing 20 notes with their author's name in a loop:

```php
foreach (Note::all() as $note) {
    echo $note->user->name;    // one query PER note: 1 + N queries
}
```

`with()` loads the relation for all the rows in one extra query:

```php
foreach (Note::with('user')->get() as $note) {
    echo $note->user->name;    // 2 queries in all, whatever the number of notes
}
```

On a model already loaded, `$note->load('user')` does the same. [C2.5.2](../concepts/C2-backend.md#c252-lists-filters-and-pages) shows how the exercise list does it, and how the API Resource guards against forgetting.

**In AtleoPlan:** `Exercise::owner()`, `equipment()`, `muscles()`; `User::exercises()`; `Equipment::exercises()`. [H1.10.3](../how-to/H1-database.md#h1103-a-pivot-with-a-column-of-its-own) builds the pivot with its own column.

**Recap**
- `belongsTo` where the key is here, `hasMany` where it is there, `belongsToMany` through a pivot.
- `$a->rel` reads the rows; `$a->rel()` is a query to refine or to create through.
- Loading a relation inside a loop is N+1: use `with()`.

**Exercise.** Write, for a user `$ann`, the expression that gives her most recent note. Then the one that gives the email of the author of `$note`.

<details>
<summary>Solution</summary>

```php
$ann->notes()->latest()->first();     // latest(): order by created_at, newest first
$note->user->email;
```

`latest()` is a shortcut for `orderByDesc('created_at')`; `oldest()` is the opposite.
</details>

---

## L1.8 Queries: scopes, pages and soft deletes

**Standard** · [Query builder](https://laravel.com/docs/queries), [Scopes](https://laravel.com/docs/eloquent#query-scopes), [Pagination](https://laravel.com/docs/pagination), [Soft deleting](https://laravel.com/docs/eloquent#soft-deleting)

**The idea.** A query is built one call at a time, and nothing reaches the database until a method that needs the rows (`get()`, `first()`, `count()`, `paginate()`). Each call returns the query, so they chain:

```php
Note::where('pinned', true)          // WHERE pinned = true
    ->where('title', 'like', '%day') // AND title LIKE '%day'
    ->orderBy('title')               // ORDER BY title
    ->limit(10)                      // LIMIT 10
    ->get();                         // runs it: a collection of Note
```

**See the SQL** with `toSql()` (the `?` are the values, sent apart) or `toRawSql()` (values filled in):

```
> Note::where('pinned', true)->orWhere('title', 'Bench day')->toSql();
select * from "notes" where ("pinned" = ? or "title" = ?) and "notes"."deleted_at" is null
```

Two things in that output: `deleted_at is null` was added by `SoftDeletes`, and Laravel put the `or` in parentheses so that it does not mix with it.

**Grouping conditions yourself.** `where(fn ($q) => …)` becomes a parenthesis. Without it, `A or B and C` means `A or (B and C)`, a classic security bug when B is "belongs to me":

```php
Note::where(fn ($q) => $q->where('pinned', true)->orWhere('title', 'like', '%day'))
    ->where('user_id', $ann->id)     // (pinned or title…) and user_id = …
    ->get();
```

**Scopes** give a name to a piece of query, on the model:

```php
use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;

#[Scope]
protected function pinned(Builder $query): void
{
    $query->where('pinned', true);
}
```

```
> $ann->notes()->pinned()->count();
= 1
```

Laravel passes `$query` itself; you call `pinned()` without it. Older code writes the same as `public function scopePinned($query)`.

**Pages.** `paginate(20)` reads `?page=` from the request, runs the page's query and a count, and in an API answer adds `links` and `meta` ([L1.15](#l115-api-resources)).

**Soft deletes.** With the `SoftDeletes` trait and a `deleted_at` column, `delete()` only fills `deleted_at`, and every query leaves the row out:

```
> $note->delete();
> $ann->notes()->count();
= 1
> $ann->notes()->withTrashed()->count();     // including the deleted ones
= 2
```

`restore()` brings a row back, `forceDelete()` removes it for real.

**In AtleoPlan:** the six scopes of `app/Models/Exercise.php`, from `visibleTo()` to `orderByName()`; their SQL is in [H2.12.3](../how-to/H2-backend.md#h2123-scopes-the-sql-they-write).

**Recap**
- A query is built by chaining, and runs at `get()`, `first()`, `count()`, `paginate()`.
- `toSql()` / `toRawSql()` show what it will run.
- Group `or` conditions with `where(fn …)`.
- `#[Scope]` names a piece of query; `SoftDeletes` hides deleted rows everywhere.

**Exercise.** Write a scope `titled(string $term)` that keeps the notes whose title contains `$term`, ignoring upper and lower case (Postgres: `ilike`).

<details>
<summary>Solution</summary>

```php
#[Scope]
protected function titled(Builder $query, string $term): void
{
    $query->where('title', 'ilike', "%{$term}%");
}
```

Used as `$ann->notes()->titled('squat')->get()`. The value travels as a parameter, never pasted into the SQL, so whatever the user types cannot change the query. `Exercise::search()` adds the escaping of `%` and `_`.
</details>

---

## L1.9 Collections and helpers

**Standard** · [Collections](https://laravel.com/docs/collections), [Helpers](https://laravel.com/docs/helpers), [Strings](https://laravel.com/docs/strings), [Dates (Carbon)](https://carbon.nesbot.com/docs/)

**The idea.** PHP's array functions have inconsistent names and argument orders. Laravel wraps arrays in a **Collection**, an object with a hundred chainable methods, like JavaScript's array methods. Every query that returns several rows (`get()`, a relation) gives a collection.

```php
$sets = [['kg' => 80, 'reps' => 8], ['kg' => 85, 'reps' => 6], ['kg' => 90, 'reps' => 3]];
```

```
> collect($sets)->sum(fn ($s) => $s['kg'] * $s['reps']);
= 1420
> collect($sets)->where('reps', '>=', 6)->pluck('kg');
= [80, 85]
> collect($sets)->max('kg');
= 90
> collect([1, 2, 3, 4])->filter(fn ($n) => $n % 2 === 0)->map(fn ($n) => $n * 10)->values();
= [20, 40]
> collect(['b', 'a', 'c'])->sort()->values()->implode(',');
= "a,b,c"
```

| Method | Like in JavaScript | Does |
|---|---|---|
| `map(fn)` | `map` | Transforms each item |
| `filter(fn)` | `filter` | Keeps the items for which fn is true. **Keeps the keys**: add `values()` to renumber |
| `first(fn)`, `firstWhere('kg', 85)` | `find` | The first match |
| `pluck('kg')` | `map(s => s.kg)` | One key of each item |
| `sum`, `max`, `avg`, `count` | | Totals |
| `sortBy('kg')`, `groupBy('kg')`, `keyBy('id')` | | Order, group, index |
| `mapWithKeys(fn)` | `Object.fromEntries` | Builds a map |
| `each(fn)` | `forEach` | Runs fn on each |

**The `values()` trap.** `filter()` and `sort()` keep the original keys: `[1 => 20, 3 => 40]`. In JSON that becomes an object `{"1": 20, "3": 40}`, not a list. `values()` renumbers them `0, 1, 2…`. `ExerciseResource` calls it after sorting the muscles.

**String and date helpers:**

```
> Str::slug('Panca Piana con Bilanciere');
= "panca-piana-con-bilanciere"
> Str::limit('A very long note about squats', 10);
= "A very lon..."
> Str::plural('exercise');
= "exercises"
> now()->format('Y-m-d');                     // now(): the current date and time, a Carbon object
= "2026-11-06"
> now()->addDays(3)->isWeekend();
= false
```

**In AtleoPlan:** `SavePersonalExercise::syncMuscles()` (`collect()->mapWithKeys()`), `ExerciseResource` (`sortBy`, `map`, `values`), the seeders (`foreach` on a constant array).

**Recap**
- `collect($array)` gives a collection; queries return one already.
- `map`, `filter`, `pluck`, `sum`, `sortBy`, `firstWhere` cover most needs.
- After `filter` or `sort`, `values()` before sending JSON.
- `Str::` for text, `now()` for dates.

**Exercise.** With `$sets`, find how many reps were done at 85 kg, in one line.

<details>
<summary>Solution</summary>

```php
> collect($sets)->firstWhere('kg', 85)['reps'];
= 6
```
</details>

---

## L1.10 Factories and seeders

**Standard** · [Factories](https://laravel.com/docs/eloquent-factories), [Seeding](https://laravel.com/docs/seeding)

**The idea.** Tests need rows, and lots of them, with realistic values. A **factory** describes what a typical row looks like; a test then asks for as many as it needs. A **seeder** fills the database with starting data: the fixed lists the app needs, or a development account.

**The factory of the running example:**

```php
class NoteFactory extends Factory
{
    // A typical note. fake() is Faker: random but realistic values
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),       // a new user, created with the note
            'title' => fake()->sentence(3),
            'body' => fake()->paragraph(),
            'pinned' => false,
        ];
    }

    // A "state": a named variation, Note::factory()->pinned()
    public function pinned(): static
    {
        return $this->state(['pinned' => true]);
    }
}
```

The model uses it through the `HasFactory` trait.

**Using it:**

| Code | Gives |
|---|---|
| `Note::factory()->create()` | One note, saved, with a new user |
| `Note::factory()->count(3)->create()` | Three |
| `Note::factory()->create(['title' => 'Squat day'])` | One, with this title |
| `Note::factory()->pinned()->create()` | One, through the state |
| `Note::factory()->for($ann)->create()` | One, belonging to `$ann` (fills the `belongsTo`) |
| `Note::factory()->make()` | One, **not** saved |

```
> $n = Note::factory()->pinned()->make();
> $n->exists;                   // exists: whether the row is in the database
= false
> $n->pinned;
= true
```

**Seeders** are classes in `database/seeders/`, run by `make fresh` (which empties the database first) or by `make artisan c="db:seed --class=MuscleSeeder"`. `DatabaseSeeder` calls the others in order.

**In AtleoPlan:**
- `database/factories/UserFactory.php`, with the `admin()` and `disabled()` states;
- `ExerciseFactory`, with `personal()`;
- `MuscleSeeder` and `EquipmentSeeder`, which can run again without duplicating: they look each row up by its slug.

[H1.5](../how-to/H1-database.md#h15-factories) and [H1.6](../how-to/H1-database.md#h16-seeders) go through both.

**Recap**
- A factory describes a typical row; `create()` saves, `make()` does not.
- States (`pinned()`) and `for($user)` build the variations a test needs.
- Seeders hold starting data; `make fresh` rebuilds the database with them.

**Exercise.** Create, in one line, three pinned notes belonging to `$ann`.

<details>
<summary>Solution</summary>

```php
Note::factory()->count(3)->pinned()->for($ann)->create();
```

`for($ann)` finds the relation `user()` from the model's class, so it is not named. When the relation's name differs from the class (`Exercise::owner()` returns a `User`), it is given: `->for($ann, 'owner')`.
</details>

---
## L1.11 Routes

**Standard** · [Routing](https://laravel.com/docs/routing), [Controllers: resource controllers](https://laravel.com/docs/controllers#resource-controllers)

**The idea.** A route ties an HTTP method and a path to the code that answers it. Routes live in `routes/`. Those in `api.php` all get the `/api` prefix and the API middleware ([L1.16](#l116-middleware)).

```php
// routes/api.php
Route::get('/health', fn () => response()->json(['status' => 'ok']));   // GET /api/health, inline
Route::get('/notes/{note}', [NoteController::class, 'show']);           // a controller method
```

**The methods follow REST:** `GET` reads, `POST` creates, `PUT`/`PATCH` change, `DELETE` removes.

**`apiResource`** writes the five usual routes of a resource in one line:

```php
Route::apiResource('notes', NoteController::class);
```

```sh
make artisan c="route:list --path=api/notes"
```

```
GET|HEAD        api/notes ............... notes.index › NoteController@index
POST            api/notes ............... notes.store › NoteController@store
GET|HEAD        api/notes/{note} .......... notes.show › NoteController@show
PUT|PATCH       api/notes/{note} ...... notes.update › NoteController@update
DELETE          api/notes/{note} .... notes.destroy › NoteController@destroy
```

**Route model binding.** `{note}` in the path, and a parameter `Note $note` with the same name in the method: Laravel loads the note with that id. If there is none, or it is soft-deleted, it answers **404** before the method runs.

**Groups** share middleware, a prefix or a name:

```php
// Every route inside needs a signed-in user: 401 otherwise
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [CurrentUserController::class, 'show']);
    Route::apiResource('notes', NoteController::class);
});
```

**Names** let code build a URL without writing it: `->name('health')`, then `route('health')`. `apiResource` names its routes itself: `notes.index`, `notes.show`…

**In AtleoPlan:** `routes/api.php`, with the health check, the user's routes and the exercise library. Fortify registers the sign-in routes itself, under `/api/auth` ([C2.7](../concepts/C2-backend.md#c27-signing-in-sanctum)).

**Recap**
- `Route::get|post|patch|delete(path, code)`; `apiResource` for the five of a resource.
- `{note}` + `Note $note` = route model binding, 404 by itself.
- `Route::middleware('auth:sanctum')->group(…)` protects many routes at once.
- `make artisan c="route:list"` is the truth about what exists.

**Exercise.** `apiResource('notes', …)` gives five routes. Which line gives only `index` and `show`, for a read-only resource?

<details>
<summary>Solution</summary>

```php
Route::apiResource('notes', NoteController::class)->only(['index', 'show']);
```

`->except(['destroy'])` does the opposite: all but those.
</details>

---

## L1.12 Controllers

**Standard** · [Controllers](https://laravel.com/docs/controllers)

**The idea.** A controller is a class that groups the code answering related routes, one method per action. `make:controller NoteController --api --model=Note` generated the five empty methods. Filled in:

```php
class NoteController extends Controller
{
    // GET /api/notes: my notes, pinned first, then newest, 20 per page
    public function index(Request $request): AnonymousResourceCollection
    {
        $notes = $request->user()->notes()      // the signed-in user's notes only
            ->orderByDesc('pinned')
            ->latest()
            ->paginate(20);

        return NoteResource::collection($notes);
    }

    // POST /api/notes: Laravel validates with StoreNoteRequest before this runs (L1.13)
    public function store(StoreNoteRequest $request): NoteResource
    {
        $note = $request->user()->notes()->create($request->validated());

        return new NoteResource($note);
    }

    // GET /api/notes/{note}: route model binding gives the note
    public function show(Note $note): NoteResource
    {
        Gate::authorize('view', $note);         // 403 unless NotePolicy::view() says yes (L1.14)

        return new NoteResource($note);
    }

    public function update(StoreNoteRequest $request, Note $note): NoteResource
    {
        Gate::authorize('update', $note);

        $note->update($request->validated());

        return new NoteResource($note);
    }

    public function destroy(Note $note): Response
    {
        Gate::authorize('delete', $note);

        $note->delete();                        // a soft delete

        return response()->noContent();         // 204, no body
    }
}
```

**What a method may return:** an API Resource ([L1.15](#l115-api-resources)), `response()->json([...])`, `response()->noContent()`, or a plain array, which Laravel turns into JSON.

**A thin controller.** Each method does three things: check permission, take validated data, call the work and return the answer. When the work grows beyond a few lines, it moves to a class of its own (an **action**, an AtleoPlan convention: [C2.5.3](../concepts/C2-backend.md#c253-actions-the-work-outside-the-controller)), which a test can call without HTTP.

**In AtleoPlan:** `CurrentUserController` (the smallest), `ExerciseController` (the complete one), `MuscleController`.

**Recap**
- One method per action: `index`, `store`, `show`, `update`, `destroy`.
- Parameters are filled by Laravel: the request, the Form Request, the model of the URL, any class.
- Permission, validation, work, answer; work longer than a few lines goes elsewhere.

**Exercise.** Someone writes `show()` without `Gate::authorize()`. What can any signed-in user now do?

<details>
<summary>Solution</summary>

Read anyone's note, by trying ids one after another: `/api/notes/1`, `/api/notes/2`… Route model binding loads any note that exists; only the policy checks whose it is. That is why every refusal has its own test ([L1.20](#l120-tests-with-pest)).
</details>

---

## L1.13 Validation: Form Requests

**Standard** · [Validation](https://laravel.com/docs/validation), [Form requests](https://laravel.com/docs/validation#form-request-validation)

**The idea.** Data from outside is never trusted. A **Form Request** is a class holding the rules of one endpoint. Put it among a controller method's parameters, and Laravel checks the data **before** the method runs. When a rule fails, it answers **422** with a message per field, and the method never runs.

```php
class StoreNoteRequest extends FormRequest
{
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:100'],
            'body' => ['nullable', 'string', 'max:5000'],   // nullable: may be sent as null
            'pinned' => ['boolean'],                        // true, false, 1, 0, "1", "0"
        ];
    }
}
```

**The trap.** `make:request` generates an `authorize()` method returning `false`, which refuses **every** request with a 403. Delete it, and leave permissions to the policy ([H2.3.6](../how-to/H2-backend.md#h236-the-trap-of-the-generated-authorize)).

**What a 422 looks like**, for `{"title": "", "pinned": "maybe"}`:

```json
{
  "message": "The title field is required. (and 1 more error)",
  "errors": {
    "title": ["The title field is required."],
    "pinned": ["The pinned field must be true or false."]
  }
}
```

The React app reads `errors` and shows each message under its field.

**`$request->validated()`** returns only the fields that have rules and passed them. Anything else the request carried (`user_id`, `is_admin`) is dropped: together with `#[Fillable]`, a second protection against mass assignment.

**Rules you will use:**

| Rule | Means |
|---|---|
| `required`, `nullable`, `sometimes` | Must be present / may be null / checked only when sent (for partial updates) |
| `string`, `integer`, `boolean`, `array` | The type |
| `max:100`, `min:3`, `between:1,100` | Characters for text, value for numbers, items for arrays |
| `email`, `url`, `regex:#…#` | Format |
| `in:mine,public`, `Rule::enum(Theme::class)` | One of a list |
| `exists:equipment,id` | A row with this value exists in that table |
| `unique:users,email` | No row has it yet |
| `confirmed` | A `password_confirmation` field matches |
| `'aliases.*' => [...]` | Each item of a list |

**Messages in the user's language** come from `lang/{it,es,de}/validation.php`. A field without a name there appears with its key, as in this real answer in Italian:

```json
{"message": "Il campo title è obbligatorio.", "errors": {"title": ["Il campo title è obbligatorio."]}}
```

Adding `'title' => 'titolo'` to `attributes` in `lang/it/validation.php` fixes it ([L1.19](#l119-translations)).

**In AtleoPlan:** `UpdatePreferencesRequest` (two rules), `StoreExerciseRequest` (lists, enums, `exists`, `regex`), `UpdateExerciseRequest` (the same with `sometimes`), `ListExercisesRequest` (the query string of a `GET`).

**Recap**
- A Form Request among the parameters = validated before the method; 422 with `errors` otherwise.
- Delete the generated `authorize()`.
- Use `$request->validated()`, never `$request->all()`.
- Messages and field names are translated in `lang/`.

**Exercise.** Write the rules for an optional `tags` field: a list of at most 5 texts, each at most 20 characters, no repeats.

<details>
<summary>Solution</summary>

```php
'tags' => ['nullable', 'array', 'max:5'],
'tags.*' => ['string', 'max:20', 'distinct'],
```

On `array`, `max:5` counts items; on `string`, `max:20` counts characters. `StoreExerciseRequest` does the same for `aliases`.
</details>

---

## L1.14 Authorization: policies and Gate

**Standard** · [Authorization](https://laravel.com/docs/authorization)

**The idea.** **Authentication** says *who* you are (signed in or 401). **Authorization** says *what you may do* (allowed or 403). A **policy** holds the yes/no answers for one model, one method per action. Laravel finds `NotePolicy` for `Note` by its name.

```php
class NotePolicy
{
    // Laravel passes the signed-in user, then the note
    public function view(User $user, Note $note): bool
    {
        return $note->user_id === $user->id;
    }

    public function update(User $user, Note $note): bool
    {
        return $note->user_id === $user->id;
    }

    public function delete(User $user, Note $note): bool
    {
        return $note->user_id === $user->id;
    }
}
```

`make:policy NotePolicy --model=Note` generates seven methods returning `false`; keep only those used.

**Asking it:**

| Where | Code | When it says no |
|---|---|---|
| Controller | `Gate::authorize('update', $note)` | A 403 exception: the method stops |
| Anywhere | `$user->can('update', $note)` | `false`, to decide yourself |
| Creating (no row yet) | `Gate::authorize('create', Note::class)` | The method has only `$user` |

The answer to a refused request:

```json
{"message": "This action is unauthorized."}
```

(With `APP_DEBUG` on, as in development, it also carries the exception and its stack trace.)

**A forgotten `Gate::authorize()`** is invisible: everything keeps working, for everyone. Only a test of the refusal catches it. Removed from `destroy()`, the test of [L1.20](#l120-tests-with-pest) said:

```
FAILED  Tests\Feature\NoteApiTest > it refuses someone else's note
Expected response status code [403] but received 204.
Failed asserting that 204 is identical to 403.
```

**Lists are not checked row by row.** Asking the policy for every row would mean loading them all. A list restricts the query instead: `$request->user()->notes()` in `index()`, or a scope like `Exercise::visibleTo($user)`.

**In AtleoPlan:** `app/Policies/ExercisePolicy.php`, and why public exercises are refused even to admins: [C2.5.1](../concepts/C2-backend.md#c251-permissions-policies).

**Recap**
- 401 = not signed in; 403 = signed in, not allowed.
- A policy per model, a method per action, found by name.
- `Gate::authorize()` in the controller; a test for every refusal.
- Lists filter the query; they do not ask the policy per row.

**Exercise.** Admins should be able to see, change and delete every note. Add it to `NotePolicy` without touching the three methods.

<details>
<summary>Solution</summary>

```php
// Runs before every other method of the policy
public function before(User $user): ?bool
{
    // true: allowed, without asking the method. null: "no opinion", the method decides
    return $user->is_admin ? true : null;
}
```

Returning `false` instead of `null` would refuse everything to non-admins, their own notes included.
</details>

---

## L1.15 API Resources

**Standard** · [Eloquent: API resources](https://laravel.com/docs/eloquent-resources)

**The idea.** An **API Resource** decides the JSON shape of a model: which columns leave the server, under which names. The generated `toArray()` returns `parent::toArray($request)`, every column. Listing them by hand means a column added later, a secret one say, never reaches the app by accident.

```php
/** @mixin \App\Models\Note */     // tells the editor that $this->title is the note's column
class NoteResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'body' => $this->body,
            'pinned' => $this->pinned,
            'created_at' => $this->created_at,
        ];
    }
}
```

**One row** (`new NoteResource($note)`), the real answer of `POST /api/notes`:

```json
{"data": {"id": 1, "title": "Squat day", "body": null, "pinned": null, "created_at": "2026-11-06T12:00:00.000000Z"}}
```

- **Wrapped in `data`.** Always, for one row and for lists.
- **Dates in ISO 8601**, in UTC: JavaScript's `new Date()` reads them as they are.
- **`"pinned": null`**: the defaults trap of [L1.6](#l16-eloquent-models-reading-and-writing).
- **Status 201, not 200.** Laravel notices that the model was just created.

**A list** (`NoteResource::collection($notes)`) from a paginator adds `links` and `meta`:

```json
{
  "data": [ … ],
  "links": {"first": "…/api/notes?page=1", "last": "…/api/notes?page=1", "prev": null, "next": null},
  "meta": {"current_page": 1, "from": 1, "last_page": 1, "path": "…/api/notes", "per_page": 20, "to": 1, "total": 1}
}
```

**Relations, only when loaded:** `'user' => new UserResource($this->whenLoaded('user'))` sends the author only if the controller loaded it with `with()`/`load()`; otherwise the key is left out, and the resource never runs a query by itself.

**In AtleoPlan:** `UserResource` (a user, without the password), `ExerciseResource` (translations, `whenLoaded`, the muscles sorted), `MuscleResource`.

**Recap**
- List the fields by hand; never `parent::toArray()`.
- `new XResource($model)` for one, `XResource::collection($rows)` for many; always inside `data`.
- A paginator adds `links` and `meta`; a new model answers 201.
- `whenLoaded()` for relations.

**Exercise.** Add to `NoteResource` an `excerpt`: the first 50 characters of the body, or `null` when there is no body.

<details>
<summary>Solution</summary>

```php
'excerpt' => $this->body ? Str::limit($this->body, 50) : null,
```

With `use Illuminate\Support\Str;` at the top. `Str::limit()` adds `...` when it cuts ([L1.9](#l19-collections-and-helpers)).
</details>

---

## L1.16 Middleware

**Standard** · [Middleware](https://laravel.com/docs/middleware)

**The idea.** A middleware is a step that every request of a group crosses on its way to the route, and the answer crosses on its way back. It can let the request through, change it, or stop it with an answer of its own. Signing in, CSRF protection and the session are all middleware.

```sh
make artisan c="make:middleware EnsureUserIsNotDisabled"
```

```
INFO  Middleware [app/Http/Middleware/EnsureUserIsNotDisabled.php] created successfully.
```

```php
class EnsureUserIsNotDisabled
{
    public function handle(Request $request, Closure $next): Response
    {
        // Before the route: anything here runs first
        return $next($request);     // pass the request on; what comes back is the answer
    }
}
```

**Where it runs**, decided in `bootstrap/app.php` or on the routes:

```php
// In bootstrap/app.php: on every request of the api group
$middleware->api(append: [SetLocaleFromRequest::class]);

// In routes/api.php: only on these routes, after auth:sanctum
Route::middleware(['auth:sanctum', EnsureUserIsNotDisabled::class])->group(function () { … });
```

`auth:sanctum` is itself a middleware: `auth`, with `sanctum` as its parameter (the "guard", [L1.17](#l117-signing-in-guards-sanctum-and-fortify)).

**In AtleoPlan:** `app/Http/Middleware/SetLocaleFromRequest.php` reads `Accept-Language` and sets the language of the request. The middleware of this lesson is what [BE-2](../project/backlog.md#be-2-manage-users-in-the-admin-panel) will build for real.

**Recap**
- A middleware wraps the route: code before `$next($request)`, code after.
- Registered for a group in `bootstrap/app.php`, or for some routes with `Route::middleware()`.
- Stopping the request = returning (or aborting with) an answer instead of calling `$next`.

**Exercise.** Write the body of `EnsureUserIsNotDisabled::handle()`: a signed-in user whose `disabled_at` is filled gets a 403.

<details>
<summary>Solution</summary>

```php
public function handle(Request $request, Closure $next): Response
{
    if ($request->user()?->disabled_at !== null) {
        abort(403, 'Account disabled.');       // abort(): stops with this status
    }

    return $next($request);
}
```

`?->`: on a route without sign-in, `user()` is null, and the check is skipped. Placed after `auth:sanctum`, the user is always there.
</details>

---

## L1.17 Signing in: guards, Sanctum and Fortify

**Standard** (the auth system) · **Official packages** (Sanctum, Fortify) · [Authentication](https://laravel.com/docs/authentication), [Sanctum](https://laravel.com/docs/sanctum), [Fortify](https://laravel.com/docs/fortify)

**The idea.** Laravel's **auth system** is standard: a **guard** decides how a request proves who it is (a session cookie, a token), and then the user is available everywhere. Two official packages build on it:
- **Sanctum** lets the React app use the session cookie on `/api` routes (and, later, a mobile app use tokens): the guard `sanctum` of `auth:sanctum`.
- **Fortify** provides the routes of signing up, in, out and resetting a password, with no screens.

**What you use every day, all standard:**

| Code | Gives |
|---|---|
| `$request->user()` | The signed-in user, or `null` |
| `Auth::user()`, `auth()->id()` | The same, where there is no `$request` |
| `Route::middleware('auth:sanctum')` | 401 for a visitor ([L1.11](#l111-routes)) |
| `Hash::make($password)`, `Hash::check($typed, $hash)` | Hash a password, check one |
| `$this->actingAs($user)` in a test | The next requests are made as `$user` ([L1.20](#l120-tests-with-pest)) |

**How the session works**, the cookies, CSRF and the rate limit, and the same steps written without Fortify: [C2.7](../concepts/C2-backend.md#c27-signing-in-sanctum), which is the long version of this lesson.

**In AtleoPlan:** `config/fortify.php`, `app/Providers/FortifyServiceProvider.php`, `app/Actions/Fortify/`, `bootstrap/app.php` (`statefulApi()`).

**Recap**
- The auth system and guards are Laravel; Sanctum and Fortify are official packages on top.
- `$request->user()` everywhere; `auth:sanctum` on the routes; `actingAs()` in tests.

**Exercise.** A test sends `getJson('/api/notes')` without `actingAs()`. Which status comes back, and which line of `routes/api.php` decides it?

<details>
<summary>Solution</summary>

401: the `notes` routes are inside `Route::middleware('auth:sanctum')->group(…)`. Without `actingAs()`, the request has no session, so the guard finds no user, and the middleware answers before the controller.
</details>

---

## L1.18 Configuration and .env

**Standard** · [Configuration](https://laravel.com/docs/configuration)

**The idea.** Settings live in `config/*.php`, one file per area. Each value reads an **environment variable** with a default; the variables of one computer are in `backend/.env`, never committed because it holds secrets.

```php
// config/app.php
'name' => env('APP_NAME', 'Laravel'),
```

```
> config('app.name');
= "AtleoPlan"
> config('app.locale');
= "en"
> config('nope.missing', 'default');     // the second argument: a default
= "default"
```

**The rule:** code reads `config('…')`, never `env('…')`. `env()` belongs inside `config/` only, because once the configuration is cached (on the server) `env()` returns nothing.

**Commands:** `make artisan c="config:show app"` shows the values in use; `make clear` empties the caches when a change seems ignored.

**In AtleoPlan:** `compose.yaml` sets some variables for Docker, and they win over `.env` ([C2.10](../concepts/C2-backend.md#c210-configuration-and-env)). A new variable goes in `.env.example` too, with a harmless value. [H2.7](../how-to/H2-backend.md#h27-a-setting-from-the-environment) adds one step by step.

**Recap**
- `config/` reads `env()`; the code reads `config()`.
- `.env` is secret and per computer; `.env.example` lists every variable.

**Exercise.** Which timezone does the app use? Find out without opening any file.

<details>
<summary>Solution</summary>

```php
> config('app.timezone');
```

or `make artisan c="config:show app"`, which lists every value of `config/app.php`.
</details>

---

## L1.19 Translations

**Standard** · [Localization](https://laravel.com/docs/localization)

**The idea.** The texts Laravel writes (validation errors, sign-in messages, emails) come from files in `lang/`, one folder or file per language. `__('key')` reads one, in the current language.

```php
> app()->setLocale('it');
> __('validation.required', ['attribute' => 'titolo']);     // :attribute is replaced
= "Il campo titolo è obbligatorio."
```

| File | Read with |
|---|---|
| `lang/it/validation.php`, a PHP array | `__('validation.required')`: file, then key |
| `lang/it.json`, `{"Note saved.": "Nota salvata."}` | `__('Note saved.')`: the English text is the key |

A key missing in the current language falls back to English (`config('app.fallback_locale')`), then to the key itself.

**The current language** is set per request with `app()->setLocale()`. Standard Laravel does not choose it for you: in AtleoPlan, the middleware `SetLocaleFromRequest` reads the `Accept-Language` header sent by the React app.

**In AtleoPlan:** `lang/{it,es,de}/`, `lang/{it,es,de}.json`, `lang/en/` for the few English additions. The React app's texts are separate, in `frontend/src/i18n/locales/` ([C1](../concepts/C1-frontend.md)). Content in the database (exercise names) is translated by a package, spatie/laravel-translatable: **third party**, not this system.

**Recap**
- `__('file.key')` or `__('English sentence')`; `:placeholders` in an array.
- `app()->setLocale()` per request; English as fallback.
- Field names for messages go in `validation.php` → `attributes`.

**Exercise.** The controller should answer "Nota salvata." to an Italian request. What do you write in the code, and where does the translation go?

<details>
<summary>Solution</summary>

In the code: `__('Note saved.')`, for example in `response()->json(['message' => __('Note saved.')])`. In `lang/it.json`: `"Note saved.": "Nota salvata."`, and likewise in `es.json` and `de.json`. English needs no file: the key is the English text.
</details>

---

## L1.20 Tests with Pest

**Standard** (HTTP tests, database helpers) · **Third party** (Pest, offered by Laravel's installer) · [Testing](https://laravel.com/docs/testing), [HTTP tests](https://laravel.com/docs/http-tests), [Database testing](https://laravel.com/docs/database-testing), [Pest](https://pestphp.com/docs)

**The idea.** A test calls the app as the React app would, and checks the answer and the database. It runs on a separate database (`atleoplan_test`), emptied for each test, so it never touches your data. If a later change breaks the behaviour, the test fails and says where.

**The tests of the running example**, `tests/Feature/NoteApiTest.php`:

```php
uses(RefreshDatabase::class);    // a clean database for each test

it('answers 401 to a visitor', function () {
    $this->getJson('/api/notes')->assertUnauthorized();
});

it('lists only my notes, pinned first', function () {
    $me = User::factory()->create();
    Note::factory()->for($me)->create(['title' => 'Old']);
    Note::factory()->for($me)->pinned()->create(['title' => 'Pinned']);
    Note::factory()->create(['title' => 'Someone else\'s']);      // another user's

    $this->actingAs($me)                      // signed in as $me
        ->getJson('/api/notes')
        ->assertOk()                          // 200
        ->assertJsonCount(2, 'data')          // two items in "data"
        ->assertJsonPath('data.0.title', 'Pinned');
});

it('creates a note', function () {
    $me = User::factory()->create();

    $this->actingAs($me)
        ->postJson('/api/notes', ['title' => 'Squat day'])
        ->assertCreated()                     // 201
        ->assertJsonPath('data.title', 'Squat day');

    // And it is in the table, with the right owner
    $this->assertDatabaseHas('notes', ['title' => 'Squat day', 'user_id' => $me->id]);
});

it('refuses a note without a title', function () {
    $this->actingAs(User::factory()->create())
        ->postJson('/api/notes', ['title' => ''])
        ->assertUnprocessable()               // 422
        ->assertJsonValidationErrors(['title']);
});

it('refuses someone else\'s note', function () {
    $note = Note::factory()->create();        // belongs to a new user

    $this->actingAs(User::factory()->create())
        ->deleteJson("/api/notes/{$note->id}")
        ->assertForbidden();                  // 403
});

it('deletes my note softly', function () {
    $note = Note::factory()->create();

    $this->actingAs($note->user)
        ->deleteJson("/api/notes/{$note->id}")
        ->assertNoContent();                  // 204

    $this->assertSoftDeleted($note);
});
```

```sh
make test f=NoteApi
```

```
PASS  Tests\Feature\NoteApiTest
✓ it answers 401 to a visitor                                          3.77s
✓ it lists only my notes, pinned first                                 0.48s
✓ it creates a note                                                    0.23s
✓ it refuses a note without a title                                    0.12s
✓ it refuses someone else's note                                       0.17s
✓ it deletes my note softly                                            0.07s
Tests:    6 passed (14 assertions)
```

**What to test for every endpoint:** success; invalid data (422); a visitor (401); someone else's row (403); a row that does not exist (404). The table of statuses and their assertions: [H2.3.5](../how-to/H2-backend.md#h235-the-tests-success-and-every-refusal).

**A test that has never failed proves little.** Break the line it guards (remove the `Gate::authorize()`), watch it fail ([L1.14](#l114-authorization-policies-and-gate)), put it back.

**Pest in a few words:**
- `it('does something', function () { … })` is one test.
- `expect($x)->toBe(…)` checks a value.
- `->with([...])` runs the same test with several inputs (a **dataset**).
- `make test f=Word` runs the tests whose file or name contains `Word`.

**In AtleoPlan:** `tests/Feature/Auth/` and `tests/Feature/ExerciseLibrary/`, the models to copy; [C2.11](../concepts/C2-backend.md#c211-tests-with-pest).

**Recap**
- `uses(RefreshDatabase::class)`, factories for the data, `actingAs()` to sign in.
- `getJson`/`postJson`/`patchJson`/`deleteJson`, then `assert…` on the status and the JSON, `assertDatabaseHas` on the table.
- Success and every refusal; see each test fail once.

**Exercise.** Write the test "changes my note": the owner sends a new title with `PATCH`, gets 200, and the title has changed.

<details>
<summary>Solution</summary>

```php
it('changes my note', function () {
    $note = Note::factory()->create(['title' => 'Old']);

    $this->actingAs($note->user)
        ->patchJson("/api/notes/{$note->id}", ['title' => 'New'])
        ->assertOk()
        ->assertJsonPath('data.title', 'New');

    expect($note->fresh()->title)->toBe('New');
});
```

`fresh()` reads the row again: `$note` in the test still holds the old title.
</details>

---

## L1.21 What Laravel has that the project does not use yet

**Standard** · the pages linked below

Laravel covers much more than an API needs at first. These parts are not in the code yet, or only indirectly; each will get its lesson when the app uses it.

| Part | What it is for | In AtleoPlan |
|---|---|---|
| [Queues and jobs](https://laravel.com/docs/queues) | Slow work in the background, out of the request | The `queue` container runs; the video conversion of `feat/exercise-media` will be the first job. Example: [H2.5](../how-to/H2-backend.md#h25-work-in-the-background) |
| [Notifications](https://laravel.com/docs/notifications), [Mail](https://laravel.com/docs/mail) | Emails and other messages | Only the password reset email, sent by Laravel itself ([C2.7.5](../concepts/C2-backend.md#c275-forgot-password)); Mailpit shows it |
| [File storage](https://laravel.com/docs/filesystem) | Files on a "disk": local, or a cloud like R2 | Indirectly: the import copies the photos to the `public` disk (`storage/app/public`) through medialibrary; uploads come with the photos and videos of `feat/exercise-media` ([D2.5](../design/D2-decisions.md#d25-photos-and-videos)) |
| [Task scheduling](https://laravel.com/docs/scheduling) | Commands that run at set times | Not yet; `routes/console.php` is where they would go |
| [Events](https://laravel.com/docs/events) | Code reacting to something that happened | Not yet |
| [Cache](https://laravel.com/docs/cache) | Keeping a result to avoid recomputing it | Not yet |
| [Blade](https://laravel.com/docs/blade) | HTML templates | Only Laravel's welcome page; the screens are React's, and the admin panel is Filament's |
| [Artisan commands of your own](https://laravel.com/docs/artisan#writing-commands) | `php artisan app:something` | **In use now:** `exercises:import`, the free-exercise-db import, with its options, progress bar and tests ([C2.14](../concepts/C2-backend.md#c214-artisan-commands-of-our-own)) |
---

## L1.22 What in this project is not plain Laravel

The other side of the course: what you would **not** find in a new Laravel project, so that you know which documentation to read.

| Piece | Kind | What it does here | Its documentation |
|---|---|---|---|
| Sanctum | Official package | Session cookie on `/api`, later tokens | [laravel.com/docs/sanctum](https://laravel.com/docs/sanctum) |
| Fortify | Official package | Sign-up, sign-in, password reset routes | [laravel.com/docs/fortify](https://laravel.com/docs/fortify) |
| Tinker, Pint, Pail | Official packages | Console, code formatter, log viewer | laravel.com/docs |
| Pest | Third party | The test runner | [pestphp.com](https://pestphp.com/docs) |
| Filament | Third party | The admin panel at `/admin` | [filamentphp.com/docs](https://filamentphp.com/docs) |
| spatie/laravel-query-builder | Third party | The `filter[...]` of the exercise list | [spatie.be/docs/laravel-query-builder](https://spatie.be/docs/laravel-query-builder) |
| spatie/laravel-translatable | Third party | Translated columns (`$exercise->name`) | [spatie.be/docs/laravel-translatable](https://spatie.be/docs/laravel-translatable) |
| spatie/laravel-medialibrary | Third party | Photos and videos of exercises | [spatie.be/docs/laravel-medialibrary](https://spatie.be/docs/laravel-medialibrary) |
| Actions in `app/Actions/` | AtleoPlan | Work outside the controller; plain classes ([C2.5.3](../concepts/C2-backend.md#c253-actions-the-work-outside-the-controller)) | — |
| `SetLocaleFromRequest` | AtleoPlan | The request's language, from `Accept-Language` | [L1.19](#l119-translations) |
| The Makefile, Docker | AtleoPlan | `make artisan`, `make test`… instead of `php artisan` | [S1.8](../start/S1-setup.md#s18-everyday-commands) |
| Comments on every line | AtleoPlan | For learning; most Laravel projects comment far less | [P1.2](../project/P1-conventions.md#p12-code) |

---

## L1.23 Final exercise and clean-up

**Build the notes yourself**, on the branch of [L1.1](#l11-how-this-course-works), from an empty start, looking back at the lessons only when stuck:

1. `make artisan c="make:model Note -mf"`; fill the migration; `make migrate` (L1.3, L1.5).
2. The model: `#[Fillable]`, `casts()`, `$attributes` for `pinned`, `SoftDeletes`, the relation `user()`; the relation `notes()` on `User` (L1.6, L1.7).
3. The factory, with the `pinned()` state (L1.10). Try it all in tinker.
4. The scope `pinned()` (L1.8).
5. `make:controller NoteController --api --model=Note`, `make:request StoreNoteRequest`, `make:policy NotePolicy --model=Note`, `make:resource NoteResource`, `make:test NoteApiTest --pest` (L1.12–L1.15, L1.20).
6. The route: `Route::apiResource('notes', …)` inside the `auth:sanctum` group (L1.11).
7. The tests of L1.20, plus the exercises: changing a note, `excerpt`, the admin's `before()`.
8. `make test f=NoteApi` until green; then break each `Gate::authorize()` once and watch a test fail.

**Then throw it all away.** The order matters: the migration must be rolled back **while its file still exists**, or the `notes` table stays in your database with nothing to remove it.

```sh
make artisan c="migrate:rollback --step=1"   # drops the notes table (runs down())
git add -A && git commit -m "Notes exercise"  # keeps the work on the branch, so switching is clean
git switch main
git branch -D learn/notes                     # -D: delete even though never merged
```

The test database needs nothing: each test run rebuilds it from the migrations that exist.

---

## L1.24 Where to go next

**The official documentation**, in this order, which follows the course: *Request lifecycle*, *Routing*, *Controllers*, *Requests*, *Validation*, *Eloquent* (Getting started, Relationships, Collections, API resources, Factories), *Database* (Migrations, Query builder, Pagination, Seeding), *Authorization*, *Testing* (HTTP tests, Database). Then *Queues*, *Notifications*, *File storage*, when the project gets there. All at https://laravel.com/docs.

**Elsewhere:**
- **Laravel Bootcamp** (https://bootcamp.laravel.com): the Laravel team's guided tutorial, a small app from start to finish.
- **Laracasts** (https://laracasts.com): video courses; "30 Days to Learn Laravel" starts from zero.
- **The PHP manual** (https://www.php.net/manual): for the language itself.

**In this repository**, after the course: [C2. Backend](../concepts/C2-backend.md) for how the app is built, [H1](../how-to/H1-database.md) and [H2](../how-to/H2-backend.md) when building a new piece, [D3](../design/D3-data-model.md) for the tables.

---

← [P1. Conventions](../project/P1-conventions.md) · [Contents](../README.md) · [L2. React course](L2-react.md) →
