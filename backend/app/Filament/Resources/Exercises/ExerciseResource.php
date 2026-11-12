<?php

namespace App\Filament\Resources\Exercises;

// Imports: the screen's pages, form and table (each in its own file of this
// folder), the model, and the Filament and Laravel classes used below
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
 * The admin screen of the public exercise library, at /admin/exercises
 * (BE-1, docs/design/D1-ui.md D1.4.15, docs/concepts/C2-backend.md C2.8.2).
 *
 * A Filament **resource** is the admin screen of one model: its list, its
 * form and its pages, described in PHP (docs/concepts/C2-backend.md C2.8).
 * Generated with `make:filament-resource Exercise --soft-deletes
 * --record-title-attribute=name`, which wrote this class, the three pages in
 * Pages/, the form in Schemas/ and the list in Tables/. The panel
 * (app/Providers/Filament/AdminPanelProvider.php) finds it by itself.
 *
 * Not to be confused with App\Http\Resources\ExerciseResource, the API
 * resource that turns an exercise into JSON: same short name, another
 * namespace, another job.
 *
 * **Public exercises only.** Personal exercises belong to their owners, and
 * admins do not see them here: getEloquentQuery() leaves them out of the list,
 * and getRecordRouteBindingEloquentQuery() out of the edit page's URL.
 *
 * **Its own permissions, not ExercisePolicy.** Filament asks a model's policy
 * before each action, and ExercisePolicy refuses changes to public exercises
 * to everyone, admins included, because the API must (the React app's editor
 * would otherwise let an admin rewrite a public exercise in one language).
 * The panel is already for admins only (User::canAccessPanel()), so this
 * resource answers for itself in getAuthorizationResponse().
 */
class ExerciseResource extends Resource
{
    /** The model this screen manages. */
    protected static ?string $model = Exercise::class;

    /**
     * The menu's icon: Heroicons, the set Filament ships
     * (https://heroicons.com). `string|BackedEnum|null`: a union type, any of the three.
     */
    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedRectangleStack;

    /** The column that names a row, in page titles: the name, in the panel's language. */
    protected static ?string $recordTitleAttribute = 'name';

    /** The menu's order: the library first, users after. */
    protected static ?int $navigationSort = 1;

    /**
     * The model's name in the panel's texts ("New exercise"), in the admin's
     * language (lang/<language>/admin.php). A method, not a property: a
     * property's value is fixed when the class loads, before the language is known.
     */
    public static function getModelLabel(): string
    {
        return __('admin.exercises.label');
    }

    /** The same, in the plural: the list's title. */
    public static function getPluralModelLabel(): string
    {
        return __('admin.exercises.plural_label');
    }

    /** The menu's entry. */
    public static function getNavigationLabel(): string
    {
        return __('admin.exercises.navigation');
    }

    /**
     * The form of the create and edit pages: Schemas/ExerciseForm.php.
     *
     * @param  Schema  $schema  an empty form, handed in by Filament
     */
    public static function form(Schema $schema): Schema
    {
        return ExerciseForm::configure($schema);
    }

    /**
     * The list: Tables/ExercisesTable.php.
     *
     * @param  Table  $table  an empty table, handed in by Filament
     */
    public static function table(Table $table): Table
    {
        return ExercisesTable::configure($table);
    }

    /**
     * The pages and their addresses, under /admin/exercises. `::route()`
     * makes the route of each page class.
     *
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
     * The query every list starts from: the public exercises only.
     *
     * The parent's query already hides deleted rows (SoftDeletes); the list's
     * Deleted filter (TrashedFilter) undoes that when asked.
     *
     * @return Builder<Exercise>
     */
    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->whereNull('owner_id');
    }

    /**
     * The query that finds the exercise of an edit page's URL
     * (/admin/exercises/12/edit): public ones, deleted ones included, so a
     * deleted exercise can be opened and restored. Generated by
     * --soft-deletes; the public condition was added.
     *
     * withoutGlobalScopes([SoftDeletingScope::class]) removes the condition
     * SoftDeletes adds to every query, as withTrashed() does.
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
     * Whether an action is allowed, in place of ExercisePolicy (see the
     * class's comment). Filament calls it for each action: `viewAny`
     * (the list), `create`, `update`, `delete`, `restore`, `forceDelete`…, with
     * the exercise when there is one.
     *
     * - Deleting for good is refused: plans and workouts point to exercises,
     *   and a soft delete keeps them working (docs/design/D3-data-model.md D3.7.2).
     *   The same for replicate and reorder, which this screen does not offer.
     * - Everything else is allowed on a public exercise, and refused on a
     *   personal one, which the queries above already never load.
     *
     * Response::allow() and deny() are Laravel's answers of a policy, which
     * Filament reads as the policy's would be.
     *
     * @param  string|UnitEnum  $action  the action's name
     * @param  Model|null  $record  the exercise, or null for list and create
     */
    public static function getAuthorizationResponse(string|UnitEnum $action, ?Model $record = null): Response
    {
        // The action's name as a string, whether it came as text or as an enum.
        // `instanceof`: whether the value is an object of that class or
        // interface; a backed enum's case has a ->value, a plain one a ->name
        $name = $action instanceof BackedEnum ? $action->value : ($action instanceof UnitEnum ? $action->name : $action);

        if (in_array($name, ['forceDelete', 'forceDeleteAny', 'replicate', 'reorder'], true)) {
            return Response::deny();
        }

        return $record === null || ($record instanceof Exercise && $record->isPublic())
            ? Response::allow()
            : Response::deny();
    }
}
