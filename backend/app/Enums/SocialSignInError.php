<?php

namespace App\Enums;

/**
 * Why signing in with Google failed, sent back as `/login?error=<value>`. The
 * frontend lists the same values in src/components/GoogleSignIn.tsx. The codes
 * are deliberately vague: none of them tells an attacker whether an email has
 * an account.
 */
enum SocialSignInError: string
{
    /** The person pressed Cancel on Google's page, or closed the consent. */
    case Cancelled = 'cancelled';

    /**
     * Anything else: the `state` check failed, Google could not be reached,
     * wrong credentials. The details go to the log only.
     */
    case Failed = 'failed';

    /** Google does not vouch for the address (`email_verified` is false). */
    case Unverified = 'unverified';

    /** The account was disabled by an admin. */
    case Disabled = 'disabled';
}
