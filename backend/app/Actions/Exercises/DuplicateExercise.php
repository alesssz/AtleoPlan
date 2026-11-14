<?php

namespace App\Actions\Exercises;

use App\Models\Exercise;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * **Duplicate as mine**: a public exercise copied as the user's own.
 *
 * What the copy gets:
 * - **The texts in the user's language only**, as any personal exercise:
 * the name, other names, description
 *   and steps the user is reading now, with the usual fallback to English
 *   when their language is missing.
 * - The logging type, the equipment, the YouTube link, the muscles with their roles.
 * - **The photos**, copied as new files: deleting or changing the public
 *   exercise later leaves the copy as it is. Each copy gets its own
 *   conversions, queued as for an upload.
 * - Not the import's columns (external_id, level, category,
 *   machine_translated): the copy is the user's, not the dataset's.
 */
class DuplicateExercise
{
    /**
     * @param  string  $locale  the language the texts are copied in: the request's
     */
    public function handle(Exercise $exercise, User $user, string $locale): Exercise
    {
        // Photos after the transaction: a rollback could not remove files
        $copy = DB::transaction(function () use ($exercise, $user, $locale) {
            $copy = $user->exercises()->make();

            // With the fallback to English; a column empty in every
            // language stays empty
            foreach ($exercise->getTranslatableAttributes() as $field) {
                $value = $exercise->getTranslation($field, $locale);
                if ($value !== '' && $value !== [] && $value !== null) {
                    $copy->setTranslation($field, $locale, $value);
                }
            }

            $copy->fill([
                'logging_type' => $exercise->logging_type,
                'equipment_id' => $exercise->equipment_id,
                'youtube_url' => $exercise->youtube_url,
            ]);
            $copy->save();

            $copy->muscles()->sync(
                $exercise->muscles->mapWithKeys(fn ($muscle) => [$muscle->id => ['role' => $muscle->pivot->role]])->all(),
            );

            return $copy;
        });

        // New files, in order, with their own queued conversions
        foreach ($exercise->getMedia('photos') as $photo) {
            $photo->copy($copy, 'photos');
        }

        return $copy;
    }
}
