<?php

namespace App\Filament\Resources\Exercises;

use App\Filament\Resources\Exercises\Pages\CreateExercise;
use App\Filament\Resources\Exercises\Pages\EditExercise;
use App\Filament\Resources\Exercises\Pages\ListExercises;
use App\Filament\Resources\Exercises\Schemas\ExerciseForm;
use App\Filament\Resources\Exercises\Tables\ExercisesTable;
use App\Models\Exercise;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use Illuminate\Auth\Access\Response;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletingScope;
use UnitEnum;

/**
 * The admin screen of the public exercise library, /admin/exercises. Not to be
 * confused with App\Http\Resources\ExerciseResource, the API resource.
 *
 * **Public exercises only.** Personal exercises belong to their owners:
 * getEloquentQuery() leaves them out of the list, and
 * getRecordRouteBindingEloquentQuery() out of the edit page's URL.
 *
 * **Its own permissions, not ExercisePolicy.** The policy refuses changes to
 * public exercises to everyone, admins included, because the API must (the
 * app's editor would let an admin rewrite a public exercise in one language).
 * The panel is admins-only already (User::canAccessPanel()), so this
 * resource answers in getAuthorizationResponse().
 */
class ExerciseResource extends Resource
{
    protected static ?string $model = Exercise::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    protected static ?string $recordTitleAttribute = 'name';

    protected static ?int $navigationSort = 1;

    /**
     * Methods rather than properties: a property is fixed when the class
     * loads, before the admin's language is known.
     */
    public static function getModelLabel(): string
    {
        return __('admin.exercises.label');
    }

    public static function getPluralModelLabel(): string
    {
        return __('admin.exercises.plural_label');
    }

    public static function getNavigationLabel(): string
    {
        return __('admin.exercises.navigation');
    }

    public static function form(Schema $schema): Schema
    {
        return ExerciseForm::configure($schema);
    }

    public static function table(Table $table): Table
    {
        return ExercisesTable::configure($table);
    }

    /**
     * @return array<string, mixed>
     */
    public static function getPages(): array
    {
        return [
            'index' => ListExercises::route('/'),
            'create' => CreateExercise::route('/create'),
            'edit' => EditExercise::route('/{record}/edit'),
        ];
    }

    /**
     * @return Builder<Exercise>
     */
    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->whereNull('owner_id');
    }

    /**
     * Deleted exercises included, so one can be opened and restored.
     *
     * @return Builder<Exercise>
     */
    public static function getRecordRouteBindingEloquentQuery(): Builder
    {
        return parent::getRecordRouteBindingEloquentQuery()
            ->withoutGlobalScopes([SoftDeletingScope::class])
            ->whereNull('owner_id');
    }

    /**
     * In place of ExercisePolicy (see the class comment).
     *
     * - Deleting for good is refused: plans and workouts point to exercises,
     *   and a soft delete keeps them working. Replicate and reorder are not
     *   offered either.
     * - Everything else is allowed on a public exercise and refused on a
     *   personal one, which the queries above never load anyway.
     */
    public static function getAuthorizationResponse(string|UnitEnum $action, ?Model $record = null): Response
    {
        $name = $action instanceof BackedEnum ? $action->value : ($action instanceof UnitEnum ? $action->name : $action);

        if (in_array($name, ['forceDelete', 'forceDeleteAny', 'replicate', 'reorder'], true)) {
            return Response::deny();
        }

        return $record === null || ($record instanceof Exercise && $record->isPublic())
            ? Response::allow()
            : Response::deny();
    }
}
