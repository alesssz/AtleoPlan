<?php

namespace App\Http\Controllers;

// Imports: the action that saves, the three Form Requests, the resource, the
// model, Gate (asks the policy), DB (for a transaction), and the request and
// answer types
use App\Actions\Plans\SavePlan;
use App\Http\Requests\ListPlansRequest;
use App\Http\Requests\StorePlanRequest;
use App\Http\Requests\UpdatePlanRequest;
use App\Http\Resources\PlanResource;
use App\Models\Plan;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

/**
 * The workout plans' API: listing, reading, creating, saving and deleting a
 * user's plans, plus three actions: make one the active plan, archive it,
 * bring it back (docs/design/D1-ui.md D1.4.6–D1.4.8; the endpoints:
 * docs/concepts/C2-backend.md C2.5.5).
 *
 * A thin controller, like ExerciseController: each method asks PlanPolicy
 * (Gate::authorize), lets a Form Request validate, hands the work to
 * SavePlan or to the model, and answers with PlanResource. Created with
 * `make:controller PlanController --api --model=Plan`, which wrote the five
 * methods of apiResource(); activate(), archive() and unarchive() were added
 * by hand, with a route each.
 *
 * Every route here is under `auth:sanctum`, so `$request->user()` is never
 * null. A {plan} that is not a UUID at all gets a 404, like a plan that does
 * not exist: HasUuids checks the format before querying.
 */
class PlanController extends Controller
{
    /**
     * What is loaded with a whole plan: the days, their items, the items'
     * sets, and each item's exercise with what ExerciseResource sends. The
     * dots follow the relations, and each relation is one query for the
     * whole plan, whatever its size: 7 queries, plus the one that found the
     * plan ("eager loading").
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
     * GET /api/plans: the user's plans in use, or with `?archived=1` the
     * archived ones. The active plan first, then the most recently changed;
     * each with its number of days, not the days themselves.
     *
     * @param  ListPlansRequest  $request  the validated request
     * @return AnonymousResourceCollection the plans, in `data`
     */
    public function index(ListPlansRequest $request): AnonymousResourceCollection
    {
        $user = $request->user();

        // $user->plans(): only this user's plans, which is the rule of
        // PlanPolicy::view() written as a query. Two scopes of Plan, then
        // withCount('days'), which adds a `days_count` column with a subquery
        $plans = $user->plans()
            ->archived($request->wantsArchived())
            ->withCount('days')
            ->activeFirst($user->active_plan_id)
            ->get();

        return PlanResource::collection($plans);
    }

    /**
     * GET /api/plans/{plan}: one whole plan, for its page and for the editor.
     *
     * `Plan $plan` is route model binding: Laravel loads the plan whose id is
     * in the URL, and answers 404 if there is none.
     *
     * @param  Plan  $plan  the plan in the URL
     * @return PlanResource the plan with its days, items, sets and exercises
     */
    public function show(Plan $plan): PlanResource
    {
        // Someone else's plan: 403
        Gate::authorize('view', $plan);

        return new PlanResource($plan->load(self::TREE));
    }

    /**
     * POST /api/plans: creates a plan, whole. Answers 201 with it.
     *
     * Sent twice with the same id, because the answer to the first try was
     * lost, it answers the second time with the plan already saved, 200, and
     * writes nothing: the device can retry without fear of duplicates
     * (docs/design/D3-data-model.md D3.2.1).
     *
     * @param  StorePlanRequest  $request  the validated request
     * @param  SavePlan  $save  the action that writes it (built by Laravel's
     *                          service container, C2.5.3)
     * @return PlanResource the plan
     */
    public function store(StorePlanRequest $request, SavePlan $save): PlanResource
    {
        Gate::authorize('create', Plan::class);

        $data = $request->validated();
        // A plan of mine with this id already: the first try got through
        $existing = isset($data['id']) ? $request->user()->plans()->find($data['id']) : null;

        // `??`: the existing plan, or a new one. A resource wrapping a model
        // just created answers 201 (wasRecentlyCreated), any other 200
        $plan = $existing ?? $save->create($request->user(), $data);

        return new PlanResource($plan->load(self::TREE));
    }

