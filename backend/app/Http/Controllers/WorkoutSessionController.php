<?php

namespace App\Http\Controllers;

use App\Actions\Workouts\FindLastSets;
use App\Actions\Workouts\SaveWorkoutSession;
use App\Http\Requests\LastSetsRequest;
use App\Http\Requests\ListSessionsRequest;
use App\Http\Requests\SaveSessionRequest;
use App\Http\Resources\WorkoutSessionResource;
use App\Models\WorkoutSession;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;

/**
 * The workouts' API.
 *
 * Not an apiResource: saving is a PUT to the session's own UUID, which
 * creates it when new, so there is no POST and no route model binding on
 * save (there may be no row yet).
 */
class WorkoutSessionController extends Controller
{
    /**
     * A whole session, one query per relation.
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
     * GET /api/sessions: newest first, with totals; `?status=open` or
     * `finished`.
     */
    public function index(ListSessionsRequest $request): AnonymousResourceCollection
    {
        $sessions = $request->user()->workoutSessions()
            ->withTotals()
            ->when($request->query('status'), fn ($query, string $status) => $query->finished($status === 'finished'))
            ->latest('started_at')
            ->paginate($request->perPage())
            ->withQueryString();

        return WorkoutSessionResource::collection($sessions);
    }

    /**
     * GET /api/sessions/{session}: a whole workout with its totals, and in
     * `meta.last_sets` the previous time each exercise was done, in any plan,
     * for history's comparison (FindLastSets):
     *
     *     { "data": { …the session… },
     *       "meta": { "last_sets": [ { "exercise_id": 12, "session_id": "0192…", "started_at": "…", "sets": [ … ] } ] } }
     */
    public function show(WorkoutSession $session, FindLastSets $lastSets): WorkoutSessionResource
    {
        Gate::authorize('view', $session);

        // Read again: only a query can add the totals
        $withTotals = WorkoutSession::query()->withTotals()->findOrFail($session->id)->load(self::TREE);
        $exerciseIds = $withTotals->sessionExercises->pluck('exercise_id')->unique()->values()->all();

        return (new WorkoutSessionResource($withTotals))
            ->additional(['meta' => ['last_sets' => $lastSets->for($session->user, $exerciseIds, $withTotals)]]);
    }

    /**
     * PUT /api/sessions/{session}: saves a whole workout (SaveWorkoutSession):
     * 201 when new, 200 when saved again, 410 when deleted elsewhere
     * meanwhile. The phone's queue reads 410 as "done, do not retry".
     */
    public function save(SaveSessionRequest $request, string $session, SaveWorkoutSession $save): WorkoutSessionResource|JsonResponse
    {
        $saved = $save->save($request->user(), $session, $request->validated());

        if ($saved === null) {
            return response()->json(['message' => 'This workout was deleted.'], 410);
        }

        return new WorkoutSessionResource($saved->load(self::TREE));
    }

    /**
     * Soft delete: the row stays as a marker, so a late send does not bring the
     * workout back.
     */
    public function destroy(WorkoutSession $session): Response
    {
        Gate::authorize('delete', $session);

        $session->delete();

        return response()->noContent();
    }

    /**
     * GET /api/sessions/last-sets?exercises=12,40: workout mode's "Last"
     * column. The rules and the answer's shape are in FindLastSets.
     */
    public function lastSets(LastSetsRequest $request, FindLastSets $lastSets): JsonResponse
    {
        return response()->json(['data' => $lastSets->for($request->user(), $request->exerciseIds())]);
    }
}
