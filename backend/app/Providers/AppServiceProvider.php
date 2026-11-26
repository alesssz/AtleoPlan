<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use Spatie\Translatable\Facades\Translatable;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Requests a minute to the signed-in API. Well above a person's use: Home
     * and the read-ahead of a plan's days make a dozen at once, and a queue of
     * workouts goes one request each.
     */
    public const API_PER_MINUTE = 180;

    /**
     * A personal exercise's photo files a minute: the read-ahead of a plan
     * asks for both sizes of every photo at once.
     */
    public const PHOTO_FILES_PER_MINUTE = 600;

    /**
     * Photo uploads and duplicates, which copy and convert up to five photos
     * each: disk and queue are what an abuse would fill.
     */
    public const UPLOADS_PER_MINUTE = 30;

    public const UPLOADS_PER_DAY = 500;

    /** Plan imports, each up to 420 exercises and 8,400 sets. */
    public const IMPORTS_PER_HOUR = 20;

    /** A password's shortest length, at sign-up and reset alike. */
    public const PASSWORD_MIN_LENGTH = 10;

    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        // A text missing in the current language falls back to English, then to
        // any language there is: a personal exercise written only in Italian
        // must not have an empty name for a German reader
        Translatable::fallback(fallbackLocale: 'en', fallbackAny: true);

        $this->configureRateLimiting();

        // Length over rules of letters and symbols, which make passwords
        // harder to remember, not to guess. In production, also not one seen
        // in a data leak: Have I Been Pwned is asked by range, so only the
        // first five characters of the password's SHA-1 leave the server, and
        // an answer that does not come lets the password through. Not in
        // development or tests, which would depend on the network
        Password::defaults(fn () => $this->app->isProduction()
            ? Password::min(self::PASSWORD_MIN_LENGTH)->uncompromised()
            : Password::min(self::PASSWORD_MIN_LENGTH));
    }

    /**
     * Per user, so that one account cannot slow the others, nor several people
     * behind one address (a gym's Wi-Fi) share a count. The routes are behind
     * `auth:sanctum`, so a user is always there; the address is a fallback.
     * Each limit of a pair has its own key, or the two would share one count.
     */
    private function configureRateLimiting(): void
    {
        $by = fn (Request $request): string => (string) ($request->user()?->getAuthIdentifier() ?? $request->ip());

        RateLimiter::for('api', fn (Request $request) => Limit::perMinute(self::API_PER_MINUTE)->by($by($request)));

        RateLimiter::for('photo-files', fn (Request $request) => Limit::perMinute(self::PHOTO_FILES_PER_MINUTE)->by($by($request)));

        RateLimiter::for('uploads', fn (Request $request) => [
            Limit::perMinute(self::UPLOADS_PER_MINUTE)->by('minute:'.$by($request)),
            Limit::perDay(self::UPLOADS_PER_DAY)->by('day:'.$by($request)),
        ]);

        RateLimiter::for('imports', fn (Request $request) => Limit::perHour(self::IMPORTS_PER_HOUR)->by($by($request)));
    }
}
