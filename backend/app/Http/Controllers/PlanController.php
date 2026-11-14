<?php

namespace App\Http\Controllers;

use App\Actions\Plans\ExportPlan;
use App\Actions\Plans\ImportPlan;
use App\Actions\Plans\SavePlan;
use App\Http\Requests\ImportPlanRequest;
use App\Http\Requests\ListPlansRequest;
use App\Http\Requests\StorePlanRequest;
use App\Http\Requests\UpdatePlanRequest;
use App\Http\Resources\PlanResource;
use App\Models\Plan;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

/**
 * A {plan} that is not a UUID is a 404, like a missing plan.
 */
class PlanController extends Controller
{
    /**
     * A whole plan, one query per relation whatever its size.
     *
     * @var list<string>
     */
    private const TREE = [
        'days.items.sets',
        'days.items.exercise.equipment',
        'days.items.exercise.muscles',
        'days.items.exercise.media',
    ];

    /**
     * GET /api/plans: the plans in use, or with `?archived=1` the archived
     * ones; the active plan first. Each carries its number of days and when it
     * was last used, not the days themselves.
     */
    public function index(ListPlansRequest $request): AnonymousResourceCollection
    {
        $user = $request->user();

        $plans = $user->plans()
            ->archived($request->wantsArchived())
            ->withCount('days')
            ->withMax(['workoutSessions as last_used_at' => fn ($sessions) => $sessions->whereNotNull('finished_at')], 'started_at')
            ->activeFirst($user->active_plan_id)
            ->get();

        return PlanResource::collection($plans);
    }

    public function show(Plan $plan): PlanResource
    {
        Gate::authorize('view', $plan);

        return new PlanResource($plan->load(self::TREE));
    }

    /**
     * POST /api/plans: creates a whole plan, 201.
     *
     * Idempotent: sent again with the same id after a lost answer, it returns
     * the saved plan with 200 and writes nothing.
     */
    public function store(StorePlanRequest $request, SavePlan $save): PlanResource
    {
        Gate::authorize('create', Plan::class);

        $data = $request->validated();
        $existing = isset($data['id']) ? $request->user()->plans()->find($data['id']) : null;

        // The resource answers 201 only for a model created in this request
        $plan = $existing ?? $save->create($request->user(), $data);

        return new PlanResource($plan->load(self::TREE));
    }

    /**
     * PUT /api/plans/{plan}: saves the whole plan again. The last save wins;
     * `meta.changed_elsewhere` tells the app to warn:
     *
     *     { "data": { …the plan… }, "meta": { "changed_elsewhere": true } }
     */
    public function update(UpdatePlanRequest $request, Plan $plan, SavePlan $save): PlanResource
    {
        Gate::authorize('update', $plan);

        $changedElsewhere = $save->update($plan, $request->validated());

        return (new PlanResource($plan->load(self::TREE)))
            ->additional(['meta' => ['changed_elsewhere' => $changedElsewhere]]);
    }

    /**
     * Days, items and sets go by cascade; an active plan leaves
     * users.active_plan_id null. Workouts stay, with their copies of the names.
     */
    public function destroy(Plan $plan): Response
    {
        Gate::authorize('delete', $plan);

        $plan->delete();

        return response()->noContent();
    }

    /**
     * Replaces the active plan. A single column, so two plans can never be
     * active at once.
     */
    public function activate(Request $request, Plan $plan): PlanResource
    {
        Gate::authorize('activate', $plan);

        $request->user()->activePlan()->associate($plan)->save();

        return new PlanResource($plan->loadCount('days'));
    }

    /**
     * An archived plan cannot stay active (PlanPolicy::activate), so the
     * user may be left with none.
     */
    public function archive(Request $request, Plan $plan): PlanResource
    {
        Gate::authorize('update', $plan);

        $user = $request->user();

        DB::transaction(function () use ($user, $plan) {
            $plan->archived_at = now();
            $plan->save();

            if ($user->active_plan_id === $plan->id) {
                $user->activePlan()->dissociate()->save();
            }
        });

        return new PlanResource($plan->loadCount('days'));
    }

    /**
     * Back in the list, not active.
     */
    public function unarchive(Plan $plan): PlanResource
    {
        Gate::authorize('update', $plan);

        $plan->archived_at = null;
        $plan->save();

        return new PlanResource($plan->loadCount('days'));
    }

    /**
     * GET /api/plans/{plan}/export: the content of a `.atleoplan.json` file
     * (ExportPlan). Plain JSON, not a resource: the file has its own shape
     * and is read back as it is.
     */
    public function export(Plan $plan, ExportPlan $export): JsonResponse
    {
        Gate::authorize('view', $plan);

        return response()->json($export->export($plan));
    }

    /**
     * POST /api/plans/import: a plan file as a new plan (ImportPlan), 201,
     * with the exercises it had to create in `meta.created_exercises`.
     */
    public function import(ImportPlanRequest $request, ImportPlan $import): JsonResponse
    {
        Gate::authorize('create', Plan::class);

        $result = $import->import($request->user(), $request->validated());

        return (new PlanResource($result['plan']->load(self::TREE)))
            ->additional(['meta' => ['created_exercises' => $result['created']]])
            ->response()
            ->setStatusCode(201);
    }
}
