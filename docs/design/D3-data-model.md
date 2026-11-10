# D3. Data model

Every table of the MVP ([D1.8](D1-ui.md#d18-release-phases-and-open-questions)): what it stands for, its columns, how it connects to the others, why it is built that way, and the Laravel code that creates it. The migrations are written from this page, so a change to the design updates it in the same commit ([P1.3](../project/P1-conventions.md#p13-documentation)).

**What exists so far:** `users`, with the columns of [D3.3](#d33-users-and-preferences), and the four tables of the exercise library ([D3.4](#d34-exercise-library)), with the muscles and the equipment already filled in. Each feature creates its own part when it is built ([D3.1.4](#d314-which-task-creates-what)).

**The code here has been run.** The migrations, relations and queries on this page ran on Postgres 18 and Laravel 13, inside a transaction that was then undone. Results shown next to the code are that run's real output. The real files will add the full comments of [P1.2](../project/P1-conventions.md#p12-code); here the comments explain what is new.

**How to read this page:**

- New to databases: read [D3.1.1](#d311-a-database-in-ten-ideas), then the story of one week of training in [D3.10](#d310-the-full-story-one-week-of-training), and come back to the tables after.
- Writing a migration: go to the table's section, then read [D3.11](#d311-traps-to-avoid) before finishing.
- How migrations and models work in Laravel in general: [C2.6](../concepts/C2-backend.md#c26-database-migrations-models-factories-seeders).
- How to build a table in practice, step by step: the commands, the files to write, seeders, tinker, tests: [H1. Database: how to](../how-to/H1-database.md).

## Contents

- [D3.1 Overview](#d31-overview)
  - [D3.1.1 A database in ten ideas](#d311-a-database-in-ten-ideas)
  - [D3.1.2 The map](#d312-the-map)
  - [D3.1.3 The main idea: what I mean to do, and what I did](#d313-the-main-idea-what-i-mean-to-do-and-what-i-did)
  - [D3.1.4 Which task creates what](#d314-which-task-creates-what)
  - [D3.1.5 How to read the column tables](#d315-how-to-read-the-column-tables)
- [D3.2 Rules for every table](#d32-rules-for-every-table)
  - [D3.2.1 Which kind of id](#d321-which-kind-of-id)
  - [D3.2.2 Table names](#d322-table-names)
  - [D3.2.3 Weights are always in kilograms](#d323-weights-are-always-in-kilograms)
  - [D3.2.4 Fixed lists of values](#d324-fixed-lists-of-values)
  - [D3.2.5 Times](#d325-times)
  - [D3.2.6 Indexes](#d326-indexes)
  - [D3.2.7 Order is a `position` column](#d327-order-is-a-position-column)
  - [D3.2.8 Check constraints](#d328-check-constraints)
- [D3.3 Users and preferences](#d33-users-and-preferences)
- [D3.4 Exercise library](#d34-exercise-library)
  - [D3.4.1 `muscles` and `equipment`](#d341-muscles-and-equipment)
  - [D3.4.2 `exercises`](#d342-exercises)
  - [D3.4.3 `exercise_muscle`](#d343-exercise_muscle)
  - [D3.4.4 Photos and videos](#d344-photos-and-videos)
  - [D3.4.5 Translations](#d345-translations)
  - [D3.4.6 Searching](#d346-searching)
  - [D3.4.7 What is not in the table](#d347-what-is-not-in-the-table)
- [D3.5 Plans](#d35-plans)
  - [D3.5.1 `plans`](#d351-plans)
  - [D3.5.2 `plan_days`](#d352-plan_days)
  - [D3.5.3 `plan_items`](#d353-plan_items)
  - [D3.5.4 `plan_sets`](#d354-plan_sets)
  - [D3.5.5 The relations in code](#d355-the-relations-in-code)
  - [D3.5.6 Saving a plan](#d356-saving-a-plan)
  - [D3.5.7 When a plan is changed in two places](#d357-when-a-plan-is-changed-in-two-places)
  - [D3.5.8 The plan file](#d358-the-plan-file)
- [D3.6 Workouts](#d36-workouts)
  - [D3.6.1 `workout_sessions`](#d361-workout_sessions)
  - [D3.6.2 `session_exercises`](#d362-session_exercises)
  - [D3.6.3 `logged_sets`](#d363-logged_sets)
  - [D3.6.4 How the screens use these tables](#d364-how-the-screens-use-these-tables)
  - [D3.6.5 Sending a session to the server](#d365-sending-a-session-to-the-server)
- [D3.7 What happens on delete](#d37-what-happens-on-delete)
  - [D3.7.1 Deleting a plan](#d371-deleting-a-plan)
  - [D3.7.2 Deleting an exercise: a soft delete](#d372-deleting-an-exercise-a-soft-delete)
  - [D3.7.3 Deleting a session: a soft delete](#d373-deleting-a-session-a-soft-delete)
  - [D3.7.4 Deleting an account: an action in the code](#d374-deleting-an-account-an-action-in-the-code)
- [D3.8 Computed, never stored](#d38-computed-never-stored)
- [D3.9 Left for later](#d39-left-for-later)
- [D3.10 The full story: one week of training](#d310-the-full-story-one-week-of-training)
- [D3.11 Traps to avoid](#d311-traps-to-avoid)

---

## D3.1 Overview

### D3.1.1 A database in ten ideas

**1. Tables, rows and columns.** A table is like a spreadsheet with strict rules. Each **row** is one thing and each **column** is one fact about it, with a fixed type: a text column refuses a list, a number column refuses a word.

`plans`:

| id | user_id | name | goal |
|---|---|---|---|
| `…a1` | 1 | Push Pull Legs | Hypertrophy |
| `…a2` | 1 | Summer strength | *(empty)* |

In Laravel, a **model** is a PHP class standing for a table, and an object of that class stands for one row: `$plan->name` is the "name" cell of that row.

**2. Primary key: how to tell rows apart.** Two plans could have the same name, so every table has a column whose value is never repeated, usually `id`. It is how anything else refers to that row.

**3. Foreign key: how rows point to each other.** A plan belongs to a user. Rather than copying the user's name and email into every plan, the plan stores only the user's id, in `user_id`. If the user changes their name, nothing else has to change.

A **foreign key** is a rule on that column: "this value must exist as an id in `users`". Postgres refuses anything else, even if the application has a bug.

**4. One-to-many.** One user has many plans; each plan has one user. The id goes on the "many" side, so `plans.user_id`, because one cell can hold one value. Laravel calls the two directions `hasMany` (`$user->plans`) and `belongsTo` (`$plan->user`).

**5. Many-to-many and pivot tables.** An exercise works many muscles, and a muscle is worked by many exercises. No single cell can hold that, so a third table holds one row per connection. This is a **pivot table**:

`exercise_muscle`:

| exercise_id | muscle_id | role |
|---|---|---|
| 10 (Bench press) | 1 (Chest) | primary |
| 10 (Bench press) | 2 (Triceps) | secondary |
| 11 (Push-up) | 1 (Chest) | primary |

**6. Empty cells (`NULL`).** A cell can hold no value at all, which is different from 0 or from an empty text. A column allows it only if declared `nullable`. Here it often carries meaning: an empty `exercises.owner_id` means "public", an empty `finished_at` means "still in progress".

**7. Constraints: rules the database enforces.** Besides foreign keys, a **unique** constraint forbids repeated values, and a **check** constraint enforces a condition, such as "feeling is between 1 and 5". The application validates its input too, but these rules hold even when the application is wrong, and bad data is far harder to fix later than a bug.

**8. Indexes: finding rows fast.** Without an index, finding a user's plans means reading the whole table. An index works like the one at the back of a book. It costs a little space and a little time on every write, so it goes on the columns that queries search by.

**9. Transactions: all or nothing.** Saving a plan touches many rows. A **transaction** groups them so that either all the changes happen or none do; a crash halfway cannot leave half a plan. In Laravel: `DB::transaction(function () { … })`.

**10. Soft delete: hiding instead of erasing.** A normal delete erases the row. A **soft delete** only writes the time into a `deleted_at` column; the row stays, and Laravel's `SoftDeletes` trait hides it from normal queries. It is used where the row must keep existing behind the scenes ([D3.7](#d37-what-happens-on-delete)).

### D3.1.2 The map

An arrow means "points to": the table on the left holds the id of a row in the table on the right.

```
users
├── exercises                 personal ones; public ones have no owner
│   ├── exercise_muscle ───→ muscles
│   ├── ───────────────────→ equipment
│   └── media                photos and videos (spatie/laravel-medialibrary)
├── plans
│   └── plan_days
│       └── plan_items ────→ exercises
│           └── plan_sets
└── workout_sessions ──────→ plans, plan_days (may be empty)
    └── session_exercises ─→ exercises, plan_items (may be empty)
        └── logged_sets
```

Each level is a one-to-many: a plan has many days, a day has many items, an item has many sets.

### D3.1.3 The main idea: what I mean to do, and what I did

Two families of tables mirror each other:

| | The plan: what I mean to do | The session: what I did |
|---|---|---|
| The whole | `plans` | `workout_sessions` |
| The middle | `plan_days` | *(a session is one day)* |
| One exercise | `plan_items` | `session_exercises` |
| One set | `plan_sets`, with targets | `logged_sets`, with real values |

It would seem simpler to tick off the plan's own rows. They are kept apart because **changing a plan must never change the past**. Suppose a plan says 4 sets at 80 kg, and next month the user changes it to 5 sets at 85 kg. If history were read from the plan, last month's workouts would suddenly show 85 kg, and the progress charts would be false.

So a session copies nothing from the future: it records what happened, and it survives even when the plan is deleted ([D3.7](#d37-what-happens-on-delete)).

### D3.1.4 Which task creates what

| Tables | Created by |
|---|---|
| New columns on `users` | Done; `active_plan_id` in its own migration after `plans`, with FEAT-2 |
| `muscles`, `equipment`, `exercises`, `exercise_muscle` | Done, in the first part of [BE-1](../project/backlog.md#be-1-exercise-library-api-and-admin); muscles and equipment are filled by their seeders, the public exercises by the import of DATA-1, `make exercises-import` ([H1.12](../how-to/H1-database.md#h112-the-free-exercise-db-import-as-built)) |
| `plans`, `plan_days`, `plan_items`, `plan_sets` | Done, in the first part of FEAT-2, with their API ([H1.13](../how-to/H1-database.md#h113-the-plan-tables-as-built), [H2.13](../how-to/H2-backend.md#h213-the-plans-api-as-built)) |
| `workout_sessions`, `session_exercises`, `logged_sets` | Done, in the first part of [FEAT-3](../project/backlog.md#feat-3-workout-mode-and-home), with their API ([H1.15](../how-to/H1-database.md#h115-the-workout-tables-as-built), [H2.14](../how-to/H2-backend.md#h214-the-workouts-api-as-built)) |

### D3.1.5 How to read the column tables

- **`bigint`** is a whole number, for ids; **`integer`** and **`smallint`** are smaller whole numbers.
- **`uuid`** is a long random identifier, explained in [D3.2.1](#d321-which-kind-of-id).
- **`string`** is a short text, up to 255 characters; **`text`** has no practical limit.
- **`numeric(7,3)`** is an exact number with 7 digits, 3 of them decimals.
- **`jsonb`** is structured data in one column: lists, or one value per language.
- **`enum`** allows only the values listed.
- **`timestampTz`** is an exact moment in time.
- **`→ users`** means a foreign key to that table.
- **nullable** means the cell may be empty.

---

## D3.2 Rules for every table

### D3.2.1 Which kind of id

There are two kinds, and the choice depends on **who creates the row**.

| Id | Looks like | Tables | Why |
|---|---|---|---|
| **UUID**, created on the device | `0192f4a7-3c1e-7d2a-9b4f-8e6a1c5d3f20` | `plans`, `plan_days`, `plan_items`, `workout_sessions`, `session_exercises`, `logged_sets` | They can be created with no network |
| **Number** (`bigint`), created by Postgres | `10` | `users`, `exercises`, `muscles`, `equipment`, `plan_sets` | Created only with a network, or, for `plan_sets`, never pointed to by anything |

**The problem UUIDs solve.** A number comes from the database: the next free one. In a gym with no signal, the phone cannot ask what the next number is, and two phones offline would pick the same one. A UUID is random enough that any device can create one on its own, without two ever matching.

This also makes retries safe, which is the base of offline working ([D2.7](D2-decisions.md#d27-offline-and-sync)). The phone creates a set with id `…f20` and sends it; the signal drops before the answer comes back; the phone sends it again. The server sees that `…f20` already exists and does not create a second one.

**Why exercises have a number instead.** The `media` table links a photo to its owner through `model_id`, which is a number (`morphs('model')` in its migration). Exercises can therefore be created and edited only online, which fits: their photos can only be uploaded online ([D1.6](D1-ui.md#d16-states-and-edge-cases)).

**In Laravel:**

```php
// In the migration: a UUID primary key instead of $table->id()
$table->uuid('id')->primary();

// On the model: this trait makes Eloquent treat the id as a UUID
class Plan extends Model
{
    use HasUuids;
}
```

- `HasUuids` fills the id only when it is empty. An id sent by the device is kept; a row created on the server, such as by a seeder, gets a UUIDv7, a kind of UUID that sorts by creation time.
- For the device's id to be accepted, `id` has to be listed in the model's `#[Fillable]` ([C2.6](../concepts/C2-backend.md#c26-database-migrations-models-factories-seeders)).

**A UUID sent by a device is not to be trusted.** Before updating a row, an endpoint checks that it belongs to the user asking. Otherwise anyone who learned a UUID could overwrite someone else's row. [D3.6.5](#d365-sending-a-session-to-the-server) shows the check.

### D3.2.2 Table names

- **Laravel's rule:** the model `PlanDay` reads the table `plan_days`, plural and in lowercase with underscores. A pivot table joins two singular names in alphabetical order: `exercise_muscle`.
- **`workout_sessions`, not `sessions`.** Laravel's own `sessions` table already exists: it holds the sign-in sessions behind Sanctum's cookies ([C2.7](../concepts/C2-backend.md#c27-signing-in-sanctum)). The model is `WorkoutSession`. The interface and these docs still say "session".
- **`equipment`, not `equipments`.** Laravel treats the word as uncountable, as English does.

### D3.2.3 Weights are always in kilograms

Every weight is stored in kilograms, as `numeric(7,3)`: up to 9999.999 kg. The unit is a preference of the user ([D3.3](#d33-users-and-preferences)), applied only when showing and reading values.

**Why one unit.** If each set stored its own unit, every sum, chart and record would have to convert first, and one forgotten conversion would mix pounds and kilos silently. A user who switches unit also keeps their whole history.

**Why three decimals.** Pounds do not convert to round kilos, and the decimals are what bring the original number back:

```
135 lb × 0.45359237 = 61.235 kg     stored
61.235 kg ÷ 0.45359237 = 135.00 lb  shown
```

**Why `numeric` and not `float`.** A `float` is an approximation: 0.1 + 0.2 gives 0.30000000000000004. `numeric` is exact, which matters for numbers added up and compared to find a record.

In a migration, `numeric` is `$table->decimal('weight_kg', 7, 3)`. See the [trap about strings](#d311-traps-to-avoid) when reading these values in PHP.

### D3.2.4 Fixed lists of values

A set's type can only be normal, warm-up, drop or to failure. Two things enforce this:

```php
// In the migration: on Postgres this makes a text column with a check constraint
$table->enum('set_type', ['normal', 'warm_up', 'drop', 'failure'])->default('normal');

// In app/Enums/SetType.php: a PHP enum, a type with a fixed set of values
enum SetType: string
{
    case Normal = 'normal';
    case WarmUp = 'warm_up';
    case Drop = 'drop';
    case Failure = 'failure';
}

// On the model: reading the column gives a SetType, not a bare string
protected function casts(): array
{
    return ['set_type' => SetType::class];
}
```

The database refuses a value outside the list. In PHP, `SetType::WarmUp` cannot be mistyped the way the string `'warmup'` can: a typo is an error at once rather than a comparison that is silently always false.

### D3.2.5 Times

Times written by the device (`started_at`, `completed_at`…) are `timestampTz`, which keeps the exact moment whatever the device's time zone. A workout at 18:00 in Rome and one at 18:00 in London are one hour apart, and the database knows it.

What counts as "Monday" depends on where the user is, so the days of a week are worked out on the device, in the user's own zone.

### D3.2.6 Indexes

Postgres indexes primary keys and unique columns by itself, but **not foreign keys**. Each foreign key therefore gets an index, written in the migration:

```php
// ->index() goes BEFORE ->constrained(): constrained() returns a different object
$table->foreignId('owner_id')->nullable()->index()->constrained('users');
```

Where rows are read in order within a parent, one index covers both columns, and it also serves searches on the parent alone:

```php
$table->foreignUuid('plan_id')->constrained()->cascadeOnDelete();
$table->index(['plan_id', 'position']);     // the days of a plan, in order
```

### D3.2.7 Order is a `position` column

Rows in a table have no order of their own: without `ORDER BY`, Postgres may return them in any order. Whatever the user can reorder has an integer `position`, starting at 0, and relations always sort by it:

```php
public function days(): HasMany
{
    return $this->hasMany(PlanDay::class)->orderBy('position');
}
```

**It is not unique, on purpose.** While a reorder is being saved, two rows briefly share a position, and a unique rule would refuse the save.

### D3.2.8 Check constraints

Laravel's migration language has no method for check constraints, so they are written in SQL, right after the table is created:

```php
DB::statement('ALTER TABLE plan_sets ADD CONSTRAINT plan_sets_reps_range
    CHECK (target_reps_min <= target_reps_max)');
```

Giving the constraint a name makes the error readable when it fires. A check passes when a value is empty, so these rules do not make a column required.

---

## D3.3 Users and preferences

**What it stands for.** One row per account. `users` already has `id`, `name`, `email`, `email_verified_at`, `password`, `remember_token` and the timestamps ([C2.7](../concepts/C2-backend.md#c27-signing-in-sanctum)). The new columns are:

| Column | Type | Default | What it is for |
|---|---|---|---|
| `is_admin` | boolean | false | Opens Filament ([D1.4.15](D1-ui.md#d1415-admin-panel-filament)), where it shows as the role "user / admin". Never fillable from a request, or anyone could make themselves an admin |
| `disabled_at` | timestampTz, nullable | | Set by an admin to disable an account |
| `locale` | enum `it`, `en`, `es`, `de` | `en` | The interface's language. Preset from the browser when signing up ([D2.4](D2-decisions.md#d24-languages)) |
| `theme` | enum `dark`, `light`, `system` | `dark` | Saved on the account, so it follows the user to another device |
| `weight_unit` | enum `kg`, `lb` | `kg` | Which unit to show and read ([D3.2.3](#d323-weights-are-always-in-kilograms)) |
| `default_rest_seconds` | integer | 90 | Used when a plan item sets no rest |
| `weight_step` | numeric(5,2) | 2.5 | The stepper's step in workout mode, in the user's unit |
| `timer_sound` | boolean | true | Sound when the rest ends, and when a timed set's stopwatch reaches its target |
| `timer_vibration` | boolean | true | Vibration at the same moments |
| `show_rpe` | boolean | false | Whether the plan editor shows the RPE field beside each set's reps ([D1.4.8](D1-ui.md#d148-plan-editor)); most people never set one |
| `active_plan_id` | uuid, nullable → `plans` | | The one active plan ([D2.8](D2-decisions.md#d28-workout-rules)) |

```php
Schema::table('users', function (Blueprint $table) {    // table(), not create(): the table exists
    $table->boolean('is_admin')->default(false);
    $table->timestampTz('disabled_at')->nullable();
    $table->enum('locale', ['it', 'en', 'es', 'de'])->default('en');
    $table->enum('theme', ['dark', 'light', 'system'])->default('dark');
    $table->enum('weight_unit', ['kg', 'lb'])->default('kg');
    $table->integer('default_rest_seconds')->default(90);
    $table->decimal('weight_step', 5, 2)->default(2.5);
    $table->boolean('timer_sound')->default(true);
    $table->boolean('timer_vibration')->default(true);
});

// In a later migration, once `plans` exists: …_add_active_plan_id_to_users_table.php (H1.13.4)
Schema::table('users', function (Blueprint $table) {
    $table->foreignUuid('active_plan_id')->nullable()->index()->constrained('plans')->nullOnDelete();
});

// With feat/set-types-rpe: …_add_show_rpe_to_users_table.php (H3.24.2)
Schema::table('users', function (Blueprint $table) {
    $table->boolean('show_rpe')->default(false);
});
```

**Why plain columns, not one JSON column for the preferences.** Each column has a type and a default enforced by Postgres, and the list is short. A JSON column would accept anything, including a typo in a key.

**Why `users.active_plan_id` rather than `plans.is_active`.** The rule is "one active plan at a time" ([D2.8](D2-decisions.md#d28-workout-rules)).

- With `is_active` on each plan, nothing stops two plans from being active at once, and changing plan takes two updates that must both succeed.
- With one column on the user, a cell cannot hold two plans, so the rule holds by construction, and changing plan is one update.

What the column cannot check by itself is that the plan belongs to this user and is not archived, so a policy checks that.

---

## D3.4 Exercise library

**In the code:** the migrations `…_create_{muscles,equipment,exercises,exercise_muscle}_table.php`, the models `Muscle`, `Equipment`, `Exercise` and `ExerciseMuscle`, the seeders `MuscleSeeder` and `EquipmentSeeder`. How they were built: [H1.10](../how-to/H1-database.md#h110-the-exercise-library-as-built). The public rows come from free-exercise-db, through the command `exercises:import` and the action `ImportFreeExercise` ([C2.14.3](../concepts/C2-backend.md#c2143-the-free-exercise-db-import), [H1.12](../how-to/H1-database.md#h112-the-free-exercise-db-import-as-built)).

### D3.4.1 `muscles` and `equipment`

**What they stand for.** Two short lists, one row per value, used by the library's filters ([D1.4.3](D1-ui.md#d143-exercise-library)) and by volume per muscle group ([D2.8](D2-decisions.md#d28-workout-rules)). They have the same columns:

| Column | Type | What it is for |
|---|---|---|
| `id` | bigint | |
| `slug` | string, unique | A stable English key: `lower-back`, `e-z-curl-bar`. The import finds rows by it |
| `name` | jsonb, translatable | What the user reads: `{"en": "Chest", "it": "Petto"}` |
| `created_at`, `updated_at` | | |

```php
Schema::create('muscles', function (Blueprint $table) {
    $table->id();
    $table->string('slug')->unique();
    $table->jsonb('name');
    $table->timestamps();
});
```

They start with the values of free-exercise-db:

- **17 muscles:** abdominals, abductors, adductors, biceps, calves, chest, forearms, glutes, hamstrings, lats, lower back, middle back, neck, quadriceps, shoulders, traps, triceps. These are also the "muscle groups" of the interface.
- **12 kinds of equipment:** barbell, dumbbell, cable, machine, kettlebells, bands, e-z curl bar, medicine ball, exercise ball, foam roll, body only, other.

The names in Italian, Spanish and German are in the seeders. Equipment reads as a plural where that is how people say it ("Dumbbells", "Manubri"), while the slug keeps free-exercise-db's value (`dumbbell`).

**Why tables rather than PHP enums.** Foreign keys keep them consistent, the filters join on them, their names are translated like any other content, and an admin can correct a name without a release.

### D3.4.2 `exercises`

**What it stands for.** One row per exercise in the library, of either kind ([D2.3](D2-decisions.md#d23-exercise-library)). An empty `owner_id` means public, seen by everyone; a filled one means personal, seen by its owner.

| Column | Type | What it is for |
|---|---|---|
| `id` | bigint | A number, see [D3.2.1](#d321-which-kind-of-id) |
| `owner_id` | bigint, nullable → `users` | Empty: public. Filled: personal |
| `external_id` | string, nullable, unique | The id in free-exercise-db, such as `Barbell_Bench_Press`, or in our extra exercises, such as `AtleoPlan_Frog_Stand`, so that the import can run again and update instead of duplicating |
| `equipment_id` | bigint, nullable → `equipment` | One value, as in free-exercise-db and in the editor ([D1.4.5](D1-ui.md#d145-exercise-editor)) |
| `name` | jsonb, translatable | Required |
| `aliases` | jsonb, translatable, nullable | Other names per language, searched with the name: `{"it": ["panca"]}` |
| `description` | jsonb, translatable, nullable | |
| `instructions` | jsonb, translatable, nullable | A list of steps per language, as free-exercise-db gives them |
| `logging_type` | enum `weight_reps`, `reps`, `time`, `distance` | Default `weight_reps`. Decides which fields a set shows ([D3.6.3](#d363-logged_sets)) |
| `level` | string, nullable | From the import: beginner, intermediate, expert. Not shown yet |
| `category` | string, nullable | From the import: strength, stretching, cardio… Not shown yet |
| `machine_translated` | jsonb | Languages not yet reviewed by a person, such as `["es", "de"]`; default `[]` |
| `youtube_url` | string, nullable | The editor's alternative to uploading a video |
| `search_text` | text, default `''` | Every name and alias in every language, normalised, for the search ([D3.4.6](#d346-searching)); written by the model at every save, never by hand |
| `created_at`, `updated_at`, `deleted_at` | | Soft deletes ([D3.7](#d37-what-happens-on-delete)) |

```php
Schema::create('exercises', function (Blueprint $table) {
    $table->id();
    // constrained('users'): the column's name does not say the table, so it is stated.
    // Nothing after it: Postgres refuses to delete a user who still owns exercises (D3.7)
    $table->foreignId('owner_id')->nullable()->index()->constrained('users');
    $table->string('external_id')->nullable()->unique();
    $table->foreignId('equipment_id')->nullable()->index()->constrained('equipment');
    $table->jsonb('name');
    $table->jsonb('aliases')->nullable();
    $table->jsonb('description')->nullable();
    $table->jsonb('instructions')->nullable();
    $table->enum('logging_type', ['weight_reps', 'reps', 'time', 'distance'])->default('weight_reps');
    $table->string('level')->nullable();
    $table->string('category')->nullable();
    $table->jsonb('machine_translated')->default('[]');
    $table->string('youtube_url')->nullable();
    $table->timestamps();
    $table->softDeletesTz();    // adds deleted_at
});
```

```php
class Exercise extends Model
{
    use HasTranslations, InteractsWithMedia, SoftDeletes;

    /** The columns spatie/laravel-translatable handles, one value per language. */
    public array $translatable = ['name', 'aliases', 'description', 'instructions'];

    protected function casts(): array
    {
        return ['machine_translated' => 'array'];    // JSON in the database, a PHP array here
    }

    public function muscles(): BelongsToMany
    {
        return $this->belongsToMany(Muscle::class)->withPivot('role');
    }

    public function equipment(): BelongsTo
    {
        return $this->belongsTo(Equipment::class);
    }
}
```

The real model (`app/Models/Exercise.php`) adds:
- the cast of `logging_type` to the enum `LoggingType`;
- the defaults in `$attributes`, which a new model does not read from the table;
- `owner()`, the relation to the user, and on `User`, `exercises()`. Creating through it, `$user->exercises()->create(…)`, is how the owner is set: `owner_id` is not fillable;
- `using(ExerciseMuscle::class)` on `muscles()` ([D3.4.3](#d343-exercise_muscle));
- the media collections `photos` and `videos`, with the accepted file types of [D2.5](D2-decisions.md#d25-photos-and-videos);
- the query scopes of the library's list: `visibleTo`, `search` ([D3.4.6](#d346-searching)), `withPrimaryMuscle`, `usingEquipment`, `fromSource`, `orderByName` ([C2.6](../concepts/C2-backend.md#c26-database-migrations-models-factories-seeders)), and `isOwnedBy($user)`.

### D3.4.3 `exercise_muscle`

**What it stands for.** Which muscles an exercise works, and how. A pivot table ([idea 5](#d311-a-database-in-ten-ideas)).

| Column | Type | What it is for |
|---|---|---|
| `exercise_id` | bigint → `exercises` | |
| `muscle_id` | bigint → `muscles` | |
| `role` | enum `primary`, `secondary` | free-exercise-db allows several primary muscles, so this is a role and not one column on `exercises` |

```php
Schema::create('exercise_muscle', function (Blueprint $table) {
    $table->foreignId('exercise_id')->constrained()->cascadeOnDelete();
    $table->foreignId('muscle_id')->index()->constrained();
    $table->enum('role', ['primary', 'secondary']);
    // The primary key is the pair: a muscle cannot appear twice on one exercise
    $table->primary(['exercise_id', 'muscle_id']);
});
```

```php
$exercise->muscles()->attach($chest, ['role' => 'primary']);        // adds a pivot row
$exercise->muscles()->wherePivot('role', 'primary')->pluck('slug'); // ["chest"]
```

**The role as an enum.** A pivot table has no model, so its `role` would be a plain string. The small class `ExerciseMuscle extends Pivot` gives it the cast to `MuscleRole`, and both relations use it: `->using(ExerciseMuscle::class)->withPivot('role')`. Then `$muscle->pivot->role` is `MuscleRole::Primary` ([H1.10.3](../how-to/H1-database.md#h1103-a-pivot-with-a-column-of-its-own)).

### D3.4.4 Photos and videos

They go in the existing `media` table of spatie/laravel-medialibrary, not in columns of `exercises`, in the collections `photos` and `videos`. Its `order_column` holds the order chosen in the editor, and the first photo is the cover.

- The limits of [D2.5](D2-decisions.md#d25-photos-and-videos) (2 videos, 5 photos, sizes) are checked when uploading, not by the database.
- A soft-deleted exercise **keeps its files**: the library removes them only on a `forceDelete()`.

### D3.4.5 Translations

A translatable column holds one value per language. This is what the `name` column really contains:

```json
{"en": "Barbell bench press", "it": "Panca piana con bilanciere"}
```

The `HasTranslations` trait makes this invisible in the code: `$exercise->name` gives the text in the app's current language. These are the real results, with an exercise that has English and Italian, and a personal one written only in Italian:

| Current language | Public exercise | Personal exercise |
|---|---|---|
| `it` | Panca piana con bilanciere | Panca mia |
| `de` | Barbell bench press *(no German: falls back to English)* | Panca mia *(no German or English: falls back to what exists)* |

The right-hand column needs a setting. A personal exercise holds one language only ([D2.4](D2-decisions.md#d24-languages)), and by default the package answers with an **empty string** when both the language and the English fallback are missing. `AppServiceProvider` turns on `fallbackAny`:

```php
Translatable::fallback(fallbackLocale: 'en', fallbackAny: true);
```

Values can be lists as well as text, which is how `aliases` and `instructions` work:

```php
$exercise->getTranslation('instructions', 'en');
// ["Lie on the bench.", "Lower the bar to the chest."]
```

### D3.4.6 Searching

Search looks in the name and the aliases **in every language**, among public exercises and the user's own ([D1.4.3](D1-ui.md#d143-exercise-library)), ignoring upper and lower case, accents, dashes and dots. An Italian who types "pull up" finds "Trazioni alla sbarra" through its English name; an English interface finds "trazioni" through the Italian one.

**What it looks in: `search_text`.** A column that holds every name and alias of the exercise, each **normalised** by `App\Support\SearchText`: lower case, accents taken off, every run of other characters turned into one space, the pieces separated by ` | `:

```
Pullups | Trazioni alla sbarra | Klimmzüge | pull-up      (names and aliases)
pullups | trazioni alla sbarra | klimmzuge | pull up      (search_text)
```

The model writes it at every save, on its `saving` event ([C2.6](../concepts/C2-backend.md#c26-database-migrations-models-factories-seeders)), so it follows the API, the import, the translation and the admin panel alike; the migration that added it filled the existing rows once ([H1.16](../how-to/H1-database.md#h116-the-search-text-as-built)).

**How a search matches.** What the user typed is normalised the same way and cut into words. Matches start at the beginning of a word of `search_text`, never inside one, and an exercise is found by any of three rules:

| Rule | Example | Finds | Does not find |
|---|---|---|---|
| **A. The words, in any order:** each a whole word, the last only the start of one (it may still be being typed) | `squat jump`, `trazioni al` | "Freehand **Jump Squat**", "**Trazioni al**la sbarra" | "Palms-Up Low-**Pull**ey" for `pull up`: "pull" is not a whole word there |
| **B. Several words typed as one** | `pull up` → `pullup` | "**Pullup**s" | |
| **C. One word written as two in the text,** for words of 5 letters or more | `pullup` | "Band Assisted **Pull-Up**" | "Allungamento **di p**etto" for `dip`: too short |

```php
// Exercise::visibleTo($user)->search('pull up'): the scope's SQL, rules A and B
(concat(' ', search_text, ' ') like '% pull %' and concat(' ', search_text, ' ') like '% up%')
or concat(' ', search_text, ' ') like '% pullup%'
```

- **`concat(' ', search_text, ' ')`** puts a space at both ends, so "a word starting with up" is `'% up%'` and "the word pull" is `'% pull %'`, the first and the last word included.
- **Rule C** is a regular expression, Postgres's `~`: `' p ?u ?l ?l ?u ?p'`, the letters in order with a space allowed between them.
- **Only punctuation typed,** such as `%`, matches nothing. The words hold only a-z and 0-9, so nothing typed can act as a `%` or `_` of the pattern.

| Search | With these exercises | Finds |
|---|---|---|
| `bench`, interface in Italian | `{"en": "Barbell bench press", "it": "Panca piana con bilanciere"}` | it, read as "Panca piana con bilanciere": the English name is searched too |
| `PULLUP`, `pull up` | "Pullups", "Band Assisted Pull-Up" | both |
| `sit up` | "Sit-Up", and "Curl da seduto a presa supina" | only the first: "seduto" and "supina" contain "sit" and "up" only inside words |

No special index is needed: a thousand rows do not need one. If search slows down, Postgres's `pg_trgm` extension indexes exactly this kind of `like '%…%'`.

**Why a column, rather than reading the JSON at every search.** The normalisation (accents, punctuation) is easy in PHP and awkward in SQL, and done once per save it costs nothing per search. The price is keeping it in step, which the `saving` event does; code that bypasses the model (`DB::table()->update()`) must fill it itself.

**Sorting by name** reads the same text, `coalesce(name->>'it', name->>'en')`, with `collate "und-x-icu"`. Postgres on Alpine compares bytes by default, which puts "Bench" before "banca" and accented letters after "z". The ICU rules sort as a reader expects ([H2.12.4](../how-to/H2-backend.md#h2124-sorting-by-name-the-collation-trap)).

### D3.4.7 What is not in the table

The "tips and common mistakes" of [D1.4.4](D1-ui.md#d144-exercise-details). free-exercise-db has none, so the column would be empty. A `tips` column is added when there is content to put in it.

---

## D3.5 Plans

**In the code:** the migrations `…_create_{plans,plan_days,plan_items,plan_sets}_table.php` and `…_add_active_plan_id_to_users_table.php`, the models `Plan`, `PlanDay`, `PlanItem` and `PlanSet`, the enum `SetType`. How they were built: [H1.13](../how-to/H1-database.md#h113-the-plan-tables-as-built). The API that reads and saves them: [C2.5.5](../concepts/C2-backend.md#c255-the-plans-endpoints).

A plan has four levels, because each level holds different facts:

```
Push Pull Legs                     plans        the name and the goal
└── Day A – Push                   plan_days    the order of the days
    └── Barbell bench press        plan_items   which exercise, its rest, its superset
        ├── W   10 reps at 40 kg   plan_sets    this set's type and targets
        ├── 1   8–10 reps at 80 kg
        └── 2   8–10 reps at 80 kg
```

### D3.5.1 `plans`

**What it stands for.** One workout plan (in Italian, *scheda*). Created by the user in the plan editor ([D1.4.8](D1-ui.md#d148-plan-editor)).

| Column | Type | What it is for |
|---|---|---|
| `id` | uuid | Created on the device |
| `user_id` | bigint → `users` | Its owner |
| `name` | string | "Push Pull Legs" |
| `goal` | string, nullable | |
| `notes` | text, nullable | |
| `version` | integer | Starts at 1, plus 1 on every save ([D3.5.7](#d357-when-a-plan-is-changed-in-two-places)) |
| `archived_at` | timestampTz, nullable | Filled: archived ([D1.4.6](D1-ui.md#d146-plan-list)) |
| `created_at`, `updated_at` | | |

```php
Schema::create('plans', function (Blueprint $table) {
    $table->uuid('id')->primary();
    // user_id: Laravel works out the table `users` from the column's name
    $table->foreignId('user_id')->index()->constrained()->cascadeOnDelete();
    $table->string('name');
    $table->string('goal')->nullable();
    $table->text('notes')->nullable();
    $table->integer('version')->default(1);
    $table->timestampTz('archived_at')->nullable();
    $table->timestamps();
});
```

### D3.5.2 `plan_days`

**What it stands for.** One training day of a plan, such as "Day A – Push". Its `position` is the order the suggested day follows ([D2.8](D2-decisions.md#d28-workout-rules)).

| Column | Type | What it is for |
|---|---|---|
| `id` | uuid | |
| `plan_id` | uuid → `plans` | |
| `name` | string | |
| `position` | integer | |
| `created_at`, `updated_at` | | |

```php
Schema::create('plan_days', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('plan_id')->constrained()->cascadeOnDelete();    // foreignUuid: this id is a UUID
    $table->string('name');
    $table->integer('position');
    $table->timestamps();
    $table->index(['plan_id', 'position']);
});
```

### D3.5.3 `plan_items`

**What it stands for.** One exercise in one day. The same exercise can appear on many days and in many plans, each with its own rest and sets, which is why this table exists rather than days pointing straight at exercises.

| Column | Type | What it is for |
|---|---|---|
| `id` | uuid | |
| `plan_day_id` | uuid → `plan_days` | |
| `exercise_id` | bigint → `exercises` | Public, or owned by the plan's owner; the Form Request checks it |
| `position` | integer | |
| `superset_group` | smallint, nullable | Items of a day with the same number form a superset |
| `rest_seconds` | integer, nullable | Empty: the user's `default_rest_seconds` |
| `notes` | text, nullable | "Shoulder blades back" |
| `for_time` | boolean, default false | Done as fast as possible: the reps of its sets are a fixed amount, the time taken is the result ([D1.4.8](D1-ui.md#d148-plan-editor)). Meaningful only for an exercise counted in reps; the editor sends false otherwise |
| `created_at`, `updated_at` | | |

```php
Schema::create('plan_items', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('plan_day_id')->constrained()->cascadeOnDelete();
    $table->foreignId('exercise_id')->index()->constrained();    // refused while in use (D3.7)
    $table->integer('position');
    $table->smallInteger('superset_group')->nullable();
    $table->integer('rest_seconds')->nullable();
    $table->text('notes')->nullable();
    $table->timestamps();
    $table->index(['plan_day_id', 'position']);
});

// With feat/for-time: …_add_for_time_to_plan_items_table.php (H3.25.2)
Schema::table('plan_items', function (Blueprint $table) {
    $table->boolean('for_time')->default(false);
});
```

**Supersets.** Two or more exercises done in turn ([D1.4.8](D1-ui.md#d148-plan-editor)) are marked by giving them the same number. Here bench press and rows form a superset, and the squat is on its own:

| position | exercise | superset_group |
|---|---|---|
| 0 | Barbell bench press | 1 |
| 1 | Barbell row | 1 |
| 2 | Squat | *(empty)* |

The numbers mean nothing except "same or different", and they must belong to neighbouring items, which the Form Request checks. A separate `supersets` table would hold nothing but an id.

### D3.5.4 `plan_sets`

**What it stands for.** One planned set, warm-ups included.

| Column | Type | What it is for |
|---|---|---|
| `id` | bigint | Nothing points to these rows ([D3.5.6](#d356-saving-a-plan)) |
| `plan_item_id` | uuid → `plan_items` | |
| `position` | integer | |
| `set_type` | enum `normal`, `warm_up`, `drop`, `failure` | Default `normal` ([D2.8](D2-decisions.md#d28-workout-rules)) |
| `target_reps_min`, `target_reps_max` | integer, nullable | "8–10" is 8 and 10; "8" is 8 and 8. Check: min ≤ max |
| `target_weight_kg` | numeric(7,3), nullable | |
| `target_rpe` | numeric(3,1), nullable | How hard it should feel. Check: between 1 and 10 |
| `target_duration_seconds` | integer, nullable | For `time` exercises |
| `target_distance_meters` | integer, nullable | For `distance` exercises |

```php
Schema::create('plan_sets', function (Blueprint $table) {
    $table->id();
    $table->foreignUuid('plan_item_id')->constrained()->cascadeOnDelete();
    $table->integer('position');
    $table->enum('set_type', ['normal', 'warm_up', 'drop', 'failure'])->default('normal');
    $table->integer('target_reps_min')->nullable();
    $table->integer('target_reps_max')->nullable();
    $table->decimal('target_weight_kg', 7, 3)->nullable();
    $table->decimal('target_rpe', 3, 1)->nullable();
    $table->integer('target_duration_seconds')->nullable();
    $table->integer('target_distance_meters')->nullable();
    $table->index(['plan_item_id', 'position']);
});
DB::statement('ALTER TABLE plan_sets ADD CONSTRAINT plan_sets_reps_range
    CHECK (target_reps_min <= target_reps_max)');
DB::statement('ALTER TABLE plan_sets ADD CONSTRAINT plan_sets_rpe_range
    CHECK (target_rpe BETWEEN 1 AND 10)');
```

**Why one row per set, rather than "4 sets" on the plan item.** The screens need each set's own type and targets: in workout mode the warm-up asks for 40 kg and the next set for 80 kg ([D1.4.9](D1-ui.md#d149-workout-mode)). The text "4 × 8–10 · + 2 warm-up" of [D1.4.7](D1-ui.md#d147-plan-details) is counted from the rows.

**Set aside:** a JSON column on `plan_items` holding the list of sets. It looks simpler, but it would lose the check constraints.

### D3.5.5 The relations in code

```php
class Plan extends Model
{
    use HasUuids;

    public function days(): HasMany
    {
        return $this->hasMany(PlanDay::class)->orderBy('position');
    }
}

class PlanItem extends Model
{
    use HasUuids;

    public function sets(): HasMany
    {
        return $this->hasMany(PlanSet::class)->orderBy('position');
    }

    public function exercise(): BelongsTo
    {
        // withTrashed(): the exercise may be soft-deleted, and the plan must still show it (D3.11)
        return $this->belongsTo(Exercise::class)->withTrashed();
    }
}
```

The real models (`app/Models/Plan*.php`) add:
- the way back up: `PlanDay::plan()`, `PlanItem::day()`, `PlanSet::item()`, `Plan::user()`, and on `User`, `plans()` and `activePlan()`;
- `Plan::items()`, a *has many through* that reaches every item of every day in one query ([H1.13.5](../how-to/H1-database.md#h1135-the-relations-of-four-levels));
- the casts: `set_type` to the enum `SetType`, the weight and the RPE to exact decimals, `archived_at` to a date;
- `$timestamps = false` on `PlanSet`, whose table has no `created_at` and `updated_at`;
- `isOwnedBy($user)`, `isArchived()`, and the scopes of the plan list, `archived()` and `activeFirst()`.

Loading a whole plan is one line. The dots follow the relations, and Laravel loads each level with one query rather than one per row ("eager loading"):

```php
$plan = Plan::with('days.items.sets')->find($id);

$plan->days->pluck('name');
// ["Day A – Push", "Day B – Pull"]

$plan->days[0]->items[0]->sets->map(fn ($set) => [$set->set_type->value, $set->target_weight_kg]);
// [["warm_up", "40.000"], ["normal", "80.000"], ["normal", "80.000"]]
```

### D3.5.6 Saving a plan

The editor sends the whole plan at once, and the server does this in one transaction:

1. **Days and items** are created or updated by their UUID, and the ones no longer sent are deleted.
2. **Each item's `plan_sets`** are deleted and written again.
3. **`version`** goes up by 1.

In the code this is the action `SavePlan`, called by `POST` and `PUT /api/plans` ([C2.5.5](../concepts/C2-backend.md#c255-the-plans-endpoints)); the body is built by the plan editor ([C1.16.5](../concepts/C1-frontend.md#c1165-saving)). The positions are not sent: each row's place in its list is its position.

The two levels differ on purpose. Days and items **keep their UUIDs** across saves, because sessions point to them: a session done last week stays linked to the same `plan_items` row even after its reps change. Nothing points to `plan_sets`, so rewriting them is simpler than working out which set changed. That is why they have a plain number as their id.

**The editor's draft is kept on the device**, not in the database: in IndexedDB once the offline work of FEAT-3 brings it, and until then in `localStorage`, which holds one draft of a few kilobytes as well ([C1.16.4](../concepts/C1-frontend.md#c1164-the-draft-kept-in-the-browser)). "Discard changes" ([D1.4.8](D1-ui.md#d148-plan-editor)) goes back to the last saved version, which is the row in `plans`. A draft therefore does not follow the user from desktop to phone; a saved plan does.

### D3.5.7 When a plan is changed in two places

[D2.7](D2-decisions.md#d27-offline-and-sync) says that the last change wins, with a warning. The `version` column is how the server knows there is something to warn about:

| Step | Phone (offline) | Laptop | Server's `version` |
|---|---|---|---|
| 1. Both have the plan | version 3 | version 3 | 3 |
| 2. The laptop changes a day and saves | | sends "started from 3" | 4 |
| 3. The phone, offline, changes a rest | waits to send | | 4 |
| 4. The phone is back online and sends | sends "started from 3" | | 5 |

At step 4, the phone started from 3 but the server is at 4, so someone else got there first. The save still goes through, and the answer carries the warning "This plan was changed somewhere else" ([D1.6](D1-ui.md#d16-states-and-edge-cases)).

**Why a number and not `updated_at`.** Comparing times would mean trusting two clocks to agree, and a phone's clock can be minutes off. A counter cannot be wrong that way.

### D3.5.8 The plan file

A plan saved as a file by **Export** and read back by **Import plan** ([D1.4.7](D1-ui.md#d147-plan-details), why JSON: [D2.9](D2-decisions.md#d29-plan-files)). Not a table: the shape of `GET /api/plans/{id}/export` and of the body of `POST /api/plans/import` ([C2.5.8](../concepts/C2-backend.md#c258-a-plan-as-a-file)).

```json
{
  "format": "atleoplan.plan",
  "version": 1,
  "exported_at": "2026-11-10T14:00:00.000000Z",
  "plan": {
    "name": "Calisthenics", "goal": null, "notes": null,
    "days": [
      { "name": "Day A", "items": [
        { "exercise": "e1", "superset_group": null, "rest_seconds": 90, "notes": null, "for_time": true,
          "sets": [ { "set_type": "normal", "target_reps_min": 50, "target_reps_max": 50, "target_weight_kg": null,
                      "target_rpe": null, "target_duration_seconds": null, "target_distance_meters": null } ] }
      ] }
    ]
  },
  "exercises": [
    { "ref": "e1", "external_id": "Pushups", "name": "Piegamenti", "logging_type": "reps", "equipment": "body-only",
      "muscles": [ { "muscle": "chest", "role": "primary" } ],
      "description": null, "instructions": ["…"], "youtube_url": null }
  ]
}
```

| Key | What it is |
|---|---|
| `format`, `version` | What the file is, and the version of its shape: the import refuses another format or a version it does not read |
| `plan` | The plan's fields, `plan_days` and `plan_items` with their `plan_sets`, in order, **without ids**: the import makes new ones |
| `plan…items[].exercise` | A reference to one of `exercises`, `e1`, `e2`…: only within the file |
| `exercises[].external_id` | A public exercise's stable id ([D3.4.6](#d346-searching)), the same on every server; `null` for a personal one |
| `exercises[].name`, `description`, `instructions` | In the language of the export, the app's |
| `exercises[].equipment`, `muscles` | By slug (`body-only`, `chest`), the same on every server; a slug the other server lacks is left out |

**The import finds each exercise used,** in order: a public one with the same `external_id`; one of the importer's own with the same name, in any language, ignoring case and spaces around it; a public one with that name in the request's language. Deleted exercises never match. None found: it is created as the importer's own from the file, without photos, and named in the answer.

---

## D3.6 Workouts

**In the code:** the migrations `…_create_{workout_sessions,session_exercises,logged_sets}_table.php`, the models `WorkoutSession`, `SessionExercise` and `LoggedSet`, `Plan::suggestedDay()`. How they were built: [H1.15](../how-to/H1-database.md#h115-the-workout-tables-as-built). The API that saves and reads them: [C2.5.7](../concepts/C2-backend.md#c257-the-workouts-endpoints).

### D3.6.1 `workout_sessions`

**What it stands for.** One workout, from the moment Start is tapped. Created on the phone, usually sent to the server later.

| Column | Type | What it is for |
|---|---|---|
| `id` | uuid | Created on the device |
| `user_id` | bigint → `users` | |
| `plan_id` | uuid, nullable → `plans` | Empty for a free workout, or once the plan is deleted |
| `plan_day_id` | uuid, nullable → `plan_days` | The same. Also finds "the last time this day was done" ([D1.4.10](D1-ui.md#d1410-workout-summary)) |
| `plan_name`, `day_name` | string, nullable | Copies of the names when the session started |
| `started_at` | timestampTz | |
| `finished_at` | timestampTz, nullable | Empty: still in progress, which is what Home's banner looks for ([D1.4.2](D1-ui.md#d142-home)) |
| `duration_seconds` | integer, nullable | Set by the device at the end |
| `feeling` | smallint, nullable | The summary's 1–5. Check: between 1 and 5 |
| `notes` | text, nullable | |
| `created_at`, `updated_at`, `deleted_at` | | Soft deletes ([D3.7](#d37-what-happens-on-delete)) |

```php
Schema::create('workout_sessions', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignId('user_id')->constrained()->cascadeOnDelete();
    // nullOnDelete(): when the plan goes, this cell empties and the session stays
    $table->foreignUuid('plan_id')->nullable()->index()->constrained()->nullOnDelete();
    $table->foreignUuid('plan_day_id')->nullable()->index()->constrained()->nullOnDelete();
    $table->string('plan_name')->nullable();
    $table->string('day_name')->nullable();
    $table->timestampTz('started_at');
    $table->timestampTz('finished_at')->nullable();
    $table->integer('duration_seconds')->nullable();
    $table->smallInteger('feeling')->nullable();
    $table->text('notes')->nullable();
    $table->timestamps();
    $table->softDeletesTz();
    $table->index(['user_id', 'started_at']);    // history: a user's sessions by date
});
DB::statement('ALTER TABLE workout_sessions ADD CONSTRAINT workout_sessions_feeling_range
    CHECK (feeling BETWEEN 1 AND 5)');
```

**Why copy `plan_name` and `day_name`.** Elsewhere this page avoids copies, but here a copy is the point: it records what the plan was called *at the time*. History keeps saying "Push Pull Legs · Day A" after a rename, or after the plan is deleted.

**Why `duration_seconds` and not `finished_at − started_at`.** A session left open and finished the next morning would last fourteen hours. The device counts the time actually trained.

**One session in progress at a time is not enforced by the database.** Two phones offline could each start one, and refusing the second when it syncs would lose a workout. When more than one is open, Home offers the most recent.

### D3.6.2 `session_exercises`

**What it stands for.** One exercise as done in one session.

| Column | Type | What it is for |
|---|---|---|
| `id` | uuid | |
| `workout_session_id` | uuid → `workout_sessions` | |
| `exercise_id` | bigint → `exercises` | The exercise actually done, which after a swap is not the plan's |
| `plan_item_id` | uuid, nullable → `plan_items` | Empty when added on the fly, or once the item is deleted |
| `position` | integer | |
| `superset_group` | smallint, nullable | Copied from the plan item when the session starts |
| `notes` | text, nullable | |
| `created_at`, `updated_at` | | |

```php
Schema::create('session_exercises', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('workout_session_id')->constrained()->cascadeOnDelete();
    $table->foreignId('exercise_id')->index()->constrained();
    $table->foreignUuid('plan_item_id')->nullable()->index()->constrained()->nullOnDelete();
    $table->integer('position');
    $table->smallInteger('superset_group')->nullable();
    $table->text('notes')->nullable();
    $table->timestamps();
    $table->index(['workout_session_id', 'position']);
});
```

**Set aside: logged sets pointing straight at the exercise,** with no table in between. There would then be no place for the order of the exercises, a note on one of them, or an exercise that was skipped.

### D3.6.3 `logged_sets`

**What it stands for.** One completed set: the tap on ✓.

| Column | Type | What it is for |
|---|---|---|
| `id` | uuid | |
| `session_exercise_id` | uuid → `session_exercises` | |
| `position` | integer | |
| `set_type` | enum `normal`, `warm_up`, `drop`, `failure` | Warm-ups count neither for volume nor for records ([D2.8](D2-decisions.md#d28-workout-rules)) |
| `weight_kg` | numeric(7,3), nullable | Check: not negative |
| `reps` | integer, nullable | Check: not negative |
| `duration_seconds` | integer, nullable | For `time` exercises; and the time taken by reps done as fast as possible |
| `distance_meters` | integer, nullable | For `distance` exercises |
| `completed_at` | timestampTz | The moment of the tap |
| `created_at`, `updated_at` | | |

```php
Schema::create('logged_sets', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('session_exercise_id')->constrained()->cascadeOnDelete();
    $table->integer('position');
    $table->enum('set_type', ['normal', 'warm_up', 'drop', 'failure'])->default('normal');
    $table->decimal('weight_kg', 7, 3)->nullable();
    $table->integer('reps')->nullable();
    $table->integer('duration_seconds')->nullable();
    $table->integer('distance_meters')->nullable();
    $table->timestampTz('completed_at');
    $table->timestamps();
    $table->index(['session_exercise_id', 'position']);
});
DB::statement('ALTER TABLE logged_sets ADD CONSTRAINT logged_sets_weight_not_negative CHECK (weight_kg >= 0)');
DB::statement('ALTER TABLE logged_sets ADD CONSTRAINT logged_sets_reps_not_negative CHECK (reps >= 0)');
```

**Which values a set fills** depends on the exercise's `logging_type`:

| `logging_type` | Filled | May be filled | Example |
|---|---|---|---|
| `weight_reps` | `reps` | `weight_kg`; empty for a set with the body alone. `duration_seconds`, done as fast as possible | Bench press, 80 kg × 8; lunges without dumbbells, 12 |
| `reps` | `reps` | `weight_kg`, the **added** weight (a belt with a plate); empty for the body alone. `duration_seconds`, done as fast as possible | Pull-ups, 12; weighted pull-ups, +10 kg × 6; push-ups, 50 in 1:12 |
| `time` | `duration_seconds` | – | Plank, 60 s |
| `distance` | `distance_meters` | – | Rowing, 500 m |

Every other value field stays empty. A set with both `reps` and `duration_seconds` was done as fast as possible (its plan item's `for_time`); the session keeps no flag of its own, the set says it. On a `reps` exercise `weight_kg` is what was added to the body, never the body's weight, which the app does not know. The rule lies across two tables, which a check constraint cannot see, so the Form Request enforces it.

**Why the set type is here as well as in `plan_sets`.** The type can be changed during a workout ([D1.4.9](D1-ui.md#d149-workout-mode)), and what counts for statistics is what was really done.

### D3.6.4 How the screens use these tables

- **A row exists only once a set is ticked.** The sets still to do in workout mode come from the plan. Unticking removes the row.
- **A skipped exercise** is a `session_exercises` row with no sets. "Exercises completed" in the summary counts those with at least one.
- **Swapping an exercise** changes `exercise_id` and keeps `plan_item_id`: the plan's slot is the same, the exercise is different.

**The "Last" column** ([D1.4.9](D1-ui.md#d149-workout-mode)) shows what was done last time with this exercise, in any plan:

```php
WorkoutSession::query()                                // starts from the session: deleted ones are hidden
    ->where('user_id', $user->id)
    ->whereNotNull('finished_at')                      // only finished sessions
    ->whereHas('sessionExercises', fn ($q) => $q->where('exercise_id', $exerciseId))
    ->latest('started_at')                             // most recent first
    ->first()
    // ?-> stops and gives null when there is nothing before it: an exercise never done
    ?->sessionExercises()->where('exercise_id', $exerciseId)->first()
    ?->sets;
// [warm_up 40.000 × 10], [normal 82.500 × 8], [normal 82.500 × 6]
```

Each row is shown next to the set in the same `position`.

**Of each kind.** An exercise counted in reps may be done for reps one day and as fast as possible another. Last time's 3 × 15 is no time to beat, so last time is looked for among workouts where it was done **the same way**: timed (a set has `duration_seconds`) or not. `FindLastSets` keeps the latest of each exercise **and kind** (`distinct on (exercise_id, timed)`), so an exercise done both ways has two entries; the app picks the one of the kind it does now ([C2.5.7](../concepts/C2-backend.md#c257-the-workouts-endpoints), [C1.17.9](../concepts/C1-frontend.md#c1179-exercises-done-as-fast-as-possible)).

**The suggested day** ([D2.8](D2-decisions.md#d28-workout-rules)) is the day after the last one completed, back to the first after the last:

```php
$plan = Plan::find($user->active_plan_id);
if (! $plan) {
    return null;                                       // no active plan: Home's empty state
}

$days = $plan->days()->get();                          // in order
$lastDayId = WorkoutSession::query()
    ->where('plan_id', $plan->id)
    ->whereNotNull('finished_at')
    ->latest('started_at')
    ->value('plan_day_id');

$index = $days->search(fn ($day) => $day->id === $lastDayId);

// Never trained, or that day was deleted: the first day. Otherwise the next, or back to the first
return $index === false ? $days->first() : ($days[$index + 1] ?? $days->first());
```

### D3.6.5 Sending a session to the server

The phone sends the whole session, with its exercises and sets, when the network is back, and may send it more than once. The server must therefore end up in the same state however many times it receives it ([D2.7](D2-decisions.md#d27-offline-and-sync)). This is the idea; the real endpoint is `PUT /api/sessions/{id}` with `SaveWorkoutSession` ([C2.5.7](../concepts/C2-backend.md#c257-the-workouts-endpoints)), which differs in three ways: a session deleted elsewhere answers **410 Gone** instead of returning silently, so the phone knows to stop sending it; the links to the plan, its day and its items are kept only if they still exist and are the user's, so a workout is never refused because the plan changed meanwhile; and every moment is turned into UTC before it is written ([H2.14.5](../how-to/H2-backend.md#h2145-the-trap-of-the-moments)). The sketch:

```php
DB::transaction(function () use ($user, $data) {
    // withTrashed(): soft-deleted sessions must be found too, see the third check
    $session = WorkoutSession::withTrashed()->find($data['id']);

    if ($session && $session->user_id !== $user->id) {
        abort(403);                                    // someone else's UUID (D3.2.1)
    }
    if ($session?->trashed()) {
        return;                                        // deleted elsewhere: do not bring it back (D3.7)
    }

    // ??= assigns only when the left side is empty: an unknown UUID is a new session
    $session ??= new WorkoutSession(['id' => $data['id'], 'user_id' => $user->id]);
    $session->fill($data)->save();

    // What the phone no longer sends has been removed there: an exercise taken out…
    $session->sessionExercises()->whereNotIn('id', array_column($data['exercises'], 'id'))->delete();

    foreach ($data['exercises'] as $exercise) {
        $row = SessionExercise::updateOrCreate(['id' => $exercise['id']], [ /* its columns */ ]);

        // …or a set unticked
        $row->sets()->whereNotIn('id', array_column($exercise['sets'], 'id'))->delete();

        foreach ($exercise['sets'] as $set) {
            LoggedSet::updateOrCreate(['id' => $set['id']], ['session_exercise_id' => $row->id] + $set);
        }
    }
});
```

`updateOrCreate` looks for the first array and updates the row if it finds it; otherwise it creates one. That is what makes sending twice harmless. What each situation did when a test version of this ran:

| Situation | Result | Sets on the server |
|---|---|---|
| A session with 2 sets arrives | Saved | 2 |
| The same session arrives again | Saved, nothing changes | 2 |
| Another user sends the same UUID | Refused | 2 |
| The user unticked a set, and it arrives | Saved | 1 |
| The session was deleted, and an old send arrives | Ignored, stays deleted | *unchanged* |

---

## D3.7 What happens on delete

A foreign key has to say what happens when the row it points to is deleted. There are three answers, and each is used on purpose:

| Answer | In a migration | Means | Used when |
|---|---|---|---|
| **Cascade** | `->cascadeOnDelete()` | The rows pointing to it go too | The child means nothing without its parent: a day without a plan |
| **Set to empty** | `->nullOnDelete()` | The pointer empties; the row stays | The row has value of its own: a session after its plan is gone |
| **Refuse** | `->constrained()` with nothing after it | Postgres refuses the delete | The row is needed: an exercise used by a plan |

The full list:

| Foreign key | On delete |
|---|---|
| `plans.user_id`, `workout_sessions.user_id` | cascade |
| `plan_days.plan_id`, `plan_items.plan_day_id`, `plan_sets.plan_item_id` | cascade |
| `session_exercises.workout_session_id`, `logged_sets.session_exercise_id` | cascade |
| `exercise_muscle.exercise_id` | cascade |
| `users.active_plan_id`, `workout_sessions.plan_id`, `workout_sessions.plan_day_id`, `session_exercises.plan_item_id` | set to empty |
| `exercises.owner_id`, `exercises.equipment_id`, `exercise_muscle.muscle_id`, `plan_items.exercise_id`, `session_exercises.exercise_id` | refuse |

### D3.7.1 Deleting a plan

Its days, items and sets go. The sessions stay, and this is what remained of a session after its plan was deleted:

| Cell | Value |
|---|---|
| `workout_sessions.plan_id` | *(empty)* |
| `workout_sessions.plan_name` | Push Pull Legs |
| `workout_sessions.day_name` | Day A – Push |
| `session_exercises.plan_item_id` | *(empty)* |
| Logged sets of the session | all 3 still there |
| `users.active_plan_id` | *(empty)*, so Home shows its empty state |

### D3.7.2 Deleting an exercise: a soft delete

Plans and history point to the exercise, and they must keep working. So it gets a `deleted_at`: it disappears from the library and from search, but a plan or a past session can still show its name and photos. A hard delete is refused while anything points to it.

### D3.7.3 Deleting a session: a soft delete

A device may retry sending a session after the user deleted it elsewhere ([D3.6.5](#d365-sending-a-session-to-the-server)). With the row gone, the retry would simply create it again. With the row still there, the server sees the UUID, sees that it is deleted, and ignores it. The row acts as a marker that says "this one is gone".

### D3.7.4 Deleting an account: an action in the code

Account deletion arrives in phase 2 ([D1.4.14](D1-ui.md#d1414-profile-and-settings)). It has to run in this order:

```php
DB::transaction(function () use ($user) {
    // 1. Sessions, for good: withTrashed so soft-deleted ones go as well
    WorkoutSession::withTrashed()->where('user_id', $user->id)->forceDelete();

    // 2. Plans, with their days, items and sets, by cascade
    Plan::where('user_id', $user->id)->delete();

    // 3. Personal exercises, one at a time through Eloquent, which removes their files
    Exercise::withTrashed()->where('owner_id', $user->id)->get()->each->forceDelete();

    // 4. The user
    $user->delete();
});
```

The order is not a matter of taste. There are two reasons:

- **Personal exercises cannot simply cascade from the user.** That was the first design, and when tried, Postgres refused the delete. It checks the exercises as soon as they go, while the user's plans still point to them.
- **Photos live on disk,** and only the Eloquent model knows how to remove them. A database cascade deletes rows without running any PHP, so it would delete the `media` rows and leave the files behind forever.

So `exercises.owner_id` has no cascade, on purpose: a query that skips these steps is refused, rather than doing half the job. When this ran, the user's plans, sessions and personal exercises went, and the public exercises and the other user stayed.

---

## D3.8 Computed, never stored

These values are always worked out from the rows, so they can never disagree with them:

| Value | Worked out from | Rule |
|---|---|---|
| Volume, per exercise or muscle | `logged_sets` | weight × reps, warm-ups excluded ([D2.8](D2-decisions.md#d28-workout-rules)); also per session in the API (`volume_kg`), though no screen shows it |
| Reps and sets of a session | `logged_sets` | warm-ups excluded; reps include the body alone |
| Better than last time | this session's `logged_sets` and those of the last session with the same exercise | the best set, by the rule of D2.8 |
| Estimated one-rep max | `logged_sets` | Epley: weight × (1 + reps / 30), warm-ups excluded |
| Personal records | `logged_sets`, per exercise | [D1.4.12](D1-ui.md#d1412-progress) |
| Suggested day | The last finished session and `plan_days.position` | [D3.6.4](#d364-how-the-screens-use-these-tables) |
| A plan's "last used" | The latest `workout_sessions.started_at` of that plan | |
| A day's estimated duration | Its `plan_sets` and rests | |

**The problem with storing them.** If a session's volume were saved in a column, then fixing a wrong weight in history ([D1.4.11](D1-ui.md#d1411-history)) would have to update that column too, and any place that forgot would leave two numbers disagreeing, with no way to tell which is right.

Volume, for instance:

```php
DB::table('logged_sets')
    ->join('session_exercises', 'session_exercises.id', '=', 'logged_sets.session_exercise_id')
    ->where('session_exercises.workout_session_id', $sessionId)
    ->where('logged_sets.set_type', '!=', SetType::WarmUp->value)    // ->value: the plain string
    ->sum(DB::raw('logged_sets.weight_kg * logged_sets.reps'));
// Monday: 1200.000
```

The sum happens in the database, which is exact and faster than loading every row into PHP. A set with no weight, such as pull-ups, adds nothing to it, because a sum skips empty values.

If a query becomes slow with years of data, a stored copy can be added then, with the rows above remaining the truth.

---

## D3.9 Left for later

Each comes with a new migration when its phase arrives ([D1.8](D1-ui.md#d18-release-phases-and-open-questions)); nothing above needs to change for it.

| What | Phase | Probably |
|---|---|---|
| Share link | 2 | `plans.share_token`, unique and nullable: empty means the link is off |
| Duplicating a plan, and its author | 2 | `plans.source_plan_id`. A duplicate must also copy any personal exercises of the author, or deleting that account would be refused ([D3.7](#d37-what-happens-on-delete)) |
| Template plans | Not decided | Open question ([D1.8](D1-ui.md#d18-release-phases-and-open-questions)); probably plans without an owner |
| Onboarding's goal, Google and Apple sign-in | 2 | Columns on `users`, a `social_accounts` table |
| Exercises proposed by users | 2 | A status on `exercises` |
| Coach and athlete links, body measurements, multi-week programming | 3 | Tables of their own |

---

## D3.10 The full story: one week of training

Every table, in the order they fill up. UUIDs are shortened to their last characters. Ada is a made-up user with id 1.

**Saturday: Ada builds a plan.** The plan editor creates the ids on the device and saves the whole plan ([D3.5.6](#d356-saving-a-plan)):

`plans`

| id | user_id | name | version |
|---|---|---|---|
| `…a1` | 1 | Push Pull Legs | 1 |

`plan_days`

| id | plan_id | name | position |
|---|---|---|---|
| `…d1` | `…a1` | Day A – Push | 0 |
| `…d2` | `…a1` | Day B – Pull | 1 |

`plan_items` (bench press is exercise 10)

| id | plan_day_id | exercise_id | position | rest_seconds |
|---|---|---|---|---|
| `…i1` | `…d1` | 10 | 0 | 90 |

`plan_sets`

| id | plan_item_id | position | set_type | target_reps_min | target_reps_max | target_weight_kg |
|---|---|---|---|---|---|---|
| 1 | `…i1` | 0 | warm_up | 10 | 10 | 40.000 |
| 2 | `…i1` | 1 | normal | 8 | 10 | 80.000 |
| 3 | `…i1` | 2 | normal | 8 | 10 | 80.000 |

Ada taps **Set as active**, which makes `users.active_plan_id` `…a1`.

**Monday, 18:00: Ada starts Day A, in a gym with no signal.** The phone creates everything itself. Nothing reaches the server yet.

`workout_sessions`

| id | user_id | plan_id | plan_day_id | plan_name | day_name | started_at | finished_at |
|---|---|---|---|---|---|---|---|
| `…s1` | 1 | `…a1` | `…d1` | Push Pull Legs | Day A – Push | Mon 18:00 | *(empty)* |

`session_exercises`

| id | workout_session_id | exercise_id | plan_item_id | position |
|---|---|---|---|---|
| `…e1` | `…s1` | 10 | `…i1` | 0 |

**Ada ticks three sets.** Each tap adds one row. The third set falls short of the target, and that is what gets recorded:

`logged_sets`

| id | session_exercise_id | position | set_type | weight_kg | reps |
|---|---|---|---|---|---|
| `…l1` | `…e1` | 0 | warm_up | 40.000 | 10 |
| `…l2` | `…e1` | 1 | normal | 80.000 | 8 |
| `…l3` | `…e1` | 2 | normal | 80.000 | 7 |

**Ada finishes.** The phone fills `finished_at` and `duration_seconds`. The summary shows 2 sets and 15 reps, without the warm-up; the bench press, done for the first time, says "First time" with its best set, 80×8, and its own volume, 80 × 8 + 80 × 7 = **1200 kg**.

**Outside the gym the signal returns.** The phone sends the session ([D3.6.5](#d365-sending-a-session-to-the-server)). The answer is lost in a tunnel, so the phone sends it again. The UUIDs already exist, so there are still three sets.

**Tuesday: Home suggests a day.** The last finished session of the active plan was Day A, at position 0, so it suggests **Day B** ([D3.6.4](#d364-how-the-screens-use-these-tables)).

**Thursday: Ada chooses Day A again.** The suggestion is only a suggestion ([D2.8](D2-decisions.md#d28-workout-rules)). The "Last" column shows Monday's sets: W 40×10, 80×8, 80×7. Ada goes heavier:

| position | set_type | weight_kg | reps |
|---|---|---|---|
| 0 | warm_up | 40.000 | 10 |
| 1 | normal | 82.500 | 8 |
| 2 | normal | 82.500 | 6 |

The volume is 82.5 × 8 + 82.5 × 6 = **1155 kg**, a little less than Monday's. The best set's estimated one-rep max is 82.5 × (1 + 8 / 30) = **104.5 kg**, up from Monday's 101.3 kg, so the summary says the bench press went **better** than last time ([D2.8](D2-decisions.md#d28-workout-rules)): fewer kilograms in all, but a stronger best set. Neither number is stored ([D3.8](#d38-computed-never-stored)).

**Friday: Ada changes the plan to 90 kg.** The item `…i1` keeps its UUID and its `plan_sets` are rewritten. The sessions are untouched: Monday still says 80 kg, because it reads `logged_sets`, not the plan.

**Next month: Ada deletes the plan.** Its days, items and sets go. Both sessions stay, with `plan_id` empty, and history still reads "Push Pull Legs · Day A – Push" from the copies. Progress on the bench press is intact, because it follows `exercise_id` ([D3.7.1](#d371-deleting-a-plan)).

---

## D3.11 Traps to avoid

Each of these fails silently or surprisingly. The ones with a result below were seen in the test run; the others come from how Laravel and the packages are written.

**A relation to a soft-deleted row gives `null`.** A plain `belongsTo(Exercise::class)` hides soft-deleted exercises, so history would have a session exercise with no exercise, and the page would crash on `$row->exercise->name`. The relations from `plan_items` and `session_exercises` use `->withTrashed()` ([D3.5.5](#d355-the-relations-in-code)).

**`SoftDeletes` hides rows only in queries on its own model.** After deleting a session, this still counted it:

```php
SessionExercise::where('exercise_id', $id)->count();    // 2, one of them from the deleted session
```

So queries about history start from `WorkoutSession` ([D3.6.4](#d364-how-the-screens-use-these-tables)). A query that cannot must filter the deleted sessions itself, and each such query gets a test.

**A `decimal` column is a string in PHP.** With the cast `'weight_kg' => 'decimal:3'`, the value is `"80.000"`, to keep it exact. Adding these in PHP would convert them to imprecise floats, so sums go in the database ([D3.8](#d38-computed-never-stored)).

**A plain `where` needs the enum's `->value`.** On a query, `where('set_type', '!=', SetType::WarmUp->value)` passes the string `warm_up` that the column holds.

**Database cascades run no PHP.** No model event fires, so `InteractsWithMedia` never hears about it and files stay on disk. Anything with files is deleted through Eloquent, as in [D3.7.4](#d374-deleting-an-account-an-action-in-the-code).

**`delete()` on a soft-deleting model keeps the files.** Only `forceDelete()` removes them, and that is what we want in a soft delete ([D3.4.4](#d344-photos-and-videos)).

**`->index()` goes before `->constrained()`.** `constrained()` returns a different object, the foreign key's own definition, so column options such as `->index()` and `->nullable()` must come first.

**Check constraints are not in the migration language.** They need `DB::statement()`, right after creating the table ([D3.2.8](#d328-check-constraints)). Forgetting them raises no error; bad data just gets in.

**Without `fallbackAny`, a personal exercise can have an empty name** ([D3.4.5](#d345-translations)).

**A table named `sessions` already exists** ([D3.2.2](#d322-table-names)).

**An id in `#[Fillable]` needs an ownership check.** Accepting the device's `id` is required for offline working, and it means the endpoint decides who may touch that row ([D3.6.5](#d365-sending-a-session-to-the-server)).

---

← [D2. Decisions](D2-decisions.md) · [Contents](../README.md) · [C1. Frontend](../concepts/C1-frontend.md) →
