<?php

namespace App\Http\Controllers;

use App\Actions\Exercises\ExercisePhotos;
use App\Http\Requests\ReorderExercisePhotosRequest;
use App\Http\Requests\StoreExercisePhotoRequest;
use App\Http\Resources\ExercisePhotoResource;
use App\Models\Exercise;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

/**
 * The photos of a personal exercise:
 *
 * | Route | Does |
 * |---|---|
 * | POST /api/exercises/{exercise}/photos | Adds one photo (multipart, field `photo`); 201 with it |
 * | PUT /api/exercises/{exercise}/photos | Puts them in order (`ids`, the cover first); 200 with the list |
 * | DELETE /api/exercises/{exercise}/photos/{photo} | Removes one; 204 |
 * | GET /api/exercises/{exercise}/photos/{photo}/{size} | The file: `thumb`, `large` or `original` |
 *
 * Changes are the owner's only, through ExercisePolicy::update(): a public
 * exercise's photos are managed in the admin panel. The file is anyone's who
 * may see the exercise.
 */
class ExercisePhotoController extends Controller
{
    /**
     * Answers with the original's address at once: the conversions are made
     * by the queue a moment later (ExercisePhotoResource).
     */
    public function store(StoreExercisePhotoRequest $request, Exercise $exercise, ExercisePhotos $photos): ExercisePhotoResource
    {
        Gate::authorize('update', $exercise);

        return new ExercisePhotoResource($photos->add($exercise, $request->file('photo')));
    }

    public function reorder(ReorderExercisePhotosRequest $request, Exercise $exercise, ExercisePhotos $photos): AnonymousResourceCollection
    {
        Gate::authorize('update', $exercise);

        $photos->reorder($exercise, $request->validated('ids'));

        // Reloaded, so getMedia() sees the new order
        return ExercisePhotoResource::collection($exercise->refresh()->getMedia('photos'));
    }

    public function destroy(Exercise $exercise, Media $photo, ExercisePhotos $photos): Response
    {
        Gate::authorize('update', $exercise);
        $this->ensureItsPhoto($exercise, $photo);

        $photos->remove($photo);

        return response()->noContent();
    }

    /**
     * A personal exercise's photo, which has no address on `public`
     * (ExercisePhotos), for the `<img>` of the app on the same origin: the
     * session cookie goes with it. A soft-deleted exercise's too, as plans
     * and history still show it.
     *
     * Someone else's exercise is already a 404 (the binding of `{exercise}`,
     * AppServiceProvider), so whether it has photos does not show. A
     * conversion not made yet is a 404 as well: ExercisePhotoResource sends
     * `original` until then.
     *
     * @param  string  $size  thumb, large or original (the route allows no other)
     */
    public function show(Exercise $exercise, Media $photo, string $size): BinaryFileResponse
    {
        Gate::authorize('view', $exercise);
        $this->ensureItsPhoto($exercise, $photo);

        $conversion = $size === 'original' ? '' : $size;
        abort_if($conversion !== '' && ! $photo->hasGeneratedConversion($conversion), 404);

        $response = response()->file($photo->getPath($conversion), ['X-Content-Type-Options' => 'nosniff']);
        // A file response is public by default: no cache between the server
        // and the browser may keep this one. A week in the browser; the
        // service worker keeps it longer, offline
        $response->setPrivate();
        $response->setMaxAge(604800);

        return $response;
    }

    /**
     * Route binding would accept any media row, so the photo must belong to
     * this exercise; otherwise 404, as for a photo that does not exist.
     */
    private function ensureItsPhoto(Exercise $exercise, Media $photo): void
    {
        abort_unless(
            $photo->model_type === $exercise->getMorphClass()
                && $photo->model_id === $exercise->id
                && $photo->collection_name === 'photos',
            404,
        );
    }
}
