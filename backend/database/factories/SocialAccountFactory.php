<?php

namespace Database\Factories;

// Imports: the enum of the providers, the models, Laravel's base Factory
use App\Enums\SocialProvider;
use App\Models\SocialAccount;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * Makes fake linked accounts for tests (docs/concepts/C2-backend.md C2.6):
 * `SocialAccount::factory()->for($user)->create(['provider_user_id' => '42'])`
 * links Google account 42 to that user. Without `for()`, a new user is made.
 *
 * @extends Factory<SocialAccount>
 */
class SocialAccountFactory extends Factory
{
    /**
     * The column values of a new fake row.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            // A factory as a value: Laravel creates a user first, and puts
            // its id here
            'user_id' => User::factory(),
            'provider' => SocialProvider::Google,
            // 21 random digits, the shape of a Google `sub`; unique() never
            // gives the same one twice in a run
            'provider_user_id' => fake()->unique()->numerify('#####################'),
        ];
    }
}
