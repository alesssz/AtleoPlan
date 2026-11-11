<?php

namespace App\Enums;

/**
 * Why signing in with Google did not work, as the React app is told.
 *
 * GoogleSignInController sends the browser back to `/login?error=<value>`,
 * and the sign-in page shows the matching sentence in the user's language
 * (`auth.google.errors.<value>` in frontend/src/i18n/locales/*.json; the
 * frontend lists the same values in src/components/GoogleSignIn.tsx).
 * The codes say nothing an attacker could use: no "this email has an
 * account", for instance. docs/concepts/C2-backend.md C2.7.8.
 */
enum SocialSignInError: string
{
    /** The person pressed Cancel on Google's page, or closed the consent. */
    case Cancelled = 'cancelled';

    /**
     * Anything else went wrong: the visit to Google expired or was not ours
     * (the `state` check), Google could not be reached, wrong credentials in
     * backend/.env. The details go to the log, not to the screen.
     */
    case Failed = 'failed';

    /** Google does not vouch for the address (`email_verified` is false). */
    case Unverified = 'unverified';

    /** The account was disabled by an admin (D1.4.15). */
    case Disabled = 'disabled';
}