    /**
     * PUT /api/plans/{plan}: saves the whole plan again, after a change in
     * the editor. Answers 200 with the plan as it is now, and in `meta`
     * whether it had been changed elsewhere in the meantime:
     *
     *     { "data": { …the plan… }, "meta": { "changed_elsewhere": true } }
     *
     * The save goes through either way: the last change wins, and the app
     * warns (docs/design/D3-data-model.md D3.5.7).
     *
     * @param  UpdatePlanRequest  $request  the validated request
     * @param  Plan  $plan  the plan in the URL
     * @param  SavePlan  $save  the action that writes it
     * @return PlanResource the plan, with `meta`
     */
    public function update(UpdatePlanRequest $request, Plan $plan, SavePlan $save): PlanResource
    {
        Gate::authorize('update', $plan);

        $changedElsewhere = $save->update($plan, $request->validated());

        // additional(): extra keys next to `data` in the answer. load() reads
        // the relations again, so the answer shows what was just written
        return (new PlanResource($plan->load(self::TREE)))
            ->additional(['meta' => ['changed_elsewhere' => $changedElsewhere]]);
    }

    /**
     * DELETE /api/plans/{plan}: deletes a plan, for good. Answers 204.
     *
     * Its days, items and sets go too, by cascade in the database; if it was
     * the active plan, users.active_plan_id empties by itself (nullOnDelete,
     * docs/design/D3-data-model.md D3.7.1). The workout sessions of FEAT-3
     * will stay, with their copies of the names.
     *
     * @param  Plan  $plan  the plan in the URL
     * @return Response an empty answer
     */
    public function destroy(Plan $plan): Response
    {
        Gate::authorize('delete', $plan);

        $plan->delete();

        return response()->noContent();
    }

    /**
     * POST /api/plans/{plan}/activate: makes it the user's active plan,
     * replacing the one before (docs/design/D2-decisions.md D2.8). Answers
     * 200 with the plan, now `is_active`. An archived plan gets a 403.
     *
     * @param  Request  $request  the request, for its user
     * @param  Plan  $plan  the plan in the URL
     * @return PlanResource the plan
     */
    public function activate(Request $request, Plan $plan): PlanResource
    {
        // My own, and not archived (PlanPolicy::activate)
        Gate::authorize('activate', $plan);

        // associate(): sets users.active_plan_id to the plan's id; save()
        // writes it. One cell, so two plans can never be active at once
        $request->user()->activePlan()->associate($plan)->save();

        return new PlanResource($plan->loadCount('days'));
    }

    /**
     * POST /api/plans/{plan}/archive: archives the plan, which leaves the
     * list for the "Archived" filter (D1.4.6). If it was the active plan, the
     * user is left with none. Answers 200 with the plan.
     *
     * @param  Request  $request  the request, for its user
     * @param  Plan  $plan  the plan in the URL
     * @return PlanResource the plan
     */
    public function archive(Request $request, Plan $plan): PlanResource
    {
        Gate::authorize('update', $plan);

        $user = $request->user();

        // Two rows change, the plan and the user: together or not at all
        DB::transaction(function () use ($user, $plan) {
            // now(): the current date and time
            $plan->archived_at = now();
            $plan->save();

            // An archived plan cannot be the active one (PlanPolicy::activate)
            if ($user->active_plan_id === $plan->id) {
                // dissociate(): empties active_plan_id
                $user->activePlan()->dissociate()->save();
            }
        });

        return new PlanResource($plan->loadCount('days'));
    }

    /**
     * POST /api/plans/{plan}/unarchive: brings an archived plan back to the
     * list. It does not become active by itself. Answers 200 with the plan.
     *
     * @param  Plan  $plan  the plan in the URL
     * @return PlanResource the plan
     */
    public function unarchive(Plan $plan): PlanResource
    {
        Gate::authorize('update', $plan);

        $plan->archived_at = null;
        $plan->save();

        return new PlanResource($plan->loadCount('days'));
    }
}
