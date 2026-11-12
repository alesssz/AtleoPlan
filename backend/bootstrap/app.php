<?php

/**
 * Builds the Laravel application: the one object that handles every web
 * request (public/index.php) and every Artisan command (artisan).
 *
 * This file has no class: it is a plain script that `return`s a value, and
 * whoever loads it with `require` receives that value, here the configured
 * Application (docs/concepts/C2-backend.md C2.4). Laravel 11+ keeps most of the app's
 * wiring here, where older versions had a Kernel class: which route files to
 * load, which middleware to add, how to report errors. The service providers
 * are listed apart, in bootstrap/providers.php.
 */

// Imports: the classes used below, by their short names (docs/concepts/C2-backend.md C2.2)
use App\Http\Middleware\SetLocaleFromRequest;
use App\Http\Middleware\SignOutDisabledAccount;
use Illuminate\Contracts\Auth\Middleware\AuthenticatesRequests;
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
    // The route files (docs/concepts/C2-backend.md C2.5). web.php gets the "web"
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
    // route (docs/concepts/C2-backend.md C2.4). This anonymous function (a "closure")
    // is called by Laravel with the Middleware settings object; `: void`
    // means it returns nothing.
    ->withMiddleware(function (Middleware $middleware): void {
        // Sanctum's SPA mode: requests to /api from the React app (an address
        // listed in SANCTUM_STATEFUL_DOMAINS) are authenticated with the
        // session cookie, CSRF-protected; other clients, such as the future
        // mobile app, use API tokens (docs/design/D2-decisions.md D2.2,
        // docs/concepts/C2-backend.md C2.7).
        $middleware->statefulApi();

        // Answers in the language the React app asks for. Both groups, because
        // Fortify's sign-in routes are on `web` and the others on `api`
        $middleware->web(append: [SetLocaleFromRequest::class]);
        $middleware->api(append: [SetLocaleFromRequest::class]);

        // A user disabled by an admin is signed out at their next request,
        // not when their session ends (BE-2, docs/concepts/C2-backend.md C2.7.9).
        // Both groups, for the same reason as above
        $middleware->web(append: [SignOutDisabledAccount::class]);
        $middleware->api(append: [SignOutDisabledAccount::class]);
        // Laravel sorts a route's middleware by a priority list, whatever
        // order they were added in: the session first, authentication
        // (`auth:sanctum`, whose class implements AuthenticatesRequests)
        // before most others. A middleware not in the list keeps its place
        // after those that are, so this one would run after `auth:sanctum`
        // had already let the user in. It must run before, between the
        // session and authentication (docs/how-to/H2-backend.md H2.16.5)
        $middleware->prependToPriorityList(AuthenticatesRequests::class, SignOutDisabledAccount::class);
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
