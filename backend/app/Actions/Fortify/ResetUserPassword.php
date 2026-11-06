<?php

namespace App\Actions\Fortify;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Contracts\ResetsUserPasswords;

/**
 * Sets the new password at the end of "forgot password"
 * (POST /api/auth/reset-password). Fortify has already checked the emailed
 * token by the time this runs. docs/concepts/C2-backend.md C2.7.5.
 */
class ResetUserPassword implements ResetsUserPasswords
{
    use PasswordValidationRules;

    /**
     * Validates the new password and saves it.
     *
     * @param  User  $user  the account the token belongs to
     * @param  array<string, string>  $input  the request's data
     *
     * @throws ValidationException when the password is not valid (a 422 answer)
     */
    public function reset(User $user, array $input): void
    {
        Validator::make($input, [
            'password' => $this->passwordRules(),
        ])->validate();

        // forceFill() sets the column whatever the model's fillable list says
        $user->forceFill([
            'password' => Hash::make($input['password']),
        ])->save();
    }
}
