<?php

namespace App\Filament\Resources\Users;

// Imports: the screen's one page and its table, the model, and the Filament
// and Laravel classes used below
use App\Filament\Resources\Users\Pages\ListUsers;
use App\Filament\Resources\Users\Tables\UsersTable;
use App\Models\User;
use BackedEnum;
use Filament\Resources\Resource;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Table;
use Illuminate\Auth\Access\Response;
use Illuminate\Database\Eloquent\Model;
use UnitEnum;

/**
 * The admin screen of the users, at /admin/users (BE-2,
 * docs/design/D1-ui.md D1.4.15, docs/concepts/C2-backend.md C2.8.3).
 *
 * Generated with `make:filament-resource User --record-title-attribute=email`
 * (what a resource is: app/Filament/Resources/Exercises/ExerciseResource.php).
 * Only the list was kept: an admin does not create accounts (people sign up),
 * nor edit their name, email or password (each user does, on Profile), nor
 * delete them (deleting an account is an action of its own, in phase 2,
 * docs/design/D3-data-model.md D3.7.4). The generated create and edit pages and
 * form were removed.
 *
 * What an admin does here are four actions on a row, in Tables/UsersTable.php:
 * make admin, remove admin, disable, enable. Their rules are in the action
 * ChangeUserAccess.
 */
class UserResource extends Resource
{
    /** The model this screen manages. */
    protected static ?string $model = User::class;

    /** The menu's icon. */
    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedUsers;

    /** The column that names a row: the email, which is unique. */
    protected static ?string $recordTitleAttribute = 'email';

    /** The menu's order: after the library. */
    protected static ?int $navigationSort = 2;

    /** The model's name in the panel's texts, in the admin's language. */
    public static function getModelLabel(): string
    {
        return __('admin.users.label');
    }

    /** The same, in the plural: the list's title. */
    public static function getPluralModelLabel(): string
    {
        return __('admin.users.plural_label');
    }

    /** The menu's entry. */
    public static function getNavigationLabel(): string
    {
        return __('admin.users.navigation');
    }

    /**
     * The list: Tables/UsersTable.php.
     *
     * @param  Table  $table  an empty table, handed in by Filament
     */
    public static function table(Table $table): Table
    {
        return UsersTable::configure($table);
    }

    /**
     * The one page, the list, at /admin/users.
     *
     * @return array<string, mixed>
     */
    public static function getPages(): array
    {
        return [
            'index' => ListUsers::route('/'),
        ];
    }

    /**
     * Whether an action is allowed. There is no UserPolicy, and without one
     * Filament allows everything; this says what the screen offers: the list,
     * and nothing that creates, edits or deletes a user through Filament's
     * own pages and actions. The row actions of UsersTable are custom actions,
     * which check their own rule (not on yourself).
     *
     * @param  string|UnitEnum  $action  the action's name: viewAny, create, update, delete…
     * @param  Model|null  $record  the user, when there is one
     */
    public static function getAuthorizationResponse(string|UnitEnum $action, ?Model $record = null): Response
    {
        // The action's name as a string, whether it came as text or as an enum
        // (`instanceof`: whether the value is an object of that class or interface)
        $name = $action instanceof BackedEnum ? $action->value : ($action instanceof UnitEnum ? $action->name : $action);

        // Response::allow() and deny(): Laravel's answers of a policy, which
        // Filament reads as a policy's would be
        return in_array($name, ['viewAny', 'view'], true) ? Response::allow() : Response::deny();
    }
}
