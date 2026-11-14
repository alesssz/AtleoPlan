<?php

namespace App\Actions\Plans;

use App\Models\Plan;
use App\Models\PlanItem;
use App\Models\PlanSet;
use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

/**
 * Saves a whole plan, days, exercises and sets, from validated data. In one
 * transaction:
 *
 * 1. **Days and items are matched by their UUID.** One sent with an id the
 *    plan already has is updated; one with a new id, or none, is created;
 *    the plan's days and items not sent are deleted. Their ids stay the same
 *    across saves, because workout sessions point to them. An item may also
 *    move to another day of the plan.
 * 2. **Sets are deleted and written again**, all of them, in two queries.
 *    Nothing points to a set, so this is simpler than working out which one
 *    changed.
 * 3. **The position is the place in the list**: the first day sent is 0.
 * 4. **The version goes up by 1** on every change.
 *
 * A day or item that did not change costs no query: save() writes only
 * dirty columns.
 */
class SavePlan
{
    /**
     * @param  array<string, mixed>  $data
     */
    public function create(User $user, array $data): Plan
    {
        return DB::transaction(function () use ($user, $data) {
            // `id` only when the device sent one
            $plan = $user->plans()->make(Arr::only($data, ['id']));
            $this->fillPlan($plan, $data);
            $plan->save();

            $this->saveDays($plan, $data['days']);

            return $plan;
        });
    }

    /**
     * @param  array<string, mixed>  $data  with `version`, the one the editor started from
     * @return bool true when the plan had been saved elsewhere since that
     *              version: the save went through anyway, and the app warns
     */
    public function update(Plan $plan, array $data): bool
    {
        return DB::transaction(function () use ($plan, $data) {
            // Locked: two saves arriving together could otherwise both read 4
            // and both write 5
            $current = Plan::query()->whereKey($plan->id)->lockForUpdate()->value('version');
            $changedElsewhere = $data['version'] < $current;

            $this->fillPlan($plan, $data);
            $plan->version = $current + 1;
            $plan->save();

            $this->saveDays($plan, $data['days']);

            return $changedElsewhere;
        });
    }

    /**
     * A field left out is emptied: the body is the whole plan.
     *
     * @param  array<string, mixed>  $data
     */
    private function fillPlan(Plan $plan, array $data): void
    {
        $plan->fill([
            'name' => $data['name'],
            'goal' => $data['goal'] ?? null,
            'notes' => $data['notes'] ?? null,
        ]);
    }

    /**
     * @param  list<array<string, mixed>>  $days  in order
     */
    private function saveDays(Plan $plan, array $days): void
    {
        $existingDays = $plan->days()->get()->keyBy('id');
        $existingItems = $plan->items()->get()->keyBy('id');

        // Any row not sent is deleted at the end
        $keptDayIds = [];
        $keptItemIds = [];
        // Written at the end in one query
        $sets = [];

        foreach (array_values($days) as $dayPosition => $dayData) {
            $day = $existingDays->get($dayData['id'] ?? '')
                ?? $plan->days()->make(['id' => $dayData['id'] ?? null]);
            $day->fill(['name' => $dayData['name'], 'position' => $dayPosition]);
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
                // The item may be new, or may come from another day of the plan
                $item->plan_day_id = $day->id;
                $item->save();
                $keptItemIds[] = $item->id;

                foreach (array_values($itemData['sets']) as $setPosition => $setData) {
                    $sets[] = $this->setRow($item, $setPosition, $setData);
                }
            }
        }

        // Items first: one moved to a kept day already points to it, so the
        // cascade from its old day does not take it along
        PlanItem::query()->whereIn('id', $existingItems->keys())->whereNotIn('id', $keptItemIds)->delete();
        $plan->days()->whereNotIn('id', $keptDayIds)->delete();

        PlanSet::query()->whereIn('plan_item_id', $keptItemIds)->delete();
        PlanSet::query()->insert($sets);
    }

    /**
     * Every column named: rows inserted together must have the same columns.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function setRow(PlanItem $item, int $position, array $data): array
    {
        return [
            'plan_item_id' => $item->id,
            'position' => $position,
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
