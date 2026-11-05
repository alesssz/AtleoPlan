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
 * Creates the account when someone signs up (POST /api/auth/register).
 *
 * This is the part of signing up that Fortify leaves to us: its controller
 * receives the request, calls this class, signs the new user in and answers.
 * app/Providers/FortifyServiceProvider.php tells Fortify to use it.
 * docs/05-backend.md 5.7.3 compares this with writing the whole step by hand.
 */
class CreateNewUser implements CreatesNewUsers
{
    use PasswordValidationRules;

    /**
     * Validates the input and creates the user.
     *
     * Fortify has already turned the email to lowercase
     * (`lowercase_usernames`, config/fortify.php), so ANN@x.com and ann@x.com
     * are one account.
     *
     * @param  array<string, string>  $input  the request's data
     * @return User the new user, whom Fortify then signs in
     *
     * @throws ValidationException when a field is not valid, which Laravel turns
     *                             into a 422 answer with a message per field
     */
    public function create(array $input): User
    {
        Validator::make($input, [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique(User::class)],
            'password' => $this->passwordRules(),
            // The browser's language, sent by the React app (2.4). Optional:
            // without it the column's default applies. Rule::enum() accepts
            // only the values of the Locale enum
            'locale' => ['sometimes', Rule::enum(Locale::class)],
        ])->validate();

        // User::create() fills only the columns the model marks as fillable.
        // The `hashed` cast (app/Models/User.php) hashes the password, but
        // Hash::make() here makes it plain to the reader; the cast does not hash twice.
        return User::create([
            'name' => $input['name'],
            'email' => $input['email'],
            'password' => Hash::make($input['password']),
            // ?? gives the request's language when no locale was sent (the
            // request's language was set by SetLocaleFromRequest)
            'locale' => $input['locale'] ?? app()->getLocale(),
        ]);
    }
}
