<?php

namespace App\Actions\Users;

use App\Models\User;
use InvalidArgumentException;

/**
 * Admin or not, enabled or disabled: the row actions of the admin panel's Users
 * screen.
 *
 * **Never on yourself.** An admin cannot remove their own role nor disable
 * their own account: one wrong click would lock them out of the panel, and
 * if they are the only admin, lock everyone out. The panel hides those
 * buttons on the admin's own row; the check here holds even if a request is
 * forged. Another admin can still do it, which is the way back.
 *
 * A disabled user is signed out at their next request (SignOutDisabledAccount)
 * and cannot sign in again.
 */
class ChangeUserAccess
{
    /**
     * @param  User  $actor  the signed-in admin
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
     * @param  User  $actor  the signed-in admin
     *
     * @throws InvalidArgumentException when $actor and $user are the same
     */
    public function setDisabled(User $actor, User $user, bool $disabled): void
    {
        $this->refuseOnSelf($actor, $user);

        $user->disabled_at = $disabled ? now() : null;
        $user->save();
    }

    /**
     * Anyone but themselves; the panel uses it to hide a row's buttons.
     */
    public static function canChange(User $actor, User $user): bool
    {
        return ! $actor->is($user);
    }

    /**
     * @throws InvalidArgumentException
     */
    private function refuseOnSelf(User $actor, User $user): void
    {
        if (! self::canChange($actor, $user)) {
            throw new InvalidArgumentException('An admin cannot change their own role or disable their own account.');
        }
    }
}
