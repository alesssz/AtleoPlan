<?php

namespace App\Filament\Resources\Users\Tables;

use App\Actions\Users\ChangeUserAccess;
use App\Models\User;
use Filament\Actions\Action;
use Filament\Actions\ActionGroup;
use Filament\Support\Icons\Heroicon;
use Filament\Tables\Columns\IconColumn;
use Filament\Tables\Columns\TextColumn;
use Filament\Tables\Filters\TernaryFilter;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

/**
 * The list of users, with four row actions. Each calls ChangeUserAccess and is
 * hidden on the admin's own row.
 */
class UsersTable
{
    public static function configure(Table $table): Table
    {
        return $table
            // A subquery, not a query per row
            ->modifyQueryUsing(fn (Builder $query) => $query->withExists('socialAccounts'))
            ->defaultSort('created_at', 'desc')
            ->columns([
                // "You" under the admin's own row
                TextColumn::make('name')
                    ->label(__('admin.users.name'))
                    ->searchable()
                    ->description(fn (User $record) => $record->is(auth()->user()) ? __('admin.users.you') : null),
                TextColumn::make('email')
                    ->label(__('admin.users.email'))
                    ->searchable(),
                TextColumn::make('is_admin')
                    ->label(__('admin.users.role'))
                    ->formatStateUsing(fn (bool $state) => __($state ? 'admin.users.roles.admin' : 'admin.users.roles.user'))
                    ->badge()
                    ->color(fn (bool $state) => $state ? 'primary' : 'gray'),
                IconColumn::make('social_accounts_exists')
                    ->label(__('admin.users.google'))
                    ->boolean(),
                // A disabled account shows since when underneath
                TextColumn::make('status')
                    ->label(__('admin.users.status'))
                    ->state(fn (User $record) => $record->disabled_at === null ? 'active' : 'disabled')
                    ->formatStateUsing(fn (string $state) => __("admin.users.statuses.{$state}"))
                    ->badge()
                    ->color(fn (string $state) => $state === 'active' ? 'success' : 'danger')
                    ->description(fn (User $record) => $record->disabled_at?->diffForHumans()),
                TextColumn::make('created_at')
                    ->label(__('admin.users.created_at'))
                    ->date()
                    ->sortable(),
            ])
            ->filters([
                TernaryFilter::make('is_admin')
                    ->label(__('admin.users.role'))
                    ->trueLabel(__('admin.users.roles.admin'))
                    ->falseLabel(__('admin.users.roles.user')),
                TernaryFilter::make('disabled_at')
                    ->label(__('admin.users.status'))
                    ->nullable()
                    ->trueLabel(__('admin.users.statuses.disabled'))
                    ->falseLabel(__('admin.users.statuses.active')),
            ])
            ->recordActions([
                ActionGroup::make([
                    self::accessAction('makeAdmin', Heroicon::OutlinedShieldCheck,
                        visible: fn (User $user) => ! $user->is_admin,
                        change: fn (ChangeUserAccess $access, User $actor, User $user) => $access->setAdmin($actor, $user, true)),
                    self::accessAction('removeAdmin', Heroicon::OutlinedShieldExclamation,
                        visible: fn (User $user) => $user->is_admin,
                        change: fn (ChangeUserAccess $access, User $actor, User $user) => $access->setAdmin($actor, $user, false)),
                    self::accessAction('disable', Heroicon::OutlinedNoSymbol,
                        visible: fn (User $user) => $user->disabled_at === null,
                        change: fn (ChangeUserAccess $access, User $actor, User $user) => $access->setDisabled($actor, $user, true),
                        danger: true),
                    self::accessAction('enable', Heroicon::OutlinedCheckCircle,
                        visible: fn (User $user) => $user->disabled_at !== null,
                        change: fn (ChangeUserAccess $access, User $actor, User $user) => $access->setDisabled($actor, $user, false)),
                ]),
            ]);
    }

    /**
     * Texts: admin.users.<key> and admin.users.<key>_confirm, with the name in
     * snake_case as the language files write keys.
     *
     * @param  \Closure(User): bool  $visible  whether the row's user can receive it
     * @param  \Closure(ChangeUserAccess, User, User): void  $change  the action, the admin, the user
     */
    private static function accessAction(string $name, Heroicon $icon, \Closure $visible, \Closure $change, bool $danger = false): Action
    {
        $key = ['makeAdmin' => 'make_admin', 'removeAdmin' => 'remove_admin', 'disable' => 'disable', 'enable' => 'enable'][$name];

        return Action::make($name)
            ->label(__("admin.users.{$key}"))
            ->icon($icon)
            ->color($danger ? 'danger' : 'gray')
            ->requiresConfirmation()
            ->modalDescription(fn (User $record) => __("admin.users.{$key}_confirm", ['name' => $record->name]))
            ->visible(fn (User $record) => $visible($record) && ChangeUserAccess::canChange(auth()->user(), $record))
            ->action(function (User $record, Action $action) use ($change) {
                $change(app(ChangeUserAccess::class), auth()->user(), $record);
                $action->success();
            })
            ->successNotificationTitle(__('admin.users.done'));
    }
}
