<?php

namespace App\Http\Controllers;

use App\Actions\Exercises\DuplicateExercise;
use App\Actions\Exercises\SavePersonalExercise;
use App\Http\Requests\ListExercisesRequest;
use App\Http\Requests\StoreExerciseRequest;
use App\Http\Requests\UpdateExerciseRequest;
use App\Http\Resources\ExerciseResource;
use App\Models\Exercise;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

class ExerciseController extends Controller
{
    /**
     * Eager-loaded with every exercise; `media` holds the photos.
     *
     * @var list<string>
     */
    private const RELATIONS = ['equipment', 'muscles', 'media'];

    /**
     * GET /api/exercises: public exercises and the user's own, by name, one
     * page at a time. Each filter calls a model scope; an unknown filter is a
     * 400.
     */
    public function index(ListExercisesRequest $request): AnonymousResourceCollection
    {
        $exercises = QueryBuilder::for(Exercise::visibleTo($request->user()))
            ->allowedFilters(
                // The package would otherwise split the search at commas
                AllowedFilter::scope('search')->delimiter(''),
                AllowedFilter::scope('muscle', 'withPrimaryMuscle'),
                AllowedFilter::scope('equipment', 'usingEquipment'),
                AllowedFilter::scope('source', 'fromSource'),
            )
            ->with(self::RELATIONS)
            ->orderByName()
            ->paginate($request->perPage())
            ->withQueryString();

        return ExerciseResource::collection($exercises);
    }

    public function show(Exercise $exercise): ExerciseResource
    {
        Gate::authorize('view', $exercise);

        return new ExerciseResource($exercise->load(self::RELATIONS));
    }

    /**
     * Always a personal exercise, written in the request's language.
     */
    public function store(StoreExerciseRequest $request, SavePersonalExercise $save): ExerciseResource
    {
        Gate::authorize('create', Exercise::class);

        $exercise = $save->create($request->user(), $request->validated());

        return new ExerciseResource($exercise->load(self::RELATIONS));
    }

    /**
     * Only the fields sent change.
     */
    public function update(UpdateExerciseRequest $request, Exercise $exercise, SavePersonalExercise $save): ExerciseResource
    {
        Gate::authorize('update', $exercise);

        $save->update($exercise, $request->validated());

        return new ExerciseResource($exercise->load(self::RELATIONS));
    }

    /**
     * Soft delete: plans and history that point to it keep working, and its
     * photos stay on disk.
     */
    public function destroy(Exercise $exercise): Response
    {
        Gate::authorize('delete', $exercise);

        $exercise->delete();

        return response()->noContent();
    }

    /**
     * POST /api/exercises/{exercise}/duplicate: a public exercise copied as the
     * user's own, photos included, in the request's language.
     *
     * The 201 is explicit, so it does not depend on how the action saves the
     * copy.
     */
    public function duplicate(Request $request, Exercise $exercise, DuplicateExercise $duplicate): JsonResponse
    {
        Gate::authorize('duplicate', $exercise);

        $copy = $duplicate->handle($exercise, $request->user(), app()->getLocale());

        return (new ExerciseResource($copy->load(self::RELATIONS)))->response()->setStatusCode(201);
    }
}
