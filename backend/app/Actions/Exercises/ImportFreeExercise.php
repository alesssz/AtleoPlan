<?php

namespace App\Actions\Exercises;

use App\Enums\ImportOutcome;
use App\Enums\LoggingType;
use App\Enums\MuscleRole;
use App\Models\Equipment;
use App\Models\Exercise;
use App\Models\Muscle;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;

/**
 * Imports one exercise of free-exercise-db into the public library.
 * `exercises:import` calls it once per exercise of the dataset
 * (dist/exercises.json):
 *
 *     {
 *       "id": "3_4_Sit-Up",
 *       "name": "3/4 Sit-Up",
 *       "force": "pull", "level": "beginner", "mechanic": "compound",
 *       "equipment": "body only",
 *       "primaryMuscles": ["abdominals"], "secondaryMuscles": [],
 *       "instructions": ["Lie down on the floor…", "…"],
 *       "category": "strength",
 *       "images": ["3_4_Sit-Up/0.jpg", "3_4_Sit-Up/1.jpg"]
 *     }
 *
 * The same action imports the project's own extra exercises
 * (database/data/extra-exercises.json, command `exercises:import-extra`),
 * written in that shape with two more keys: `aliases`, the English aliases,
 * and `loggingType`, which then replaces the guess.
 *
 * The rules:
 * - **Found by `external_id`**, the source's `id`, so a second run never
 *   duplicates. A row deleted by an admin is found too, and left deleted.
 * - **An exercise already there is left alone**, unless `$update` is true: then
 *   what comes from the source is refreshed (English name and instructions,
 *   level, category, equipment, muscles). Other languages, written by the
 *   translation or by an admin, are kept, and so are the logging type and
 *   the photos.
 * - **English only.** The other languages come from the translation, the
 *   command `exercises:translate` that `make exercises-import` runs next
 *   (TranslateExercise). English is the original, so it is never in
 *   `machine_translated`.
 * - **Photos are added when the exercise has none**, also on a later run: an
 *   import stopped halfway completes its photos the next time.
 */
class ImportFreeExercise
{
    /**
     * ['chest' => 6, …], read on first use.
     *
     * @var array<string, int>|null
     */
    private ?array $muscleIds = null;

    /**
     * Read on first use.
     *
     * @var array<string, int>|null
     */
    private ?array $equipmentIds = null;

    /**
     * @param  array<string, mixed>  $row  one object of dist/exercises.json, decoded
     * @param  string  $imagesPath  the dataset's `exercises/` folder
     * @param  bool  $update  refresh an exercise that is already there
     * @param  bool  $withPhotos  false imports the texts only
     *
     * @throws InvalidArgumentException when a muscle or a kind of equipment is
     *                                  not in our lists (the command reports it and goes on)
     */
    public function import(array $row, string $imagesPath, bool $update = false, bool $withPhotos = true): ImportResult
    {
        $exercise = Exercise::withTrashed()->where('external_id', $row['id'])->first();

        // Deleted by an admin: their choice wins over the source
        if ($exercise?->trashed()) {
            return new ImportResult(ImportOutcome::SkippedDeleted, 0);
        }

        $outcome = match (true) {
            $exercise === null => ImportOutcome::Created,
            $update => ImportOutcome::Updated,
            default => ImportOutcome::Unchanged,
        };

        if ($outcome !== ImportOutcome::Unchanged) {
            $exercise ??= new Exercise;
            DB::transaction(fn () => $this->write($exercise, $row, $outcome === ImportOutcome::Created));
        }

        // Outside the transaction: a rollback could not remove files
        $photosAdded = $withPhotos ? $this->attachPhotos($exercise, $row['images'] ?? [], $imagesPath) : 0;

        return new ImportResult($outcome, $photosAdded);
    }

    /**
     * How sets of an exercise are logged, guessed from the source, which does
     * not say:
     * - stretching and cardio are held or done for a time;
     * - with the body's own weight, or with no equipment named, sets count reps;
     * - everything else is a weight and reps.
     *
     * A guess an admin can correct; a later `--update` does not undo it
     * (CorrectLoggingType corrects the known wrong guesses).
     *
     * @param  string  $category  such as "strength"
     * @param  string|null  $equipment  such as "body only"
     */
    public static function loggingTypeFor(string $category, ?string $equipment): LoggingType
    {
        return match (true) {
            in_array($category, ['stretching', 'cardio'], true) => LoggingType::Time,
            $equipment === null || $equipment === 'body only' => LoggingType::Reps,
            default => LoggingType::WeightReps,
        };
    }

