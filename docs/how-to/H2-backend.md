# H2. Backend: how to

Recipes for the Laravel API: endpoints that read and change data, a body shaped as a tree, writes from a phone that may be offline, admin screens, jobs, translated messages, settings, packages, and finding out what is going on. The architecture they fit into is [C2. Backend](../concepts/C2-backend.md); tables are in [H1](H1-database.md).

## Contents

- [H2.1 Before you start](#h21-before-you-start)
- [H2.2 An endpoint that reads](#h22-an-endpoint-that-reads)
- [H2.3 An endpoint that changes data](#h23-an-endpoint-that-changes-data)
- [H2.4 A body shaped as a tree](#h24-a-body-shaped-as-a-tree)
- [H2.5 Writes from a phone](#h25-writes-from-a-phone)
- [H2.6 An admin screen](#h26-an-admin-screen)
- [H2.7 Work in the background](#h27-work-in-the-background)
- [H2.8 Messages in the user's language](#h28-messages-in-the-users-language)
- [H2.9 A setting from the environment](#h29-a-setting-from-the-environment)
- [H2.10 Adding a package](#h210-adding-a-package)
- [H2.11 Finding out what is going on](#h211-finding-out-what-is-going-on)
- [H2.12 When something goes wrong](#h212-when-something-goes-wrong)
- [H2.13 Commands at a glance](#h213-commands-at-a-glance)

---

## H2.1 Before you start

- **Every command runs in the container** through `make` ([S1.8](../start/S1-setup.md#s18-everyday-commands)).
- **The shape of an endpoint** is fixed ([C2.2](../concepts/C2-backend.md#c22-code-conventions)): policy, Form Request, action, API Resource, Pest test. `ExerciseController` is the reference.
- **An endpoint's contract** (path, body, answers) goes in the section of C2 for its area, in the same commit.

---

## H2.2 An endpoint that reads

1. **Resource:** `make artisan c="make:resource MuscleResource"`. Relations through `whenLoaded()`, counts through `whenCounted()`, exact decimals as strings.
2. **Controller:** `make artisan c="make:controller MuscleController"`, or `--api --model=Exercise` for the five resource methods.
3. **Route** in `routes/api.php`, inside the `verified` group, within `auth:sanctum`: only what the "Confirm your email" screen needs stays outside it ([C2.7.10](../concepts/C2-backend.md#c2710-confirming-the-address)).
4. **A list:** the query's rules as scopes on the model; filters through `QueryBuilder` with `allowedFilters()` (anything else is a 400); a Form Request for the values (`per_page`, the filters'); relations eager-loaded for the page ([C2.5.2](../concepts/C2-backend.md#c252-lists-filters-and-pages)).
5. **Look at the JSON** before the frontend does: `make artisan c="route:list --path=api"`, then in tinker `(new MuscleResource($muscle))->response()->getContent()`.
6. **Test:** a visitor gets 401, the list is the user's (`visibleTo`), the language follows `Accept-Language`, the query count does not grow with the rows.

---

## H2.3 An endpoint that changes data

1. **Form Request:** `make artisan c="make:request StoreExerciseRequest"`. **Delete the generated `authorize()`**: it returns `false`, which turns every request into a 403, and runs before the rules. A partial update extends the store request and adds `sometimes` to each field (`UpdateExerciseRequest`).
2. **Policy:** `make artisan c="make:policy ExercisePolicy --model=Exercise"`, a method per action. A list uses a scope with the same rule as `view`. Private rows with counting ids are also bound through that scope (`Route::bind()` in `AppServiceProvider`, as `bindExercises()`), so someone else's is a 404 before the Form Request reads the body.
3. **Action** for the work: `make artisan c="make:class Actions/Exercises/SavePersonalExercise"`, writes in `DB::transaction()`.
4. **Controller method:** `Gate::authorize()`, `$request->validated()`, the action, the Resource (201 on create).
5. **A write that costs disk, a queue or many rows** (an upload, a copy, an import, a whole plan) gets a named limiter as well as `api`: `RateLimiter::for()` in `AppServiceProvider`, `->middleware('throttle:<name>')` on the route (`->middlewareFor(['store', 'update'], …)` on a resource), a test that reaches the 429, and a screen that says to wait rather than "try again" ([C2.5.10](../concepts/C2-backend.md#c2510-rate-limits)).
6. **Columns the request sets** must be in the model's `#[Fillable]`: `update($request->validated())` silently skips the others (a 204 with nothing saved).
7. **New validation keys** get their text in `lang/{en,it,es,de}/validation.php` ([H2.8](#h28-messages-in-the-users-language)).
8. **Tests, every outcome:** success (the only test that catches a stray `authorize()`), 422 per invalid field, 401 for a visitor, 403 for someone else's row (404 when it is bound through a scope) and for a public one, 404. A visitor's request goes first, or in its own test: an earlier `actingAs()` signs in every later request of the test.
9. **Prove the tests can fail:** break the rule they guard, see them fail, put it back.

---

## H2.4 A body shaped as a tree

A plan arrives whole: days, items, sets ([C2.5.6](../concepts/C2-backend.md#c256-validating-nested-data)).

- **Rules for every level** with `.*`, and **`present` on every list**, so a forgotten key cannot read as "delete them all".
- **A `max:` on every list, and `use ChecksListLengthsFirst`** in the request: a list too long is then refused before the validator writes a rule for each of its elements ([C2.5.6](../concepts/C2-backend.md#c256-validating-nested-data)).
- **Field names for messages** with `*` in `attributes` (`'days.*.items.*.sets.*.target_reps_max'`), English included in `lang/en/validation.php`.
- **A check Laravel has no rule for:** `make artisan c="make:rule SupersetsAreNeighbours"`, `$fail('validation.key')->translate()`.
- **A check across tables** (values that fit the exercise's logging type) goes in the request's `after()`.
- **Traps:**
  - **A list item with no validated field vanishes from `validated()`.** Every item needs at least one required field (`set_type`).
  - **Put `uuid` before `unique` and `exists`.** Laravel skips the database rules once an earlier rule failed; in the other order, Postgres answers `22P02` for a non-UUID and the request is a 500.
  - **Ids checked against "this plan" trust the plan id sent.** The body's own `id` must be checked first (someone else's plan id is refused on `id`).
- **The action** saves the whole tree in one transaction: rows matched by UUID, updated, created, or (not sent) deleted; children nobody points to (plan sets) deleted and inserted again.

---

## H2.5 Writes from a phone

Data made on a phone that may be offline, sent late and maybe twice ([C2.5.7](../concepts/C2-backend.md#c257-the-workouts-endpoints)):

1. **The id is a UUID made on the phone,** and the route is a `PUT` to it: `Route::put('/sessions/{session}', …)->whereUuid('session')`, with no route model binding (there may be no row yet).
2. **The action** finds the row by id, deleted ones included: someone else's is a 403, a deleted one a **410 Gone** (the phone stops resending), an unknown one is created (201), a known one replaced (200).
3. **Links to other data are kept only if still valid** (the plan, its day, each item), emptied otherwise: a workout is never refused because a plan changed on another device.
4. **Every moment the phone sends goes through `Carbon::parse($value)->utc()`** before reaching the model. Laravel writes dates as `Y-m-d H:i:s` without the offset, so `18:00+01:00` would be stored as 18:00 UTC, an hour late, with no error.
5. **Tests:** the same body sent twice gives one row; a deleted row answers 410 and writes nothing; someone else's plan id is emptied; a moment with an offset is stored in UTC.

---

## H2.6 An admin screen

1. **Generate:** `make artisan c="make:filament-resource Muscle --generate --record-title-attribute=slug"` (`--soft-deletes` for a soft-deleting model). It writes the resource, its form, its table and three pages under `app/Filament/Resources/<Name>/`; the panel finds it by itself.
2. **Adjust what was generated:** `--generate` skips `jsonb` columns; a translated column needs a field per language (`Group` with `statePath('translations.it')`, [C2.8.2](../concepts/C2-backend.md#c282-the-exercise-library-screen)).
3. **Labels** through methods (`getModelLabel()`, `getNavigationLabel()`) and `__('admin.…')`, with the keys in `lang/<language>/admin.php` for the four languages.
4. **Permissions:** Filament asks the model's policy when it has the method. When the panel's rules differ from the API's, override `getAuthorizationResponse()` on the resource; with no policy at all, Filament allows everything.
5. **Saving through an action:** `handleRecordCreation()` / `handleRecordUpdate()` and `mutateFormDataBeforeFill()` hand the form to the action that holds the rules.
6. **Middleware the panel needs on every interaction** goes in the panel's list with `isPersistent: true`: Livewire's update requests cross only persistent middleware.
7. **Middleware that must run before authentication** (`SignOutDisabledAccount`) goes in the priority list (`prependToPriorityList()` in `bootstrap/app.php`); merely appended, it runs after `auth`. Check the real order in tinker: `app('router')->gatherRouteMiddleware(app('router')->getRoutes()->match(Request::create('/api/user')))`.
8. **Tests** drive the pages as Livewire components, as an admin, and check that a non-admin gets 403:
   ```php
   Livewire::test(ListExercises::class)->searchTable('panca')->assertCanSeeTableRecords([$bench]);
   Livewire::test(CreateExercise::class)->fillForm(['translations.en.name' => 'Hollow Rock'])->call('create')->assertHasNoFormErrors();
   Livewire::test(ListUsers::class)->callAction(TestAction::make('disable')->table($user));
   ```
9. **In the browser:** http://localhost:8500/admin, signed in as an admin (`make artisan c="db:seed"` creates `test@example.com` / `password`), in two languages.

---

## H2.7 Work in the background

1. `make artisan c="make:job ConvertVideo"`, implementing `ShouldQueue`; data in the constructor (a model is stored as its id and reloaded when the job runs).
2. Dispatch: `ConvertVideo::dispatch($media)`.
3. Watch it: `make logs s=queue`; failures after three tries: `make artisan c="queue:failed"`, `c="queue:retry all"`.
4. After changing a job's code: `make restart`.
5. Tests run jobs synchronously; to check a job was sent without running it, `Queue::fake()` and `Queue::assertPushed(ConvertVideo::class)`.

Bulk work that would start Laravel once per job (`queue:listen`) runs inside the command instead: `QUEUE_CONVERSIONS_BY_DEFAULT=false`, as `make exercises-import` does.

---

## H2.8 Messages in the user's language

| File | Holds |
|---|---|
| `lang/{it,es,de}/validation.php` | A message per rule, the field names in `attributes`, our own keys |
| `lang/en/validation.php` | Only our additions: keys of our own rules, English names of fields inside lists |
| `lang/{it,es,de}/auth.php`, `passwords.php` | Sign-in and password reset |
| `lang/{it,es,de}.json` | Sentences keyed by their English text (the confirmation and password emails) |
| `lang/{en,it,es,de}/admin.php` | The admin panel's labels |

A missing message shows in English; `LanguageTest` lists the keys it checks. Try one in tinker: `app()->setLocale('it'); echo __('auth.failed');`.

**A new email with a button** looks like the others through `ActionEmail::make()` ([C2.7.7](../concepts/C2-backend.md#c277-messages-in-the-users-language)): the notification's `toMail()` returns it, with each text through `__()` and its translation in the three `.json` files. To see it, render it in tinker and open the file in a browser: `echo $notification->toMail($user)->render();`; then send it for real and look in Mailpit.

---

## H2.9 A setting from the environment

1. **The value:** a development setting in `compose.yaml` (`x-backend.environment`); a secret in `backend/.env`, its name with a harmless value and a comment in `backend/.env.example`.
2. **A config file reads it** with a default: `'frontend_url' => env('FRONTEND_URL', 'http://localhost:5673')`.
3. **The code reads `config('app.frontend_url')`,** never `env()`.
4. **Check it:** `make artisan c="config:show app.frontend_url"` (one key: the whole file would print `APP_KEY`). After a change: `make up` for `compose.yaml`, `make clear` for `.env`.

---

## H2.10 Adding a package

```sh
make composer c="require vendor/package"          # for the app
make composer c="require --dev vendor/package"    # development and tests only
```

- **Commit `composer.json` and `composer.lock`.** Other clones get the packages with `make composer c=install` (or `make setup`) after pulling; until then Laravel stops with `Class "…" not found`.
- **Install steps** the package's README asks for (`vendor:publish`, `…:install`) are part of the same commit; remove what they publish for features not in use.
- **`backend/vendor/` on the computer is a copy for the editor;** the app reads the `vendor` Docker volume ([C2.4](../concepts/C2-backend.md#c24-the-life-of-a-request)). Composer refreshes the copy after every command (`make vendor` does it by hand). Never edit it.
- **Audit:** `make audit`; review an advisory before ignoring it ([H5](H5-ci.md)).

---

## H2.11 Finding out what is going on

| Tool | For |
|---|---|
| `backend/storage/logs/laravel.log`, `make logs` | A 500, anything written with `Log::` |
| `dump()`, `dd()`, `->dump()` on a test response | A value, an answer in a test; removed before committing |
| `make tinker` | Trying a query or an action |
| `make artisan c="route:list --path=api"` | A 404 that should not be one |
| `make artisan c="config:show mail.mailers.smtp"`, `make clear` | A setting that seems ignored |
| `DB::enableQueryLog()` … `count(DB::getQueryLog())` | How many queries some code runs |
| `->toRawSql()` | The SQL of a query or a chain of scopes |
| Mailpit, http://localhost:8525 | An email the app sent |

**A slow local backend.** Time an empty request after a pause and right after another (`curl -o /dev/null -s -w '%{time_total}\n' http://localhost:8500/api/health`): over a second after a pause means the packages are read through the shared folder instead of the volume; `make setup` restores the volume ([D2.10](../design/D2-decisions.md#d210-local-development)).

---

## H2.12 When something goes wrong

| Message or symptom | Cause | Fix |
|---|---|---|
| `Class "Laravel\…" not found` after a `git pull` | A package added elsewhere is not installed | `make composer c=install` |
| 403 for everyone, admins included | The generated `authorize()` returns `false` | Delete it |
| 403 for an admin, or 200 for anyone | The policy method is missing or wrong, or `Gate::authorize()` was forgotten | A test for each case |
| A visitor's test gets 200 or 422 instead of 401 | An earlier `actingAs()` in the same test | The visitor's request first, or its own test |
| 204, yet nothing saved | The column is not in `#[Fillable]`, or not in the request's rules | Add it to both |
| 404 on a route that exists | A typo, the wrong group, or the id does not exist | `route:list --path=api` |
| 405 | The URL exists with another method | Check the route's method |
| 419 | CSRF cookie or header missing ([C2.7.1](../concepts/C2-backend.md#c271-how-a-session-works)) | Automatic from the React app; not checked in tests |
| 422 in English | The rule's message is missing from `lang/xx/validation.php` | Add it |
| 500 `22P02` on a body with bad ids | `unique`/`exists` before `uuid` | Put `uuid` first ([H2.4](#h24-a-body-shaped-as-a-tree)) |
| `Undefined array key "sets"` in an action | List items with no validated field vanish from `validated()` | A required field on every item |
| A moment stored an hour off | A date with an offset reached the model | `Carbon::parse($value)->utc()` first ([H2.5](#h25-writes-from-a-phone)) |
| 400 ``Requested filter(s) `x` are not allowed`` | The filter is not in `allowedFilters()` | Add it, if meant to exist |
| A relation missing from the JSON | `whenLoaded()` without `with()` / `load()` | Load it |
| A translated column saved as `{"en": null}` | `null` assigned to a translatable column | `forgetTranslations($field, asNull: true)` |
| A personal exercise keeps its old language | `setTranslations()` adds, it does not replace | `replaceTranslations()` |
| Names sorted capitals first, accents last | Postgres on Alpine compares bytes | `collate "und-x-icu"` on the sorted text |
| `jsonb` arrays compared in a test fail on key order | Postgres stores `jsonb` keys in its own order | `toEqual()` or `toEqualCanonicalizing()` |
| The admin panel switches to English after a filter | The locale middleware is not persistent | `isPersistent: true` ([H2.6](#h26-an-admin-screen)) |
| A disabled user's request is answered as theirs | The middleware runs after authentication | The priority list ([H2.6](#h26-an-admin-screen)) |
| Every request fails: `Failed opening required '/app/vendor/autoload.php'` | The `vendor` volume is empty | `make setup` |
| Every API call takes 1–2 s after a pause | The stack runs without the `vendor` volume | `make setup` ([H2.11](#h211-finding-out-what-is-going-on)) |
| The editor does not know a new package's classes | The copy for the editor was not refreshed | `make vendor` |
| A job never runs | The `queue` container is down or stuck | `make ps`, `make restart`, `make logs s=queue` |
| `make test f="two words"`: test file not found | `f=` takes one word | `make test f=OneWord` |

Database errors: [H1.9](H1-database.md#h19-when-something-goes-wrong). Setup problems: [S1.10](../start/S1-setup.md#s110-troubleshooting).

---

## H2.13 Commands at a glance

| What | Command |
|---|---|
| Controller, resource | `make artisan c="make:controller X"` (`--api --model=X`), `c="make:resource XResource"` |
| Form Request, policy, rule | `make artisan c="make:request X"`, `c="make:policy XPolicy --model=X"`, `c="make:rule X"` |
| Action or plain class | `make artisan c="make:class Actions/Area/DoSomething"` |
| Middleware, job, command | `make artisan c="make:middleware X"`, `c="make:job X"`, `c="make:command X"` |
| Admin screen | `make artisan c="make:filament-resource X --generate"` |
| Test | `make artisan c="make:test XTest --pest"` |
| Routes | `make routes`, `make artisan c="route:list --path=api"` |
| Tests | `make test`, `make test f=Name`, `make artisan c="test tests/Feature/Plans"` |
| Console, logs | `make tinker`, `make logs`, `make logs s=queue` |
| A setting, the caches | `make artisan c="config:show app.frontend_url"`, `make clear` |
| Packages | `make composer c="require x/y"`, `make composer c=install`, `make audit` |
| Format, then every check | `make fix`, `make check` |

---

← [H1. Database: how to](H1-database.md) · [Contents](../README.md) · [H3. Frontend: how to](H3-frontend.md) →
