<?php

namespace App\Enums;

/**
 * What ImportFreeExercise did with one exercise of the source. Never stored:
 * the command counts the outcomes and prints the totals.
 */
enum ImportOutcome: string
{
    /** Not in the library yet: created. */
    case Created = 'created';

    /** Already there, and refreshed from the source (`--update`). */
    case Updated = 'updated';

    /** Already there, and left as it was (the default). */
    case Unchanged = 'unchanged';

    /** Deleted by an admin: left deleted, not brought back. */
    case SkippedDeleted = 'skipped_deleted';
}
