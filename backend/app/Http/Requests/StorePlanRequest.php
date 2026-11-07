<?php

namespace App\Http\Requests;

// Imports: Rule, and Str for checking that a text is a UUID
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * Validates POST /api/plans: a new plan, from the plan editor
 * (docs/design/D1-ui.md D1.4.8). The rules of a whole plan are in
 * PlanRequest; this class adds the plan's own `id`.
 *
 * The id is a UUID made on the device (docs/design/D3-data-model.md D3.2.1).
 * Sending the same plan twice, because the answer to the first try was lost,
 * must not fail: PlanController::store() answers the second time with the
 * plan already saved. So the id is refused only when it belongs to someone
 * else's plan, and the ids of the days and items may belong to the plan with
 * this id.
 */
class StorePlanRequest extends PlanRequest
{
    /**
     * The rules of PlanRequest, plus the plan's id.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            // Optional: without one, Laravel makes it (HasUuids). Refused
            // when a plan of another user has it: whereNot() leaves my own
            // plans out of the search
            'id' => ['sometimes', 'uuid', Rule::unique('plans', 'id')->whereNot('user_id', $this->user()->id)],
            // `...`: the rules of the parent class, spread into this array
            ...parent::rules(),
        ];
    }

    /**
     * The plan the ids may belong to: the one with the id sent, if that id is
     * a valid UUID. If it is someone else's, the `id` rule refuses the whole
     * request anyway.
     */
    protected function planId(): ?string
    {
        // input(): a field of the body, before validation, so anything can
        // be there; only a real UUID is used in a query
        $id = $this->input('id');

        return is_string($id) && Str::isUuid($id) ? $id : null;
    }
}
