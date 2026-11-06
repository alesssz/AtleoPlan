<?php

namespace App\Actions\Exercises;

// Imports: the enums it uses, the three models it writes, the exception for
// bad data, and Laravel's helpers for the database and strings
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
 * Imports one exercise of free-exercise-db into the public library
 * (docs/design/D2-decisions.md D2.3, DATA-1). The command
 * `exercises:import` (app/Console/Commands/ImportFreeExerciseDb.php) reads the
 * dataset and calls this once per exercise.
 *
 * An action, like SavePersonalExercise (docs/concepts/C2-backend.md C2.5.3):
 * the rules of the import live here, so that a test can call it with one
 * exercise and check the result, without the command or the files of the
 * whole dataset (tests/Feature/ExerciseLibrary/ImportFreeExerciseTest.php).
 *
 * One exercise of the source looks like this (dist/exercises.json):
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
 * The rules (docs/concepts/C2-backend.md C2.14.3):
 * - **Found by `external_id`**, the source's `id`, so a second run never
 *   duplicates. A row deleted by an admin is found too, and left deleted.
 * - **An exercise already there is left alone**, unless `$update` is true: then
 *   what comes from the source is refreshed (English name and instructions,
 *   level, category, equipment, muscles). Other languages, written by the
 *   translation or by an admin, are kept, and so are the logging type and
 *   the photos.
 * - **English only.** The other languages come from the translation (the
 *   second part of DATA-1). English is the original, so it is never in
 *   `machine_translated`.
 * - **Photos are added when the exercise has none**, also on a later run: an
 *   import stopped halfway completes its photos the next time.
 */
class ImportFreeExercise
{
    /**
     * The muscles' ids by slug, read once on first use: ['chest' => 6, …].
     * `?array` with `= null`: empty until the first exercise needs it.
     *
     * @var array<string, int>|null
     */
    private ?array $muscleIds = null;

    /**
     * The equipment's ids by slug, read once on first use.
     *
     * @var array<string, int>|null
     */
    private ?array $equipmentIds = null;

    /**
     * Imports one exercise.
     *
     * @param  array<string, mixed>  $row  one object of dist/exercises.json, decoded
     * @param  string  $imagesPath  the dataset's `exercises/` folder, where the photos are
     * @param  bool  $update  refresh an exercise that is already there
     * @param  bool  $withPhotos  attach the photos; false imports the texts only
     * @return ImportResult what was done
     *
     * @throws InvalidArgumentException when a muscle or a kind of equipment is
     *                                  not in our lists (the command reports it and goes on)
     */
    public function import(array $row, string $imagesPath, bool $update = false, bool $withPhotos = true): ImportResult
    {
        // The exercise with this external_id, deleted ones included
        // (withTrashed: SoftDeletes hides them otherwise, docs/concepts/C2-backend.md C2.6)
        $exercise = Exercise::withTrashed()->where('external_id', $row['id'])->first();

        // Deleted by an admin: their choice wins over the source
        if ($exercise?->trashed()) {
            return new ImportResult(ImportOutcome::SkippedDeleted, 0);
        }

        // What happens to the texts and data: create, refresh, or nothing.
        // `match (true)` is a chain of conditions: the first arm whose
        // condition is true gives the value; `default` when none is
        $outcome = match (true) {
            $exercise === null => ImportOutcome::Created,
            $update => ImportOutcome::Updated,
            default => ImportOutcome::Unchanged,
        };

        if ($outcome !== ImportOutcome::Unchanged) {
            // The exercise and its muscles together, or not at all (C2.5.3).
            // `??=`: a new public exercise (no owner) when there is none yet
            $exercise ??= new Exercise;
            DB::transaction(fn () => $this->write($exercise, $row, $outcome === ImportOutcome::Created));
        }

        // The photos, outside the transaction: they are files on a disk, which
        // a rollback could not remove. Only when the exercise has none yet
        $photosAdded = $withPhotos ? $this->attachPhotos($exercise, $row['images'] ?? [], $imagesPath) : 0;

        return new ImportResult($outcome, $photosAdded);
    }

    /**
     * How sets of an exercise are logged, guessed from the source, which does
     * not say (docs/design/D2-decisions.md D2.3):
     * - stretching and cardio are held or done for a time;
     * - with the body's own weight, or with no equipment named, sets count reps;
     * - everything else is a weight and reps.
     *
     * A guess an admin can correct; a later `--update` does not undo it.
     * `static`: it uses nothing of the object, so tests call it as
     * `ImportFreeExercise::loggingTypeFor('cardio', null)`.
     *
     * @param  string  $category  the source's category, such as "strength"
     * @param  string|null  $equipment  the source's equipment, such as "body only"; null for none
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
     * The steps of the instructions, cleaned: no HTML, no spaces around, no
     * empty steps. The source has a stray HTML tag and an empty string in
     * a couple of exercises.
     *
     * @param  list<mixed>  $steps  the source's instructions
     * @return list<string> the clean steps; possibly empty
     */
    public static function cleanInstructions(array $steps): array
    {
        // strip_tags() removes HTML tags; trim() the spaces around
        $clean = array_map(fn ($step) => trim(strip_tags((string) $step)), $steps);

        // array_filter() keeps the non-empty steps; array_values() renumbers
        // them 0, 1, 2…, so JSON stores a list and not an object
        return array_values(array_filter($clean, fn (string $step) => $step !== ''));
    }

