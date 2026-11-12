# H2. Backend: how to

[C2. Backend](../concepts/C2-backend.md) explains how the Laravel app works. This page says **how to do things in it**: which commands to type, which files they create, what to write in each, and how to check the result. It is written for someone who has never written a Laravel endpoint.

**The commands here have been run.** The example was built for real on this project, then removed; the outputs shown are what the commands printed. It is a small version of what BE-1 then built: the list of muscles, with an endpoint to read it, one to rename a muscle, an admin screen and a background job. It starts from the `muscles` table, model, factory and seeder of [H1.2](H1-database.md#h12-a-new-table-from-start-to-finish). Those now exist for real ([H1.10](H1-database.md#h110-the-exercise-library-as-built)), and so does `GET /api/muscles` of H2.2, built by BE-1 with sorting by name added ([H2.12](#h212-the-exercise-library-api-as-built)). Renaming a muscle, the admin screen and the job on this page are still the example, removed after the run.

**How to read this page:**

- The first time: [H2.1](#h21-before-you-start), then [H2.2](#h22-an-endpoint-that-reads-from-start-to-finish) and [H2.3](#h23-an-endpoint-that-changes-data) in order. Together they make a complete endpoint.
- Later, when you need one thing: admin screens [H2.4](#h24-an-admin-screen), jobs [H2.5](#h25-work-in-the-background), translated messages [H2.6](#h26-messages-in-the-users-language), settings [H2.7](#h27-a-setting-from-the-environment), packages [H2.8](#h28-adding-a-package).
- Something broke: [H2.9](#h29-finding-out-what-is-going-on) and [H2.10](#h210-when-something-goes-wrong).
- A real, complete API, with a list, filters, pages, a policy and an action: [H2.12](#h212-the-exercise-library-api-as-built).
- A body shaped as a tree, saved in one request, with a validation rule of our own: [H2.13](#h213-the-plans-api-as-built).
- Data sent by a phone that may be offline, late and twice; totals worked out by the database: [H2.14](#h214-the-workouts-api-as-built).
- Routes the browser visits rather than fetches, a package for signing in with Google, an outside service faked in the tests: [H2.15](#h215-sign-in-with-google-as-built).
- Real admin screens: a form in four languages, permissions of the screen's own, row actions, the panel in the admin's language, a middleware placed in Laravel's priority list, Livewire tests: [H2.16](#h216-the-admin-panel-as-built).
- Files: uploads, image copies made by a queue, a package added with Composer: [H2.17](#h217-the-photos-of-an-exercise-as-built).
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
- [H2.14 The workouts API, as built](#h214-the-workouts-api-as-built)
  - [H2.14.1 Generate the files](#h2141-generate-the-files)
  - [H2.14.2 The routes](#h2142-the-routes)
  - [H2.14.3 A check after the rules](#h2143-a-check-after-the-rules)
  - [H2.14.4 The save](#h2144-the-save)
  - [H2.14.5 The trap of the moments](#h2145-the-trap-of-the-moments)
  - [H2.14.6 Totals and "last time" in the database](#h2146-totals-and-last-time-in-the-database)
  - [H2.14.7 Look at Home](#h2147-look-at-home)
  - [H2.14.8 The tests, and proving they can fail](#h2148-the-tests-and-proving-they-can-fail)
  - [H2.14.9 Later: last time before a workout (FEAT-4)](#h2149-later-last-time-before-a-workout-feat-4)
- [H2.15 Sign in with Google, as built](#h215-sign-in-with-google-as-built)
  - [H2.15.1 The order of building](#h2151-the-order-of-building)
  - [H2.15.2 The package](#h2152-the-package)
  - [H2.15.3 The routes: web.php, not api.php](#h2153-the-routes-webphp-not-apiphp)
  - [H2.15.4 The controller and the action](#h2154-the-controller-and-the-action)
  - [H2.15.5 The test: Google faked](#h2155-the-test-google-faked)
  - [H2.15.6 Proving the tests can fail](#h2156-proving-the-tests-can-fail)
  - [H2.15.7 Checking it for real](#h2157-checking-it-for-real)
  - [H2.15.8 The checks](#h2158-the-checks)
- [H2.16 The admin panel, as built](#h216-the-admin-panel-as-built)
  - [H2.16.1 Generate the files](#h2161-generate-the-files)
  - [H2.16.2 The exercise screen: adjusting what was generated](#h2162-the-exercise-screen-adjusting-what-was-generated)
  - [H2.16.3 The users screen](#h2163-the-users-screen)
  - [H2.16.4 The panel's language](#h2164-the-panels-language)
  - [H2.16.5 The middleware and the priority list](#h2165-the-middleware-and-the-priority-list)
  - [H2.16.6 The tests](#h2166-the-tests)
  - [H2.16.7 Check it in the browser](#h2167-check-it-in-the-browser)
  - [H2.16.8 The way in: the link and Google on the panel's login](#h2168-the-way-in-the-link-and-google-on-the-panels-login)
- [H2.17 The photos of an exercise, as built](#h217-the-photos-of-an-exercise-as-built)
  - [H2.17.1 Generate the files](#h2171-generate-the-files)
  - [H2.17.2 The package for the panel](#h2172-the-package-for-the-panel)
  - [H2.17.3 The conversions, and the photo's JSON](#h2173-the-conversions-and-the-photos-json)
  - [H2.17.4 The copies of the photos already there](#h2174-the-copies-of-the-photos-already-there)
  - [H2.17.5 The tests](#h2175-the-tests)
  - [H2.17.6 Check it](#h2176-check-it)

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

A single `name` field edits only one language. Editing every language of a translated column takes one field per language ([D3.4.5](../design/D3-data-model.md#d345-translations)): the exercises' screen does it with a tab per language ([H2.16.2](#h2162-the-exercise-screen-adjusting-what-was-generated)).

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
| A moment saved an hour (or more) off | A date sent with an offset (`18:00+01:00`) reached the model as it was: Laravel writes dates without the offset | Turn it into UTC first: `Carbon::parse($value)->utc()` ([H2.14.5](#h2145-the-trap-of-the-moments)) |
| A test of a visitor gets a 422 or a 200 instead of a 401 | An earlier `actingAs()` in the same test still signs in every request | The visitor's request first, or in a test of its own |
| 403 for everyone, admins included | `authorize()` from `make:request` returns `false` | Delete it ([H2.3.6](#h236-the-trap-of-the-generated-authorize)) |
| 403 for an admin, or 200 for anyone | The policy method is missing or wrong, or `Gate::authorize()` was forgotten | A test for each case ([H2.3.5](#h235-the-tests-success-and-every-refusal)) |
| 401 in a test | No `actingAs($user)` | Add it |
| 204, yet nothing saved | The column is not in the model's `#[Fillable([...])]`: `update($request->validated())` silently skips it | Add it to the list ([H3.21.2](H3-frontend.md#h3212-the-backend-five-rules-and-the-fillable-trap)) |
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
| Admin screen | `make artisan c="make:filament-resource Muscle --generate"`; with soft deletes, `--soft-deletes` ([H2.16](#h216-the-admin-panel-as-built)) |
| Middleware | `make artisan c="make:middleware SetPanelLocale"` |
| The small and large copies of the photos that lack them | `make exercises-thumbnails` ([H2.17.4](#h2174-the-copies-of-the-photos-already-there)) |
| The middleware a route really gets, in order | in tinker, `app('router')->gatherRouteMiddleware(app('router')->getRoutes()->match(Request::create('/api/user')))` |
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

The second part of BE-1 built the library's API on the tables of [H1.10](H1-database.md#h110-the-exercise-library-as-built). This section follows what was done, with the real output. It shows what [H2.2](#h22-an-endpoint-that-reads-from-start-to-finish) and [H2.3](#h23-an-endpoint-that-changes-data) do not: a list with filters and pages, a policy on a user's own rows, an action, translated columns written in one language, and sorting by name. The endpoints themselves are described in [C2.5.4](../concepts/C2-backend.md#c254-the-exercise-librarys-endpoints).

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
select * from "exercises" where ("owner_id" is null or "owner_id" = 4) and ((concat(' ', search_text, ' ') like '% panca%') or concat(' ', search_text, ' ') ~ ' p ?a ?n ?c ?a') and exists (select * from "muscles" inner join "exercise_muscle" on "muscles"."id" = "exercise_muscle"."muscle_id" where "exercises"."id" = "exercise_muscle"."exercise_id" and "slug" in ('chest', 'triceps') and "exercise_muscle"."role" = 'primary') and "owner_id" is not null and "exercises"."deleted_at" is null order by coalesce(name->>'it', name->>'en') collate "und-x-icu", "id" asc
```

What to look for in it:

- **The parentheses** around `owner_id is null or owner_id = 4`: they come from `where(fn …)`. Without them, `… or owner_id = 4 and concat(…) like …` would show someone else's exercise to anyone whose search matched. The search has its own parentheses, around its rules' `or`.
- **The search** is the one of [D3.4.6](../design/D3-data-model.md#d346-searching), since `feat/plan-editor-steps`: `search_text` holds every language, so `app()->setLocale('it')` changes only the sort. "panca" is one word of five letters, so rules A and C apply. (The output was redone then; the first version of this page showed the earlier search, `coalesce(name->>'it', name->>'en') ilike '%panca%'`.)
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

The first part of FEAT-2 built the plans' API on the tables of [H1.13](H1-database.md#h113-the-plan-tables-as-built). This section follows what was done, with the real output, as a tutorial for the next endpoint of this kind. It shows what [H2.12](#h212-the-exercise-library-api-as-built) does not: a request body shaped as a tree, a rule of our own, an abstract Form Request shared by two, an action that saves four levels in one transaction, routes for actions that are not CRUD, and a create that can be sent twice. The endpoints and the flow of a save are described in [C2.5.5](../concepts/C2-backend.md#c255-the-plans-endpoints), the validation in [C2.5.6](../concepts/C2-backend.md#c256-validating-nested-data).

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


## H2.14 The workouts API, as built

The first part of FEAT-3 built the server side of workout mode and Home, on three new tables ([H1.15](H1-database.md#h115-the-workout-tables-as-built)). The endpoints and the flow of a save are described in [C2.5.7](../concepts/C2-backend.md#c257-the-workouts-endpoints); this section is the doing, with the real output. It shows what H2.12 and H2.13 do not: a `PUT` that creates, a 410, links that are kept only if they still hold, a Form Request's `after()` check, a moment that lost an hour, totals as subqueries, and Postgres's `distinct on`.

| File | What it is |
|---|---|
| `routes/api.php` | Five `/sessions` routes, one by one, and `/home` |
| `app/Http/Controllers/WorkoutSessionController.php`, `HomeController.php` | The endpoints |
| `app/Http/Requests/SaveSessionRequest.php`, `ListSessionsRequest.php`, `LastSetsRequest.php` | The checks |
| `app/Actions/Workouts/SaveWorkoutSession.php`, `HomeSummary.php` | Saving a whole workout; Home's data |
| `app/Policies/WorkoutSessionPolicy.php` | Only the owner |
| `app/Http/Resources/WorkoutSessionResource.php`, `SessionExerciseResource.php`, `LoggedSetResource.php` | The JSON |
| `app/Models/Plan.php` | `suggestedDay()`, `lastDoneDayId()`, `workoutSessions()` |
| `lang/{en,it,es,de}/validation.php` | `date`, `after_or_equal`, `logged_value_mismatch`, the new fields' names |
| `tests/Feature/Workouts/` | Three files for the API, 29 tests |

### H2.14.1 Generate the files

```sh
make artisan c="make:policy WorkoutSessionPolicy --model=WorkoutSession"
make artisan c="make:request SaveSessionRequest"
make artisan c="make:request ListSessionsRequest"
make artisan c="make:request LastSetsRequest"
make artisan c="make:class Actions/Workouts/SaveWorkoutSession"
make artisan c="make:class Actions/Workouts/HomeSummary"
make artisan c="make:resource WorkoutSessionResource"
make artisan c="make:resource SessionExerciseResource"
make artisan c="make:resource LoggedSetResource"
make artisan c="make:controller WorkoutSessionController"
make artisan c="make:controller HomeController"
make artisan c="make:test Workouts/SaveSessionApiTest --pest"
make artisan c="make:test Workouts/SessionReadApiTest --pest"
make artisan c="make:test Workouts/HomeApiTest --pest"
```

```
INFO  Policy [app/Policies/WorkoutSessionPolicy.php] created successfully.
INFO  Request [app/Http/Requests/SaveSessionRequest.php] created successfully.
…
INFO  Controller [app/Http/Controllers/HomeController.php] created successfully.
INFO  Test [tests/Feature/Workouts/HomeApiTest.php] created successfully.
```

`make:controller` without `--api`: the methods are not those of a resource (no `store`, a `save` instead, a `lastSets`), so they are written by hand.

### H2.14.2 The routes

```php
Route::get('/sessions', [WorkoutSessionController::class, 'index']);
Route::get('/sessions/last-sets', [WorkoutSessionController::class, 'lastSets']);
Route::get('/sessions/{session}', [WorkoutSessionController::class, 'show'])->whereUuid('session');
Route::put('/sessions/{session}', [WorkoutSessionController::class, 'save'])->whereUuid('session');
Route::delete('/sessions/{session}', [WorkoutSessionController::class, 'destroy'])->whereUuid('session');
Route::get('/home', [HomeController::class, 'show']);
```

```sh
make artisan c="route:list --path=api/sessions"
```

```
GET|HEAD  api/sessions ...................... WorkoutSessionController@index
GET|HEAD  api/sessions/last-sets ......... WorkoutSessionController@lastSets
GET|HEAD  api/sessions/{session} ............. WorkoutSessionController@show
PUT       api/sessions/{session} ............. WorkoutSessionController@save
DELETE    api/sessions/{session} .......... WorkoutSessionController@destroy

                                                          Showing [5] routes
```

- **`whereUuid('session')`** limits `{session}` to UUIDs: `/api/sessions/12` is a 404 before any code runs, and `last-sets` can never be read as a session's id, whatever the order of the lines.
- **`show` and `destroy` type their parameter**, `WorkoutSession $session`, so route model binding loads the row (a soft-deleted one is a 404). **`save` takes `string $session`**: a new session has no row to load yet.

### H2.14.3 A check after the rules

Which values a set must have depends on its exercise's `logging_type`, which is in another table. No rule of Laravel reads another table that way, so `SaveSessionRequest` has an `after()` method:

```php
public function after(): array
{
    return [function (Validator $validator) {
        // How each exercise is logged, in one query
        $loggingTypes = Exercise::withTrashed()->whereIn('id', $ids)->pluck('logging_type', 'id');
        // … for each set, each value field:
        $validator->errors()->add($key, __('validation.logged_value_mismatch', ['attribute' => $name]));
    }];
}
```

- Laravel calls each function **after** the rules, **also when a rule failed**: the function must not trust the data, so it reads only whole numbers into its query, and `$loggingTypes->get($id)`, which gives `null` for an unknown id where `$loggingTypes[$id]` would warn.
- **`$validator->getDisplayableAttribute($key)`** gives the field's name in the request's language, from `lang/*/validation.php`, so the message reads "Il campo peso non si usa per come è registrato questo esercizio." in Italian.
- The new message is in the four files, English included, as for the superset rule ([H2.13.4](#h2134-a-rule-of-your-own)).

### H2.14.4 The save

`SaveWorkoutSession::save()` follows [C2.5.7](../concepts/C2-backend.md#c257-the-workouts-endpoints): find the UUID with `withTrashed()`, refuse someone else's with `throw new AuthorizationException` (Laravel answers 403, as for a policy), return `null` for a deleted one (the controller answers 410), keep only the plan links that still hold, then match exercises and sets by UUID and delete those not sent. Two lines worth reading:

```php
// ??= assigns only when the left side is null: an unknown UUID is a new session of this user
$session ??= $user->workoutSessions()->make(['id' => $id]);
```

```php
// The plan items sent that are still in one of the user's plans, in one query
PlanItem::query()->whereIn('plan_items.id', $sent)
    ->join('plan_days', 'plan_days.id', '=', 'plan_items.plan_day_id')
    ->join('plans', 'plans.id', '=', 'plan_days.plan_id')
    ->where('plans.user_id', $user->id)
    ->pluck('plan_items.id');
```

The second names every column with its table: three tables have an `id`.

### H2.14.5 The trap of the moments

The first test of a save failed:

```
⨯ it saves a new workout with the ids of the phone, and answers 201
Failed asserting that two strings are identical.
```

The phone sent `"started_at": "2026-11-09T18:00:00+01:00"`, 18:00 in Rome, 17:00 in UTC; the test read back 18:00 UTC. In tinker, inside a transaction undone at the end:

```php
> $s = WorkoutSession::factory()->create(['started_at' => '2026-11-09T18:00:00+01:00']);
> $s->getDateFormat();
"Y-m-d H:i:s"
> DB::table('workout_sessions')->where('id', $s->id)->value('started_at');
"2026-11-09 18:00:00+00"
> DB::selectOne('show timezone')->TimeZone . ' / ' . config('app.timezone');
"UTC / UTC"
```

Laravel reads the offset when it parses the text, but it writes a date with `getDateFormat()`, `Y-m-d H:i:s`, which has no offset: the hour 18:00 reaches Postgres alone, and Postgres, in UTC, stores 18:00 UTC. An hour late, silently. The fix is to move each moment to UTC before handing it to the model:

```php
private function utc(?string $moment): ?Carbon
{
    return $moment === null ? null : Carbon::parse($moment)->utc();
}
```

Then 18:00+01:00 becomes 17:00 UTC, written as `17:00:00`, and stored right. Every moment the phone sends goes through it: `started_at`, `finished_at`, each set's `completed_at`. Moments made on the server, such as `now()`, are already in UTC (`config/app.php`), which is why the plans never met this.

### H2.14.6 Totals and "last time" in the database

**Totals** are subqueries added by the scope `withTotals()`, one `selectSub()` each:

```php
$query->selectSub(fn (QueryBuilder $q) => $sets($q)
    ->selectRaw('coalesce(sum(logged_sets.weight_kg * logged_sets.reps), 0)'), 'volume_kg');
```

In tinker, `echo WorkoutSession::query()->withTotals()->toRawSql();` prints one `select` with three subqueries, `exercises_done`, `sets_done` and `volume_kg`, and the soft delete's `where "workout_sessions"."deleted_at" is null` at the end. The volume's part:

```sql
(select coalesce(sum(logged_sets.weight_kg * logged_sets.reps), 0) from "logged_sets"
  inner join "session_exercises" on "session_exercises"."id" = "logged_sets"."session_exercise_id"
  where "session_exercises"."workout_session_id" = "workout_sessions"."id"
  and "logged_sets"."set_type" != 'warm_up') as "volume_kg"
```

`whereColumn()` compares two columns instead of a column and a value: it ties the subquery to the session of the row being read. Postgres multiplies two `numeric(7,3)` into a value with six decimals, `640.000000`; the resource keeps three.

**Last time** keeps, for each exercise, the most recent row:

```php
DB::table('session_exercises')
    ->join('workout_sessions', …)
    ->selectRaw('distinct on (session_exercises.exercise_id) session_exercises.id, session_exercises.exercise_id, …')
    ->orderBy('session_exercises.exercise_id')
    ->orderByDesc('workout_sessions.started_at')
```

`distinct on (x)` is Postgres's: of the rows sorted by `x` and then by the next orders, it keeps the first of each `x`. Here: the newest workout of each exercise. The `order by` must start with the same column. This query uses `DB::table()`, not the model, so SoftDeletes does not apply: `whereNull('workout_sessions.deleted_at')` is written by hand ([D3.11](../design/D3-data-model.md#d311-traps-to-avoid)), and a test checks it.

### H2.14.7 Look at Home

In tinker, on the development database, a workout of Day A saved through the action, then Home's data, all inside `DB::beginTransaction()` … `DB::rollBack()`:

```php
> app(SaveWorkoutSession::class)->save($user, '0192f4a7-3c1e-7d2a-9b4f-8e6a1c5d3f30', [ /* Day A, two sets */ ]);
> echo json_encode(app(HomeSummary::class)->for($user), JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
```

The output, shortened, is the JSON of [C2.5.7](../concepts/C2-backend.md#c257-the-workouts-endpoints): the three days of Push Pull Legs with 36, 41 and 42 estimated minutes, `suggested_day_id` on Day B since Day A was done, and the workout among `recent_sessions` with `"volume_kg": "640.000"`: its warm-up of 40 × 10 left out, 80 × 8 counted.

### H2.14.8 The tests, and proving they can fail

```sh
make artisan c="test tests/Feature/Workouts"
```

```
PASS  Tests\Feature\Workouts\HomeApiTest
PASS  Tests\Feature\Workouts\SaveSessionApiTest
PASS  Tests\Feature\Workouts\SessionReadApiTest
PASS  Tests\Feature\Workouts\WorkoutTablesTest
Tests:    39 passed (134 assertions)
```

| File | Covers |
|---|---|
| `SaveSessionApiTest.php` | The five situations of D3.6.5 (new, again, someone else's, sets unticked, deleted elsewhere); the plan's links kept, emptied after a delete, never someone else's; the values for each way of logging; messages in Italian; the ids of another workout; dates and feeling; 404 and 401 |
| `SessionReadApiTest.php` | The list with totals and its filter; a whole workout; 403, 404 for a deleted one; deleting softly; last time, newest first, ignoring workouts in progress, deleted, skipped or someone else's |
| `HomeApiTest.php` | No active plan; the days with their estimate, the suggested day, the day done last; the workout left open; the recent workouts with their totals |
| `WorkoutTablesTest.php` | The tables without HTTP ([H1.15](H1-database.md#h115-the-workout-tables-as-built)) |

Three lines broken on purpose, then put back:

| Line changed | Test that failed |
|---|---|
| `->utc()` removed from `utc()` | `it saves a new workout with the ids of the phone, and answers 201` (the trap of H2.14.5) |
| `if ($session?->trashed()) return null;` removed | `it leaves a workout deleted elsewhere deleted, and answers 410`: `Expected response status code [410] but received 200.` The late send brought the workout back |
| `->whereNull('workout_sessions.deleted_at')` removed from last time | `it does not count a workout in progress, deleted, skipped or someone else's` |

**Errors met along the way:**

| Message | Cause | Fix |
|---|---|---|
| `Expected response status code [401] but received 422` | The test signed in with `actingAs()`, then expected a visitor: `actingAs()` holds for every request after it in the same test | The visitor's request first |
| (none: caught while writing) | `$this->lastDoneDayId()` inside the function given to `search()` would have run one query per day | Read once, before |

### H2.14.9 Later: last time before a workout (FEAT-4)

The summary and history compare each exercise of a workout with the last time it was done ([D1.4.10](../design/D1-ui.md#d1410-workout-summary), [D2.8](../design/D2-decisions.md#d28-workout-rules)): better, the same, lower. The summary does it on the phone, with the sets workout mode read at the start. History opens a workout days later, so `GET /api/sessions/{id}` sends them: `meta.last_sets`, the same shape as `GET /api/sessions/last-sets`, but counting only the workouts **before** the one shown. A workout's totals gained `reps_done`, the number the screens show instead of the volume.

```json
{ "data": { "id": "0192…", "day_name": "Day A – Push", "sets_done": 7, "reps_done": 56, "…": "…" },
  "meta": { "last_sets": [ { "exercise_id": 12, "session_id": "0192…", "started_at": "2026-11-09T18:00:00.000000Z", "sets": [ … ] } ] } }
```

**The files:**

| File | What changed |
|---|---|
| `app/Actions/Workouts/FindLastSets.php` (new) | The query of last time, moved out of the controller, with an optional `$before` |
| `app/Http/Controllers/WorkoutSessionController.php` | `lastSets()` calls the action; `show()` adds `meta.last_sets` with the resource's `additional()` |
| `app/Models/WorkoutSession.php` | `reps_done` in `withTotals()` |
| `app/Http/Resources/WorkoutSessionResource.php` | `reps_done`, when the query added it |
| `tests/Feature/Workouts/SessionReadApiTest.php` | One test of last time before a workout; `reps_done` checked in the list |

**One query, two uses.** The query was a method of the controller. A second caller is the moment to move it into an action ([C2.5.3](../concepts/C2-backend.md#c253-actions-the-work-outside-the-controller)), a class with one method that both call. Created by hand (Laravel has no `make:action`): `app/Actions/Workouts/FindLastSets.php`. The controller receives it as a parameter, and Laravel's container builds it:

```php
public function lastSets(LastSetsRequest $request, FindLastSets $lastSets): JsonResponse
{
    return response()->json(['data' => $lastSets->for($request->user(), $request->exerciseIds())]);
}
```

**"Before this workout"** is two conditions added only when a workout is given, with `when()`, which runs its function only when its first value is not null:

```php
->when($before, fn ($query, WorkoutSession $session) => $query
    ->where('workout_sessions.started_at', '<', $session->started_at)
    ->where('workout_sessions.id', '!=', $session->id))
```

Without `started_at <`, a workout opened weeks later would be compared with the newest workout, even one done after it.

**Reps in the totals:** one more subquery beside the others ([H2.14.6](#h2146-totals-and-last-time-in-the-database)), on the same sets without warm-ups; `coalesce(…, 0)` gives 0, not `null`, for a workout of timed sets only:

```php
->selectSub(fn (QueryBuilder $q) => $sets($q)->selectRaw('coalesce(sum(logged_sets.reps), 0)'), 'reps_done')
```

**The test** builds the bench press ten days ago (5 reps), three days ago (8, 8), in a workout deleted two days ago (12), today (8, 8, 8) and tomorrow (10), and a squat done today for the first time. Today's `meta.last_sets` must hold the bench press of three days ago only: not the deleted one, not tomorrow's, nothing for the squat. Read again, the workout of three days ago must get the one of ten days ago.

```sh
make artisan c="test tests/Feature/Workouts"
```

```
PASS  Tests\Feature\Workouts\HomeApiTest
PASS  Tests\Feature\Workouts\SaveSessionApiTest
PASS  Tests\Feature\Workouts\SessionReadApiTest
PASS  Tests\Feature\Workouts\WorkoutTablesTest
Tests:    41 passed (146 assertions)
```

**Proving it can fail:** the line `->where('workout_sessions.started_at', '<', $session->started_at)` removed, then put back:

```
FAILED  Tests\Feature\Workouts\SessionReadApiTest > it gives last time fo…
Failed asserting that two strings are identical.
➜  99▕         ->assertJsonPath('meta.last_sets.0.session_id', $before->id)
```

Without it, today's workout was compared with tomorrow's.

**A first version, replaced.** This section first added `meta.previous`: the last workout of the same day of the plan, with its totals, to compare a workout's whole volume. The first look at the summary showed that a workout's volume says little, and nothing for exercises done with the body alone ([D2.8](../design/D2-decisions.md#d28-workout-rules)). Comparing exercise by exercise needs sets, not totals, and works for a free workout too, which has no day. `previousOfSameDay()` and its test were removed. Its test had met one error worth keeping: it expected 640 kg for a workout of one set of 5 × 80 kg, a number copied from another test; the code was right, 400 kg. A failing test is first a question: is the code wrong, or the test?

---

## H2.15 Sign in with Google, as built

"Continue with Google" ([FEAT-9](../design/D1-ui.md#d141-sign-in-and-onboarding)) on the Laravel side: Socialite, the two routes the browser visits on its way to Google and back, and the action that finds, links or creates the user. How it works and why: [C2.7.8](../concepts/C2-backend.md#c278-signing-in-with-google). The table it writes: [H1.18](H1-database.md#h118-the-google-accounts-as-built). The button: [H3.28](H3-frontend.md#h328-continue-with-google-as-built). The Google credentials, which only the owner can create: [S1.11](../start/S1-setup.md#s111-sign-in-with-google-the-credentials).

| File | What |
|---|---|
| `composer.json`, `composer.lock` | `laravel/socialite` |
| `config/services.php` | `google`: id, secret, return address |
| `app/Enums/SocialSignInError.php` | The reasons sent back to React: `cancelled`, `failed`, `unverified`, `disabled` |
| `app/Exceptions/SocialSignInRefused.php` | Carries a reason from the action to the controller |
| `app/Actions/Auth/SignInWithSocialAccount.php` | Linked, same address, or new |
| `app/Http/Controllers/GoogleSignInController.php` | `redirect()` and `callback()` |
| `routes/web.php` | `/auth/google/redirect`, `/auth/google/callback` |
| `tests/Feature/Auth/GoogleSignInTest.php` | 21 tests, Google faked |

### H2.15.1 The order of building

1. **The package** (H2.15.2), then the database ([H1.18](H1-database.md#h118-the-google-accounts-as-built)).
2. **The files,** generated:

   ```sh
   docker compose exec backend php artisan make:enum SocialSignInError --string
   docker compose exec backend php artisan make:exception SocialSignInRefused
   docker compose exec backend php artisan make:class Actions/Auth/SignInWithSocialAccount
   docker compose exec backend php artisan make:controller GoogleSignInController
   docker compose exec backend php artisan make:test Auth/GoogleSignInTest --pest
   ```

   ```
      INFO  Enum [app/Enums/SocialSignInError.php] created successfully.
      INFO  Exception [app/Exceptions/SocialSignInRefused.php] created successfully.
      INFO  Class [app/Actions/Auth/SignInWithSocialAccount.php] created successfully.
      INFO  Controller [app/Http/Controllers/GoogleSignInController.php] created successfully.
      INFO  Test [tests/Feature/Auth/GoogleSignInTest.php] created successfully.
   ```

   `make:exception` made the folder `app/Exceptions/`, which did not exist yet: the app had no exception of its own before. Its stub extends `Exception`; ours extends `RuntimeException` and takes the reason in its constructor.
3. **The action, the controller, the routes,** then the tests, then proving they can fail.

### H2.15.2 The package

```sh
docker compose exec backend composer require laravel/socialite
```

```
./composer.json has been updated
Running composer update laravel/socialite
Lock file operations: 4 installs, 0 updates, 0 removals
  - Locking firebase/php-jwt (v7.2.1)
  - Locking laravel/socialite (v5.32.0)
  - Locking league/oauth1-client (v1.12.0)
  - Locking phpseclib/phpseclib (4.0.3)
…
No security vulnerability advisories found.
Using version ^5.32 for laravel/socialite
```

Nothing to publish or register: Laravel finds a package's service provider by itself when Composer installs it ("package discovery"; packages in general: [H2.8](#h28-adding-a-package)). Its settings live in `config/services.php`, under the name of each driver:

```php
'google' => [
    'client_id' => env('GOOGLE_CLIENT_ID'),
    'client_secret' => env('GOOGLE_CLIENT_SECRET'),
    'redirect' => env('FRONTEND_URL', 'http://localhost:5673').'/auth/google/callback',
],
```

The two variables were already in `backend/.env.example`, empty ([C2.10](../concepts/C2-backend.md#c210-configuration-and-env)). The return address is built, not written in `.env`: `FRONTEND_URL` comes from `compose.yaml`, so it is the address of S1.11.4 on both computers.

**On the other computer, after pulling:** `make setup`, which runs `composer install` (Socialite arrives) and the migrations. Without it, Socialite's code is not in `vendor/` and Laravel stops as H2.8 shows.

### H2.15.3 The routes: web.php, not api.php

```php
Route::get('/auth/google/redirect', [GoogleSignInController::class, 'redirect'])->name('google.redirect');
Route::get('/auth/google/callback', [GoogleSignInController::class, 'callback'])->name('google.callback');
```

```sh
docker compose exec backend php artisan route:list --path=auth/google
```

```
  GET|HEAD       auth/google/callback google.callback › GoogleSignInControlle…
  GET|HEAD       auth/google/redirect google.redirect › GoogleSignInControlle…
```

Two reasons for `web.php`, both in [C2.7.8](../concepts/C2-backend.md#c278-signing-in-with-google): the browser visits them (it does not `fetch()` them), and Socialite keeps its `state` in the session, which the `web` group starts. Under `/api` they would also get Sanctum's checks for fetch calls, meant for something else. The prefix `/auth`, not `/api/auth`, keeps them apart from Fortify's JSON routes; Vite forwards it ([H3.28.2](H3-frontend.md#h3282-the-proxy)).

### H2.15.4 The controller and the action

- **`redirect()`** saves `from` (only if it is a path of this app) and `locale` (only one of ours) in the session, then `return Socialite::driver('google')->redirect();`. Without credentials in `.env` it stays in the app instead: back to `/login?error=failed`, and a line in the log (H2.15.7).
- **`callback()`** takes them back with `session()->pull()`, turns `?error=access_denied` into `cancelled`, calls `Socialite::driver('google')->user()` inside a `try` (any exception: `report($e)` and `failed`), hands the person to the action, then `Auth::login($user, remember: true)` and `session()->regenerate()`, and sends the browser to `FRONTEND_URL` plus `from`.
- **`SignInWithSocialAccount::handle()`** looks for the Google id in `social_accounts` first; then, if Google says `email_verified`, for the address in `users`; then creates the user. It throws `SocialSignInRefused` with `unverified` or `disabled`, and the controller turns the reason into `/login?error=…`.

**Where `email_verified` is.** Not a method of Socialite's user: it is in the raw answer of Google's `userinfo`, `$outside->getRaw()['email_verified']`. Socialite's Google driver also copies it into a key `verified_email`, marked in its code as kept for old versions; the action reads Google's own name.

**The return type of `redirect()`.** `Socialite::driver()->redirect()` is declared as Symfony's `RedirectResponse`, the class Laravel's extends; the method is typed with Symfony's (imported `as AnyRedirect`) so both its returns fit.

### H2.15.5 The test: Google faked

```php
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;

Socialite::fake('google', SocialiteUser::fake([
    'id' => '109876543210987654321',
    'name' => 'Ann Example',
    'email' => 'ann@example.com',
    'email_verified' => true,
]));

$this->withSession(['google_sign_in' => ['from' => '/plans', 'locale' => 'it']])
    ->get('/auth/google/callback')
    ->assertRedirect(config('app.frontend_url').'/plans');
```

- **`Socialite::fake()`** replaces the driver (its code: `vendor/laravel/socialite/src/Testing/FakeProvider.php`): `redirect()` goes to `https://socialite.fake/google/authorize`, `user()` returns the person given, with no `state` check and no call to Google. A function instead of a person runs at `user()`: `fn () => throw new InvalidStateException` is how the test of a refused visit is written.
- **`SocialiteUser::fake([...])`** puts every key in the raw data too, so `email_verified` is found where the action looks for it.
- **`withSession([...])`** writes what the first stop would have kept, so the callback can be tested alone.
- **The credentials** are set in `beforeEach()` with `config([...])`, so the tests pass on a computer with them in `.env` and on one without.
- **`->with([...])`** runs one test for each value: the five `from` that must be thrown away (`https://evil.example/plans`, `//evil.example`, `/\evil.example`, a line break, `plans`).

```sh
docker compose exec backend php artisan test --filter=GoogleSignIn
```

```
  ✓ the way to Google → it sends the browser to Google, keeping the pag…
  ✓ the way to Google → it keeps only a path of this app, and only one… (×5)
  ✓ the way to Google → it stays in the app when Google is not set up o…
  ✓ back from Google → it creates an account for a new address and sign…
  ✓ back from Google → it lands on Home when no page was asked for
  ✓ back from Google → it signs the same Google account into the same u…
  ✓ back from Google → it finds a linked account by its Google id, even…
  ✓ back from Google → it links Google to an account that already has t…
  ✓ back from Google → it refuses an address Google has not verified, a…
  ✓ back from Google → it creates no account for an address Google has…
  ✓ back from Google → it refuses a disabled account, linked or not (×2)
  ✓ back from Google → it says the person cancelled on Google's page
  ✓ back from Google → it says something went wrong for any other error…
  ✓ back from Google → it says something went wrong when Socialite refu…
  ✓ an account without a password → it cannot be signed into with an em…
  ✓ an account without a password → it goes with its user

  Tests:    21 passed (82 assertions)
```

### H2.15.6 Proving the tests can fail

All 21 passed at the first run, which proves nothing by itself. For a moment, two checks removed: `if (! $this->isVerified($outside))` became `if (false)` in the action, and `'from' => $this->safePath(…)` kept the query as it came:

```
  ⨯ the way to Google → it keeps only a path of this app, and only one… (×5)
  ⨯ back from Google → it refuses an address Google has not verified, a…
  ⨯ back from Google → it creates no account for an address Google has…
  Tests:    7 failed, 14 passed (78 assertions)
```

Both put back: 21 passed. (The copy kept to put the action back had gone to `/tmp/claude-501/` rather than the folder meant; `git diff` on the file, before and after, is the quicker way to be sure a change is undone.)

### H2.15.7 Checking it for real

With the credentials of [S1.11](../start/S1-setup.md#s111-sign-in-with-google-the-credentials) in `backend/.env` and `docker compose restart backend`:

1. `make start`, http://localhost:5673/login in a private window, **Continue with Google**.
2. Google's account chooser, "to continue to AtleoPlan"; pick a test user (S1.11.3).
3. Back on Home, signed in. In TablePlus ([H4](H4-database-tools.md)): a row in `social_accounts` with the user's id, `google` and the long id.
4. Profile → **Sign out**, then **Continue with Google** again: Google may not even ask, and the same user comes back (no second row).
5. **Cancel** on Google's page: back on the sign-in page, "Signing in with Google was cancelled".

**Without the credentials** (the Mac, until S1.11.5 is done there), the button comes straight back with "Signing in with Google didn't work", and `make logs` (or `storage/logs/laravel.log`) has the warning `redirect()` writes:

```
Sign in with Google is not set up: GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are missing from backend/.env (docs/start/S1-setup.md S1.11).
```

The test "stays in the app when Google is not set up" covers the redirect; this whole list has not yet been tried in a browser (the credentials were not on the Mac where it was built), so the first try is the check of the feature.

Any other `failed` leaves the exception in the same log, from `report($e)`: `invalid_client` (a wrong secret), `InvalidStateException` (a callback opened twice, or after the session expired). What Google itself shows on its own page, such as `redirect_uri_mismatch`, is in [S1.11.7](../start/S1-setup.md#s1117-when-it-does-not-work).

### H2.15.8 The checks

```sh
docker compose exec backend vendor/bin/pint
docker compose exec backend php artisan test
```

```
  PASS   ......................................................... 182 files
  Tests:    290 passed (17559 assertions)
```

---

## H2.16 The admin panel, as built

The admin panel's first two real screens: the public exercise library (BE-1, `feat/exercise-admin`) and the users (BE-2), built on one branch. How they work and why: [C2.8](../concepts/C2-backend.md#c28-admin-panel-filament) and [C2.7.9](../concepts/C2-backend.md#c279-a-disabled-account-is-signed-out-at-once). The small example of [H2.4](#h24-an-admin-screen) is the starting point; this section adds what a real screen needed.

| File | What it is |
|---|---|
| `app/Filament/Resources/Exercises/ExerciseResource.php` | The screen: public exercises only, its own permissions, labels in the admin's language |
| `app/Filament/Resources/Exercises/Schemas/ExerciseForm.php` | The form: a tab per language, the exercise's data, its source |
| `app/Filament/Resources/Exercises/Tables/ExercisesTable.php` | The list: photo, name, equipment, muscles, logging type, languages to review; search and filters |
| `app/Filament/Resources/Exercises/Pages/*.php` | List, create, edit; the last two through the action |
| `app/Actions/Exercises/SavePublicExercise.php` | Saving: every language, the review flags, the muscles |
| `app/Filament/Resources/Users/UserResource.php`, `Pages/ListUsers.php`, `Tables/UsersTable.php` | The users: a list with four row actions |
| `app/Actions/Users/ChangeUserAccess.php` | Admin or not, enabled or not; never on yourself |
| `app/Http/Middleware/SetPanelLocale.php` | The panel in the admin's language |
| `app/Http/Middleware/SignOutDisabledAccount.php` | A disabled user signed out at their next request |
| `app/Providers/Filament/AdminPanelProvider.php` | `SetPanelLocale`, persistent |
| `bootstrap/app.php` | `SignOutDisabledAccount` on `web` and `api`, and in the priority list |
| `lang/{en,it,es,de}/admin.php` | The panel's labels |
| `tests/Feature/Admin/*.php`, `tests/Feature/Auth/DisabledAccountTest.php` | 32 tests |
| `config/app.php`, `compose.yaml` | `admin_url`, from `ADMIN_URL`: where the panel is |
| `app/Http/Resources/UserResource.php` | `admin_url` in `GET /api/user`, for admins |
| `app/Http/Controllers/GoogleSignInController.php` | `to=admin`: back to the panel |
| `resources/views/filament/google-sign-in.blade.php` | "Continue with Google" under the panel's login form |
| `frontend/src/pages/ProfilePage.tsx`, `src/api/auth.ts`, `src/i18n/locales/*.json` | The Administration card on Profile |

**After pulling this branch on another computer:** `docker compose up -d`, which recreates the backend container with `ADMIN_URL` (the default is the same address, so nothing breaks without it). No migration. To open the panel, an admin account: [C2.8](../concepts/C2-backend.md#c28-admin-panel-filament).

### H2.16.1 Generate the files

```sh
docker compose exec backend php artisan make:filament-resource Exercise --soft-deletes --record-title-attribute=name
docker compose exec backend php artisan make:filament-resource User --record-title-attribute=email
docker compose exec backend php artisan make:class Actions/Exercises/SavePublicExercise
docker compose exec backend php artisan make:class Actions/Users/ChangeUserAccess
docker compose exec backend php artisan make:middleware SetPanelLocale
docker compose exec backend php artisan make:middleware SignOutDisabledAccount
```

```
   INFO  Filament resource [App\Filament\Resources\Exercises\ExerciseResource] created successfully.
   INFO  Filament resource [App\Filament\Resources\Users\UserResource] created successfully.
   INFO  Class [app/Actions/Exercises/SavePublicExercise.php] created successfully.
   INFO  Class [app/Actions/Users/ChangeUserAccess.php] created successfully.
   INFO  Middleware [app/Http/Middleware/SetPanelLocale.php] created successfully.
   INFO  Middleware [app/Http/Middleware/SignOutDisabledAccount.php] created successfully.
```

- **Without `--generate`:** the form and the table come out empty (`->components([ // ])`). The exercises' columns are JSON in four languages and a pivot table, which `--generate` would have turned into one text field each; it was quicker to write them.
- **`--soft-deletes`** adds the Deleted filter, Restore and Force delete actions, and lets the edit page open a deleted row (`getRecordRouteBindingEloquentQuery()` without `SoftDeletingScope`).
- **`make:filament-resource` and `ExerciseResource`:** the API already had `App\Http\Resources\ExerciseResource`. Two classes with one short name in two namespaces is allowed; each file imports the one it means.

### H2.16.2 The exercise screen: adjusting what was generated

**1. Public only.** Two methods of the resource, one for the list, one for the edit page's URL:

```php
public static function getEloquentQuery(): Builder
{
    return parent::getEloquentQuery()->whereNull('owner_id');
}
```

**2. Its own permissions.** As generated, every Edit and Delete was refused: Filament found `ExercisePolicy::update()`, which says no to public exercises. One method replaces the policy for this screen:

```php
public static function getAuthorizationResponse(string|UnitEnum $action, ?Model $record = null): Response
{
    if (in_array($name, ['forceDelete', 'forceDeleteAny', 'replicate', 'reorder'], true)) {
        return Response::deny();
    }
    return $record === null || $record->isPublic() ? Response::allow() : Response::deny();
}
```

Filament calls it with the action's name (`viewAny`, `create`, `update`, `delete`, `restore`…). The generated Force delete actions were removed from the edit page and the bulk menu too.

**3. The form by language.** Each tab's fields in a `Group` with `statePath("translations.{$locale}")` ([C2.8.2](../concepts/C2-backend.md#c282-the-exercise-library-screen)). The edit page swaps Filament's fill and save for the action's:

```php
protected function mutateFormDataBeforeFill(array $data): array
{
    return SavePublicExercise::formState($this->record);   // the texts by language, the muscles by role
}

protected function handleRecordUpdate(Model $record, array $data): Model
{
    return app(SavePublicExercise::class)->update($record, $data);
}
```

and the create page `handleRecordCreation()`. The state the action receives:

```php
['translations' => ['en' => ['name' => 'Plank', 'aliases' => [], 'description' => null,
                             'instructions' => ['…', '…']],
                    'it' => [..., 'reviewed' => true], 'es' => [...], 'de' => [...]],
 'logging_type' => 'time', 'equipment_id' => 2, 'youtube_url' => null,
 'primary_muscles' => [1], 'secondary_muscles' => [6]]
```

**4. The list.** `searchable(query: fn ($query, $search) => $query->search($search))` makes the search box use the library's search; `defaultSort(fn ($query) => $query->orderByName())` its order; `modifyQueryUsing(fn ($query) => $query->with(['equipment', 'muscles', 'media']))` loads the relations once for the page. The photo's address is built from the request's (`url($path)`), not from `APP_URL`, which inside the container says port 8000 while the browser is on 8500.

### H2.16.3 The users screen

Only the list was kept: `Pages/CreateUser.php`, `Pages/EditUser.php` and `Schemas/UserForm.php` were deleted, `getPages()` lists only `index`, and `getAuthorizationResponse()` allows only `viewAny` and `view`. The four actions are written once by a helper of `UsersTable` and differ by a closure:

```php
Action::make('disable')
    ->requiresConfirmation()
    ->modalDescription(fn (User $record) => __('admin.users.disable_confirm', ['name' => $record->name]))
    ->visible(fn (User $record) => $record->disabled_at === null && ChangeUserAccess::canChange(auth()->user(), $record))
    ->action(fn (User $record) => app(ChangeUserAccess::class)->setDisabled(auth()->user(), $record, true));
```

**Error met: every Artisan command broken.** The three files were deleted before `UserResource::getPages()` stopped naming them, and the next command failed at once:

```
   Error

  Class "App\Filament\Resources\Users\Pages\CreateUser" not found

  at app/Filament/Resources/Users/UserResource.php:46
  ➜  46▕             'create' => CreateUser::route('/create'),
```

Filament registers the panel's routes when the app starts, Artisan included, so a resource that names a missing class stops everything. Change the resource first, delete the files after.

### H2.16.4 The panel's language

The labels are in `lang/en/admin.php` and, with the same keys, `it`, `es` and `de`. A quick check that no key is missing in a language, from `backend/`:

```sh
for l in it es de; do diff <(grep -o "'[a-z_]*' =>" lang/en/admin.php) <(grep -o "'[a-z_]*' =>" lang/$l/admin.php) && echo "$l ok"; done
```

`SetPanelLocale` sets the language from `users.locale`, and is listed in the panel provider with `isPersistent: true`, so the Livewire requests a page makes after loading (a filter, a save) are answered in the same language ([C2.8.1](../concepts/C2-backend.md#c281-the-panels-language)).

### H2.16.5 The middleware and the priority list

`SignOutDisabledAccount` was first only appended to the `web` and `api` groups, like `SetLocaleFromRequest`. Its test failed: a disabled user still got a 200.

```
  ⨯ it signs them out of every route, not only /api/user
  Expected response status code [401] but received 200.
```

The order the route really gets, in tinker:

```sh
docker compose exec -T backend php artisan tinker --execute '
$r = app("router"); $route = $r->getRoutes()->match(Illuminate\Http\Request::create("/api/user"));
print_r($r->gatherRouteMiddleware($route));'
```

```
    [0] => Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful
    [1] => Illuminate\Auth\Middleware\Authenticate:sanctum
    [2] => Illuminate\Routing\Middleware\SubstituteBindings
    [3] => App\Http\Middleware\SetLocaleFromRequest
    [4] => App\Http\Middleware\SignOutDisabledAccount
```

Authentication ran first, so the user was let in before being signed out. `route:list -v` shows only `api` and `Authenticate:sanctum`: it does not open the groups, nor sort them. The fix in `bootstrap/app.php`:

```php
$middleware->prependToPriorityList(AuthenticatesRequests::class, SignOutDisabledAccount::class);
```

and the same tinker line then gives:

```
    [0] => Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful
    [1] => App\Http\Middleware\SignOutDisabledAccount
    [2] => Illuminate\Auth\Middleware\Authenticate:sanctum
    [3] => Illuminate\Routing\Middleware\SubstituteBindings
    [4] => App\Http\Middleware\SetLocaleFromRequest
```

### H2.16.6 The tests

```sh
docker compose exec backend php artisan test tests/Feature/Admin tests/Feature/Auth/DisabledAccountTest.php
```

```
   PASS  Tests\Feature\Admin\ExerciseAdminTest
  ✓ it lists the public exercises and never the personal ones
  ✓ it searches as the library does, in every language
  ✓ it filters the exercises still machine translated in a language
  ✓ it creates a public exercise from the form
  ✓ it requires an English name
  ✓ it opens an exercise by language and saves a reviewed translation
  ✓ it does not open a personal exercise
  ✓ it deletes an exercise softly, and restores it
  ✓ it offers no delete for good
  ✓ it speaks the admin's language
  ✓ it keeps the screen closed to a user who is not an admin
   PASS  Tests\Feature\Admin\SavePublicExerciseTest
  ✓ … 8 tests of the action
   PASS  Tests\Feature\Admin\UserAdminTest
  ✓ it lists every user
  ✓ it makes a user an admin, and back
  ✓ it disables an account, and enables it
  ✓ it shows only the actions that make sense for a row
  ✓ it offers no action on the admin's own row
  ✓ it refuses an admin's change to their own account with ('admin')
  ✓ it refuses an admin's change to their own account with ('disabled')
  ✓ it offers no way to create, edit or delete a user
  ✓ it keeps the screen closed to a user who is not an admin
   PASS  Tests\Feature\Auth\DisabledAccountTest
  ✓ it signs out a user disabled since signing in
  ✓ it signs them out of every route, not only /api/user
  ✓ it leaves an enabled user signed in
  ✓ it lets a disabled user still reach the public routes, as a visitor
  Tests:    32 passed (113 assertions)
```

**Testing a Filament page.** A page is a Livewire component: `Livewire::test(ListExercises::class)` renders it in memory as the user of `actingAs()`, and Filament adds the methods to drive it:

```php
Livewire::test(ListExercises::class)->searchTable('panca')->assertCanSeeTableRecords([$bench]);
Livewire::test(ListExercises::class)->filterTable('to_review_in', 'it');
Livewire::test(CreateExercise::class)->fillForm(['translations.en.name' => 'Hollow Rock'])->call('create')->assertHasNoFormErrors();
Livewire::test(EditExercise::class, ['record' => $plank->getRouteKey()])->assertSchemaStateSet(['translations.it.reviewed' => false]);
Livewire::test(EditExercise::class, ['record' => $plank->getRouteKey()])->callAction(DeleteAction::class);
Livewire::test(ListUsers::class)->callAction(TestAction::make('disable')->table($user));   // a row's action
```

**Errors met in the tests**, each a fact worth knowing:

| Message | Cause | Fix |
|---|---|---|
| `"data.translations.en.instructions.0.step" => ["The step field is required."]` | Inside the form, a simple repeater keeps each item as `['step' => '…']`, its field's name; only the saved state is a plain list | `fillForm(['translations.en.instructions' => [['step' => 'Lie on your back.'], ['step' => 'Rock.']]])` |
| `Failed asserting that two arrays are identical`: `en, es, it` for `en, it, es` | Postgres stores `jsonb` with its keys sorted its own way (shorter first, then alphabetically) | `toEqualCanonicalizing()`, which ignores the order |
| A list of steps kept the base's first step | `array_replace_recursive()` merges lists item by item: `[]` over `['a']` leaves `['a']` | A helper of the test that merges named keys and replaces lists (`overForm()`) |
| `Expected response status code [401] but received 200`, after signing in through the route | A test keeps one app for all its requests; its guards keep the user read at sign-in, still enabled. A real request reads it again | `$this->app['auth']->forgetGuards()` before the next request |

**Proving a test can fail.** `offers no delete for good` first only checked that the edit page has no Force delete button, and passed with the permission removed: the button was absent for another reason. It now also asks the resource, `ExerciseResource::canForceDelete($plank)`, and with `'forceDelete'` taken out of the refused list it fails:

```
  ⨯ it offers no delete for good
  Failed asserting that true is false.
```

### H2.16.7 Check it in the browser

1. http://localhost:8500/admin, signed in as an admin. The panel is in the account's language (on Profile in the app).
2. **Libreria esercizi:** search "panca"; filter **Da rivedere in → Italiano**; open an exercise: the tabs, the switch **Rivisto da una persona** off, **Originale inglese** folded under each translation. Turn the switch on, Save: the exercise leaves the filter.
3. **Utenti:** the ⋮ menu of another user; your own row has none, and says "Tu".
4. Disable a test account signed in in another browser: its next click in the app opens the sign-in page, and signing in says the account is disabled.

Without a browser, the pages can be rendered in tinker as an admin, on the development data:

```sh
docker compose exec -T backend php artisan tinker --execute '
auth()->guard("web")->setUser(App\Models\User::where("is_admin", true)->first());
$r = app()->handle(Illuminate\Http\Request::create("/admin/exercises/545/edit"));
echo $r->getStatusCode(), " ", substr_count($r->getContent(), "Rivisto da una persona"), PHP_EOL;'
```

```
200 3
```

(three tabs with the switch: Italian, Spanish, German; 545 is Plank's id on that database).

### H2.16.8 The way in: the link and Google on the panel's login

Found by trying it: the owner, signed up with Google and made admin in the database, saw nothing. The panel was at `localhost:8500/admin`, no link led there, `localhost:5673/admin` is not forwarded by Vite, and the panel's login wants a password the account does not have. Three changes ([C2.8.4](../concepts/C2-backend.md#c284-the-way-in-a-link-and-google-on-the-panels-login)):

**1. Where the panel is, as a setting.** In `config/app.php`, next to `frontend_url`:

```php
'admin_url' => env('ADMIN_URL', 'http://localhost:8500/admin'),
```

and in `compose.yaml`, with the other development settings, `ADMIN_URL: http://localhost:${APP_PORT:-8500}/admin`. `UserResource` adds `'admin_url' => $this->is_admin ? config('app.admin_url') : null`.

**2. The link on Profile.** `admin_url: string | null` in the `User` type of `src/api/auth.ts` (and `admin_url: null` in the tests' `testUser`), then in `ProfilePage.tsx` a card drawn only when it is there, with an `<a target="_blank" rel="noopener">` inside `<Button asChild>`; four keys in each `src/i18n/locales/*.json` under `profile` ([C1.13.8](../concepts/C1-frontend.md#c1138-the-link-to-the-admin-panel)).

**3. Google on the panel's login.** A Blade view, `resources/views/filament/google-sign-in.blade.php`, inserted by a render hook in `AdminPanelProvider`; the list of Filament's hooks is in `vendor/filament/filament/src/View/PanelsRenderHook.php` (`AUTH_LOGIN_FORM_AFTER` is the place under the login form). Its texts are `admin.google.*` in the four `lang/*/admin.php`, the same sentences as the React app's. Filament's stylesheet is built in advance, so a Tailwind class it does not use does nothing in our view: the few styles are inline, with Filament's colour variables (`var(--danger-600)`). In `GoogleSignInController`, `to=admin` is kept in the session as `admin: true`, and the callback ends on `config('app.admin_url')` for an admin, or on `…/admin/login?google_error=<reason>` for an error.

**Checking the login page without a browser,** as a visitor whose browser asks for Italian:

```sh
docker compose exec -T backend php artisan tinker --execute '
$req = Illuminate\Http\Request::create("/admin/login?google_error=cancelled"); $req->headers->set("Accept-Language", "it");
$r = app()->handle($req); $h = $r->getContent();
echo $r->getStatusCode(), " | button:", substr_count($h, "Continua con Google"), " | error:", substr_count($h, "Accesso con Google annullato"), PHP_EOL;'
```

```
200 | button:1 | error:1
```

**The tests.** Two in `GoogleSignInTest` already checked the session's exact content (`['from' => '/plans', 'locale' => 'it']`) and failed once it gained `admin`; they now include `'admin' => false`. New:

```
  ✓ it gives an admin the address of the admin panel
  ✓ from the admin panel → it remembers that the visit started on the p… (×3: admin, an address, another word)
  ✓ from the admin panel → it takes an admin back to the panel
  ✓ from the admin panel → it takes someone who is not an admin into th…
  ✓ from the admin panel → it brings an error back to the panel's login…
  ✓ from the admin panel → it shows the button, and the error, on the p…
  ✓ from the admin panel → it hides the button when Google is not set u…
```

and in `ProfilePage.test.tsx`, `links an admin to the admin panel, in a new tab` and `shows no admin panel to anyone else`.

**A flaky test fixed on the way.** `make check` failed twice in this work, and once before it on another branch, on `ProfilePage.test.tsx › goes to the sign-in form even if the session had already ended`; alone it always passed. Its fake server kept saying the user was signed in after signing out, so the sign-in page sent them back to Profile, sometimes before the test looked ([C1.13.6](../concepts/C1-frontend.md#c1136-testing-a-screen-with-the-api)). With a fake that remembers signing out, four full runs in a row passed: `for i in 1 2 3 4; do npx vitest run | grep "Tests "; done` in `frontend/`.

**In the browser:** signed in to the app as an admin, Profile → Administration → **Open**: the panel in a new tab, already signed in. Signed out, http://localhost:8500/admin/login → **Continua con Google** → Google → the panel.

---

## H2.17 The photos of an exercise, as built

`feat/exercise-media`, the last part of BE-1: the photos of personal exercises through the API, their two WebP copies, Duplicate as mine, and the photos of public exercises in the admin panel. How it works: [C2.5.9](../concepts/C2-backend.md#c259-the-photos-of-an-exercise); the React side: [H3.30](H3-frontend.md#h330-the-photos-of-an-exercise-as-built).

| File | What it is |
|---|---|
| `app/Models/Exercise.php` | `registerMediaConversions()`: `thumb` 400 px, `large` 1600 px, WebP; `photos` without HEIC |
| `app/Http/Resources/ExercisePhotoResource.php` | A photo: `id`, `url`, `thumb_url`; `pathOf()` moved here from ExerciseResource |
| `app/Http/Resources/ExerciseResource.php` | `photos` as ExercisePhotoResource |
| `app/Actions/Exercises/ExercisePhotos.php` | Add, remove, reorder; `MAX = 5` |
| `app/Actions/Exercises/DuplicateExercise.php` | Duplicate as mine |
| `app/Http/Requests/StoreExercisePhotoRequest.php`, `ReorderExercisePhotosRequest.php` | The rules |
| `app/Http/Controllers/ExercisePhotoController.php`, `ExerciseController.php` (`duplicate`) | The endpoints |
| `app/Policies/ExercisePolicy.php` | `duplicate()`: public exercises only |
| `routes/api.php` | Four routes |
| `lang/{en,it,es,de}/validation.php` | `too_many_photos`, `photo_order`; in it/es/de also Laravel's `image`, `mimes`, `max.file`, `uploaded` |
| `app/Filament/Resources/Exercises/Schemas/ExerciseForm.php`, `Tables/ExercisesTable.php`, `lang/*/admin.php` | The panel's photo field; the list's small copy |
| `composer.json`, `composer.lock` | filament/spatie-laravel-media-library-plugin |
| `Makefile` | `ARTISAN_NOW`; `exercises-thumbnails`; `exercises-import` converts at once |
| `tests/Feature/ExerciseLibrary/ExercisePhotosTest.php` | 17 tests; `ExerciseApiTest` and `ExerciseAdminTest` adjusted |

**After pulling this branch on another computer:** `make setup` (it installs the new package), then `make exercises-thumbnails` (about 5 minutes for the imported library). No migration: `media` already had every column.

### H2.17.1 Generate the files

```sh
docker compose exec -T backend php artisan make:resource ExercisePhotoResource
docker compose exec -T backend php artisan make:controller ExercisePhotoController
docker compose exec -T backend php artisan make:request StoreExercisePhotoRequest
docker compose exec -T backend php artisan make:request ReorderExercisePhotosRequest
docker compose exec -T backend php artisan make:class Actions/Exercises/ExercisePhotos
docker compose exec -T backend php artisan make:class Actions/Exercises/DuplicateExercise
```

```
   INFO  Resource [app/Http/Resources/ExercisePhotoResource.php] created successfully.
```

and the same line for each. **Error met:** written as a shell `for` loop over the six commands, piped to `grep INFO`, they created nothing and ended with `Exit code 1` (the cause was not found). Chained with `&&` and piped to `tail -1` they worked, but showed only the blank line that ends their output, so they looked silent; running one again said `ERROR  Controller already exists.` Run generators one by one, unpiped, and check with `ls`.

**The trap of the generated Form Request** ([H2.3.6](#h236-the-trap-of-the-generated-authorize)): both had `authorize()` returning `false`, which answers 403 to everyone. Removed: the controller asks the policy.

### H2.17.2 The package for the panel

```sh
docker compose exec -T backend composer require filament/spatie-laravel-media-library-plugin:"^5.11" -W
```

```
  ⇂ public/js/filament/filament/app.js
  …
   INFO  Successfully published assets!
   INFO  Successfully upgraded!
No security vulnerability advisories found.
```

- **`^5.11`**, the version of Filament itself: the plugin is part of the same release.
- **`-W`** ("with all dependencies") lets Composer update the packages the new one shares with others. It took the plugin at v5.11.1, as Filament, and also updated a few packages within their allowed versions, among them laravel/framework to 13.42.0 and spatie/laravel-medialibrary to 11.23.12: the whole suite ran green after. Without `-W`, a shared dependency locked at an older version can make the install fail.
- **`git diff composer.json`** shows the one line added; `composer.lock` the exact versions.

### H2.17.3 The conversions, and the photo's JSON

In `Exercise`:

```php
public function registerMediaConversions(?Media $media = null): void
{
    $this->addMediaConversion('thumb')->fit(Fit::Max, 400, 400)->format('webp')->performOnCollections('photos');
    $this->addMediaConversion('large')->fit(Fit::Max, 1600, 1600)->format('webp')->performOnCollections('photos');
}
```

`ExercisePhotoResource` sends `getUrl('thumb')` once `hasGeneratedConversion('thumb')` is true, `getUrl()` (the original) before, and keeps only the path. On the development database, for Plank:

```sh
docker compose exec -T backend php artisan tinker --execute '
auth()->guard("web")->setUser(App\Models\User::first());
$r = app()->handle(Illuminate\Http\Request::create("/api/exercises/545", "GET", [], [], [], ["HTTP_ACCEPT" => "application/json"]));
echo json_encode(json_decode($r->getContent(), true)["data"]["photos"], JSON_UNESCAPED_SLASHES), PHP_EOL;'
```

```
[{"id":1077,"url":"/storage/1077/conversions/0-large.webp","thumb_url":"/storage/1077/conversions/0-thumb.webp"},{"id":1078,…}]
```

### H2.17.4 The copies of the photos already there

```sh
make exercises-thumbnails
```

```
docker compose exec -e QUEUE_CONVERSIONS_BY_DEFAULT=false backend php artisan media-library:regenerate --only-missing
 1746/1746 [▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓] 100%

All done!
```

5 minutes 15 seconds on the Mac. `-e QUEUE_CONVERSIONS_BY_DEFAULT=false` (the Makefile's `ARTISAN_NOW`) makes the copies inside the command: queued, they would be 3,492 jobs for `queue:listen`, which starts Laravel again for each. The result, measured in the container:

```sh
docker compose exec -T backend sh -c 'find storage/app/public -name "*-thumb.webp" -exec du -cb {} + | tail -1'
```

| Files | Total |
|---|---|
| The 1,746 originals (JPEG) | 98.7 MB |
| Their `large` copies (WebP) | 66.3 MB |
| Their `thumb` copies (WebP) | 20.7 MB, about 12 KB each |

### H2.17.5 The tests

```sh
docker compose exec backend php artisan test --filter=ExercisePhotosTest
```

```
  ✓ adding → it adds a photo, answering with the original, then sends i…
  ✓ adding → it makes the thumbnail at most 400 px, keeping the proport…
  ✓ adding → it sends the photos with the exercise, first one first
  ✓ adding → it refuses what is not a photo it can read with dataset "a HEIC photo"
  ✓ adding → it refuses what is not a photo it can read with dataset "a PDF"
  ✓ adding → it refuses what is not a photo it can read with dataset "a photo over 10 MB"
  ✓ adding → it refuses a sixth photo, with a message
  ✓ ordering and removing → it puts the photos in a new order, the cove…
  ✓ ordering and removing → it refuses an order that leaves a photo out…
  ✓ ordering and removing → it removes a photo with its files
  ✓ ordering and removing → it answers 404 for a photo of another exerc…
  ✓ who may → it refuses someone else's exercise and a public one with ('public')
  ✓ who may → it refuses someone else's exercise and a public one with ('someone else's')
  ✓ who may → it answers 401 to a visitor
  ✓ Duplicate as mine → it copies a public exercise as mine, in my lang…
  ✓ Duplicate as mine → it falls back to English when my language is mi…
  ✓ Duplicate as mine → it refuses my own exercise
  Tests:    17 passed
```

- **`Storage::fake('public')`** puts the disk in a temporary folder; **`UploadedFile::fake()->image('IMG_4032.JPG', 1200, 900)`** makes a real JPEG of that size; `getimagesize()` then reads the thumbnail's: `[400, 300]`.
- **A file is sent with `post()`, not `postJson()`**, which cannot carry one; the `Accept: application/json` header asks for JSON errors.
- **The queue runs at once in the tests** (`QUEUE_CONNECTION=sync`), so the copies exist when the request ends.

**Errors met:**

| Message | Cause | Fix |
|---|---|---|
| `Failed asserting that two strings are identical.` `'/storage/1/conversions/photo-large.webp'` for `'/storage/1/photo.jpg'` | The upload's answer is built from the Media object `addMedia()` returned; the job filled `generated_conversions` on another copy of the row. In real use the job has not even run yet | The test expects the original in the answer, and the copies when the exercise is read again: the behaviour C2.5.9 describes |
| A public exercise's reorder answered 422, not 403 | `'ids' => ['required', …]` refused the empty list before the controller asked the policy | `present` instead of `required`: `[]` is a valid order for an exercise with no photos, and the request reaches the policy |
| `ExerciseApiTest`: `'/storage/1/conversions/0-large.webp' matches PCRE pattern "#^/storage/\d+/0\.jpg$#"` failed | That test still expected the original | The pattern now expects the `large` copy, and `thumb_url` too |

**The panel's field**, in `ExerciseAdminTest`: `fillForm(['photos' => [UploadedFile::fake()->image('plank.jpg', 800, 600)]])` then `call('save')`, and the photo has its `thumb`.

### H2.17.6 Check it

1. `make exercises-thumbnails` if the library was imported before this branch.
2. The app: the library's covers are now WebP files of a few KB (the browser's developer tools, Network tab, filter `thumb`).
3. One of your exercises → Edit → **Add photos**: the bar, then the photo as the cover; a moment later its address ends in `-thumb.webp` (the `queue` container made it: `make logs s=queue`).
4. A public exercise → **Duplicate as mine**: the editor of the copy, its photos with it.
5. The admin panel → an exercise → **Photos**: upload, drag, remove.

---

← [H1. Database: how to](H1-database.md) · [Contents](../README.md) · [H3. Frontend: how to](H3-frontend.md) →
