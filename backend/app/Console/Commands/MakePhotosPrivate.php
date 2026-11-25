<?php

namespace App\Console\Commands;

use App\Actions\Exercises\ExercisePhotos;
use App\Models\Exercise;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Spatie\MediaLibrary\MediaCollections\Models\Media;

/**
 * `php artisan exercises:private-photos`: moves the photos of personal
 * exercises still on the `public` disk, where anyone could download them, to
 * the private one (ExercisePhotos::makePrivate()). For a database whose
 * photos were uploaded before they were private; a new photo is private
 * already. Soft-deleted exercises' photos too. Running it again finds nothing.
 */
#[Signature('exercises:private-photos')]
#[Description('Move the photos of personal exercises to the private disk')]
class MakePhotosPrivate extends Command
{
    public function handle(ExercisePhotos $photos): int
    {
        $moved = 0;

        Media::query()
            ->where('model_type', (new Exercise)->getMorphClass())
            ->where('collection_name', 'photos')
            ->where('disk', 'public')
            ->whereIn('model_id', Exercise::withTrashed()->whereNotNull('owner_id')->select('id'))
            ->eachById(function (Media $photo) use ($photos, &$moved) {
                $moved += (int) $photos->makePrivate($photo);
            });

        $this->info("Photos made private: {$moved}");

        return self::SUCCESS;
    }
}
