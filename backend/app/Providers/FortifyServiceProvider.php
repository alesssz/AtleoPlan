<?php

namespace App\Providers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\ResetUserPassword;
use App\Models\User;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Fortify;

/**
 * Fortify serves sign-up, sign-in, sign-out and password reset with no views:
 * the React app draws the screens.
 */
class FortifyServiceProvider extends ServiceProvider
{
    /** Per email and IP address. */
    private const LOGIN_ATTEMPTS_PER_MINUTE = 5;

    /** Requests to any of Fortify's routes, per address, or per user once signed in. */
    public const AUTH_REQUESTS_PER_MINUTE = 30;

    public const AUTH_REQUESTS_PER_HOUR = 300;

    public function boot(): void
    {
        Fortify::createUsersUsing(CreateNewUser::class);
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);

        // Fortify's own check, plus one rule: a disabled account cannot sign
        // in. The email arrives lowercased (CanonicalizeUsername)
        Fortify::authenticateUsing(function (Request $request) {
            $user = User::where('email', $request->input('email'))->first();

            if (! $user || ! Hash::check((string) $request->input('password'), $user->password)) {
                return null;
            }

            // Only someone who knows the password learns that the account is disabled
            if ($user->disabled_at !== null) {
                throw ValidationException::withMessages(['email' => __('auth.disabled')]);
            }

            return $user;
        });

        // Keyed by email and IP, so an attacker cannot lock someone out from
        // another address; transliterated, so one email cannot be counted
        // under two spellings
        RateLimiter::for('login', function (Request $request) {
            $throttleKey = Str::transliterate(Str::lower((string) $request->input('email')).'|'.$request->ip());

            return Limit::perMinute(self::LOGIN_ATTEMPTS_PER_MINUTE)->by($throttleKey);
        });

        // On every Fortify route (config/fortify.php's middleware). By address:
        // one address could otherwise try 5 passwords a minute on each of any
        // number of accounts, and sign up or ask for reset emails without
        // end. By user once signed in, for confirming the password: a stolen
        // session can be used from any address. Each limit has its own key,
        // or the two would share one count
        RateLimiter::for('fortify', function (Request $request) {
            $by = (string) ($request->user()?->getAuthIdentifier() ?? $request->ip());

            return [
                Limit::perMinute(self::AUTH_REQUESTS_PER_MINUTE)->by('minute:'.$by),
                Limit::perHour(self::AUTH_REQUESTS_PER_HOUR)->by('hour:'.$by),
            ];
        });

        // The reset link opens the React screen (src/pages/ResetPasswordPage.tsx),
        // not a Laravel page; urlencode() keeps a "+" in the address intact
        ResetPassword::createUrlUsing(fn (User $user, string $token): string => sprintf(
            '%s/reset-password?token=%s&email=%s',
            config('app.frontend_url'),
            $token,
            urlencode($user->email),
        ));
    }
}
