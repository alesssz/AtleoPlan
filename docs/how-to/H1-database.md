# H1. Database: how to

[D3. Data model](../design/D3-data-model.md) says **what** the tables are. This page says **how** to build them: which commands to type, which files they create, what to write in each file, how to fill the database with data and how to check the result. It is written for someone who has never made a migration.

**The commands here have been run.** The example in [H1.2](#h12-a-new-table-from-start-to-finish) was built for real on this project's database, then removed; the outputs shown are what the commands printed. [H1.10](#h110-the-exercise-library-as-built) follows the real tables of the exercise library, which are now in the code.

**How to read this page:**

- The first time: read [H1.1](#h11-before-you-start), then follow [H1.2](#h12-a-new-table-from-start-to-finish) from top to bottom. It goes through every step once, on a real table.
- Later, when you need one thing: [H1.3](#h13-migrations) to [H1.6](#h16-seeders) are organised by file type, and [H1.11](#h111-commands-at-a-glance) lists every command.
- Tables linked to each other, on the real code: [H1.10](#h110-the-exercise-library-as-built).
- Filling the public exercise library from free-exercise-db: [H1.12](#h112-the-free-exercise-db-import-as-built).
- Tables whose ids are UUIDs made on the device, four levels deep, and a column added to `users` afterwards: [H1.13](#h113-the-plan-tables-as-built).
- Translating the imported library from files of the repository: [H1.14](#h114-the-translation-of-the-library-as-built).
- The workout tables: soft deletes on rows made by the phone, links that survive a deleted plan: [H1.15](#h115-the-workout-tables-as-built).
- Something broke: [H1.9](#h19-when-something-goes-wrong).
- What migrations and models are, in general: [C2.6](../concepts/C2-backend.md#c26-database-migrations-models-factories-seeders).

## Contents

- [H1.1 Before you start](#h11-before-you-start)
- [H1.2 A new table from start to finish](#h12-a-new-table-from-start-to-finish)
  - [H1.2.1 Generate the files](#h121-generate-the-files)
  - [H1.2.2 Write the migration](#h122-write-the-migration)
  - [H1.2.3 Look at the SQL, then run it](#h123-look-at-the-sql-then-run-it)
  - [H1.2.4 Write the model](#h124-write-the-model)
  - [H1.2.5 Write the factory](#h125-write-the-factory)
  - [H1.2.6 Write the seeder](#h126-write-the-seeder)
  - [H1.2.7 Look at the result](#h127-look-at-the-result)
  - [H1.2.8 Test it](#h128-test-it)
  - [H1.2.9 Finish](#h129-finish)
- [H1.3 Migrations](#h13-migrations)
  - [H1.3.1 Column types](#h131-column-types)
  - [H1.3.2 Column options](#h132-column-options)
  - [H1.3.3 Changing a table that already exists](#h133-changing-a-table-that-already-exists)
  - [H1.3.4 A pivot table](#h134-a-pivot-table)
  - [H1.3.5 Running migrations](#h135-running-migrations)
- [H1.4 Models](#h14-models)
  - [H1.4.1 Generating them](#h141-generating-them)
  - [H1.4.2 Casts](#h142-casts)
  - [H1.4.3 Relations](#h143-relations)
  - [H1.4.4 UUIDs, soft deletes, translations](#h144-uuids-soft-deletes-translations)
- [H1.5 Factories](#h15-factories)
- [H1.6 Seeders](#h16-seeders)
  - [H1.6.1 What goes in a seeder](#h161-what-goes-in-a-seeder)
  - [H1.6.2 Creating and running them](#h162-creating-and-running-them)
  - [H1.6.3 A seeder that can run again](#h163-a-seeder-that-can-run-again)
  - [H1.6.4 A large import](#h164-a-large-import)
  - [H1.6.5 On the server](#h165-on-the-server)
- [H1.7 Looking at the data](#h17-looking-at-the-data)
- [H1.8 Testing database code](#h18-testing-database-code)
- [H1.9 When something goes wrong](#h19-when-something-goes-wrong)
- [H1.10 The exercise library, as built](#h110-the-exercise-library-as-built)
  - [H1.10.1 Generate the files, in the right order](#h1101-generate-the-files-in-the-right-order)
  - [H1.10.2 Check the SQL before running it](#h1102-check-the-sql-before-running-it)
  - [H1.10.3 A pivot with a column of its own](#h1103-a-pivot-with-a-column-of-its-own)
  - [H1.10.4 Defaults a new model does not see](#h1104-defaults-a-new-model-does-not-see)
  - [H1.10.5 A package set up at start: the translations' fallback](#h1105-a-package-set-up-at-start-the-translations-fallback)
  - [H1.10.6 Fixed lists on a database that already has data](#h1106-fixed-lists-on-a-database-that-already-has-data)
  - [H1.10.7 Trying things in tinker without leaving traces](#h1107-trying-things-in-tinker-without-leaving-traces)
  - [H1.10.8 Testing what the database refuses](#h1108-testing-what-the-database-refuses)
- [H1.11 Commands at a glance](#h111-commands-at-a-glance)
- [H1.12 The free-exercise-db import, as built](#h112-the-free-exercise-db-import-as-built)
  - [H1.12.1 The files](#h1121-the-files)
  - [H1.12.2 The data](#h1122-the-data)
  - [H1.12.3 Try it on five exercises](#h1123-try-it-on-five-exercises)
  - [H1.12.4 The whole library](#h1124-the-whole-library)
  - [H1.12.5 The tests](#h1125-the-tests)
  - [H1.12.6 When something goes wrong](#h1126-when-something-goes-wrong)
- [H1.13 The plan tables, as built](#h113-the-plan-tables-as-built)
  - [H1.13.1 Generate the files](#h1131-generate-the-files)
  - [H1.13.2 UUIDs as ids](#h1132-uuids-as-ids)
  - [H1.13.3 Check constraints, and a table without timestamps](#h1133-check-constraints-and-a-table-without-timestamps)
  - [H1.13.4 A column added to a table that already exists](#h1134-a-column-added-to-a-table-that-already-exists)
  - [H1.13.5 The relations of four levels](#h1135-the-relations-of-four-levels)
  - [H1.13.6 What happens on delete, tried](#h1136-what-happens-on-delete-tried)
  - [H1.13.7 Factories four levels deep, and the tests](#h1137-factories-four-levels-deep-and-the-tests)
- [H1.14 The translation of the library, as built](#h114-the-translation-of-the-library-as-built)
  - [H1.14.1 Measuring the work](#h1141-measuring-the-work)
  - [H1.14.2 How the texts were made](#h1142-how-the-texts-were-made)
  - [H1.14.3 What the checks found, and the fixes](#h1143-what-the-checks-found-and-the-fixes)
  - [H1.14.4 The command](#h1144-the-command)
  - [H1.14.5 Look at the result](#h1145-look-at-the-result)
  - [H1.14.6 The tests, and the errors met](#h1146-the-tests-and-the-errors-met)
- [H1.15 The workout tables, as built](#h115-the-workout-tables-as-built)
  - [H1.15.1 Generate and run](#h1151-generate-and-run)
  - [H1.15.2 The models](#h1152-the-models)
  - [H1.15.3 The tests](#h1153-the-tests)

---

## H1.1 Before you start

**Every command runs inside the container.** PHP is not installed on the computer ([S1. Setup](../start/S1-setup.md)). The `make` shortcuts in the repository root do it for you:

| You type | It runs |
|---|---|
| `make artisan c="make:model Muscle"` | `docker compose exec backend php artisan make:model Muscle` |
| `make migrate` | `… php artisan migrate` |
| `make fresh` | `… php artisan migrate:fresh --seed` |
| `make tinker` | `… php artisan tinker` |
| `make psql` | an SQL console on the development database |
| `make test` | `… php artisan test` |

The stack must be running: `make up`, and check it with `make ps`.

**Artisan** is Laravel's command-line tool. `make artisan c="list"` shows all its commands, and `make artisan c="help make:model"` explains one of them with all its options. The `make:…` commands write new files from Laravel's templates, which you then fill in.

**Two databases.**

- `atleoplan` is the development database. The app at http://localhost:8500 uses it, and so do `make migrate`, `make tinker` and `make psql`.
- `atleoplan_test` is used only by the tests. They empty and rebuild it by themselves ([H1.8](#h18-testing-database-code)), so you never migrate it by hand.

**The files of one table.** A new table usually touches five files, all in `backend/`:

| File | Folder | What it does |
|---|---|---|
| Migration | `database/migrations/` | Creates the table in the database |
| Model | `app/Models/` | The PHP class that reads and writes the table |
| Factory | `database/factories/` | Makes fake rows for tests |
| Seeder | `database/seeders/` | Puts starting rows in the database |
| Test | `tests/Feature/` | Checks that it all works |

Then the data model page ([D3](../design/D3-data-model.md)) must say the same as the code, in the same commit ([P1.3](../project/P1-conventions.md#p13-documentation)).

---

## H1.2 A new table from start to finish

The example is the `muscles` table of [D3.4.1](../design/D3-data-model.md#d341-muscles-and-equipment): a list of muscles with a stable key (`slug`) and a name in several languages. It is small but has the interesting parts: a unique column, a translated column and starting data.

This page's version is shortened: three muscles, two languages, few comments. The table now exists for real, with all 17 muscles in four languages and every line commented: `backend/app/Models/Muscle.php`, `database/seeders/MuscleSeeder.php` and the migration `…_create_muscles_table.php`. How it was built, together with the tables linked to it: [H1.10](#h110-the-exercise-library-as-built).

### H1.2.1 Generate the files

```sh
make artisan c="make:model Muscle -mfs"
```

The model name is **singular and in PascalCase** (`Muscle`, `PlanDay`). The letters after the dash ask for more files: `-m` a migration, `-f` a factory, `-s` a seeder. The output:

```
INFO  Model [app/Models/Muscle.php] created successfully.
INFO  Factory [database/factories/MuscleFactory.php] created successfully.
INFO  Migration [database/migrations/2026_11_06_073222_create_muscles_table.php] created successfully.
INFO  Seeder [database/seeders/MuscleSeeder.php] created successfully.
```

- **The table is named for you.** From `Muscle` Laravel writes `create_muscles_table`: plural and in snake_case. A `PlanDay` model gets `plan_days`.
- **The date at the start of the migration's name decides the order.** Migrations run oldest first, so a table runs after the ones it points to only if it was created after them.
- **Every generated file is nearly empty.** You fill it in the next steps.

The other options are in [H1.4](#h14-models).

### H1.2.2 Write the migration

What Laravel wrote:

```php
Schema::create('muscles', function (Blueprint $table) {
    $table->id();
    $table->timestamps();
});
```

You add the columns from the table in [D3.4.1](../design/D3-data-model.md#d341-muscles-and-equipment). Each row in the data model's table becomes one line here:

```php
public function up(): void
{
    // Schema::create() makes a new table; the function receives $table,
    // a Blueprint, and each call on it adds a column
    Schema::create('muscles', function (Blueprint $table) {
        // The id: a bigint that grows by itself, and the primary key
        $table->id();
        // A stable English key such as "lower-back"; unique() refuses duplicates
        $table->string('slug')->unique();
        // The name in every language, as JSON: {"en": "Chest", "it": "Petto"}
        $table->jsonb('name');
        // created_at and updated_at, filled in by Laravel
        $table->timestamps();
    });
}

public function down(): void
{
    // The opposite of up(): used by migrate:rollback
    Schema::dropIfExists('muscles');
}
```

- **`up()` makes the change, `down()` undoes it.** For a new table `down()` is already written. For an added column you write it yourself ([H1.3.3](#h133-changing-a-table-that-already-exists)).
- **The real file gets the full comments** of [P1.2](../project/P1-conventions.md#p12-code): a header saying what the table is for and pointing to section 6, and a line for every column.
- Which method gives which type is in [H1.3.1](#h131-column-types).

### H1.2.3 Look at the SQL, then run it

Before running it, `--pretend` shows the SQL that Laravel would send, without changing anything:

```sh
make artisan c="migrate --pretend"
```

```
2026_11_06_073222_create_muscles_table ................................
⇂ create table "muscles" ("id" bigserial not null primary key, "slug" varchar(255) not null, "name" jsonb not null, "created_at" timestamp(0) without time zone null, "updated_at" timestamp(0) without time zone null)
⇂ alter table "muscles" add constraint "muscles_slug_unique" unique ("slug")
```

This is the best way to learn what each method does. For example, `string()` became `varchar(255)`, and `unique()` became a separate constraint.

Then run it for real, and check:

```sh
make migrate
```

```
INFO  Running migrations.
2026_11_06_073222_create_muscles_table ........................ 71.40ms DONE
```

```sh
make artisan c="migrate:status"
```

```
2026_11_05_220000_add_account_columns_to_users_table ............... [4] Ran
2026_11_06_073222_create_muscles_table ............................. [5] Ran
```

The number in brackets is the **batch**. Every `make migrate` is one batch, and `migrate:rollback` undoes the last batch.

**Made a mistake?** As long as the migration exists only on your computer, because it has not been pushed, you can undo it, fix the file and run it again:

```sh
make artisan c="migrate:rollback"     # runs down(): the table is dropped
# … fix the migration …
make migrate                           # runs up() again
```

Once it has been pushed, never edit it again: write a new migration ([H1.3.3](#h133-changing-a-table-that-already-exists)).

### H1.2.4 Write the model

The model is the PHP class that stands for the table. What Laravel wrote is almost empty: by convention `Muscle` already reads and writes `muscles`. You add three things:

```php
namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\Translatable\HasTranslations;

// The columns that create() and update() may fill from an array (C2.6)
#[Fillable(['slug', 'name'])]
class Muscle extends Model
{
    /** @use HasFactory<\Database\Factories\MuscleFactory> */
    // HasFactory: makes Muscle::factory() work.
    // HasTranslations (spatie/laravel-translatable): one value per language
    use HasFactory, HasTranslations;

    // The columns HasTranslations manages
    public array $translatable = ['name'];
}
```

- **`#[Fillable]`** is a safety list. A column missing from it is silently ignored by `create()` and `update()`. You get no error: the value is just not saved ([H1.9](#h19-when-something-goes-wrong)).
- **`casts()`** converts values on the way in and out of the database, for example an enum, a boolean or a date. `muscles` needs none, because `HasTranslations` handles `name` by itself. The common casts are in [H1.4.2](#h142-casts).
- **Relations** go in the model too: [H1.4.3](#h143-relations).

### H1.2.5 Write the factory

A factory describes a **fake but realistic row**, for tests. `definition()` returns one value per column:

```php
public function definition(): array
{
    // fake() gives random realistic data; unique() never repeats a value,
    // because slug is a unique column
    $word = fake()->unique()->word();

    return [
        'slug' => $word,
        'name' => ['en' => ucfirst($word), 'it' => ucfirst($word)],
    ];
}
```

A test can then write `Muscle::factory()->create()` and get a saved muscle, without listing every column. The parts of a factory, such as states and relations, are in [H1.5](#h15-factories).

### H1.2.6 Write the seeder

A seeder **puts rows in the database**. A factory makes random data for tests; a seeder puts in the real starting data, here the list of muscles:

```php
namespace Database\Seeders;

use App\Models\Muscle;
use Illuminate\Database\Seeder;

class MuscleSeeder extends Seeder
{
    /** The muscles: slug => name per language (here three of the 17, D3.4.1). */
    private const MUSCLES = [
        'chest' => ['en' => 'Chest', 'it' => 'Petto'],
        'biceps' => ['en' => 'Biceps', 'it' => 'Bicipiti'],
        'lower-back' => ['en' => 'Lower back', 'it' => 'Zona lombare'],
    ];

    public function run(): void
    {
        foreach (self::MUSCLES as $slug => $name) {
            // Finds the row with this slug and updates it, or creates it:
            // running the seeder twice does not duplicate anything
            Muscle::updateOrCreate(['slug' => $slug], ['name' => $name]);
        }
    }
}
```

Run it alone:

```sh
make artisan c="db:seed --class=MuscleSeeder"
```

```
Database\Seeders\MuscleSeeder ...................................... RUNNING
Database\Seeders\MuscleSeeder .................................. 193 ms DONE
```

Running it a second time adds nothing, thanks to `updateOrCreate()`. With `create()` instead, the second run would fail on the unique `slug` ([H1.6.3](#h163-a-seeder-that-can-run-again)).

**For `make fresh` to run it**, add it to `DatabaseSeeder`, the seeder that runs all the others:

```php
public function run(): void
{
    // Order matters: a table runs after the ones it points to
    $this->call([
        MuscleSeeder::class,
    ]);

    User::factory()->admin()->create([…]);   // the test account, already there
}
```

### H1.2.7 Look at the result

Three ways, from the quickest to the most flexible.

**The table, as Postgres sees it:**

```sh
make artisan c="db:table muscles"
```

```
public.muscles .............................................................
Column ................................................................ Type
id int8, autoincrement .......... nextval('muscles_id_seq'::regclass) bigint
slug varchar ........................................ character varying(255)
name jsonb ........................................................... jsonb
created_at timestamp, nullable .............. timestamp(0) without time zone
updated_at timestamp, nullable .............. timestamp(0) without time zone
Index ......................................................................
muscles_pkey id ............................................. btree, primary
muscles_slug_unique slug ..................................... btree, unique
```

**The model, as Laravel sees it:** which columns are fillable, the casts and the relations. This is useful to check that the model matches the table.

```sh
make artisan c="model:show Muscle"
```

```
Attributes ..................................................... type / cast
id increments, unique ......................................... bigint / int
slug unique, fillable ............................... character varying(255)
name fillable ................................................ jsonb / array
```

**Tinker**, a PHP console with the whole app loaded. You type PHP and see the result straight away. It is the place to try a query before putting it in the code:

```sh
make tinker
```

```php
> Muscle::count()
= 3

> $m = Muscle::where('slug', 'chest')->first();
> $m->name                       // in the current language
= "Chest"

> app()->setLocale('it'); $m->name
= "Petto"

> $m->getTranslations('name')    // all the languages
= ["en" => "Chest", "it" => "Petto"]

> Muscle::pluck('slug')
= ["chest", "biceps", "lower-back"]

> Muscle::factory()->make()      // make(): built, not saved
> Muscle::create(['slug' => 'chest', 'name' => ['en' => 'X']])
// Illuminate\Database\UniqueConstraintViolationException: … duplicate key value
// violates unique constraint "muscles_slug_unique"
```

- **Tinker writes to the real development database.** `create()`, `update()` and `delete()` here change real data.
- `exit` or `Ctrl+D` closes it.
- **After changing a model, reopen tinker:** it keeps the code it loaded at the start.

### H1.2.8 Test it

```sh
make artisan c="make:test MuscleTest --pest"
```

```php
use App\Models\Muscle;
use Database\Seeders\MuscleSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

// Empties atleoplan_test and runs every migration before the tests of this
// file; each test's changes are undone after it (H1.8)
uses(RefreshDatabase::class);

test('the seeder can run twice without duplicating rows', function () {
    $this->seed(MuscleSeeder::class);
    $this->seed(MuscleSeeder::class);

    expect(Muscle::count())->toBe(3);
    $this->assertDatabaseHas('muscles', ['slug' => 'chest']);
});

test('a muscle reads its name in the current language', function () {
    $muscle = Muscle::factory()->create(['name' => ['en' => 'Chest', 'it' => 'Petto']]);

    app()->setLocale('it');

    expect($muscle->name)->toBe('Petto');
});
```

```sh
make test f=Muscle
```

```
PASS  Tests\Feature\MuscleTest
✓ the seeder can run twice without duplicating rows       2.69s
✓ a muscle reads its name in the current language         0.08s
Tests:    2 passed (3 assertions)
```

### H1.2.9 Finish

1. **The comments.** Generated files have none, so add the full comments of [P1.2](../project/P1-conventions.md#p12-code).
2. **The data model.** If anything differs from [D3](../design/D3-data-model.md), update it; if the table is new there, say it now exists ([D3.1.4](../design/D3-data-model.md#d314-which-task-creates-what)).
3. **The frontend.** If an endpoint returns the table, add its TypeScript type in `frontend/src/api/` ([C2.12](../concepts/C2-backend.md#c212-recipes)).
4. **The checks.** `make fix` formats the code, then `make check` runs every check.

---

## H1.3 Migrations

### H1.3.1 Column types

The types used in [D3](../design/D3-data-model.md), and the method that makes each one:

| Data model says | Migration | Postgres makes |
|---|---|---|
| `bigint` id | `$table->id()` | `bigserial` primary key |
| `uuid` id | `$table->uuid('id')->primary()` | `uuid` primary key ([D3.2.1](../design/D3-data-model.md#d321-which-kind-of-id)) |
| `→ users` | `$table->foreignId('user_id')->constrained()` | `bigint` + foreign key |
| `→ plans` with a UUID | `$table->foreignUuid('plan_id')->constrained()` | `uuid` + foreign key |
| `string` | `$table->string('slug')` | `varchar(255)` |
| `text` | `$table->text('notes')` | `text` |
| `integer`, `smallint` | `$table->integer('reps')`, `$table->smallInteger('position')` | `integer`, `smallint` |
| `numeric(7,3)` | `$table->decimal('weight_kg', 7, 3)` | `numeric(7, 3)` |
| `boolean` | `$table->boolean('timer_sound')` | `boolean` |
| `jsonb` | `$table->jsonb('name')` | `jsonb` |
| `enum` | `$table->enum('role', ['primary', 'secondary'])` | `varchar` + a check on the values |
| `timestampTz` | `$table->timestampTz('started_at')` | `timestamp with time zone` |
| `created_at`, `updated_at` | `$table->timestamps()` | two `timestamp` columns |
| `deleted_at` (soft delete) | `$table->softDeletesTz()` | `timestamp with time zone`, nullable |

The full list: the *Migrations* page of the Laravel docs, under "Available Column Types".

### H1.3.2 Column options

They go after the type, chained with `->`:

| Option | What it does |
|---|---|
| `->nullable()` | The cell may be empty (`NULL`). Without it, the column is required |
| `->default(90)` | The value when none is given. It also fills the rows that already exist |
| `->unique()` | No two rows with the same value; also creates an index |
| `->index()` | An index: faster searches on this column ([D3.2.6](../design/D3-data-model.md#d326-indexes)) |
| `->comment('…')` | A note stored in the database itself |

**Foreign keys:**

```php
// user_id points to users.id. constrained() works out the table from the name
$table->foreignId('user_id')->constrained();

// When the name does not say the table, it is given
$table->foreignId('owner_id')->nullable()->index()->constrained('users');

// What happens to this row when the row it points to is deleted (D3.7):
->cascadeOnDelete()     // deleted too
->nullOnDelete()        // the column becomes empty (it must be nullable)
// nothing                 Postgres refuses to delete the row pointed to
```

Column options such as `->nullable()` and `->index()` go **before** `->constrained()` ([D3.11](../design/D3-data-model.md#d311-traps-to-avoid)).

**A key on two columns**, as in a pivot table:

```php
$table->primary(['exercise_id', 'muscle_id']);   // the pair is the primary key
$table->unique(['plan_id', 'position']);         // the pair must be unique
```

**Check constraints** have no method; they are SQL, right after `Schema::create()` ([D3.2.8](../design/D3-data-model.md#d328-check-constraints)).

### H1.3.3 Changing a table that already exists

A migration that has run on another computer, or is on GitHub, **is never edited**: those databases have already run it and would not see the change. A change is a new migration:

```sh
make artisan c="make:migration add_position_to_muscles_table"
```

Laravel reads the name: `add_…_to_muscles_table` gives a migration that already uses `Schema::table('muscles', …)`. `Schema::table()` changes an existing table; `Schema::create()` makes a new one. If the name does not follow this pattern, add `--table=muscles`, or `--create=muscles` for a new table.

```php
public function up(): void
{
    Schema::table('muscles', function (Blueprint $table) {
        // Add a column. A required column on a table that already has
        // rows needs a default, or Postgres cannot fill the existing rows
        $table->smallInteger('position')->default(0);

        // Change a column: rewrite it in full, then ->change(). Options such
        // as ->nullable() and ->default() that are not repeated are lost;
        // indexes (unique, index) stay as they are, so ->unique() is not
        // repeated: it would try to create a second one
        $table->string('slug', 100)->change();

        // Rename and remove
        $table->renameColumn('old_name', 'new_name');
        $table->dropColumn('unused');

        // Remove a foreign key column together with its key
        $table->dropConstrainedForeignId('equipment_id');
    });
}

public function down(): void
{
    // The exact opposite, in reverse order
    Schema::table('muscles', function (Blueprint $table) {
        $table->dropColumn('position');
    });
}
```

[`add_account_columns_to_users_table`](../../backend/database/migrations/2026_11_05_220000_add_account_columns_to_users_table.php) is a real, commented example: it adds nine columns to `users`.

### H1.3.4 A pivot table

A pivot table links two tables many-to-many, as `exercise_muscle` does ([D3.4.3](../design/D3-data-model.md#d343-exercise_muscle)). It has no model of its own, so it is made with `make:migration`:

```sh
make artisan c="make:migration create_exercise_muscle_table"
```

The name follows Laravel's convention: **the two tables in the singular, in alphabetical order**, joined by `_`. With that name, `belongsToMany()` finds it by itself. The columns are in [D3.4.3](../design/D3-data-model.md#d343-exercise_muscle). Its migration must run after both tables it links, so it is created after them.

### H1.3.5 Running migrations

| Command | What it does | Data |
|---|---|---|
| `make migrate` | Runs the migrations not yet run | Kept |
| `make artisan c="migrate --pretend"` | Prints their SQL, changes nothing | Kept |
| `make artisan c="migrate:status"` | Lists every migration: run or pending, and its batch | Kept |
| `make artisan c="migrate:rollback"` | Undoes the last batch (runs `down()`) | Lost in those tables |
| `make artisan c="migrate:rollback --step=1"` | Undoes only the last migration | Lost in that table |
| `make fresh` | **Drops every table**, runs every migration, then the seeders | **All lost** |

`make fresh` also deletes the accounts you created by hand. To keep a copy first, run `make db-dump`; `make db-restore f=…` puts it back ([S1.8](../start/S1-setup.md#s18-everyday-commands)).

**After a `git pull`** that brings new migrations, run `make migrate`. `make artisan c="migrate:status"` shows any marked `Pending`.

---

## H1.4 Models

### H1.4.1 Generating them

`make:model` takes options that create the related files at the same time:

| Option | Also creates |
|---|---|
| `-m` | the migration |
| `-f` | the factory |
| `-s` | the seeder |
| `-c` | a controller; with `--api`, one with the five API methods |
| `--policy` | the policy (who may do what, [C2.12](../concepts/C2-backend.md#c212-recipes)) |
| `--pest` | a Pest test |
| `-a` | all of the above: migration, seeder, factory, policy, controller, form requests |

```sh
make artisan c="make:model Plan -mf --policy"   # a table the user owns
make artisan c="make:model Muscle -mfs"         # a list with starting data
```

**Enums**, for the fixed lists of values of [D3.2.4](../design/D3-data-model.md#d324-fixed-lists-of-values):

```sh
make artisan c="make:enum SetType --string"
```

```php
enum SetType: string
{
    case WarmUp = 'warm_up';     // the value stored in the column
    case Normal = 'normal';
}
```

`app/Enums/Theme.php` is a real one.

### H1.4.2 Casts

A cast converts a column's value when it is read from the database and when it is written back. They go in the model's `casts()` method:

```php
protected function casts(): array
{
    return [
        'theme' => Theme::class,             // the text "dark" ↔ Theme::Dark
        'is_admin' => 'boolean',             // true / false
        'disabled_at' => 'datetime',         // a date object (Carbon)
        'weight_kg' => 'decimal:3',          // the string "80.000", exact (D3.11)
        'machine_translated' => 'array',     // jsonb ↔ PHP array
    ];
}
```

`app/Models/User.php` has a commented `casts()`. A translatable column is not cast: `$translatable` handles it.

### H1.4.3 Relations

A relation is a model method saying how the table is linked to another. Once it is written, `$plan->days` reads the linked rows without writing SQL. Which relations each table has is in [D3](../design/D3-data-model.md); the code for the plans is in [D3.5.5](../design/D3-data-model.md#d355-the-relations-in-code).

| The table… | Method | Example |
|---|---|---|
| has a column pointing to another (`plan_days.plan_id`) | `belongsTo` | a day belongs to a plan: `return $this->belongsTo(Plan::class);` |
| is pointed to by many rows | `hasMany` | a plan has many days: `return $this->hasMany(PlanDay::class);` |
| is linked many-to-many through a pivot table | `belongsToMany` | an exercise has many muscles: `return $this->belongsToMany(Muscle::class)->using(ExerciseMuscle::class)->withPivot('role');` ([H1.10.3](#h1103-a-pivot-with-a-column-of-its-own)) |

```php
// In the model: the method's return type is the relation's class
public function days(): HasMany
{
    return $this->hasMany(PlanDay::class)->orderBy('position');
}
```

```php
// In the code
$plan->days;                                        // the days (one query)
$plan->days()->where('name', 'like', 'Day A%')->get(); // with () it is a query to add to
Plan::with('days.items')->find($id);                // plan, days and items: few queries in all
$exercise->muscles()->attach($chest, ['role' => 'primary']);  // add a pivot row
```

**`with()` avoids a common slowdown.** Looping over 20 plans and reading `$plan->days` in each makes 21 queries, one for the plans and one per plan. `Plan::with('days')` makes 2.

### H1.4.4 UUIDs, soft deletes, translations

These are traits added with `use` inside the class:

| Trait | When | What it changes |
|---|---|---|
| `HasUuids` | The id is a UUID ([D3.2.1](../design/D3-data-model.md#d321-which-kind-of-id)) | Fills the id with a new UUID when it is empty |
| `SoftDeletes` | The table has `deleted_at` ([D3.7](../design/D3-data-model.md#d37-what-happens-on-delete)) | `delete()` fills `deleted_at` instead of removing the row, and queries hide those rows; `withTrashed()` shows them again |
| `HasTranslations` | Columns with one value per language ([D3.4.5](../design/D3-data-model.md#d345-translations)) | Reads the current language, writes `['en' => …, 'it' => …]` |
| `HasFactory` | Always | Makes `Model::factory()` work |

---

## H1.5 Factories

A factory is used in **tests**, where each test creates the rows it needs, and sometimes by seeders, for example the test account. The real one to read is `database/factories/UserFactory.php`.

```php
Muscle::factory()->create();                     // one, saved
Muscle::factory()->count(5)->create();           // five
Muscle::factory()->make();                       // built but not saved
Muscle::factory()->create(['slug' => 'chest']);  // with some columns chosen
User::factory()->admin()->create();              // with a state (below)
```

**States** are named variations, written as methods of the factory:

```php
public function admin(): static
{
    return $this->state(fn (array $attributes) => ['is_admin' => true]);
}
```

**Foreign keys.** In `definition()`, a factory as a column's value creates the linked row when needed:

```php
// PlanFactory: a plan with no user given gets a new one
'user_id' => User::factory(),
```

```php
// In a test: choose the owner, or create the children too
Plan::factory()->for($user)->create();                    // this user's plan
Plan::factory()->has(PlanDay::factory()->count(3), 'days')->create();  // with 3 days
Exercise::factory()->hasAttached(Muscle::factory(), ['role' => 'primary'])->create();  // with a pivot row
```

---

## H1.6 Seeders

### H1.6.1 What goes in a seeder

| Kind of data | Example | Where |
|---|---|---|
| **Fixed lists** the app needs in order to work | the 17 muscles, the 12 kinds of equipment | Its own seeder (`MuscleSeeder`), also run on the server |
| **Development data**, for trying the app | the account `test@example.com` | `DatabaseSeeder`, never on the server |
| **A large import** | the public exercise library (DATA-1) | An Artisan command that reads a file: `make exercises-import` ([H1.6.4](#h164-a-large-import), [H1.12](#h112-the-free-exercise-db-import-as-built)) |

The tests do not use `DatabaseSeeder`: each test creates its rows with factories, or calls one seeder with `$this->seed(MuscleSeeder::class)`.

### H1.6.2 Creating and running them

```sh
make artisan c="make:seeder EquipmentSeeder"    # database/seeders/EquipmentSeeder.php
```

| Command | Runs |
|---|---|
| `make artisan c="db:seed"` | `DatabaseSeeder`, which calls the others |
| `make artisan c="db:seed --class=MuscleSeeder"` | only that seeder |
| `make fresh` | empties the database, runs the migrations, then `DatabaseSeeder` |

`DatabaseSeeder` lists the others in `$this->call([...])`. **The order matters:** `ExerciseSeeder` points to muscles and equipment, so it comes after their seeders.

### H1.6.3 A seeder that can run again

`db:seed` on a database that already has the rows must not fail or duplicate them. Look rows up by a stable key, such as `slug` or `external_id`, never by `id`:

```php
// One row: update it if the slug exists, create it if not
Muscle::updateOrCreate(['slug' => 'chest'], ['name' => ['en' => 'Chest', 'it' => 'Petto']]);

// Create it only if missing, without touching it otherwise
Muscle::firstOrCreate(['slug' => 'chest'], ['name' => [...]]);
```

With `create()`, the second run stops at the first duplicate: `UniqueConstraintViolationException` ([H1.2.7](#h127-look-at-the-result)).

### H1.6.4 A large import

Data that comes from outside, in hundreds or thousands of rows, goes in an **Artisan command** rather than a seeder: it takes options (`--limit`, `--update`), shows its progress, reports what failed, and runs on its own, after the database is ready. The exercise library's import is the real example: `make exercises-import` ([H1.12](#h112-the-free-exercise-db-import-as-built), [C2.14](../concepts/C2-backend.md#c214-artisan-commands-of-our-own)).

**Two ways to write the rows:**

| Way | Speed | What it allows |
|---|---|---|
| **One model per row**, `$exercise->save()` | One or more queries per row: fine for some thousands | Everything the model does: casts, translations, relations, photos, a transaction per row |
| **`upsert()` in groups** | One query per group of 500 | Plain columns only: no casts, no `HasTranslations`, no pivot rows, no files |

```php
// The upsert way, for big plain tables: inserts the new rows, updates those
// whose external_id already exists, 500 at a time
foreach (array_chunk($rows, 500) as $chunk) {
    Exercise::upsert($chunk, uniqueBy: ['external_id'], update: ['level', 'category']);
}
```

The exercise import uses the first way: 876 rows, each with translations, muscles and photos, which all need the model. Its rules:

- **Find each row by a stable key** (`external_id`), so a second run updates or skips instead of duplicating ([H1.6.3](#h163-a-seeder-that-can-run-again)).
- **One transaction per row,** not one for everything: a row that fails is rolled back alone, and the others are kept.
- **Files outside the transaction:** a rollback cannot remove a file already copied.
- **Do not undo people's work:** a row deleted by an admin stays deleted, and other languages are kept.

### H1.6.5 On the server

On the server only the fixed lists are seeded, with `php artisan db:seed --class=MuscleSeeder --force`. `--force` is required outside development. The test account never goes there. Deploying to a server is still to come ([OPS-3](../project/backlog.md#ops-3-deploy-to-the-free-server)).

---

## H1.7 Looking at the data

| Tool | When | How |
|---|---|---|
| **Tinker** | Try a query, read or fix a row with the models | `make tinker` ([H1.2.7](#h127-look-at-the-result)) |
| **psql** | Plain SQL | `make psql` |
| **Artisan** | The structure of a table or a model | `make artisan c="db:table muscles"`, `c="model:show Muscle"`, `c="db:show"` (every table, with sizes) |
| **A database program** | Browse the tables with a mouse | TablePlus, the one we use: connecting, browsing and editing safely are in [H4](H4-database-tools.md). In short: host `localhost`, port `5932`, database, user and password `atleoplan` |

**In psql:**

```sql
\dt                          -- the list of tables
\d muscles                   -- one table's columns, indexes and foreign keys
SELECT slug, name->>'it' AS it FROM muscles;   -- ->> reads one key of a jsonb
\q                           -- quit
```

**The SQL Eloquent sends**, in tinker:

```php
> echo Muscle::where('slug', 'chest')->toRawSql();
select * from "muscles" where "slug" = 'chest'
```

---

## H1.8 Testing database code

- **Tests use `atleoplan_test`,** never the development database. A test file that touches the database starts with `uses(RefreshDatabase::class);`. Before the file's first test, it empties `atleoplan_test` and runs every migration; then it undoes each test's changes after that test. Every test therefore starts from empty tables.
- **Each test creates what it needs** with factories ([H1.5](#h15-factories)), or with `$this->seed(MuscleSeeder::class)` for a fixed list.
- **Checks on the database:**

```php
$this->assertDatabaseHas('muscles', ['slug' => 'chest']);     // a row like this exists
$this->assertDatabaseMissing('muscles', ['slug' => 'neck']);  // none does
$this->assertDatabaseCount('muscles', 3);                     // exactly 3 rows
$this->assertSoftDeleted($exercise);                          // deleted_at is filled
expect(Muscle::count())->toBe(3);                             // Pest's way, with any value
```

More on Pest: [C2.11](../concepts/C2-backend.md#c211-tests-with-pest).

---

## H1.9 When something goes wrong

| Message or symptom | Cause | Fix |
|---|---|---|
| `Class "Laravel\…" not found`, after a `git pull` | A package added by someone else is not installed in the container | `make composer c=install` |
| `Class "App\Models\…" not found` for your own class | The `namespace` does not match the folder, or the file name does not match the class | Fix them; then `make composer c=dump-autoload` |
| `relation "muscles" does not exist` (`SQLSTATE[42P01]`) | The migration has not run | `make migrate`. In a test: `uses(RefreshDatabase::class)` is missing |
| `Nothing to migrate`, but the change is not in the database | A migration that had already run was edited | On your own branch: `migrate:rollback`, then `make migrate`. Pushed already: a new migration ([H1.3.3](#h133-changing-a-table-that-already-exists)) |
| A value given to `create()` or `update()` is not saved, with no error | The column is not in `#[Fillable]` | Add it, if a request may set it |
| `UniqueConstraintViolationException` (`23505`) | A second row with the same unique value; often a seeder run twice | `updateOrCreate()` ([H1.6.3](#h163-a-seeder-that-can-run-again)) |
| `Foreign key violation` (`23503`) | A row points to one that does not exist, or one that is still pointed to is being deleted | Seeders in the right order ([H1.6.2](#h162-creating-and-running-them)); see [D3.7](../design/D3-data-model.md#d37-what-happens-on-delete) for deletes |
| `Not null violation` (`23502`) | A required column was given no value | Give it, or add it to the factory's `definition()` |
| `column "position" of relation "muscles" contains null values` (`23502`), while migrating | A required column added to a table that already has rows: Postgres has no value for them | `->default(…)`, or `->nullable()` |
| `SQLSTATE[08006]`, `Connection refused` or `could not translate host name "postgres"` | Postgres is not running | `make up`, then `make ps` |
| Tinker does not see a change to a model | Tinker keeps the code it loaded | `exit` and `make tinker` again |
| `current transaction is aborted, commands ignored until end of transaction block` (`25P02`), in a test | A query ran after a database error, in the same transaction | Wrap the statement that fails in `DB::transaction()` ([H1.10.8](#h1108-testing-what-the-database-refuses)) |
| `relation "equipment" does not exist`, while migrating | A migration runs before the table it points to | The file of the table pointed to must have the earlier date ([H1.10.1](#h1101-generate-the-files-in-the-right-order)) |

---

## H1.10 The exercise library, as built

The first part of [BE-1](../project/backlog.md#be-1-exercise-library-api-and-admin) created four tables that point to each other ([D3.4](../design/D3-data-model.md#d34-exercise-library)). This section follows what was done, with the real output. It shows what [H1.2](#h12-a-new-table-from-start-to-finish) does not: foreign keys, a pivot table with an extra column, soft deletes, a package configured at start-up, and tests of what the database refuses.

| File | What it is |
|---|---|
| `database/migrations/2026_11_06_0942*_create_{muscles,equipment,exercises,exercise_muscle}_table.php` | The four tables |
| `app/Models/Muscle.php`, `Equipment.php`, `Exercise.php` | Their models, with the relations |
| `app/Models/ExerciseMuscle.php` | The pivot class, for the `role` column ([H1.10.3](#h1103-a-pivot-with-a-column-of-its-own)) |
| `app/Enums/LoggingType.php`, `MuscleRole.php` | The fixed lists of values |
| `database/factories/{Muscle,Equipment,Exercise}Factory.php` | Fake rows for tests |
| `database/seeders/MuscleSeeder.php`, `EquipmentSeeder.php` | The 17 muscles and 12 kinds of equipment, in four languages |
| `app/Providers/AppServiceProvider.php` | The fallback of translations ([H1.10.5](#h1105-a-package-set-up-at-start-the-translations-fallback)) |
| `tests/Feature/ExerciseLibrary/` | 16 tests |

### H1.10.1 Generate the files, in the right order

```sh
make artisan c="make:model Muscle -mfs"
make artisan c="make:model Equipment -mfs"
make artisan c="make:model Exercise -mf"
make artisan c="make:migration create_exercise_muscle_table"
make artisan c="make:enum LoggingType --string"
make artisan c="make:enum MuscleRole --string"
```

```
INFO  Migration [database/migrations/2026_11_06_094203_create_muscles_table.php] created successfully.
INFO  Migration [database/migrations/2026_11_06_094214_create_equipment_table.php] created successfully.
INFO  Migration [database/migrations/2026_11_06_094216_create_exercises_table.php] created successfully.
INFO  Migration [database/migrations/2026_11_06_094218_create_exercise_muscle_table.php] created successfully.
INFO  Enum [app/Enums/LoggingType.php] created successfully.
INFO  Enum [app/Enums/MuscleRole.php] created successfully.
```

(The lines for models, factories and seeders are left out.)

- **The order of the commands is the order of the migrations.** `exercises` points to `equipment`, so it must run after it, and it does, because its file was created later. Run in the opposite order, `migrate` would stop with `relation "equipment" does not exist`.
- **The pivot table has no model of its own:** `make:migration` alone. Its name says it creates a table, so the file already holds `Schema::create('exercise_muscle', …)`.
- **`make:model Equipment` names the table `equipment`**, without an "s". The generated migration shows it: `Schema::create('equipment', …)`.

### H1.10.2 Check the SQL before running it

```sh
make artisan c="migrate --pretend"
```

A part of the output, the lines that the migrations of H1.2 did not have:

```
⇂ create table "exercises" (… "logging_type" varchar(255) check ("logging_type" in ('weight_reps', 'reps', 'time', 'distance')) not null default 'weight_reps', … "machine_translated" jsonb not null default '[]', … "deleted_at" timestamp(0) with time zone null)
⇂ alter table "exercises" add constraint "exercises_owner_id_foreign" foreign key ("owner_id") references "users" ("id")
⇂ create index "exercises_owner_id_index" on "exercises" ("owner_id")
⇂ alter table "exercise_muscle" add constraint "exercise_muscle_exercise_id_foreign" foreign key ("exercise_id") references "exercises" ("id") on delete cascade
⇂ alter table "exercise_muscle" add primary key ("exercise_id", "muscle_id")
```

Each line is a decision of [D3](../design/D3-data-model.md):

| Line | Came from | Means |
|---|---|---|
| `check ("logging_type" in (…))` | `$table->enum(…)` | Postgres refuses any other value ([D3.2.4](../design/D3-data-model.md#d324-fixed-lists-of-values)) |
| `foreign key ("owner_id") references "users"`, with nothing after | `->constrained('users')` | Deleting a user who owns exercises is refused ([D3.7](../design/D3-data-model.md#d37-what-happens-on-delete)) |
| `create index … ("owner_id")` | `->index()` | Postgres does not index foreign keys by itself ([D3.2.6](../design/D3-data-model.md#d326-indexes)) |
| `on delete cascade` | `->cascadeOnDelete()` | An exercise deleted for good takes its pivot rows |
| `primary key ("exercise_id", "muscle_id")` | `$table->primary([…])` | The pair is unique: a muscle once per exercise |
| `deleted_at timestamp … with time zone` | `$table->softDeletesTz()` | The column of soft deletes |

Then `make migrate`:

```
2026_11_06_094203_create_muscles_table ........................ 42.64ms DONE
2026_11_06_094214_create_equipment_table ....................... 5.10ms DONE
2026_11_06_094216_create_exercises_table ...................... 22.03ms DONE
2026_11_06_094218_create_exercise_muscle_table ................ 20.25ms DONE
```

### H1.10.3 A pivot with a column of its own

`exercise_muscle` has a column besides the two ids: `role`. Two things make it usable:

1. **`withPivot('role')`** on the relation, or the column is not loaded at all.
2. **A pivot class**, so that `role` gets a cast to the enum, like any column of a model:

```sh
make artisan c="make:model ExerciseMuscle --pivot"
```

```php
class ExerciseMuscle extends Pivot
{
    protected $table = 'exercise_muscle';   // otherwise Laravel would guess exercise_muscles
    public $timestamps = false;             // the table has no created_at / updated_at

    protected function casts(): array
    {
        return ['role' => MuscleRole::class];
    }
}
```

```php
// In Exercise (and the other way round in Muscle)
public function muscles(): BelongsToMany
{
    return $this->belongsToMany(Muscle::class)->using(ExerciseMuscle::class)->withPivot('role');
}
```

In tinker:

```php
> $bench->muscles()->attach($chest, ['role' => MuscleRole::Primary]);
> $bench->muscles()->attach($triceps, ['role' => MuscleRole::Secondary]);
> foreach ($bench->fresh()->muscles as $m) { echo $m->slug, ' ', $m->pivot->role->name, PHP_EOL; }
chest Primary
triceps Secondary
> $bench->muscles()->wherePivot('role', MuscleRole::Primary)->pluck('slug');
= ["chest"]
```

### H1.10.4 Defaults a new model does not see

The table gives `logging_type` the default `weight_reps`, but a model just created does not read the row back. The value would be `null` until the next load. The model therefore repeats the defaults in `$attributes`:

```php
protected $attributes = [
    'logging_type' => 'weight_reps',
    'machine_translated' => '[]',     // the JSON text: the cast turns it into []
];
```

```php
> $bench = Exercise::create(['name' => ['en' => 'Barbell bench press', 'it' => 'Panca piana con bilanciere'], 'equipment_id' => $barbell->id]);
> var_export($bench->logging_type); echo json_encode($bench->machine_translated);
\App\Enums\LoggingType::WeightReps
[]
```

`UserFactory` does the same for the user's preferences.

### H1.10.5 A package set up at start: the translations' fallback

When a text is missing in the current language, spatie/laravel-translatable falls back to English. If English is missing too, it returns an empty string. A personal exercise is written in one language only ([D2.4](../design/D2-decisions.md#d24-languages)), so for a user who reads German its name would be blank. The fix is a setting, made once when the app starts, in `AppServiceProvider::boot()` ([C2.4](../concepts/C2-backend.md#c24-the-life-of-a-request)):

```php
use Spatie\Translatable\Facades\Translatable;

public function boot(): void
{
    Translatable::fallback(fallbackLocale: 'en', fallbackAny: true);
}
```

```php
> $mine = $user->exercises()->create(['name' => ['it' => 'Panca mia']]);
> app()->setLocale('de'); echo $mine->name;
Panca mia
> echo Muscle::where('slug', 'lower-back')->first()->name;
Unterer Rücken
```

`$user->exercises()->create(…)` also fills `owner_id` by itself: that is how the code sets the owner, which is deliberately not in `#[Fillable]`.

### H1.10.6 Fixed lists on a database that already has data

`DatabaseSeeder` now calls the two seeders first, so `make fresh` fills them. But `make fresh` also deletes your account and everything else. On a development database that already holds data, run only the two seeders:

```sh
make migrate
make artisan c="db:seed --class=MuscleSeeder"
make artisan c="db:seed --class=EquipmentSeeder"
```

```
Database\Seeders\MuscleSeeder ................................... 98 ms DONE
Database\Seeders\EquipmentSeeder ................................ 43 ms DONE
```

They use `updateOrCreate()` on the slug, so running them again is harmless ([H1.6.3](#h163-a-seeder-that-can-run-again)). **After pulling this branch on another computer**, these are the three commands to run.

### H1.10.7 Trying things in tinker without leaving traces

Tinker writes to the real database. To try creating, linking and deleting, open a transaction and undo it at the end:

```php
> DB::beginTransaction();
> // … create exercises, attach muscles, delete …
> $bench->delete(); echo Exercise::count(), ' visible, ', Exercise::withTrashed()->count(), ' with trashed';
1 visible, 2 with trashed
> DB::rollBack();
> Exercise::withTrashed()->count()
= 0
```

What Postgres refuses can be tried the same way. Each attempt goes in its own `DB::transaction()` ([H1.10.8](#h1108-testing-what-the-database-refuses)):

```php
> try { DB::transaction(fn () => $user->delete()); } catch (Throwable $e) { echo $e->getMessage(); }
SQLSTATE[23503]: Foreign key violation: 7 ERROR:  update or delete on table "users" violates fo…
> try { DB::transaction(fn () => DB::table('exercises')->update(['logging_type' => 'laps'])); } catch (Throwable $e) { echo $e->getMessage(); }
SQLSTATE[23514]: Check violation: 7 ERROR:  new row for relation "exercises" violates check constraint "exerci…
```

### H1.10.8 Testing what the database refuses

The tests are in `tests/Feature/ExerciseLibrary/`. Four factory tools build the rows with their relations:

```php
Exercise::factory()->personal()->create();                // owned by a new user (a state)
Exercise::factory()->for($barbell)->create();             // with this equipment (belongsTo)
Exercise::factory()->for($user, 'owner')->create();       // owned by $user: the relation's name, as it is not "user"
Exercise::factory()
    ->hasAttached($chest, ['role' => MuscleRole::Primary], 'muscles')
    ->create();                                           // with a pivot row
```

**A refusal is tested inside `DB::transaction()`:**

```php
it('refuses to delete a user who still owns exercises', function () {
    $exercise = Exercise::factory()->personal()->create();

    expect(fn () => DB::transaction(fn () => $exercise->owner->delete()))
        ->toThrow(QueryException::class, 'Foreign key violation');
});
```

**Without it**, any query after the refusal fails. Every test runs inside a transaction (that is how `RefreshDatabase` undoes it), and on Postgres an error ends that transaction. Written as `expect(fn () => $exercise->owner->delete())->toThrow(…)` followed by `expect(Exercise::count())->toBe(1)`, the test failed like this:

```
FAILED  Tests\Feature\ExerciseLibrary\TrapTest > it refuses to delete a user who still owns exercises
SQLSTATE[25P02]: In failed sql transaction: 7 ERROR:  current transaction is aborted, commands ignored until end of transaction block
```

`DB::transaction()` opens a nested transaction (a *savepoint*) and undoes only that, so the test goes on.

```sh
make test f=ExerciseLibrary
```

```
PASS  Tests\Feature\ExerciseLibrary\ExerciseLibrarySeedersTest
✓ it writes the 17 muscles and the 12 kinds of equipment
✓ it names every row in the four languages
✓ it can run again without duplicating anything
✓ it runs from DatabaseSeeder, so make fresh fills them too
PASS  Tests\Feature\ExerciseLibrary\ExerciseModelTest
✓ it reads the name in the current language, falling back to English
✓ it falls back to any language when English is missing too
…
✓ it refuses a muscle twice on the same exercise
Tests:    16 passed (97 assertions)
```

---

## H1.11 Commands at a glance

| What | Command |
|---|---|
| Model with migration, factory, seeder | `make artisan c="make:model Muscle -mfs"` |
| Migration only | `make artisan c="make:migration add_position_to_muscles_table"` |
| Seeder, factory, enum | `make artisan c="make:seeder EquipmentSeeder"`, `c="make:factory EquipmentFactory"`, `c="make:enum SetType --string"` |
| Test | `make artisan c="make:test MuscleTest --pest"` |
| The SQL of the pending migrations | `make artisan c="migrate --pretend"` |
| Run the migrations | `make migrate` |
| Which migrations have run | `make artisan c="migrate:status"` |
| Undo the last batch | `make artisan c="migrate:rollback"` |
| Rebuild the database with the seeders | `make fresh` (**deletes all data**; `make db-dump` first) |
| All seeders, or one | `make artisan c="db:seed"`, `make artisan c="db:seed --class=MuscleSeeder"` |
| Only the muscles and the equipment, harmless to repeat | `make reference-data` (`make setup` and `make exercises-import` run it) |
| PHP console | `make tinker` |
| SQL console | `make psql` |
| A table, a model, the database | `make artisan c="db:table muscles"`, `c="model:show Muscle"`, `c="db:show"` |
| Tests | `make test`, `make test f=Muscle` |
| Format, then every check | `make fix`, `make check` |
| Fill the public exercise library, then translate it | `make exercises-import`; try with `o="--limit=5"`, refresh with `o="--update"` ([H1.12](#h112-the-free-exercise-db-import-as-built)) |
| Translate it again, or one language | `make exercises-translate`, `o="--locale=it --force"` ([H1.14](#h114-the-translation-of-the-library-as-built)) |
| Two example plans for every user who has none, after the import | `make plans-demo` ([H3.13.1](H3-frontend.md#h3131-plans-to-look-at)) |
| A command of our own | `make artisan c="make:command ImportSomething"` |
| The SQL of undoing the last migration, without running it | `make artisan c="migrate:rollback --step=1 --pretend"` |

**Official documentation:** the Laravel pages *Migrations*, *Eloquent* (with *Relationships* and *Mutators / Casts*), *Factories* (under *Eloquent*), *Seeding* and *Database Testing*, at https://laravel.com/docs; and https://spatie.be/docs/laravel-translatable.

---

## H1.12 The free-exercise-db import, as built

The first part of DATA-1 fills the public library from [free-exercise-db](https://github.com/yuhonas/free-exercise-db): 876 exercises in English, with their muscles, equipment and 1,746 photos. The rules of the import, and why, are in [C2.14.3](../concepts/C2-backend.md#c2143-the-free-exercise-db-import); this section is the doing, with the real output of each command.

| File | What it is |
|---|---|
| `app/Console/Commands/ImportFreeExerciseDb.php` | The command `exercises:import`: reads the dataset, loops, prints the summary |
| `app/Actions/Exercises/ImportFreeExercise.php` | The rules for one exercise: matching, translations, muscles, logging type, photos |
| `app/Actions/Exercises/ImportResult.php`, `app/Enums/ImportOutcome.php` | What the action reports for each exercise |
| `tests/Feature/ExerciseLibrary/ImportFreeExerciseTest.php` | 18 tests, on a small dataset written by the tests themselves |
| `Makefile` | `make exercises-import`: clones the dataset once, then runs the command (and, since H1.14, the translation) |

### H1.12.1 The files

A command starts from `make:command`. Tried with a throwaway name:

```sh
make artisan c="make:command ImportSomethingDemo"
```

```
INFO  Console command [app/Console/Commands/ImportSomethingDemo.php] created successfully.
```

```php
namespace App\Console\Commands;

use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('app:import-something-demo')]
#[Description('Command description')]
class ImportSomethingDemo extends Command
{
    /**
     * Execute the console command.
     */
    public function handle()
    {
        //
    }
}
```

- **Laravel 13 writes the name and the description as attributes,** `#[Signature]` and `#[Description]`. Older code, and most tutorials, write them as two properties, `protected $signature = '…'` and `protected $description = '…'`; both work. The first version of our command used the properties, and was changed to the attributes to match what the generator writes.
- **The name it proposes** is `app:` plus the class name in kebab case. Ours is `exercises:import`: the part before the colon groups the commands in `php artisan list`.
- **`handle()`** is empty and has no return type: ours returns `int`, the exit code.

`ImportFreeExerciseDb.php` was written on this skeleton; the action is a plain class, as `make artisan c="make:class Actions/Exercises/ImportFreeExercise"` creates. What goes in each is in [C2.14](../concepts/C2-backend.md#c214-artisan-commands-of-our-own); the code is commented line by line.

**The command's help** comes from its signature:

```sh
make artisan c="help exercises:import"
```

```
Description:
  Import the public exercise library from free-exercise-db (DATA-1)

Usage:
  exercises:import [options]

Options:
      --path[=PATH]     The folder of free-exercise-db (default: storage/app/free-exercise-db)
      --update          Also refresh the exercises already imported, from the source
      --without-photos  Import the texts only, no photos
      --limit[=LIMIT]   Import only the first N exercises, to try it
  -h, --help            Display help for the given command. …
```

(Laravel's own options, such as `--quiet` and `--verbose`, follow.)

### H1.12.2 The data

`make exercises-import` downloads the dataset the first time, with Git, into `backend/storage/app/free-exercise-db`:

```sh
git clone --depth 1 https://github.com/yuhonas/free-exercise-db.git backend/storage/app/free-exercise-db
```

```
Cloning into 'backend/storage/app/free-exercise-db'...
remote: Enumerating objects: 3532, done.
remote: Counting objects: 100% (3532/3532), done.
remote: Compressing objects: 100% (3454/3454), done.
remote: Total 3532 (delta 171), reused 1835 (delta 71), pack-reused 0 (from 0)
Receiving objects: 100% (3532/3532), 94.07 MiB | 3.64 MiB/s, done.
Resolving deltas: 100% (171/171), done.
```

- **About 94 MB to download,** 200 MB on disk once unpacked (`du -sh backend/storage/app/free-exercise-db`).
- **`backend/storage/app/` is ignored by Git** (its `.gitignore`), so the dataset never ends up in the repository.
- **The container sees it** at `/app/storage/app/free-exercise-db`, through the `./backend` volume of `compose.yaml`: the command's default path.
- **`--depth 1`** downloads only the latest version, without the repository's history.
- **To get a newer version** later: `git -C backend/storage/app/free-exercise-db pull`, then `make exercises-import o="--update"`.

### H1.12.3 Try it on five exercises

The muscles and the equipment must be there first. `make exercises-import` makes sure of it, running `make reference-data` (the two seeders, harmless to repeat) before the command; `make setup` and `make fresh` fill them too. Calling `make artisan c="exercises:import"` directly skips that step.

```sh
make exercises-import o="--limit=5"
```

```
docker compose exec backend php artisan exercises:import --limit=5
Importing 5 exercises from /app/storage/app/free-exercise-db
 5/5 [▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓] 100%

Created: 5
Updated: 0
Unchanged: 0
Skipped, deleted by an admin: 0
Photos added: 10
```

The path is the container's: `/app` is `backend/` on your computer. A `Failed: N` line, with the list of failures, appears only when there are some.

**Look at the result** in `make tinker`. The first line imports the model's class: see [H1.12.6](#h1126-when-something-goes-wrong) for why it may be needed.

```php
> use App\Models\Exercise;
> Exercise::count();
= 5
> $e = Exercise::where('external_id', '3_4_Sit-Up')->first();
= App\Models\Exercise {#9762
    id: 4,
    owner_id: null,
    external_id: "3_4_Sit-Up",
    equipment_id: 11,
    name: "{\"en\": \"3/4 Sit-Up\"}",
    aliases: null,
    description: null,
    instructions: "{\"en\": [\"Lie down on the floor and secure your feet. …\", …]}",
    logging_type: "reps",
    level: "beginner",
    category: "strength",
    machine_translated: "[]",
    youtube_url: null,
    …
  }
> $e->name;
= "3/4 Sit-Up"
> $e->instructions;
= [
    "Lie down on the floor and secure your feet. Your legs should be bent at the knees.",
    "Place your hands behind or to the side of your head. You will begin with your back on the ground. This will be your starting position.",
    "Flex your hips and spine to raise your torso toward your knees.",
    "At the top of the contraction your torso should be perpendicular to the ground. Reverse the motion, going only ¾ of the way down.",
    "Repeat for the recommended amount of repetitions.",
  ]
> $e->muscles->map(fn ($m) => $m->slug.' '.$m->pivot->role->value);
= Illuminate\Support\Collection {#9719
    all: [
      "abdominals primary",
    ],
  }
```

What it shows:

- **The raw row and the model disagree on purpose.** Printing the model shows the columns as stored, `name` as the JSON `{"en": "3/4 Sit-Up"}`; `$e->name` goes through `HasTranslations` and gives the text.
- **`owner_id: null`:** a public exercise. **`equipment_id: 11`:** "body only", hence **`logging_type: "reps"`**, the guess of [C2.14.3](../concepts/C2-backend.md#c2143-the-free-exercise-db-import).
- **`id: 4`** although it is the first exercise of the source: Postgres never gives an id twice, not even the id of a row created inside a transaction that was then undone, as in the tinker tries of [H2.12.6](H2-backend.md#h2126-look-at-the-json).

The equipment, the logging type and the photos:

```php
> $e->equipment?->slug;
= "body-only"
> $e->logging_type;
= App\Enums\LoggingType {#…
    +name: "Reps",
    +value: "reps",
  }
> $e->getMedia('photos')->pluck('file_name');
= Illuminate\Support\Collection {#…
    all: [
      "0.jpg",
      "1.jpg",
    ],
  }
```

- **`body-only`** is "body only" in the source, through `Str::slug()`, hence the logging type `Reps`, an enum thanks to the cast.
- **The photos keep their names,** and medialibrary puts each in a folder named after its row of `media`: the first photo of the library is `backend/storage/app/public/1/0.jpg`, an `image/jpeg` of 38 KB.

### H1.12.4 The whole library

```sh
make exercises-import
```

```
docker compose exec backend php artisan exercises:import
Importing 876 exercises from /app/storage/app/free-exercise-db
 876/876 [▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓] 100%

Created: 871
Updated: 0
Unchanged: 5
Skipped, deleted by an admin: 0
Photos added: 1736
```

The five of the first try came out `Unchanged`, with their photos already there. 1,746 photos in all, not 1,752 (876 × 2): three exercises have no images in the source itself (`Kettlebell_Halo`, `Kettlebell_Halo_With_Overhead_Extension`, `Kettlebell_Overhead_Triceps_Extension`). They take 98 MB in `backend/storage/app/public` (`du -sh`).

**How the logging type came out,** counted in tinker:

```php
> Exercise::whereNull('owner_id')->selectRaw('logging_type, count(*) n')->groupBy('logging_type')->pluck('n', 'logging_type');
= Illuminate\Support\Collection {#8454
    all: [
      "reps" => 102,
      "weight_reps" => 637,
      "time" => 137,
    ],
  }
```

`selectRaw` with `groupBy` is SQL's `select logging_type, count(*) … group by logging_type`; `pluck('n', 'logging_type')` turns the rows into a map.

The exceptions, such as a weighted exercise with "body only" in the source, are for an admin to correct (BE-1, `feat/exercise-admin`).

**Run it again:** nothing changes.

```
Importing 876 exercises from /app/storage/app/free-exercise-db
 876/876 [▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓] 100%

Created: 0
Updated: 0
Unchanged: 876
Skipped, deleted by an admin: 0
Photos added: 0
```

**With `--update`,** every exercise is written again from the source: English texts, level, category, equipment and muscles.

```sh
make exercises-import o="--update"
```

```
Importing 876 exercises from /app/storage/app/free-exercise-db
 876/876 [▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓] 100%

Created: 0
Updated: 876
Unchanged: 0
Skipped, deleted by an admin: 0
Photos added: 0
```

About 4 seconds: without photos to copy, the work is a few queries per exercise.

**After `make fresh`** the library is empty again: `make fresh` rebuilds the database with the seeders, and the import is not one of them. Run `make exercises-import` again; the dataset is already downloaded.

### H1.12.5 The tests

```sh
make test f=ImportFreeExercise
```

```
PASS  Tests\Feature\ExerciseLibrary\ImportFreeExerciseTest
✓ it imports an exercise with its texts, equipment, muscles and photos                        4.30s
✓ it guesses how sets are logged from the category and the equipment with dataset "a strengt… 0.10s
✓ it guesses how sets are logged from the category and the equipment with dataset "a strengt… 0.08s
✓ it guesses how sets are logged from the category and the equipment with dataset "a plyomet… 0.07s
✓ it guesses how sets are logged from the category and the equipment with dataset "a stretch… 0.09s
✓ it guesses how sets are logged from the category and the equipment with dataset "cardio on… 0.08s
✓ it cleans the instructions: no HTML, no spaces around, no empty steps                       0.07s
✓ it keeps primary a muscle that is listed in both lists                                      0.12s
✓ it imports an exercise with no equipment and no instructions                                0.13s
✓ it refuses a muscle that is not one of ours, saving nothing                                 0.19s
✓ it leaves an exercise already imported as it is, unless asked to update                     0.15s
✓ it refreshes the English texts on update, keeping the other languages and the logging type  0.23s
✓ it does not bring back an exercise deleted by an admin                                      0.10s
✓ it adds the photos on a later run to an exercise that has none yet                          0.11s
✓ it imports the whole dataset and prints a summary                                           0.42s
✓ it imports only the first exercises with --limit, and only texts with --without-photos      0.17s
✓ it reports an exercise that fails and imports the others                                    0.13s
✓ it stops with a hint when the dataset is not there                                          0.09s

Tests:    18 passed (59 assertions)
```

They never read the real dataset. Each test writes a few exercises, in the same layout, into the system's temporary folder (`writeDataset()`), with tiny JPEG files as photos, and `Storage::fake('public')` keeps the copied photos in memory ([C2.14.2](../concepts/C2-backend.md#c2142-testing-a-command)).

### H1.12.6 When something goes wrong

| Message or symptom | Cause | Fix |
|---|---|---|
| `free-exercise-db not found: … does not exist.` | The dataset is not downloaded, or `--path` is wrong | `make exercises-import` clones it; check the folder `backend/storage/app/free-exercise-db/dist` |
| `Unknown equipment "body only": run the EquipmentSeeder…` (or `Unknown muscle`) for every exercise | A database without the fixed lists, such as after `make migrate` on a new one, with the command called directly. Met on the Windows computer after a pull, before `make exercises-import` filled them itself | `make reference-data` (the two seeders), then the import again |
| `Failed: 1` with one exercise named | That exercise has a value we do not know | The message says which; the others are imported. Add the value to the seeder if it is real |
| `Photos added: 0` on the first run | `o="--without-photos"`, or the dataset has no `exercises/` folder | Run again without the option: the missing photos are added |
| `git: command not found` | Git is not on the path of the terminal | On Windows, run `make` from Git Bash ([S1.2](../start/S1-setup.md#s12-prerequisites)) |
| In tinker, `Error  Class "Exercise" not found.` | Met on the first try. Tinker finds a class by its short name through Composer's class map (`vendor/composer/autoload_classmap.php`), written when the packages were installed; classes added since are missing from it | `use App\Models\Exercise;` first, or the full name `App\Models\Exercise::count()`. Or, once, `make composer c="dump-autoload"`, which rewrites the map (`Generated optimized autoload files containing 11202 classes`); tinker then says `[!] Aliasing 'Exercise' to 'App\Models\Exercise' for this Tinker session.` and the short name works |


## H1.13 The plan tables, as built

The first part of FEAT-2 created the four tables of a workout plan, `plans` → `plan_days` → `plan_items` → `plan_sets`, and the user's active plan ([D3.5](../design/D3-data-model.md#d35-plans)). This section follows what was done, with the real output, as a tutorial to repeat on the next table. It shows what [H1.10](#h110-the-exercise-library-as-built) does not: ids that are UUIDs made on the device, a column added to an existing table that points to a new one, check constraints, a table without timestamps, and a relation that skips a level. The API on top of these tables is [H2.13](H2-backend.md#h213-the-plans-api-as-built).

| File | What it is |
|---|---|
| `database/migrations/2026_11_07_0857*_create_{plans,plan_days,plan_items,plan_sets}_table.php` | The four tables |
| `database/migrations/2026_11_07_085803_add_active_plan_id_to_users_table.php` | `users.active_plan_id` |
| `app/Models/Plan.php`, `PlanDay.php`, `PlanItem.php`, `PlanSet.php` | Their models, with the relations |
| `app/Models/User.php` | Two new relations: `plans()`, `activePlan()` |
| `app/Enums/SetType.php` | normal, warm_up, drop, failure |
| `database/factories/Plan{,Day,Item,Set}Factory.php` | Fake rows for tests |
| `tests/Feature/Plans/PlanTablesTest.php` | 12 tests of the tables, without HTTP |

**After pulling this branch on another computer:** `make migrate`. No seeder: plans are made by users.

### H1.13.1 Generate the files

```sh
make artisan c="make:enum SetType --string"
make artisan c="make:model Plan -mf"
make artisan c="make:model PlanDay -mf"
make artisan c="make:model PlanItem -mf"
make artisan c="make:model PlanSet -mf"
make artisan c="make:migration add_active_plan_id_to_users_table"
```

```
INFO  Enum [app/Enums/SetType.php] created successfully.
INFO  Model [app/Models/Plan.php] created successfully.
INFO  Factory [database/factories/PlanFactory.php] created successfully.
INFO  Migration [database/migrations/2026_11_07_085754_create_plans_table.php] created successfully.
INFO  Model [app/Models/PlanDay.php] created successfully.
…
INFO  Migration [database/migrations/2026_11_07_085801_create_plan_sets_table.php] created successfully.
INFO  Migration [database/migrations/2026_11_07_085803_add_active_plan_id_to_users_table.php] created successfully.
```

- **The order of the commands is the order of the tables**, from the top: each level points to the one above, and a foreign key needs its table to exist ([H1.10.1](#h1101-generate-the-files-in-the-right-order)). The column on `users` comes last, because it points to `plans`.
- **`-mf` and no `s`:** no seeder, since plans are made by users, not shipped with the app.
- **`make:model PlanDay` names the table `plan_days`**: the class in snake case, plural ([D3.2.2](../design/D3-data-model.md#d322-table-names)).
- **The migration's name sets its content:** `add_active_plan_id_to_users_table` ends in `_to_users_table`, so the file already holds `Schema::table('users', …)`, for changing a table, not creating one.

### H1.13.2 UUIDs as ids

The id of a plan, a day and an item is made on the phone, so that a plan can be built offline ([D3.2.1](../design/D3-data-model.md#d321-which-kind-of-id)). Three changes from a table with numbers:

```php
// In the migration, instead of $table->id()
$table->uuid('id')->primary();

// A column pointing to a table whose id is a UUID: foreignUuid, not foreignId
$table->foreignUuid('plan_id')->constrained()->cascadeOnDelete();

// On the model
use HasFactory, HasUuids;
#[Fillable(['id', 'name', 'position'])]     // id fillable: the device's one is kept
```

`make artisan c="migrate --pretend"` shows what Postgres gets (the lines of `plans` and `plan_days`):

```
⇂ create table "plans" ("id" uuid not null, "user_id" bigint not null, "name" varchar(255) not null, "goal" varchar(255) null, "notes" text null, "version" integer not null default '1', "archived_at" timestamp(0) with time zone null, …)
⇂ alter table "plans" add constraint "plans_user_id_foreign" foreign key ("user_id") references "users" ("id") on delete cascade
⇂ alter table "plans" add primary key ("id")
⇂ create table "plan_days" ("id" uuid not null, "plan_id" uuid not null, "name" varchar(255) not null, "position" integer not null, …)
⇂ alter table "plan_days" add constraint "plan_days_plan_id_foreign" foreign key ("plan_id") references "plans" ("id") on delete cascade
⇂ create index "plan_days_plan_id_position_index" on "plan_days" ("plan_id", "position")
```

- **`"id" uuid`**: Postgres has a type of its own for UUIDs, 16 bytes rather than 36 characters of text, and it refuses anything that is not one.
- **`"plan_id" uuid`**: `foreignUuid()` made the column the same type as the id it points to. `foreignId()` would have made a `bigint`, and the foreign key would fail.
- **No index of its own on `plan_id`**: the index on `(plan_id, position)` serves both "the days of this plan" and "in order" ([D3.2.6](../design/D3-data-model.md#d326-indexes)).

In tinker, a plan created without an id gets one, and one sent is kept:

```php
> $plan = $user->plans()->create(['name' => 'Push Pull Legs']);
> echo $plan->id, ' version ', $plan->version;
01a1b53d-2107-7199-b80a-1e8a49d9d33f version 1
```

The id is a **UUIDv7**: its first characters are the time of creation, so ids made one after the other sort in that order. `version` reads 1 without reloading, because the model repeats the table's default in `$attributes` ([H1.10.4](#h1104-defaults-a-new-model-does-not-see)).

### H1.13.3 Check constraints, and a table without timestamps

`plan_sets` has two rules Postgres must enforce: the minimum reps not above the maximum, and the RPE between 1 and 10 ([D3.2.8](../design/D3-data-model.md#d328-check-constraints)). Laravel's `Blueprint` has no method for them, so they are SQL, right after `Schema::create()`:

```php
DB::statement('ALTER TABLE plan_sets ADD CONSTRAINT plan_sets_reps_range
    CHECK (target_reps_min <= target_reps_max)');
DB::statement('ALTER TABLE plan_sets ADD CONSTRAINT plan_sets_rpe_range
    CHECK (target_rpe BETWEEN 1 AND 10)');
```

`down()` needs nothing for them: `dropIfExists('plan_sets')` takes the constraints along with the table. Trying them in tinker, each attempt in its own `DB::transaction()` ([H1.10.7](#h1107-trying-things-in-tinker-without-leaving-traces)):

```php
> try { DB::transaction(fn () => $item->sets()->create(['position' => 2, 'target_reps_min' => 10, 'target_reps_max' => 8])); } catch (Throwable $e) { echo $e->getMessage(); }
SQLSTATE[23514]: Check violation: 7 ERROR:  new row for relation "plan_sets" violates check constraint "plan_sets_reps_r…
> try { DB::transaction(fn () => $item->sets()->create(['position' => 2, 'target_rpe' => 11])); } catch (Throwable $e) { echo $e->getMessage(); }
SQLSTATE[23514]: Check violation: 7 ERROR:  new row for relation "plan_sets" violates check constraint "plan_sets_rpe_ra…
```

The constraint's name in the message says which rule fired: that is why they are named.

**No timestamps on `plan_sets`.** Its rows are deleted and written again on every save ([D3.5.6](../design/D3-data-model.md#d356-saving-a-plan)), so a `created_at` would always say "now". The migration has no `$table->timestamps()`, and the model says so:

```php
public $timestamps = false;
```

Without that line, the first `create()` fails with `column "updated_at" of relation "plan_sets" does not exist`: Eloquent fills the two columns on every model unless told not to.

### H1.13.4 A column added to a table that already exists

`users.active_plan_id` points to `plans`, so it cannot be in the `users` migration, which runs long before `plans` exists. It is a migration of its own, after the plans ones:

```php
public function up(): void
{
    Schema::table('users', function (Blueprint $table) {
        $table->foreignUuid('active_plan_id')->nullable()->index()->constrained('plans')->nullOnDelete();
    });
}

public function down(): void
{
    Schema::table('users', function (Blueprint $table) {
        $table->dropConstrainedForeignId('active_plan_id');
    });
}
```

```
⇂ alter table "users" add column "active_plan_id" uuid null
⇂ alter table "users" add constraint "users_active_plan_id_foreign" foreign key ("active_plan_id") references "plans" ("id") on delete set null
⇂ create index "users_active_plan_id_index" on "users" ("active_plan_id")
```

- **`nullable()`**: users who exist already have no active plan, so the column must accept empty cells. A required column added to a table with rows needs a default instead.
- **`nullOnDelete()`** writes `on delete set null`: deleting the active plan empties the cell and keeps the user ([D3.7](../design/D3-data-model.md#d37-what-happens-on-delete)).
- **`constrained('plans')`**: the name `active_plan_id` does not say the table, so it is given.
- **`down()` must undo it**, and the order matters: the foreign key first, then the column. `dropConstrainedForeignId()` does both. Check it without running it:

```sh
make artisan c="migrate:rollback --step=1 --pretend"
```

```
⇂ alter table "users" drop constraint "users_active_plan_id_foreign"
⇂ alter table "users" drop column "active_plan_id"
```

(The index goes with the column, by itself.) Then `make migrate`:

```
2026_11_07_085754_create_plans_table .......................... 69.05ms DONE
2026_11_07_085757_create_plan_days_table ....................... 8.21ms DONE
2026_11_07_085759_create_plan_items_table ...................... 9.82ms DONE
2026_11_07_085801_create_plan_sets_table ....................... 9.56ms DONE
2026_11_07_085803_add_active_plan_id_to_users_table ............ 2.81ms DONE
```

On the model, the column is a `belongsTo` with its name given, and it is not fillable, so no request can point it at someone else's plan:

```php
public function activePlan(): BelongsTo
{
    return $this->belongsTo(Plan::class, 'active_plan_id');
}

$user->activePlan()->associate($plan)->save();     // sets active_plan_id
$user->activePlan()->dissociate()->save();         // empties it
```

### H1.13.5 The relations of four levels

Each level is a `hasMany` sorted by `position` on the way down, and a `belongsTo` on the way up. Two need care:

- **`PlanItem::day()`** is named `day`, not `planDay`, so the column is given: `belongsTo(PlanDay::class, 'plan_day_id')`. Laravel would otherwise look for `day_id`.
- **`PlanItem::exercise()`** reads deleted exercises too: `belongsTo(Exercise::class)->withTrashed()`. An exercise is soft-deleted, and the plan must keep showing it ([D3.11](../design/D3-data-model.md#d311-traps-to-avoid)).

**A relation that skips a level.** Saving a plan needs every item of every day. `Plan::items()` is a `hasManyThrough`:

```php
public function items(): HasManyThrough
{
    return $this->hasManyThrough(PlanItem::class, PlanDay::class);
}
```

```php
> echo $plan->items()->toRawSql();
select * from "plan_items" inner join "plan_days" on "plan_days"."id" = "plan_items"."plan_day_id" where "plan_days"."plan_id" = '01a1b53d-2107-7199-b80a-1e8a49d9d33f'
```

One query with a join. Laravel worked out the two columns from the class names (`plan_days.plan_id`, `plan_items.plan_day_id`). When it reads rows it selects `plan_items.*` and the plan's id as `laravel_through_key`, so the items' `id` is not mixed up with the days' `id`. A `pluck()` or `where()` on such a query must still name the table, `plan_items.id`, or Postgres answers `column reference "id" is ambiguous`.

**The whole tree in one line**, one query per level:

```php
> $loaded = Plan::with('days.items.sets')->find($plan->id);
> echo json_encode($loaded->days[0]->items[0]->sets->map(fn ($s) => [$s->set_type->value, $s->target_weight_kg]));
[["warm_up","40.000"],["normal","80.000"]]
```

The weights come back as exact text, `"40.000"`, from the cast `decimal:3` ([D3.11](../design/D3-data-model.md#d311-traps-to-avoid)).

### H1.13.6 What happens on delete, tried

In one tinker session inside `DB::beginTransaction()` … `DB::rollBack()`, a plan of one day, one item and two sets, made the active plan, then the exercise and the plan deleted:

```php
> $bench->delete();          // soft delete
> echo $item->fresh()->exercise->name, ' trashed: ', var_export($item->fresh()->exercise->trashed(), true);
Barbell bench press trashed: true
> try { DB::transaction(fn () => $bench->forceDelete()); } catch (Throwable $e) { echo $e->getMessage(); }
SQLSTATE[23503]: Foreign key violation: 7 ERROR:  update or delete on table "exercises" violates foreign key c…
> $user->activePlan()->associate($plan)->save();
> $plan->delete();
> echo 'active_plan_id ', var_export($user->fresh()->active_plan_id, true), ', days ', PlanDay::count(), ', items ', PlanItem::count(), ', sets ', PlanSet::count();
active_plan_id NULL, days 0, items 0, sets 0
```

Each line is a rule of [D3.7](../design/D3-data-model.md#d37-what-happens-on-delete): the plan keeps a deleted exercise; deleting it for good is refused while a plan uses it; the plan takes its days, items and sets with it (cascade); the user stays, with no active plan (set to empty).

### H1.13.7 Factories four levels deep, and the tests

`has()` builds the rows of a `hasMany`, with the foreign key filled; the second argument is the relation's name:

```php
Plan::factory()
    ->has(PlanDay::factory()->has(PlanItem::factory()->has(PlanSet::factory()->count(2), 'sets'), 'items'), 'days')
    ->create();
```

This makes a user (from `PlanFactory`), a plan, a day, a public exercise (from `PlanItemFactory`), an item and two sets. Two more tools are used in the tests:

```php
PlanDay::factory()->for($plan)->count(3)
    ->sequence(['position' => 2], ['position' => 0], ['position' => 1])   // each row takes the next values
    ->create();
PlanItem::factory()->for($push, 'day')->for($bench)->create();            // for(): a belongsTo; 'day' names the relation
```

```sh
make test f=PlanTablesTest
```

```
PASS  Tests\Feature\Plans\PlanTablesTest
✓ it makes a UUID for a plan, or keeps the one sent by the device
✓ it reads days, items and sets in the order of their position
✓ it reads the set type as an enum and the weights as exact text
✓ it deletes the days, items and sets with their plan, and empties th…
✓ it deletes a user's plans with the user
✓ it refuses to delete for good an exercise that a plan uses
✓ it keeps showing an exercise deleted after it was put in a plan
✓ it refuses a range of reps upside down, and an RPE outside 1–10 wit… (×3, one per case)
✓ it reaches every item of a plan through its days in one query
✓ it gives each user at most one active plan
Tests:    12 passed (24 assertions)
```

The refusals are tested inside `DB::transaction()`, as in [H1.10.8](#h1108-testing-what-the-database-refuses). The case "reps 10–8", "RPE 11", "RPE 0.5" is one test with a **dataset**: `->with([...])` after the test runs it once per entry, and the entry's name appears in the output.

**Errors met along the way:**

| Message | Cause | Fix |
|---|---|---|
| `PARSE ERROR  PHP Parse error: Syntax error, unexpected '*'` in `tinker --execute` | `use App\Models\*;`: PHP has no wildcard imports | One `use` per class, or `use App\Models\{Plan, PlanDay};` |


## H1.14 The translation of the library, as built

The second part of DATA-1 gave the 876 imported exercises their Italian, Spanish and German names, other names and steps. The rules and the reasons are in [C2.14.4](../concepts/C2-backend.md#c2144-the-translation-of-the-library); this section is the doing, with the real output: how the texts were made and checked, and the command that writes them.

| File | What it is |
|---|---|
| `database/data/exercise-translations/it.json`, `es.json`, `de.json` | The translations, about 730 kB each: 876 entries keyed by `external_id` |
| `app/Console/Commands/TranslateExercises.php` | `exercises:translate` |
| `app/Actions/Exercises/TranslateExercise.php` | One language of one exercise: the rules |
| `tests/Feature/ExerciseLibrary/TranslateExercisesTest.php` | 10 tests, one of them on the three files |
| `Makefile` | `make exercises-import` runs the translation after the import; `make exercises-translate` alone |

**After pulling this branch on another computer:** `make exercises-translate` (or `make exercises-import`, which now does both).

### H1.14.1 Measuring the work

Before choosing how, how much text there is, in tinker:

```php
> $rows = App\Models\Exercise::whereNull('owner_id')->get();
> $rows->sum(fn ($e) => mb_strlen($e->getTranslation('name', 'en')));
18975
> $rows->sum(fn ($e) => mb_strlen(implode(' ', $e->getTranslation('instructions', 'en', false) ?: [])));
574571
```

About 19,000 characters of names and 575,000 of steps, 3,738 steps in all, and no descriptions: free-exercise-db has none. `getTranslation('instructions', 'en', false)`: the third argument, `false`, turns the fallback off, so a missing language gives an empty value instead of another language's.

### H1.14.2 How the texts were made

The translation was done by Claude in the session that built this command, not by a service called from the app. The steps, to repeat them for a future dataset:

1. **The source in parts.** The English of `dist/exercises.json` (id, name, category, equipment, steps) was split into 12 files of 73 exercises.
2. **One guide for every part**, so that parts translated side by side agree. It fixed:
   - the format: one object per language keyed by `id`, with `name`, `aliases` (0 to 3 other names people search for) and `instructions`, **exactly one step for each English step**;
   - the voice: informal imperative, *tu* (Italian), *tú* (Spanish), *du* (German), as the app speaks;
   - a glossary of gym names in the three languages: Panca piana / Press de banca / Bankdrücken, Stacco rumeno / Peso muerto rumano / Rumänisches Kreuzheben, Lat machine / Jalón al pecho / Latziehen, Multipower / Multipower / Multipresse…, with the muscles and the equipment named as in `MuscleSeeder` and `EquipmentSeeder`;
   - stock sentences: "This will be your starting position." → "Questa è la posizione di partenza." / "Esta es la posición inicial." / "Das ist die Ausgangsposition."
3. **Twelve parts at once**, each by a Claude agent with the guide, writing three files.
4. **A check script** on every part, which an agent had to pass before finishing: valid JSON, every id there and no other, the three keys, at most three aliases none equal to the name, the same number of steps as the English, no step left in English. All twelve parts printed `OK`.
5. **Joined** into one file per language, in the source's order.

The guide and the scripts were working files of that session and are not in the repository: the files they produced are.

### H1.14.3 What the checks found, and the fixes

**Steps the import had dropped.** The command compares the number of steps with the English **in the database**, not in the source. Comparing the two for every exercise:

```
876 in db; 2 differ
[('Barbell_Squat_To_A_Bench', 8, 7), ('Clean', 6, 5)]
steps with html or empty: [('Barbell_Squat_To_A_Bench', 1), ('Clean', 1)]
```

Two exercises have an empty step in the source, which the import removes (`ImportFreeExercise::cleanInstructions()`: tags stripped, spaces trimmed, empty steps dropped). The joining script applies the same rule to the translations, dropping the step at the same place. Without it, the command would have refused those two exercises with `8 steps in it, the English has 7`.

**Units.** The source measures in inches, feet and pounds. Most parts gave the metric value, some with the original in brackets ("circa 104 cm (41 pollici)"). A search for a number followed by an imperial unit, in steps with no metric value, found 4 steps in each language, all in one part; they were given metric values by hand. A first replacement of "6 pollici" also changed "4-6 pollici" into "4-15 cm": replacing a text that another contains is a classic trap, and the result was read back and corrected to "10-15 cm".

**The same name for two exercises.** 7 Italian, 7 Spanish and 5 German names were shared by two exercises: "Bench Press with Chains" and "Chain Press" were both "Panca piana con catene", although the second loads the chains on a cable. Reading the two exercises' steps, each pair got names that tell them apart ("Distensioni su panca con catene ai cavi"). Two exercises with one name in a list cannot be told apart.

**Reading samples.** 45 random Italian names next to the English, and whole exercises in each language. The names are those of an Italian gym ("Scrollate con bilanciere", "Tirate al mento con bilanciere", "French press con manubri", "Cyclette"); 50 stay as in English because gyms say them so ("Face pull", "Goblet squat", "Leg press").

**What to review first**, among the names the translators themselves doubted (Italian): Moving_Claw_Series "Corsa ad artiglio", Neck_Press "Panca piana al collo", Lying_Crossover "Allungamento in torsione da sdraiato con partner", Drop_Push "Piegamenti pliometrici con caduta dai rialzi", Dumbbell_Lying_Pronation "Pronazione da sdraiato con manubrio" (the movement is an external rotation), Band_Hip_Adductions "Adduzioni dell'anca con elastico" (the steps describe an abduction, the source's name says adduction), Cable_Incline_Pushdown "Pushdown al cavo su panca inclinata" (really a pullover), Groiners "Groiner", Otis-Up "Otis-up". Where the English is wrong, the translation kept it, as the guide asked; a few translators corrected a detail and said so (the palms' direction in two Smith machine exercises). The review is the admin screen's job ([BE-1](../project/backlog.md#be-1-exercise-library-api-and-admin)); until then every language stays in `machine_translated`.

### H1.14.4 The command

```sh
make artisan c="make:command TranslateExercises"
make artisan c="make:class Actions/Exercises/TranslateExercise"
make artisan c="make:test ExerciseLibrary/TranslateExercisesTest --pest"
```

```
INFO  Console command [app/Console/Commands/TranslateExercises.php] created successfully.
INFO  Class [app/Actions/Exercises/TranslateExercise.php] created successfully.
INFO  Test [tests/Feature/ExerciseLibrary/TranslateExercisesTest.php] created successfully.
```

The command has the shape of `exercises:import` ([H1.12.1](#h1121-the-files)), with one new kind of option:

```php
#[Signature('exercises:translate
    {--locale=* : Only these languages (it, es, de); all three when not given}
    {--force : Overwrite the languages the exercises already have}
    {--path= : The folder of the translation files (default: database/data/exercise-translations)}')]
```

`{--locale=*}`: the `*` makes the option a list, `--locale=it --locale=de` gives `['it', 'de']`. In `make`, `o="--locale=it"`.

The action writes one language with `setTranslation()`, which changes one key of the JSON column and keeps the others, English included:

```php
$exercise->setTranslation('name', $locale, $entry['name']);
$exercise->setTranslation('instructions', $locale, $steps);
$exercise->machine_translated = array_values(array_unique([...$exercise->machine_translated, $locale]));
$exercise->save();
```

Run on the development database, after the import:

```sh
make exercises-translate
```

```
Translating into it: 876 exercises in the file
Written: 876
Kept, already in it: 0
Not in the library: 0
Translating into es: 876 exercises in the file
Written: 876
…
Translating into de: 876 exercises in the file
Written: 876
```

3.3 seconds for the three languages. Again, for one language:

```sh
make exercises-translate o="--locale=it"
```

```
Written: 0
Kept, already in it: 876
Not in the library: 0
```

### H1.14.5 Look at the result

In tinker, the library searched as an Italian reader would:

```php
> app()->setLocale('it');
> Exercise::visibleTo(User::first())->search('lat machine')->count();
8
> Exercise::visibleTo(User::first())->search('stacco rumeno')->orderByName()->get()->pluck('name');
["Stacco rumeno", "Stacco rumeno in deficit"]
> $squat = Exercise::where('external_id', 'Barbell_Squat')->first();
> $squat->name . ' / ' . $squat->getTranslation('name', 'es') . ' / ' . $squat->getTranslation('name', 'de');
"Squat con bilanciere / Sentadilla con barra / Kniebeuge mit Langhantel"
> $squat->machine_translated;
["it", "es", "de"]
```

In the app nothing else is needed: switch the language in Profile, and the library, the exercise pages and the plans show the translated names and steps.

### H1.14.6 The tests, and the errors met

```sh
make test f=TranslateExercises
```

```
PASS  Tests\Feature\ExerciseLibrary\TranslateExercisesTest
✓ it writes one language, keeps English, and marks it machine-translated
✓ it keeps a language the exercise already has, unless forced
✓ it refuses a translation whose steps do not match the English
✓ it lists each language once, and leaves no old aliases on a forced run
✓ it makes the exercise found by its Italian name and aliases
✓ it translates every imported exercise from the files, and sums up
✓ it translates only the languages asked for
✓ it lists the exercises that failed, writes the others, and fails
✓ it refuses a language that is not ours, and says when a file is missing
✓ it ships the three languages for the same exercises, each entry complete
Tests:    10 passed (15804 assertions)
```

The last test reads the real files and checks every one of the 2,628 entries, hence the assertions. The others write small files to the system's temporary folder, as the import's tests do ([H1.12.5](#h1125-the-tests)).

**Errors met along the way:**

| Message or symptom | Cause | Fix |
|---|---|---|
| The command's closure received the progress bar where the external_id was expected | `withProgressBar($items, fn …)` calls the function with **the value, the bar, the key**, in that order (read in `vendor/laravel/framework/src/Illuminate/Console/Concerns/InteractsWithIO.php`) | `function (array $entry, mixed $bar, int|string $externalId)` |
| `Failed asserting that two arrays are identical`: `es` and `de` swapped in the names | Postgres's `jsonb` stores an object's keys in an order of its own (shorter keys first), not in the order they were written | The test compares with `toEqual()`, which ignores the order of keys, instead of `toBe()` |
| `it ships the three languages…` failed with `File does not exist` while the texts were being made | The test reads the real files, which did not exist yet | Expected until the files were joined |


## H1.15 The workout tables, as built

The first part of FEAT-3 created the three tables of a workout, `workout_sessions` → `session_exercises` → `logged_sets` ([D3.6](../design/D3-data-model.md#d36-workouts)). They follow the plan tables of [H1.13](#h113-the-plan-tables-as-built), UUIDs made on the device included; this section shows only what is new. The API on top of them is [H2.14](H2-backend.md#h214-the-workouts-api-as-built).

| File | What it is |
|---|---|
| `database/migrations/2026_11_07_1545*_create_{workout_sessions,session_exercises,logged_sets}_table.php` | The three tables |
| `app/Models/WorkoutSession.php`, `SessionExercise.php`, `LoggedSet.php` | Their models; the scopes `finished()` and `withTotals()` |
| `app/Models/User.php`, `Plan.php` | `workoutSessions()`; on Plan also `suggestedDay()` |
| `database/factories/{WorkoutSession,SessionExercise,LoggedSet}Factory.php` | Fake rows; `open()` and `warmUp()` states |
| `tests/Feature/Workouts/WorkoutTablesTest.php` | 10 tests of the tables |

**After pulling this branch on another computer:** `make migrate`.

### H1.15.1 Generate and run

```sh
make artisan c="make:model WorkoutSession -mf"
make artisan c="make:model SessionExercise -mf"
make artisan c="make:model LoggedSet -mf"
make artisan c="make:test Workouts/WorkoutTablesTest --pest"
make artisan c="migrate --pretend"
make migrate
```

```
2026_11_07_154507_create_workout_sessions_table ............... 46.21ms DONE
2026_11_07_154509_create_session_exercises_table ............... 7.62ms DONE
2026_11_07_154511_create_logged_sets_table ..................... 8.87ms DONE
```

The lines of `migrate --pretend` that the plan tables did not have:

```
⇂ alter table "workout_sessions" add constraint "workout_sessions_plan_id_foreign" foreign key ("plan_id") references "plans" ("id") on delete set null
⇂ alter table "workout_sessions" add constraint "workout_sessions_plan_day_id_foreign" foreign key ("plan_day_id") references "plan_days" ("id") on delete set null
⇂ alter table "session_exercises" add constraint "session_exercises_plan_item_id_foreign" foreign key ("plan_item_id") references "plan_items" ("id") on delete set null
⇂ ALTER TABLE logged_sets ADD CONSTRAINT logged_sets_weight_not_negative CHECK (weight_kg >= 0)
```

- **`on delete set null` three times**: deleting a plan, a day or an item empties the session's link and keeps the session. This is the whole point of keeping the plan and the workouts apart ([D3.1.3](../design/D3-data-model.md#d313-the-main-idea-what-i-mean-to-do-and-what-i-did)).
- **No index of its own on `workout_sessions.user_id`**: the index on `(user_id, started_at)`, history by date, serves it ([D3.2.6](../design/D3-data-model.md#d326-indexes)).
- **`softDeletesTz()`** on the sessions, as on the exercises, but for another reason: a deleted session's row is the marker that stops a late send from bringing it back ([D3.7.3](../design/D3-data-model.md#d373-deleting-a-session-a-soft-delete)).

### H1.15.2 The models

Three things the plan models did not need:

- **A relation named for what it holds.** `WorkoutSession::sessionExercises()`, not `exercises()`: each row is an exercise *as done*, which points to an `Exercise` of the library. The belongsTo back is `SessionExercise::session()`, whose column is given, `workout_session_id`, since Laravel would look for `session_id`.
- **Deleted sessions are hidden by every query on the model**, by `SoftDeletes`. Questions about history start from `WorkoutSession` ([D3.11](../design/D3-data-model.md#d311-traps-to-avoid)); the one query of the API that does not, "last time", leaves deleted sessions out by hand.
- **A scope that adds columns.** `withTotals()` adds `exercises_done`, `sets_done` and `volume_kg` to each row, as subqueries worked out by Postgres ([H2.14.6](H2-backend.md#h2146-totals-and-last-time-in-the-database)). Tried on Ada's Monday of [D3.10](../design/D3-data-model.md#d310-the-full-story-one-week-of-training), a warm-up of 40 × 10 then 80 × 8 and 80 × 7:

```php
> $session = WorkoutSession::query()->withTotals()->first();
> [(float) $session->volume_kg, $session->sets_done, $session->exercises_done];
[1200.0, 2, 1]
```

The 1200 kg of D3.10, the warm-up left out; a second exercise with no sets, skipped, does not count among those done.

**The suggested day** is a method of `Plan`, `suggestedDay()`, the query of [D3.6.4](../design/D3-data-model.md#d364-how-the-screens-use-these-tables) with the day done last read once:

```php
$days = $this->days()->get()->values();
$lastDoneId = $this->lastDoneDayId();
$index = $days->search(fn (PlanDay $day) => $day->id === $lastDoneId);

return $index === false ? $days->first() : ($days[$index + 1] ?? $days->first());
```

A first version called `$this->lastDoneDayId()` inside the function given to `search()`, which runs once per day: one query per day for the same answer. A function passed to a collection's method runs for every item; anything that does not depend on the item goes before it.

### H1.15.3 The tests

```
PASS  Tests\Feature\Workouts\WorkoutTablesTest
✓ it keeps the workout when its plan is deleted, with the names it copied
✓ it hides a deleted workout, and deletes its rows only for good
✓ it refuses to delete for good an exercise that a workout used
✓ it refuses a feeling outside 1–5, and a negative weight or reps (×3)
✓ it works out the totals in the database, warm-ups excluded
✓ it suggests the day after the last one done, back to the first after the last
✓ it suggests the first day when the last one done was deleted
✓ it keeps a workout of an exercise deleted since
Tests:    10 passed (26 assertions)
```

The suggested-day test walks a plan of three days through a week: nothing done (A), A done (B), C done (back to A), then a session left open and one deleted, which do not count.

---

← [C2. Backend](../concepts/C2-backend.md) · [Contents](../README.md) · [H2. Backend: how to](H2-backend.md) →
