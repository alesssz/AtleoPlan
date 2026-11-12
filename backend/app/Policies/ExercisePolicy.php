<?php

namespace App\Policies;

// Imports: the two models the checks compare
use App\Models\Exercise;
use App\Models\User;

/**
 * Who may do what with an exercise of the library
 * (docs/design/D2-decisions.md D2.3):
 * - a public exercise is seen by everyone and changed by nobody through the
 *   API: admins edit public ones in the admin panel, whose screen has rules
 *   of its own (app/Filament/Resources/Exercises/ExerciseResource.php,
 *   docs/concepts/C2-backend.md C2.8.2);
 * - a personal exercise is seen, changed and deleted only by its owner;
 * - a public exercise can be duplicated as one's own (D1.4.4).
 *
 * A policy is a class of yes/no answers about one model, one method per
 * action (docs/concepts/C2-backend.md C2.5.1). Laravel finds it by its name:
 * ExercisePolicy for Exercise, in app/Policies. Each method receives the
 * signed-in user first, then the exercise, and the controller asks with
 * `Gate::authorize('update', $exercise)`: a false answer stops the request
 * with a 403.
 *
 * The list of exercises does not ask the policy row by row: the scope
 * Exercise::visibleTo() holds the same rule as view(), written as a query.
 *
 * `make:policy --model=Exercise` also generated viewAny, restore and
 * forceDelete; they were removed, since nothing uses them.
 */
class ExercisePolicy
{
    /**
     * Seeing one exercise: public, or mine.
     *
     * @param  User  $user  the signed-in user
     * @param  Exercise  $exercise  the exercise asked for
     */
    public function view(User $user, Exercise $exercise): bool
    {
        return $exercise->isPublic() || $exercise->isOwnedBy($user);
    }

    /**
     * Creating an exercise: anyone signed in, and it is always a personal one
     * (SavePersonalExercise sets the owner).
     *
     * There is no exercise yet, so the controller passes the class instead:
     * `Gate::authorize('create', Exercise::class)`, and the method has no
     * second parameter. It always says yes today; it is here so that the
     * controller reads the same for every action, and a limit (on the number
     * of exercises, say) has an obvious place to go.
     *
     * @param  User  $user  the signed-in user
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Changing an exercise: only my own. A public one gets a 403, admins
     * included.
     *
     * @param  User  $user  the signed-in user
     * @param  Exercise  $exercise  the exercise to change
     */
    public function update(User $user, Exercise $exercise): bool
    {
        return $exercise->isOwnedBy($user);
    }

    /**
     * Duplicate as mine: copying a public exercise as my own, to change it
     * (docs/design/D1-ui.md D1.4.4). Only a public one: my own I can edit
     * already, and someone else's I cannot see.
     *
     * @param  User  $user  the signed-in user
     * @param  Exercise  $exercise  the exercise to copy
     */
    public function duplicate(User $user, Exercise $exercise): bool
    {
        return $exercise->isPublic();
    }

    /**
     * Deleting an exercise: only my own, as for update().
     *
     * @param  User  $user  the signed-in user
     * @param  Exercise  $exercise  the exercise to delete
     */
    public function delete(User $user, Exercise $exercise): bool
    {
        return $exercise->isOwnedBy($user);
    }
}
