<?php

/**
 * The JSON API used by the React app, every route prefixed with /api.
 *
 * A route ties an HTTP method and a URL to the code that answers it
 * (docs/05-backend.md 5.5). bootstrap/app.php loads this file with the /api
 * prefix and the "api" middleware group, so `Route::get('/health', ...)` here
 * answers GET /api/health. `make routes` (`php artisan route:list`) lists
 * every route of the app.
 *
 * Requests from the React app are authenticated with Sanctum's session
 * cookie (SPA mode, bootstrap/app.php; docs/05-backend.md 5.7); a route under
 * `auth:sanctum` answers 401 to a visitor who is not signed in.
 *
 * For now the routes answer with inline functions; real endpoints will use
 * controllers in app/Http/Controllers (docs/03-conventions.md 3.2).
 */

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
 * Liveness check, public: proves the whole chain answers (browser → Vite
 * or Caddy → Laravel). Shown in the app's Profile page
 * (frontend/src/api/health.ts, docs/04-frontend.md 4.6).
 *
 * Route is a facade: a class whose static calls (Route::get) Laravel passes
 * to the router object it keeps in the service container. The second argument
 * is the code to run, here an arrow function (`fn () => ...`, a one-expression
 * function that returns its value); response()->json() builds a JSON
 * response with status 200. name() gives the route a name, so code can build
 * its URL with route('health') instead of writing it.
 */
Route::get('/health', fn () => response()->json(['status' => 'ok']))->name('health');

// The signed-in user (installed by `install:api`); used by sign-in (FEAT-1).
// Laravel sees the `Request $request` parameter and passes in the current
// request (the service container fills parameters by their type). Returning
// a model sends it as JSON, without the columns User marks as hidden.
// middleware('auth:sanctum') lets only signed-in users through (401 otherwise).
Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');
