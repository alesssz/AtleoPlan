<?php

namespace App\Actions\Exercises;

// Imports: the enum of the outcome
use App\Enums\ImportOutcome;

/**
 * What ImportFreeExercise did with one exercise: its outcome, and how many
 * photos it added. The import command adds these up for its summary.
 *
 * A small "value object": it only carries data. `readonly` makes every
 * property fixed once set. The constructor's parameters marked `public` are
 * "promoted properties": PHP declares the properties and assigns them, so the
 * class needs no body. Read as `$result->outcome`, `$result->photosAdded`.
 */
final readonly class ImportResult
{
    /**
     * @param  ImportOutcome  $outcome  created, updated, unchanged or skipped
     * @param  int  $photosAdded  the photos attached during this run; 0 when it already had them
     */
    public function __construct(
        public ImportOutcome $outcome,
        public int $photosAdded,
    ) {}
}
