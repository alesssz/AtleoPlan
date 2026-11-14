<?php

namespace App\Exceptions;

use App\Enums\SocialSignInError;
use RuntimeException;

/**
 * Thrown by SignInWithSocialAccount when it will not sign the person in;
 * GoogleSignInController turns the reason into `/login?error=<reason>`.
 */
class SocialSignInRefused extends RuntimeException
{
    public function __construct(public readonly SocialSignInError $reason)
    {
        parent::__construct("Signing in with an outside account was refused: {$reason->value}");
    }
}
