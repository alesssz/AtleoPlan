<?php

namespace App\Actions\Fortify;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Contracts\ResetsUserPasswords;

/**
 * The end of "forgot password" (POST /api/auth/reset-password). Fortify has
 * already checked the emailed token.
 */
class ResetUserPassword implements ResetsUserPasswords
{
    use PasswordValidationRules;

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
            // The emailed link proved the address, as Google does: signing in
            // with Google later keeps this password (SignInWithSocialAccount)
            'email_verified_at' => $user->email_verified_at ?? now(),
        ])->save();
    }
}
