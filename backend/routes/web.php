<?php

/**
 * Routes for web pages rendered by Laravel itself (docs/concepts/C2-backend.md C2.5).
 *
 * bootstrap/app.php loads this file with the "web" middleware group (cookies,
 * session, CSRF protection) and no prefix. AtleoPlan's pages are the React
 * app and the Filament panel, which registers its own /admin routes
 * (app/Providers/Filament/AdminPanelProvider.php), so the only route here is
 * Laravel's default home page.
 */

use Illuminate\Support\Facades\Route;

// GET / shows Laravel's welcome page. Route is a facade (a static-looking call
// that Laravel passes to its router); view('welcome') renders the Blade
// template resources/views/welcome.blade.php into HTML.
Route::get('/', function () {
    return view('welcome');
});