    /**
     * The source has a stray HTML tag and an empty step in a couple of
     * exercises.
     *
     * @param  list<mixed>  $steps
     * @return list<string> possibly empty
     */
    public static function cleanInstructions(array $steps): array
    {
        $clean = array_map(fn ($step) => trim(strip_tags((string) $step)), $steps);

        // array_values(), so JSON stores a list
        return array_values(array_filter($clean, fn (string $step) => $step !== ''));
    }

    /**
     * @param  array<string, mixed>  $row
     * @param  bool  $isNew  only then is the logging type set
     */
    private function write(Exercise $exercise, array $row, bool $isNew): void
    {
        // Not fillable on purpose: no request may set them
        $exercise->external_id = $row['id'];
        $exercise->level = $row['level'] ?? null;
        $exercise->category = $row['category'] ?? null;
        $exercise->equipment_id = $this->equipmentId($row['equipment'] ?? null);

        // English only; the other languages are kept
        $exercise->setTranslation('name', 'en', trim($row['name']));

        // Only the extra exercises have aliases; a run of free-exercise-db
        // must not remove those written by an admin
        if (($row['aliases'] ?? []) !== []) {
            $exercise->setTranslation('aliases', 'en', $row['aliases']);
        }

        $steps = self::cleanInstructions($row['instructions'] ?? []);
        if ($steps !== []) {
            $exercise->setTranslation('instructions', 'en', $steps);
        } elseif (! $isNew) {
            $exercise->forgetTranslation('instructions', 'en');
        }

        // The extra exercises state it: "Frog Stand", bodyweight, is held for
        // a time, where the guess would count reps
        if ($isNew) {
            $exercise->logging_type = isset($row['loggingType'])
                ? LoggingType::from($row['loggingType'])
                : self::loggingTypeFor($row['category'] ?? '', $row['equipment'] ?? null);
        }

        $exercise->save();

        $exercise->muscles()->sync($this->muscleRoles($row));
    }

    /**
     * A muscle listed as both primary and secondary stays primary.
     *
     * @param  array<string, mixed>  $row
     * @return array<int, array{role: MuscleRole}>
     */
    private function muscleRoles(array $row): array
    {
        $roles = [];
        foreach ($row['secondaryMuscles'] ?? [] as $name) {
            $roles[$this->muscleId($name)] = ['role' => MuscleRole::Secondary];
        }
        foreach ($row['primaryMuscles'] ?? [] as $name) {
            $roles[$this->muscleId($name)] = ['role' => MuscleRole::Primary];
        }

        return $roles;
    }

    /**
     * "lower back" → MuscleSeeder's "lower-back".
     *
     * @throws InvalidArgumentException when it is not one of our muscles
     */
    private function muscleId(string $name): int
    {
        $this->muscleIds ??= Muscle::pluck('id', 'slug')->all();

        return $this->muscleIds[Str::slug($name)]
            ?? throw new InvalidArgumentException("Unknown muscle \"{$name}\": run the MuscleSeeder, or add it there.");
    }

    /**
     * "e-z curl bar" → EquipmentSeeder's "e-z-curl-bar".
     *
     * @throws InvalidArgumentException when it is not one of our kinds
     */
    private function equipmentId(?string $name): ?int
    {
        if ($name === null) {
            return null;
        }

        $this->equipmentIds ??= Equipment::pluck('id', 'slug')->all();

        return $this->equipmentIds[Str::slug($name)]
            ?? throw new InvalidArgumentException("Unknown equipment \"{$name}\": run the EquipmentSeeder, or add it there.");
    }

    /**
     * In the source's order, the first being the cover, and only when the
     * exercise has none yet. The files are copied, not moved, so a second run
     * still finds them; a missing file is skipped.
     *
     * @param  list<string>  $images  such as "3_4_Sit-Up/0.jpg"
     */
    private function attachPhotos(Exercise $exercise, array $images, string $imagesPath): int
    {
        // A previous run attached them, or an admin did
        if ($exercise->getMedia('photos')->isNotEmpty()) {
            return 0;
        }

        $added = 0;
        foreach ($images as $image) {
            $file = rtrim($imagesPath, '/\\').DIRECTORY_SEPARATOR.$image;

            if (! is_file($file)) {
                continue;
            }

            $exercise->addMedia($file)->preservingOriginal()->toMediaCollection('photos');
            $added++;
        }

        return $added;
    }
}
