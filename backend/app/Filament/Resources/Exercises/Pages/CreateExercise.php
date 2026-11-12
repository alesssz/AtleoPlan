<?php

namespace App\Filament\Resources\Exercises\Pages;

// Imports: the action that saves, the resource this page belongs to, the
// model, and Filament's base class of a create page
use App\Actions\Exercises\SavePublicExercise;
use App\Filament\Resources\Exercises\ExerciseResource;
use App\Models\Exercise;
use Filament\Resources\Pages\CreateRecord;

/**
 * The page that creates a public exercise, /admin/exercises/create.
 *
 * Generated with the resource. Filament's CreateRecord shows the resource's
 * form and, on Create, would write the form's fields straight onto a new
 * model. That cannot work here: the texts are in four languages and the
 * muscles in two lists, so handleRecordCreation() hands the form to
 * SavePublicExercise instead (docs/concepts/C2-backend.md C2.8.2).
 */
class CreateExercise extends CreateRecord
{
    /** The resource this page belongs to. */
    protected static string $resource = ExerciseResource::class;

    /**
     * Saves the new exercise. Filament calls it with the form's state, already
     * validated by the form's rules (required(), url()…).
     *
     * `protected`: Filament's own method, replaced here; the parent's version
     * calls `Exercise::create($data)`.
     *
     * @param  array<string, mixed>  $data  the form's state (shape: SavePublicExercise)
     * @return Exercise the exercise created
     */
    protected function handleRecordCreation(array $data): Exercise
    {
        // app(): the action from Laravel's service container (docs/concepts/C2-backend.md C2.5.3)
        return app(SavePublicExercise::class)->create($data);
    }
}
