<?php

namespace App\Http\Controllers;

// Imports: the action that saves, the three Form Requests, the resource, the
// model, Gate (asks the policy), the answer types, and the two classes of
// spatie/laravel-query-builder
use App\Actions\Exercises\SavePersonalExercise;
use App\Http\Requests\ListExercisesRequest;
use App\Http\Requests\StoreExerciseRequest;
use App\Http\Requests\UpdateExerciseRequest;
use App\Http\Resources\ExerciseResource;
use App\Models\Exercise;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use Spatie\QueryBuilder\AllowedFilter;
use Spatie\QueryBuilder\QueryBuilder;

/**
 * The exercise library's API: listing, reading, creating, changing and
 * deleting exercises (docs/design/D1-ui.md D1.4.3–D1.4.5). The routes are one
 * line in routes/api.php, `Route::apiResource('exercises', …)`, which ties
 * each method below to its URL.
 *
 * A thin controller (docs/concepts/C2-backend.md C2.5): each method asks
 * ExercisePolicy (Gate::authorize), lets a Form Request validate, hands the
 * work to the model's scopes or to SavePersonalExercise, and answers with
 * ExerciseResource. Created with
 * `make:controller ExerciseController --api --model=Exercise`, which wrote
 * the five empty methods.
 *
 * Every route here is under `auth:sanctum`, so `$request->user()` is never null.
 */
class ExerciseController extends Controller
{
    /**
     * The relations sent with every exercise, loaded in one query each for
     * the whole page rather than one per exercise (ExerciseResource explains
     * why). `media` holds the photos (spatie/laravel-medialibrary).
     *
     * @var list<string>
     */
    private const RELATIONS = ['equipment', 'muscles', 'media'];

    /**
     * GET /api/exercises: the library, one page at a time. Public exercises
     * and the user's own, sorted by name, with the filters of
     * ListExercisesRequest.
     *
     * QueryBuilder::for() wraps a query and reads `filter[...]` from the
     * request; allowedFilters() lists the filters it accepts, and any other
     * name gets a 400. Each filter here calls a scope of the model:
     * `filter[muscle]=chest` calls withPrimaryMuscle('chest'). delimiter('')
     * stops the package from splitting the search at commas, as it does for
     * the slugs (docs/concepts/C2-backend.md C2.5.2).
     *
     * @param  ListExercisesRequest  $request  the validated request
     * @return AnonymousResourceCollection the page: `data`, `links` and `meta`
     */
    public function index(ListExercisesRequest $request): AnonymousResourceCollection
    {
        // The query: visible exercises only, filtered, with their relations,
        // sorted. Nothing is read from the database before paginate()
        $exercises = QueryBuilder::for(Exercise::visibleTo($request->user()))
            ->allowedFilters(
                AllowedFilter::scope('search')->delimiter(''),
                // The filter's name, then the scope it calls
                AllowedFilter::scope('muscle', 'withPrimaryMuscle'),
                AllowedFilter::scope('equipment', 'usingEquipment'),
                AllowedFilter::scope('source', 'fromSource'),
            )
            ->with(self::RELATIONS)
            ->orderByName()
            // One page: `?page=2` picks which. It runs two queries: the rows
            // of the page, and the count of all rows for `meta.total`
            ->paginate($request->perPage())
            // The links to the other pages keep the filters
            ->withQueryString();

        // collection(): applies ExerciseResource to each exercise. With a
        // paginator, the answer also has `links` and `meta` (current page,
        // last page, total) next to `data`
        return ExerciseResource::collection($exercises);
    }

    /**
     * GET /api/exercises/{exercise}: one exercise, for its details page.
     *
     * `Exercise $exercise` is route model binding: Laravel loads the exercise
     * whose id is in the URL, and answers 404 if there is none or it is
     * soft-deleted (docs/concepts/C2-backend.md C2.5).
     *
     * @param  Exercise  $exercise  the exercise in the URL
     * @return ExerciseResource the exercise, with its equipment and muscles
     */
    public function show(Exercise $exercise): ExerciseResource
    {
        // Someone else's personal exercise: 403
        Gate::authorize('view', $exercise);

        // load(): reads the relations now, on a model already loaded
        return new ExerciseResource($exercise->load(self::RELATIONS));
    }

    /**
     * POST /api/exercises: creates a personal exercise, in the request's
     * language. Answers 201 with the new exercise.
     *
     * The action is a parameter: Laravel's service container sees the type
     * SavePersonalExercise and builds one ("dependency injection"). The 201
     * is Laravel's own doing: a resource wrapping a model that was just
     * created answers 201 instead of 200.
     *
     * @param  StoreExerciseRequest  $request  the validated request
     * @param  SavePersonalExercise  $save  the action that writes it
     * @return ExerciseResource the new exercise
     */
    public function store(StoreExerciseRequest $request, SavePersonalExercise $save): ExerciseResource
    {
        // No exercise yet, so the policy is asked about the class
        Gate::authorize('create', Exercise::class);

        // validated(): only the fields that passed the rules
        $exercise = $save->create($request->user(), $request->validated());

        return new ExerciseResource($exercise->load(self::RELATIONS));
    }

    /**
     * PATCH (or PUT) /api/exercises/{exercise}: changes a personal exercise.
     * Only the fields sent change.
     *
     * @param  UpdateExerciseRequest  $request  the validated request
     * @param  Exercise  $exercise  the exercise in the URL
     * @param  SavePersonalExercise  $save  the action that writes it
     * @return ExerciseResource the exercise as it is now
     */
    public function update(UpdateExerciseRequest $request, Exercise $exercise, SavePersonalExercise $save): ExerciseResource
    {
        // A public exercise, or someone else's: 403
        Gate::authorize('update', $exercise);

        $save->update($exercise, $request->validated());

        return new ExerciseResource($exercise->load(self::RELATIONS));
    }

    /**
     * DELETE /api/exercises/{exercise}: deletes a personal exercise. Answers
     * 204, with no body.
     *
     * A soft delete (SoftDeletes on the model): the row stays, with
     * deleted_at filled, so plans and history that point to it keep working
     * (docs/design/D3-data-model.md D3.7.2). It disappears from the list and
     * from this API, and its photos stay on disk (D3.4.4).
     *
     * @param  Exercise  $exercise  the exercise in the URL
     * @return Response an empty answer
     */
    public function destroy(Exercise $exercise): Response
    {
        Gate::authorize('delete', $exercise);

        $exercise->delete();

        return response()->noContent();
    }
}
