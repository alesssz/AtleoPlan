<?php

namespace App\Enums;

/**
 * The themes a user can choose, the values of the `users.theme` column
 * (docs/design/D1-ui.md D1.4.14). `System` follows the device's setting. What an
 * enum is: app/Enums/Locale.php. The frontend has the same list in
 * src/theme/theme.ts.
 */
enum Theme: string
{
    case Dark = 'dark';
    case Light = 'light';
    case System = 'system';
}
