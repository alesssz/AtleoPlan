<?php

namespace App\Exceptions;

// Imports: the list of reasons, and PHP's base class for errors found while running
use App\Enums\SocialSignInError;
use RuntimeException;

/**
 * Thrown by app/Actions/Auth/SignInWithSocialAccount.php when it will not sign
 * the person in, with the reason; GoogleSignInController catches it and sends
 * the browser back to `/login?error=<reason>`.
 *
 * An exception is an object that stops the code where it is `throw`n and jumps
 * to the nearest `catch` for its class, skipping everything in between: here,
 * from deep in the action straight to the controller, with no `if` at every
 * step. One that nobody catches becomes a 500 error and a line in the log.
 * Created with `php artisan make:exception SocialSignInRefused`
 * (docs/how-to/H2-backend.md H2.15.1); it extends RuntimeException, PHP's
 * class for errors that depend on the data rather than on a bug.
 */
class SocialSignInRefused extends RuntimeException
{
    /**
     * `public readonly` in the constructor's parameters both declares the
     * property and fills it ("constructor promotion"): `$e->reason` reads it,
     * nobody can change it.
     *
     * @param  SocialSignInError  $reason  why, as the React app is told
     */
    public function __construct(public readonly SocialSignInError $reason)
    {
        // The message, for the log if it ever gets there
        parent::__construct("Signing in with an outside account was refused: {$reason->value}");
    }
}
