<?php

namespace App\Actions\Workouts;

// Imports: the models it reads and writes, the exception of a 403, and the DB
// facade for the transaction
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
 * Saves a whole workout sent by the phone, which may send it late and more
 * than once (docs/design/D3-data-model.md D3.6.5, docs/design/D2-decisions.md
 * D2.7). Called by PUT /api/sessions/{id}; the data is validated by
 * SaveSessionRequest.
 *
 * An action (docs/concepts/C2-backend.md C2.5.3). What a save does, in one
 * transaction:
 *
 * 1. **Finds the session by its UUID, deleted ones included.** Someone else's:
 *    refused (403). Deleted: left deleted, nothing written, and the caller
 *    is told (a 410): a late send must not bring back a workout deleted
 *    elsewhere (D3.7.3). Unknown: a new session.
 * 2. **Keeps only the links to the plan that still hold**: the plan, if it is
 *    still one of the user's; the day, if it is still in that plan; each
 *    exercise's plan item, if it is still in one of the user's plans. The
 *    others become empty. A workout done offline is never refused because
 *    the plan changed meanwhile; it keeps its copied names (D3.7.1).
 * 3. **Makes the exercises and the sets exactly the ones sent**, matched by
 *    their UUIDs, the place in each list as the position. Those not sent are
 *    deleted: an exercise taken out, a set unticked on the phone.
 *
 * Sending the same session twice changes nothing the second time: every row
 * is found by its id, and save() writes only what changed.
 *
 * **Moments are turned into UTC before they are written.** The phone sends
 * "2026-11-09T18:00:00+01:00"; Laravel writes dates as "Y-m-d H:i:s", without
 * the offset, so 18:00 in Rome would be stored as 18:00 UTC, an hour late
 * (docs/how-to/H2-backend.md H2.14.5). In UTC first, it is stored as 17:00,
 * the exact moment.
 */
class SaveWorkoutSession
{
    /**
     * Saves a workout.
     *
     * @param  User  $user  the signed-in user
     * @param  string  $id  the session's UUID, from the address
     * @param  array<string, mixed>  $data  the validated session
     * @return WorkoutSession|null the session as saved; null when it had been
     *                             deleted, and was left so
     *
     * @throws AuthorizationException when the UUID is another user's session
     */
    public function save(User $user, string $id, array $data): ?WorkoutSession
    {
        return DB::transaction(function () use ($user, $id, $data) {
            // withTrashed(): a deleted session must be found, to be left alone
            $session = WorkoutSession::withTrashed()->find($id);

            if ($session !== null && $session->user_id !== $user->id) {
                // Someone else's UUID (D3.2.1): the same 403 as a policy's
                throw new AuthorizationException;
            }
            if ($session?->trashed()) {
                return null;
            }

            // `??=` assigns only when the left side is null: a new session,
            // with the device's id and its owner
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
     * A moment sent by the phone, in UTC, so that no offset is lost when it is
     * written (see above).
     *
     * @param  string|null  $moment  such as "2026-11-09T18:00:00+01:00"
     * @return Carbon|null the same moment, in UTC; null for none
     */
    private function utc(?string $moment): ?Carbon
    {
        // Carbon::parse() reads the offset; utc() moves the clock to UTC
        return $moment === null ? null : Carbon::parse($moment)->utc();
    }

    /**
     * The plan and the day to link, of those sent: each only if it still
     * exists and is the user's, the day only if it is in that plan.
     *
     * @param  User  $user  the owner
     * @param  array<string, mixed>  $data  the validated session
     * @return array{0: string|null, 1: string|null} the plan's id and the day's
     */
    private function planLinks(User $user, array $data): array
    {
        // The plan sent, if it is still one of the user's
        $planId = isset($data['plan_id']) && $user->plans()->whereKey($data['plan_id'])->exists()
            ? $data['plan_id']
            : null;
        // The day sent, if it is still in that plan
        $dayId = $planId !== null && isset($data['plan_day_id'])
            && PlanDay::query()->whereKey($data['plan_day_id'])->where('plan_id', $planId)->exists()
            ? $data['plan_day_id']
            : null;

        return [$planId, $dayId];
    }

    /**
     * Makes the session's exercises and sets exactly the ones sent.
     *
     * @param  User  $user  the owner
     * @param  WorkoutSession  $session  the session, saved
     * @param  list<array<string, mixed>>  $exercises  the validated exercises, in order
     */
    private function saveExercises(User $user, WorkoutSession $session, array $exercises): void
    {
        // What the session has now, each keyed by its id
        $existing = $session->sessionExercises()->get()->keyBy('id');
        // …and their sets, every one of the session, in one query
        $existingSets = LoggedSet::query()->whereIn('session_exercise_id', $existing->keys())->get()->keyBy('id');

        // The plan items sent that are still in one of the user's plans, in
        // one query: plan_items joined to their day and their plan
        $itemIds = PlanItem::query()
            ->whereIn('plan_items.id', array_filter(array_column($exercises, 'plan_item_id')))
            ->join('plan_days', 'plan_days.id', '=', 'plan_items.plan_day_id')
            ->join('plans', 'plans.id', '=', 'plan_days.plan_id')
            ->where('plans.user_id', $user->id)
            ->pluck('plan_items.id')
            ->all();

        // The ids of the exercises and sets sent, which stay; any other row goes
        $keptExerciseIds = [];
        $keptSetIds = [];

        foreach (array_values($exercises) as $position => $data) {
            // The exercise the session already has with this id, or a new one
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
            // `[] =` adds an entry at the end of the list
            $keptExerciseIds[] = $row->id;

            foreach (array_values($data['sets']) as $setPosition => $setData) {
                // The set already there with this id, or a new one
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
                // Set here: the set may be new, or may have moved to another
                // exercise of the same session
                $set->session_exercise_id = $row->id;
                $set->save();
                // Kept: not deleted at the end
                $keptSetIds[] = $set->id;
            }
        }

        // The sets and exercises no longer sent. Sets first, by id: one moved
        // to a kept exercise already points to it
        LoggedSet::query()->whereIn('id', $existingSets->keys())->whereNotIn('id', $keptSetIds)->delete();
        $session->sessionExercises()->whereNotIn('id', $keptExerciseIds)->delete();
    }
}
