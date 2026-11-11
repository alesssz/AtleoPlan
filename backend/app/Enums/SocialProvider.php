<?php

namespace App\Enums;

/**
 * The outside services a person can sign in with, the values of the
 * `social_accounts.provider` column (docs/design/D3-data-model.md D3.3.1).
 *
 * Google only for now (FEAT-9); Apple, in phase 2, is one more case here and
 * one more value in the column's list (a migration, docs/how-to/H1-database.md
 * H1.10.6). Each value is also the name of the Socialite driver that talks to
 * that service: `Socialite::driver(SocialProvider::Google->value)`.
 * What an enum is: app/Enums/Locale.php.
 */
enum SocialProvider: string
{
    case Google = 'google';
}
