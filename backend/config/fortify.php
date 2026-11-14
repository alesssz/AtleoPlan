<?php

/**
 * Fortify's settings; the app's hooks are in FortifyServiceProvider.
 */

use Laravel\Fortify\Features;

return [
    // The guard Sanctum reads and the admin panel signs in with too
    'guard' => 'web',

    'passwords' => 'users',

    'username' => 'email',
    'email' => 'email',

    // Postgres compares text exactly: ANN@x.com and ann@x.com must be one account
    'lowercase_usernames' => true,

    'home' => '/',

    // Not plain /login, which is a React page; Vite and Caddy forward only /api
    // to Laravel
    'prefix' => 'api/auth',

    'domain' => null,

    'middleware' => ['web'],

    // Defined in FortifyServiceProvider
    'limiters' => [
        'login' => 'login',
    ],

    // The React app draws every screen
    'views' => false,

    // The rest stays off until a feature needs it
    'features' => [
        Features::registration(),
        Features::resetPasswords(),
    ],
];
