<?php

namespace App\Http\Controllers;

// Imports: the action with the rules, the two Form Requests, the resource of
// a photo, the model, medialibrary's model of a file, and Laravel's pieces
use App\Actions\Exercises\ExercisePhotos;
use App\Http\Requests\ReorderExercisePhotosRequest;
use App\Http\Requests\StoreExercisePhotoRequest;
use App\Http\Resources\ExercisePhotoResource;
use App\Models\Exercise;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Gate;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

/**
 * The photos of a personal exercise (BE-1, docs/design/D1-ui.md D1.4.5,
 * docs/concepts/C2-backend.md C2.5.9):
 *
 * | Route | Does |
 * |---|---|
 * | POST /api/exercises/{exercise}/photos | Adds one photo (multipart, field `photo`); 201 with it |
 * | PUT /api/exercises/{exercise}/photos | Puts them in order (`ids`, the cover first); 200 with the list |
 * | DELETE /api/exercises/{exercise}/photos/{photo} | Removes one; 204 |
 *
 * Only the exercise's owner: each method asks ExercisePolicy::update(), so a
 * public exercise gets a 403 (its photos are managed in the admin panel).
 * Generated with `make:controller ExercisePhotoController`; the routes are in
 * routes/api.php.
 */
class ExercisePhotoController extends Controller
{
    /**
     * POST /api/exercises/{exercise}/photos: adds a photo, last in the order.
     *
     * Answers at once with the original's address: the small and large
     * conversions are made by the queue a moment later
     * (ExercisePhotoResource).
     *
     * @param  StoreExercisePhotoRequest  $request  the validated request, with the file
     * @param  Exercise  $exercise  the exercise in the URL
     * @param  ExercisePhotos  $photos  the action, given by the service container
     * @return ExercisePhotoResource the new photo; 201, as for any model just created
     */
    public function store(StoreExercisePhotoRequest $request, Exercise $exercise, ExercisePhotos $photos): ExercisePhotoResource
    {
        // Asks ExercisePolicy::update(); a false answer stops the request
        // here with a 403 (docs/concepts/C2-backend.md C2.5.1)
        Gate::authorize('update', $exercise);

        // file('photo'): the uploaded file, an UploadedFile
        return new ExercisePhotoResource($photos->add($exercise, $request->file('photo')));
    }

    /**
     * PUT /api/exercises/{exercise}/photos: the new order.
     *
     * @param  ReorderExercisePhotosRequest  $request  the validated request: `ids`
     * @param  Exercise  $exercise  the exercise in the URL
     * @param  ExercisePhotos  $photos  the action
     * @return AnonymousResourceCollection the photos, in their new order
     */
    public function reorder(ReorderExercisePhotosRequest $request, Exercise $exercise, ExercisePhotos $photos): AnonymousResourceCollection
    {
        Gate::authorize('update', $exercise);

        // validated('ids'): only that field of what passed the rules
        $photos->reorder($exercise, $request->validated('ids'));

        // refresh(): the exercise read again, so getMedia() sees the new
        // order_column instead of the photos it had loaded before
        return ExercisePhotoResource::collection($exercise->refresh()->getMedia('photos'));
    }

    /**
     * DELETE /api/exercises/{exercise}/photos/{photo}: removes a photo.
     *
     * `Media $photo` is route model binding on medialibrary's model: any row
     * of `media` would match its id, so the method checks that it is one of
     * this exercise's photos, and answers 404 otherwise, as for a photo that
     * does not exist (abort_unless()).
     *
     * @param  Exercise  $exercise  the exercise in the URL
     * @param  Media  $photo  the media row in the URL
     * @param  ExercisePhotos  $photos  the action
     * @return Response an empty answer, 204
     */
    public function destroy(Exercise $exercise, Media $photo, ExercisePhotos $photos): Response
    {
        Gate::authorize('update', $exercise);

        // getMorphClass(): how this model is named in media.model_type
        // ("App\Models\Exercise"); the three columns together say "a photo
        // of this exercise"
        abort_unless(
            $photo->model_type === $exercise->getMorphClass()
                && $photo->model_id === $exercise->id
                && $photo->collection_name === 'photos',
            404,
        );

        $photos->remove($photo);

        return response()->noContent();
    }
}
