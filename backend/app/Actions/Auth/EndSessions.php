<?php

namespace App\Actions\Auth;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Signs a user out everywhere: every session of theirs, and every "remember
 * me" cookie, which would otherwise start a new one. For when whoever holds
 * them may not be the account's owner.
 *
 * Sessions are rows of the `sessions` table (the `database` driver), each
 * with its user's id.
 */
class EndSessions
{
    public function handle(User $user): void
    {
        DB::table(config('session.table'))->where('user_id', $user->getAuthIdentifier())->delete();

        $user->setRememberToken(Str::random(60));
        $user->save();
    }
}
