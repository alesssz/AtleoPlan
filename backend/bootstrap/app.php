<?php

/**
 * Builds the Laravel application: the one object that handles every web
 * request (public/index.php) and every Artisan command (artisan).
 *
 * This file has no class: it is a plain script that `return`s a value, and
 * whoever loads it with `require` receives that value, here the configured
 * Application (docs/05-backend.md 5.4). Laravel 11+ keeps most of the app's
 * wiring here, where older versions had a Kernel class: which route files to
 * load, which middleware to add, how to report errors. The service providers
 * are listed apart, in bootstrap/providers.php.
 */

// Imports: the classes used below, by their short names (docs/05-backend.md 5.2)
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

// Application::configure() is a static call: `::` calls a method on the class
// itself, with no object needed yet. `basePath:` is a named argument; __DIR__
// is this file's folder (bootstrap/), so dirname(__DIR__) is backend/, the
// root every other path (app/, config/, storage/) is resolved from. Each
// `->with...()` call then adds one piece and returns the builder, and
// `->create()` at the end produces the Application.
return Application::configure(basePath: dirname(__DIR__))
    // The route files (docs/05-backend.md 5.5). web.php gets the "web"
    // middleware (session, cookies, CSRF); api.php gets the "api" middleware
    // and the /api prefix on every route; console.php defines Artisan
    // commands; /up is Laravel's built-in health check, answering 200 when the
    // app boots. `.` joins strings in PHP.
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    // Middleware are the steps a request passes through before and after its
    // route (docs/05-backend.md 5.4). This anonymous function (a "closure")
    // is called by Laravel with the Middleware settings object; `: void`
    // means it returns nothing.
    ->withMiddleware(function (Middleware $middleware): void {
        // Sanctum's SPA mode: requests to /api from the React app (an address
        // listed in SANCTUM_STATEFUL_DOMAINS) are authenticated with the
        // session cookie, CSRF-protected; other clients, such as the future
        // mobile app, use API tokens (docs/02-decisions.md 2.2,
        // docs/05-backend.md 5.7).
        $middleware->statefulApi();
    })
    // How errors are turned into responses
    ->withExceptions(function (Exceptions $exceptions): void {
        // Errors under /api, or asked for in JSON (Accept: application/json),
        // are answered as JSON (e.g. {"message": "Unauthenticated."} with a
        // 401) rather than as an HTML error page, so the React app can read
        // them. `fn (...) => expr` is an arrow function: a one-expression
        // closure that returns that expression.
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
