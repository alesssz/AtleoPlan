# H1. Database: how to

Recipes for the database layer: a new table, a change to one, models, factories and seeders, looking at the data, tests, and the commands that fill the exercise library. What the tables are is in [D3. Data model](../design/D3-data-model.md); the conventions of the layer in [C2.6](../concepts/C2-backend.md#c26-database-migrations-models-factories-seeders).

## Contents

- [H1.1 Before you start](#h11-before-you-start)
- [H1.2 A new table from start to finish](#h12-a-new-table-from-start-to-finish)
- [H1.3 Migrations](#h13-migrations)
  - [H1.3.1 Columns and keys](#h131-columns-and-keys)
  - [H1.3.2 Check constraints](#h132-check-constraints)
  - [H1.3.3 Changing a table that already exists](#h133-changing-a-table-that-already-exists)
  - [H1.3.4 Filling a new column](#h134-filling-a-new-column)
- [H1.4 Models](#h14-models)
- [H1.5 Factories and seeders](#h15-factories-and-seeders)
- [H1.6 Looking at the data](#h16-looking-at-the-data)
- [H1.7 Testing database code](#h17-testing-database-code)
- [H1.8 The exercise library's data](#h18-the-exercise-librarys-data)
- [H1.9 When something goes wrong](#h19-when-something-goes-wrong)
- [H1.10 Commands at a glance](#h110-commands-at-a-glance)

---

## H1.1 Before you start

- **Every command runs in the container** through `make` ([S1.8](../start/S1-setup.md#s18-everyday-commands)); the stack must be up (`make up`, `make ps`).
- **Two databases:** `atleoplan` for development (the app, `make migrate`, `make tinker`, `make psql`), `atleoplan_test` for the tests, which rebuild it themselves.
- **A new table touches** a migration, a model, a factory, often a seeder, a test, and [D3](../design/D3-data-model.md), which must say the same as the code in the same commit ([P1.3](../project/P1-conventions.md#p13-documentation)).

---

## H1.2 A new table from start to finish

1. **D3 first:** the table's columns, ids, relations and what happens on delete.
2. **Generate** the model with its migration, factory and seeder:
   ```sh
   make artisan c="make:model Muscle -mfs"
   ```
   The migration's timestamp decides the order: a table must be created after the tables it points to.
3. **Write the migration**, with a comment on every column whose meaning or constraint is not obvious ([P1.2](../project/P1-conventions.md#p12-code)).
4. **Read the SQL, then run it:**
   ```sh
   make artisan c="migrate --pretend"
   make migrate
   ```
   Check the types, the `on delete` of every foreign key, the indexes and the check constraints. A mistake on a migration that has not left your branch: `make artisan c="migrate:rollback"`, fix, migrate again.
5. **The model:** `#[Fillable]` (only what a request may set), `casts()` (enums, booleans, dates, decimals), `$attributes` for the defaults, the relations ([H1.4](#h14-models)).
6. **The factory:** a realistic `definition()`, states for the variants a test needs.
7. **The seeder**, only for reference data the app needs to run; idempotent, and added to `DatabaseSeeder` ([H1.5](#h15-factories-and-seeders)).
8. **Look at the result:** `make artisan c="db:table muscles"`, `make artisan c="model:show Muscle"`, a few queries in tinker ([H1.6](#h16-looking-at-the-data)).
9. **A test** in `tests/Feature/`, including what the database must refuse ([H1.7](#h17-testing-database-code)).
10. **The frontend's type** in `frontend/src/api/`, when the table reaches the API.
11. `make fix`, then `make check`.

---

## H1.3 Migrations

**A migration that has left your branch is never edited:** a change is a new migration. After a `git pull` that brings migrations, `make migrate` (`migrate:status` shows the pending ones).

### H1.3.1 Columns and keys

| Need | Write |
|---|---|
| Numeric id | `$table->id()` |
| UUID id made on the device | `$table->uuid('id')->primary()`; the model uses `HasUuids` and has `id` fillable |
| Foreign key to a numeric id | `$table->foreignId('user_id')->constrained()->cascadeOnDelete()` |
| Foreign key to a UUID | `$table->foreignUuid('plan_id')->constrained()->cascadeOnDelete()` |
| Foreign key named differently | `$table->foreignId('owner_id')->nullable()->constrained('users')` |
| On delete | `cascadeOnDelete()`, `nullOnDelete()` or `restrictOnDelete()`, always explicit ([D3.7](../design/D3-data-model.md#d37-what-happens-on-delete)) |
| Weight in kilograms | `$table->decimal('weight_kg', 7, 3)` ([D3.2.3](../design/D3-data-model.md#d323-weights-are-always-in-kilograms)) |
| A moment | `$table->timestampTz('started_at')` |
| Translated text | `$table->jsonb('name')` |
| Unique pair | `$table->unique(['provider', 'provider_user_id'])` |
| No timestamps | leave out `timestamps()`, and set `public $timestamps = false` on the model |

Index the foreign keys that queries filter on, unless a composite index already starts with them ([D3.2.6](../design/D3-data-model.md#d326-indexes)).

### H1.3.2 Check constraints

Blueprint has no method for them: write SQL after `Schema::create()`, and name each one, since the name is what the error message shows ([D3.2.8](../design/D3-data-model.md#d328-check-constraints)):

```php
DB::statement('ALTER TABLE plan_sets ADD CONSTRAINT plan_sets_reps_range
    CHECK (target_reps_min <= target_reps_max)');
```

`dropIfExists()` in `down()` takes them with the table.

### H1.3.3 Changing a table that already exists

```sh
make artisan c="make:migration add_position_to_muscles_table"
```

- **A required column on a table with rows** needs `->default(…)` or must start `->nullable()`: Postgres has no value for the existing rows.
- **A column pointing to a later table** (`users.active_plan_id` → `plans`) is a migration of its own, after that table's.
- **`->change()` rewrites the whole column:** write the full definition, not the difference (`$table->string('password')->nullable()->change()`), and read it with `--pretend`.
- **`down()`** undoes exactly what `up()` did; when undoing is impossible without inventing data (a column made nullable that now holds nulls), let it fail.

### H1.3.4 Filling a new column

When a new column must be filled for the rows already there, the same migration does it after `Schema::table()`, **with the `DB` facade, not the model**: the model will change over the years, and an old migration that uses it could behave differently on a fresh database (`2026_11_10_093058_add_search_text_to_exercises_table`).

---

## H1.4 Models

- **`#[Fillable]`** lists what `create()` and `update()` may set; anything else is silently dropped, with no error. Columns no request may set (`is_admin`, `owner_id`) stay out and are set by the code (`$user->exercises()->create(…)` fills `owner_id`).
- **Enums** (`make artisan c="make:enum SetType --string"`) in `app/Enums/`, cast in `casts()`, validated with `Rule::enum()`.
- **Defaults in `$attributes`:** a model just created does not read the table's defaults back, so `$exercise->logging_type` would be `null` until reloaded.
- **A pivot with a column of its own** (`exercise_muscle.role`): `withPivot('role')` on the relation, and a pivot class (`make:model ExerciseMuscle --pivot`, with `$table`, `$timestamps = false` and the cast) named with `using()`.
- **Ordered relations** (`hasMany(PlanDay::class)->orderBy('position')`) keep the order in eager loading too.
- **A relation to a soft-deleted model** that must still resolve (an exercise in an old plan) uses `withTrashed()` on the relation.
- **Translated columns:** `HasTranslations` with `$translatable`; the fallback to English, then any language, is set once in `AppServiceProvider`.
- **Avoid N+1:** `with()` in lists, `load()` for a whole tree (`$plan->load(['days.items.sets'])`), and assert the query count in a test where it matters.

---

## H1.5 Factories and seeders

**Factories:**

```php
Exercise::factory()->personal()->create();                // a state
Exercise::factory()->for($barbell)->create();             // belongsTo
Exercise::factory()->for($user, 'owner')->create();       // belongsTo with a relation name of its own
Exercise::factory()->hasAttached($chest, ['role' => MuscleRole::Primary], 'muscles')->create();
```

A factory used as a column's value creates the linked row only when the test gives none.

**Seeders** hold reference data only (muscles, equipment) and the development account:

- **Idempotent:** `updateOrCreate()` on a stable key (`slug`), so running again changes nothing.
- **Ordered in `DatabaseSeeder`:** a table before the ones pointing to it.
- **On a database that already holds data,** never `make fresh` (it deletes everything): `make reference-data`, or one seeder with `make artisan c="db:seed --class=MuscleSeeder"`.
- **Large imports are commands, not seeders** ([H1.8](#h18-the-exercise-librarys-data)): one transaction per row, so a failure is rolled back alone; files copied outside the transaction; a stable key (`external_id`) so a second run updates or skips; a row deleted by an admin left deleted.

---

## H1.6 Looking at the data

| Tool | For | How |
|---|---|---|
| Tinker | Queries through the models | `make tinker` |
| psql | Plain SQL | `make psql`; `\dt`, `\d muscles`, `SELECT name->>'it' FROM muscles;` |
| Artisan | A table's or a model's structure | `make artisan c="db:table muscles"`, `c="model:show Muscle"`, `c="db:show"` |
| A database client | Browsing and careful edits | [H4](H4-database-tools.md): `localhost:5932`, database, user and password `atleoplan` |

- **Tinker writes to the development database.** To try writes without leaving traces: `DB::beginTransaction();` … `DB::rollBack();`.
- **Tinker keeps the code it loaded:** after changing a model, `exit` and `make tinker` again.
- **The SQL a query sends:** `->toRawSql()`.

---

## H1.7 Testing database code

- **`uses(RefreshDatabase::class)`** at the top of a file that touches the database; tests run on `atleoplan_test`, forced in `phpunit.xml`.
- **Each test builds what it needs** with factories, or `$this->seed(MuscleSeeder::class)` for a fixed list.
- **Assertions:** `assertDatabaseHas`, `assertDatabaseMissing`, `assertDatabaseCount`, `assertSoftDeleted`, and `expect(…)`.
- **Test what the database refuses** (foreign keys, check constraints) inside `DB::transaction()`: otherwise the failed statement aborts the test's own transaction and every later query fails with `25P02`.
  ```php
  expect(fn () => DB::transaction(fn () => $exercise->owner->delete()))
      ->toThrow(QueryException::class, 'Foreign key violation');
  ```
- **A key checked at commit** (`DEFERRABLE INITIALLY DEFERRED`, [D3.7.1](../design/D3-data-model.md#d371-deleting-a-plan)) is never checked in a test, whose transaction is rolled back: `DB::statement('SET CONSTRAINTS ALL IMMEDIATE')` runs the check where the test needs it.
- **`jsonb` reorders an object's keys** (shorter keys first): compare translated columns with `toEqual()`, which ignores the order of keys, not `toBe()`.
- **Prove a new test can fail:** break the line it guards, see it fail, put the line back.

---

## H1.8 The exercise library's data

The public library is built by four commands ([C2.14](../concepts/C2-backend.md#c214-artisan-commands-of-our-own)); `make exercises-import` runs them in order, after downloading free-exercise-db into `backend/storage/app/free-exercise-db` the first time.

| Task | Command |
|---|---|
| Fill the library (dataset, extras, corrections, translations) | `make exercises-import`; try with `o="--limit=5"`; refresh the English texts with `o="--update"` |
| Translate again, or one language | `make exercises-translate`, `o="--locale=it --force"` (`--force` undoes corrections made in the admin panel) |
| Add the extra exercises to a library imported before them | `make exercises-extra` |
| Correct the logging types the import guessed wrong | `make exercises-correct` |
| The photos' small and large copies that are missing | `make exercises-thumbnails` |
| Two example plans for every user without one | `make plans-demo` |

**Add an extra exercise:** an entry in `backend/database/data/extra-exercises.json` (id starting with `AtleoPlan_`, the dataset's shape, `loggingType` stated), its translation in `exercise-translations/{it,es,de}.json`, then `make exercises-extra`. `ImportExtraExercisesTest` reads the real files, so an unknown muscle, a misspelt logging type or a missing translation fails `make test`.

**Correct a logging type:** an entry in `backend/database/data/logging-type-corrections.json` with `id`, `from`, `to` and `why`, then `make exercises-correct`. An exercise already used in a plan or a workout gets its sets converted too, from reps to seconds; one whose sets have a weight, or a correction other than to `time`, is left alone and named in the summary ([C2.14.6](../concepts/C2-backend.md#c2146-the-logging-types-corrected-after-the-import)).

**Fix a translation:** edit the entry in `exercise-translations/<lang>.json` (one step for each English step), then `make exercises-translate o="--locale=it --force"`.

---

## H1.9 When something goes wrong

| Message or symptom | Cause | Fix |
|---|---|---|
| `Class "Laravel\…" not found`, after a `git pull` | A package added on another branch is not installed | `make composer c=install` |
| `Class "App\…" not found` for your own class, or in tinker by its short name | Namespace and folder do not match, or Composer's class map predates the class | Fix the namespace; `make composer c=dump-autoload` |
| `relation "…" does not exist` (`42P01`) | The migration has not run; in a test, `RefreshDatabase` is missing | `make migrate` / `uses(RefreshDatabase::class)` |
| `relation "equipment" does not exist` while migrating | A table created before the one it points to | Give the migration a later timestamp |
| `Nothing to migrate`, but the change is not there | A migration that had already run was edited | On your branch: `migrate:rollback`, then `migrate`; pushed: a new migration |
| A value is not saved, with no error | The column is not in `#[Fillable]` | Add it, if a request may set it |
| `column "updated_at" … does not exist` | A table without timestamps, a model without `$timestamps = false` | Add it to the model |
| `23505` unique violation | A second row with the same unique value; often a seeder run twice | `updateOrCreate()` on the stable key |
| `23503` foreign key violation | A row pointing to nothing, or deleting a row still pointed to | Seeder order; [D3.7](../design/D3-data-model.md#d37-what-happens-on-delete) |
| `23503` on `workout_sessions_plan_day_id_foreign` when deleting a plan, in a test only, now and then | The two foreign-key actions ran in the other order ([D3.7.1](../design/D3-data-model.md#d371-deleting-a-plan)) | The key must be checked at commit: `make migrate` |
| `23502` not null, while migrating | A required column added to a table with rows | `->default(…)` or `->nullable()` |
| `25P02` current transaction is aborted, in a test | A query after a database error in the same transaction | Wrap the failing statement in `DB::transaction()` |
| `08006`, connection refused, host "postgres" unknown | Postgres is not running | `make up`, `make ps` |
| Tinker does not see a change | It keeps the code it loaded | `exit`, `make tinker` |
| `Unknown equipment "body only"` for every exercise | The import ran on a database without the reference data | `make reference-data` (`make exercises-import` runs it) |
| `free-exercise-db not found` | The dataset is not downloaded, or `--path` is wrong | `make exercises-import` clones it |

---

## H1.10 Commands at a glance

| What | Command |
|---|---|
| Model with migration, factory, seeder | `make artisan c="make:model Muscle -mfs"` |
| Migration, seeder, factory, enum, test | `make artisan c="make:migration add_x_to_y_table"`, `make:seeder`, `make:factory`, `make:enum X --string`, `make:test X --pest` |
| SQL of the pending migrations | `make artisan c="migrate --pretend"` |
| Run, status, undo the last batch | `make migrate`, `make artisan c="migrate:status"`, `make artisan c="migrate:rollback"` |
| Rebuild with the seeders (**deletes all data and photos**, asks first) / then the library again | `make fresh` / `make reset` (`make db-dump` first) |
| Reference data only, harmless to repeat | `make reference-data` |
| Consoles | `make tinker`, `make psql` |
| Structure | `make artisan c="db:table muscles"`, `c="model:show Muscle"`, `c="db:show"` |
| Tests | `make test`, `make test f=Muscle` |
| The exercise library | [H1.8](#h18-the-exercise-librarys-data) |

---

← [C2. Backend](../concepts/C2-backend.md) · [Contents](../README.md) · [H2. Backend: how to](H2-backend.md) →
