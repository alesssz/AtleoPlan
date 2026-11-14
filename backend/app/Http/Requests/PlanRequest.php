<?php

namespace App\Http\Requests;

use App\Enums\SetType;
use App\Rules\SupersetsAreNeighbours;
use Illuminate\Database\Query\Builder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Unique;

/**
 * The rules of a whole plan, as the plan editor sends it, shared by
 * StorePlanRequest (POST /api/plans) and UpdatePlanRequest (PUT
 * /api/plans/{plan}):
 *
 *     {
 *       "name": "Push Pull Legs",
 *       "goal": "Hypertrophy",
 *       "notes": null,
 *       "days": [
 *         {
 *           "id": "0192f4a7-…",                 a UUID made on the device
 *           "name": "Day A – Push",
 *           "items": [
 *             {
 *               "id": "0192f4a8-…",
 *               "exercise_id": 12,
 *               "superset_group": 1,            or null
 *               "rest_seconds": 90,             or null: the user's default
 *               "notes": null,
 *               "for_time": false,              true: as fast as possible
 *               "sets": [
 *                 { "set_type": "warm_up", "target_reps_min": 10, "target_reps_max": 10, "target_weight_kg": 40 },
 *                 { "set_type": "normal",  "target_reps_min": 8,  "target_reps_max": 10, "target_weight_kg": 80 }
 *               ]
 *             }
 *           ]
 *         }
 *       ]
 *     }
 *
 * - **The order of the lists is the order** of days, exercises and sets:
 *   there is no `position` field, SavePlan numbers them.
 * - **The body is the whole plan.** Days and items left out are deleted, and
 *   a field left out is emptied. `days`, `items` and `sets` must be present,
 *   even empty, so that a forgotten key cannot delete a whole day by mistake.
 * - **Ids are optional.** The editor sends the UUIDs it made; a row sent
 *   without one gets a new one. An id that belongs to another plan is refused:
 *   otherwise anyone who learned a UUID could take someone else's day into
 *   their plan.
 *
 * Each subclass says, in planId(), which plan the ids may already belong to.
 */
abstract class PlanRequest extends FormRequest
{
    /**
     * The plan whose days and items the request may name by id; null when
     * every id sent must be new.
     */
    abstract protected function planId(): ?string;

    /**
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:100'],
            'goal' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:2000'],

            'days' => ['present', 'array', 'max:14'],
            // A non-UUID fails 'uuid' first, and Laravel then skips the rules
            // that query the database: Postgres would answer such a query
            // with an error, not a "no"
            'days.*.id' => ['sometimes', 'uuid', 'distinct', $this->dayIdIsFree()],
            'days.*.name' => ['required', 'string', 'max:50'],
            'days.*.items' => ['present', 'array', 'max:30', new SupersetsAreNeighbours],

            'days.*.items.*.id' => ['sometimes', 'uuid', 'distinct', $this->itemIdIsFree()],
            // Public or the user's own. A deleted one is accepted, so a plan
            // that already has it can still be saved
            'days.*.items.*.exercise_id' => ['required', 'integer', Rule::exists('exercises', 'id')
                ->where(fn (Builder $query) => $query
                    ->whereNull('owner_id')
                    ->orWhere('owner_id', $this->user()->id))],
            ...self::itemRules('days.*.items.*.'),
        ];
    }

    /**
     * An item's values and its sets, shared with the import of a plan file
     * (ImportPlanRequest).
     *
     * @param  string  $item  the prefix of an item's fields, ending with a dot
     * @return array<string, array<int, mixed>>
     */
    public static function itemRules(string $item): array
    {
        $set = $item.'sets.*.';

        return [
            $item.'superset_group' => ['nullable', 'integer', 'between:1,99'],
            // 0: straight on to the next set
            $item.'rest_seconds' => ['nullable', 'integer', 'between:0,3600'],
            $item.'notes' => ['nullable', 'string', 'max:500'],
            // Optional, so an older app that does not send it still saves its
            // plans
            $item.'for_time' => ['sometimes', 'boolean'],
            $item.'sets' => ['present', 'array', 'max:20'],

            // Which targets make sense depends on how the exercise is logged;
            // the editor shows only those, and the server does not check the
            // match. set_type is required also because a set with no ruled
            // field would vanish from validated()
            $set.'set_type' => ['required', Rule::enum(SetType::class)],
            // "8–10" or "8": both or neither
            $set.'target_reps_min' => ['nullable', 'integer', 'between:1,999', 'required_with:'.$set.'target_reps_max'],
            $set.'target_reps_max' => ['nullable', 'integer', 'between:1,999', 'required_with:'.$set.'target_reps_min', 'gte:'.$set.'target_reps_min'],
            // numeric(7,3), in kilograms
            $set.'target_weight_kg' => ['nullable', 'numeric', 'between:0,9999.999', 'decimal:0,3'],
            $set.'target_rpe' => ['nullable', 'numeric', 'between:1,10', 'decimal:0,1'],
            $set.'target_duration_seconds' => ['nullable', 'integer', 'between:1,86400'],
            $set.'target_distance_meters' => ['nullable', 'integer', 'between:1,1000000'],
        ];
    }

    /**
     * Not used by another plan: the editor sends back the ids it received.
     */
    private function dayIdIsFree(): Unique
    {
        $rule = Rule::unique('plan_days', 'id');
        $planId = $this->planId();

        return $planId === null ? $rule : $rule->whereNot('plan_id', $planId);
    }

    /**
     * Not used by another plan. Items point to a day, not to the plan, hence
     * the subquery; an item may move to another day of the plan and keep its
     * id.
     */
    private function itemIdIsFree(): Unique
    {
        $rule = Rule::unique('plan_items', 'id');
        $planId = $this->planId();

        return $planId === null ? $rule : $rule->where(fn (Builder $query) => $query
            ->whereNotIn('plan_day_id', fn (Builder $days) => $days
                ->select('id')->from('plan_days')->where('plan_id', $planId)));
    }
}
