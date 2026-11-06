<?php

namespace App\Enums;

/**
 * What the free-exercise-db import did with one exercise of the source
 * (app/Actions/Exercises/ImportFreeExercise.php, docs/concepts/C2-backend.md C2.14).
 *
 * What an enum is: app/Enums/Locale.php. This one is never stored in the
 * database: the import command counts the outcomes and prints the totals.
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
