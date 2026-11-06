<?php

namespace App\Enums;

/**
 * How an exercise works a muscle, the values of `exercise_muscle.role`
 * (docs/design/D3-data-model.md D3.4.3). The bench press, for example, works
 * the chest as its primary muscle and the triceps and shoulders as secondary.
 *
 * What an enum is: app/Enums/Locale.php.
 */
enum MuscleRole: string
{
    /** A main target of the exercise; an exercise may have several. */
    case Primary = 'primary';

    /** A muscle that helps. */
    case Secondary = 'secondary';
}
