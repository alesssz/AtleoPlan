<?php

namespace App\Actions\Users;

// Imports: the model it changes, and the exception for a change refused
use App\Models\User;
use InvalidArgumentException;

/**
 * Changes who a user is to the app: admin or not, enabled or disabled
 * (BE-2, docs/concepts/C2-backend.md C2.8.3). The four row actions of the
 * admin panel's Users screen (app/Filament/Resources/Users/Tables/UsersTable.php)
 * call it; a test calls it directly (tests/Feature/Admin/UserAdminTest.php).
 * Generated with `make:class Actions/Users/ChangeUserAccess`.
 *
 * **Never on yourself.** An admin cannot remove their own role nor disable
 * their own account: one wrong click would lock them out of the panel, and
 * if they are the only admin, lock everyone out. The panel hides those
 * buttons on the admin's own row; the check here holds even if a request is
 * forged. Another admin can still do it, which is the way back.
 *
 * `is_admin` and `disabled_at` are not in User's #[Fillable] (no request may
 * set them), so they are assigned one by one.
 *
 * What disabling does next: SignOutDisabledAccount ends the user's session at
 * their next request, and signing in is refused (C2.7.9).
 */
class ChangeUserAccess
{
    /**
     * Makes a user an admin, or a plain user again.
     *
     * @param  User  $actor  the admin doing it, the signed-in one
     * @param  User  $user  the user changed
     * @param  bool  $admin  true: admin; false: plain user
     *
     * @throws InvalidArgumentException when $actor and $user are the same
     */
    public function setAdmin(User $actor, User $user, bool $admin): void
    {
        $this->refuseOnSelf($actor, $user);

        $user->is_admin = $admin;
        $user->save();
    }

    /**
     * Disables an account, or enables it again.
     *
     * @param  User  $actor  the admin doing it
     * @param  User  $user  the user changed
     * @param  bool  $disabled  true: disabled from now; false: enabled
     *
     * @throws InvalidArgumentException when $actor and $user are the same
     */
    public function setDisabled(User $actor, User $user, bool $disabled): void
    {
        $this->refuseOnSelf($actor, $user);

        // now(): the current moment, as a Carbon date; null clears the column
        $user->disabled_at = $disabled ? now() : null;
        $user->save();
    }

    /**
     * Whether an admin may change this user's access: anyone but themselves.
     * The panel asks it to show or hide the buttons of a row.
     *
     * is() compares two models by table and id, not by object: two queries
     * reading the same row give two objects, which `===` would call different.
     *
     * @param  User  $actor  the admin looking at the list
     * @param  User  $user  the row's user
     */
    public static function canChange(User $actor, User $user): bool
    {
        return ! $actor->is($user);
    }

    /**
     * Stops a change an admin makes to their own account.
     *
     * @param  User  $actor  the admin doing it
     * @param  User  $user  the user changed
     *
     * @throws InvalidArgumentException when they are the same
     */
    private function refuseOnSelf(User $actor, User $user): void
    {
        if (! self::canChange($actor, $user)) {
            throw new InvalidArgumentException('An admin cannot change their own role or disable their own account.');
        }
    }
}
