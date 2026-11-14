<?php

namespace App\Actions\Fortify;

use Illuminate\Contracts\Validation\Rule;
use Illuminate\Validation\Rules\Password;

/**
 * Shared by sign-up and password reset, so the two can never differ.
 */
trait PasswordValidationRules
{
    /**
     * `confirmed` catches a typo in a password nobody can see.
     *
     * @return array<int, Rule|array<mixed>|string>
     */
    protected function passwordRules(): array
    {
        return ['required', 'string', Password::default(), 'confirmed'];
    }
}
