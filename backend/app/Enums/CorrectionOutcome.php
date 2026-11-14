<?php

namespace App\Enums;

/**
 * What CorrectLoggingType did with one exercise. Never stored: the command
 * counts the outcomes and prints the totals.
 */
enum CorrectionOutcome: string
{
    /** Still on the import's guess: changed to the right type. */
    case Corrected = 'corrected';

    /** Already on the right type: a previous run, or an admin, did it. */
    case AlreadyRight = 'already_right';

    /** Not in the library: not imported (an import with --limit), or deleted by an admin. */
    case NotFound = 'not_found';

    /** On a third type, neither the guess nor the right one: an admin chose it, and it is kept. */
    case SkippedChangedByHand = 'skipped_changed_by_hand';

    /** In a plan or a workout already: its sets were written for the old type, so it is left alone. */
    case SkippedInUse = 'skipped_in_use';
}