    /**
     * Writes the source's data on the exercise and saves it, then its muscles.
     *
     * @param  Exercise  $exercise  a new exercise, or the one to refresh
     * @param  array<string, mixed>  $row  the source's exercise
     * @param  bool  $isNew  true when created now: only then the logging type is set
     */
    private function write(Exercise $exercise, array $row, bool $isNew): void
    {
        // The columns of the import are not in #[Fillable] (app/Models/Exercise.php),
        // on purpose: no request may set them. Assigning one by one is allowed
        $exercise->external_id = $row['id'];
        $exercise->level = $row['level'] ?? null;
        $exercise->category = $row['category'] ?? null;
        $exercise->equipment_id = $this->equipmentId($row['equipment'] ?? null);

        // English only, keeping any other language: setTranslation() changes
        // one language of the column (docs/design/D3-data-model.md D3.4.5)
        $exercise->setTranslation('name', 'en', trim($row['name']));

        // The steps, cleaned; an exercise without steps has none in English
        $steps = self::cleanInstructions($row['instructions'] ?? []);
        if ($steps !== []) {
            $exercise->setTranslation('instructions', 'en', $steps);
        } elseif (! $isNew) {
            $exercise->forgetTranslation('instructions', 'en');
        }

        if ($isNew) {
            $exercise->logging_type = self::loggingTypeFor($row['category'] ?? '', $row['equipment'] ?? null);
        }

        $exercise->save();

        // sync(): the pivot rows become exactly this list (C2.6)
        $exercise->muscles()->sync($this->muscleRoles($row));
    }

    /**
     * The exercise's muscles for sync(): [muscle id => ['role' => …]].
     * A muscle listed as both primary and secondary stays primary.
     *
     * @param  array<string, mixed>  $row  the source's exercise
     * @return array<int, array{role: MuscleRole}>
     */
    private function muscleRoles(array $row): array
    {
        // The secondary ones first, so that the primary ones, written after,
        // replace them when a muscle is in both lists
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
     * Our id of a muscle named by the source, such as "lower back".
     *
     * Str::slug() turns the source's name into our slug: "lower back" →
     * "lower-back", the slugs of MuscleSeeder.
     *
     * @param  string  $name  the source's name
     *
     * @throws InvalidArgumentException when it is not one of our 17 muscles
     */
    private function muscleId(string $name): int
    {
        // `??=`: read the table only the first time. pluck('id', 'slug')
        // gives one value per row, keyed by another column: ['chest' => 6, …]
        $this->muscleIds ??= Muscle::pluck('id', 'slug')->all();

        // The id, or, when the slug is not a key (`??`), an exception: since
        // PHP 8, `throw` can stand where a value is expected
        return $this->muscleIds[Str::slug($name)]
            ?? throw new InvalidArgumentException("Unknown muscle \"{$name}\": run the MuscleSeeder, or add it there.");
    }

    /**
     * Our id of a kind of equipment named by the source, such as
     * "e-z curl bar"; null when the source names none.
     *
     * @param  string|null  $name  the source's name, or null
     *
     * @throws InvalidArgumentException when it is not one of our 12 kinds
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
     * Attaches the photos to the exercise, in the source's order (the first is
     * the cover), when it has none yet.
     *
     * spatie/laravel-medialibrary copies each file to the media disk (`public`,
     * storage/app/public) and writes a row of `media` (docs/design/D3-data-model.md
     * D3.4.4). preservingOriginal() copies instead of moving: without it the
     * file would disappear from the dataset, and a second run would find
     * nothing. A file missing from the dataset is skipped.
     *
     * @param  Exercise  $exercise  the exercise, saved
     * @param  list<string>  $images  the source's paths, such as "3_4_Sit-Up/0.jpg"
     * @param  string  $imagesPath  the dataset's `exercises/` folder
     * @return int how many photos were attached
     */
    private function attachPhotos(Exercise $exercise, array $images, string $imagesPath): int
    {
        // Already has photos: a previous run attached them, or an admin did
        if ($exercise->getMedia('photos')->isNotEmpty()) {
            return 0;
        }

        // The photos attached so far
        $added = 0;
        foreach ($images as $image) {
            // The file's full path; DIRECTORY_SEPARATOR is / here, \ on Windows
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
