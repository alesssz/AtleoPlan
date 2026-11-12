<?php

namespace App\Filament\Resources\Users\Pages;

// Imports: the resource this page belongs to, and Filament's base class of a list page
use App\Filament\Resources\Users\UserResource;
use Filament\Resources\Pages\ListRecords;

/**
 * The list of users, /admin/users: the Users screen's only page. Generated
 * with the resource; its New user button was removed, since people sign up
 * by themselves (UserResource). The columns, filters and actions are in
 * Tables/UsersTable.php.
 */
class ListUsers extends ListRecords
{
    /** The resource this page belongs to. */
    protected static string $resource = UserResource::class;
}
