<?php

namespace App\Filament\Resources\Exercises\Pages;

use App\Actions\Exercises\SavePublicExercise;
use App\Filament\Resources\Exercises\ExerciseResource;
use App\Models\Exercise;
use Filament\Resources\Pages\CreateRecord;

/**
 * The form holds four languages and two muscle lists, which do not map onto the
 * model's columns, so SavePublicExercise saves it.
 */
class CreateExercise extends CreateRecord
{
    protected static string $resource = ExerciseResource::class;

    /**
     * @param  array<string, mixed>  $data  the form's state (shape: SavePublicExercise)
     */
    protected function handleRecordCreation(array $data): Exercise
    {
        return app(SavePublicExercise::class)->create($data);
    }
}
