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
