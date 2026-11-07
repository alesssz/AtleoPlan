# H2. Backend: how to

[C2. Backend](../concepts/C2-backend.md) explains how the Laravel app works. This page says **how to do things in it**: which commands to type, which files they create, what to write in each, and how to check the result. It is written for someone who has never written a Laravel endpoint.

**The commands here have been run.** The example was built for real on this project, then removed; the outputs shown are what the commands printed. It is a small version of what [BE-1](../project/backlog.md#be-1-exercise-library-api-and-admin) will build: the list of muscles, with an endpoint to read it, one to rename a muscle, an admin screen and a background job. It starts from the `muscles` table, model, factory and seeder of [H1.2](H1-database.md#h12-a-new-table-from-start-to-finish). Those now exist for real ([H1.10](H1-database.md#h110-the-exercise-library-as-built)), and so does `GET /api/muscles` of H2.2, built by BE-1 with sorting by name added ([H2.12](#h212-the-exercise-library-api-as-built)). Renaming a muscle, the admin screen and the job on this page are still the example, removed after the run.

**How to read this page:**

- The first time: [H2.1](#h21-before-you-start), then [H2.2](#h22-an-endpoint-that-reads-from-start-to-finish) and [H2.3](#h23-an-endpoint-that-changes-data) in order. Together they make a complete endpoint.
- Later, when you need one thing: admin screens [H2.4](#h24-an-admin-screen), jobs [H2.5](#h25-work-in-the-background), translated messages [H2.6](#h26-messages-in-the-users-language), settings [H2.7](#h27-a-setting-from-the-environment), packages [H2.8](#h28-adding-a-package).
- Something broke: [H2.9](#h29-finding-out-what-is-going-on) and [H2.10](#h210-when-something-goes-wrong).
- A real, complete API, with a list, filters, pages, a policy and an action: [H2.12](#h212-the-exercise-library-api-as-built).
- A body shaped as a tree, saved in one request, with a validation rule of our own: [H2.13](#h213-the-plans-api-as-built).
- The same feature on the React side: [H3. Frontend: how to](H3-frontend.md).

## Contents

- [H2.1 Before you start](#h21-before-you-start)
- [H2.2 An endpoint that reads, from start to finish](#h22-an-endpoint-that-reads-from-start-to-finish)
  - [H2.2.1 Generate the files](#h221-generate-the-files)
  - [H2.2.2 The shape of the JSON: the API Resource](#h222-the-shape-of-the-json-the-api-resource)
  - [H2.2.3 The controller](#h223-the-controller)
  - [H2.2.4 The route](#h224-the-route)
  - [H2.2.5 Look at the JSON](#h225-look-at-the-json)
  - [H2.2.6 The test](#h226-the-test)
- [H2.3 An endpoint that changes data](#h23-an-endpoint-that-changes-data)
  - [H2.3.1 Generate the files](#h231-generate-the-files)
  - [H2.3.2 The rules: the Form Request](#h232-the-rules-the-form-request)
  - [H2.3.3 Who may do it: the Policy](#h233-who-may-do-it-the-policy)
  - [H2.3.4 The controller method and the route](#h234-the-controller-method-and-the-route)
  - [H2.3.5 The tests: success and every refusal](#h235-the-tests-success-and-every-refusal)
  - [H2.3.6 The trap of the generated `authorize()`](#h236-the-trap-of-the-generated-authorize)
- [H2.4 An admin screen](#h24-an-admin-screen)
  - [H2.4.1 Generate it](#h241-generate-it)
  - [H2.4.2 Adjust what was generated](#h242-adjust-what-was-generated)
  - [H2.4.3 Open it and test it](#h243-open-it-and-test-it)
- [H2.5 Work in the background](#h25-work-in-the-background)
- [H2.6 Messages in the user's language](#h26-messages-in-the-users-language)
- [H2.7 A setting from the environment](#h27-a-setting-from-the-environment)
- [H2.8 Adding a package](#h28-adding-a-package)
- [H2.9 Finding out what is going on](#h29-finding-out-what-is-going-on)
- [H2.10 When something goes wrong](#h210-when-something-goes-wrong)
- [H2.11 Commands at a glance](#h211-commands-at-a-glance)
- [H2.12 The exercise library API, as built](#h212-the-exercise-library-api-as-built)
  - [H2.12.1 Generate the files](#h2121-generate-the-files)
  - [H2.12.2 The routes](#h2122-the-routes)
  - [H2.12.3 Scopes: the SQL they write](#h2123-scopes-the-sql-they-write)
  - [H2.12.4 Sorting by name: the collation trap](#h2124-sorting-by-name-the-collation-trap)
  - [H2.12.5 One language per exercise: the translations trap](#h2125-one-language-per-exercise-the-translations-trap)
  - [H2.12.6 Look at the JSON](#h2126-look-at-the-json)
  - [H2.12.7 The tests, and proving they can fail](#h2127-the-tests-and-proving-they-can-fail)
- [H2.13 The plans API, as built](#h213-the-plans-api-as-built)
  - [H2.13.1 Generate the files](#h2131-generate-the-files)
  - [H2.13.2 The routes](#h2132-the-routes)
  - [H2.13.3 The rules of a tree](#h2133-the-rules-of-a-tree)
  - [H2.13.4 A rule of your own](#h2134-a-rule-of-your-own)
  - [H2.13.5 The traps of nested validation](#h2135-the-traps-of-nested-validation)
  - [H2.13.6 Saving a tree: the action](#h2136-saving-a-tree-the-action)
  - [H2.13.7 Look at the JSON](#h2137-look-at-the-json)
  - [H2.13.8 The tests, and proving they can fail](#h2138-the-tests-and-proving-they-can-fail)

---

## H2.1 Before you start

**Commands run in the container,** through `make` ([H1.1](H1-database.md#h11-before-you-start)): `make artisan c="…"` for any Artisan command, `make test`, `make tinker`, `make logs`.

**Where each piece goes.** An endpoint is made of several small files, each with one job ([C2.4](../concepts/C2-backend.md#c24-the-life-of-a-request)):

| Piece | Folder | Its job | Created with |
|---|---|---|---|
| Route | `routes/api.php` | Ties a method and a URL to the code that answers | written by hand |
| Controller | `app/Http/Controllers/` | Receives the request, calls the work, returns the answer | `make:controller` |
| Form Request | `app/Http/Requests/` | The rules the data sent must follow | `make:request` |
| Policy | `app/Policies/` | Who may do what to a row | `make:policy` |
| API Resource | `app/Http/Resources/` | The shape of the JSON sent back | `make:resource` |
| Test | `tests/Feature/` | Proves it works, and that it refuses what it must refuse | `make:test --pest` |

**How to try an endpoint.** The main way is **a Pest test**. It can sign in as any user (`actingAs`), send any data, and it runs on the test database, so nothing real is touched. The other ways:

- **A public `GET`** such as http://localhost:8500/api/health opens in the browser's address bar.
- **An endpoint that needs signing in** is easiest to try from the React app: open the browser's developer tools, *Network* tab, and watch the requests the page makes ([H3.8](H3-frontend.md#h38-checking-in-the-browser)).
- **What a piece of code returns** can be tried in `make tinker`.

---

## H2.2 An endpoint that reads, from start to finish

The goal: `GET /api/muscles` returns the list of muscles, with their names in the user's language, to anyone signed in.

### H2.2.1 Generate the files

```sh
make artisan c="make:controller MuscleController"
make artisan c="make:resource MuscleResource"
```

```
INFO  Controller [app/Http/Controllers/MuscleController.php] created successfully.
INFO  Resource [app/Http/Resources/MuscleResource.php] created successfully.
```

**Naming:** the model's name plus `Controller` or `Resource`. One controller per model, with one method per action: `index` (the list), `show` (one), `store` (create), `update`, `destroy` (delete).

### H2.2.2 The shape of the JSON: the API Resource

The generated `toArray()` returns `parent::toArray($request)`, which means every column. Write the list explicitly instead: a column added to the table later then never reaches the app by accident, which matters for columns such as `password` or `is_admin`.

```php
namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\Muscle */   // tells the editor that $this->… are the model's columns
class MuscleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            // HasTranslations gives the name in the current language. That
            // language comes from the request's Accept-Language header
            // (SetLocaleFromRequest, C2.7.7)
            'name' => $this->name,
        ];
    }
}
```

### H2.2.3 The controller

```php
namespace App\Http\Controllers;

use App\Http\Resources\MuscleResource;
use App\Models\Muscle;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class MuscleController extends Controller
{
    /** GET /api/muscles: every muscle, ordered by slug. */
    public function index(): AnonymousResourceCollection
    {
        // ::collection() applies MuscleResource to each row of the list
        return MuscleResource::collection(Muscle::orderBy('slug')->get());
    }
}
```

**The controller stays thin:** it reads, calls and answers. Rules that are more than one line go in an action or a service, which can be tested without HTTP ([C2.5](../concepts/C2-backend.md#c25-routes-and-controllers)).

### H2.2.4 The route

In `routes/api.php`, inside the group that requires signing in:

```php
use App\Http\Controllers\MuscleController;

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [CurrentUserController::class, 'show']);
    // …
    Route::get('/muscles', [MuscleController::class, 'index']);
});
```

**Checking it is there:**

```sh
make artisan c="route:list --path=api"
```

```
GET|HEAD   api/health ........................... health › routes/api.php:38
GET|HEAD   api/muscles .............................. MuscleController@index
GET|HEAD   api/user ............................. CurrentUserController@show
PATCH      api/user/preferences .... CurrentUserController@updatePreferences
```

`make routes` lists every route of the app, the Filament and Fortify ones included.

### H2.2.5 Look at the JSON

Tinker can build the answer without HTTP:

```sh
make tinker
```

```php
> app()->setLocale('it');
> echo MuscleResource::collection(Muscle::orderBy('slug')->get())->response()->getContent();
{"data":[{"id":2,"slug":"biceps","name":"Bicipiti"},{"id":1,"slug":"chest","name":"Petto"},{"id":3,"slug":"lower-back","name":"Zona lombare"}]}
```

- **The list is inside `data`.** Resources always wrap their output this way, and the frontend reads `body.data` ([H3.3](H3-frontend.md#h33-reading-data-from-the-api)).
- **In tinker, write the full class name if it is not a model:** `App\Http\Resources\MuscleResource`. Tinker finds models by their short name, through Composer's class map; a model added after the last `composer install` is missing from it, and `Class "Exercise" not found` follows. Then `use App\Models\Exercise;` first, or `make composer c="dump-autoload"` once ([H1.12.6](H1-database.md#h1126-when-something-goes-wrong)).

### H2.2.6 The test

```sh
make artisan c="make:test MuscleApiTest --pest"
```

```php
use App\Models\Muscle;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);   // a clean test database (H1.8)

it('answers 401 to a visitor', function () {
    // getJson(): a GET that asks for JSON, as the React app does
    $this->getJson('/api/muscles')->assertUnauthorized();
});

it('lists the muscles in the language of the request', function () {
    Muscle::factory()->create(['slug' => 'chest', 'name' => ['en' => 'Chest', 'it' => 'Petto']]);

    // actingAs(): the request is made as this user, already signed in
    $this->actingAs(User::factory()->create())
        ->getJson('/api/muscles', ['Accept-Language' => 'it'])
        ->assertOk()                                // status 200
        ->assertJsonCount(1, 'data')                // one item in "data"
        ->assertJsonPath('data.0.name', 'Petto');   // the first item's name
});
```

```sh
make test f=MuscleApi
```

`f=` takes **one word**, which is matched against the test file and test names. With spaces, `make` splits it: `make test f="lets an admin"` answers `Test file "an" not found`.

---

## H2.3 An endpoint that changes data

The goal: `PATCH /api/muscles/{id}` renames a muscle. Only admins may do it; the name is required and at most 50 characters.

### H2.3.1 Generate the files

```sh
make artisan c="make:request UpdateMuscleRequest"
make artisan c="make:policy MusclePolicy --model=Muscle"
```

```
INFO  Request [app/Http/Requests/UpdateMuscleRequest.php] created successfully.
INFO  Policy [app/Policies/MusclePolicy.php] created successfully.
```

Look at what was generated before writing:

- **The request has an `authorize()` method that returns `false`,** which refuses every request, admins included. Delete the method: permissions are the policy's job. The trap is shown in [H2.3.6](#h236-the-trap-of-the-generated-authorize).
- **The policy has seven methods** (`viewAny`, `view`, `create`, `update`, `delete`, `restore`, `forceDelete`), all returning `false`. Keep only those you use.

### H2.3.2 The rules: the Form Request

```php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateMuscleRequest extends FormRequest
{
    /** The rules; data that breaks one gets a 422 with a message per field. */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:50'],
        ];
    }
}
```

The rules are checked **before** the controller runs. A field not listed here never reaches `$request->validated()`, so a request cannot slip in `slug` or `is_admin`. The full list of rules: the *Validation* page of the Laravel docs, under "Available Validation Rules".

### H2.3.3 Who may do it: the Policy

```php
namespace App\Policies;

use App\Models\Muscle;
use App\Models\User;

class MusclePolicy
{
    /** Renaming a muscle is for admins. Laravel passes the signed-in user. */
    public function update(User $user, Muscle $muscle): bool
    {
        return $user->is_admin;
    }
}
```

Laravel finds the policy by its name: `MusclePolicy` for `Muscle`. For a user's own data, the check compares owners instead, for example `return $plan->user_id === $user->id;`.

### H2.3.4 The controller method and the route

```php
use App\Http\Requests\UpdateMuscleRequest;
use Illuminate\Support\Facades\Gate;

/** PATCH /api/muscles/{muscle}: rename it (admins only). */
public function update(UpdateMuscleRequest $request, Muscle $muscle): MuscleResource
{
    // Asks MusclePolicy::update(); a false answer stops here with a 403
    Gate::authorize('update', $muscle);

    // Only the fields that passed the rules
    $muscle->update($request->validated());

    return new MuscleResource($muscle);
}
```

```php
Route::patch('/muscles/{muscle}', [MuscleController::class, 'update']);
```

**`{muscle}` becomes a `Muscle`.** This is *route model binding*: the parameter `Muscle $muscle` has the same name as `{muscle}` in the route, so Laravel loads the row with that id. If there is none, it answers 404 by itself, before the method runs.

**The order of the checks:**
1. signed in, or 401;
2. the row exists, or 404;
3. the Form Request's rules, or 422;
4. the policy, or 403;
5. the work.

### H2.3.5 The tests: success and every refusal

Each refusal gets its own test, because a security hole is a refusal that does not happen ([P1.2](../project/P1-conventions.md#p12-code)):

```php
it('lets an admin rename a muscle', function () {
    $muscle = Muscle::factory()->create(['name' => ['en' => 'Chest']]);

    $this->actingAs(User::factory()->admin()->create())
        ->patchJson("/api/muscles/{$muscle->id}", ['name' => 'Pecs'])
        ->assertOk()
        ->assertJsonPath('data.name', 'Pecs');
});

it('refuses a user who is not an admin', function () {
    $muscle = Muscle::factory()->create();

    $this->actingAs(User::factory()->create())
        ->patchJson("/api/muscles/{$muscle->id}", ['name' => 'Pecs'])
        ->assertForbidden();                          // 403
});

it('refuses an empty name', function () {
    $muscle = Muscle::factory()->create();

    $this->actingAs(User::factory()->admin()->create())
        ->patchJson("/api/muscles/{$muscle->id}", ['name' => ''])
        ->assertUnprocessable()                       // 422
        ->assertJsonValidationErrors(['name']);       // with a message for "name"
});

it('answers 404 for a muscle that does not exist', function () {
    $this->actingAs(User::factory()->admin()->create())
        ->patchJson('/api/muscles/999', ['name' => 'Pecs'])
        ->assertNotFound();
});
```

```sh
make test f=MuscleApi
```

```
PASS  Tests\Feature\MuscleApiTest
✓ it answers 401 to a visitor                                          1.20s
✓ it lists the muscles in the language of the request                  0.24s
✓ it lets an admin rename a muscle                                     0.11s
✓ it refuses a user who is not an admin                                0.07s
✓ it refuses an empty name                                             0.07s
✓ it answers 404 for a muscle that does not exist                      0.09s
Tests:    6 passed (11 assertions)
```

**What each status means**, and the assertion that checks it:

| Status | Meaning | Assertion |
|---|---|---|
| 200 | Done, here is the answer | `assertOk()` |
| 201 | Created | `assertCreated()` |
| 204 | Done, nothing to send back | `assertNoContent()` |
| 401 | Not signed in | `assertUnauthorized()` |
| 403 | Signed in, but not allowed | `assertForbidden()` |
| 404 | No such row or route | `assertNotFound()` |
| 419 | The CSRF token has expired ([C2.7.1](../concepts/C2-backend.md#c271-how-a-session-works)) | `assertStatus(419)` |
| 422 | The data broke a rule | `assertUnprocessable()`, `assertJsonValidationErrors([...])` |
| 429 | Too many attempts ([C2.7.4](../concepts/C2-backend.md#c274-slowing-down-password-guessing)) | `assertTooManyRequests()` |

### H2.3.6 The trap of the generated `authorize()`

Here is what happens when the `authorize()` method generated by `make:request` is left in place:

```
FAIL  Tests\Feature\MuscleApiTest
✓ it answers 401 to a visitor
✓ it lists the muscles in the language of the request
⨯ it lets an admin rename a muscle
✓ it refuses a user who is not an admin
⨯ it refuses an empty name
✓ it answers 404 for a muscle that does not exist

FAILED  Tests\Feature\MuscleApiTest > it lets an admin rename a muscle
Expected response status code [200] but received 403.
  at tests/Feature/MuscleApiTest.php:28
  ➜  28▕         ->assertOk()
```

The admin gets a 403, and so does the empty name, because `authorize()` runs before the rules. The "not an admin" test still passes, which is why only a test of the **success** case reveals the trap.

---

## H2.4 An admin screen

Filament builds the admin screens from PHP classes ([C2.8](../concepts/C2-backend.md#c28-admin-panel-filament)).

### H2.4.1 Generate it

```sh
make artisan c="make:filament-resource Muscle --generate --record-title-attribute=slug"
```

```
INFO  Filament resource [App\Filament\Resources\Muscles\MuscleResource] created successfully.
```

- **`--generate`** reads the table's columns and writes the form fields and table columns for them.
- **`--record-title-attribute=slug`** is the column used to name a row, in titles and in the global search.
- **Without options, the command asks questions** in the terminal. `make artisan c="help make:filament-resource"` lists all the options: `--simple` (one page with pop-up forms), `--soft-deletes`, `--view` (a read-only page)…

It creates six files in `app/Filament/Resources/Muscles/`:

| File | What it holds |
|---|---|
| `MuscleResource.php` | The screen itself: its model, menu icon, pages |
| `Schemas/MuscleForm.php` | The fields of the create and edit form |
| `Tables/MusclesTable.php` | The columns, filters and actions of the list |
| `Pages/ListMuscles.php`, `CreateMuscle.php`, `EditMuscle.php` | The three pages, at `/admin/muscles`, `/create`, `/{record}/edit` |

The panel finds the resource by itself: nothing to register.

### H2.4.2 Adjust what was generated

`--generate` is a starting point, not the end:

```php
// Tables/MusclesTable.php: the jsonb column "name" had been left out; added by hand
->columns([
    TextColumn::make('slug')->searchable(),
    TextColumn::make('name'),           // the name, in the panel's language
    TextColumn::make('created_at')->dateTime()->sortable()->toggleable(isToggledHiddenByDefault: true),
])
```

```php
// Schemas/MuscleForm.php: one field per column
TextInput::make('slug')->required(),
TextInput::make('name')->required(),
```

A single `name` field edits only one language. Editing every language of a translated column, which BE-1 needs for the exercises, takes one field per language ([D3.4.5](../design/D3-data-model.md#d345-translations)).

### H2.4.3 Open it and test it

**In the browser:** sign in at http://localhost:8500/admin with an admin account. `make artisan c="db:seed"` creates `test@example.com` / `password` ([C2.8](../concepts/C2-backend.md#c28-admin-panel-filament)). *Muscles* appears in the menu.

**A test**, which loads the page as an admin and as a normal user:

```php
it('shows the muscles to an admin', function () {
    Muscle::factory()->create(['slug' => 'chest', 'name' => ['en' => 'Chest']]);

    $this->actingAs(User::factory()->admin()->create())
        ->get('/admin/muscles')          // get(), not getJson(): a web page
        ->assertOk()
        ->assertSee('chest')             // the text is somewhere in the page
        ->assertSee('Chest');
});

it('keeps the screen closed to a user who is not an admin', function () {
    $this->actingAs(User::factory()->create())
        ->get('/admin/muscles')
        ->assertForbidden();
});
```

```
PASS  Tests\Feature\MuscleAdminTest
✓ it shows the muscles to an admin                                     4.07s
✓ it keeps the screen closed to a user who is not an admin             0.10s
```

---

## H2.5 Work in the background

How queues work: [C2.9](../concepts/C2-backend.md#c29-queues-and-jobs). The example is a job that writes the number of muscles in the log.

```sh
make artisan c="make:job LogMuscleCount"
```

```
INFO  Job [app/Jobs/LogMuscleCount.php] created successfully.
```

```php
namespace App\Jobs;

use App\Models\Muscle;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

// ShouldQueue: dispatch() puts it on the queue instead of running it now
class LogMuscleCount implements ShouldQueue
{
    use Queueable;

    /** The work, run by the worker. */
    public function handle(): void
    {
        Log::info('Muscles in the database: '.Muscle::count());
    }
}
```

**Send it.** In the code, `LogMuscleCount::dispatch();`; to try it, from tinker:

```php
> App\Jobs\LogMuscleCount::dispatch();
```

**Watch it run:**

```sh
make logs s=queue
```

```
2026-11-06 07:51:21 App\Jobs\LogMuscleCount ........................ RUNNING
2026-11-06 07:51:21 App\Jobs\LogMuscleCount .................. 176.04ms DONE
```

And the line it wrote, at the end of `backend/storage/logs/laravel.log`:

```
[2026-11-06 07:51:21] local.INFO: Muscles in the database: 3
```

- **The times are in UTC,** the app's time zone.
- **Data for the job goes in the constructor:** `public function __construct(public Media $media) {}`, then `ConvertVideo::dispatch($media)`. A model is stored as its id and loaded again when the job runs.
- **A job that fails** is retried 3 times, then listed by `make artisan c="queue:failed"`. `make artisan c="queue:retry all"` runs them again.
- **After changing a job's code,** `make restart`.
- **In tests, jobs run at once** (`QUEUE_CONNECTION=sync`). To check that a job was sent without running it, use `Queue::fake();` then `Queue::assertPushed(LogMuscleCount::class);`.

---

## H2.6 Messages in the user's language

Laravel's own messages, such as validation and sign-in errors, are translated in `backend/lang/` ([C2.7.7](../concepts/C2-backend.md#c277-messages-in-the-users-language)):

| File | Holds |
|---|---|
| `lang/it/validation.php` | One message per validation rule, plus the field names in `attributes` |
| `lang/it/auth.php`, `lang/it/passwords.php` | Sign-in and password reset messages |
| `lang/it.json` | Any other sentence, keyed by its English text |

The same for `de` and `es`. English is Laravel's built-in text.

**Trying them**, in tinker:

```php
> app()->setLocale('it');
> echo Validator::make(['name' => ''], ['name' => 'required'])->errors()->first();
Il campo nome è obbligatorio.
> echo Validator::make(['name' => str_repeat('x', 60)], ['name' => 'max:50'])->errors()->first();
Il campo nome non può superare 50 caratteri.
> echo __('auth.failed');
Queste credenziali non corrispondono ai nostri dati.
```

- **A new rule** used in a Form Request needs its message in the three files `lang/{it,es,de}/validation.php`. A missing one shows in English.
- **A new field name** goes in `attributes`, so the message says "nome" and not "name". A field inside a list is written with `*`, `'muscles.*.role'`, and needs an English name too, in `lang/en/validation.php`: otherwise English reads "The muscles.0.role field is required".
- **A sentence of our own**, such as `__('Muscle renamed.')`, goes in `lang/it.json`, `lang/es.json` and `lang/de.json`: `"Muscle renamed.": "Muscolo rinominato."`.

---

## H2.7 A setting from the environment

A value that changes from one computer or server to another, such as an address, a key or a limit, is never written in the code. It travels through three places. The real example is `FRONTEND_URL`, the address of the React app, used in the links in emails:

1. **The value.** For development, it goes in `compose.yaml`, under `environment:`: `FRONTEND_URL: http://localhost:5673`. A secret goes in `backend/.env` instead, and its name, with no value, in `backend/.env.example` ([C2.10](../concepts/C2-backend.md#c210-configuration-and-env)).
2. **A config file reads it**, with a default: in `config/app.php`, `'frontend_url' => env('FRONTEND_URL', 'http://localhost:5673'),`.
3. **The code reads the config,** never `env()`: `config('app.frontend_url')`. Production caches the config, and once it is cached, `env()` outside the `config/` files returns `null`.

**Checking the value in use:**

```sh
make artisan c="config:show app.frontend_url"
```

```
app.frontend_url ..................................... http://localhost:5673
```

Ask for one key: `config:show app` alone prints the whole file, `APP_KEY` included.

**After changing a value:** `make up` recreates the containers with the new `compose.yaml`; for `.env`, `make clear` empties the cached config.

---

## H2.8 Adding a package

```sh
make composer c="require vendor/package"          # for the app
make composer c="require --dev vendor/package"    # only for development and tests
```

**What changes**, here when Fortify was added:

```diff
     "require": {
         "php": "^8.3",
         "filament/filament": "^5.11",
+        "laravel/fortify": "^1.41",
         "laravel/framework": "^13.17",
```

- **`composer.json`** lists the packages wanted and the versions accepted: `^1.41` means any 1.x from 1.41 up.
- **`composer.lock`** records the exact version installed of every package, and of the packages they need. Both files are committed.
- **`backend/vendor/`** holds the packages' code. It is not in Git.

**Other computers** therefore get the new entry in `composer.json` with `git pull`, but not the code. Until they run `make composer c=install`, Laravel stops with:

```
In fortify.php line 53:
  Class "Laravel\Fortify\Features" not found
```

The same goes for `npm install` on the frontend ([H3.7](H3-frontend.md#h37-adding-an-npm-package)). After a `git pull` that changes `composer.lock`, run `make composer c=install`, then `make migrate` for any new migrations.

**Many packages also need an install step** that copies their configuration or migrations into the app. The package's README says which:

```sh
make artisan c="fortify:install"     # Fortify: config, service provider, actions
make artisan c="vendor:publish --tag=medialibrary-migrations"   # medialibrary: its migration
```

How each package of the project was installed: [S1.6](../start/S1-setup.md#s16-creating-the-laravel-backend). Updating them: `make composer c="update vendor/package"`; `make audit` lists known vulnerabilities.

---

## H2.9 Finding out what is going on

| Tool | When | How |
|---|---|---|
| **The log** | An error 500, or anything the app writes with `Log::` | `backend/storage/logs/laravel.log`; `make logs` for the container's output |
| **`Log::info()`** | Following what a piece of code does | `Log::info('Saving', ['id' => $muscle->id]);` then read the log |
| **`dump()` and `dd()`** | Seeing a value | `dump($x)` prints it and goes on; `dd($x)` prints it and stops. In a test the output appears in the terminal; remove them before committing |
| **`->dump()` in a test** | Seeing an answer in a test | `$this->getJson('/api/muscles')->dump();` |
| **Tinker** | Trying a query or a piece of code | `make tinker` ([H1.2.7](H1-database.md#h127-look-at-the-result)) |
| **The routes** | A 404 that should not be one | `make artisan c="route:list --path=api"` |
| **The configuration** | A setting that seems ignored | `make artisan c="config:show mail.mailers.smtp"`, then `make clear` |
| **Mailpit** | An email sent by the app | http://localhost:8525 |

---

## H2.10 When something goes wrong

| Message or symptom | Cause | Fix |
|---|---|---|
| `Class "Laravel\…" not found` after a `git pull` | A package added on another computer is not installed here | `make composer c=install` ([H2.8](#h28-adding-a-package)) |
| 403 for everyone, admins included | `authorize()` from `make:request` returns `false` | Delete it ([H2.3.6](#h236-the-trap-of-the-generated-authorize)) |
| 403 for an admin, or 200 for anyone | The policy method is missing or wrong, or `Gate::authorize()` was forgotten | A test for each case ([H2.3.5](#h235-the-tests-success-and-every-refusal)) |
| 401 in a test | No `actingAs($user)` | Add it |
| 404 on a route that exists | A typo in the URL, or the route is outside the `auth:sanctum` group you expected, or the id does not exist | `make artisan c="route:list --path=api"` |
| 405 Method Not Allowed | The URL exists but with another method (`POST` instead of `PATCH`) | Check the route's method |
| 419 | The CSRF cookie or header is missing ([C2.7.1](../concepts/C2-backend.md#c271-how-a-session-works)) | From the React app it is automatic (`src/lib/http.ts`); in tests it is not checked |
| 422 with a message in English | The rule's message is missing from `lang/xx/validation.php` | Add it ([H2.6](#h26-messages-in-the-users-language)) |
| 500 | An exception in the code | The last lines of `backend/storage/logs/laravel.log` |
| A field sent is not saved | It is not in the Form Request's `rules()`, or not in the model's `#[Fillable]` | Add it to both |
| `make test f="two words"` says `Test file "…" not found` | `f=` takes one word | `make test f=OneWord` |
| A job never runs | The `queue` container is down or stuck | `make ps`, `make restart`, `make logs s=queue` |
| 400 ``Requested filter(s) `x` are not allowed`` | A `filter[x]` that the controller's `allowedFilters()` does not list | Add it there, if it is meant to exist ([H2.12.3](#h2123-scopes-the-sql-they-write)) |
| A relation missing from the JSON | `whenLoaded()` in the resource, but no `with()` or `load()` in the controller | Load it ([H2.12.7](#h2127-the-tests-and-proving-they-can-fail)) |
| A translated column saved as `{"en": null}` | `null` assigned to a translatable column | `forgetTranslations($field, asNull: true)` ([H2.12.5](#h2125-one-language-per-exercise-the-translations-trap)) |
| Names in a strange order: capitals first, accents last | Postgres on Alpine compares bytes | `collate "und-x-icu"` ([H2.12.4](#h2124-sorting-by-name-the-collation-trap)) |

Database errors: [H1.9](H1-database.md#h19-when-something-goes-wrong). Setup problems: [S1.10](../start/S1-setup.md#s110-troubleshooting).

---

## H2.11 Commands at a glance

| What | Command |
|---|---|
| Controller, resource | `make artisan c="make:controller MuscleController"`, `c="make:resource MuscleResource"` |
| Controller with the five API methods | `make artisan c="make:controller ExerciseController --api --model=Exercise"` |
| Form Request, policy | `make artisan c="make:request UpdateMuscleRequest"`, `c="make:policy MusclePolicy --model=Muscle"` |
| A validation rule of our own | `make artisan c="make:rule SupersetsAreNeighbours"` |
| An action, or any plain class | `make artisan c="make:class Actions/Exercises/SavePersonalExercise"` |
| The SQL of a query | in tinker, `Exercise::visibleTo(User::first())->search('panca')->toRawSql()` |
| Test | `make artisan c="make:test MuscleApiTest --pest"` |
| Admin screen | `make artisan c="make:filament-resource Muscle --generate"` |
| Job | `make artisan c="make:job LogMuscleCount"` |
| API routes | `make artisan c="route:list --path=api"` |
| Tests, one file | `make test`, `make test f=MuscleApi` |
| Tests, one folder | `make artisan c="test tests/Feature/Plans"` |
| How many queries some code runs | in tinker, `DB::enableQueryLog();` … `count(DB::getQueryLog())` |
| PHP console | `make tinker` |
| Logs | `make logs`, `make logs s=queue`, `backend/storage/logs/laravel.log` |
| One setting | `make artisan c="config:show app.frontend_url"` |
| Clear the caches | `make clear` |
| A package | `make composer c="require vendor/package"`; after a pull, `make composer c=install` |
| Format, then every check | `make fix`, `make check` |

**Official documentation:** the Laravel pages *Routing*, *Controllers*, *Validation*, *Authorization*, *Eloquent: API Resources*, *HTTP Tests*, *Queues*, *Localization* and *Configuration*, at https://laravel.com/docs; Filament's *Resources* at https://filamentphp.com/docs.

---

## H2.12 The exercise library API, as built

The second part of [BE-1](../project/backlog.md#be-1-exercise-library-api-and-admin) built the library's API on the tables of [H1.10](H1-database.md#h110-the-exercise-library-as-built). This section follows what was done, with the real output. It shows what [H2.2](#h22-an-endpoint-that-reads-from-start-to-finish) and [H2.3](#h23-an-endpoint-that-changes-data) do not: a list with filters and pages, a policy on a user's own rows, an action, translated columns written in one language, and sorting by name. The endpoints themselves are described in [C2.5.4](../concepts/C2-backend.md#c254-the-exercise-librarys-endpoints).

| File | What it is |
|---|---|
| `routes/api.php` | Three lines: muscles, equipment, and `apiResource('exercises')` |
| `app/Http/Controllers/ExerciseController.php` | The five methods: index, show, store, update, destroy |
| `app/Http/Controllers/MuscleController.php`, `EquipmentController.php` | The two fixed lists |
| `app/Http/Requests/ListExercisesRequest.php` | The values of the list's filters |
| `app/Http/Requests/StoreExerciseRequest.php`, `UpdateExerciseRequest.php` | The editor's fields; the second extends the first |
| `app/Policies/ExercisePolicy.php` | Who may see, change, delete ([C2.5.1](../concepts/C2-backend.md#c251-permissions-policies)) |
| `app/Actions/Exercises/SavePersonalExercise.php` | Saving: one language, muscles as a whole list ([C2.5.3](../concepts/C2-backend.md#c253-actions-the-work-outside-the-controller)) |
| `app/Http/Resources/ExerciseResource.php`, `MuscleResource.php`, `EquipmentResource.php` | The JSON |
| `app/Models/Exercise.php` | Six query scopes, and `isOwnedBy()` |
| `lang/{it,es,de}/validation.php`, `lang/en/validation.php` | The messages of the new rules, the names of the new fields |
| `tests/Feature/ExerciseLibrary/` | Four new files, 51 tests |

### H2.12.1 Generate the files

```sh
make artisan c="make:controller ExerciseController --api --model=Exercise"
make artisan c="make:controller MuscleController"
make artisan c="make:controller EquipmentController"
make artisan c="make:request ListExercisesRequest"
make artisan c="make:request StoreExerciseRequest"
make artisan c="make:request UpdateExerciseRequest"
make artisan c="make:policy ExercisePolicy --model=Exercise"
make artisan c="make:resource ExerciseResource"
make artisan c="make:resource MuscleResource"
make artisan c="make:resource EquipmentResource"
make artisan c="make:class Actions/Exercises/SavePersonalExercise"
make artisan c="make:test ExerciseLibrary/ExerciseApiTest --pest"
make artisan c="make:test ExerciseLibrary/ExerciseListTest --pest"
make artisan c="make:test ExerciseLibrary/MuscleAndEquipmentApiTest --pest"
make artisan c="make:test ExerciseLibrary/SavePersonalExerciseTest --pest"
```

```
INFO  Controller [app/Http/Controllers/ExerciseController.php] created successfully.
INFO  Controller [app/Http/Controllers/MuscleController.php] created successfully.
INFO  Controller [app/Http/Controllers/EquipmentController.php] created successfully.
INFO  Request [app/Http/Requests/ListExercisesRequest.php] created successfully.
INFO  Request [app/Http/Requests/StoreExerciseRequest.php] created successfully.
INFO  Request [app/Http/Requests/UpdateExerciseRequest.php] created successfully.
INFO  Policy [app/Policies/ExercisePolicy.php] created successfully.
INFO  Resource [app/Http/Resources/ExerciseResource.php] created successfully.
INFO  Resource [app/Http/Resources/MuscleResource.php] created successfully.
INFO  Resource [app/Http/Resources/EquipmentResource.php] created successfully.
INFO  Class [app/Actions/Exercises/SavePersonalExercise.php] created successfully.
INFO  Test [tests/Feature/ExerciseLibrary/ExerciseApiTest.php] created successfully.
…
```

- **`--api --model=Exercise`** writes the five methods of an API, already typed with the model: `show(Exercise $exercise)`. Without `--api` there would be seven, with `create` and `edit`, which return HTML forms: an API has no use for them.
- **`make:class`** creates a plain class with an empty constructor, in the folder given (`Actions/Exercises/` under `app/`). Laravel has no base class for actions.
- **A slash in `make:test`** puts the test in a subfolder: `tests/Feature/ExerciseLibrary/`.
- **What to delete from the generated files**: the policy's `viewAny`, `restore` and `forceDelete`, which nothing uses; the requests' `authorize()`, which returns `false` ([H2.3.6](#h236-the-trap-of-the-generated-authorize)).

### H2.12.2 The routes

```php
Route::get('/muscles', [MuscleController::class, 'index']);
Route::get('/equipment', [EquipmentController::class, 'index']);
Route::apiResource('exercises', ExerciseController::class);
```

```sh
make artisan c="route:list --path=api"
```

```
GET|HEAD        api/equipment .................... EquipmentController@index
GET|HEAD        api/exercises ... exercises.index › ExerciseController@index
POST            api/exercises ... exercises.store › ExerciseController@store
GET|HEAD        api/exercises/{exercise} exercises.show › ExerciseControlle…
PUT|PATCH       api/exercises/{exercise} exercises.update › ExerciseControl…
DELETE          api/exercises/{exercise} exercises.destroy › ExerciseContro…
GET|HEAD        api/muscles ......................... MuscleController@index
```

(The Fortify, `health` and `user` routes are left out.) **`apiResource`** wrote the five `exercises` routes from one line. The `{exercise}` parameter has the name of the controller's `Exercise $exercise`, so route model binding loads it ([H2.3.4](#h234-the-controller-method-and-the-route)). A soft-deleted exercise is not found, so it gets a 404.

### H2.12.3 Scopes: the SQL they write

The list is built from query scopes of the model ([C2.6](../concepts/C2-backend.md#c26-database-migrations-models-factories-seeders)). Before writing the controller, check what they produce, in tinker:

```sh
make tinker
```

```php
> app()->setLocale('it');
> echo Exercise::visibleTo(User::first())->search('panca')->withPrimaryMuscle('chest', 'triceps')->fromSource('mine')->orderByName()->toRawSql();
select * from "exercises" where ("owner_id" is null or "owner_id" = 1) and (coalesce(name->>'it', name->>'en') ilike '%panca%' or coalesce(aliases->>'it', aliases->>'en') ilike '%panca%') and exists (select * from "muscles" inner join "exercise_muscle" on "muscles"."id" = "exercise_muscle"."muscle_id" where "exercises"."id" = "exercise_muscle"."exercise_id" and "slug" in ('chest', 'triceps') and "exercise_muscle"."role" = 'primary') and "owner_id" is not null and "exercises"."deleted_at" is null order by coalesce(name->>'it', name->>'en') collate "und-x-icu", "id" asc
```

What to look for in it:

- **The parentheses** around `owner_id is null or owner_id = 1`: they come from `where(fn …)`. Without them, `… or owner_id = 1 and coalesce(…) ilike …` would show someone else's exercise to anyone whose search matched.
- **`exists (select … )`** is what `whereHas('muscles', …)` writes: one subquery, whatever the number of muscles.
- **`deleted_at is null`** was added by `SoftDeletes`, without asking.
- **`toRawSql()`** fills in the values; `toSql()` shows the `?` placeholders instead.

Then, in the controller, `QueryBuilder` ties each `filter[...]` to a scope:

```php
QueryBuilder::for(Exercise::visibleTo($request->user()))
    ->allowedFilters(
        AllowedFilter::scope('search')->delimiter(''),
        AllowedFilter::scope('muscle', 'withPrimaryMuscle'),
        AllowedFilter::scope('equipment', 'usingEquipment'),
        AllowedFilter::scope('source', 'fromSource'),
    )
```

An unknown filter gets a 400, with the package's message: ``Requested filter(s) `owner_id` are not allowed. Allowed filter(s) are `search, muscle, equipment, source`.``

### H2.12.4 Sorting by name: the collation trap

`order by coalesce(name->>'it', name->>'en')` alone gave this order:

```
FAILED  Tests\Feature\ExerciseLibrary\ExerciseListTest > it sorts names a…
Failed asserting that two arrays are identical.
 Array &0 [
-    0 => 'ab wheel',
-    1 => 'Ápice',
-    2 => 'Bench',
-    3 => 'Curl',
+    0 => 'Bench',
+    1 => 'Curl',
+    2 => 'ab wheel',
+    3 => 'Ápice',
 ]
```

Capitals first, then lower case, then accents. The database's collation (its rules for comparing text) says `en_US.utf8`, but the Postgres image is built on Alpine, whose C library compares bytes. Checking it in `make psql`:

```sql
select datcollate from pg_database where datname = 'atleoplan';   -- en_US.utf8
select 'Cuello' < 'Cuádriceps', 'banca' < 'Bench';                -- t | f
select 'Cuádriceps' < 'Cuello' collate "und-x-icu",
       'banca' < 'Bench' collate "und-x-icu";                     -- t | t
```

**The fix** is `collate "und-x-icu"` after the sorted text: the ICU library's rules, which this Postgres has built in, and which sort the way a reader expects. The muscles and the equipment are only 17 and 12 rows, sorted in PHP with `Collator` (from PHP's `intl` extension), which uses the same ICU rules.

### H2.12.5 One language per exercise: the translations trap

A personal exercise keeps one language ([C2.5.4](../concepts/C2-backend.md#c254-the-exercise-librarys-endpoints)). The first idea, `setTranslations()`, does not do that; tried in tinker:

```php
> $e = new Exercise();
> $e->setTranslations('name', ['it' => 'Panca', 'en' => 'Bench']);
> $e->setTranslations('name', ['de' => 'Bank']);
> echo json_encode($e->getTranslations('name'));
{"it":"Panca","en":"Bench","de":"Bank"}          // added, not replaced
> $e->description = null;
> echo $e->getAttributes()['description'];
{"en":null}                                      // null under the current language, not NULL
```

The methods that do what is needed:

```php
> $e->replaceTranslations('name', ['de' => 'Bank']);
> echo $e->getAttributes()['name'];
{"de":"Bank"}
> $e->forgetTranslations('description', asNull: true);
> var_export($e->getAttributes()['description']);
NULL
```

`forgetAllTranslations('it')`, despite its name, removes one **language** from every column; it is not the opposite of `setTranslations()`. `SavePersonalExercise::fill()` uses `replaceTranslations()` and `forgetTranslations(asNull: true)`.

### H2.12.6 Look at the JSON

To see a real answer without leaving rows behind, open a transaction in tinker and undo it at the end ([H1.10.7](H1-database.md#h1107-trying-things-in-tinker-without-leaving-traces)):

```php
> DB::beginTransaction();
> app()->setLocale('it');
> $e = Exercise::create(['name' => ['en' => 'Barbell bench press', 'it' => 'Panca piana con bilanciere'], 'equipment_id' => Equipment::where('slug', 'barbell')->value('id')]);
> $e->muscles()->attach(Muscle::where('slug', 'triceps')->first(), ['role' => 'secondary']);
> $e->muscles()->attach(Muscle::where('slug', 'chest')->first(), ['role' => 'primary']);
> request()->setUserResolver(fn () => User::first());
> echo json_encode((new App\Http\Resources\ExerciseResource($e->load(['equipment', 'muscles'])))->resolve(request()), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
> DB::rollBack();
```

The output is the JSON of [C2.5.4](../concepts/C2-backend.md#c254-the-exercise-librarys-endpoints): the texts in Italian, the primary muscle first even though it was attached second, `is_mine` false. `setUserResolver()` gives the request a user, which the resource asks for `is_mine`; a request from the React app has one already.

A page of the list has three keys, checked the same way with `Exercise::paginate(2)`: `data`, `links` (`first`, `last`, `prev`, `next`) and `meta` (`current_page`, `from`, `last_page`, `links`, `path`, `per_page`, `to`, `total`).

### H2.12.7 The tests, and proving they can fail

```sh
make test f=ExerciseLibrary
```

```
PASS  Tests\Feature\ExerciseLibrary\ExerciseApiTest
PASS  Tests\Feature\ExerciseLibrary\ExerciseLibrarySeedersTest
PASS  Tests\Feature\ExerciseLibrary\ExerciseListTest
PASS  Tests\Feature\ExerciseLibrary\ExerciseModelTest
PASS  Tests\Feature\ExerciseLibrary\MuscleAndEquipmentApiTest
PASS  Tests\Feature\ExerciseLibrary\SavePersonalExerciseTest
Tests:    67 passed (249 assertions)
```

| File | Covers |
|---|---|
| `ExerciseListTest.php` | Who sees what, language and order of names, search, the four filters, wrong values (422, 400), pages, relations, number of queries |
| `ExerciseApiTest.php` | Reading, creating, changing, deleting; every refusal (401, 403 for someone else's and for a public one, admins included, 404, 422 per field); errors in Italian |
| `SavePersonalExerciseTest.php` | The action without HTTP: one language, `null` empties, muscles replaced or kept |
| `MuscleAndEquipmentApiTest.php` | The two lists, from the real seeders, sorted with accents |

**Tests that passed at the first run prove little,** so each delicate line was broken on purpose, to see a test fail, and then put back:

| Line removed | Test that failed |
|---|---|
| `collate "und-x-icu"` | `it sorts names as a person would` ([H2.12.4](#h2124-sorting-by-name-the-collation-trap)) |
| `->with(self::RELATIONS)` | `it sends the equipment and the muscles`: ``Failed asserting that null is identical to 'barbell'`` |
| `->delimiter('')` | `it searches for a % or a comma as themselves`: the search `squat, paused` became two searches, and found `Squat` too |

The second is worth a note. Without `with()`, one would expect the "N+1" problem, one query per exercise. Instead the equipment **disappears** from the JSON: the resource uses `whenLoaded()`, which never queries by itself. The test that counts queries guards the other case, a resource that reads a relation directly.

**Errors met along the way:**

| Message | Cause | Fix |
|---|---|---|
| ``Expecting 'validation.attributes.muscles.*.role' not to be 'validation.attributes.muscles.*.role'`` | `__('validation.attributes.muscles.*.role')` takes each dot for a level of the file, and finds nothing. Laravel's validator reads the key whole, so the message itself was right | The test reads `__('validation.attributes')` as an array, then the key `'muscles.*.role'` |


## H2.13 The plans API, as built

The first part of [FEAT-2](../project/backlog.md#feat-2-plans) built the plans' API on the tables of [H1.13](H1-database.md#h113-the-plan-tables-as-built). This section follows what was done, with the real output, as a tutorial for the next endpoint of this kind. It shows what [H2.12](#h212-the-exercise-library-api-as-built) does not: a request body shaped as a tree, a rule of our own, an abstract Form Request shared by two, an action that saves four levels in one transaction, routes for actions that are not CRUD, and a create that can be sent twice. The endpoints and the flow of a save are described in [C2.5.5](../concepts/C2-backend.md#c255-the-plans-endpoints), the validation in [C2.5.6](../concepts/C2-backend.md#c256-validating-nested-data).

| File | What it is |
|---|---|
| `routes/api.php` | `apiResource('plans')` and three action routes |
| `app/Http/Controllers/PlanController.php` | index, show, store, update, destroy, activate, archive, unarchive |
| `app/Http/Requests/PlanRequest.php` | The rules of a whole plan, `abstract` |
| `app/Http/Requests/StorePlanRequest.php`, `UpdatePlanRequest.php` | Extend it: the plan's `id` on create, `version` on save |
| `app/Http/Requests/ListPlansRequest.php` | `?archived=1` |
| `app/Rules/SupersetsAreNeighbours.php` | A rule of our own |
| `app/Policies/PlanPolicy.php` | Only the owner; `activate` also refuses an archived plan |
| `app/Actions/Plans/SavePlan.php` | Saving the whole tree |
| `app/Http/Resources/Plan{,Day,Item,Set}Resource.php` | The JSON, one class per level |
| `lang/{en,it,es,de}/validation.php` | The new rules' messages, the new fields' names |
| `tests/Feature/Plans/` | Three files for the API, 41 tests |

### H2.13.1 Generate the files

```sh
make artisan c="make:policy PlanPolicy --model=Plan"
make artisan c="make:request ListPlansRequest"
make artisan c="make:request PlanRequest"
make artisan c="make:request StorePlanRequest"
make artisan c="make:request UpdatePlanRequest"
make artisan c="make:rule SupersetsAreNeighbours"
make artisan c="make:class Actions/Plans/SavePlan"
make artisan c="make:resource PlanResource"
make artisan c="make:resource PlanDayResource"
make artisan c="make:resource PlanItemResource"
make artisan c="make:resource PlanSetResource"
make artisan c="make:controller PlanController --api --model=Plan"
make artisan c="make:test Plans/PlanListTest --pest"
make artisan c="make:test Plans/SavePlanApiTest --pest"
make artisan c="make:test Plans/PlanActionsTest --pest"
```

```
INFO  Policy [app/Policies/PlanPolicy.php] created successfully.
INFO  Request [app/Http/Requests/ListPlansRequest.php] created successfully.
…
INFO  Rule [app/Rules/SupersetsAreNeighbours.php] created successfully.
INFO  Class [app/Actions/Plans/SavePlan.php] created successfully.
…
INFO  Controller [app/Http/Controllers/PlanController.php] created successfully.
INFO  Test [tests/Feature/Plans/PlanListTest.php] created successfully.
…
```

- **`make:rule`** creates `app/Rules/`, the first time, with a class that implements `ValidationRule` and one empty method, `validate()` ([H2.13.4](#h2134-a-rule-of-your-own)).
- **`make:request PlanRequest`** writes an ordinary request; making it `abstract`, and the other two `extends PlanRequest` instead of `extends FormRequest`, is done by hand.
- **What to delete from the generated files**, as in [H2.12.1](#h2121-generate-the-files): the policy's `viewAny`, `restore` and `forceDelete`; the requests' `authorize()` ([H2.3.6](#h236-the-trap-of-the-generated-authorize)).

### H2.13.2 The routes

```php
Route::apiResource('plans', PlanController::class);
Route::post('/plans/{plan}/activate', [PlanController::class, 'activate']);
Route::post('/plans/{plan}/archive', [PlanController::class, 'archive']);
Route::post('/plans/{plan}/unarchive', [PlanController::class, 'unarchive']);
```

```sh
make artisan c="route:list --path=api/plans"
```

```
GET|HEAD        api/plans ............... plans.index › PlanController@index
POST            api/plans ............... plans.store › PlanController@store
GET|HEAD        api/plans/{plan} .......... plans.show › PlanController@show
PUT|PATCH       api/plans/{plan} ...... plans.update › PlanController@update
DELETE          api/plans/{plan} .... plans.destroy › PlanController@destroy
POST            api/plans/{plan}/activate .......... PlanController@activate
POST            api/plans/{plan}/archive ............ PlanController@archive
POST            api/plans/{plan}/unarchive ........ PlanController@unarchive

                                                            Showing [8] routes
```

- **The three action routes are written by hand**, with the same `{plan}` parameter: route model binding loads the plan for them too, because the controller's method has `Plan $plan`.
- **`{plan}` is a UUID.** A URL with something else, `/api/plans/12`, gets a 404 before any query: `HasUuids` checks the format first. Without that check, Postgres would answer `invalid input syntax for type uuid` and the request would end in a 500.
- **`PUT|PATCH`:** both reach `update()`. The editor will use `PUT`, which in HTTP means "replace the whole thing", and that is what a save does.

### H2.13.3 The rules of a tree

The editor sends the whole plan in one body ([C2.5.5](../concepts/C2-backend.md#c255-the-plans-endpoints)). `PlanRequest` describes every level with `.*`; the important lines:

```php
'days' => ['present', 'array', 'max:14'],
'days.*.id' => ['sometimes', 'uuid', 'distinct', $this->dayIdIsFree()],
'days.*.name' => ['required', 'string', 'max:50'],
'days.*.items' => ['present', 'array', 'max:30', new SupersetsAreNeighbours],
'days.*.items.*.exercise_id' => ['required', 'integer', Rule::exists('exercises', 'id')
    ->where(fn (Builder $query) => $query
        ->whereNull('owner_id')
        ->orWhere('owner_id', $this->user()->id))],
'days.*.items.*.sets.*.set_type' => ['required', Rule::enum(SetType::class)],
'days.*.items.*.sets.*.target_reps_max' => ['nullable', 'integer', 'between:1,999',
    'required_with:days.*.items.*.sets.*.target_reps_min',
    'gte:days.*.items.*.sets.*.target_reps_min'],
```

Three ideas to take from it:

1. **`present`, not `required`, on the lists.** `required` refuses an empty list, and a day with no exercises yet is fine. `present` only wants the key there: a body that forgot `items` is refused, rather than read as "this day has no exercises any more", which would delete them.
2. **`*` in another field's name means "the same place".** In `gte:days.*.items.*.sets.*.target_reps_min`, Laravel fills each `*` with the indexes of the field being checked, so set 2 of item 0 of day 1 is compared with its own minimum.
3. **`exists` with conditions.** `Rule::exists('exercises', 'id')` alone accepts anyone's personal exercise. The `where(fn …)` adds `(owner_id is null or owner_id = 5)`: Laravel wraps the function's conditions in parentheses, so its `or` cannot leak out. A deleted exercise passes, on purpose: a plan that already has one must still be saved.

**Ids that may already exist.** The editor sends back the ids it received, so a day's id is fine when it belongs to **this** plan, and refused when it belongs to another:

```php
private function dayIdIsFree(): Unique
{
    $rule = Rule::unique('plan_days', 'id');
    $planId = $this->planId();

    return $planId === null ? $rule : $rule->whereNot('plan_id', $planId);
}
```

`unique` is refused when a row has the value; `whereNot('plan_id', …)` leaves this plan's rows out of that search. For items, which point to a day and not to the plan, the condition is a subquery (`plan_day_id not in (select id from plan_days where plan_id = ?)`).

**Which plan is "this plan"** depends on the request, so `PlanRequest` is `abstract` and leaves it to the two classes that extend it:

```php
abstract class PlanRequest extends FormRequest
{
    abstract protected function planId(): ?string;
    // … rules() uses $this->planId()
}

class UpdatePlanRequest extends PlanRequest
{
    public function rules(): array
    {
        return ['version' => ['required', 'integer', 'min:1'], ...parent::rules()];
    }

    protected function planId(): ?string
    {
        return $this->route('plan')->id;      // the plan in the URL, already loaded
    }
}
```

`StorePlanRequest::planId()` answers with the `id` of the body, when it is a valid UUID: that is what lets a create be sent twice ([C2.5.5](../concepts/C2-backend.md#c255-the-plans-endpoints)). Its own `id` rule refuses a plan id of another user: `Rule::unique('plans', 'id')->whereNot('user_id', $this->user()->id)`.

### H2.13.4 A rule of your own

"The exercises of a superset are next to each other, and there are at least two" is not a Laravel rule. The generated class:

```php
class SupersetsAreNeighbours implements ValidationRule
{
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        //
    }
}
```

- **`$attribute`** is the field's real name, `days.0.items`; **`$value`** its value, here one day's list of items, since the rule sits on `days.*.items`.
- **`$fail('…')`** refuses the value with that message. Given a key, `->translate()` looks it up in `lang/*/validation.php`, in the request's language:

```php
$fail('validation.superset_neighbours')->translate();
```

The message goes in the four files, English included, since Laravel's own English file does not have it:

```php
// lang/en/validation.php
'superset_neighbours' => 'The exercises of a superset must be next to each other.',
'superset_size' => 'A superset needs at least two exercises.',
// lang/it/validation.php
'superset_neighbours' => 'Gli esercizi di una superserie devono essere uno dopo l\'altro.',
```

The check itself walks the list once, remembering how many items each group has and the group of the item before: a group seen before but not on the previous item means its exercises are apart. The test runs the same body with three layouts, as a **dataset**:

```php
it('refuses supersets whose exercises are apart, or alone', function (array $groups, string $message) {
    // … a day whose items have these superset_group values …
        ->assertJsonValidationErrors(['days.0.items' => $message]);
})->with([
    'apart: 1 – 1' => [[1, null, 1], 'The exercises of a superset must be next to each other.'],
    'apart: 1 2 1' => [[1, 2, 2, 1], 'The exercises of a superset must be next to each other.'],
    'alone: 1 2 2' => [[1, 2, 2], 'A superset needs at least two exercises.'],
]);
```

### H2.13.5 The traps of nested validation

Three things went differently from what was expected; each is now in a test.

**1. A list whose items have no validated field vanishes from `validated()`.** At first `set_type` was optional, and a set could be sent as `{}`. The test that did so failed in the action, not in the validation:

```
Undefined array key "sets"
  at tests/Feature/Plans/SavePlanApiTest.php:99
```

`validated()` rebuilds the data from the rules. For a list whose items have rules of their own (`sets.*.set_type`…), it keeps the list only through those fields; a `{}` has none, so `sets: [{}]` came out with no `sets` key at all, while `sets: []` stayed. The fix is `required` on `set_type`: a set always has a type, and the editor always sends it.

**2. The order of the rules decides whether a bad id is a 422 or a 500.** `'days.*.id' => ['sometimes', 'uuid', 'distinct', $this->dayIdIsFree()]`: with an id `"day-1"`, `uuid` fails, and Laravel then **skips** `unique` and `exists` on that field (`Validator::hasNotFailedPreviousRuleIfPresenceRule()`). It was tried the other way round, with the unique rule first:

```
⨯ it refuses an id that is not a UUID, without asking the database
  Expected response status code [422] but received 500.
PDOException: SQLSTATE[22P02]: Invalid text representation: 7 ERROR:  invalid input syntax for type uuid: "day-1"
```

Postgres answers a query on a `uuid` column with an error, not with "no rows". A first version of the rules had `bail` (stop at the first failure) for this reason; the test showed that Laravel already does it for these two rules, so `bail` was removed and the test stayed, to guard the order.

**3. "This plan" is what the body says it is.** A first test expected a create with someone else's plan id, day id and item id to be refused on all three. It was refused only on `id`:

```
Failed to find a validation error in the response for key: 'days.0.items.0.id'
Response has the following JSON validation errors:
{ "id": ["The id has already been taken."] }
```

The days and items are checked against the plan with the id sent, which here is the other user's, so they pass. The request is refused all the same, which is what matters; the test now says so, and a second request with a new plan id shows the day and the item refused.

### H2.13.6 Saving a tree: the action

`SavePlan` has `create()` and `update()`, both in `DB::transaction()`, both ending in `saveDays()`. The steps of `saveDays()`:

```php
$existingDays = $plan->days()->get()->keyBy('id');     // what the plan has now, by id
$existingItems = $plan->items()->get()->keyBy('id');   // hasManyThrough: every item of every day

foreach (array_values($days) as $dayPosition => $dayData) {
    $day = $existingDays->get($dayData['id'] ?? '')      // the same day…
        ?? $plan->days()->make(['id' => $dayData['id'] ?? null]);   // …or a new one
    $day->fill(['name' => $dayData['name'], 'position' => $dayPosition]);
    $day->save();                                        // insert, update, or nothing
    // … the same for its items, with $item->plan_day_id = $day->id
    // … and every set collected into $sets
}

PlanItem::query()->whereIn('id', $existingItems->keys())->whereNotIn('id', $keptItemIds)->delete();
$plan->days()->whereNotIn('id', $keptDayIds)->delete();
PlanSet::query()->whereIn('plan_item_id', $keptItemIds)->delete();
PlanSet::query()->insert($sets);                         // every set, one query
```

- **`keyBy('id')`** turns the collection into one keyed by id, so each id sent finds its row without another query.
- **`save()` on a model that did not change does nothing**: Eloquent compares the values with those it read and writes only what changed.
- **The order of the deletes:** items first. An item moved from a deleted day to a kept day already points to its new day, so deleting the old day, whose items go by cascade, does not take it along.
- **`insert()`** writes many rows in one query, without models: no casts and no timestamps, so every row lists every column, as `setRow()` does.

In `update()`, the version is read with a lock:

```php
$current = Plan::query()->whereKey($plan->id)->lockForUpdate()->value('version');
```

The query it writes ends in `for update`. Measured in tinker with `DB::enableQueryLog()`, on a plan of 3 days × 6 exercises × 4 sets:

```
create, 3 days x 6 exercises x 4 sets: 28 queries
load the whole plan: 7 queries
save again, nothing changed: 8 queries
  select "version" from "plans" where "plans"."id" = ? limit 1 for update
  update "plans" set "version" = ?, "updated_at" = ? where "id" = ?
  select * from "plan_days" where "plan_days"."plan_id" = ? and "plan_days"."plan_id" is not null order by "posi…
  select "plan_items".*, "plan_days"."plan_id" as "laravel_through_key" from "plan_items" inner join "plan_days"…
  delete from "plan_items" where "id" in (?, ?, …) and "id" not in …
  delete from "plan_days" where "plan_days"."plan_id" = ? and "plan_days"."plan_id" is not null and "id" not in …
  delete from "plan_sets" where "plan_item_id" in (?, ?, …)
  insert into "plan_sets" ("plan_item_id", "position", "set_type", …
```

A save that changed nothing but the version costs 8 queries whatever the plan's size: the 18 items did not change, so `save()` wrote none of them. A create writes one row per day and per item, then all the sets in one insert.

**The controller around it** stays short: `store()` looks for a plan of this user with the id sent, and answers with it if there is one; `update()` passes the action's answer into `meta`:

```php
$changedElsewhere = $save->update($plan, $request->validated());

return (new PlanResource($plan->load(self::TREE)))
    ->additional(['meta' => ['changed_elsewhere' => $changedElsewhere]]);
```

`additional()` adds keys next to `data` in the answer. The status needs no code: a resource wrapping a model created in this request answers 201, any other 200.

### H2.13.7 Look at the JSON

In tinker, inside a transaction undone at the end ([H1.10.7](H1-database.md#h1107-trying-things-in-tinker-without-leaving-traces)):

```php
> DB::beginTransaction();
> app()->setLocale('it');
> $user = User::first();
> $bench = Exercise::whereNull('owner_id')->first();
> $plan = app(SavePlan::class)->create($user, ['name' => 'Push Pull Legs', 'goal' => 'Ipertrofia', 'days' => [['name' => 'Giorno A – Spinta', 'items' => [['exercise_id' => $bench->id, 'rest_seconds' => 120, 'sets' => [['set_type' => 'warm_up', 'target_reps_min' => 10, 'target_reps_max' => 10, 'target_weight_kg' => 40], ['set_type' => 'normal', 'target_reps_min' => 8, 'target_reps_max' => 10, 'target_weight_kg' => 80]]]]]]]);
> request()->setUserResolver(fn () => $user);
> echo json_encode((new PlanResource($plan->load(['days.items.sets', 'days.items.exercise.equipment', 'days.items.exercise.muscles', 'days.items.exercise.media'])))->resolve(request()), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
> DB::rollBack();
```

`app(SavePlan::class)` asks the service container for the action, as the controller's parameter does. The output, with fixed ids and the exercise shortened, is the JSON of [C2.5.5](../concepts/C2-backend.md#c255-the-plans-endpoints): weights as `"40.000"`, no positions, the day and item ids made by `HasUuids`.

**A trap met while trying it:** shortening the exercise with `$json['days'][0]['items'][0]['exercise'] = …` on the result of `resolve()` failed with `Call to a member function isOwnedBy() on array`. `resolve()` turns only the top level into an array; `days` is still a collection of resources, turned into JSON later. `json_decode(json_encode(…), true)` first gives a plain array.

### H2.13.8 The tests, and proving they can fail

```sh
make artisan c="test tests/Feature/Plans"
```

```
PASS  Tests\Feature\Plans\PlanActionsTest
PASS  Tests\Feature\Plans\PlanListTest
PASS  Tests\Feature\Plans\PlanTablesTest
PASS  Tests\Feature\Plans\SavePlanApiTest
Tests:    53 passed (202 assertions)
```

| File | Covers |
|---|---|
| `PlanListTest.php` | 401; only my plans, active first, then by last change; `days_count`; archived apart; a whole plan in order with its exercise and sets; a deleted exercise still shown; the same queries for a small and a large plan; 403, 404, and 404 for an id that is not a UUID |
| `SavePlanApiTest.php` | Creating with the device's ids or without; a retry answered 200; someone else's plan, day, item or exercise refused; supersets; wrong values and missing lists (422 on the exact field); a bad UUID as a 422 and not a 500; the same id twice; messages in Italian; saving again: ids kept, an item moved, rows deleted, sets rewritten, unchanged rows untouched, the version, `changed_elsewhere`; 403 |
| `PlanActionsTest.php` | Delete, activate, archive, unarchive: what they change, and 403 on someone else's plan or an archived one |
| `PlanTablesTest.php` | The tables without HTTP ([H1.13.7](H1-database.md#h1137-factories-four-levels-deep-and-the-tests)) |

Two tools appear here for the first time:

- **`$this->travel(5)->minutes()`** moves the test's clock forward, so that `updated_at` changes if a row is written: the test "leaves the rows that did not change as they were" compares them before and after a save.
- **`DB::enableQueryLog()`** and **`DB::getQueryLog()`** count the queries of a request, to compare a plan of one exercise with one of twenty.

Each delicate line was broken on purpose, to see a test fail, and then put back:

| Line changed | Test that failed |
|---|---|
| `->withTrashed()` removed from `PlanItem::exercise()` | `it still shows an exercise deleted since it was put in the plan`: `Failed asserting that null is identical to 2.` |
| `->whereNot('plan_id', $planId)` removed from `dayIdIsFree()` | three tests that save a plan again, or retry a create: `Expected response status code [200] but received 422.` The plan's own days were refused as "already taken" |
| `uuid` moved after the unique rule | `it refuses an id that is not a UUID, without asking the database`: the 500 of [H2.13.5](#h2135-the-traps-of-nested-validation) |

**Errors met along the way**, besides the three traps:

| Message | Cause | Fix |
|---|---|---|
| `Expected response status code [200] but received 422` in the test of a save | The test's new set had no `set_type`, required since trap 1 | The test sends it |

---

← [H1. Database: how to](H1-database.md) · [Contents](../README.md) · [H3. Frontend: how to](H3-frontend.md) →
