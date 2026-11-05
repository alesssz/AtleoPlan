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
 * Connects Fortify to this app.
 *
 * Fortify is Laravel's sign-in backend: it brings the routes and controllers of
 * signing up, in and out and of resetting a password, with no screens of its
 * own (`views` is off in config/fortify.php; the React app draws them). What it
 * cannot know about this app is set here. docs/05-backend.md 5.7 explains
 * each step, with Fortify and by hand.
 *
 * A service provider runs when the app starts (app/Providers/AppServiceProvider.php
 * explains them); this one is listed in bootstrap/providers.php.
 */
class FortifyServiceProvider extends ServiceProvider
{
    /** How many times a minute one email from one address may try to sign in. */
    private const LOGIN_ATTEMPTS_PER_MINUTE = 5;

    /**
     * Runs once every provider has registered, so all services are available.
     */
    public function boot(): void
    {
        // Our two actions: what to do when someone signs up or resets a password
        Fortify::createUsersUsing(CreateNewUser::class);
        Fortify::resetUserPasswordsUsing(ResetUserPassword::class);

        // How to check an email and a password. Replaces Fortify's own check to
        // add one rule: a disabled account cannot sign in (1.4.15).
        Fortify::authenticateUsing(function (Request $request) {
            // The user with this email, or null. Fortify has already turned
            // the email to lowercase (CanonicalizeUsername)
            $user = User::where('email', $request->input('email'))->first();

            // No such user, or the wrong password. Hash::check() hashes what was
            // typed and compares it with the stored hash: a password is never
            // decrypted, because a hash cannot be
            if (! $user || ! Hash::check((string) $request->input('password'), $user->password)) {
                // null means "wrong credentials": Fortify answers 422 with auth.failed
                return null;
            }

            // Only someone who knows the password learns that the account is disabled
            if ($user->disabled_at !== null) {
                throw ValidationException::withMessages(['email' => __('auth.disabled')]);
            }

            return $user;
        });

        // Slows down password guessing: the route answers 429 above this limit.
        // The key is what is counted: this email from this address, so an
        // attacker cannot lock someone else out from another address.
        // Str::transliterate() turns accented letters into plain ones, so the
        // same email cannot be counted twice under two spellings.
        RateLimiter::for('login', function (Request $request) {
            $throttleKey = Str::transliterate(Str::lower((string) $request->input('email')).'|'.$request->ip());

            return Limit::perMinute(self::LOGIN_ATTEMPTS_PER_MINUTE)->by($throttleKey);
        });

        // The link in the "forgot password" email. By default Laravel points it
        // at a page of its own, which we do not have: it must open the React
        // screen /reset-password instead (src/pages/ResetPasswordPage.tsx).
        // urlencode() keeps characters such as + in an email address intact
        // in the link.
        ResetPassword::createUrlUsing(fn (User $user, string $token): string => sprintf(
            '%s/reset-password?token=%s&email=%s',
            config('app.frontend_url'),
            $token,
            urlencode($user->email),
        ));
    }
}
