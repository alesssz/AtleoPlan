<?php

/**
 * The settings of Fortify, Laravel's sign-in backend (docs/05-backend.md 5.7).
 * How it is connected to this app: app/Providers/FortifyServiceProvider.php.
 * A config file returns an array, read with config('fortify.prefix') (5.10).
 */

use Laravel\Fortify\Features;

return [
    // The session guard: how a signed-in user is remembered between requests.
    // The same one Sanctum reads (config/sanctum.php) and Filament signs in with
    'guard' => 'web',

    // The password broker: the settings of reset tokens (config/auth.php)
    'passwords' => 'users',

    // Which fields of a request hold the username and the email
    'username' => 'email',
    'email' => 'email',

    // ANN@x.com and ann@x.com are one account: Postgres compares text exactly,
    // so emails are turned to lowercase when signing up, in and resetting
    'lowercase_usernames' => true,

    // Where to send a user who is already signed in and opens a guest-only route
    'home' => '/',

    // Every route starts with this: /api/auth/login and so on. Not plain /login,
    // which is a React page; and Vite and Caddy forward only /api to Laravel
    // (docs/04-frontend.md 4.1).
    'prefix' => 'api/auth',

    // No subdomain of its own
    'domain' => null,

    // The session, its cookies and CSRF protection, as any signed-in web page
    'middleware' => ['web'],

    // The rate limit of signing in, defined in FortifyServiceProvider
    'limiters' => [
        'login' => 'login',
    ],

    // No HTML pages from Fortify: the React app draws every screen, and Fortify
    // answers in JSON
    'views' => false,

    // What Fortify switches on. The others (email verification, two-factor,
    // passkeys, profile and password changes) are off until a feature needs them
    'features' => [
        Features::registration(),
        Features::resetPasswords(),
    ],
];
