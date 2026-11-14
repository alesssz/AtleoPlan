<?php

namespace App\Enums;

/**
 * The outside services a person can sign in with, in
 * `social_accounts.provider`. Each value is also the Socialite driver's name.
 * Adding Apple (phase 2) needs a migration too: the column's check constraint
 * lists the values.
 */
enum SocialProvider: string
{
    case Google = 'google';
}
