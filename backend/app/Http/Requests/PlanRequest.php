<?php

namespace App\Http\Requests;

// Imports: the enum of the set types, the rule class for supersets, Laravel's
// base Form Request, the query builder of the rules' extra conditions, Rule
// (builds the rules that are objects) and Unique (the type Rule::unique() returns)
use App\Enums\SetType;
use App\Rules\SupersetsAreNeighbours;
use Illuminate\Database\Query\Builder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Unique;

/**
 * The rules of a whole plan, as the plan editor sends it
 * (docs/design/D1-ui.md D1.4.8), shared by StorePlanRequest (POST /api/plans)
 * and UpdatePlanRequest (PUT /api/plans/{plan}):
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
 *   without one gets a new one. An id that belongs to another plan is
 *   refused: otherwise anyone who learned a UUID could take someone else's
 *   day into their plan (docs/design/D3-data-model.md D3.11).
 *
 * `abstract`: this class is never used by itself, only through the two that
 * extend it. Each says which plan the ids may already belong to, in planId().
 * The generated authorize() method was removed: permissions are PlanPolicy's
 * job (docs/how-to/H2-backend.md H2.3.6).
 */
abstract class PlanRequest extends FormRequest
{
    /**
     * The plan whose days and items the request may name by their id: the
     * plan being changed, or the one being created. null when there is none,
     * and then every id sent must be new.
     */
    abstract protected function planId(): ?string;

    /**
     * The rules. `.*` means "each item of the list": `days.*.name` checks the
     * name of every day, `days.*.items.*.sets.*.set_type` the type of every
     * set of every exercise of every day.
     *
     * @return array<string, array<int, mixed>>
     */
    public function rules(): array
    {
        // The prefix of the fields of a set, to keep the lines short
        $set = 'days.*.items.*.sets.*.';

        return [
            'name' => ['required', 'string', 'max:100'],
            'goal' => ['nullable', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:2000'],

            // present: the key must be there, even as an empty list
            'days' => ['present', 'array', 'max:14'],
            // distinct: the same id twice in the request is refused. A text
            // that is not a UUID fails 'uuid', and Laravel then skips the
            // rules that query the database (unique, exists) on that field:
            // Postgres would answer such a query with an error, not a "no"
            'days.*.id' => ['sometimes', 'uuid', 'distinct', $this->dayIdIsFree()],
            'days.*.name' => ['required', 'string', 'max:50'],
            // The supersets are checked on each day's list as a whole
            'days.*.items' => ['present', 'array', 'max:30', new SupersetsAreNeighbours],

            'days.*.items.*.id' => ['sometimes', 'uuid', 'distinct', $this->itemIdIsFree()],
            // An exercise this user may see: public, or their own. A deleted
            // one is accepted, so that a plan that already has it can still
            // be saved (docs/design/D3-data-model.md D3.7.2)
            'days.*.items.*.exercise_id' => ['required', 'integer', Rule::exists('exercises', 'id')
                ->where(fn (Builder $query) => $query
                    ->whereNull('owner_id')
                    ->orWhere('owner_id', $this->user()->id))],
            'days.*.items.*.superset_group' => ['nullable', 'integer', 'between:1,99'],
            // Up to an hour; 0 is allowed: straight on to the next set
            'days.*.items.*.rest_seconds' => ['nullable', 'integer', 'between:0,3600'],
            'days.*.items.*.notes' => ['nullable', 'string', 'max:500'],
            // As fast as possible: the reps fixed, the time the result
            // (D3.5.3). Optional, false when missing, so an older app that
            // does not send it still saves its plans
            'days.*.items.*.for_time' => ['sometimes', 'boolean'],
            'days.*.items.*.sets' => ['present', 'array', 'max:20'],

            // The set's fields. Which of them make sense depends on how the
            // exercise is logged (weight and reps, time…); the editor shows
            // only those, and the server does not check the match.
            // set_type is required, and not only because the editor always
            // sends it: a set with no field that has a rule would vanish from
            // validated(), which keeps a list only through its items' fields
            // (docs/how-to/H2-backend.md H2.13.5)
            $set.'set_type' => ['required', Rule::enum(SetType::class)],
            // "8–10" or "8": both or neither. gte: the maximum is at least the
            // minimum; the * in its parameter means "of this same set"
            $set.'target_reps_min' => ['nullable', 'integer', 'between:1,999', 'required_with:'.$set.'target_reps_max'],
            $set.'target_reps_max' => ['nullable', 'integer', 'between:1,999', 'required_with:'.$set.'target_reps_min', 'gte:'.$set.'target_reps_min'],
            // Kilograms, up to three decimals: numeric(7,3) (D3.2.3)
            $set.'target_weight_kg' => ['nullable', 'numeric', 'between:0,9999.999', 'decimal:0,3'],
            $set.'target_rpe' => ['nullable', 'numeric', 'between:1,10', 'decimal:0,1'],
            // Up to a day, and up to 1000 km
            $set.'target_duration_seconds' => ['nullable', 'integer', 'between:1,86400'],
            $set.'target_distance_meters' => ['nullable', 'integer', 'between:1,1000000'],
        ];
    }

    /**
     * The rule for a day's id: not already used by another plan.
     *
     * Rule::unique('plan_days', 'id') is refused when a row with this id
     * exists; whereNot() adds a condition to that search, so the rows of this
     * plan do not count: the editor sends back the ids it received.
     */
    private function dayIdIsFree(): Unique
    {
        $rule = Rule::unique('plan_days', 'id');
        $planId = $this->planId();

        return $planId === null ? $rule : $rule->whereNot('plan_id', $planId);
    }

    /**
     * The rule for an item's id: not already used by another plan.
     *
     * Items do not point to the plan but to a day, so the extra condition is
     * a subquery: the item's day must not be one of this plan's days. An item
     * may move from one day of the plan to another and keep its id.
     */
    private function itemIdIsFree(): Unique
    {
        $rule = Rule::unique('plan_items', 'id');
        $planId = $this->planId();

        // A function as the second argument of whereNotIn() becomes a
        // subquery: `plan_day_id not in (select id from plan_days where plan_id = ?)`
        return $planId === null ? $rule : $rule->where(fn (Builder $query) => $query
            ->whereNotIn('plan_day_id', fn (Builder $days) => $days
                ->select('id')->from('plan_days')->where('plan_id', $planId)));
    }
}
