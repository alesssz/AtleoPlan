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

/**
 * The photos of a personal exercise:
 *
 * | Route | Does |
 * |---|---|
 * | POST /api/exercises/{exercise}/photos | Adds one photo (multipart, field `photo`); 201 with it |
 * | PUT /api/exercises/{exercise}/photos | Puts them in order (`ids`, the cover first); 200 with the list |
 * | DELETE /api/exercises/{exercise}/photos/{photo} | Removes one; 204 |
 *
 * Owner only, through ExercisePolicy::update(): a public exercise's photos
 * are managed in the admin panel.
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

    /**
     * Route binding would accept any media row, so the photo must belong to
     * this exercise; otherwise 404, as for a photo that does not exist.
     */
    public function destroy(Exercise $exercise, Media $photo, ExercisePhotos $photos): Response
    {
        Gate::authorize('update', $exercise);

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
