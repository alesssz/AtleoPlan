<?php

namespace App\Actions\Fortify;

use App\Enums\Locale;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Laravel\Fortify\Contracts\CreatesNewUsers;

/**
 * Sign-up (POST /api/auth/register). Fortify then signs the new user in.
 */
class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules;

    /**
     * The email arrives lowercased (`lowercase_usernames`,
     * config/fortify.php), so ANN@x.com and ann@x.com are one account.
     *
     * @param  array<string, string>  $input
     *
     * @throws ValidationException
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique(User::class)],
            'password' => $this->passwordRules(),
            // The app's language
            'locale' => ['sometimes', Rule::enum(Locale::class)],
        ])->validate();

        // Hashed explicitly for the reader; the `hashed` cast does not hash twice
        return User::create([
            'name' => $input['name'],
            'email' => $input['email'],
            'password' => Hash::make($input['password']),
            // Else the language of the request (SetLocaleFromRequest)
            'locale' => $input['locale'] ?? app()->getLocale(),
        ]);
    }
}
