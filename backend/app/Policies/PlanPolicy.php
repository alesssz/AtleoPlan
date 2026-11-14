<?php

namespace App\Policies;

use App\Models\Plan;
use App\Models\User;

/**
 * A plan is its owner's only, for everything; sharing and templates come in
 * phase 2. The plan list reads `$user->plans()`, which is view() as a query.
 */
class PlanPolicy
{
    public function view(User $user, Plan $plan): bool
    {
        return $plan->isOwnedBy($user);
    }

    /**
     * Always allowed; kept for the same reason as ExercisePolicy::create().
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Also covers archiving and restoring.
     */
    public function update(User $user, Plan $plan): bool
    {
        return $plan->isOwnedBy($user);
    }

    public function delete(User $user, Plan $plan): bool
    {
        return $plan->isOwnedBy($user);
    }

    /**
     * One's own and not archived: the check users.active_plan_id cannot make by
     * itself.
     */
    public function activate(User $user, Plan $plan): bool
    {
        return $plan->isOwnedBy($user) && ! $plan->isArchived();
    }
}
