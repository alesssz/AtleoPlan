<?php

namespace App\Filament\Resources\Exercises\Pages;

// Imports: the action that saves, the resource this page belongs to, the
// model, Filament's header actions, its base class of an edit page, and
// Laravel's base model
use App\Actions\Exercises\SavePublicExercise;
use App\Filament\Resources\Exercises\ExerciseResource;
use App\Models\Exercise;
use Filament\Actions\DeleteAction;
use Filament\Actions\RestoreAction;
use Filament\Resources\Pages\EditRecord;
use Illuminate\Database\Eloquent\Model;

/**
 * The page that changes a public exercise, /admin/exercises/{id}/edit.
 *
 * Generated with the resource. Filament's EditRecord fills the form from the
 * model's columns and writes them back on Save. Both are replaced, as on
 * CreateExercise: the form shows each language apart and the muscles in two
 * lists, which SavePublicExercise reads and writes
 * (docs/concepts/C2-backend.md C2.8.2).
 */
class EditExercise extends EditRecord
{
    /** The resource this page belongs to. */
    protected static string $resource = ExerciseResource::class;

    /**
     * The buttons at the top of the page: Delete (a soft delete, shown while
     * the exercise is not deleted) and Restore (shown once it is). The
     * generated Force delete was removed: plans and workouts may point to the
     * exercise (docs/design/D3-data-model.md D3.7.2).
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
     * What the form shows when the page opens. Filament passes the model's
     * columns, which hold the texts as JSON of every language; the form
     * wants them by language, as SavePublicExercise::formState() gives them.
     *
     * @param  array<string, mixed>  $data  the model's attributes, as Filament read them
     * @return array<string, mixed> the form's state
     */
    protected function mutateFormDataBeforeFill(array $data): array
    {
        // $this->record: the exercise of the URL, loaded by Filament.
        // `assert(…)` tells static analysis it is an Exercise, not any Model
        assert($this->record instanceof Exercise);

        return SavePublicExercise::formState($this->record);
    }

    /**
     * Saves the changes, through the action.
     *
     * @param  Model  $record  the exercise being changed
     * @param  array<string, mixed>  $data  the form's state, already validated
     * @return Model the same exercise, saved
     */
    protected function handleRecordUpdate(Model $record, array $data): Model
    {
        assert($record instanceof Exercise);

        return app(SavePublicExercise::class)->update($record, $data);
    }
}
