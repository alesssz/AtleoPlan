<?php

namespace App\Enums;

/**
 * The type of a set, in `plan_sets.set_type` and `logged_sets.set_type`. The
 * plan editor cycles through them on a tap on the set's number.
 */
enum SetType: string
{
    /** A working set: the default. */
    case Normal = 'normal';

    /** A warm-up set, "W": counted neither for volume nor for records. */
    case WarmUp = 'warm_up';

    /** A drop set, "D": straight after the previous one, with less weight. */
    case Drop = 'drop';

    /** A set to failure, "F": until no more reps can be done. */
    case Failure = 'failure';
}
