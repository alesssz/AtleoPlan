<?php

namespace App\Policies;

use App\Models\User;
use App\Models\WorkoutSession;

/**
 * A workout is its owner's only.
 *
 * There is no save check here: PUT /api/sessions/{id} creates the session
 * when the id is new, so there may be no row to ask about. SaveWorkoutSession
 * checks the owner of a known id itself.
 */
class WorkoutSessionPolicy
{
    public function view(User $user, WorkoutSession $session): bool
    {
        return $session->user_id === $user->id;
    }

    public function delete(User $user, WorkoutSession $session): bool
    {
        return $session->user_id === $user->id;
    }
}
