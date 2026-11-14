<?php

namespace App\Actions\Workouts;

use App\Models\LoggedSet;
use App\Models\PlanDay;
use App\Models\PlanItem;
use App\Models\SessionExercise;
use App\Models\User;
use App\Models\WorkoutSession;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Support\Arr;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Saves a whole workout sent by the phone, which may send it late and more than
 * once, already validated by SaveSessionRequest. In one transaction:
 *
 * 1. **Finds the session by its UUID, deleted ones included.** Someone else's:
 *    refused (403). Deleted: left deleted, nothing written, and the caller is
 *    told (a 410): a late send must not bring back a workout deleted elsewhere.
 *    Unknown: a new session.
 * 2. **Keeps only the links to the plan that still hold**: the plan, if it is
 *    still one of the user's; the day, if it is still in that plan; each
 *    exercise's plan item, if it is still in one of the user's plans. The
 *    others become empty. A workout done offline is never refused because the
 *    plan changed meanwhile; it keeps its copied names.
 * 3. **Makes the exercises and the sets exactly the ones sent**, matched by
 *    their UUIDs, the place in each list as the position. Those not sent are
 *    deleted: an exercise taken out, a set unticked on the phone.
 *
 * Sending the same session twice changes nothing the second time: every row
 * is found by its id, and save() writes only what changed.
 *
 * **Moments are turned into UTC before they are written.** The phone sends
 * "2026-11-09T18:00:00+01:00"; Laravel writes dates as "Y-m-d H:i:s", without
 * the offset, so 18:00 in Rome would be stored as 18:00 UTC, an hour late. In
 * UTC first, it is stored as 17:00, the exact moment.
 */
class SaveWorkoutSession
{
    /**
     * @param  string  $id  the session's UUID, from the address
     * @param  array<string, mixed>  $data
     * @return WorkoutSession|null null when it had been deleted, and was left so
     *
     * @throws AuthorizationException when the UUID is another user's session
     */
    public function save(User $user, string $id, array $data): ?WorkoutSession
    {
        return DB::transaction(function () use ($user, $id, $data) {
            // A deleted session must be found, to be left alone
            $session = WorkoutSession::withTrashed()->find($id);

            if ($session !== null && $session->user_id !== $user->id) {
                // Someone else's UUID: the same 403 as a policy's
                throw new AuthorizationException;
            }
            if ($session?->trashed()) {
                return null;
            }

            $session ??= $user->workoutSessions()->make(['id' => $id]);

            [$planId, $planDayId] = $this->planLinks($user, $data);
            $session->fill([
                ...Arr::only($data, ['plan_name', 'day_name', 'duration_seconds', 'feeling', 'notes']),
                'started_at' => $this->utc($data['started_at']),
                'finished_at' => $this->utc($data['finished_at'] ?? null),
                'plan_id' => $planId,
                'plan_day_id' => $planDayId,
            ]);
            $session->save();

            $this->saveExercises($user, $session, $data['exercises']);

            return $session;
        });
    }

    /**
     * See the class comment: no offset may be lost when the moment is written.
     *
     * @param  string|null  $moment  such as "2026-11-09T18:00:00+01:00"
     */
    private function utc(?string $moment): ?Carbon
    {
        return $moment === null ? null : Carbon::parse($moment)->utc();
    }

    /**
     * The plan if it is still the user's, the day if it is still in that plan.
     *
     * @param  array<string, mixed>  $data
     * @return array{0: string|null, 1: string|null} the plan's id and the day's
     */
    private function planLinks(User $user, array $data): array
    {
        $planId = isset($data['plan_id']) && $user->plans()->whereKey($data['plan_id'])->exists()
            ? $data['plan_id']
            : null;
        $dayId = $planId !== null && isset($data['plan_day_id'])
            && PlanDay::query()->whereKey($data['plan_day_id'])->where('plan_id', $planId)->exists()
            ? $data['plan_day_id']
            : null;

        return [$planId, $dayId];
    }

    /**
     * @param  list<array<string, mixed>>  $exercises  in order
     */
    private function saveExercises(User $user, WorkoutSession $session, array $exercises): void
    {
        $existing = $session->sessionExercises()->get()->keyBy('id');
        $existingSets = LoggedSet::query()->whereIn('session_exercise_id', $existing->keys())->get()->keyBy('id');

        // The plan items sent that are still in one of the user's plans
        $itemIds = PlanItem::query()
            ->whereIn('plan_items.id', array_filter(array_column($exercises, 'plan_item_id')))
            ->join('plan_days', 'plan_days.id', '=', 'plan_items.plan_day_id')
            ->join('plans', 'plans.id', '=', 'plan_days.plan_id')
            ->where('plans.user_id', $user->id)
            ->pluck('plan_items.id')
            ->all();

        // Any row not sent is deleted at the end
        $keptExerciseIds = [];
        $keptSetIds = [];

        foreach (array_values($exercises) as $position => $data) {
            $row = $existing->get($data['id']) ?? new SessionExercise(['id' => $data['id']]);
            $row->fill([
                'exercise_id' => $data['exercise_id'],
                // A plan item that no longer holds becomes empty
                'plan_item_id' => in_array($data['plan_item_id'] ?? null, $itemIds, true) ? $data['plan_item_id'] : null,
                'position' => $position,
                'superset_group' => $data['superset_group'] ?? null,
                'notes' => $data['notes'] ?? null,
            ]);
            $row->workout_session_id = $session->id;
            $row->save();
            $keptExerciseIds[] = $row->id;

            foreach (array_values($data['sets']) as $setPosition => $setData) {
                $set = $existingSets->get($setData['id']) ?? new LoggedSet(['id' => $setData['id']]);
                $set->fill([
                    'position' => $setPosition,
                    'set_type' => $setData['set_type'],
                    'weight_kg' => $setData['weight_kg'] ?? null,
                    'reps' => $setData['reps'] ?? null,
                    'duration_seconds' => $setData['duration_seconds'] ?? null,
                    'distance_meters' => $setData['distance_meters'] ?? null,
                    'completed_at' => $this->utc($setData['completed_at']),
                ]);
                // The set may be new, or may have moved to another exercise
                // of the same session
                $set->session_exercise_id = $row->id;
                $set->save();
                $keptSetIds[] = $set->id;
            }
        }

        // Sets first, by id: one moved to a kept exercise already points to it
        LoggedSet::query()->whereIn('id', $existingSets->keys())->whereNotIn('id', $keptSetIds)->delete();
        $session->sessionExercises()->whereNotIn('id', $keptExerciseIds)->delete();
    }
}
