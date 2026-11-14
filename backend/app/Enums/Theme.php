<?php

namespace App\Enums;

/**
 * The themes a user can choose, in `users.theme`. `System` follows the device.
 * The frontend has the same list in src/theme/theme.ts.
 */
enum Theme: string
{
    case Dark = 'dark';
    case Light = 'light';
    case System = 'system';
}
