# H2. Backend: how to

[C2. Backend](../concepts/C2-backend.md) explains how the Laravel app works. This page says **how to do things in it**: which commands to type, which files they create, what to write in each, and how to check the result. It is written for someone who has never written a Laravel endpoint.

**The commands here have been run.** The example was built for real on this project, then removed; the outputs shown are what the commands printed. It is a small version of what [BE-1](../project/backlog.md#be-1-exercise-library-api-and-admin) will build: the list of muscles, with an endpoint to read it, one to rename a muscle, an admin screen and a background job. It starts from the `muscles` table, model, factory and seeder of [H1.2](H1-database.md#h12-a-new-table-from-start-to-finish). Those now exist for real ([H1.10](H1-database.md#h110-the-exercise-library-as-built)); the endpoints, the admin screen and the job on this page are still the example, removed after the run.

**How to read this page:**

- The first time: [H2.1](#h21-before-you-start), then [H2.2](#h22-an-endpoint-that-reads-from-start-to-finish) and [H2.3](#h23-an-endpoint-that-changes-data) in order. Together they make a complete endpoint.
- Later, when you need one thing: admin screens [H2.4](#h24-an-admin-screen), jobs [H2.5](#h25-work-in-the-background), translated messages [H2.6](#h26-messages-in-the-users-language), settings [H2.7](#h27-a-setting-from-the-environment), packages [H2.8](#h28-adding-a-package).
- Something broke: [H2.9](#h29-finding-out-what-is-going-on) and [H2.10](#h210-when-something-goes-wrong).
- The same feature on the React side: [H3. Frontend: how to](H3-frontend.md).

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
- **In tinker, write the full class name if it is not a model:** `App\Http\Resources\MuscleResource`. Tinker finds models by their short name.

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
- **A new field name** goes in `attributes`, so the message says "nome" and not "name".
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

Database errors: [H1.9](H1-database.md#h19-when-something-goes-wrong). Setup problems: [S1.10](../start/S1-setup.md#s110-troubleshooting).

---

## H2.11 Commands at a glance

| What | Command |
|---|---|
| Controller, resource | `make artisan c="make:controller MuscleController"`, `c="make:resource MuscleResource"` |
| Form Request, policy | `make artisan c="make:request UpdateMuscleRequest"`, `c="make:policy MusclePolicy --model=Muscle"` |
| Test | `make artisan c="make:test MuscleApiTest --pest"` |
| Admin screen | `make artisan c="make:filament-resource Muscle --generate"` |
| Job | `make artisan c="make:job LogMuscleCount"` |
| API routes | `make artisan c="route:list --path=api"` |
| Tests, one file | `make test`, `make test f=MuscleApi` |
| PHP console | `make tinker` |
| Logs | `make logs`, `make logs s=queue`, `backend/storage/logs/laravel.log` |
| One setting | `make artisan c="config:show app.frontend_url"` |
| Clear the caches | `make clear` |
| A package | `make composer c="require vendor/package"`; after a pull, `make composer c=install` |
| Format, then every check | `make fix`, `make check` |

**Official documentation:** the Laravel pages *Routing*, *Controllers*, *Validation*, *Authorization*, *Eloquent: API Resources*, *HTTP Tests*, *Queues*, *Localization* and *Configuration*, at https://laravel.com/docs; Filament's *Resources* at https://filamentphp.com/docs.

---

← [H1. Database: how to](H1-database.md) · [Contents](../README.md) · [H3. Frontend: how to](H3-frontend.md) →
