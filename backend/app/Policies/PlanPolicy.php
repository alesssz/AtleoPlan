<?php

namespace App\Policies;

// Imports: the two models the checks compare
use App\Models\Plan;
use App\Models\User;

/**
 * Who may do what with a workout plan: only its owner, for everything
 * (docs/design/D1-ui.md D1.4.6–D1.4.8). Sharing and templates, which would
 * let others read a plan, come in phase 2 (docs/design/D3-data-model.md D3.9).
 *
 * A policy is a class of yes/no answers about one model, one method per
 * action (docs/concepts/C2-backend.md C2.5.1; ExercisePolicy is the first).
 * PlanController asks with `Gate::authorize('update', $plan)`, and a false
 * answer stops the request with a 403.
 *
 * The list of plans does not ask row by row: it reads `$user->plans()`,
 * which holds the same rule as view(), written as a query.
 *
 * `make:policy PlanPolicy --model=Plan` also generated viewAny, restore and
 * forceDelete; they were removed, since nothing uses them. activate() is not
 * generated: a policy can have any method, named after the action.
 */
class PlanPolicy
{
    /**
     * Seeing a plan: only my own.
     *
     * @param  User  $user  the signed-in user
     * @param  Plan  $plan  the plan asked for
     */
    public function view(User $user, Plan $plan): bool
    {
        return $plan->isOwnedBy($user);
    }

    /**
     * Creating a plan: anyone signed in. It always says yes today; it is here
     * so that the controller reads the same for every action, and a limit
     * has an obvious place to go (ExercisePolicy::create() says more).
     *
     * @param  User  $user  the signed-in user
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Changing a plan, archiving it or bringing it back: only my own.
     *
     * @param  User  $user  the signed-in user
     * @param  Plan  $plan  the plan to change
     */
    public function update(User $user, Plan $plan): bool
    {
        return $plan->isOwnedBy($user);
    }

    /**
     * Deleting a plan: only my own.
     *
     * @param  User  $user  the signed-in user
     * @param  Plan  $plan  the plan to delete
     */
    public function delete(User $user, Plan $plan): bool
    {
        return $plan->isOwnedBy($user);
    }

    /**
     * Making it the active plan (docs/design/D2-decisions.md D2.8): my own,
     * and not archived. This is the check that users.active_plan_id cannot
     * make by itself (docs/design/D3-data-model.md D3.3).
     *
     * @param  User  $user  the signed-in user
     * @param  Plan  $plan  the plan to make active
     */
    public function activate(User $user, Plan $plan): bool
    {
        return $plan->isOwnedBy($user) && ! $plan->isArchived();
    }
}
