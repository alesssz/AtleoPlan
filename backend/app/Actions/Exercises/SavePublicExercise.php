<?php

namespace App\Actions\Exercises;

use App\Enums\Locale;
use App\Enums\MuscleRole;
use App\Models\Exercise;
use Illuminate\Support\Facades\DB;
use LogicException;

/**
 * Creates and changes a public exercise from the admin panel's form. The rules
 * live here rather than in the Filament screen, so they are tested without it.
 *
 * The form's state:
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
 *   `reviewed` switch: off, the language is in `machine_translated`; on, it is
 *   not. English is the original and never there. A language with no text is
 *   never there either.
 * - **Muscles in two lists**, primary and secondary; a muscle in both stays
 *   primary, as in the import (ImportFreeExercise::muscleRoles()).
 * - **Public only.** The owner stays empty; changing a personal exercise
 *   here is a mistake of the caller, and throws.
 */
class SavePublicExercise
{
    /**
     * @param  array<string, mixed>  $data  the form's state; English's name is required
     */
    public function create(array $data): Exercise
    {
        return DB::transaction(function () use ($data) {
            // No owner: public
            $exercise = new Exercise;
            $this->write($exercise, $data);

            return $exercise;
        });
    }

    /**
     * @param  array<string, mixed>  $data  the form's state
     *
     * @throws LogicException when the exercise is personal
     */
    public function update(Exercise $exercise, array $data): Exercise
    {
        // The panel lists public exercises only; the check keeps the rule here
        if (! $exercise->isPublic()) {
            throw new LogicException("Exercise {$exercise->id} is personal: the admin panel changes public exercises only.");
        }

        return DB::transaction(function () use ($exercise, $data) {
            $this->write($exercise, $data);

            return $exercise;
        });
    }

    /**
     * What fills the edit page: the reverse of write().
     *
     * @return array<string, mixed>
     */
    public static function formState(Exercise $exercise): array
    {
        $muscles = $exercise->muscles()->get();

        $idsWith = fn (MuscleRole $role): array => $muscles
            ->filter(fn ($muscle) => $muscle->pivot->role === $role)
            ->pluck('id')
            ->values()
            ->all();

        return [
            'translations' => collect(Locale::codes())
                ->mapWithKeys(fn (string $locale) => [$locale => [
                    // `false`: this language only, no fallback
                    'name' => $exercise->getTranslation('name', $locale, false) ?: null,
                    'aliases' => $exercise->getTranslation('aliases', $locale, false) ?: [],
                    'description' => $exercise->getTranslation('description', $locale, false) ?: null,
                    'instructions' => $exercise->getTranslation('instructions', $locale, false) ?: [],
                    'reviewed' => ! in_array($locale, $exercise->machine_translated ?? [], true),
                ]])
                ->all(),
            'logging_type' => $exercise->logging_type?->value,
            'equipment_id' => $exercise->equipment_id,
            'youtube_url' => $exercise->youtube_url,
            'primary_muscles' => $idsWith(MuscleRole::Primary),
            'secondary_muscles' => $idsWith(MuscleRole::Secondary),
        ];
    }

    /**
     * @param  array<string, mixed>  $data  the form's state
     */
    private function write(Exercise $exercise, array $data): void
    {
        $translations = $data['translations'] ?? [];

        foreach ($exercise->getTranslatableAttributes() as $field) {
            // ['en' => 'Plank', 'it' => 'Plank']
            $values = [];
            foreach (Locale::codes() as $locale) {
                $value = self::clean($translations[$locale][$field] ?? null);
                if ($value !== null) {
                    $values[$locale] = $value;
                }
            }

            if ($values === []) {
                // Assigning [] would store {}
                $exercise->forgetTranslations($field, asNull: true);
            } else {
                // A language emptied in the form must go, which
                // setTranslations() would keep
                $exercise->replaceTranslations($field, $values);
            }
        }

        // Languages with some text whose switch is off. English is the
        // original, never in the list
        $exercise->machine_translated = array_values(array_filter(
            Locale::codes(),
            fn (string $locale) => $locale !== Locale::En->value
                && ! ($translations[$locale]['reviewed'] ?? true)
                && self::hasText($translations[$locale] ?? []),
        ));

        // An empty field of the form ('') becomes NULL
        $exercise->fill([
            'logging_type' => $data['logging_type'],
            'equipment_id' => $data['equipment_id'] ?? null,
            'youtube_url' => ($data['youtube_url'] ?? null) ?: null,
        ]);

        $exercise->save();

        // Secondary first, so a muscle in both lists ends up primary
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
     * Text trimmed, lists without empty items, anything empty null. The
     * steps' repeater keys its items randomly ("a1b2…" => "Lie down"), hence
     * array_values().
     *
     * @return string|list<string>|null
     */
    private static function clean(mixed $value): string|array|null
    {
        if (is_array($value)) {
            $items = array_values(array_filter(
                array_map(fn ($item) => trim((string) $item), $value),
                fn (string $item) => $item !== '',
            ));

            return $items === [] ? null : $items;
        }

        $text = trim((string) $value);

        return $text === '' ? null : $text;
    }

    /**
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
