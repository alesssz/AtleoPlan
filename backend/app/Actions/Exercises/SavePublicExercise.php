<?php

namespace App\Actions\Exercises;

// Imports: the enums of the languages and of the muscles' role, the model it
// writes, the DB facade for the transaction, and the exception for a call
// that breaks the rules
use App\Enums\Locale;
use App\Enums\MuscleRole;
use App\Models\Exercise;
use Illuminate\Support\Facades\DB;
use LogicException;

/**
 * Creates and changes a public exercise of the library, from the admin
 * panel's form (BE-1, docs/concepts/C2-backend.md C2.8.2).
 *
 * The admin screen (app/Filament/Resources/Exercises) collects the form and
 * hands it here; the rules live in this action, so that a test can call it
 * without Filament (tests/Feature/Admin/SavePublicExerciseTest.php), as
 * SavePersonalExercise does for the API (docs/concepts/C2-backend.md C2.5.3).
 * Generated with `make:class Actions/Exercises/SavePublicExercise`.
 *
 * The data it takes, the form's state:
 *
 *     [
 *       'translations' => [
 *         'en' => ['name' => 'Plank', 'aliases' => ['front plank'], 'description' => null,
 *                  'instructions' => ['Get into a prone position…', '…']],
 *         'it' => ['name' => 'Plank', 'aliases' => [], 'description' => null,
 *                  'instructions' => ['Mettiti a pancia in giù…'], 'reviewed' => true],
 *         'es' => […], 'de' => […],
 *       ],
 *       'logging_type' => 'time', 'equipment_id' => 2, 'youtube_url' => null,
 *       'primary_muscles' => [1], 'secondary_muscles' => [6, 12],
 *     ]
 *
 * Where it differs from SavePersonalExercise:
 * - **Every language at once.** A personal exercise has one language, its
 *   author's. A public one has four, each written here as the form shows it:
 *   a language left empty loses its text, the others are replaced.
 * - **Reviewed or machine translated.** Each language but English has a
 *   `reviewed` switch: off, the language is in `machine_translated`; on, it
 *   is not (docs/design/D2-decisions.md D2.3). English is the original and
 *   never there. A language with no text is never there either.
 * - **Muscles in two lists**, primary and secondary; a muscle in both stays
 *   primary, as in the import (ImportFreeExercise::muscleRoles()).
 * - **Public only.** The owner stays empty; changing a personal exercise
 *   here is a mistake of the caller, and throws.
 */
class SavePublicExercise
{
    /**
     * Creates a public exercise.
     *
     * @param  array<string, mixed>  $data  the form's state, as above; English's name is required
     * @return Exercise the new exercise, saved
     */
    public function create(array $data): Exercise
    {
        // A new exercise with no owner: public. Saved with its muscles in one
        // transaction, or not at all (docs/concepts/C2-backend.md C2.5.3)
        return DB::transaction(function () use ($data) {
            // `new Exercise`: an object not yet in the table; save() inserts it
            $exercise = new Exercise;
            $this->write($exercise, $data);

            return $exercise;
        });
    }

    /**
     * Changes a public exercise.
     *
     * @param  Exercise  $exercise  the exercise to change; must be public
     * @param  array<string, mixed>  $data  the form's state, as above
     * @return Exercise the same exercise, saved
     *
     * @throws LogicException when the exercise is personal
     */
    public function update(Exercise $exercise, array $data): Exercise
    {
        // The panel lists public exercises only (ExerciseResource::getEloquentQuery()),
        // so this never happens through it; the check keeps the rule in one place
        if (! $exercise->isPublic()) {
            throw new LogicException("Exercise {$exercise->id} is personal: the admin panel changes public exercises only.");
        }

        return DB::transaction(function () use ($exercise, $data) {
            $this->write($exercise, $data);

            return $exercise;
        });
    }

    /**
     * The form's state as the form shows it: what fills the edit page.
     *
     * The reverse of write(): the texts of every language, each language's
     * `reviewed` switch, and the muscles split by role.
     *
     * @param  Exercise  $exercise  the exercise being opened
     * @return array<string, mixed> the state, in the shape write() takes
     */
    public static function formState(Exercise $exercise): array
    {
        // The muscles, loaded once with their pivot rows (`role`)
        $muscles = $exercise->muscles()->get();

        // The ids of the muscles with one role. `fn` closes over $muscles,
        // so the arrow function sees it without `use`
        $idsWith = fn (MuscleRole $role): array => $muscles
            ->filter(fn ($muscle) => $muscle->pivot->role === $role)
            ->pluck('id')
            ->values()
            ->all();

        return [
            'translations' => collect(Locale::codes())
                // mapWithKeys(): a list in, an array keyed by the closure's keys out:
                // ['en' => [...], 'it' => [...], ...]
                ->mapWithKeys(fn (string $locale) => [$locale => [
                    // getTranslation(…, false): this language only, with no
                    // fallback to English; '' when the language has none
                    'name' => $exercise->getTranslation('name', $locale, false) ?: null,
                    'aliases' => $exercise->getTranslation('aliases', $locale, false) ?: [],
                    'description' => $exercise->getTranslation('description', $locale, false) ?: null,
                    'instructions' => $exercise->getTranslation('instructions', $locale, false) ?: [],
                    // Reviewed unless the import's flag is still there
                    'reviewed' => ! in_array($locale, $exercise->machine_translated ?? [], true),
                ]])
                ->all(),
            // `?->value`: the enum's string, as the select's options have it
            'logging_type' => $exercise->logging_type?->value,
            'equipment_id' => $exercise->equipment_id,
            'youtube_url' => $exercise->youtube_url,
            'primary_muscles' => $idsWith(MuscleRole::Primary),
            'secondary_muscles' => $idsWith(MuscleRole::Secondary),
        ];
    }

