<?php

namespace App\Filament\Resources\Users;

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
 * The admin screen of the users, /admin/users.
 *
 * Only a list: admins do not create accounts (people sign up), edit them (each
 * user does, on Profile) or delete them (an action of its own, phase 2). What
 * an admin does here are the row actions of UsersTable, whose rules are in
 * ChangeUserAccess.
 */
class UserResource extends Resource
{
    protected static ?string $model = User::class;

    protected static string|BackedEnum|null $navigationIcon = Heroicon::OutlinedUsers;

    protected static ?string $recordTitleAttribute = 'email';

    protected static ?int $navigationSort = 2;

    public static function getModelLabel(): string
    {
        return __('admin.users.label');
    }

    public static function getPluralModelLabel(): string
    {
        return __('admin.users.plural_label');
    }

    public static function getNavigationLabel(): string
    {
        return __('admin.users.navigation');
    }

    public static function table(Table $table): Table
    {
        return UsersTable::configure($table);
    }

    /**
     * @return array<string, mixed>
     */
    public static function getPages(): array
    {
        return [
            'index' => ListUsers::route('/'),
        ];
    }

    /**
     * Without a UserPolicy Filament would allow everything. Only the list is
     * offered; the row actions are custom and check their own rule.
     */
    public static function getAuthorizationResponse(string|UnitEnum $action, ?Model $record = null): Response
    {
        $name = $action instanceof BackedEnum ? $action->value : ($action instanceof UnitEnum ? $action->name : $action);

        return in_array($name, ['viewAny', 'view'], true) ? Response::allow() : Response::deny();
    }
}
