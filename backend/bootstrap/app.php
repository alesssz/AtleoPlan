<?php

use App\Http\Middleware\SetLocaleFromRequest;
use App\Http\Middleware\SignOutDisabledAccount;
use Illuminate\Contracts\Auth\Middleware\AuthenticatesRequests;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // The React app signs in with the session cookie; other clients, such
        // as a future mobile app, will use API tokens
        $middleware->statefulApi();

        // Both groups: Fortify's routes are on `web`, the others on `api`
        $middleware->web(append: [SetLocaleFromRequest::class]);
        $middleware->api(append: [SetLocaleFromRequest::class]);

        // Signs out a disabled user at the next request, not when the session
        // ends
        $middleware->web(append: [SignOutDisabledAccount::class]);
        $middleware->api(append: [SignOutDisabledAccount::class]);
        // A middleware missing from the priority list runs after
        // `auth:sanctum`, which would already have let the user in
        $middleware->prependToPriorityList(AuthenticatesRequests::class, SignOutDisabledAccount::class);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
