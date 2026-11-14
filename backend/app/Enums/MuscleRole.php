<?php

namespace App\Enums;

/**
 * How an exercise works a muscle, the values of `exercise_muscle.role`. The
 * bench press, for example, works the chest as its primary muscle and the
 * triceps and shoulders as secondary.
 */
enum MuscleRole: string
{
    /** A main target of the exercise; an exercise may have several. */
    case Primary = 'primary';

    /** A muscle that helps. */
    case Secondary = 'secondary';
}
