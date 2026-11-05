<?php

namespace App\Actions\Fortify;

use Illuminate\Contracts\Validation\Rule;
use Illuminate\Validation\Rules\Password;

/**
 * The rules of a new password, shared by signing up (CreateNewUser) and
 * resetting a password (ResetUserPassword), so the two can never differ.
 *
 * A trait is a bundle of methods copied into every class that writes
 * `use PasswordValidationRules;` inside it (docs/05-backend.md 5.2).
 */
trait PasswordValidationRules
{
    /**
     * The validation rules of the `password` field.
     *
     * - Password::default(): Laravel's rule, at least 8 characters;
     * - confirmed: the request must also hold `password_confirmation`, with the
     *   same value, which catches a typo in a password nobody can see.
     *
     * @return array<int, Rule|array<mixed>|string>
     */
    protected function passwordRules(): array
    {
        return ['required', 'string', Password::default(), 'confirmed'];
    }
}
