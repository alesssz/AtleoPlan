<?php

namespace App\Actions\Workouts;

// Imports: the resource of a set, the models, the query builder's facade,
// Carbon for dates
use App\Http\Resources\LoggedSetResource;
use App\Models\LoggedSet;
use App\Models\User;
use App\Models\WorkoutSession;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * "Last time" for some exercises: for each, the sets of the last finished,
 * not deleted workout of the user in which it had at least one set, in any
 * plan (docs/design/D3-data-model.md D3.6.4).
 *
 * **Of each kind.** An exercise done by reps can also be done as fast as
 * possible (a plan item with `for_time`): its sets then have seconds too,
 * "50 in 1:12". Last time's 3 × 15 says nothing about the time to beat, and
 * the other way round, so each kind has its own last time: an exercise done
 * both ways gets two entries, the latest with timed sets and the latest
 * without. The app tells them apart by the sets (a set with seconds).
 *
 * Used twice:
 * - by GET /api/sessions/last-sets, for workout mode's "Last" column, when a
 *   workout starts: the latest workout of all;
 * - by GET /api/sessions/{id}, for the comparison exercise by exercise of
 *   history (docs/design/D1-ui.md D1.4.11): `$before` is the workout shown,
 *   and only workouts started before it count, so a workout opened weeks
 *   later is compared with what came before *it*.
 *
 * The answer, one entry per exercise done before, the others left out:
 *
 *     [ { "exercise_id": 12, "session_id": "0192…", "started_at": "…",
 *         "sets": [ …LoggedSetResource… ] } ]
 *
 * Two queries, whatever the number of exercises. The first uses Postgres's
 * `distinct on (exercise_id, timed)`: of the rows sorted by exercise, kind
 * and then date, newest first, it keeps the first row of each exercise and
 * kind, its latest.
 *
 * An action (docs/concepts/C2-backend.md C2.5.3), taken out of the
 * controller when the second use came (FEAT-4).
 */
class FindLastSets
{
    /**
     * The sets of last time.
     *
     * @param  User  $user  whose workouts
     * @param  list<int>  $exerciseIds  the exercises asked for
     * @param  WorkoutSession|null  $before  only workouts started before this one; null for any
     * @return list<array<string, mixed>> one entry per exercise done before
     */
    public function for(User $user, array $exerciseIds, ?WorkoutSession $before = null): array
    {
        // The kind of an exercise of a session, as SQL: true when one of its
        // sets has seconds (timed, or done as fast as possible)
        $timed = 'exists (select 1 from logged_sets as timed_sets where timed_sets.session_exercise_id = session_exercises.id and timed_sets.duration_seconds is not null)';

        // One row per exercise and kind: its latest exercise-of-a-session,
        // with that session's id and start. `distinct on` must repeat the
        // first expressions of `order by`, so the kind is written twice
        $latest = DB::table('session_exercises')
            ->join('workout_sessions', 'workout_sessions.id', '=', 'session_exercises.workout_session_id')
            ->selectRaw("distinct on (session_exercises.exercise_id, {$timed}) session_exercises.id, session_exercises.exercise_id, workout_sessions.id as session_id, workout_sessions.started_at")
            ->where('workout_sessions.user_id', $user->id)
            ->whereNotNull('workout_sessions.finished_at')
            // A query builder, not a model: SoftDeletes does not apply, so
            // deleted sessions are left out by hand (D3.11)
            ->whereNull('workout_sessions.deleted_at')
            // when(): adds the conditions only when there is a workout to
            // compare with. Before it, and never itself
            ->when($before, fn ($query, WorkoutSession $session) => $query
                ->where('workout_sessions.started_at', '<', $session->started_at)
                ->where('workout_sessions.id', '!=', $session->id))
            ->whereIn('session_exercises.exercise_id', $exerciseIds)
            ->whereExists(fn ($sets) => $sets->from('logged_sets')->whereColumn('logged_sets.session_exercise_id', 'session_exercises.id'))
            ->orderBy('session_exercises.exercise_id')
            ->orderByRaw($timed)
            ->orderByDesc('workout_sessions.started_at')
            ->orderBy('session_exercises.position')
            ->get();

        // The sets of those rows, grouped by their exercise of the session
        $sets = LoggedSet::query()->whereIn('session_exercise_id', $latest->pluck('id'))->orderBy('position')->get()->groupBy('session_exercise_id');

        return $latest->map(fn ($row) => [
            'exercise_id' => $row->exercise_id,
            'session_id' => $row->session_id,
            // A plain query gives the database's text: turned into ISO 8601
            // like every date the API sends
            'started_at' => Carbon::parse($row->started_at)->toJSON(),
            'sets' => LoggedSetResource::collection($sets->get($row->id, collect())),
        ])->values()->all();
    }
}
