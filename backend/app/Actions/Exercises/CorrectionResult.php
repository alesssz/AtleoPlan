<?php

namespace App\Actions\Exercises;

use App\Enums\CorrectionOutcome;

/**
 * What CorrectLoggingType did with one exercise; the command adds these up
 * for its summary.
 */
final readonly class CorrectionResult
{
    /**
     * @param  int  $plans  plans whose sets of the exercise were converted; 0 unless Corrected
     * @param  int  $workouts  workouts whose sets of the exercise were converted; 0 unless Corrected
     */
    public function __construct(
        public CorrectionOutcome $outcome,
        public int $plans = 0,
        public int $workouts = 0,
    ) {}
}
