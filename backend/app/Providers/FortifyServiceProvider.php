<?php

namespace App\Providers;

use App\Actions\Fortify\CreateNewUser;
use App\Actions\Fortify\ResetUserPassword;
use App\Models\User;
use App\Support\ActionEmail;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Fortify;

/**
 * Fortify serves sign-up, sign-in, sign-out and password reset with no views:
 * the React app draws the screens. Confirming the address is the app's own
 * (EmailVerificationController).
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

        $this->configureEmails();
    }

    /**
     * The two emails of signing in, drawn by App\Support\ActionEmail. The
     * texts are keyed by their English in lang/{it,es,de}.json.
     */
    private function configureEmails(): void
    {
        // The confirmation link, on the React app's address like the reset
        // link: the browser's host, which Laravel does not see behind the
        // proxy, so the signature covers only the path (EmailVerificationController)
        VerifyEmail::createUrlUsing(fn (User $user): string => config('app.frontend_url').URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes($this->verificationMinutes()),
            ['id' => $user->getKey(), 'hash' => sha1($user->getEmailForVerification())],
            absolute: false,
        ));

        VerifyEmail::toMailUsing(fn (User $user, string $url): MailMessage => ActionEmail::make(
            subject: __('Confirm your email address'),
            preview: __('One tap, and your AtleoPlan account is ready.'),
            eyebrow: __('One last step'),
            title: __('Confirm your email address'),
            intro: __('Welcome to AtleoPlan! Confirm that :email is your address to start planning and logging your workouts.', ['email' => $user->email]),
            email: $user->email,
            button: __('Confirm the address'),
            url: $url,
            note: __('The link works for :count minutes. If you did not create an account, ignore this email: nothing will be done with your address.', ['count' => $this->verificationMinutes()]),
        ));

        // The reset link opens the React screen (src/pages/ResetPasswordPage.tsx),
        // not a Laravel page; urlencode() keeps a "+" in the address intact
        ResetPassword::toMailUsing(fn (User $user, string $token): MailMessage => ActionEmail::make(
            subject: __('Reset your password'),
            preview: __('Choose a new password for your AtleoPlan account.'),
            eyebrow: __('Forgot your password?'),
            title: __('Choose a new password'),
            intro: __('Someone, hopefully you, asked to choose a new password for the AtleoPlan account of :email.', ['email' => $user->email]),
            email: $user->email,
            button: __('Choose a new password'),
            url: sprintf('%s/reset-password?token=%s&email=%s', config('app.frontend_url'), $token, urlencode($user->email)),
            note: __('The link works once and for :count minutes. If you did not ask for it, ignore this email: your password stays as it is.', [
                'count' => config('auth.passwords.'.config('auth.defaults.passwords').'.expire'),
            ]),
        ));
    }

    private function verificationMinutes(): int
    {
        return (int) config('auth.verification.expire', 60);
    }
}
