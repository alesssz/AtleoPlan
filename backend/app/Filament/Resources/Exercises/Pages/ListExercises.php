<?php

namespace App\Filament\Resources\Exercises\Pages;

// Imports: the resource this page belongs to, the New button, and
// Filament's base class of a list page
use App\Filament\Resources\Exercises\ExerciseResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

/**
 * The list of public exercises, /admin/exercises. Generated with the
 * resource and left as it was: the columns, search and filters are in
 * Tables/ExercisesTable.php.
 */
class ListExercises extends ListRecords
{
    /** The resource this page belongs to. */
    protected static string $resource = ExerciseResource::class;

    /**
     * The buttons at the top of the list: New exercise, which opens the
     * create page.
     *
     * @return list<CreateAction>
     */
    protected function getHeaderActions(): array
    {
        return [
            CreateAction::make(),
        ];
    }
}
