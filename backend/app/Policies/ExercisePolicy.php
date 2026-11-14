<?php

namespace App\Policies;

use App\Models\Exercise;
use App\Models\User;

/**
 * Who may do what with an exercise of the library:
 * - a public exercise is seen by everyone and changed by nobody through the
 *   API: admins edit public ones in the admin panel, which has rules of its own
 *   (ExerciseResource);
 * - a personal exercise is seen, changed and deleted only by its owner;
 * - a public exercise can be duplicated as one's own.
 *
 * Lists do not ask row by row: Exercise::visibleTo() is view() as a query.
 */
class ExercisePolicy
{
    public function view(User $user, Exercise $exercise): bool
    {
        return $exercise->isPublic() || $exercise->isOwnedBy($user);
    }

    /**
     * Always allowed, and always personal (SavePersonalExercise sets the
     * owner). Kept so every action is authorised the same way, and a future
     * limit has an obvious place.
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Only one's own: a public exercise is refused, admins included.
     */
    public function update(User $user, Exercise $exercise): bool
    {
        return $exercise->isOwnedBy($user);
    }

    /**
     * Only a public exercise: one's own can be edited already, and someone
     * else's cannot be seen.
     */
    public function duplicate(User $user, Exercise $exercise): bool
    {
        return $exercise->isPublic();
    }

    public function delete(User $user, Exercise $exercise): bool
    {
        return $exercise->isOwnedBy($user);
    }
}
