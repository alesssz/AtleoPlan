<?php

namespace App\Http\Requests;

// Imports: the model in the URL
use App\Models\Plan;

/**
 * Validates PUT /api/plans/{plan}: the whole plan again, after a change in
 * the plan editor (docs/design/D1-ui.md D1.4.8). The rules of a whole plan are
 * in PlanRequest; this class adds `version`.
 *
 * `version` is the version the editor started from. When it is smaller than
 * the plan's, someone saved the plan elsewhere in the meantime: the save goes
 * through, and the answer says so (docs/design/D3-data-model.md D3.5.7).
 *
 * Unlike UpdateExerciseRequest, nothing becomes optional: the body is always
 * the whole plan, never just the fields that changed.
 */
class UpdatePlanRequest extends PlanRequest
{
    /**
     * The rules of PlanRequest, plus the version.
     *
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
     * The plan the ids may belong to: the one in the URL.
     *
     * route('plan') gives the route's {plan} parameter. By the time a Form
     * Request runs, route model binding has already turned it into the Plan,
     * so a plan that does not exist got its 404 before this.
     */
    protected function planId(): ?string
    {
        /** @var Plan $plan */
        $plan = $this->route('plan');

        return $plan->id;
    }
}
