<?php

namespace App\Http\Requests;

use App\Models\Plan;

/**
 * PUT /api/plans/{plan}: the whole plan again, never just the fields that
 * changed.
 *
 * `version` is the one the editor started from. A smaller one than the plan's
 * means it was saved elsewhere meanwhile: the save goes through, and the answer
 * says so.
 */
class UpdatePlanRequest extends PlanRequest
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'version' => ['required', 'integer', 'min:1'],
            ...parent::rules(),
        ];
    }

    /**
     * The plan in the URL, already bound: a missing plan got its 404 before
     * validation.
     */
    protected function planId(): ?string
    {
        /** @var Plan $plan */
        $plan = $this->route('plan');

        return $plan->id;
    }
}
