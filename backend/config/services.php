<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Resend, Postmark, AWS, and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    /*
     * Sign in with Google (FEAT-9), read by Laravel Socialite: its Google
     * driver looks for `services.google` and these three keys by name.
     * docs/concepts/C2-backend.md C2.7.8.
     *
     * - client_id, client_secret: the OAuth client the owner created in the
     *   Google Cloud Console (docs/start/S1-setup.md S1.11), written in
     *   backend/.env on each computer, never committed. Empty here means
     *   "not set up": GoogleSignInController then sends people back to the
     *   sign-in page with an error, and says why in the log.
     * - redirect: where Google sends people back, the React app's address
     *   plus the callback's path. Built from FRONTEND_URL (set in
     *   compose.yaml, C2.10) rather than written in .env, so it cannot drift
     *   from the address given to Google in S1.11.4. env() and not
     *   config('app.frontend_url'): a config file cannot read another one
     *   while the configuration is being loaded. Same default as config/app.php.
     */
    'google' => [
        'client_id' => env('GOOGLE_CLIENT_ID'),
        'client_secret' => env('GOOGLE_CLIENT_SECRET'),
        'redirect' => env('FRONTEND_URL', 'http://localhost:5673').'/auth/google/callback',
    ],

];
