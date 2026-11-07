<?php

namespace App\Http\Controllers;

// Imports: the action that saves, the three Form Requests, the resources, the
// models, Gate, DB, and the answer types
use App\Actions\Workouts\SaveWorkoutSession;
use App\Http\Requests\LastSetsRequest;
use App\Http\Requests\ListSessionsRequest;
use App\Http\Requests\SaveSessionRequest;
use App\Http\Resources\LoggedSetResource;
use App\Http\Resources\WorkoutSessionResource;
use App\Models\LoggedSet;
use App\Models\WorkoutSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

/**
 * The workouts' API (docs/concepts/C2-backend.md C2.5.7): saving a whole
 * session sent by the phone, listing, reading and deleting sessions, and the
 * sets of last time for workout mode's "Last" column
 * (docs/design/D1-ui.md D1.4.9).
 *
 * The routes are written one by one in routes/api.php, not with
 * apiResource(): saving is a PUT to the session's own UUID, which creates it
 * when it is new, so there is no POST, and its {session} is not loaded by
 * route model binding (there may be no row yet).
 */
class WorkoutSessionController extends Controller
{
    /**
     * What is loaded with a whole session: each exercise with what
     * ExerciseResource sends, and its sets. One query per relation.
     *
     * @var list<string>
     */
    private const TREE = [
        'sessionExercises.sets',
        'sessionExercises.exercise.equipment',
        'sessionExercises.exercise.muscles',
        'sessionExercises.exercise.media',
    ];

    /**
     * GET /api/sessions: the user's workouts, the most recent first, 20 per
     * page, each with its totals; `?status=open` or `finished` to choose.
     *
     * @param  ListSessionsRequest  $request  the validated request
     * @return AnonymousResourceCollection the page: `data`, `links`, `meta`
     */
    public function index(ListSessionsRequest $request): AnonymousResourceCollection
    {
        // This user's sessions only, with their totals, filtered, newest
        // first, one page. Nothing is read before paginate()
        $sessions = $request->user()->workoutSessions()
            ->withTotals()
            // when(): runs the function only when the first value is truthy
            ->when($request->query('status'), fn ($query, string $status) => $query->finished($status === 'finished'))
            ->latest('started_at')
            ->paginate($request->perPage())
            ->withQueryString();

        return WorkoutSessionResource::collection($sessions);
    }

    /**
     * GET /api/sessions/{session}: one whole workout, with its totals.
     *
     * @param  WorkoutSession  $session  the session in the URL (a deleted one is a 404)
     * @return WorkoutSessionResource the session, its exercises and sets
     */
    public function show(WorkoutSession $session): WorkoutSessionResource
    {
        Gate::authorize('view', $session);

        // Read again with the totals, which only a query can add
        $withTotals = WorkoutSession::query()->withTotals()->findOrFail($session->id);

        return new WorkoutSessionResource($withTotals->load(self::TREE));
    }

    /**
     * PUT /api/sessions/{session}: saves a whole workout, new or not
     * (SaveWorkoutSession). Answers 201 for a new session, 200 for one saved
     * again, and 410 Gone for one deleted elsewhere meanwhile, which stays
     * deleted: the phone's queue reads 410 as "done, do not retry".
     *
     * @param  SaveSessionRequest  $request  the validated request
     * @param  string  $session  the session's UUID, from the address
     * @param  SaveWorkoutSession  $save  the action that writes it
     * @return WorkoutSessionResource|JsonResponse the session, or the 410
     */
    public function save(SaveSessionRequest $request, string $session, SaveWorkoutSession $save): WorkoutSessionResource|JsonResponse
    {
        // The session as saved, or null when it had been deleted elsewhere
        $saved = $save->save($request->user(), $session, $request->validated());

        if ($saved === null) {
            return response()->json(['message' => 'This workout was deleted.'], 410);
        }

        // A resource wrapping a model created in this request answers 201
        return new WorkoutSessionResource($saved->load(self::TREE));
    }

    /**
     * DELETE /api/sessions/{session}: deletes a workout. A soft delete: the
     * row stays as a marker, so a late send does not bring it back (D3.7.3).
     *
     * @param  WorkoutSession  $session  the session in the URL
     * @return Response an empty answer, 204
     */
    public function destroy(WorkoutSession $session): Response
    {
        Gate::authorize('delete', $session);

        $session->delete();

        return response()->noContent();
    }

    /**
     * GET /api/sessions/last-sets?exercises=12,40: for each exercise, the sets
     * of the last finished workout in which it was done, in any plan
     * (docs/design/D3-data-model.md D3.6.4). Exercises never done are left
     * out. An exercise skipped (no sets) does not count as done.
     *
     *     { "data": [
     *         { "exercise_id": 12, "session_id": "0192…", "started_at": "…",
     *           "sets": [ …LoggedSetResource… ] }
     *     ] }
     *
     * Two queries, whatever the number of exercises. The first uses
     * Postgres's `distinct on (exercise_id)`: of the rows sorted by exercise
     * and then by date, newest first, it keeps the first row of each
     * exercise, which is its latest.
     *
     * @param  LastSetsRequest  $request  the validated request
     * @return JsonResponse the list
     */
    public function lastSets(LastSetsRequest $request): JsonResponse
    {
        // One row per exercise: its latest exercise-of-a-session, with that
        // session's id and start
        $latest = DB::table('session_exercises')
            ->join('workout_sessions', 'workout_sessions.id', '=', 'session_exercises.workout_session_id')
            ->selectRaw('distinct on (session_exercises.exercise_id) session_exercises.id, session_exercises.exercise_id, workout_sessions.id as session_id, workout_sessions.started_at')
            ->where('workout_sessions.user_id', $request->user()->id)
            ->whereNotNull('workout_sessions.finished_at')
            // A query builder, not a model: SoftDeletes does not apply, so
            // deleted sessions are left out by hand (D3.11)
            ->whereNull('workout_sessions.deleted_at')
            ->whereIn('session_exercises.exercise_id', $request->exerciseIds())
            ->whereExists(fn ($sets) => $sets->from('logged_sets')->whereColumn('logged_sets.session_exercise_id', 'session_exercises.id'))
            ->orderBy('session_exercises.exercise_id')
            ->orderByDesc('workout_sessions.started_at')
            ->orderBy('session_exercises.position')
            ->get();

        // The sets of those rows, grouped by their exercise of the session
        $sets = LoggedSet::query()->whereIn('session_exercise_id', $latest->pluck('id'))->orderBy('position')->get()->groupBy('session_exercise_id');

        return response()->json(['data' => $latest->map(fn ($row) => [
            'exercise_id' => $row->exercise_id,
            'session_id' => $row->session_id,
            // A plain query gives the database's text: turned into ISO 8601
            // like every date the API sends
            'started_at' => Carbon::parse($row->started_at)->toJSON(),
            'sets' => LoggedSetResource::collection($sets->get($row->id, collect())),
        ])->values()]);
    }
}
