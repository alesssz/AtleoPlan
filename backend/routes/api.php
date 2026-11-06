<?php

/**
 * The JSON API used by the React app, every route prefixed with /api.
 *
 * A route ties an HTTP method and a URL to the code that answers it
 * (docs/concepts/C2-backend.md C2.5). bootstrap/app.php loads this file with the /api
 * prefix and the "api" middleware group, so `Route::get('/health', ...)` here
 * answers GET /api/health. `make routes` (`php artisan route:list`) lists
 * every route of the app.
 *
 * Requests from the React app are authenticated with Sanctum's session
 * cookie (SPA mode, bootstrap/app.php; docs/concepts/C2-backend.md C2.7); a route under
 * `auth:sanctum` answers 401 to a visitor who is not signed in.
 *
 * One-line answers use an inline function; anything longer uses a controller
 * in app/Http/Controllers (docs/project/P1-conventions.md P1.2). Signing in, up and out
 * and resetting a password are not here: Fortify registers them under
 * /api/auth (config/fortify.php, docs/concepts/C2-backend.md C2.7).
 */

use App\Http\Controllers\CurrentUserController;
use App\Http\Controllers\EquipmentController;
use App\Http\Controllers\ExerciseController;
use App\Http\Controllers\MuscleController;
use Illuminate\Support\Facades\Route;

/*
 * Liveness check, public: proves the whole chain answers (browser → Vite
 * or Caddy → Laravel). Shown in the app's Profile page
 * (frontend/src/api/health.ts, docs/concepts/C1-frontend.md C1.6).
 *
 * Route is a facade: a class whose static calls (Route::get) Laravel passes
 * to the router object it keeps in the service container. The second argument
 * is the code to run, here an arrow function (`fn () => ...`, a one-expression
 * function that returns its value); response()->json() builds a JSON
 * response with status 200. name() gives the route a name, so code can build
 * its URL with route('health') instead of writing it.
 */
Route::get('/health', fn () => response()->json(['status' => 'ok']))->name('health');

// Everything inside this group needs a signed-in user: 401 otherwise.
// `[Controller::class, 'method']` names the method that answers the route.
Route::middleware('auth:sanctum')->group(function () {
    // Who is signed in; the React app asks at start-up
    Route::get('/user', [CurrentUserController::class, 'show']);
    // Saves the language or the theme on the account
    Route::patch('/user/preferences', [CurrentUserController::class, 'updatePreferences']);

    // The exercise library (docs/concepts/C2-backend.md C2.5.4): the two
    // fixed lists its filters and editor use, then the exercises themselves
    Route::get('/muscles', [MuscleController::class, 'index']);
    Route::get('/equipment', [EquipmentController::class, 'index']);
    // apiResource(): the five routes of a resource in one line, each tied to
    // the controller method of the same name: GET /exercises (index),
    // POST /exercises (store), GET /exercises/{exercise} (show),
    // PUT|PATCH /exercises/{exercise} (update), DELETE /exercises/{exercise}
    // (destroy). Their names are exercises.index, exercises.store…
    Route::apiResource('exercises', ExerciseController::class);
});
