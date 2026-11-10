<?php

namespace App\Actions\Plans;

// Imports: the models it writes, Arr (helpers for arrays), and the DB facade
// for the transaction
use App\Models\Plan;
use App\Models\PlanItem;
use App\Models\PlanSet;
use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

/**
 * Saves a whole plan, days, exercises and sets, from data already validated
 * by StorePlanRequest or UpdatePlanRequest (docs/design/D3-data-model.md D3.5.6).
 *
 * An action: a small class that does one job, kept out of the controller so
 * that it can be tested without HTTP and reused (docs/concepts/C2-backend.md
 * C2.5.3; SavePersonalExercise is the first). Created with
 * `make:class Actions/Plans/SavePlan`.
 *
 * What a save does, in one transaction:
 *
 * 1. **Days and items are matched by their UUID.** One sent with an id the
 *    plan already has is updated; one with a new id, or none, is created;
 *    the plan's days and items not sent are deleted. Their ids stay the same
 *    across saves, because the workout sessions of FEAT-3 will point to them.
 *    An item may also move to another day of the plan.
 * 2. **Sets are deleted and written again**, all of them, in two queries.
 *    Nothing points to a set, so this is simpler than working out which one
 *    changed.
 * 3. **The position is the place in the list**: the first day sent is 0.
 * 4. **The version goes up by 1** on every change (D3.5.7).
 *
 * A day or item that did not change costs no query: Eloquent's save() writes
 * only when a column changed, and does nothing otherwise.
 */
class SavePlan
{
    /**
     * Creates a plan owned by $user.
     *
     * @param  User  $user  the owner, the signed-in user
     * @param  array<string, mixed>  $data  the validated plan
     * @return Plan the new plan, saved, at version 1
     */
    public function create(User $user, array $data): Plan
    {
        // DB::transaction(): everything inside is saved together or not at
        // all; a failure halfway cannot leave half a plan. The function's
        // return value is passed through
        return DB::transaction(function () use ($user, $data) {
            // make(): a new plan with user_id set by the relation, not saved
            // yet. `id` is there only when the device sent one
            $plan = $user->plans()->make(Arr::only($data, ['id']));
            $this->fillPlan($plan, $data);
            $plan->save();

            $this->saveDays($plan, $data['days']);

            return $plan;
        });
    }

    /**
     * Saves the whole plan again, over what it was.
     *
     * @param  Plan  $plan  the plan; the policy has checked it is the user's
     * @param  array<string, mixed>  $data  the validated plan, with `version`,
     *                                      the version the editor started from
     * @return bool true when the plan had been saved elsewhere since that
     *              version: the save went through anyway, and the app warns
     */
    public function update(Plan $plan, array $data): bool
    {
        return DB::transaction(function () use ($plan, $data) {
            // The current version, read with a lock: lockForUpdate() adds
            // `for update` to the query, and Postgres makes any other save of
            // this plan wait until this transaction ends. Without it, two
            // saves arriving together could both read 4 and both write 5
            $current = Plan::query()->whereKey($plan->id)->lockForUpdate()->value('version');
            // The editor started from an older version: someone got there first
            $changedElsewhere = $data['version'] < $current;

            $this->fillPlan($plan, $data);
            $plan->version = $current + 1;
            $plan->save();

            $this->saveDays($plan, $data['days']);

            return $changedElsewhere;
        });
    }

    /**
     * Copies the plan's own fields onto it, without saving. A field left out
     * is emptied: the body is the whole plan.
     *
     * @param  Plan  $plan  the plan to fill
     * @param  array<string, mixed>  $data  the validated plan
     */
    private function fillPlan(Plan $plan, array $data): void
    {
        $plan->fill([
            'name' => $data['name'],
            // `?? null`: the value, or null when the key is missing
            'goal' => $data['goal'] ?? null,
            'notes' => $data['notes'] ?? null,
        ]);
    }

    /**
     * Makes the plan's days, items and sets exactly the ones sent.
     *
     * @param  Plan  $plan  the plan, already saved (its rows need its id)
     * @param  list<array<string, mixed>>  $days  the validated days, in order
     */
    private function saveDays(Plan $plan, array $days): void
    {
        // What the plan has now, each keyed by its id, so that a sent id
        // finds its row without another query. keyBy(): a collection whose
        // keys are the given column
        $existingDays = $plan->days()->get()->keyBy('id');
        $existingItems = $plan->items()->get()->keyBy('id');

        // The ids of the rows sent, which stay; any other row goes
        $keptDayIds = [];
        $keptItemIds = [];
        // Every set of the plan, written at the end in one query
        $sets = [];

        // array_values(): numbers the list 0, 1, 2…, which become positions
        foreach (array_values($days) as $dayPosition => $dayData) {
            // The day the plan already has with this id, or a new one.
            // `?? ''`: a day sent without an id finds nothing
            $day = $existingDays->get($dayData['id'] ?? '')
                ?? $plan->days()->make(['id' => $dayData['id'] ?? null]);
            $day->fill(['name' => $dayData['name'], 'position' => $dayPosition]);
            // An insert, an update, or nothing when nothing changed
            $day->save();
            $keptDayIds[] = $day->id;

            foreach (array_values($dayData['items']) as $itemPosition => $itemData) {
                $item = $existingItems->get($itemData['id'] ?? '')
                    ?? new PlanItem(['id' => $itemData['id'] ?? null]);
                $item->fill([
                    'exercise_id' => $itemData['exercise_id'],
                    'position' => $itemPosition,
                    'superset_group' => $itemData['superset_group'] ?? null,
                    'rest_seconds' => $itemData['rest_seconds'] ?? null,
                    'notes' => $itemData['notes'] ?? null,
                    'for_time' => $itemData['for_time'] ?? false,
                ]);
                // Set here, not through a relation: the item may be new, or
                // may come from another day of the same plan
                $item->plan_day_id = $day->id;
                $item->save();
                $keptItemIds[] = $item->id;

                foreach (array_values($itemData['sets']) as $setPosition => $setData) {
                    $sets[] = $this->setRow($item, $setPosition, $setData);
                }
            }
        }

        // The items and days no longer sent. Items first: one moved to a
        // kept day has already been given its new day, so deleting its old
        // day (whose items go by cascade) does not take it along
        PlanItem::query()->whereIn('id', $existingItems->keys())->whereNotIn('id', $keptItemIds)->delete();
        $plan->days()->whereNotIn('id', $keptDayIds)->delete();

        // The sets: all deleted, then all written again. insert() writes many
        // rows in one query, without building a model for each
        PlanSet::query()->whereIn('plan_item_id', $keptItemIds)->delete();
        PlanSet::query()->insert($sets);
    }

    /**
     * One row of plan_sets, as insert() wants it: every column named, since
     * rows inserted together must have the same columns.
     *
     * @param  PlanItem  $item  the set's item
     * @param  int  $position  its place in the item's list
     * @param  array<string, mixed>  $data  the validated set
     * @return array<string, mixed> the row
     */
    private function setRow(PlanItem $item, int $position, array $data): array
    {
        return [
            'plan_item_id' => $item->id,
            'position' => $position,
            // Required by PlanRequest; the other fields may be missing
            'set_type' => $data['set_type'],
            'target_reps_min' => $data['target_reps_min'] ?? null,
            'target_reps_max' => $data['target_reps_max'] ?? null,
            'target_weight_kg' => $data['target_weight_kg'] ?? null,
            'target_rpe' => $data['target_rpe'] ?? null,
            'target_duration_seconds' => $data['target_duration_seconds'] ?? null,
            'target_distance_meters' => $data['target_distance_meters'] ?? null,
        ];
    }
}
