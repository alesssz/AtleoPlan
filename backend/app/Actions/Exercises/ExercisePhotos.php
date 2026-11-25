<?php

namespace App\Actions\Exercises;

use App\Models\Exercise;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use InvalidArgumentException;
use Spatie\Image\Enums\ImageDriver;
use Spatie\Image\Image;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

/**
 * The photos of a personal exercise, stored by medialibrary in the `photos`
 * collection. `order_column` is the order; the first photo is the cover.
 *
 * They are on the PRIVATE_DISK: a file of the `public` disk is served to
 * anyone who asks for its address, and medialibrary's addresses are a
 * sequential id and a fixed name. The library's photos stay public.
 */
class ExercisePhotos
{
    /**
     * Per exercise. StoreExercisePhotoRequest refuses one more with a message;
     * the check here holds for any caller.
     */
    public const MAX = 5;

    /**
     * 50 megapixels: a 48-megapixel phone photo (8064 × 6048) passes. GD holds
     * 4 bytes a pixel, so about 200 MB to open the largest.
     */
    public const MAX_PIXELS = 50_000_000;

    /** config/filesystems.php; ExercisePhotoController::show() serves it. */
    public const PRIVATE_DISK = 'private_media';

    /**
     * Where an exercise's photos go: the library's on `public`, a user's own
     * on the PRIVATE_DISK.
     */
    public static function diskFor(Exercise $exercise): string
    {
        return $exercise->isPublic() ? 'public' : self::PRIVATE_DISK;
    }

    /**
     * Last in the order. The phone's file name ("IMG_4032.JPG") says nothing
     * and may hold characters a URL does not like, so it is replaced. The
     * image is stored without its metadata (withoutMetadata()).
     *
     * @throws InvalidArgumentException when the exercise already has MAX photos
     */
    public function add(Exercise $exercise, UploadedFile $photo): Media
    {
        if ($exercise->getMedia('photos')->count() >= self::MAX) {
            throw new InvalidArgumentException('An exercise has at most '.self::MAX.' photos.');
        }

        // From the content: a ".JPG" that is a PNG becomes "photo.png"
        $extension = $photo->guessExtension();

        return $exercise->addMedia($this->withoutMetadata($photo, $extension))
            ->usingFileName("photo.{$extension}")
            ->toMediaCollection('photos', self::diskFor($exercise));
    }

    /**
     * The photo drawn again, as a new file: a phone's photo carries the place
     * it was taken (GPS), the device and the moment, which the original would
     * keep, and the original is kept and may be served. GD writes no
     * metadata. Loading applies the orientation the metadata gave, or a photo
     * taken upright would lie on its side once its metadata is gone.
     *
     * @param  string  $extension  jpg, png or webp: the format to write
     * @return string a temporary file's path, moved into the library by addMedia()
     */
    private function withoutMetadata(UploadedFile $photo, string $extension): string
    {
        $path = sys_get_temp_dir().'/'.Str::uuid().'.'.$extension;

        Image::useImageDriver(ImageDriver::Gd)
            ->loadFile($photo->getRealPath())
            // For JPEG and WebP; a phone saves at about this
            ->quality(90)
            ->save($path);

        return $path;
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
     * Moves a photo stored on `public` to the PRIVATE_DISK, with its
     * conversions: the photos of personal exercises uploaded before they were
     * private. The row keeps its id, so its order and the app's addresses
     * stay; only the disk changes.
     *
     * @return bool false when it was not on `public`
     */
    public function makePrivate(Media $photo): bool
    {
        if ($photo->disk !== 'public') {
            return false;
        }

        // Medialibrary's folder: the media's id, conversions inside
        $folder = (string) $photo->id;
        $from = Storage::disk('public');
        $to = Storage::disk(self::PRIVATE_DISK);

        foreach ($from->allFiles($folder) as $file) {
            $to->writeStream($file, $from->readStream($file));
        }

        // The row first: a failure after it leaves a copy behind, never a
        // photo whose row points at a missing file
        $photo->forceFill(['disk' => self::PRIVATE_DISK, 'conversions_disk' => self::PRIVATE_DISK])->save();
        $from->deleteDirectory($folder);

        return true;
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
