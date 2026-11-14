<?php

namespace App\Actions\Exercises;

use App\Enums\ImportOutcome;

/**
 * What ImportFreeExercise did with one exercise; the command adds these up
 * for its summary.
 */
final readonly class ImportResult
{
    /**
     * @param  int  $photosAdded  attached during this run; 0 when it already had them
     */
    public function __construct(
        public ImportOutcome $outcome,
        public int $photosAdded,
    ) {}
}
