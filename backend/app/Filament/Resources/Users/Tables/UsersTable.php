<?php

namespace App\Filament\Resources\Users\Tables;

// Imports: the action with the rules, the model, then Filament's actions,
// columns and filters, and Laravel's query builder
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
 * The list of users, with the four actions an admin has on each
 * (BE-2, docs/design/D1-ui.md D1.4.15, docs/concepts/C2-backend.md C2.8.3).
 *
 * The columns, search and filters are as in the exercises' table
 * (app/Filament/Resources/Exercises/Tables/ExercisesTable.php). New here are
 * **custom actions**: `Action::make('disable')` is a button of our own, with
 * a label, a confirmation window and a closure that does the work. Each
 * calls ChangeUserAccess, and is hidden on the admin's own row.
 */
class UsersTable
{
    /**
     * Puts the columns, filters and actions into the table.
     *
     * @param  Table  $table  an empty table, handed in by Filament
     * @return Table the same table, filled
     */
    public static function configure(Table $table): Table
    {
        return $table
            // withExists(): one more column, social_accounts_exists, true when
            // the user has a linked Google account; a subquery, not a query per row
            ->modifyQueryUsing(fn (Builder $query) => $query->withExists('socialAccounts'))
            // The newest accounts first
            ->defaultSort('created_at', 'desc')
            ->columns([
                // description(): a second, grey line under the value; here
                // "You" on the admin's own row
                TextColumn::make('name')
                    ->label(__('admin.users.name'))
                    ->searchable()
                    ->description(fn (User $record) => $record->is(auth()->user()) ? __('admin.users.you') : null),
                TextColumn::make('email')
                    ->label(__('admin.users.email'))
                    ->searchable(),
                // The role, from is_admin, as a coloured word
                TextColumn::make('is_admin')
                    ->label(__('admin.users.role'))
                    ->formatStateUsing(fn (bool $state) => __($state ? 'admin.users.roles.admin' : 'admin.users.roles.user'))
                    ->badge()
                    ->color(fn (bool $state) => $state ? 'primary' : 'gray'),
                // A tick when a Google account is linked
                IconColumn::make('social_accounts_exists')
                    ->label(__('admin.users.google'))
                    ->boolean(),
                // Active or disabled, from disabled_at; a disabled account
                // shows since when underneath. `state()` because the column
                // is a date, and the badge needs a word. disabled_at is a
                // Carbon date (the model's cast), whose diffForHumans() says
                // "2 days ago" in the current language
                TextColumn::make('status')
                    ->label(__('admin.users.status'))
                    ->state(fn (User $record) => $record->disabled_at === null ? 'active' : 'disabled')
                    ->formatStateUsing(fn (string $state) => __("admin.users.statuses.{$state}"))
                    ->badge()
                    ->color(fn (string $state) => $state === 'active' ? 'success' : 'danger')
                    ->description(fn (User $record) => $record->disabled_at?->diffForHumans()),
                // date(): the day only, in the admin's language ("12 nov 2026")
                TextColumn::make('created_at')
                    ->label(__('admin.users.created_at'))
                    ->date()
                    ->sortable(),
            ])
            ->filters([
                // A three-way filter: all, only true, only false
                TernaryFilter::make('is_admin')
                    ->label(__('admin.users.role'))
                    ->trueLabel(__('admin.users.roles.admin'))
                    ->falseLabel(__('admin.users.roles.user')),
                // nullable(): "true" means the column is filled, "false" empty
                TernaryFilter::make('disabled_at')
                    ->label(__('admin.users.status'))
                    ->nullable()
                    ->trueLabel(__('admin.users.statuses.disabled'))
                    ->falseLabel(__('admin.users.statuses.active')),
            ])
            // The four actions, in a "⋮" menu at the end of the row; each is
            // shown only when it makes sense (an admin is not made admin again)
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
     * One of the four actions: a button with a confirmation window, hidden
     * on the admin's own row, that calls ChangeUserAccess.
     *
     * Its texts are admin.users.<key> (the label, "Disable") and
     * admin.users.<key>_confirm (the window's sentence), where <key> is the
     * name in snake_case, as the language files write keys: makeAdmin →
     * make_admin.
     *
     * @param  string  $name  the action's name, such as "disable"
     * @param  Heroicon  $icon  its icon
     * @param  \Closure(User): bool  $visible  whether the row's user can receive it
     * @param  \Closure(ChangeUserAccess, User, User): void  $change  the change: the action, the admin, the user
     * @param  bool  $danger  red button and window, for disabling
     */
    private static function accessAction(string $name, Heroicon $icon, \Closure $visible, \Closure $change, bool $danger = false): Action
    {
        // The key of its texts in lang/<language>/admin.php
        $key = ['makeAdmin' => 'make_admin', 'removeAdmin' => 'remove_admin', 'disable' => 'disable', 'enable' => 'enable'][$name];

        return Action::make($name)
            ->label(__("admin.users.{$key}"))
            ->icon($icon)
            ->color($danger ? 'danger' : 'gray')
            // A window asking to confirm, with what will happen
            ->requiresConfirmation()
            ->modalDescription(fn (User $record) => __("admin.users.{$key}_confirm", ['name' => $record->name]))
            // Shown when it makes sense for this row and the row is not the admin's own
            ->visible(fn (User $record) => $visible($record) && ChangeUserAccess::canChange(auth()->user(), $record))
            // The work. Filament fills the closure's parameters by name:
            // $record is the row's user, $action this action
            ->action(function (User $record, Action $action) use ($change) {
                $change(app(ChangeUserAccess::class), auth()->user(), $record);
                // success(): shows the green notification set below
                $action->success();
            })
            ->successNotificationTitle(__('admin.users.done'));
    }
}
