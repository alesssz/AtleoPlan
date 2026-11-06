<?php

namespace App\Enums;

/**
 * What a set of an exercise records, the values of `exercises.logging_type`
 * (docs/design/D3-data-model.md D3.4.2). It decides which fields workout mode
 * shows for each set (D3.6.3): a bench press logs a weight and reps, a plank
 * logs a time.
 *
 * What an enum is: app/Enums/Locale.php. The migration lists the same values,
 * and Postgres refuses any other.
 */
enum LoggingType: string
{
    /** A weight and a number of repetitions: most strength exercises. */
    case WeightReps = 'weight_reps';

    /** Repetitions only, with the body's own weight: push-ups, pull-ups. */
    case Reps = 'reps';

    /** A duration: plank, wall sit. */
    case Time = 'time';

    /** A distance: rowing, running. */
    case Distance = 'distance';
}
