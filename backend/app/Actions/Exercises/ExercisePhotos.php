<?php

namespace App\Actions\Exercises;

// Imports: the model, an uploaded file, medialibrary's model of a file, and
// the exception for a rule broken
use App\Models\Exercise;
use Illuminate\Http\UploadedFile;
use InvalidArgumentException;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

/**
 * The photos of a personal exercise: add one, remove one, put them in order
 * (BE-1, docs/concepts/C2-backend.md C2.5.9). ExercisePhotoController calls it,
 * after the policy and the Form Request; a test calls it directly
 * (tests/Feature/ExerciseLibrary/ExercisePhotosTest.php).
 *
 * An action, as SavePersonalExercise (docs/concepts/C2-backend.md C2.5.3).
 * Generated with `make:class Actions/Exercises/ExercisePhotos`.
 *
 * medialibrary (spatie/laravel-medialibrary) keeps each file as a row of the
 * `media` table, linked to the exercise and to a **collection**, here
 * `photos` (docs/design/D3-data-model.md D3.4.4), and the file itself on the
 * `public` disk, in storage/app/public/<media id>/. Its `order_column` is the
 * order: the first photo is the cover.
 */
class ExercisePhotos
{
    /**
     * At most this many photos per exercise (docs/design/D2-decisions.md D2.5).
     * StoreExercisePhotoRequest refuses the sixth with a message; the check
     * here holds for any other caller.
     */
    public const MAX = 5;

    /**
     * Adds a photo, last in the order.
     *
     * addMedia() takes the uploaded file; toMediaCollection() moves it to the
     * disk, writes its row and queues its conversions (thumb, large:
     * Exercise::registerMediaConversions()). usingFileName(): a name of our
     * own, since the phone's ("IMG_4032.JPG") says nothing and may hold
     * characters a URL does not like.
     *
     * @param  Exercise  $exercise  the exercise, already authorised
     * @param  UploadedFile  $photo  the file of the request, already validated
     * @return Media the new row
     *
     * @throws InvalidArgumentException when the exercise already has MAX photos
     */
    public function add(Exercise $exercise, UploadedFile $photo): Media
    {
        if ($exercise->getMedia('photos')->count() >= self::MAX) {
            throw new InvalidArgumentException('An exercise has at most '.self::MAX.' photos.');
        }

        return $exercise->addMedia($photo)
            // The extension the file really has, guessed from its content
            // (a ".JPG" that is a PNG becomes "photo.png")
            ->usingFileName('photo.'.$photo->guessExtension())
            ->toMediaCollection('photos');
    }

    /**
     * Removes a photo: its row, its file and its conversions.
     *
     * Media::delete() is medialibrary's: it deletes the files on the disk
     * too. A photo is not soft-deleted; a soft-deleted exercise keeps its
     * photos, since only the exercise's row is marked (D3.4.4).
     *
     * @param  Media  $photo  a photo of the exercise (the controller checked it)
     */
    public function remove(Media $photo): void
    {
        $photo->delete();
    }

    /**
     * Puts the photos in the order given; the first becomes the cover.
     *
     * Media::setNewOrder() writes order_column 1, 2, 3… following the list of
     * ids, in one query per photo. The list must hold every photo of the
     * exercise once (ReorderExercisePhotosRequest checks it).
     *
     * @param  Exercise  $exercise  the exercise
     * @param  list<int>  $ids  its photos' ids, in the new order
     *
     * @throws InvalidArgumentException when the ids are not exactly its photos
     */
    public function reorder(Exercise $exercise, array $ids): void
    {
        // The ids it has, and those sent, both sorted, to compare as sets.
        // A collection's chain: pluck() takes one field of each item, sort()
        // orders them, values() renumbers the keys 0, 1, 2…, all() gives a
        // plain PHP array; collect() first turns the array sent into a
        // collection, and map() makes each id a whole number
        $current = $exercise->getMedia('photos')->pluck('id')->sort()->values()->all();
        $sent = collect($ids)->map(fn ($id) => (int) $id)->sort()->values()->all();

        if ($current !== $sent) {
            throw new InvalidArgumentException('The order must list every photo of the exercise once.');
        }

        Media::setNewOrder($ids);
    }
}
