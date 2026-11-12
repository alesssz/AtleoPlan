<?php

namespace App\Actions\Exercises;

// Imports: the models it reads and writes, and the DB facade for the transaction
use App\Models\Exercise;
use App\Models\User;
use Illuminate\Support\Facades\DB;

/**
 * **Duplicate as mine**: a copy of a public exercise that becomes the user's
 * own, to change as they like (docs/design/D1-ui.md D1.4.4,
 * docs/concepts/C2-backend.md C2.5.9). ExerciseController::duplicate() calls
 * it; a test calls it directly.
 *
 * An action (docs/concepts/C2-backend.md C2.5.3), generated with
 * `make:class Actions/Exercises/DuplicateExercise`.
 *
 * What the copy gets:
 * - **The texts in the user's language only**, as any personal exercise
 *   (docs/design/D2-decisions.md D2.4): the name, other names, description
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
     * Copies $exercise as $user's own.
     *
     * @param  Exercise  $exercise  the exercise to copy; ExercisePolicy::duplicate() allowed it
     * @param  User  $user  who gets the copy
     * @param  string  $locale  the language to copy the texts in: the request's
     * @return Exercise the copy, saved, with its photos
     */
    public function handle(Exercise $exercise, User $user, string $locale): Exercise
    {
        // The row and its muscles in one transaction (C2.5.3); the photos
        // after it, since they are files that a rollback could not remove
        $copy = DB::transaction(function () use ($exercise, $user, $locale) {
            // make(): a new exercise with owner_id already set by the
            // relation, not saved yet (SavePersonalExercise does the same)
            $copy = $user->exercises()->make();

            // Each translatable column in one language. getTranslation()
            // without `false` falls back to English when $locale is missing;
            // a column empty in every language stays empty
            foreach ($exercise->getTranslatableAttributes() as $field) {
                // This column's value in the user's language, or English
                $value = $exercise->getTranslation($field, $locale);
                if ($value !== '' && $value !== [] && $value !== null) {
                    $copy->setTranslation($field, $locale, $value);
                }
            }

            // The plain columns, through #[Fillable]
            $copy->fill([
                'logging_type' => $exercise->logging_type,
                'equipment_id' => $exercise->equipment_id,
                'youtube_url' => $exercise->youtube_url,
            ]);
            $copy->save();

            // The muscles with their roles: [muscle id => ['role' => …]], as
            // sync() wants (C2.6). mapWithKeys(): each muscle gives one
            // key and its value, gathered into one array
            $copy->muscles()->sync(
                $exercise->muscles->mapWithKeys(fn ($muscle) => [$muscle->id => ['role' => $muscle->pivot->role]])->all(),
            );

            return $copy;
        });

        // The photos, in their order. copy() is medialibrary's: a new row and
        // a new file in the copy's collection, conversions queued
        foreach ($exercise->getMedia('photos') as $photo) {
            $photo->copy($copy, 'photos');
        }

        return $copy;
    }
}
