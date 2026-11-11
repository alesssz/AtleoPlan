<?php

/**
 * Routes the browser visits itself, rather than the React app calling them
 * with fetch() (docs/concepts/C2-backend.md C2.5).
 *
 * bootstrap/app.php loads this file with the "web" middleware group (cookies,
 * session, CSRF protection) and no prefix. AtleoPlan's pages are the React
 * app and the Filament panel, which registers its own /admin routes
 * (app/Providers/Filament/AdminPanelProvider.php), so what is here is
 * Laravel's default home page and the two stops of signing in with Google.
 */

use App\Http\Controllers\GoogleSignInController;
use Illuminate\Support\Facades\Route;

/*
 * Sign in with Google (FEAT-9, docs/concepts/C2-backend.md C2.7.8). Here and
 * not in api.php because they are browser visits on the way to Google and
 * back, which need the session for Socialite's `state`, and answer with
 * redirects. Vite (and Caddy in production) forward /auth to Laravel like
 * /api. The callback's full address, http://localhost:5673/auth/google/callback,
 * is the one listed in the Google client (docs/start/S1-setup.md S1.11.4):
 * changing this path means changing it there too.
 */
Route::get('/auth/google/redirect', [GoogleSignInController::class, 'redirect'])->name('google.redirect');
Route::get('/auth/google/callback', [GoogleSignInController::class, 'callback'])->name('google.callback');

// GET / shows Laravel's welcome page. Route is a facade (a static-looking call
// that Laravel passes to its router); view('welcome') renders the Blade
// template resources/views/welcome.blade.php into HTML.
Route::get('/', function () {
    return view('welcome');
});
