<?php

namespace App\Http\Requests;

use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

/**
 * POST /api/plans: a new plan from the editor, with its own id, made on the
 * device.
 *
 * Sending the same plan twice after a lost answer must not fail
 * (PlanController::store() is idempotent), so the id is refused only when it
 * belongs to someone else's plan, and the days and items may already belong
 * to the plan with this id.
 */
class StorePlanRequest extends PlanRequest
{
    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            // Optional: HasUuids makes one
            'id' => ['sometimes', 'uuid', Rule::unique('plans', 'id')->whereNot('user_id', $this->user()->id)],
            ...parent::rules(),
        ];
    }

    /**
     * The plan with the id sent. Someone else's is refused by the `id` rule
     * anyway.
     */
    protected function planId(): ?string
    {
        // Read before validation: only a real UUID may reach a query
        $id = $this->input('id');

        return is_string($id) && Str::isUuid($id) ? $id : null;
    }
}