    /**
     * Copies the form's state onto the exercise, saves it, then its muscles.
     *
     * @param  Exercise  $exercise  a new exercise, or the one to change
     * @param  array<string, mixed>  $data  the form's state
     */
    private function write(Exercise $exercise, array $data): void
    {
        // The texts by language: ['en' => ['name' => …, …], 'it' => …]
        $translations = $data['translations'] ?? [];

        // Each translatable column (name, aliases, description, instructions)
        // gets all its languages in one go
        foreach ($exercise->getTranslatableAttributes() as $field) {
            // The languages that have a value for this field: ['en' => 'Plank', 'it' => 'Plank']
            $values = [];
            foreach (Locale::codes() as $locale) {
                // This language's value, cleaned; null when the tab left it empty
                $value = self::clean($translations[$locale][$field] ?? null);
                if ($value !== null) {
                    $values[$locale] = $value;
                }
            }

            if ($values === []) {
                // No language at all: the column becomes NULL. Assigning []
                // would store {} (docs/how-to/H2-backend.md H2.12)
                $exercise->forgetTranslations($field, asNull: true);
            } else {
                // replaceTranslations(): exactly these languages; one left
                // empty in the form goes. setTranslations() would keep it
                $exercise->replaceTranslations($field, $values);
            }
        }

        // The languages still waiting for a person: those with some text whose
        // switch is off. English is the original, never in the list
        $exercise->machine_translated = array_values(array_filter(
            Locale::codes(),
            fn (string $locale) => $locale !== Locale::En->value
                && ! ($translations[$locale]['reviewed'] ?? true)
                && self::hasText($translations[$locale] ?? []),
        ));

        // The plain columns, through #[Fillable] (app/Models/Exercise.php).
        // `?: null`: an empty field of the form ('') becomes NULL
        $exercise->fill([
            'logging_type' => $data['logging_type'],
            'equipment_id' => $data['equipment_id'] ?? null,
            'youtube_url' => ($data['youtube_url'] ?? null) ?: null,
        ]);

        $exercise->save();

        // sync(): the pivot rows become exactly this list (docs/concepts/C2-backend.md C2.6).
        // The secondary ones first, so that a muscle in both lists, written
        // again as primary, ends up primary
        $roles = [];
        foreach ($data['secondary_muscles'] ?? [] as $id) {
            $roles[(int) $id] = ['role' => MuscleRole::Secondary];
        }
        foreach ($data['primary_muscles'] ?? [] as $id) {
            $roles[(int) $id] = ['role' => MuscleRole::Primary];
        }
        $exercise->muscles()->sync($roles);
    }

    /**
     * One value of the form, cleaned: text trimmed, lists without empty
     * items and renumbered, and anything empty turned into null.
     *
     * The repeater of the steps keeps its items under random keys
     * ("a1b2…" => "Lie down"), which array_values() turns back into a list.
     *
     * @param  mixed  $value  a text, a list of texts, or null
     * @return string|list<string>|null the clean value; null when empty
     */
    private static function clean(mixed $value): string|array|null
    {
        if (is_array($value)) {
            // Each item trimmed, the empty ones dropped, renumbered 0, 1, 2…
            $items = array_values(array_filter(
                array_map(fn ($item) => trim((string) $item), $value),
                fn (string $item) => $item !== '',
            ));

            return $items === [] ? null : $items;
        }

        // A text: trimmed, and null when nothing is left
        $text = trim((string) $value);

        return $text === '' ? null : $text;
    }

    /**
     * Whether a language of the form has any text.
     *
     * @param  array<string, mixed>  $texts  one language's fields
     */
    private static function hasText(array $texts): bool
    {
        foreach (['name', 'aliases', 'description', 'instructions'] as $field) {
            if (self::clean($texts[$field] ?? null) !== null) {
                return true;
            }
        }

        return false;
    }
}
