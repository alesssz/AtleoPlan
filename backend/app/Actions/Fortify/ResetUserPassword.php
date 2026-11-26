<?php

namespace App\Actions\Fortify;

use App\Actions\Auth\EndSessions;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Contracts\ResetsUserPasswords;

/**
 * The end of "forgot password" (POST /api/auth/reset-password). Fortify has
 * already checked the emailed token.
 *
 * - **Signed out everywhere:** a reset is how a stolen password, or an
 *   account someone else signed up with this address, is taken back, and
 *   their sessions must not outlive it.
 * - **The address counts as confirmed:** the token came through it, as the
 *   confirmation link would have.
 */
class ResetUserPassword implements ResetsUserPasswords
{
    use PasswordValidationRules;

    public function __construct(private EndSessions $endSessions) {}

    /**
     * @param  array<string, string>  $input
     *
     * @throws ValidationException
     */
    public function reset(User $user, array $input): void
    {
        Validator::make($input, [
            'password' => $this->passwordRules(),
        ])->validate();

        $user->forceFill([
            'password' => Hash::make($input['password']),
            'email_verified_at' => $user->email_verified_at ?? now(),
        ])->save();

        $this->endSessions->handle($user);
    }
}
