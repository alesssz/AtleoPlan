<?php

namespace App\Actions\Exercises;

use App\Models\Exercise;
use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

/**
 * Creates and changes a user's personal exercise, from validated data.
 *
 * Two rules live here:
 * - **One language.** A personal exercise is written in its author's language
 *   only. The texts sent are stored under the request's language, and replace
 *   any other language the field had: an exercise written in Italian and edited
 *   after switching the app to English becomes English, rather than keeping an
 *   Italian name that would come back when switching again.
 * - **Muscles as a whole list.** When `muscles` is sent, it is the complete
 *   list: muscles left out are removed.
 */
class SavePersonalExercise
{
    /**
     * @param  array<string, mixed>  $data  `name` is required
     */
    public function create(User $user, array $data): Exercise
    {
        return DB::transaction(function () use ($user, $data) {
            $exercise = $user->exercises()->make();

            $this->fill($exercise, $data);
            $exercise->save();
            $this->syncMuscles($exercise, $data);

            return $exercise;
        });
    }

    /**
     * Only the fields present in $data change.
     *
     * @param  array<string, mixed>  $data
     */
    public function update(Exercise $exercise, array $data): Exercise
    {
        return DB::transaction(function () use ($exercise, $data) {
            $this->fill($exercise, $data);
            $exercise->save();
            $this->syncMuscles($exercise, $data);

            return $exercise;
        });
    }

    /**
     * @param  array<string, mixed>  $data
     */
    private function fill(Exercise $exercise, array $data): void
    {
        $locale = app()->getLocale();

        foreach ($exercise->getTranslatableAttributes() as $field) {
            // A partial update leaves the field as it is
            if (! array_key_exists($field, $data)) {
                continue;
            }

            $value = $data[$field];

            if ($value === null || $value === []) {
                // Assigning null would store {"en": null}
                $exercise->forgetTranslations($field, asNull: true);
            } else {
                // Every other language goes; only this one stays
                $exercise->replaceTranslations($field, [$locale => $value]);
            }
        }

        $exercise->fill(Arr::only($data, ['logging_type', 'equipment_id', 'youtube_url']));
    }

    /**
     * The list sent replaces the exercise's muscles; no list, no change.
     *
     * @param  array<string, mixed>  $data  `muscles` is a list of ['id' => 3, 'role' => 'primary']
     */
    private function syncMuscles(Exercise $exercise, array $data): void
    {
        if (! array_key_exists('muscles', $data)) {
            return;
        }

        $rows = collect($data['muscles'] ?? [])
            ->mapWithKeys(fn (array $muscle) => [$muscle['id'] => ['role' => $muscle['role']]])
            ->all();

        $exercise->muscles()->sync($rows);
    }
}
