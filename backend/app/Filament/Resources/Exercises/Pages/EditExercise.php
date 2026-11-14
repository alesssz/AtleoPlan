<?php

namespace App\Filament\Resources\Exercises\Pages;

use App\Actions\Exercises\SavePublicExercise;
use App\Filament\Resources\Exercises\ExerciseResource;
use App\Models\Exercise;
use Filament\Actions\DeleteAction;
use Filament\Actions\RestoreAction;
use Filament\Resources\Pages\EditRecord;
use Illuminate\Database\Eloquent\Model;

/**
 * Filled and saved through SavePublicExercise, as on CreateExercise.
 */
class EditExercise extends EditRecord
{
    protected static string $resource = ExerciseResource::class;

    /**
     * No force delete: plans and workouts may point to the exercise.
     *
     * @return list<DeleteAction|RestoreAction>
     */
    protected function getHeaderActions(): array
    {
        return [
            DeleteAction::make(),
            RestoreAction::make(),
        ];
    }

    /**
     * The form wants the texts by language, not as the columns' JSON.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    protected function mutateFormDataBeforeFill(array $data): array
    {
        assert($this->record instanceof Exercise);

        return SavePublicExercise::formState($this->record);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    protected function handleRecordUpdate(Model $record, array $data): Model
    {
        assert($record instanceof Exercise);

        return app(SavePublicExercise::class)->update($record, $data);
    }
}
