<?php

namespace App\Actions\Exercises;

use App\Models\Exercise;
use Illuminate\Http\UploadedFile;
use InvalidArgumentException;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

/**
 * The photos of a personal exercise, stored by medialibrary in the `photos`
 * collection. `order_column` is the order; the first photo is the cover.
 */
class ExercisePhotos
{
    /**
     * Per exercise. StoreExercisePhotoRequest refuses one more with a message;
     * the check here holds for any caller.
     */
    public const MAX = 5;

    /**
     * Last in the order. The phone's file name ("IMG_4032.JPG") says nothing
     * and may hold characters a URL does not like, so it is replaced.
     *
     * @throws InvalidArgumentException when the exercise already has MAX photos
     */
    public function add(Exercise $exercise, UploadedFile $photo): Media
    {
        if ($exercise->getMedia('photos')->count() >= self::MAX) {
            throw new InvalidArgumentException('An exercise has at most '.self::MAX.' photos.');
        }

        return $exercise->addMedia($photo)
            // From the content: a ".JPG" that is a PNG becomes "photo.png"
            ->usingFileName('photo.'.$photo->guessExtension())
            ->toMediaCollection('photos');
    }

    /**
     * The row, the file and its conversions, for good. A soft-deleted exercise
     * keeps its photos.
     */
    public function remove(Media $photo): void
    {
        $photo->delete();
    }

    /**
     * @param  list<int>  $ids  every photo of the exercise, once, the cover first
     *
     * @throws InvalidArgumentException when the ids are not exactly its photos
     */
    public function reorder(Exercise $exercise, array $ids): void
    {
        // Sorted, to compare them as sets
        $current = $exercise->getMedia('photos')->pluck('id')->sort()->values()->all();
        $sent = collect($ids)->map(fn ($id) => (int) $id)->sort()->values()->all();

        if ($current !== $sent) {
            throw new InvalidArgumentException('The order must list every photo of the exercise once.');
        }

        Media::setNewOrder($ids);
    }
}
