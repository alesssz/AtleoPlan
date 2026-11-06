<?php

namespace App\Actions\Exercises;

// Imports: the models it writes, Arr (helpers for arrays), and the DB facade
// for the transaction
use App\Models\Exercise;
use App\Models\User;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;

/**
 * Creates and changes a user's personal exercise, from data already validated
 * by StoreExerciseRequest or UpdateExerciseRequest.
 *
 * An action: a small class that does one job of the app, kept out of the
 * controller so that it can be tested without HTTP
 * (tests/Feature/ExerciseLibrary/SavePersonalExerciseTest.php) and reused,
 * by a future import or command for instance (docs/concepts/C2-backend.md C2.5.3).
 * Created with `make:class Actions/Exercises/SavePersonalExercise`. The
 * controller receives it as a method parameter, and Laravel's service
 * container builds it.
 *
 * Two rules live here:
 * - **One language.** A personal exercise is written in its author's language
 *   only (docs/design/D2-decisions.md D2.4). The texts sent are stored under
 *   the request's language, and replace any other language the field had: an
 *   exercise written in Italian and edited after switching the app to English
 *   becomes English, rather than keeping an Italian name that would come
 *   back when switching again.
 * - **Muscles as a whole list.** When `muscles` is sent, it is the complete
 *   list: muscles left out are removed.
 */
class SavePersonalExercise
{
    /**
     * Creates a personal exercise owned by $user.
     *
     * @param  User  $user  the owner, the signed-in user
     * @param  array<string, mixed>  $data  the validated fields; `name` is required
     * @return Exercise the new exercise, saved
     */
    public function create(User $user, array $data): Exercise
    {
        // DB::transaction(): everything inside is saved together or not at
        // all. If attaching the muscles failed, the exercise would not be
        // left half-made. The function's return value is passed through
        return DB::transaction(function () use ($user, $data) {
            // make(): a new exercise with owner_id already set by the
            // relation, not yet saved
            $exercise = $user->exercises()->make();

            $this->fill($exercise, $data);
            $exercise->save();
            $this->syncMuscles($exercise, $data);

            return $exercise;
        });
    }

    /**
     * Changes a personal exercise. Only the fields present in $data change.
     *
     * @param  Exercise  $exercise  the exercise; the policy has checked it is the user's
     * @param  array<string, mixed>  $data  the validated fields
     * @return Exercise the same exercise, saved
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
     * Copies the fields of $data onto the exercise, without saving.
     *
     * @param  Exercise  $exercise  the exercise to fill
     * @param  array<string, mixed>  $data  the validated fields
     */
    private function fill(Exercise $exercise, array $data): void
    {
        // The request's language, set by SetLocaleFromRequest from the
        // Accept-Language header the React app sends
        $locale = app()->getLocale();

        // The translatable columns: name, aliases, description, instructions
        foreach ($exercise->getTranslatableAttributes() as $field) {
            // A field not sent is left as it is (a partial update)
            if (! array_key_exists($field, $data)) {
                continue;
            }

            // What was sent for this field: text, a list of texts, or null
            $value = $data[$field];

            if ($value === null || $value === []) {
                // Sent empty: the column becomes NULL. Assigning null would
                // store {"en": null} instead (tried in docs/how-to/H2-backend.md H2.12)
                $exercise->forgetTranslations($field, asNull: true);
            } else {
                // Every other language goes; only this one stays
                $exercise->replaceTranslations($field, [$locale => $value]);
            }
        }

        // The plain columns. Arr::only keeps just these keys, and fill()
        // writes them, as far as #[Fillable] on the model allows
        $exercise->fill(Arr::only($data, ['logging_type', 'equipment_id', 'youtube_url']));
    }

    /**
     * Makes the exercise's muscles exactly the list sent, when one was sent.
     *
     * @param  Exercise  $exercise  the exercise, already saved (it needs an id)
     * @param  array<string, mixed>  $data  the validated fields; `muscles` is a
     *                                      list of ['id' => 3, 'role' => 'primary']
     */
    private function syncMuscles(Exercise $exercise, array $data): void
    {
        if (! array_key_exists('muscles', $data)) {
            return;
        }

        // sync() wants [muscle id => [pivot columns]]: [3 => ['role' => 'primary']].
        // mapWithKeys() builds that from the list
        $rows = collect($data['muscles'] ?? [])
            ->mapWithKeys(fn (array $muscle) => [$muscle['id'] => ['role' => $muscle['role']]])
            ->all();

        // sync(): adds the missing pivot rows, updates the role of those that
        // change, and removes those not in the list
        $exercise->muscles()->sync($rows);
    }
}
