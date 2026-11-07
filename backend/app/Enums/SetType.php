<?php

namespace App\Enums;

/**
 * The type of a set, the values of `plan_sets.set_type` and, later, of
 * `logged_sets.set_type` (docs/design/D3-data-model.md D3.2.4,
 * docs/design/D2-decisions.md D2.8). In the plan editor a tap on the set's
 * number cycles through them, and the letter shows next to it
 * (docs/design/D1-ui.md D1.4.8).
 *
 * What an enum is: app/Enums/Locale.php. Created with
 * `make:enum SetType --string`: `--string` makes it a "backed" enum, each
 * case carrying the string stored in the database (`SetType::WarmUp->value`
 * is "warm_up").
 */
enum SetType: string
{
    /** A working set: the default. */
    case Normal = 'normal';

    /** A warm-up set, "W": counted neither for volume nor for records (D2.8). */
    case WarmUp = 'warm_up';

    /** A drop set, "D": straight after the previous one, with less weight. */
    case Drop = 'drop';

    /** A set to failure, "F": until no more reps can be done. */
    case Failure = 'failure';
}
