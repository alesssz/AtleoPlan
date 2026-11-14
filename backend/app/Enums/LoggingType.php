<?php

namespace App\Enums;

/**
 * What a set of an exercise records, the values of `exercises.logging_type`. It
 * decides which fields workout mode shows for each set: a bench press logs a
 * weight and reps, a plank logs a time. A check constraint in the migration
 * holds the same values.
 */
enum LoggingType: string
{
    /** A weight and a number of repetitions: most strength exercises. The weight may be empty: a set done with the body alone. */
    case WeightReps = 'weight_reps';

    /** Repetitions with the body's own weight: push-ups, pull-ups; maybe an added weight (a belt with a plate), stored in weight_kg. */
    case Reps = 'reps';

    /** A duration: plank, wall sit. */
    case Time = 'time';

    /** A distance: rowing, running. */
    case Distance = 'distance';
}
