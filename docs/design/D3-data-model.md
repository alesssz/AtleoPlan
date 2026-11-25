# D3. Data model

Every table of the MVP ([D1.8](D1-ui.md#d18-release-phases-and-open-questions)): what it stands for, its columns, how it connects to the others, and why it is built that way. The migrations follow this page, so a change to the design updates it in the same commit ([P1.3](../project/P1-conventions.md#p13-documentation)).

A new table is designed here first ([H1.2](../how-to/H1-database.md#h12-a-new-table-from-start-to-finish)). Before writing a migration, read the table's section and [D3.11](#d311-traps-to-avoid). The conventions of the database layer in Laravel are in [C2.6](../concepts/C2-backend.md#c26-database-migrations-models-factories-seeders).

## Contents

- [D3.1 Overview](#d31-overview)
  - [D3.1.1 The map](#d311-the-map)
  - [D3.1.2 Plans and sessions: what is meant, what was done](#d312-plans-and-sessions-what-is-meant-what-was-done)
  - [D3.1.3 Column types](#d313-column-types)
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
  - [D3.3.1 `social_accounts`](#d331-social_accounts)
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
- [D3.11 Traps to avoid](#d311-traps-to-avoid)

---

## D3.1 Overview

### D3.1.1 The map

An arrow points from the table holding a foreign key to the table it references.

```
users
├── social_accounts           the Google account a user signs in with
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

### D3.1.2 Plans and sessions: what is meant, what was done

Two families of tables mirror each other:

| | The plan: what I mean to do | The session: what I did |
|---|---|---|
| The whole | `plans` | `workout_sessions` |
| The middle | `plan_days` | *(a session is one day)* |
| One exercise | `plan_items` | `session_exercises` |
| One set | `plan_sets`, with targets | `logged_sets`, with real values |

They are kept apart because **changing a plan must never change the past**: if history were read from the plan, raising a target from 80 to 85 kg would rewrite last month's workouts and the progress charts. A session records what happened, and it survives the deletion of its plan ([D3.7](#d37-what-happens-on-delete)).

### D3.1.3 Column types

The tables use Laravel's Blueprint names: `bigint` for numeric ids, `uuid` ([D3.2.1](#d321-which-kind-of-id)), `string` (255) and `text`, `numeric(7,3)` for exact weights, `jsonb` for lists and translated values, `enum`, `timestampTz` for moments. `→ users` marks a foreign key; **nullable** a column that may be empty.

---

## D3.2 Rules for every table

### D3.2.1 Which kind of id

The choice depends on **who creates the row**.

| Id | Tables | Why |
|---|---|---|
| **UUID**, created on the device | `plans`, `plan_days`, `plan_items`, `workout_sessions`, `session_exercises`, `logged_sets` | They can be created with no network |
| **`bigint`**, created by Postgres | `users`, `exercises`, `muscles`, `equipment`, `plan_sets`, `social_accounts` | Created only online, or, for `plan_sets`, never referenced |

A device offline cannot ask the database for the next id, so whatever is created in the gym gets a UUID made on the device. The same id makes retries idempotent, which offline sync relies on ([D2.7](D2-decisions.md#d27-offline-and-sync)): a set sent twice because the answer was lost is found by its UUID, not created again.

**Why exercises have a `bigint`.** The `media` table links a file to its owner through `model_id`, a `bigint` (`morphs('model')` in its migration). Exercises are therefore created and edited only online, which matches their photos, which can only be uploaded online ([D1.6](D1-ui.md#d16-states-and-edge-cases)).

**On the models:** `HasUuids` fills the id only when it is empty, so the device's id is kept and a row created on the server (a seeder, a factory) gets a UUIDv7. For the device's id to be accepted, `id` is listed in the model's `#[Fillable]` ([C2.6](../concepts/C2-backend.md#c26-database-migrations-models-factories-seeders)).

**A UUID sent by a device is not trusted.** Before updating a row, an endpoint checks that it belongs to the requesting user; otherwise anyone who learned a UUID could overwrite someone else's row ([D3.6.5](#d365-sending-a-session-to-the-server)).

### D3.2.2 Table names

- **`workout_sessions`, not `sessions`.** Laravel's own `sessions` table holds the sign-in sessions behind Sanctum's cookies ([C2.7](../concepts/C2-backend.md#c27-signing-in-sanctum)). The model is `WorkoutSession`; the interface and these docs still say "session".
- **`equipment`, not `equipments`.** Laravel's pluraliser treats the word as uncountable.

### D3.2.3 Weights are always in kilograms

Every weight is stored in kilograms, as `numeric(7,3)`: up to 9999.999 kg. The unit is a preference of the user ([D3.3](#d33-users-and-preferences)), applied only when showing and reading values.

**Why one unit.** Sums, charts and records never convert, so a forgotten conversion cannot mix pounds and kilos, and a user who switches unit keeps their whole history.

**Why three decimals.** Pounds do not convert to round kilos; three decimals bring the original number back:

```
135 lb × 0.45359237 = 61.235 kg     stored
61.235 kg ÷ 0.45359237 = 135.00 lb  shown
```

**Why `numeric` and not `float`.** Values are summed and compared to find records, so they must be exact. See the [trap about strings](#d311-traps-to-avoid) when reading them in PHP.

### D3.2.4 Fixed lists of values

A fixed list (set type, logging type, locale, theme, unit, muscle role, social provider) is an `enum` column, which on Postgres is a `varchar` with a check constraint, and a backed PHP enum in `app/Enums`, cast on the model. The database refuses a value outside the list; in PHP a typo is an error rather than a comparison that is silently false. Adding a value means a new migration for the check and a new case in the enum.

### D3.2.5 Times

Moments written by the device (`started_at`, `completed_at`…) are `timestampTz` and stored in UTC ([D3.6.5](#d365-sending-a-session-to-the-server)). What counts as "Monday" depends on where the user is, so the days of a week are worked out on the device, in the user's own time zone.

### D3.2.6 Indexes

Postgres does not index foreign keys by itself, so every foreign key gets one in its migration (`->index()` before `->constrained()`, [D3.11](#d311-traps-to-avoid)). Where rows are read in order within a parent, a composite index `(parent_id, position)` serves both the ordered read and lookups on the parent alone, and replaces the single-column one.

### D3.2.7 Order is a `position` column

Whatever the user can reorder has an integer `position`, from 0, and every relation to it sorts by it (`->orderBy('position')`).

**It is not unique, on purpose.** While a reorder is being saved, two rows briefly share a position, and a unique constraint would refuse the save.

### D3.2.8 Check constraints

The schema builder has no check constraints, so they are added with `DB::statement('ALTER TABLE … ADD CONSTRAINT …')` right after the table is created, each with a name (`plan_sets_reps_range`) so the error says which rule failed. A check passes on `NULL`, so it never makes a column required.

---

## D3.3 Users and preferences

**What it stands for.** One row per account. Laravel's default columns (`id`, `name`, `email`, `email_verified_at`, `password`, `remember_token`, timestamps: [C2.7](../concepts/C2-backend.md#c27-signing-in-sanctum)) are kept; `password` is nullable, since an account created with Google has none until one is set with Forgot password ([D3.3.1](#d331-social_accounts)). The columns added:

| Column | Type | Default | What it is for |
|---|---|---|---|
| `is_admin` | boolean | false | Opens Filament ([D1.4.15](D1-ui.md#d1415-admin-panel-filament)), where it shows as the role "user / admin". Never fillable from a request |
| `disabled_at` | timestampTz, nullable | | Set by an admin in the panel's Users screen; signing in is refused, and a session already open ends at its next request ([C2.7.9](../concepts/C2-backend.md#c279-a-disabled-account-is-signed-out-at-once)) |
| `locale` | enum `it`, `en`, `es`, `de` | `en` | The interface's language. Preset from the browser when signing up ([D2.4](D2-decisions.md#d24-languages)) |
| `theme` | enum `dark`, `light`, `system` | `dark` | Saved on the account, so it follows the user to another device |
| `weight_unit` | enum `kg`, `lb` | `kg` | Which unit to show and read ([D3.2.3](#d323-weights-are-always-in-kilograms)) |
| `default_rest_seconds` | integer | 90 | Used when a plan item sets no rest |
| `weight_step` | numeric(5,2) | 2.5 | The stepper's step in workout mode, in the user's unit |
| `timer_sound` | boolean | true | Sound when the rest ends, during the countdown before a timed set, and when a hold reaches its target |
| `timer_vibration` | boolean | true | Vibration at the same moments |
| `countdown_seconds` | integer | 5 | Seconds to get ready after ▶ on a timed set, before the stopwatch counts; 0 starts it at once |
| `show_rpe` | boolean | false | Whether the plan editor shows the RPE field beside each set's reps ([D1.4.8](D1-ui.md#d148-plan-editor)) |
| `active_plan_id` | uuid, nullable → `plans`, set to empty | | The one active plan ([D2.8](D2-decisions.md#d28-workout-rules)) |

**Plain columns, not a JSON column of preferences.** Each column has a type and a default enforced by Postgres; a JSON column would accept anything, a misspelt key included.

**`users.active_plan_id` rather than `plans.is_active`.** One column on the user cannot hold two plans, so "one active plan at a time" holds by construction and changing plan is one update. A flag on each plan would need two coordinated updates and could still end with two active plans. What the column cannot check, that the plan is the user's and not archived, is checked by the policy.

### D3.3.1 `social_accounts`

**What it stands for.** An external account a user signs in with: currently Google ([C2.7.8](../concepts/C2-backend.md#c278-signing-in-with-google)). A user has none, or one per provider.

| Column | Type | What it is for |
|---|---|---|
| `id` | bigint | Rows are made on the server only ([D3.2.1](#d321-which-kind-of-id)) |
| `user_id` | bigint → `users`, cascade | Whose account it is |
| `provider` | enum `google` | Which service. Apple, in phase 2, is one more value ([D3.2.4](#d324-fixed-lists-of-values)) |
| `provider_user_id` | string | The provider's id of the person: Google's `sub` |
| `created_at`, `updated_at` | timestamps | When it was linked |

`(provider, provider_user_id)` is unique: one Google account belongs to one user, and the pair is the index of the lookup made at every sign-in.

**A table rather than a `google_id` column on `users`.** Another provider is rows, not a new column.

**The provider's id, not the email.** A Google account's address can change; its `sub` cannot. The email is used once, at the first sign-in, to find an account made with a password ([C2.7.8](../concepts/C2-backend.md#c278-signing-in-with-google)), and only when Google reports it verified. `users.email_verified_at` says whether the address was ever proved, by Google or by a Forgot password link: linking an account where it is empty drops the password, which may be a stranger's.

---

## D3.4 Exercise library

**In the code:** the migrations `…_create_{muscles,equipment,exercises,exercise_muscle}_table.php`, the models `Muscle`, `Equipment`, `Exercise` and `ExerciseMuscle`, the seeders `MuscleSeeder` and `EquipmentSeeder`. The public rows come from free-exercise-db, through the command `exercises:import` and the action `ImportFreeExercise` ([C2.14.3](../concepts/C2-backend.md#c2143-the-free-exercise-db-import), [H1.8](../how-to/H1-database.md#h18-the-exercise-librarys-data)).

### D3.4.1 `muscles` and `equipment`

**What they stand for.** Two short lists used by the library's filters ([D1.4.3](D1-ui.md#d143-exercise-library)) and by volume per muscle group ([D2.8](D2-decisions.md#d28-workout-rules)). Same columns:

| Column | Type | What it is for |
|---|---|---|
| `id` | bigint | |
| `slug` | string, unique | A stable English key: `lower-back`, `e-z-curl-bar`. The import finds rows by it |
| `name` | jsonb, translatable | `{"en": "Chest", "it": "Petto"}` |
| `created_at`, `updated_at` | | |

Their values are free-exercise-db's:

- **17 muscles:** abdominals, abductors, adductors, biceps, calves, chest, forearms, glutes, hamstrings, lats, lower back, middle back, neck, quadriceps, shoulders, traps, triceps. These are also the "muscle groups" of the interface.
- **12 kinds of equipment:** barbell, dumbbell, cable, machine, kettlebells, bands, e-z curl bar, medicine ball, exercise ball, foam roll, body only, other.

The names in Italian, Spanish and German are in the seeders. Equipment reads as a plural where that is how people say it ("Dumbbells", "Manubri"), while the slug keeps free-exercise-db's value (`dumbbell`).

**Tables rather than PHP enums.** Foreign keys keep them consistent, the filters join on them, their names are translated like any other content, and an admin can correct a name without a release.

### D3.4.2 `exercises`

**What it stands for.** One exercise of the library, of either kind ([D2.3](D2-decisions.md#d23-exercise-library)): an empty `owner_id` means public, a filled one personal.

| Column | Type | What it is for |
|---|---|---|
| `id` | bigint | See [D3.2.1](#d321-which-kind-of-id) |
| `owner_id` | bigint, nullable → `users`, refuse | Empty: public. Filled: personal |
| `external_id` | string, nullable, unique | The id in free-exercise-db (`Barbell_Bench_Press`) or in the extra exercises (`AtleoPlan_Frog_Stand`), so the import updates instead of duplicating |
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
| `search_text` | text, default `''` | Every name and alias in every language, normalised, for the search ([D3.4.6](#d346-searching)); written by the model on every save |
| `created_at`, `updated_at`, `deleted_at` | | Soft deletes ([D3.7.2](#d372-deleting-an-exercise-a-soft-delete)) |

**The model** (`app/Models/Exercise.php`):
- `HasTranslations` on `name`, `aliases`, `description`, `instructions`; `InteractsWithMedia`; `SoftDeletes`;
- casts: `logging_type` to `LoggingType`, `machine_translated` to an array; the defaults repeated in `$attributes`, which a new model does not read from the table;
- `owner_id` is not fillable: the owner is set by creating through the relation, `$user->exercises()->create(…)`;
- `muscles()` through the pivot class `ExerciseMuscle` ([D3.4.3](#d343-exercise_muscle)), `equipment()`, `owner()`;
- the media collections `photos` and `videos`, with the accepted file types of [D2.5](D2-decisions.md#d25-photos-and-videos);
- the scopes of the library's list: `visibleTo`, `search` ([D3.4.6](#d346-searching)), `withPrimaryMuscle`, `usingEquipment`, `fromSource`, `orderByName` ([C2.6](../concepts/C2-backend.md#c26-database-migrations-models-factories-seeders)), and `isOwnedBy($user)`.

### D3.4.3 `exercise_muscle`

**What it stands for.** Which muscles an exercise works, and how.

| Column | Type | What it is for |
|---|---|---|
| `exercise_id` | bigint → `exercises`, cascade | |
| `muscle_id` | bigint → `muscles` | |
| `role` | enum `primary`, `secondary` | free-exercise-db allows several primary muscles, so this is a role and not one column on `exercises` |

The primary key is `(exercise_id, muscle_id)`: a muscle appears once per exercise.

**The role as an enum.** The pivot class `ExerciseMuscle extends Pivot` casts `role` to `MuscleRole`; both sides of the relation use it (`->using(ExerciseMuscle::class)->withPivot('role')`), so `$muscle->pivot->role` is `MuscleRole::Primary`, not a string ([H1.4](../how-to/H1-database.md#h14-models)).

### D3.4.4 Photos and videos

They live in spatie/laravel-medialibrary's `media` table, in the collections `photos` and `videos`, not in columns of `exercises`. Its `order_column` holds the order chosen in the editor; the first photo is the cover. Each photo's file is on the `public` disk in `storage/app/public/<media id>/`, and its two WebP copies, `thumb` (400 px) and `large` (1600 px), in `<media id>/conversions/`; the row's `generated_conversions` says which copies exist ([C2.5.9](../concepts/C2-backend.md#c259-the-photos-of-an-exercise)).

- The limits of [D2.5](D2-decisions.md#d25-photos-and-videos) (2 videos, 5 photos, sizes) are checked when uploading, not by the database.
- A soft-deleted exercise **keeps its files**: medialibrary removes them only on `forceDelete()`.

### D3.4.5 Translations

A translatable column holds one value per language:

```json
{"en": "Barbell bench press", "it": "Panca piana con bilanciere"}
```

`$exercise->name` gives the text in the app's current language, with these fallbacks (a public exercise in English and Italian, a personal one written only in Italian):

| Current language | Public exercise | Personal exercise |
|---|---|---|
| `it` | Panca piana con bilanciere | Panca mia |
| `de` | Barbell bench press *(falls back to English)* | Panca mia *(no German or English: falls back to what exists)* |

The right-hand column needs a setting. A personal exercise holds one language only ([D2.4](D2-decisions.md#d24-languages)), and by default spatie/laravel-translatable returns an **empty string** when both the language and the English fallback are missing. `AppServiceProvider` turns on `fallbackAny`:

```php
Translatable::fallback(fallbackLocale: 'en', fallbackAny: true);
```

`aliases` and `instructions` hold a list per language rather than a string.

### D3.4.6 Searching

Search looks in the name and the aliases **in every language**, among public exercises and the user's own ([D1.4.3](D1-ui.md#d143-exercise-library)), ignoring case, accents, dashes and dots. "pull up" finds "Trazioni alla sbarra" through its English name in an Italian interface; "trazioni" works in an English one.

**What it looks in: `search_text`.** Every name and alias of the exercise, each **normalised** by `App\Support\SearchText` (lower case, accents removed, every run of other characters turned into one space), joined by ` | `:

```
Pullups | Trazioni alla sbarra | Klimmzüge | pull-up      (names and aliases)
pullups | trazioni alla sbarra | klimmzuge | pull up      (search_text)
```

The model writes it on its `saving` event ([C2.6](../concepts/C2-backend.md#c26-database-migrations-models-factories-seeders)), so the API, the import, the translation command and the admin panel all keep it current; the migration that added it filled the existing rows ([H1.3.4](../how-to/H1-database.md#h134-filling-a-new-column)).

**How a search matches.** The query is normalised the same way and split into words. Matches start at the beginning of a word of `search_text`, never inside one, and an exercise is found by any of three rules:

| Rule | Example | Finds | Does not find |
|---|---|---|---|
| **A. The words, in any order:** each a whole word, the last only the start of one (it may still be being typed) | `squat jump`, `trazioni al` | "Freehand **Jump Squat**", "**Trazioni al**la sbarra" | "Palms-Up Low-**Pull**ey" for `pull up`: "pull" is not a whole word there |
| **B. Several words typed as one** | `pull up` → `pullup` | "**Pullup**s" | |
| **C. One word written as two in the text,** for words of 5 letters or more | `pullup` | "Band Assisted **Pull-Up**" | "Allungamento **di p**etto" for `dip`: too short |

```sql
-- Exercise::visibleTo($user)->search('pull up'), rules A and B
(concat(' ', search_text, ' ') like '% pull %' and concat(' ', search_text, ' ') like '% up%')
or concat(' ', search_text, ' ') like '% pullup%'
```

- **`concat(' ', search_text, ' ')`** pads both ends, so word boundaries are `'% word %'` and prefixes `'% word%'`, the first and last word included.
- **Rule C** is a Postgres regular expression (`~`): `' p ?u ?l ?l ?u ?p'`, the letters in order with an optional space between them.
- **Only punctuation typed,** such as `%`, matches nothing. The words hold only a-z and 0-9, so nothing typed can act as a `%` or `_` of the pattern.

No index: at around a thousand rows a sequential scan is fine. If search slows down, a `pg_trgm` GIN index covers exactly this kind of `like '%…%'`.

**A column, rather than reading the JSON at every search.** The normalisation is easy in PHP and awkward in SQL, and done once per save it costs nothing per search. The price is keeping it in step: code that bypasses the model (`DB::table()->update()`) must fill it itself.

**Sorting by name** uses `coalesce(name->>'<locale>', name->>'en') collate "und-x-icu"`. Postgres on Alpine compares bytes by default, which puts "Bench" before "banca" and accented letters after "z"; the ICU collation sorts as a reader expects ([H2.12](../how-to/H2-backend.md#h212-when-something-goes-wrong)).

### D3.4.7 What is not in the table

The "tips and common mistakes" of [D1.4.4](D1-ui.md#d144-exercise-details). free-exercise-db has none, so the column would be empty. A `tips` column comes when there is content for it.

---

## D3.5 Plans

**In the code:** the migrations `…_create_{plans,plan_days,plan_items,plan_sets}_table.php` and `…_add_active_plan_id_to_users_table.php`, the models `Plan`, `PlanDay`, `PlanItem` and `PlanSet`, the enum `SetType`. The API that reads and saves them: [C2.5.5](../concepts/C2-backend.md#c255-the-plans-endpoints).

A plan has four levels, each holding different facts:

```
Push Pull Legs                     plans        the name and the goal
└── Day A – Push                   plan_days    the order of the days
    └── Barbell bench press        plan_items   which exercise, its rest, its superset
        ├── W   10 reps at 40 kg   plan_sets    this set's type and targets
        ├── 1   8–10 reps at 80 kg
        └── 2   8–10 reps at 80 kg
```

### D3.5.1 `plans`

**What it stands for.** One workout plan (in Italian, *scheda*), created in the plan editor ([D1.4.8](D1-ui.md#d148-plan-editor)).

| Column | Type | What it is for |
|---|---|---|
| `id` | uuid | Created on the device |
| `user_id` | bigint → `users`, cascade | Its owner |
| `name` | string | "Push Pull Legs" |
| `goal` | string, nullable | |
| `notes` | text, nullable | |
| `version` | integer | Starts at 1, plus 1 on every save ([D3.5.7](#d357-when-a-plan-is-changed-in-two-places)) |
| `archived_at` | timestampTz, nullable | Filled: archived ([D1.4.6](D1-ui.md#d146-plan-list)) |
| `created_at`, `updated_at` | | |

### D3.5.2 `plan_days`

**What it stands for.** One training day of a plan, such as "Day A – Push". Its `position` is the order the suggested day follows ([D2.8](D2-decisions.md#d28-workout-rules)).

| Column | Type | What it is for |
|---|---|---|
| `id` | uuid | |
| `plan_id` | uuid → `plans`, cascade | Indexed with `position` |
| `name` | string | |
| `position` | integer | |
| `created_at`, `updated_at` | | |

### D3.5.3 `plan_items`

**What it stands for.** One exercise in one day. The same exercise appears on many days and in many plans, each time with its own rest and sets.

| Column | Type | What it is for |
|---|---|---|
| `id` | uuid | |
| `plan_day_id` | uuid → `plan_days`, cascade | Indexed with `position` |
| `exercise_id` | bigint → `exercises`, refuse | Public, or owned by the plan's owner; the Form Request checks it |
| `position` | integer | |
| `superset_group` | smallint, nullable | Items of a day with the same number form a superset |
| `rest_seconds` | integer, nullable | Empty: the user's `default_rest_seconds` |
| `notes` | text, nullable | "Shoulder blades back" |
| `for_time` | boolean, default false | Done as fast as possible: the reps of its sets are a fixed amount, the time taken is the result ([D1.4.8](D1-ui.md#d148-plan-editor)). Meaningful only for an exercise counted in reps; the editor sends false otherwise |
| `created_at`, `updated_at` | | |

**Supersets.** Exercises done in turn ([D1.4.8](D1-ui.md#d148-plan-editor)) share a `superset_group`:

| position | exercise | superset_group |
|---|---|---|
| 0 | Barbell bench press | 1 |
| 1 | Barbell row | 1 |
| 2 | Squat | *(empty)* |

The number means only "same or different", and it must join neighbouring items, which the Form Request checks. A `supersets` table would hold nothing but an id.

### D3.5.4 `plan_sets`

**What it stands for.** One planned set, warm-ups included.

| Column | Type | What it is for |
|---|---|---|
| `id` | bigint | Nothing references these rows ([D3.5.6](#d356-saving-a-plan)) |
| `plan_item_id` | uuid → `plan_items`, cascade | Indexed with `position` |
| `position` | integer | |
| `set_type` | enum `normal`, `warm_up`, `drop`, `failure` | Default `normal` ([D2.8](D2-decisions.md#d28-workout-rules)) |
| `target_reps_min`, `target_reps_max` | integer, nullable | "8–10" is 8 and 10; "8" is 8 and 8. Check `plan_sets_reps_range`: min ≤ max |
| `target_weight_kg` | numeric(7,3), nullable | |
| `target_rpe` | numeric(3,1), nullable | Target effort. Check `plan_sets_rpe_range`: between 1 and 10 |
| `target_duration_seconds` | integer, nullable | For `time` exercises |
| `target_distance_meters` | integer, nullable | For `distance` exercises |

No timestamps: the rows are rewritten on every save.

**One row per set, rather than "4 sets" on the plan item.** Each set has its own type and targets: in workout mode the warm-up asks for 40 kg and the next set for 80 kg ([D1.4.9](D1-ui.md#d149-workout-mode)). The "4 × 8–10 · + 2 warm-up" of [D1.4.7](D1-ui.md#d147-plan-details) is counted from the rows.

**Set aside:** a JSON column on `plan_items` holding the list of sets, which would lose the check constraints and the column types.

### D3.5.5 The relations in code

The models are `app/Models/Plan*.php`. What is not obvious from the schema:

- `Plan::days()`, `PlanDay::items()` and `PlanItem::sets()` sort by `position`.
- `PlanItem::exercise()` is `->withTrashed()`: a plan keeps showing an exercise deleted since ([D3.11](#d311-traps-to-avoid)).
- `Plan::items()` is a *has many through* that reaches every item of every day in one query ([H1.4](../how-to/H1-database.md#h14-models)).
- The way back up: `PlanDay::plan()`, `PlanItem::day()`, `PlanSet::item()`, `Plan::user()`; on `User`, `plans()` and `activePlan()`.
- Casts: `set_type` to `SetType`, `target_weight_kg` and `target_rpe` to exact decimals (strings, [D3.11](#d311-traps-to-avoid)), `archived_at` to a date. `PlanSet` has `$timestamps = false`.
- `isOwnedBy($user)`, `isArchived()`, `suggestedDay()` ([D3.6.4](#d364-how-the-screens-use-these-tables)), and the plan list's scopes `archived()` and `activeFirst()`.

A whole plan loads with `Plan::with('days.items.sets')`, one query per level.

### D3.5.6 Saving a plan

The editor sends the whole plan at once, and the action `SavePlan` (`POST` and `PUT /api/plans`, [C2.5.5](../concepts/C2-backend.md#c255-the-plans-endpoints)) applies it in one transaction:

1. **Days and items** are created or updated by their UUID; the ones no longer sent are deleted.
2. **Each item's `plan_sets`** are deleted and written again.
3. **`version`** goes up by 1.

The body is built by the plan editor ([C1.16.5](../concepts/C1-frontend.md#c1165-saving)). Positions are not sent: each row's place in its list is its position.

The two levels differ on purpose. Days and items **keep their UUIDs** across saves, because sessions reference them: a session done last week stays linked to the same `plan_items` row after its reps change. Nothing references `plan_sets`, so rewriting them is simpler than diffing them, which is why their id is a plain `bigint`.

**The editor's draft is kept on the device**, not in the database: in `localStorage` ([C1.16.4](../concepts/C1-frontend.md#c1164-the-draft-kept-in-the-browser)), moving to IndexedDB with the offline work of FEAT-3. "Discard changes" ([D1.4.8](D1-ui.md#d148-plan-editor)) goes back to the last saved version, the row in `plans`. A draft therefore does not follow the user from desktop to phone; a saved plan does.

### D3.5.7 When a plan is changed in two places

The last change wins, with a warning ([D2.7](D2-decisions.md#d27-offline-and-sync)). `version` is how the server knows when to warn:

| Step | Phone (offline) | Laptop | Server's `version` |
|---|---|---|---|
| 1. Both have the plan | version 3 | version 3 | 3 |
| 2. The laptop changes a day and saves | | sends "started from 3" | 4 |
| 3. The phone, offline, changes a rest | waits to send | | 4 |
| 4. The phone is back online and sends | sends "started from 3" | | 5 |

At step 4 the phone started from 3 but the server is at 4. The save goes through, and the answer carries the warning "This plan was changed somewhere else" ([D1.6](D1-ui.md#d16-states-and-edge-cases)).

**A counter, not `updated_at`.** Comparing times would trust two clocks to agree, and a phone's clock can be minutes off.

### D3.5.8 The plan file

A plan saved as a file by **Export** and read back by **Import plan** ([D1.4.7](D1-ui.md#d147-plan-details); why JSON: [D2.9](D2-decisions.md#d29-plan-files)). Not a table: the shape of `GET /api/plans/{id}/export` and of the body of `POST /api/plans/import` ([C2.5.8](../concepts/C2-backend.md#c258-a-plan-as-a-file)).

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
| `exercises[].external_id` | A public exercise's stable id ([D3.4.2](#d342-exercises)), the same on every server; `null` for a personal one |
| `exercises[].name`, `description`, `instructions` | In the language of the export, the app's |
| `exercises[].equipment`, `muscles` | By slug (`body-only`, `chest`), the same on every server; a slug the other server lacks is left out |

**The import finds each exercise used,** in order: a public one with the same `external_id`; one of the importer's own with the same name, in any language, ignoring case and surrounding spaces; a public one with that name in the request's language. Deleted exercises never match. When none is found, it is created as the importer's own from the file, without photos, and named in the answer.

---

## D3.6 Workouts

**In the code:** the migrations `…_create_{workout_sessions,session_exercises,logged_sets}_table.php`, the models `WorkoutSession`, `SessionExercise` and `LoggedSet`, the actions `SaveWorkoutSession`, `FindLastSets` and `HomeSummary`, `Plan::suggestedDay()`. The API that saves and reads them: [C2.5.7](../concepts/C2-backend.md#c257-the-workouts-endpoints).

### D3.6.1 `workout_sessions`

**What it stands for.** One workout, from the moment Start is tapped. Created on the phone, usually sent to the server later.

| Column | Type | What it is for |
|---|---|---|
| `id` | uuid | Created on the device |
| `user_id` | bigint → `users`, cascade | Indexed with `started_at`, for history by date |
| `plan_id` | uuid, nullable → `plans`, set to empty | Empty for a free workout, or once the plan is deleted |
| `plan_day_id` | uuid, nullable → `plan_days`, set to empty, checked at commit | The same. Also finds "the last time this day was done" ([D1.4.10](D1-ui.md#d1410-workout-summary)) |
| `plan_name`, `day_name` | string, nullable | Copies of the names when the session started |
| `started_at` | timestampTz | |
| `finished_at` | timestampTz, nullable | Empty: still in progress, which is what Home's banner looks for ([D1.4.2](D1-ui.md#d142-home)) |
| `duration_seconds` | integer, nullable | Set by the device at the end |
| `feeling` | smallint, nullable | The summary's 1–5. Check `workout_sessions_feeling_range` |
| `notes` | text, nullable | |
| `created_at`, `updated_at`, `deleted_at` | | Soft deletes ([D3.7.3](#d373-deleting-a-session-a-soft-delete)) |

**`plan_name` and `day_name` are copies on purpose.** They record what the plan was called *at the time*: history keeps saying "Push Pull Legs · Day A" after a rename, or after the plan is deleted.

**`duration_seconds`, not `finished_at − started_at`.** A session left open and finished the next morning would last fourteen hours; the device counts the time actually trained.

**One session in progress at a time is not enforced by the database.** Two phones offline could each start one, and refusing the second when it syncs would lose a workout. When more than one is open, Home offers the most recent.

### D3.6.2 `session_exercises`

**What it stands for.** One exercise as done in one session.

| Column | Type | What it is for |
|---|---|---|
| `id` | uuid | |
| `workout_session_id` | uuid → `workout_sessions`, cascade | Indexed with `position` |
| `exercise_id` | bigint → `exercises`, refuse | The exercise actually done, which after a swap is not the plan's |
| `plan_item_id` | uuid, nullable → `plan_items`, set to empty | Empty when added during the workout, or once the item is deleted |
| `position` | integer | |
| `superset_group` | smallint, nullable | Copied from the plan item when the session starts |
| `notes` | text, nullable | |
| `created_at`, `updated_at` | | |

**Set aside: logged sets referencing the exercise directly,** with no table in between. There would be no place for the order of the exercises, a note on one of them, or an exercise that was skipped.

### D3.6.3 `logged_sets`

**What it stands for.** One completed set: the tap on ✓.

| Column | Type | What it is for |
|---|---|---|
| `id` | uuid | |
| `session_exercise_id` | uuid → `session_exercises`, cascade | Indexed with `position` |
| `position` | integer | |
| `set_type` | enum `normal`, `warm_up`, `drop`, `failure` | Warm-ups count neither for volume nor for records ([D2.8](D2-decisions.md#d28-workout-rules)) |
| `weight_kg` | numeric(7,3), nullable | Check `logged_sets_weight_not_negative` |
| `reps` | integer, nullable | Check `logged_sets_reps_not_negative` |
| `duration_seconds` | integer, nullable | For `time` exercises; and the time taken by reps done as fast as possible |
| `distance_meters` | integer, nullable | For `distance` exercises |
| `completed_at` | timestampTz | The moment of the tap |
| `created_at`, `updated_at` | | |

**Which values a set fills** depends on the exercise's `logging_type`:

| `logging_type` | Filled | May be filled | Example |
|---|---|---|---|
| `weight_reps` | `reps` | `weight_kg`; empty for a set with the body alone. `duration_seconds`, done as fast as possible | Bench press, 80 kg × 8; lunges without dumbbells, 12 |
| `reps` | `reps` | `weight_kg`, the **added** weight (a belt with a plate); empty for the body alone. `duration_seconds`, done as fast as possible | Pull-ups, 12; weighted pull-ups, +10 kg × 6; push-ups, 50 in 1:12 |
| `time` | `duration_seconds` | – | Plank, 60 s |
| `distance` | `distance_meters` | – | Rowing, 500 m |

Every other value field stays empty. A set with both `reps` and `duration_seconds` was done as fast as possible (its plan item's `for_time`); the session keeps no flag of its own. On a `reps` exercise `weight_kg` is what was added to the body, never the body's weight, which the app does not know. The rule spans two tables, beyond a check constraint, so the Form Request enforces it.

**The set type is here as well as in `plan_sets`.** It can be changed during a workout ([D1.4.9](D1-ui.md#d149-workout-mode)), and statistics count what was really done.

### D3.6.4 How the screens use these tables

- **A row exists only once a set is ticked.** The sets still to do in workout mode come from the plan. Unticking removes the row.
- **A skipped exercise** is a `session_exercises` row with no sets. "Exercises completed" in the summary counts those with at least one.
- **Swapping an exercise** changes `exercise_id` and keeps `plan_item_id`: the plan's slot is the same, the exercise is different.

**The "Last" column** ([D1.4.9](D1-ui.md#d149-workout-mode)) shows the sets of the user's latest finished, not deleted workout in which the exercise had at least one set, in any plan; each is shown next to the set in the same `position`. **Of each kind:** an exercise counted in reps may be done for reps one day and as fast as possible another, and last time's 3 × 15 is no time to beat. `FindLastSets` therefore keeps the latest of each exercise **and kind**, timed (a set has `duration_seconds`) or not, with `distinct on (exercise_id, timed)`; the app picks the entry of the kind it is doing ([C2.5.7](../concepts/C2-backend.md#c257-the-workouts-endpoints), [C1.17.9](../concepts/C1-frontend.md#c1179-exercises-done-as-fast-as-possible)). It is a query-builder query, so it filters deleted sessions itself ([D3.11](#d311-traps-to-avoid)).

**The suggested day** ([D2.8](D2-decisions.md#d28-workout-rules)), `Plan::suggestedDay()`: the day after the one of the plan's latest finished session, by `position`, wrapping to the first; the first day when nothing was done yet or that day has been deleted; `null` for a plan with no days.

### D3.6.5 Sending a session to the server

The phone sends the whole session, with its exercises and sets, when the network is back, and may send it more than once; the server must end in the same state however many times it receives it ([D2.7](D2-decisions.md#d27-offline-and-sync)). `PUT /api/sessions/{id}`, through `SaveWorkoutSession` ([C2.5.7](../concepts/C2-backend.md#c257-the-workouts-endpoints), [H2.5](../how-to/H2-backend.md#h25-writes-from-a-phone)), in one transaction:

1. **Finds the session by its UUID, soft-deleted ones included.** Another user's: 403. Deleted: nothing is written and the answer is **410 Gone**, which the phone's queue reads as "done, do not retry". Unknown: a new session.
2. **Keeps only the links to the plan that still hold:** the plan if it is still the user's, the day if it is still in that plan, each item if it is still in one of the user's plans; the others become empty. A workout done offline is never refused because the plan changed meanwhile, and it keeps its copied names.
3. **Makes the exercises and the sets exactly the ones sent,** matched by UUID, each list's order as the position. Rows not sent are deleted: an exercise removed, a set unticked.
4. **Converts every moment to UTC** before writing it: Laravel stores dates without the offset, so "18:00+01:00" would otherwise be stored as 18:00 UTC.

| Situation | Answer | Sets on the server |
|---|---|---|
| A session with 2 sets arrives | 201 | 2 |
| The same session arrives again | 200, nothing changes | 2 |
| Another user sends the same UUID | 403 | 2 |
| The user unticked a set, and it arrives | 200 | 1 |
| The session was deleted, and an old send arrives | 410, stays deleted | *unchanged* |

---

## D3.7 What happens on delete

Each foreign key has one of three behaviours, chosen per relation:

| Behaviour | In a migration | Used when |
|---|---|---|
| **Cascade** | `->cascadeOnDelete()` | The child means nothing without its parent: a day without a plan |
| **Set to empty** | `->nullOnDelete()` | The row has value of its own: a session after its plan is gone |
| **Refuse** | `->constrained()` with nothing after it | The referenced row is needed: an exercise used by a plan |

| Foreign key | On delete |
|---|---|
| `plans.user_id`, `workout_sessions.user_id`, `social_accounts.user_id` | cascade |
| `plan_days.plan_id`, `plan_items.plan_day_id`, `plan_sets.plan_item_id` | cascade |
| `session_exercises.workout_session_id`, `logged_sets.session_exercise_id` | cascade |
| `exercise_muscle.exercise_id` | cascade |
| `users.active_plan_id`, `workout_sessions.plan_id`, `workout_sessions.plan_day_id`, `session_exercises.plan_item_id` | set to empty |
| `exercises.owner_id`, `exercises.equipment_id`, `exercise_muscle.muscle_id`, `plan_items.exercise_id`, `session_exercises.exercise_id` | refuse |

### D3.7.1 Deleting a plan

Its days, items and sets go. Its sessions stay:

| Cell | After the delete |
|---|---|
| `workout_sessions.plan_id`, `plan_day_id` | *(empty)* |
| `workout_sessions.plan_name`, `day_name` | unchanged: "Push Pull Legs", "Day A – Push" |
| `session_exercises.plan_item_id` | *(empty)* |
| Logged sets of the session | unchanged |
| `users.active_plan_id`, if it was this plan | *(empty)*, so Home shows its empty state |

**`workout_sessions.plan_day_id` is checked at commit** (`DEFERRABLE INITIALLY DEFERRED`). The delete empties `plan_id` and deletes the days, which empties `plan_day_id`, in an order Postgres takes from the triggers' names, which end in an OID compared as text. With `plan_id` first, its update checks `plan_day_id` again when the session was inserted in the same transaction, as in the tests, and the day is already gone; at commit it is empty, whatever the order.

Progress on each exercise is unaffected: it follows `exercise_id`.

### D3.7.2 Deleting an exercise: a soft delete

Plans and history reference the exercise and must keep working. It gets a `deleted_at`: it leaves the library and the search, but a plan or a past session still shows its name and photos. A hard delete is refused while anything references it.

### D3.7.3 Deleting a session: a soft delete

A device may retry sending a session after the user deleted it elsewhere ([D3.6.5](#d365-sending-a-session-to-the-server)). With the row gone, the retry would create it again; with the row soft-deleted, the server recognises the UUID and leaves it deleted. The row is a tombstone.

### D3.7.4 Deleting an account: an action in the code

Account deletion comes in phase 2 ([D1.4.14](D1-ui.md#d1414-profile-and-settings)). It runs as one transaction, in this order:

1. The user's sessions, soft-deleted ones included, with `forceDelete()`; their exercises and sets cascade.
2. The user's plans; days, items and sets cascade.
3. The user's personal exercises, soft-deleted ones included, each through Eloquent with `forceDelete()`, which removes their files.
4. The user; `social_accounts` cascade.

The order is forced by two constraints:

- **Personal exercises cannot cascade from the user.** Postgres checks the restricting foreign keys as the exercises go, while the user's plans still reference them, and refuses the delete.
- **Photos live on disk,** and only the Eloquent model removes them. A database cascade runs no PHP: it would delete the `media` rows and leave the files behind.

So `exercises.owner_id` has no cascade on purpose: a delete that skips these steps is refused rather than half done.

---

## D3.8 Computed, never stored

These values are always worked out from the rows, so they cannot disagree with them:

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

A stored total would have to be updated by every path that changes a set (editing a past workout, [D1.4.11](D1-ui.md#d1411-history), included), and a missed path leaves two numbers disagreeing. Sums run in the database (`sum(weight_kg * reps)` in `WorkoutSession::withTotals()`), exact and without loading rows into PHP; a set with no weight adds nothing, since `sum` skips `NULL`. If a query becomes slow with years of data, a stored copy can be added then, with the rows remaining the source of truth.

---

## D3.9 Left for later

Each comes with a new migration when its phase arrives ([D1.8](D1-ui.md#d18-release-phases-and-open-questions)); nothing above needs to change for it.

| What | Phase | Probably |
|---|---|---|
| Share link | 2 | `plans.share_token`, unique and nullable: empty means the link is off |
| Duplicating a plan, and its author | 2 | `plans.source_plan_id`. A duplicate must also copy any personal exercises of the author, or deleting that account would be refused ([D3.7](#d37-what-happens-on-delete)) |
| Template plans | Not decided | Open question ([D1.8](D1-ui.md#d18-release-phases-and-open-questions)); probably plans without an owner |
| Onboarding's goal, Apple sign-in | 2 | Columns on `users`; Apple is one more value of `social_accounts.provider` ([D3.3.1](#d331-social_accounts)) |
| Exercises proposed by users | 2 | A status on `exercises` |
| Coach and athlete links, body measurements, multi-week programming | 3 | Tables of their own |

---

## D3.11 Traps to avoid

**A relation to a soft-deleted row gives `null`.** A plain `belongsTo(Exercise::class)` hides soft-deleted exercises, so history would have a session exercise with no exercise and crash on `$row->exercise->name`. The relations from `plan_items` and `session_exercises` use `->withTrashed()` ([D3.5.5](#d355-the-relations-in-code)).

**`SoftDeletes` hides rows only in queries on its own model.** `SessionExercise::where('exercise_id', $id)->count()` still counts the exercises of deleted sessions. Queries about history start from `WorkoutSession`; one that cannot (a join, a `DB::table()` query such as `FindLastSets`) filters `workout_sessions.deleted_at` itself, and has a test for it.

**A `decimal` column is a string in PHP.** With the cast `'weight_kg' => 'decimal:3'` the value is `"80.000"`, to stay exact. Adding them in PHP turns them into floats, so sums run in the database ([D3.8](#d38-computed-never-stored)).

**Database cascades run no PHP.** No model event fires, so medialibrary never hears about it and files stay on disk. Anything with files is deleted through Eloquent ([D3.7.4](#d374-deleting-an-account-an-action-in-the-code)).

**`delete()` on a soft-deleting model keeps the files.** Only `forceDelete()` removes them, which is what a soft delete needs ([D3.4.4](#d344-photos-and-videos)).

**`->index()` goes before `->constrained()`.** `constrained()` returns the foreign key's definition, not the column's, so column modifiers such as `->index()` and `->nullable()` must come first.

**Check constraints are not in the schema builder.** They need `DB::statement()` after creating the table ([D3.2.8](#d328-check-constraints)). Forgetting one raises no error; bad data just gets in.

**Without `fallbackAny`, a personal exercise can have an empty name** ([D3.4.5](#d345-translations)).

**A table named `sessions` already exists** ([D3.2.2](#d322-table-names)).

**An `id` in `#[Fillable]` needs an ownership check.** Accepting the device's id is required for offline sync, and it means the endpoint decides who may touch that row ([D3.6.5](#d365-sending-a-session-to-the-server)).

---

← [D2. Decisions](D2-decisions.md) · [Contents](../README.md) · [C1. Frontend](../concepts/C1-frontend.md) →
