<?php

namespace Database\Factories;

// The namespace above places the class in Database\Factories, which Composer's
// autoloader maps to the database/factories folder (docs/05-backend.md 5.2, 5.3).

// Imports: the model this factory builds, Laravel's base Factory, and two
// helpers (Hash, Str) used below
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Makes fake users for tests and seeders (docs/05-backend.md 5.6).
 *
 * A factory knows how to fill a model with plausible random data, so a test
 * can write `User::factory()->create()` and get a saved user without listing
 * every column; it only sets what it cares about, e.g.
 * `User::factory()->create(['email' => 'ann@example.com'])`.
 * `User::factory()` exists because User uses the HasFactory trait, which finds
 * this class by its name (model name + "Factory").
 *
 * Every fake user's password is the word `password`.
 *
 * The `@extends Factory<User>` line below tells editors and static analysis
 * that this factory produces User objects; PHP itself ignores it.
 *
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    /**
     * The current password being used by the factory.
     *
     * The hash of "password", computed once and reused: hashing is slow on
     * purpose (to slow down attackers), and a test may create many users.
     * `static` makes it belong to the class, shared by every factory object;
     * `?string` means a string or null (null until the first user is made).
     */
    protected static ?string $password;

    /**
     * Define the model's default state.
     *
     * The column values of a new fake user. fake() is Laravel's helper for
     * Faker, a library of random realistic data (names, emails...); now() is
     * the current date and time.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->name(),
            // unique(): never the same email twice in one run, since the
            // column is unique; safeEmail() uses example.com addresses that
            // can never reach a real inbox
            'email' => fake()->unique()->safeEmail(),
            // Already verified, as most tests want
            'email_verified_at' => now(),
            // `??=` assigns only if the left side is null: hash "password" the
            // first time, then reuse it. Hash is a facade (a static-looking
            // call Laravel passes to its hasher object, bcrypt by default).
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(10),
        ];
    }

    /**
     * Indicate that the model's email address should be unverified.
     *
     * A "state": a named variation on definition(), used as
     * `User::factory()->unverified()->create()`. `fn (...) => [...]` is an
     * arrow function, a short one-expression function: it receives the
     * attributes so far and returns the ones to change. The return type
     * `static` means "this same factory", so more calls can be chained.
     */
    public function unverified(): static
    {
        return $this->state(fn (array $attributes) => [
            'email_verified_at' => null,
        ]);
    }
}
